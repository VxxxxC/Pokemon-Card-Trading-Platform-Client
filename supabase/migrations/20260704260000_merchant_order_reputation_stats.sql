-- ========================================================
-- 補丁 Migration：讓 Merchant Orders 的結案狀態也能同步刷入 Profiles 誠信帳本
-- ========================================================

-- 1. 升級或重用我們的聚合函數，使其兼容 Member 與 Merchant 訂單結構
CREATE OR REPLACE FUNCTION public.fn_aggregate_user_reputation_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_buyer_id UUID;
    v_seller_id UUID;
    v_new_status TEXT;
    v_old_status TEXT;
BEGIN
    v_buyer_id := COALESCE(NEW.buyer_id, OLD.buyer_id);

    -- 自動適配：member_orders 用 seller_id；merchant_orders 用 merchant_id
    IF TG_TABLE_NAME = 'merchant_orders' THEN
        v_seller_id := COALESCE(NEW.merchant_id, OLD.merchant_id);
        v_new_status := NEW.escrow_status::TEXT;
        v_old_status := OLD.escrow_status::TEXT;
    ELSE
        v_seller_id := COALESCE(NEW.seller_id, OLD.seller_id);
        v_new_status := NEW.status::TEXT;
        v_old_status := OLD.status::TEXT;
    END IF;

    -- 情況 A：當訂單狀態變更為結案完成 (C2C: completed / B2C: completed_and_transferred)
    IF (
        (TG_TABLE_NAME = 'merchant_orders'
         AND v_new_status = 'completed_and_transferred'
         AND (v_old_status IS NULL OR v_old_status <> 'completed_and_transferred'))
        OR
        (TG_TABLE_NAME <> 'merchant_orders'
         AND v_new_status = 'completed'
         AND (v_old_status IS NULL OR v_old_status <> 'completed'))
    ) THEN
        UPDATE public.profiles
        SET completed_trades_count = completed_trades_count + 1
        WHERE id IN (v_buyer_id, v_seller_id);

    -- 情況 B：當訂單狀態變更為取消 (C2C: cancelled / B2C: refunded)
    ELSIF (
        (TG_TABLE_NAME = 'merchant_orders'
         AND v_new_status = 'refunded'
         AND (v_old_status IS NULL OR v_old_status <> 'refunded'))
        OR
        (TG_TABLE_NAME <> 'merchant_orders'
         AND v_new_status = 'cancelled'
         AND (v_old_status IS NULL OR v_old_status <> 'cancelled'))
    ) THEN
        UPDATE public.profiles
        SET cancelled_trades_count = cancelled_trades_count + 1
        WHERE id IN (v_buyer_id, v_seller_id);
    END IF;

    -- 即時重新計算該用戶受評價影響的平均星級 (rating_score)
    UPDATE public.profiles p
    SET rating_score = COALESCE((
        SELECT ROUND(AVG(rating)::numeric, 1)
        FROM public.transaction_reviews r
        WHERE r.reviewee_id = p.id AND r.is_public = true
    ), 0.0)
    WHERE p.id IN (v_buyer_id, v_seller_id);

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Member Orders 統計防禦線（若尚未綁定則補建）
DROP TRIGGER IF EXISTS tr_on_member_order_status_dynamic_update ON public.member_orders;

CREATE TRIGGER tr_on_member_order_status_dynamic_update
    AFTER UPDATE OF status ON public.member_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_aggregate_user_reputation_stats();


-- 3. 🌟 關鍵補漏：將統計防禦線同樣綁定到 merchant_orders 表上
DROP TRIGGER IF EXISTS tr_on_merchant_order_status_dynamic_update ON public.merchant_orders;

CREATE TRIGGER tr_on_merchant_order_status_dynamic_update
    AFTER UPDATE OF escrow_status ON public.merchant_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_aggregate_user_reputation_stats();
