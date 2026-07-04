-- ========================================================
-- 1. 升級 BEFORE UPDATE 狀態機防禦線 (Trigger Guard)
--    解鎖權限：允許【賣家】也能將 pending 訂單變更為 completed 狀態
-- ========================================================
CREATE OR REPLACE FUNCTION public.fn_enforce_member_order_transitions()
RETURNS TRIGGER AS $$
BEGIN
    IF auth.role() = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- A. 買家行為守則
    IF auth.uid() = OLD.buyer_id THEN
        -- 買家可以將 pending 訂單確認為 completed
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
        -- 情況 1：賣家主動中斷交易 (將 pending 改為 cancelled)
        IF NEW.status = 'cancelled' AND OLD.status = 'pending' THEN
            RETURN NEW;
            
        -- 情況 2：【全新解鎖】賣家當面點清錢貨，主動確認完成 (將 pending 改為 completed)
        ELSIF NEW.status = 'completed' AND OLD.status = 'pending' 
              AND NEW.expires_at = OLD.expires_at 
              AND NEW.extended_count = OLD.extended_count THEN
            RETURN NEW;
            
        -- 情況 3：賣家延長交收期限
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


-- ========================================================
-- 2. 全新原子化 RPC：賣家主動取消訂單（釋放貨權 + 塞入聊天訊息）
-- ========================================================
CREATE OR REPLACE FUNCTION public.rpc_cancel_member_order(
    p_order_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_listing_id UUID;
    v_room_id UUID;
    v_message_id UUID;
BEGIN
    -- 安全防禦：驗證必須是該單真正的賣家，且訂單必須處於 pending
    SELECT listing_id INTO v_listing_id
    FROM public.member_orders
    WHERE id = p_order_id AND seller_id = p_user_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION '取消失敗：訂單狀態不合法，或您非此筆交易的賣家。';
    END IF;

    -- 1. 將訂單變更為已取消
    UPDATE public.member_orders SET status = 'cancelled' WHERE id = p_order_id;

    -- 2. 🌟 強大防禦：將該張卡牌商品（Listing）重新變回 'active'，大盤滿血復活重上架！
    UPDATE public.listings SET status = 'active' WHERE id = v_listing_id;

    -- 3. 反向定位 P2P 聊天室，塞入取消系統訊息，驅動前端秒級畫面更新
    SELECT id INTO v_room_id FROM public.chat_rooms 
    WHERE buyer_id = (SELECT buyer_id FROM public.member_orders WHERE id = p_order_id)
      AND seller_id = p_user_id;

    IF FOUND THEN
        INSERT INTO public.chat_messages (room_id, sender_id, content, member_order_id, is_system_warning)
        VALUES (v_room_id, p_user_id, 'SYSTEM_ORDER_CANCELLED', p_order_id, true)
        RETURNING id INTO v_message_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;


-- ========================================================
-- 3. 全新原子化 RPC：雙方任意一人確認完成交易（成單 + 解鎖雙盲）
-- ========================================================
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
    v_room_id UUID;
    v_message_id UUID;
BEGIN
    -- 安全防禦：驗證執行者必須是買家或賣家其中一人，且訂單處於 pending
    SELECT buyer_id, seller_id INTO v_buyer_id, v_seller_id
    FROM public.member_orders
    WHERE id = p_order_id AND (buyer_id = p_user_id OR seller_id = p_user_id) AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：此訂單已結案，或您非該筆交易的關係人。';
    END IF;

    -- 1. 將訂單變更為已完成（此處會自動觸發我們之前寫好的信用統計 Trigger）
    UPDATE public.member_orders SET status = 'completed' WHERE id = p_order_id;

    -- 2. 定位聊天室並塞入 SYSTEM_ORDER_COMPLETED 系統消息
    SELECT id INTO v_room_id FROM public.chat_rooms WHERE buyer_id = v_buyer_id AND seller_id = v_seller_id;
    
    IF FOUND THEN
        INSERT INTO public.chat_messages (room_id, sender_id, content, member_order_id, is_system_warning)
        VALUES (v_room_id, p_user_id, 'SYSTEM_ORDER_COMPLETED', p_order_id, false)
        RETURNING id INTO v_message_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;

-- 權限限縮
REVOKE ALL ON FUNCTION public.rpc_cancel_member_order(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_complete_member_order(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_cancel_member_order(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_complete_member_order(UUID, UUID) TO authenticated, service_role;
