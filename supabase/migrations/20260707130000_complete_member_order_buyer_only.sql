-- P2P complete: only the buyer may confirm handover (pending → completed)

CREATE OR REPLACE FUNCTION public.fn_enforce_member_order_transitions()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- A. 買家行為守則
    IF auth.uid() = OLD.buyer_id THEN
        IF NEW.status = 'completed'
           AND OLD.status = 'pending'
           AND NEW.expires_at = OLD.expires_at
           AND NEW.extended_count = OLD.extended_count THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION '保安攔截：買家操作不合法。';
        END IF;
    END IF;

    -- B. 賣家行為守則
    IF auth.uid() = OLD.seller_id THEN
        IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
            RETURN NEW;
        ELSIF NEW.extended_count = OLD.extended_count + 1
              AND NEW.expires_at > OLD.expires_at
              AND NEW.status = OLD.status THEN
            RETURN NEW;
        ELSE
            RAISE EXCEPTION '保安攔截：賣家操作不合法。';
        END IF;
    END IF;

    RAISE EXCEPTION '保安攔截：您不屬於此筆訂單的交易關係人。';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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
    v_room_id UUID;
    v_message_id UUID;
BEGIN
    SELECT buyer_id, seller_id, listing_id
    INTO v_buyer_id, v_seller_id, v_listing_id
    FROM public.member_orders
    WHERE id = p_order_id
      AND buyer_id = p_user_id
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：僅買家可確認完成交易，或訂單狀態不合法。';
    END IF;

    UPDATE public.member_orders SET status = 'completed' WHERE id = p_order_id;

    UPDATE public.listings SET status = 'sold' WHERE id = v_listing_id;

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
