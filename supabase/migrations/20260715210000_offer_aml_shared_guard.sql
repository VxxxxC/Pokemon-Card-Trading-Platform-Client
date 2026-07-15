-- Shared P2P AML guard for make / modify / accept offer paths.

CREATE OR REPLACE FUNCTION public.fn_assert_p2p_offer_aml_limits(
  p_buyer_id UUID,
  p_offer_price NUMERIC,
  p_listing_id UUID,
  p_use_authentication BOOLEAN
)
RETURNS void
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  v_buyer_created_at TIMESTAMPTZ;
  v_product_id TEXT;
  v_grading_company TEXT;
  v_grading_score TEXT;
  v_market_avg_price NUMERIC;
BEGIN
  IF COALESCE(p_use_authentication, false) THEN
    RETURN;
  END IF;

  IF p_offer_price IS NULL OR p_offer_price <= 0 THEN
    RAISE EXCEPTION '參數錯誤：出價金額必須大於 0。';
  END IF;

  SELECT created_at
  INTO v_buyer_created_at
  FROM public.profiles
  WHERE id = p_buyer_id;

  IF v_buyer_created_at IS NOT NULL
     AND v_buyer_created_at > (now() - INTERVAL '14 days')
     AND p_offer_price > 300 THEN
    RAISE EXCEPTION '新註冊帳號（14 天內）面交單筆上限為 HK$300，請降低出價或選用平台鑑定託管。';
  END IF;

  SELECT
    l.product_id,
    l.grading_company,
    l.grading_score
  INTO
    v_product_id,
    v_grading_company,
    v_grading_score
  FROM public.listings l
  WHERE l.id = p_listing_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION '找不到該卡牌商品。';
  END IF;

  SELECT pgmp.market_avg_price
  INTO v_market_avg_price
  FROM public.product_grading_market_prices pgmp
  WHERE pgmp.product_id = v_product_id
    AND upper(pgmp.grading_company) = upper(v_grading_company)
    AND pgmp.grading_score = COALESCE(v_grading_score, '')
  LIMIT 1;

  IF v_market_avg_price IS NULL AND p_offer_price > 800 THEN
    RAISE EXCEPTION '此卡牌無市場參考價，超過 HK$800 的面交出價必須啟用平台鑑定託管服務。';
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_assert_p2p_offer_aml_limits(UUID, NUMERIC, UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_assert_p2p_offer_aml_limits(UUID, NUMERIC, UUID, BOOLEAN) TO authenticated, service_role;

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
        l.use_authentication
    INTO
        v_seller_id,
        v_listing_status,
        v_listing_accepts_auth
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

    PERFORM public.fn_assert_p2p_offer_aml_limits(
        p_buyer_id,
        p_offer_price,
        p_listing_id,
        COALESCE(p_use_authentication, false)
    );

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

CREATE OR REPLACE FUNCTION public.rpc_modify_offer(
    p_offer_id UUID,
    p_buyer_id UUID,
    p_new_price NUMERIC,
    p_content TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_room_id UUID;
    v_listing_id UUID;
    v_use_authentication BOOLEAN;
    v_current_status TEXT;
    v_current_modified_count INT;
    v_message_id UUID;
    v_offer_row RECORD;
BEGIN
    IF auth.uid() <> p_buyer_id THEN
        RAISE EXCEPTION '保安攔截：無權修改此出價紀錄。';
    END IF;

    SELECT room_id, listing_id, use_authentication, status, modified_count
    INTO v_room_id, v_listing_id, v_use_authentication, v_current_status, v_current_modified_count
    FROM public.offers
    WHERE id = p_offer_id AND buyer_id = p_buyer_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：找不到對應的出價紀錄。';
    END IF;

    IF v_current_status <> 'pending' THEN
        RAISE EXCEPTION '操作失敗：該出價已被賣家處理或已中斷，無法修改價格。';
    END IF;

    IF v_current_modified_count >= 1 THEN
        RAISE EXCEPTION '限額攔截：每筆出價需求僅限修改一次價格。';
    END IF;

    PERFORM public.fn_assert_p2p_offer_aml_limits(
        p_buyer_id,
        p_new_price,
        v_listing_id,
        COALESCE(v_use_authentication, false)
    );

    UPDATE public.offers
    SET offer_price = p_new_price,
        modified_count = v_current_modified_count + 1,
        updated_at = now()
    WHERE id = p_offer_id;

    INSERT INTO public.chat_messages (room_id, sender_id, content, offer_id, is_system_warning)
    VALUES (v_room_id, p_buyer_id, p_content, p_offer_id, false)
    RETURNING id INTO v_message_id;

    SELECT * INTO v_offer_row FROM public.offers WHERE id = p_offer_id;

    RETURN jsonb_build_object(
        'offer', to_jsonb(v_offer_row),
        'message_id', v_message_id
    );
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
    v_use_auth BOOLEAN;
    v_order_id UUID;
    v_message_id UUID;
    v_generated_order_number TEXT;
    v_order_row RECORD;
    v_escrow_status public.member_escrow_status;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_seller_id THEN
        RAISE EXCEPTION '請先登入後再操作';
    END IF;

    SELECT o.room_id, o.buyer_id, o.offer_price, o.listing_id, o.use_authentication
    INTO v_room_id, v_buyer_id, v_offer_price, v_listing_id, v_use_auth
    FROM public.offers o
    INNER JOIN public.listings l ON l.id = o.listing_id
    WHERE o.id = p_offer_id
      AND o.status = 'pending'
      AND l.seller_id = p_seller_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：出價狀態不合法，或您非商品擁有者。';
    END IF;

    PERFORM public.fn_assert_p2p_offer_aml_limits(
        v_buyer_id,
        v_offer_price,
        v_listing_id,
        COALESCE(v_use_auth, false)
    );

    v_generated_order_number := 'ORD-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
    v_escrow_status := CASE WHEN v_use_auth THEN 'payment'::public.member_escrow_status ELSE NULL END;

    UPDATE public.offers
    SET status = 'accepted',
        updated_at = now()
    WHERE id = p_offer_id;

    UPDATE public.listings
    SET status = 'inactive'
    WHERE id = v_listing_id;

    INSERT INTO public.member_orders (
        buyer_id,
        seller_id,
        listing_id,
        final_price,
        status,
        expires_at,
        extended_count,
        order_number,
        use_authentication,
        escrow_status
    )
    VALUES (
        v_buyer_id,
        p_seller_id,
        v_listing_id,
        v_offer_price,
        'pending',
        (now() + INTERVAL '14 days'),
        0,
        v_generated_order_number,
        v_use_auth,
        v_escrow_status
    )
    RETURNING id INTO v_order_id;

    INSERT INTO public.chat_messages (
        room_id,
        sender_id,
        content,
        offer_id,
        member_order_id,
        is_system_warning
    )
    VALUES (
        v_room_id,
        p_seller_id,
        'SYSTEM_OFFER_ACCEPTED',
        p_offer_id,
        v_order_id,
        false
    )
    RETURNING id INTO v_message_id;

    SELECT * INTO v_order_row FROM public.member_orders WHERE id = v_order_id;

    RETURN jsonb_build_object(
        'order', to_jsonb(v_order_row),
        'message_id', v_message_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_make_offer(UUID, UUID, NUMERIC, TEXT, BOOLEAN) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rpc_modify_offer(UUID, UUID, NUMERIC, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_modify_offer(UUID, UUID, NUMERIC, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rpc_accept_offer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_accept_offer(UUID, UUID) TO authenticated, service_role;
