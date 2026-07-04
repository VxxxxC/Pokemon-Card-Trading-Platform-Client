-- Atomic seller accept-offer: hold listing, create member order, system chat message

CREATE OR REPLACE FUNCTION public.rpc_accept_offer(
  p_offer_id UUID,
  p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id UUID;
  v_listing_id UUID;
  v_buyer_id UUID;
  v_offer_price NUMERIC;
  v_order_id UUID;
  v_message_id UUID;
  v_order_row RECORD;
BEGIN
  IF auth.uid() IS DISTINCT FROM p_seller_id THEN
    RAISE EXCEPTION '請先登入後再操作';
  END IF;

  -- 1. 安全與狀態校驗
  SELECT o.room_id, o.buyer_id, o.offer_price, r.listing_id
  INTO v_room_id, v_buyer_id, v_offer_price, v_listing_id
  FROM public.offers o
  INNER JOIN public.chat_rooms r ON o.room_id = r.id
  INNER JOIN public.listings l ON l.id = r.listing_id
  WHERE o.id = p_offer_id
    AND o.status = 'pending'
    AND r.seller_id = p_seller_id
    AND l.seller_id = p_seller_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '操作失敗：出價狀態不合法，或您非該商品的擁有者。';
  END IF;

  -- 2. 更新出價狀態
  UPDATE public.offers
  SET status = 'accepted'
  WHERE id = p_offer_id;

  -- 3. Hold 貨：將商品於大盤下架
  UPDATE public.listings
  SET status = 'inactive'
  WHERE id = v_listing_id;

  -- 4. 建立 P2P 訂單 (預設 14 天生命週期 TTL)
  INSERT INTO public.member_orders (
    buyer_id,
    seller_id,
    listing_id,
    final_price,
    status,
    expires_at,
    extended_count
  )
  VALUES (
    v_buyer_id,
    p_seller_id,
    v_listing_id,
    v_offer_price,
    'pending',
    (now() + INTERVAL '14 days'),
    0
  )
  RETURNING id INTO v_order_id;

  -- 5. 落地方案 A：系統訊息同時綁定 offer_id 與 member_order_id
  INSERT INTO public.chat_messages (
    room_id,
    sender_id,
    content,
    offer_id,
    member_order_id,
    is_system_warning
  )
  VALUES (
    v_room_id,
    p_seller_id,
    'SYSTEM_OFFER_ACCEPTED',
    p_offer_id,
    v_order_id,
    false
  )
  RETURNING id INTO v_message_id;

  SELECT * INTO v_order_row FROM public.member_orders WHERE id = v_order_id;

  RETURN jsonb_build_object(
    'order', to_jsonb(v_order_row),
    'message_id', v_message_id
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_accept_offer(UUID, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_accept_offer(UUID, UUID)
  TO authenticated, service_role;
