-- Scheme B: User-centric chat rooms — listing_id lives on offers, not chat_rooms

-- B. 將 listing_id 正式搬入 offers 表，確保每個 Offer 自己知道對應邊張卡
ALTER TABLE public.offers
ADD COLUMN IF NOT EXISTS listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE;

-- 回填既有資料（須在移除 chat_rooms.listing_id 之前執行）
UPDATE public.offers o
SET listing_id = r.listing_id
FROM public.chat_rooms r
WHERE o.room_id = r.id
  AND o.listing_id IS NULL
  AND r.listing_id IS NOT NULL;

-- A. 解除舊外鍵與欄位約束
ALTER TABLE public.chat_rooms DROP COLUMN IF EXISTS listing_id;

-- 建立索引優化效能
CREATE INDEX IF NOT EXISTS idx_offers_listing_id ON public.offers(listing_id);

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
    SELECT seller_id, status INTO v_seller_id, v_listing_status FROM public.listings WHERE id = p_listing_id;
    IF NOT FOUND THEN RAISE EXCEPTION '找不到該卡牌商品。'; END IF;
    IF v_listing_status <> 'active' THEN RAISE EXCEPTION '商品非 active 狀態，無法出價。'; END IF;
    IF v_seller_id = p_buyer_id THEN RAISE EXCEPTION '您無法對自己的商品出價。'; END IF;

    -- 【關鍵修正】：純粹以買賣雙方身分查找或建立唯一聊天室 (User-Centric)
    SELECT id INTO v_room_id FROM public.chat_rooms
    WHERE buyer_id = p_buyer_id AND seller_id = v_seller_id;

    IF NOT FOUND THEN
        INSERT INTO public.chat_rooms (buyer_id, seller_id) VALUES (p_buyer_id, v_seller_id)
        RETURNING id INTO v_room_id;
    END IF;

    -- 【關鍵修正】：將 listing_id 寫入 offers 表
    INSERT INTO public.offers (room_id, buyer_id, listing_id, offer_price, status)
    VALUES (v_room_id, p_buyer_id, p_listing_id, p_offer_price, 'pending')
    RETURNING id INTO v_offer_id;

    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
    VALUES (v_room_id, p_buyer_id, p_content, v_offer_id, false)
    RETURNING id INTO v_message_id;

    SELECT * INTO v_room_row FROM public.chat_rooms WHERE id = v_room_id;
    SELECT * INTO v_offer_row FROM public.offers WHERE id = v_offer_id;
    SELECT * INTO v_message_row FROM public.chat_messages WHERE id = v_message_id;

    RETURN jsonb_build_object('room', to_jsonb(v_room_row), 'offer', to_jsonb(v_offer_row), 'message', to_jsonb(v_message_row));
END;
$$;

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
    -- 【關鍵修正】：直接由 offers 表內提取關聯的 listing_id
    SELECT o.room_id, o.buyer_id, o.offer_price, o.listing_id INTO v_room_id, v_buyer_id, v_offer_price, v_listing_id
    FROM public.offers o
    JOIN public.chat_rooms r ON o.room_id = r.id
    WHERE o.id = p_offer_id AND r.seller_id = p_seller_id AND o.status = 'pending';

    IF NOT FOUND THEN RAISE EXCEPTION '操作失敗：出價狀態不合法，或您非商品擁有者。'; END IF;

    UPDATE public.offers SET status = 'accepted' WHERE id = p_offer_id;
    UPDATE public.listings SET status = 'inactive' WHERE id = v_listing_id;

    INSERT INTO public.member_orders (buyer_id, seller_id, listing_id, final_price, status, expires_at, extended_count)
    VALUES (v_buyer_id, p_seller_id, v_listing_id, v_offer_price, 'pending', (now() + INTERVAL '14 days'), 0)
    RETURNING id INTO v_order_id;

    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, member_order_id, is_system_warning)
    VALUES (v_room_id, p_seller_id, 'SYSTEM_OFFER_ACCEPTED', p_offer_id, v_order_id, false)
    RETURNING id INTO v_message_id;

    SELECT * INTO v_order_row FROM public.member_orders WHERE id = v_order_id;
    RETURN jsonb_build_object('order', to_jsonb(v_order_row), 'message_id', v_message_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rpc_accept_offer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_accept_offer(UUID, UUID) TO authenticated, service_role;
