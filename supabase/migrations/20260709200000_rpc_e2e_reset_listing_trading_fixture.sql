-- E2E only: reset offers + pending member_orders for a fixture listing/buyer pair.
-- Callable by service_role from Playwright helpers between trading specs.

CREATE OR REPLACE FUNCTION public.rpc_e2e_reset_listing_trading_fixture(
    p_listing_id UUID,
    p_buyer_id UUID,
    p_seller_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_cancelled_orders INTEGER := 0;
    v_cancelled_offers INTEGER := 0;
BEGIN
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'E2E fixture reset requires service_role';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.listings
        WHERE id = p_listing_id
          AND seller_id = p_seller_id
    ) THEN
        RAISE EXCEPTION 'E2E fixture reset: listing/seller mismatch';
    END IF;

    UPDATE public.member_orders
    SET
        status = 'cancelled',
        escrow_status = CASE
            WHEN use_authentication AND escrow_status IS NOT NULL
                THEN 'cancelled'::public.member_escrow_status
            ELSE escrow_status
        END,
        updated_at = now()
    WHERE listing_id = p_listing_id
      AND buyer_id = p_buyer_id
      AND status = 'pending';

    GET DIAGNOSTICS v_cancelled_orders = ROW_COUNT;

    UPDATE public.offers
    SET
        status = 'cancelled',
        updated_at = now()
    WHERE listing_id = p_listing_id
      AND buyer_id = p_buyer_id
      AND COALESCE(status, 'pending') NOT IN ('rejected', 'cancelled');

    GET DIAGNOSTICS v_cancelled_offers = ROW_COUNT;

    UPDATE public.listings
    SET status = 'active'
    WHERE id = p_listing_id;

    RETURN jsonb_build_object(
        'cancelled_orders', v_cancelled_orders,
        'cancelled_offers', v_cancelled_offers,
        'listing_id', p_listing_id
    );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_e2e_reset_listing_trading_fixture(UUID, UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_e2e_reset_listing_trading_fixture(UUID, UUID, UUID) TO service_role;
