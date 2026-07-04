-- Member / merchant order numbers + rpc_accept_offer auto-generates ORD-2026-* on accept.

-- ========================================================
-- 1. 結構擴充：為 Member 與 Merchant 訂單表引進單號欄位
-- ========================================================
ALTER TABLE public.member_orders
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

ALTER TABLE public.merchant_orders
ADD COLUMN IF NOT EXISTS order_number TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_member_orders_number ON public.member_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_merchant_orders_number ON public.merchant_orders(order_number);

-- Participants may read their own orders (any status); complements completed-read policy.
DROP POLICY IF EXISTS "member_orders_participant_read" ON public.member_orders;

CREATE POLICY "member_orders_participant_read"
  ON public.member_orders
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid());

-- ========================================================
-- 2. 升級原子化 RPC：成單時全自動鎖死並注入隨機加密高級單號
-- ========================================================
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
    v_generated_order_number TEXT;
    v_order_row RECORD;
BEGIN
    SELECT o.room_id, o.buyer_id, o.offer_price, o.listing_id
    INTO v_room_id, v_buyer_id, v_offer_price, v_listing_id
    FROM public.offers o
    INNER JOIN public.listings l ON l.id = o.listing_id
    WHERE o.id = p_offer_id
      AND o.status = 'pending'
      AND l.seller_id = p_seller_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：出價狀態不合法，或您非商品擁有者。';
    END IF;

    v_generated_order_number := 'ORD-2026-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));

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
        order_number
    )
    VALUES (
        v_buyer_id,
        p_seller_id,
        v_listing_id,
        v_offer_price,
        'pending',
        (now() + INTERVAL '14 days'),
        0,
        v_generated_order_number
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

REVOKE ALL ON FUNCTION public.rpc_accept_offer(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_accept_offer(UUID, UUID) TO authenticated, service_role;
