-- ========================================================
-- Reward coupon center: wallet (issued) + locked catalog (not yet eligible)
-- Progress / requirement labels computed in DB — frontend only renders.
-- ========================================================

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

    SELECT COALESCE(gs.current_streak, 0)
    INTO v_current_streak
    FROM public.gamification_stats gs
    WHERE gs.user_id = p_user_id;

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


CREATE OR REPLACE FUNCTION public.get_reward_coupon_center()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_wallet JSONB;
    v_locked JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    PERFORM public.fn_try_auto_grant_rewards(v_user_id);

    v_wallet := COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', ur.id,
                'is_used', ur.is_used,
                'calculated_expiry', ur.calculated_expiry,
                'used_at', ur.used_at,
                'template', jsonb_build_object(
                    'title', rt.title,
                    'description', rt.description,
                    'type', rt.type,
                    'reward_value', rt.reward_value
                )
            )
            ORDER BY ur.created_at DESC
        )
        FROM public.user_rewards ur
        INNER JOIN public.reward_templates rt ON rt.id = ur.template_id
        WHERE ur.user_id = v_user_id
          AND rt.type IN ('discount_coupon', 'free_shipping')
    ), '[]'::jsonb);

    v_locked := COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'template_id', rt.id,
                'title', rt.title,
                'description', rt.description,
                'type', rt.type,
                'reward_value', rt.reward_value,
                'progress', public.fn_reward_template_progress_detail(v_user_id, rt)
            )
            ORDER BY rt.created_at ASC NULLS LAST
        )
        FROM public.reward_templates rt
        WHERE rt.is_active IS TRUE
          AND rt.type IN ('discount_coupon', 'free_shipping')
          AND public.fn_reward_template_has_stock(rt)
          AND NOT EXISTS (
              SELECT 1
              FROM public.fn_template_is_eligible(v_user_id, rt) AS elig
              WHERE COALESCE(elig.eligible, false)
          )
          AND NOT EXISTS (
              SELECT 1
              FROM public.user_rewards ur
              WHERE ur.user_id = v_user_id
                AND ur.template_id = rt.id
                AND ur.grant_dedup_key = 'lifetime'
          )
    ), '[]'::jsonb);

    RETURN jsonb_build_object(
        'wallet', v_wallet,
        'locked', v_locked
    );
END;
$$;

-- Keep legacy RPC delegating to center (wallet slice only)
CREATE OR REPLACE FUNCTION public.get_user_reward_coupons()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_center JSONB;
BEGIN
    v_center := public.get_reward_coupon_center();
    RETURN COALESCE(v_center -> 'wallet', '[]'::jsonb);
END;
$$;

REVOKE ALL ON FUNCTION public.fn_reward_template_progress_detail(UUID, public.reward_templates) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_reward_template_progress_detail(UUID, public.reward_templates) TO service_role;

REVOKE ALL ON FUNCTION public.get_reward_coupon_center() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_reward_coupon_center() TO authenticated, service_role;
