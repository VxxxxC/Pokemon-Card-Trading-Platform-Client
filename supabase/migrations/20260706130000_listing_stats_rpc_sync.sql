-- rpc_make_offer: increment cumulative offers_count on new offer INSERT

CREATE OR REPLACE FUNCTION public.fn_bump_listing_offers_count(p_listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.listing_stats
  SET
    offers_count = offers_count + 1,
    updated_at = now()
  WHERE listing_id = p_listing_id;

  IF NOT FOUND THEN
    INSERT INTO public.listing_stats (listing_id, views, offers_count)
    VALUES (p_listing_id, 0, 1)
    ON CONFLICT (listing_id) DO UPDATE
    SET
      offers_count = public.listing_stats.offers_count + 1,
      updated_at = now();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_make_offer(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_offer_price NUMERIC,
  p_content TEXT,
  p_use_authentication BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_seller_id UUID;
  v_listing_status TEXT;
  v_room_id UUID;
  v_offer_id UUID;
  v_message_id UUID;
  v_room_row RECORD;
  v_offer_row RECORD;
  v_message_row RECORD;
BEGIN
  SELECT seller_id, status
  INTO v_seller_id, v_listing_status
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到該卡牌商品。';
  END IF;

  IF v_listing_status <> 'active' THEN
    RAISE EXCEPTION '商品非 active 狀態，無法出價。';
  END IF;

  IF v_seller_id = p_buyer_id THEN
    RAISE EXCEPTION '您無法對自己的商品出價。';
  END IF;

  SELECT id
  INTO v_room_id
  FROM public.chat_rooms
  WHERE buyer_id = p_buyer_id
    AND seller_id = v_seller_id;

  IF NOT FOUND THEN
    INSERT INTO public.chat_rooms (buyer_id, seller_id)
    VALUES (p_buyer_id, v_seller_id)
    RETURNING id INTO v_room_id;
  END IF;

  INSERT INTO public.offers (
    room_id,
    buyer_id,
    listing_id,
    offer_price,
    status,
    use_authentication
  )
  VALUES (
    v_room_id,
    p_buyer_id,
    p_listing_id,
    p_offer_price,
    'pending',
    COALESCE(p_use_authentication, false)
  )
  RETURNING id INTO v_offer_id;

  PERFORM public.fn_bump_listing_offers_count(p_listing_id);

  INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
  VALUES (v_room_id, p_buyer_id, p_content, v_offer_id, false)
  RETURNING id INTO v_message_id;

  SELECT * INTO v_room_row FROM public.chat_rooms WHERE id = v_room_id;
  SELECT * INTO v_offer_row FROM public.offers WHERE id = v_offer_id;
  SELECT * INTO v_message_row FROM public.chat_messages WHERE id = v_message_id;

  RETURN jsonb_build_object(
    'room', to_jsonb(v_room_row),
    'offer', to_jsonb(v_offer_row),
    'message', to_jsonb(v_message_row)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_bump_listing_offers_count(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_bump_listing_offers_count(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT, BOOLEAN)
  TO authenticated, service_role;
