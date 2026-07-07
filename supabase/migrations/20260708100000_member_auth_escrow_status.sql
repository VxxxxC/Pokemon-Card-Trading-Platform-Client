-- Member C2C auth escrow: escrow_status state machine, logistics columns, RPCs

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'member_escrow_status' AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.member_escrow_status AS ENUM (
      'payment',
      'custody',
      'grading',
      'shipped',
      'released',
      'cancelled'
    );
  END IF;
END $$;

ALTER TABLE public.member_orders
  ADD COLUMN IF NOT EXISTS escrow_status public.member_escrow_status,
  ADD COLUMN IF NOT EXISTS inbound_tracking_no text,
  ADD COLUMN IF NOT EXISTS outbound_tracking_no text,
  ADD COLUMN IF NOT EXISTS logistics_proof_path text,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS platform_received_at timestamptz,
  ADD COLUMN IF NOT EXISTS auth_result text,
  ADD COLUMN IF NOT EXISTS mock_payment_session_id text;

CREATE INDEX IF NOT EXISTS idx_member_orders_escrow_status
  ON public.member_orders (escrow_status)
  WHERE escrow_status IS NOT NULL;

-- ---------------------------------------------------------------------------
-- rpc_accept_offer — auth orders start at payment escrow step
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- rpc_make_offer — listing auth policy + [AUTH_REQUEST] message prefix
-- ---------------------------------------------------------------------------
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
    SELECT seller_id, status, use_authentication
    INTO v_seller_id, v_listing_status, v_listing_accepts_auth
    FROM public.listings
    WHERE id = p_listing_id;

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

-- ---------------------------------------------------------------------------
-- Auth escrow RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_mock_pay_member_auth_order(
    p_order_id UUID,
    p_buyer_id UUID,
    p_mock_session_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated RECORD;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_buyer_id THEN
        RAISE EXCEPTION '請先登入後再操作';
    END IF;

    UPDATE public.member_orders
    SET
        escrow_status = 'custody',
        payment_confirmed_at = now(),
        mock_payment_session_id = COALESCE(p_mock_session_id, 'MOCK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8))),
        updated_at = now()
    WHERE id = p_order_id
      AND buyer_id = p_buyer_id
      AND use_authentication = true
      AND escrow_status = 'payment'
      AND status = 'pending'
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION '付款失敗：訂單狀態不合法或您非此筆交易的買家。';
    END IF;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_submit_inbound_tracking(
    p_order_id UUID,
    p_seller_id UUID,
    p_tracking_no TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated RECORD;
    v_tracking TEXT;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_seller_id THEN
        RAISE EXCEPTION '請先登入後再操作';
    END IF;

    v_tracking := NULLIF(trim(COALESCE(p_tracking_no, '')), '');
    IF v_tracking IS NULL THEN
        RAISE EXCEPTION '請輸入有效的順豐物流單號。';
    END IF;

    UPDATE public.member_orders
    SET
        inbound_tracking_no = v_tracking,
        updated_at = now()
    WHERE id = p_order_id
      AND seller_id = p_seller_id
      AND use_authentication = true
      AND escrow_status = 'custody'
      AND status = 'pending'
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION '上載失敗：訂單狀態不合法或您非此筆交易的賣家。';
    END IF;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_confirm_platform_received(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated RECORD;
BEGIN
    UPDATE public.member_orders
    SET
        escrow_status = 'grading',
        platform_received_at = now(),
        updated_at = now()
    WHERE id = p_order_id
      AND use_authentication = true
      AND escrow_status = 'custody'
      AND status = 'pending'
      AND inbound_tracking_no IS NOT NULL
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION '確認收貨失敗：訂單狀態不合法或尚未上載入庫物流單號。';
    END IF;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_complete_member_auth_grading(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated RECORD;
BEGIN
    UPDATE public.member_orders
    SET
        escrow_status = 'shipped',
        auth_result = 'passed',
        updated_at = now()
    WHERE id = p_order_id
      AND use_authentication = true
      AND escrow_status = 'grading'
      AND status = 'pending'
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION '鑑定通過失敗：訂單狀態不合法。';
    END IF;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_submit_outbound_tracking(
    p_order_id UUID,
    p_tracking_no TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_updated RECORD;
    v_tracking TEXT;
BEGIN
    v_tracking := NULLIF(trim(COALESCE(p_tracking_no, '')), '');
    IF v_tracking IS NULL THEN
        RAISE EXCEPTION '請輸入有效的物流單號。';
    END IF;

    UPDATE public.member_orders
    SET
        outbound_tracking_no = v_tracking,
        updated_at = now()
    WHERE id = p_order_id
      AND use_authentication = true
      AND escrow_status = 'shipped'
      AND status = 'pending'
    RETURNING * INTO v_updated;

    IF NOT FOUND THEN
        RAISE EXCEPTION '上載失敗：訂單狀態不合法。';
    END IF;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_confirm_buyer_received(
    p_order_id UUID,
    p_buyer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_listing_id UUID;
    v_updated RECORD;
BEGIN
    IF auth.uid() IS DISTINCT FROM p_buyer_id THEN
        RAISE EXCEPTION '請先登入後再操作';
    END IF;

    SELECT listing_id INTO v_listing_id
    FROM public.member_orders
    WHERE id = p_order_id
      AND buyer_id = p_buyer_id
      AND use_authentication = true
      AND escrow_status = 'shipped'
      AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION '確認收貨失敗：訂單狀態不合法或您非此筆交易的買家。';
    END IF;

    UPDATE public.member_orders
    SET
        escrow_status = 'released',
        status = 'completed',
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_updated;

    UPDATE public.listings SET status = 'sold' WHERE id = v_listing_id;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_fail_member_auth_order(
    p_order_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_listing_id UUID;
    v_updated RECORD;
BEGIN
    SELECT listing_id INTO v_listing_id
    FROM public.member_orders
    WHERE id = p_order_id
      AND use_authentication = true
      AND status = 'pending'
      AND escrow_status IS NOT NULL
      AND escrow_status NOT IN ('released', 'cancelled');

    IF NOT FOUND THEN
        RAISE EXCEPTION '鑑定失敗處理失敗：訂單狀態不合法。';
    END IF;

    UPDATE public.member_orders
    SET
        escrow_status = 'cancelled',
        status = 'cancelled',
        auth_result = 'failed',
        updated_at = now()
    WHERE id = p_order_id
    RETURNING * INTO v_updated;

    UPDATE public.listings SET status = 'active' WHERE id = v_listing_id;

    RETURN jsonb_build_object('order', to_jsonb(v_updated));
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_mock_pay_member_auth_order(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_mock_pay_member_auth_order(UUID, UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rpc_submit_inbound_tracking(UUID, UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_submit_inbound_tracking(UUID, UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rpc_confirm_platform_received(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_platform_received(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.rpc_complete_member_auth_grading(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_complete_member_auth_grading(UUID) TO service_role;

REVOKE ALL ON FUNCTION public.rpc_submit_outbound_tracking(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_submit_outbound_tracking(UUID, TEXT) TO service_role;

REVOKE ALL ON FUNCTION public.rpc_confirm_buyer_received(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_confirm_buyer_received(UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.rpc_fail_member_auth_order(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_fail_member_auth_order(UUID) TO service_role;
