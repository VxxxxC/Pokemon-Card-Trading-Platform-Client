-- ========================================================
-- Merchant shop cancelled trade counter (symmetric with completed_trades_count)
-- B2C refunds → buyer profiles.cancelled_trades_count, seller merchant_shops.cancelled_trades_count
-- P2C cancels → both parties profiles.cancelled_trades_count (unchanged)
-- ========================================================

ALTER TABLE public.merchant_shops
ADD COLUMN IF NOT EXISTS cancelled_trades_count INT DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_merchant_shops_trade_stats
ON public.merchant_shops (merchant_id, completed_trades_count, cancelled_trades_count, rating_score);

CREATE OR REPLACE FUNCTION public.fn_aggregate_user_reputation_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_new_status TEXT;
    v_old_status TEXT;
BEGIN
    v_buyer_id := COALESCE(NEW.buyer_id, OLD.buyer_id);

    IF TG_TABLE_NAME = 'merchant_orders' THEN
        v_seller_id := COALESCE(NEW.merchant_id, OLD.merchant_id);
        v_new_status := NEW.escrow_status::TEXT;
        v_old_status := OLD.escrow_status::TEXT;
    ELSE
        v_seller_id := COALESCE(NEW.seller_id, OLD.seller_id);
        v_new_status := NEW.status::TEXT;
        v_old_status := OLD.status::TEXT;
    END IF;

    -- Cancelled / refunded only; completion handled by fn_trigger_*_order_complete
    IF TG_TABLE_NAME = 'merchant_orders'
       AND v_new_status = 'refunded'
       AND (v_old_status IS NULL OR v_old_status <> 'refunded') THEN
        UPDATE public.profiles
        SET cancelled_trades_count = cancelled_trades_count + 1
        WHERE id = v_buyer_id;

        UPDATE public.merchant_shops
        SET cancelled_trades_count = cancelled_trades_count + 1
        WHERE merchant_id = v_seller_id;

    ELSIF TG_TABLE_NAME <> 'merchant_orders'
       AND v_new_status = 'cancelled'
       AND (v_old_status IS NULL OR v_old_status <> 'cancelled') THEN
        UPDATE public.profiles
        SET cancelled_trades_count = cancelled_trades_count + 1
        WHERE id IN (v_buyer_id, v_seller_id);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.fn_handle_kyc_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.kyc_status = 'verified') OR
       (TG_OP = 'UPDATE' AND NEW.kyc_status = 'verified' AND OLD.kyc_status IS DISTINCT FROM 'verified') THEN

        INSERT INTO public.merchant_shops (
            merchant_id,
            completed_trades_count,
            cancelled_trades_count,
            rating_score,
            shop_rating_score,
            shop_description
        )
        VALUES (
            NEW.merchant_id,
            0,
            0,
            5.0,
            5.0,
            '新認證優質商戶店鋪'
        )
        ON CONFLICT (merchant_id) DO NOTHING;

        PERFORM public.fn_recalculate_reputation_tags(NEW.merchant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill seller-side refund counts from historical merchant_orders
UPDATE public.merchant_shops ms
SET cancelled_trades_count = sub.cnt
FROM (
    SELECT merchant_id, COUNT(*)::int AS cnt
    FROM public.merchant_orders
    WHERE escrow_status = 'refunded'
    GROUP BY merchant_id
) sub
WHERE ms.merchant_id = sub.merchant_id;
