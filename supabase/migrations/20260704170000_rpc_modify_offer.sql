-- ========================================================
-- 1. 結構擴充：為出價表新增修改計數器（預設為 0，上限為 1）
-- ========================================================
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS modified_count INT DEFAULT 0 NOT NULL;


-- ========================================================
-- 2. 核心原子化 RPC：處理買家修改出價需求
-- ========================================================
CREATE OR REPLACE FUNCTION public.rpc_modify_offer(
    p_offer_id UUID,
    p_buyer_id UUID,
    p_new_price NUMERIC,
    p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- 提升權限執行安全校驗
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_current_status TEXT;
    v_current_modified_count INT;
    v_message_id UUID;
    v_offer_row RECORD;
BEGIN
    -- 1. 保安防禦線：驗證執行者必須是當前登入的買家本人
    IF auth.uid() <> p_buyer_id THEN
        RAISE EXCEPTION '保安攔截：無權修改此出價紀錄。';
    END IF;

    -- 2. 狀態校驗：查詢該出價目前的狀態與已修改次數
    SELECT room_id, status, modified_count
    INTO v_room_id, v_current_status, v_current_modified_count
    FROM public.offers
    WHERE id = p_offer_id AND buyer_id = p_buyer_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：找不到對應的出價紀錄。';
    END IF;

    -- 3. 業務防禦線：只有 pending 狀態才能改，且一生只能改一次
    IF v_current_status <> 'pending' THEN
        RAISE EXCEPTION '操作失敗：該出價已被賣家處理或已中斷，無法修改價格。';
    END IF;

    IF v_current_modified_count >= 1 THEN
        RAISE EXCEPTION '限額攔截：每筆出價需求僅限修改一次價格。';
    END IF;

    IF p_new_price <= 0 THEN
        RAISE EXCEPTION '參數錯誤：出價金額必須大於 0。';
    END IF;

    -- 4. 執行更新：覆蓋新價格，並將計數器加 1
    UPDATE public.offers
    SET offer_price = p_new_price,
        modified_count = v_current_modified_count + 1,
        updated_at = now()
    WHERE id = p_offer_id;

    -- 5. 落地方案 A 事件驅動：在聊天室塞入一條新消息（帶有相同的 offer_id）
    -- 這樣做能直接觸發買賣雙方前端 Realtime 串流刷新，且未來可直通 OneSignal 推送
    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
    VALUES (v_room_id, p_buyer_id, p_content, p_offer_id, false)
    RETURNING id INTO v_message_id;

    -- 6. 撈出更新後的完整 Offer 資料回傳
    SELECT * INTO v_offer_row FROM public.offers WHERE id = p_offer_id;

    RETURN jsonb_build_object(
        'offer', to_jsonb(v_offer_row),
        'message_id', v_message_id
    );
END;
$$;


-- ========================================================
-- 3. 安全權限限縮
-- ========================================================
REVOKE ALL ON FUNCTION public.rpc_modify_offer(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_modify_offer(UUID, UUID, NUMERIC, TEXT) TO authenticated, service_role;
