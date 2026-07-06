-- ========================================================
-- Member completed_trades_count: count buy + sell (C2C seller was missing)
-- Cancelled member_orders / refunded merchant_orders are excluded.
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_trigger_member_order_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        UPDATE public.profiles
        SET completed_trades_count = completed_trades_count + 1
        WHERE id IN (NEW.buyer_id, NEW.seller_id);

        PERFORM public.fn_recalculate_reputation_tags(NEW.buyer_id);
        PERFORM public.fn_recalculate_reputation_tags(NEW.seller_id);
        PERFORM public.fn_try_auto_grant_rewards(NEW.buyer_id);
        PERFORM public.fn_try_auto_grant_rewards(NEW.seller_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Reconcile profiles.completed_trades_count from source tables (excludes cancelled / refunded)
WITH completed_counts AS (
    SELECT
        p.id AS profile_id,
        (
            COALESCE(member_buy.cnt, 0)
            + COALESCE(member_sell.cnt, 0)
            + COALESCE(merchant_buy.cnt, 0)
        ) AS completed_count
    FROM public.profiles p
    LEFT JOIN (
        SELECT buyer_id, COUNT(*)::int AS cnt
        FROM public.member_orders
        WHERE status = 'completed'
        GROUP BY buyer_id
    ) member_buy ON member_buy.buyer_id = p.id
    LEFT JOIN (
        SELECT seller_id, COUNT(*)::int AS cnt
        FROM public.member_orders
        WHERE status = 'completed'
        GROUP BY seller_id
    ) member_sell ON member_sell.seller_id = p.id
    LEFT JOIN (
        SELECT buyer_id, COUNT(*)::int AS cnt
        FROM public.merchant_orders
        WHERE escrow_status = 'completed_and_transferred'
        GROUP BY buyer_id
    ) merchant_buy ON merchant_buy.buyer_id = p.id
),
updated AS (
    UPDATE public.profiles p
    SET
        completed_trades_count = c.completed_count,
        updated_at = NOW()
    FROM completed_counts c
    WHERE p.id = c.profile_id
      AND p.completed_trades_count IS DISTINCT FROM c.completed_count
    RETURNING p.id
)
SELECT public.fn_recalculate_reputation_tags(u.id)
FROM updated u;
