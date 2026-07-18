-- Buyer confirms receipt for merchant_orders (B2C escrow mock path).

CREATE OR REPLACE FUNCTION public.rpc_complete_merchant_order(
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
  v_merchant_id UUID;
  v_listing_id UUID;
  v_escrow_status public.escrow_state;
  v_room_id UUID;
  v_message_id UUID;
BEGIN
  SELECT buyer_id, merchant_id, listing_id, escrow_status
  INTO v_buyer_id, v_merchant_id, v_listing_id, v_escrow_status
  FROM public.merchant_orders
  WHERE id = p_order_id
    AND buyer_id = p_user_id
    AND escrow_status IN (
      'payment_held'::public.escrow_state,
      'authenticating'::public.escrow_state,
      'authenticated'::public.escrow_state
    );

  IF NOT FOUND THEN
    RAISE EXCEPTION '操作失敗：僅買家可確認完成交易，或訂單狀態不合法。';
  END IF;

  UPDATE public.merchant_orders
  SET
    escrow_status = 'completed_and_transferred'::public.escrow_state,
    updated_at = now()
  WHERE id = p_order_id;

  UPDATE public.listings
  SET status = 'sold'
  WHERE id = v_listing_id;

  SELECT cr.id
  INTO v_room_id
  FROM public.chat_rooms cr
  WHERE cr.buyer_id = v_buyer_id
    AND cr.seller_id = v_merchant_id
    AND cr.buyer_persona = 'member'::public.seller_persona_type
    AND cr.seller_persona = 'merchant'::public.seller_persona_type
  ORDER BY cr.updated_at DESC NULLS LAST
  LIMIT 1;

  IF v_room_id IS NULL THEN
    SELECT cr.id
    INTO v_room_id
    FROM public.chat_rooms cr
    WHERE cr.buyer_id = v_buyer_id
      AND cr.seller_id = v_merchant_id
    ORDER BY cr.updated_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF FOUND THEN
    INSERT INTO public.chat_messages (
      room_id,
      sender_id,
      content,
      merchant_order_id,
      is_system_warning
    )
    VALUES (
      v_room_id,
      p_user_id,
      'SYSTEM_ORDER_COMPLETED',
      p_order_id,
      false
    )
    RETURNING id INTO v_message_id;
  END IF;

  RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_complete_merchant_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_complete_merchant_order(UUID, UUID) TO authenticated, service_role;
