-- Atomic buyer offer: chat room upsert, offer insert, and linked chat message

CREATE OR REPLACE FUNCTION public.rpc_make_offer(
  p_listing_id UUID,
  p_buyer_id UUID,
  p_offer_price NUMERIC,
  p_content TEXT
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
  IF auth.uid() IS DISTINCT FROM p_buyer_id THEN
    RAISE EXCEPTION '請先登入後再出價';
  END IF;

  -- 1. 驗證商品狀態與貨權
  SELECT seller_id, status::text
  INTO v_seller_id, v_listing_status
  FROM public.listings
  WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到該卡牌商品，或該商品已下架。';
  END IF;

  IF v_listing_status <> 'active' THEN
    RAISE EXCEPTION '此商品目前處於非公開或已售出狀態，無法出價。';
  END IF;

  IF v_seller_id = p_buyer_id THEN
    RAISE EXCEPTION '保安攔截：您無法對自己上架的卡牌商品進行出價。';
  END IF;

  -- 2. 原子化：檢查或建立聊天室
  SELECT id
  INTO v_room_id
  FROM public.chat_rooms
  WHERE listing_id = p_listing_id
    AND buyer_id = p_buyer_id
    AND seller_id = v_seller_id;

  IF NOT FOUND THEN
    INSERT INTO public.chat_rooms (listing_id, buyer_id, seller_id)
    VALUES (p_listing_id, p_buyer_id, v_seller_id)
    RETURNING id INTO v_room_id;
  END IF;

  -- 3. 寫入出價紀錄
  INSERT INTO public.offers (room_id, buyer_id, offer_price, status)
  VALUES (v_room_id, p_buyer_id, p_offer_price, 'pending')
  RETURNING id INTO v_offer_id;

  -- 4. 寫入關聯 offer_id 嘅系統出價消息
  INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
  VALUES (v_room_id, p_buyer_id, p_content, v_offer_id, false)
  RETURNING id INTO v_message_id;

  -- 5. 撈出完整嘅 Row 資料封包回傳
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

REVOKE ALL ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT)
  TO authenticated, service_role;
