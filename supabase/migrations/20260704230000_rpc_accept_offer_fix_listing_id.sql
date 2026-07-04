-- Fix rpc_accept_offer: listing_id moved from chat_rooms → offers (Scheme B).
-- Remote DB may still run the 20260704150000 body that references r.listing_id.

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
    SELECT o.room_id, o.buyer_id, o.offer_price, o.listing_id
    INTO v_room_id, v_buyer_id, v_offer_price, v_listing_id
    FROM public.offers o
    INNER JOIN public.listings l ON l.id = o.listing_id
    WHERE o.id = p_offer_id
      AND o.status = 'pending'
      AND l.seller_id = p_seller_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '操作失敗：出價狀態不合法，或您非該商品的擁有者。';
    END IF;

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
        extended_count
    )
    VALUES (
        v_buyer_id,
        p_seller_id,
        v_listing_id,
        v_offer_price,
        'pending',
        (now() + INTERVAL '14 days'),
        0
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
