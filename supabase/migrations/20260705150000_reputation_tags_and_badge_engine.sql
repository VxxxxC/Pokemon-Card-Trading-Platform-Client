-- ========================================================
-- Reputation tags: merchant trade counter, badge engine, order triggers
-- Replaces completion counting from 20260704260000 (cancel-only retained)
-- ========================================================

-- ==========================================
-- 0. Retire prior completion triggers (avoid double-counting)
-- ==========================================

DROP TRIGGER IF EXISTS tr_on_member_order_status_dynamic_update ON public.member_orders;
DROP TRIGGER IF EXISTS tr_on_merchant_order_status_dynamic_update ON public.merchant_orders;

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

    -- Cancelled trades only; completion handled by fn_trigger_*_order_complete below
    IF (
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_on_member_order_status_dynamic_update
    AFTER UPDATE OF status ON public.member_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_aggregate_user_reputation_stats();

CREATE TRIGGER tr_on_merchant_order_status_dynamic_update
    AFTER UPDATE OF escrow_status ON public.merchant_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_aggregate_user_reputation_stats();


-- ==========================================
-- 1. 結構修改 (Schema Updates)
-- ==========================================

ALTER TABLE public.merchant_shops
ADD COLUMN IF NOT EXISTS completed_trades_count INT DEFAULT 0 NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_badges_calc
ON public.profiles (id, completed_trades_count, rating_score, created_at);

CREATE INDEX IF NOT EXISTS idx_merchant_shops_badges_calc
ON public.merchant_shops (merchant_id, completed_trades_count, rating_score);


-- ==========================================
-- 2. 防禦機制：KYC 通過時自動初始化商戶店鋪
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_handle_kyc_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.kyc_status = 'verified') OR
       (TG_OP = 'UPDATE' AND NEW.kyc_status = 'verified' AND OLD.kyc_status IS DISTINCT FROM 'verified') THEN

        INSERT INTO public.merchant_shops (
            merchant_id,
            completed_trades_count,
            rating_score,
            shop_rating_score,
            shop_description
        )
        VALUES (
            NEW.merchant_id,
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

DROP TRIGGER IF EXISTS trg_kyc_verified_init_shop ON public.kyc_records;

CREATE TRIGGER trg_kyc_verified_init_shop
AFTER INSERT OR UPDATE ON public.kyc_records
FOR EACH ROW EXECUTE FUNCTION public.fn_handle_kyc_verified();


-- ==========================================
-- 3. 核心引擎：稱號與徽章大數據自動判定邏輯
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_recalculate_reputation_tags(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_buyer_trades INT := 0;
    v_seller_trades INT := 0;
    v_rating_score NUMERIC := 5.0;
    v_created_at TIMESTAMPTZ;
    v_total_collection_cards INT := 0;
    v_longest_streak INT := 0;

    v_main_member TEXT := '新晉收藏家';
    v_main_merchant TEXT := NULL;
    v_badges JSONB := '[]'::jsonb;
    v_final_payload JSONB;
BEGIN
    SELECT completed_trades_count, rating_score, created_at
    INTO v_buyer_trades, v_rating_score, v_created_at
    FROM public.profiles WHERE id = p_user_id;

    IF NOT FOUND THEN RETURN; END IF;

    SELECT completed_trades_count, rating_score
    INTO v_seller_trades, v_rating_score
    FROM public.merchant_shops WHERE merchant_id = p_user_id;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_total_collection_cards
    FROM public.user_collections WHERE user_id = p_user_id;

    SELECT COALESCE(longest_streak, 0)
    INTO v_longest_streak
    FROM public.gamification_stats WHERE user_id = p_user_id;

    -- 買家主稱號判定邏輯 (Member Main Title)
    IF v_buyer_trades >= 500 THEN v_main_member := '殿堂級終身藏家';
    ELSIF v_buyer_trades >= 200 THEN v_main_member := '鑽石級貴賓';
    ELSIF v_buyer_trades >= 50 THEN v_main_member := '白金級藏家';
    ELSE v_main_member := '新晉收藏家';
    END IF;

    -- 賣家主稱號判定邏輯 (Merchant Main Title)
    IF v_seller_trades IS NOT NULL THEN
        IF v_seller_trades >= 500 AND v_rating_score >= 4.95 THEN v_main_merchant := '殿堂級誠信商戶';
        ELSIF v_seller_trades >= 200 AND v_rating_score >= 4.85 THEN v_main_merchant := '金牌旗艦商戶';
        ELSIF v_seller_trades >= 50 AND v_rating_score >= 4.7 THEN v_main_merchant := '優質星級商戶';
        ELSE v_main_merchant := '認證新晉商戶';
        END IF;
    END IF;

    -- 通用活動徽章判定邏輯 (Activity Badges)

    -- A. 平台資歷與忠誠度
    IF v_created_at >= (NOW() - INTERVAL '30 days') AND v_created_at <= (NOW() - INTERVAL '1 day') THEN
        v_badges := v_badges || jsonb_build_array('創始成員');
    END IF;
    IF v_created_at <= (NOW() - INTERVAL '365 days') THEN
        v_badges := v_badges || jsonb_build_array('年度見證者');
    END IF;

    -- B. 商譽與誠信防禦
    IF v_buyer_trades + COALESCE(v_seller_trades, 0) >= 50 AND v_rating_score = 5.0 THEN
        v_badges := v_badges || jsonb_build_array('零負評至尊');
    END IF;
    IF v_buyer_trades + COALESCE(v_seller_trades, 0) >= 100 AND v_rating_score >= 4.9 THEN
        v_badges := v_badges || jsonb_build_array('信譽超卓');
    END IF;

    -- C. 收藏實力量化 (不計稀有度)
    IF v_total_collection_cards >= 10000 THEN v_badges := v_badges || jsonb_build_array('萬卡大亨');
    ELSIF v_total_collection_cards >= 1000 THEN v_badges := v_badges || jsonb_build_array('千卡巨頭');
    ELSIF v_total_collection_cards >= 100 THEN v_badges := v_badges || jsonb_build_array('百卡持有人');
    END IF;

    -- D. 平台互動活躍度
    IF v_longest_streak >= 30 THEN
        v_badges := v_badges || jsonb_build_array('簽到達人');
    END IF;

    v_final_payload := jsonb_build_object(
        'core_main_member', v_main_member,
        'core_main_merchant', v_main_merchant,
        'activity_badges', v_badges
    );

    UPDATE public.profiles
    SET reputation_tag = v_final_payload,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- 4. 交易完成觸發器 (Order Completion Triggers)
-- ==========================================

CREATE OR REPLACE FUNCTION public.fn_trigger_member_order_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        UPDATE public.profiles
        SET completed_trades_count = completed_trades_count + 1
        WHERE id = NEW.buyer_id;

        PERFORM public.fn_recalculate_reputation_tags(NEW.buyer_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_member_order_complete ON public.member_orders;

CREATE TRIGGER trg_member_order_complete
AFTER UPDATE ON public.member_orders
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_member_order_complete();


CREATE OR REPLACE FUNCTION public.fn_trigger_merchant_order_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.escrow_status = 'completed_and_transferred' AND (OLD.escrow_status IS DISTINCT FROM 'completed_and_transferred') THEN
        UPDATE public.profiles
        SET completed_trades_count = completed_trades_count + 1
        WHERE id = NEW.buyer_id;

        UPDATE public.merchant_shops
        SET completed_trades_count = completed_trades_count + 1
        WHERE merchant_id = NEW.merchant_id;

        PERFORM public.fn_recalculate_reputation_tags(NEW.buyer_id);
        PERFORM public.fn_recalculate_reputation_tags(NEW.merchant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_merchant_order_complete ON public.merchant_orders;

CREATE TRIGGER trg_merchant_order_complete
AFTER UPDATE ON public.merchant_orders
FOR EACH ROW EXECUTE FUNCTION public.fn_trigger_merchant_order_complete();
