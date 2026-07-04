-- ========================================================
-- 核心原子化 RPC：處理賣家拒絕買家出價
-- ========================================================
CREATE OR REPLACE FUNCTION public.rpc_reject_offer(
    p_offer_id UUID,
    p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 提升權限執行安全校驗
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_buyer_id UUID;
    v_listing_id UUID;
    v_message_id UUID;
    v_offer_row RECORD;
BEGIN
    -- 1. 保安與狀態防禦線：驗證執行者必須是該 Listing 真正的賣家，且出價狀態必須是 pending
    SELECT o.room_id, o.buyer_id, o.listing_id INTO v_room_id, v_buyer_id, v_listing_id
    FROM public.offers o
    JOIN public.listings l ON o.listing_id = l.id
    WHERE o.id = p_offer_id AND l.seller_id = p_seller_id AND o.status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：出價狀態不合法，或您非該商品的擁有者。';
    END IF;

    -- 2. 狀態流轉：將該筆出價標記為 rejected (已拒絕)
    UPDATE public.offers 
    SET status = 'rejected',
        updated_at = now()
    WHERE id = p_offer_id;

    -- 3. 落地方案 A 事件驅動：在聊天室塞入一條新消息（帶有相同的 offer_id）
    -- 驅動雙方前端 Realtime 串流重新 Re-render，且未來可直通 OneSignal 射出 Push 告知買家
    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
    VALUES (v_room_id, p_seller_id, 'SYSTEM_OFFER_REJECTED', p_offer_id, false)
    RETURNING id INTO v_message_id;

    -- 4. 撈出更新後的完整 Offer 資料回傳
    SELECT * INTO v_offer_row FROM public.offers WHERE id = p_offer_id;

    RETURN jsonb_build_object(
        'offer', to_jsonb(v_offer_row),
        'message_id', v_message_id
    );
END;
$$;

-- ========================================================
-- 安全權限限縮
-- ========================================================
REVOKE ALL ON FUNCTION public.rpc_reject_offer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_reject_offer(UUID, UUID) TO authenticated, service_role;
