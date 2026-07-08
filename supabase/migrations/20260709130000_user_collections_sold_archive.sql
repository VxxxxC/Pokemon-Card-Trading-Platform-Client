-- Collection × listing × sale sync: sold archive + source_collection_id link

ALTER TABLE public.user_collections
  ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS sold_listing_id UUID NULL
    REFERENCES public.listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sold_price NUMERIC(12, 2) NULL;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS source_collection_id UUID NULL
    REFERENCES public.user_collections(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_user_collections_sold_at
  ON public.user_collections (user_id, sold_at);

CREATE INDEX IF NOT EXISTS idx_listings_source_collection_id
  ON public.listings (source_collection_id)
  WHERE source_collection_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.fn_archive_seller_collection_for_listing(
  p_listing_id UUID,
  p_seller_id UUID,
  p_final_price NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_id UUID;
  v_grading_company TEXT;
  v_grading_score TEXT;
  v_source_collection_id UUID;
  v_target_id UUID;
BEGIN
  SELECT
    l.product_id,
    l.grading_company,
    l.grading_score,
    l.source_collection_id
  INTO
    v_product_id,
    v_grading_company,
    v_grading_score,
    v_source_collection_id
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF v_source_collection_id IS NOT NULL THEN
    SELECT uc.id
    INTO v_target_id
    FROM public.user_collections uc
    WHERE uc.id = v_source_collection_id
      AND uc.user_id = p_seller_id
      AND uc.sold_at IS NULL;

    IF FOUND THEN
      UPDATE public.user_collections
      SET
        sold_at = now(),
        sold_listing_id = p_listing_id,
        sold_price = p_final_price,
        updated_at = now()
      WHERE id = v_target_id;
      RETURN;
    END IF;
  END IF;

  SELECT uc.id
  INTO v_target_id
  FROM public.user_collections uc
  WHERE uc.user_id = p_seller_id
    AND uc.product_id = v_product_id
    AND uc.grading_company = v_grading_company
    AND uc.grading_score = COALESCE(v_grading_score, '')
    AND uc.sold_at IS NULL
  ORDER BY uc.created_at ASC
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  UPDATE public.user_collections
  SET
    sold_at = now(),
    sold_listing_id = p_listing_id,
    sold_price = p_final_price,
    updated_at = now()
  WHERE id = v_target_id;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_archive_seller_collection_for_listing(UUID, UUID, NUMERIC) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_archive_seller_collection_for_listing(UUID, UUID, NUMERIC) TO service_role;

CREATE OR REPLACE FUNCTION public.rpc_complete_member_order(
  p_order_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_buyer_id UUID;
  v_seller_id UUID;
  v_listing_id UUID;
  v_final_price NUMERIC;
  v_room_id UUID;
  v_message_id UUID;
BEGIN
  SELECT buyer_id, seller_id, listing_id, final_price
  INTO v_buyer_id, v_seller_id, v_listing_id, v_final_price
  FROM public.member_orders
  WHERE id = p_order_id
    AND buyer_id = p_user_id
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION '操作失敗：僅買家可確認完成交易，或訂單狀態不合法。';
  END IF;

  UPDATE public.member_orders SET status = 'completed' WHERE id = p_order_id;

  UPDATE public.listings SET status = 'sold' WHERE id = v_listing_id;

  PERFORM public.fn_archive_seller_collection_for_listing(
    v_listing_id,
    v_seller_id,
    v_final_price
  );

  SELECT id INTO v_room_id
  FROM public.chat_rooms
  WHERE buyer_id = v_buyer_id AND seller_id = v_seller_id;

  IF FOUND THEN
    INSERT INTO public.chat_messages (room_id, sender_id, content, member_order_id, is_system_warning)
    VALUES (v_room_id, p_user_id, 'SYSTEM_ORDER_COMPLETED', p_order_id, false)
    RETURNING id INTO v_message_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_complete_member_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_complete_member_order(UUID, UUID) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rpc_confirm_buyer_received(
  p_order_id UUID,
  p_buyer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_listing_id UUID;
  v_seller_id UUID;
  v_final_price NUMERIC;
  v_updated RECORD;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_buyer_id THEN
    RAISE EXCEPTION '請先登入後再操作';
  END IF;

  SELECT listing_id, seller_id, final_price
  INTO v_listing_id, v_seller_id, v_final_price
  FROM public.member_orders
  WHERE id = p_order_id
    AND buyer_id = p_buyer_id
    AND use_authentication = true
    AND escrow_status = 'shipped'
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION '確認收貨失敗：訂單狀態不合法或您非此筆交易的買家。';
  END IF;

  UPDATE public.member_orders
  SET
    escrow_status = 'released',
    status = 'completed',
    updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_updated;

  UPDATE public.listings SET status = 'sold' WHERE id = v_listing_id;

  PERFORM public.fn_archive_seller_collection_for_listing(
    v_listing_id,
    v_seller_id,
    v_final_price
  );

  RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;
