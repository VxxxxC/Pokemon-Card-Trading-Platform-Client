-- P2P meetup: allow buyer OR seller to confirm handover completion.

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
    AND (buyer_id = p_user_id OR seller_id = p_user_id)
    AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION '操作失敗：買家或賣家均可確認完成交易，或訂單狀態不合法。';
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
