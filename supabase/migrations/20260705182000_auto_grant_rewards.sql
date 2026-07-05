-- ========================================================
-- Auto-grant reward templates + unacknowledged notification queue (user_rewards)
-- ========================================================

ALTER TABLE public.user_rewards
ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ NULL,
ADD COLUMN IF NOT EXISTS grant_dedup_key TEXT NOT NULL DEFAULT 'lifetime';

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_rewards_grant_dedup
ON public.user_rewards (user_id, template_id, grant_dedup_key);

ALTER TABLE public.user_rewards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_rewards_owner_read ON public.user_rewards;
CREATE POLICY user_rewards_owner_read
    ON public.user_rewards
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS user_rewards_owner_ack ON public.user_rewards;
CREATE POLICY user_rewards_owner_ack
    ON public.user_rewards
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

GRANT SELECT, UPDATE ON public.user_rewards TO authenticated;
GRANT ALL ON public.user_rewards TO service_role;


CREATE OR REPLACE FUNCTION public.fn_issue_reward_from_template(
    p_user_id UUID,
    p_template_id UUID,
    p_grant_dedup_key TEXT DEFAULT 'lifetime'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template public.reward_templates%ROWTYPE;
    v_points INT;
    v_user_reward_id UUID;
    v_expiry TIMESTAMPTZ;
BEGIN
    SELECT * INTO v_template
    FROM public.reward_templates
    WHERE id = p_template_id
      AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION '獎勵模板不存在或已停用';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.user_rewards ur
        WHERE ur.user_id = p_user_id
          AND ur.template_id = p_template_id
          AND ur.grant_dedup_key = p_grant_dedup_key
    ) THEN
        RETURN NULL;
    END IF;

    IF v_template.fixed_expiry_date IS NOT NULL THEN
        v_expiry := v_template.fixed_expiry_date;
    ELSIF v_template.valid_duration_days IS NOT NULL THEN
        v_expiry := NOW() + (v_template.valid_duration_days || ' days')::interval;
    ELSE
        v_expiry := NULL;
    END IF;

    IF v_template.type = 'points' THEN
        v_points := COALESCE((v_template.reward_value ->> 'points')::int, 0);

        IF v_points <= 0 THEN
            RAISE EXCEPTION '積分模板設定無效';
        END IF;

        PERFORM public.fn_apply_point_transaction(
            p_user_id,
            v_points,
            'reward_template',
            p_template_id,
            v_template.title
        );

        INSERT INTO public.user_rewards (
            user_id,
            template_id,
            is_used,
            calculated_expiry,
            grant_dedup_key
        )
        VALUES (
            p_user_id,
            p_template_id,
            true,
            v_expiry,
            p_grant_dedup_key
        )
        RETURNING id INTO v_user_reward_id;

        RETURN v_user_reward_id;
    END IF;

    INSERT INTO public.user_rewards (
        user_id,
        template_id,
        is_used,
        calculated_expiry,
        grant_dedup_key
    )
    VALUES (
        p_user_id,
        p_template_id,
        false,
        v_expiry,
        p_grant_dedup_key
    )
    RETURNING id INTO v_user_reward_id;

    RETURN v_user_reward_id;
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

    v_kind := p_template.trigger_conditions ->> 'kind';

    SELECT COALESCE(gs.current_streak, 0)
    INTO v_current_streak
    FROM public.gamification_stats gs
    WHERE gs.user_id = p_user_id;

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

                eligible := v_listing_count >= 1;
            WHEN 'first_chat' THEN
                SELECT COUNT(*)::int
                INTO v_chat_count
                FROM public.chat_messages cm
                WHERE cm.sender_id = p_user_id
                  AND cm.content NOT LIKE 'SYSTEM_%';

                eligible := v_chat_count >= 1;
            WHEN 'profile_complete' THEN
                SELECT (
                    p.avatar_path IS NOT NULL
                    AND NULLIF(BTRIM(p.username), '') IS NOT NULL
                )
                INTO v_profile_complete
                FROM public.profiles p
                WHERE p.id = p_user_id;

                eligible := COALESCE(v_profile_complete, false);
            ELSE
                eligible := false;
        END CASE;

        grant_dedup_key := 'lifetime';
        RETURN NEXT;
        RETURN;
    END IF;

    RETURN NEXT;
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_try_auto_grant_rewards(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template public.reward_templates%ROWTYPE;
    v_eligible BOOLEAN;
    v_dedup_key TEXT;
    v_user_reward_id UUID;
    v_grants JSONB := '[]'::jsonb;
    v_points INT;
BEGIN
    FOR v_template IN
        SELECT *
        FROM public.reward_templates
        WHERE is_active = true
        ORDER BY created_at ASC NULLS LAST
    LOOP
        SELECT t.eligible, t.grant_dedup_key
        INTO v_eligible, v_dedup_key
        FROM public.fn_template_is_eligible(p_user_id, v_template) AS t;

        IF NOT COALESCE(v_eligible, false) THEN
            CONTINUE;
        END IF;

        IF COALESCE((v_template.trigger_conditions ->> 'once_per_user')::boolean, false)
           OR v_template.trigger_conditions ->> 'kind' IN ('trade_count', 'check_in_streak', 'event_once') THEN
            IF EXISTS (
                SELECT 1
                FROM public.user_rewards ur
                WHERE ur.user_id = p_user_id
                  AND ur.template_id = v_template.id
                  AND ur.grant_dedup_key = 'lifetime'
            ) THEN
                CONTINUE;
            END IF;
        END IF;

        v_user_reward_id := public.fn_issue_reward_from_template(
            p_user_id,
            v_template.id,
            v_dedup_key
        );

        IF v_user_reward_id IS NULL THEN
            CONTINUE;
        END IF;

        v_points := NULL;
        IF v_template.type = 'points' THEN
            v_points := COALESCE((v_template.reward_value ->> 'points')::int, 0);
        END IF;

        v_grants := v_grants || jsonb_build_array(
            jsonb_build_object(
                'user_reward_id', v_user_reward_id,
                'template_id', v_template.id,
                'title', v_template.title,
                'description', v_template.description,
                'type', v_template.type,
                'reward_value', v_template.reward_value,
                'points_granted', v_points
            )
        );
    END LOOP;

    RETURN v_grants;
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_grant_points_from_template(
    p_user_id UUID,
    p_template_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_template public.reward_templates%ROWTYPE;
    v_user_reward_id UUID;
    v_points INT;
    v_balance INT;
BEGIN
    IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    SELECT * INTO v_template
    FROM public.reward_templates
    WHERE id = p_template_id
      AND is_active = true;

    IF NOT FOUND THEN
        RAISE EXCEPTION '獎勵模板不存在或已停用';
    END IF;

    IF v_template.type <> 'points' THEN
        RAISE EXCEPTION '此模板並非積分類型獎勵';
    END IF;

    v_user_reward_id := public.fn_issue_reward_from_template(
        p_user_id,
        p_template_id,
        'lifetime'
    );

    IF v_user_reward_id IS NULL THEN
        RAISE EXCEPTION '此獎勵已領取';
    END IF;

    v_points := COALESCE((v_template.reward_value ->> 'points')::int, 0);

    SELECT gs.points_balance
    INTO v_balance
    FROM public.gamification_stats gs
    WHERE gs.user_id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'points_granted', v_points,
        'points_balance', COALESCE(v_balance, 0),
        'template_id', p_template_id,
        'user_reward_id', v_user_reward_id
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.execute_daily_check_in()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_today_hk DATE := (NOW() AT TIME ZONE 'Asia/Hong_Kong')::date;
    v_last_hk DATE;
    v_streak INT := 1;
    v_longest INT := 0;
    v_cycle_day INT;
    v_points INT;
    v_new_balance INT;
    v_stats public.gamification_stats%ROWTYPE;
    v_newly_granted JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入後再簽到';
    END IF;

    INSERT INTO public.gamification_stats (user_id, points_balance, current_streak, longest_streak)
    VALUES (v_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_stats
    FROM public.gamification_stats
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_stats.last_check_in IS NOT NULL THEN
        v_last_hk := (v_stats.last_check_in AT TIME ZONE 'Asia/Hong_Kong')::date;

        IF v_last_hk = v_today_hk THEN
            RAISE EXCEPTION '今日已簽到，請明天再來';
        END IF;

        IF v_last_hk = v_today_hk - 1 THEN
            v_streak := COALESCE(v_stats.current_streak, 0) + 1;
        ELSE
            v_streak := 1;
        END IF;
    END IF;

    v_longest := GREATEST(COALESCE(v_stats.longest_streak, 0), v_streak);
    v_cycle_day := ((v_streak - 1) % 7) + 1;

    v_points := CASE v_cycle_day
        WHEN 1 THEN 10
        WHEN 2 THEN 15
        WHEN 3 THEN 20
        WHEN 4 THEN 25
        WHEN 5 THEN 30
        WHEN 6 THEN 40
        WHEN 7 THEN 100
        ELSE 10
    END;

    UPDATE public.gamification_stats
    SET current_streak = v_streak,
        longest_streak = v_longest,
        last_check_in = NOW(),
        updated_at = NOW()
    WHERE user_id = v_user_id;

    v_new_balance := public.fn_apply_point_transaction(
        v_user_id,
        v_points,
        'daily_check_in',
        NULL,
        format('每日簽到第 %s 天（連續 %s 天）', v_cycle_day, v_streak)
    );

    PERFORM public.fn_recalculate_reputation_tags(v_user_id);

    v_newly_granted := public.fn_try_auto_grant_rewards(v_user_id);

    RETURN jsonb_build_object(
        'success', true,
        'points_earned', v_points,
        'points_balance', v_new_balance,
        'current_streak', v_streak,
        'longest_streak', v_longest,
        'cycle_day', v_cycle_day,
        'checked_in_today', true,
        'newly_granted', v_newly_granted
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.get_unacknowledged_reward_grants()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    RETURN COALESCE((
        SELECT jsonb_agg(
            jsonb_build_object(
                'user_reward_id', ur.id,
                'template_id', rt.id,
                'title', rt.title,
                'description', rt.description,
                'type', rt.type,
                'reward_value', rt.reward_value,
                'points_granted',
                    CASE
                        WHEN rt.type = 'points'
                            THEN COALESCE((rt.reward_value ->> 'points')::int, 0)
                        ELSE NULL
                    END,
                'created_at', ur.created_at
            )
            ORDER BY ur.created_at ASC
        )
        FROM public.user_rewards ur
        INNER JOIN public.reward_templates rt ON rt.id = ur.template_id
        WHERE ur.user_id = v_user_id
          AND ur.acknowledged_at IS NULL
    ), '[]'::jsonb);
END;
$$;


CREATE OR REPLACE FUNCTION public.acknowledge_reward_grants(p_user_reward_ids UUID[])
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_updated INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    UPDATE public.user_rewards ur
    SET acknowledged_at = NOW()
    WHERE ur.user_id = v_user_id
      AND ur.id = ANY (p_user_reward_ids)
      AND ur.acknowledged_at IS NULL;

    GET DIAGNOSTICS v_updated = ROW_COUNT;

    RETURN jsonb_build_object('success', true, 'updated', v_updated);
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_trigger_member_order_complete()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
        UPDATE public.profiles
        SET completed_trades_count = completed_trades_count + 1
        WHERE id = NEW.buyer_id;

        PERFORM public.fn_recalculate_reputation_tags(NEW.buyer_id);
        PERFORM public.fn_try_auto_grant_rewards(NEW.buyer_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


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
        PERFORM public.fn_try_auto_grant_rewards(NEW.buyer_id);
        PERFORM public.fn_try_auto_grant_rewards(NEW.merchant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


REVOKE ALL ON FUNCTION public.fn_issue_reward_from_template(UUID, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_template_is_eligible(UUID, public.reward_templates) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_try_auto_grant_rewards(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_unacknowledged_reward_grants() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.acknowledge_reward_grants(UUID[]) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_issue_reward_from_template(UUID, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_try_auto_grant_rewards(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_unacknowledged_reward_grants() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.acknowledge_reward_grants(UUID[]) TO authenticated, service_role;
