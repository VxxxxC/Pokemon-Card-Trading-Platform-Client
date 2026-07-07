-- AML guards on P2P offers (non-auth path)

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
    v_listing_accepts_auth BOOLEAN;
    v_product_id TEXT;
    v_grading_company TEXT;
    v_grading_score TEXT;
    v_buyer_created_at TIMESTAMPTZ;
    v_market_avg_price NUMERIC;
    v_room_id UUID;
    v_offer_id UUID;
    v_message_id UUID;
    v_message_content TEXT;
    v_room_row RECORD;
    v_offer_row RECORD;
    v_message_row RECORD;
BEGIN
    SELECT
        l.seller_id,
        l.status,
        l.use_authentication,
        l.product_id,
        l.grading_company,
        l.grading_score
    INTO
        v_seller_id,
        v_listing_status,
        v_listing_accepts_auth,
        v_product_id,
        v_grading_company,
        v_grading_score
    FROM public.listings l
    WHERE l.id = p_listing_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到該卡牌商品。';
    END IF;

    IF v_listing_status <> 'active' THEN
        RAISE EXCEPTION '商品非 active 狀態，無法出價。';
    END IF;

    IF v_seller_id = p_buyer_id THEN
        RAISE EXCEPTION '您無法對自己的商品出價。';
    END IF;

    IF COALESCE(p_use_authentication, false) AND NOT COALESCE(v_listing_accepts_auth, false) THEN
        RAISE EXCEPTION '此賣家不接受平台鑑定加購服務，請關閉鑑定選項後再出價。';
    END IF;

    IF NOT COALESCE(p_use_authentication, false) THEN
        SELECT created_at INTO v_buyer_created_at
        FROM public.profiles
        WHERE id = p_buyer_id;

        IF v_buyer_created_at IS NOT NULL
           AND v_buyer_created_at > (now() - INTERVAL '14 days')
           AND p_offer_price > 300 THEN
            RAISE EXCEPTION '新註冊帳號（14 天內）面交單筆上限為 HK$300，請降低出價或選用平台鑑定託管。';
        END IF;

        SELECT pgmp.market_avg_price INTO v_market_avg_price
        FROM public.product_grading_market_prices pgmp
        WHERE pgmp.product_id = v_product_id
          AND upper(pgmp.grading_company) = upper(v_grading_company)
          AND pgmp.grading_score = COALESCE(v_grading_score, '')
        LIMIT 1;

        IF v_market_avg_price IS NULL AND p_offer_price > 800 THEN
            RAISE EXCEPTION '此卡牌無市場參考價，超過 HK$800 的面交出價必須啟用平台鑑定託管服務。';
        END IF;
    END IF;

    v_message_content := p_content;
    IF COALESCE(p_use_authentication, false) THEN
        v_message_content := '[AUTH_REQUEST] ' || v_message_content;
    END IF;

    INSERT INTO public.chat_rooms (buyer_id, seller_id, updated_at)
    VALUES (p_buyer_id, v_seller_id, now())
    ON CONFLICT (buyer_id, seller_id) DO UPDATE
      SET updated_at = EXCLUDED.updated_at
    RETURNING id INTO v_room_id;

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

    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
    VALUES (v_room_id, p_buyer_id, v_message_content, v_offer_id, false)
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
