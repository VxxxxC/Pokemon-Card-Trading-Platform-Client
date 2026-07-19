-- ========================================================
-- Effective check-in streak (broken-streak UI + admin check_in_streak rewards)
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_effective_check_in_streak(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_stats public.gamification_stats%ROWTYPE;
    v_today_hk DATE := (NOW() AT TIME ZONE 'Asia/Hong_Kong')::date;
    v_last_hk DATE;
    v_stored INT;
BEGIN
    SELECT * INTO v_stats
    FROM public.gamification_stats
    WHERE user_id = p_user_id;

    IF NOT FOUND OR v_stats.last_check_in IS NULL THEN
        RETURN 0;
    END IF;

    v_last_hk := (v_stats.last_check_in AT TIME ZONE 'Asia/Hong_Kong')::date;
    v_stored := GREATEST(COALESCE(v_stats.current_streak, 0), 0);

    IF v_last_hk = v_today_hk THEN
        RETURN v_stored;
    END IF;

    IF v_last_hk = v_today_hk - 1 THEN
        RETURN v_stored;
    END IF;

    RETURN 0;
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_sync_broken_check_in_streak(p_user_id UUID)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_effective INT;
BEGIN
    v_effective := public.fn_effective_check_in_streak(p_user_id);

    UPDATE public.gamification_stats gs
    SET current_streak = v_effective,
        updated_at = NOW()
    WHERE gs.user_id = p_user_id
      AND gs.last_check_in IS NOT NULL
      AND COALESCE(gs.current_streak, 0) IS DISTINCT FROM v_effective;

    RETURN v_effective;
END;
$$;


CREATE OR REPLACE FUNCTION public.get_gamification_stats_for_me()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_stats public.gamification_stats%ROWTYPE;
    v_effective_streak INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    INSERT INTO public.gamification_stats (user_id, points_balance, current_streak, longest_streak)
    VALUES (v_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    v_effective_streak := public.fn_sync_broken_check_in_streak(v_user_id);

    SELECT * INTO v_stats
    FROM public.gamification_stats
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'points_balance', COALESCE(v_stats.points_balance, 0),
        'current_streak', v_effective_streak,
        'longest_streak', COALESCE(v_stats.longest_streak, 0),
        'last_check_in', v_stats.last_check_in
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_template_is_eligible(
    p_user_id UUID,
    p_template public.reward_templates
)
RETURNS TABLE (
    eligible BOOLEAN,
    grant_dedup_key TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kind TEXT;
    v_buyer_trades INT := 0;
    v_merchant_trades INT := 0;
    v_current_streak INT := 0;
    v_cycle_day INT;
    v_required_count INT;
    v_required_day INT;
    v_min_streak INT;
    v_role TEXT;
    v_listing_count INT := 0;
    v_chat_count INT := 0;
    v_profile_complete BOOLEAN := false;
BEGIN
    eligible := false;
    grant_dedup_key := 'lifetime';

    IF p_template.is_active IS NOT TRUE
       OR NOT public.fn_reward_template_has_stock(p_template) THEN
        RETURN NEXT;
        RETURN;
    END IF;

    v_kind := p_template.trigger_conditions ->> 'kind';

    v_current_streak := public.fn_effective_check_in_streak(p_user_id);

    IF v_kind = 'check_in_streak' THEN
        v_min_streak := COALESCE((p_template.trigger_conditions ->> 'min_streak')::int, 1);

        IF v_current_streak >= v_min_streak THEN
            eligible := true;
            grant_dedup_key := 'lifetime';
        END IF;

        RETURN NEXT;
        RETURN;
    END IF;

    IF v_kind = 'check_in_cycle_day' THEN
        v_required_day := COALESCE((p_template.trigger_conditions ->> 'day')::int, 1);
        v_cycle_day := ((GREATEST(v_current_streak, 1) - 1) % 7) + 1;

        IF v_cycle_day = v_required_day AND v_current_streak >= v_required_day THEN
            eligible := true;

            IF COALESCE((p_template.trigger_conditions ->> 'once_per_cycle')::boolean, false) THEN
                grant_dedup_key := 'cycle-' || FLOOR((v_current_streak - 1) / 7)::text;
            ELSE
                grant_dedup_key := 'lifetime';
            END IF;
        END IF;

        RETURN NEXT;
        RETURN;
    END IF;

    IF v_kind = 'trade_count' THEN
        v_role := COALESCE(p_template.trigger_conditions ->> 'role', 'buyer');
        v_required_count := COALESCE((p_template.trigger_conditions ->> 'count')::int, 1);

        SELECT COALESCE(p.completed_trades_count, 0)
        INTO v_buyer_trades
        FROM public.profiles p
        WHERE p.id = p_user_id;

        SELECT COALESCE(ms.completed_trades_count, 0)
        INTO v_merchant_trades
        FROM public.merchant_shops ms
        WHERE ms.merchant_id = p_user_id;

        IF v_role = 'buyer' AND v_buyer_trades >= v_required_count THEN
            eligible := true;
        ELSIF v_role = 'merchant' AND v_merchant_trades >= v_required_count THEN
            eligible := true;
        END IF;

        grant_dedup_key := 'lifetime';
        RETURN NEXT;
        RETURN;
    END IF;

    IF v_kind = 'event_once' THEN
        CASE COALESCE(p_template.trigger_conditions ->> 'event', '')
            WHEN 'first_listing' THEN
                SELECT COUNT(*)::int
                INTO v_listing_count
                FROM public.listings l
                WHERE l.seller_id = p_user_id;

                IF v_listing_count >= 1 THEN
                    eligible := true;
                END IF;
            WHEN 'first_chat' THEN
                SELECT COUNT(*)::int
                INTO v_chat_count
                FROM public.chat_messages cm
                WHERE cm.sender_id = p_user_id
                  AND cm.content NOT LIKE 'SYSTEM_%';

                IF v_chat_count >= 1 THEN
                    eligible := true;
                END IF;
            WHEN 'profile_complete' THEN
                SELECT (
                    p.avatar_path IS NOT NULL
                    AND NULLIF(BTRIM(p.username), '') IS NOT NULL
                )
                INTO v_profile_complete
                FROM public.profiles p
                WHERE p.id = p_user_id;

                IF COALESCE(v_profile_complete, false) THEN
                    eligible := true;
                END IF;
            ELSE
                NULL;
        END CASE;

        grant_dedup_key := 'lifetime';
        RETURN NEXT;
        RETURN;
    END IF;

    RETURN NEXT;
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_reward_template_progress_detail(
    p_user_id UUID,
    p_template public.reward_templates
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_kind TEXT;
    v_event TEXT;
    v_buyer_trades INT := 0;
    v_merchant_trades INT := 0;
    v_current_streak INT := 0;
    v_cycle_day INT;
    v_required_count INT;
    v_required_day INT;
    v_min_streak INT;
    v_role TEXT;
    v_listing_count INT := 0;
    v_chat_count INT := 0;
    v_profile_complete BOOLEAN := false;
    v_current INT := 0;
    v_required INT := 1;
    v_requirement_label TEXT := '完成指定條件後自動發放';
    v_progress_label TEXT := '0 / 1';
    v_cta_href TEXT := '/profile/user/rewards';
    v_remaining INT;
BEGIN
    v_kind := p_template.trigger_conditions ->> 'kind';
    v_event := COALESCE(p_template.trigger_conditions ->> 'event', '');

    v_current_streak := public.fn_effective_check_in_streak(p_user_id);

    SELECT COALESCE(p.completed_trades_count, 0)
    INTO v_buyer_trades
    FROM public.profiles p
    WHERE p.id = p_user_id;

    SELECT COALESCE(ms.completed_trades_count, 0)
    INTO v_merchant_trades
    FROM public.merchant_shops ms
    WHERE ms.merchant_id = p_user_id;

    IF v_kind = 'check_in_streak' THEN
        v_min_streak := COALESCE((p_template.trigger_conditions ->> 'min_streak')::int, 1);
        v_current := LEAST(v_current_streak, v_min_streak);
        v_required := v_min_streak;
        v_requirement_label := format('連續簽到 %s 天', v_min_streak);
        v_cta_href := '/profile/user/rewards';
    ELSIF v_kind = 'check_in_cycle_day' THEN
        v_required_day := COALESCE((p_template.trigger_conditions ->> 'day')::int, 1);
        v_cycle_day := ((GREATEST(v_current_streak, 0)) % 7);
        IF v_current_streak >= v_required_day THEN
            v_current := v_required_day;
        ELSE
            v_current := LEAST(v_cycle_day, v_required_day - 1);
        END IF;
        v_required := v_required_day;
        v_requirement_label := format('簽到週期第 %s 天', v_required_day);
        v_cta_href := '/profile/user/rewards';
    ELSIF v_kind = 'trade_count' THEN
        v_role := COALESCE(p_template.trigger_conditions ->> 'role', 'buyer');
        v_required_count := GREATEST(COALESCE((p_template.trigger_conditions ->> 'count')::int, 1), 1);
        IF v_role = 'merchant' THEN
            v_current := LEAST(v_merchant_trades, v_required_count);
            v_required := v_required_count;
            v_requirement_label := format('完成 %s 筆商戶成交', v_required_count);
            v_cta_href := '/profile/merchant/trading';
        ELSE
            v_current := LEAST(v_buyer_trades, v_required_count);
            v_required := v_required_count;
            v_requirement_label := format('完成 %s 筆買入成交', v_required_count);
            v_cta_href := '/profile/user/trading';
        END IF;
    ELSIF v_kind = 'event_once' THEN
        v_required := 1;
        CASE v_event
            WHEN 'first_listing' THEN
                SELECT COUNT(*)::int INTO v_listing_count
                FROM public.listings l WHERE l.seller_id = p_user_id;
                v_current := LEAST(v_listing_count, 1);
                v_requirement_label := '上架首張現貨商品';
                v_cta_href := '/profile/user/inventory';
            WHEN 'first_chat' THEN
                SELECT COUNT(*)::int INTO v_chat_count
                FROM public.chat_messages cm
                WHERE cm.sender_id = p_user_id AND cm.content NOT LIKE 'SYSTEM_%';
                v_current := LEAST(v_chat_count, 1);
                v_requirement_label := '首次透過聊天室聯絡另一位玩家';
                v_cta_href := '/';
            WHEN 'profile_complete' THEN
                SELECT (
                    p.avatar_path IS NOT NULL
                    AND NULLIF(BTRIM(p.username), '') IS NOT NULL
                ) INTO v_profile_complete
                FROM public.profiles p WHERE p.id = p_user_id;
                v_current := CASE WHEN COALESCE(v_profile_complete, false) THEN 1 ELSE 0 END;
                v_requirement_label := '完善個人資料（用戶名稱 + 頭像）';
                v_cta_href := '/profile/user/settings';
            ELSE
                v_requirement_label := COALESCE(NULLIF(BTRIM(p_template.description), ''), '完成指定任務');
        END CASE;
    ELSE
        v_requirement_label := COALESCE(NULLIF(BTRIM(p_template.description), ''), '完成指定任務');
    END IF;

    v_progress_label := format('%s / %s', v_current, v_required);

    v_remaining := NULL;
    IF COALESCE(p_template.is_infinite, false) IS NOT TRUE
       AND p_template.max_claims IS NOT NULL
       AND p_template.max_claims > 0 THEN
        v_remaining := GREATEST(
            0,
            p_template.max_claims - COALESCE(p_template.claimed_count, 0)
        );
    END IF;

    RETURN jsonb_build_object(
        'progress_current', v_current,
        'progress_required', v_required,
        'progress_label', v_progress_label,
        'requirement_label', v_requirement_label,
        'cta_href', v_cta_href,
        'stock_remaining', v_remaining
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_effective_check_in_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_effective_check_in_streak(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.fn_sync_broken_check_in_streak(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_sync_broken_check_in_streak(UUID) TO authenticated, service_role;
