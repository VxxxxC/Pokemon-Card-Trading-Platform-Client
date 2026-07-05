-- ========================================================
-- Reward template claim limits (max_claims / claimed_count)
-- Enforces is_infinite=false templates e.g. 99 lucky-draw tickets
-- ========================================================

ALTER TABLE public.reward_templates
ADD COLUMN IF NOT EXISTS max_claims INT NULL,
ADD COLUMN IF NOT EXISTS claimed_count INT DEFAULT 0 NOT NULL;

ALTER TABLE public.reward_templates
ADD CONSTRAINT chk_reward_templates_max_claims_positive
CHECK (max_claims IS NULL OR max_claims > 0);

ALTER TABLE public.reward_templates
ADD CONSTRAINT chk_reward_templates_claimed_within_max
CHECK (max_claims IS NULL OR claimed_count <= max_claims);

CREATE INDEX IF NOT EXISTS idx_reward_templates_inventory
ON public.reward_templates (is_active, is_infinite, claimed_count, max_claims);


CREATE OR REPLACE FUNCTION public.fn_reward_template_has_stock(
    p_template public.reward_templates
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    IF COALESCE(p_template.is_infinite, false) THEN
        RETURN true;
    END IF;

    IF p_template.max_claims IS NULL OR p_template.max_claims <= 0 THEN
        RETURN false;
    END IF;

    RETURN COALESCE(p_template.claimed_count, 0) < p_template.max_claims;
END;
$$;


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
    FOR UPDATE;

    IF NOT FOUND OR v_template.is_active IS NOT TRUE THEN
        RAISE EXCEPTION '獎勵模板不存在或已停用';
    END IF;

    IF NOT public.fn_reward_template_has_stock(v_template) THEN
        RETURN NULL;
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
    ELSE
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
    END IF;

    IF NOT COALESCE(v_template.is_infinite, false) THEN
        UPDATE public.reward_templates
        SET claimed_count = claimed_count + 1,
            updated_at = NOW(),
            is_active = CASE
                WHEN claimed_count + 1 >= max_claims THEN false
                ELSE is_active
            END
        WHERE id = p_template_id;
    ELSE
        UPDATE public.reward_templates
        SET claimed_count = claimed_count + 1,
            updated_at = NOW()
        WHERE id = p_template_id;
    END IF;

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

    IF p_template.is_active IS NOT TRUE
       OR NOT public.fn_reward_template_has_stock(p_template) THEN
        RETURN NEXT;
        RETURN;
    END IF;

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


-- Cold-start limited templates (admin can add more later)
INSERT INTO public.reward_templates (
    id,
    title,
    description,
    type,
    reward_value,
    trigger_conditions,
    is_active,
    is_infinite,
    max_claims,
    valid_duration_days
)
VALUES
    (
        'a1000001-0001-4001-8001-000000000010',
        '限量 HK$10 現金券',
        '全平台限量 500 張，滿 HK$100 可用',
        'discount_coupon',
        '{"amount_hkd": 10, "min_spend_hkd": 100, "code_prefix": "HK10"}'::jsonb,
        '{"kind": "event_once", "event": "profile_complete", "once_per_user": true}'::jsonb,
        true,
        false,
        500,
        30
    ),
    (
        'a1000001-0001-4001-8001-000000000011',
        '春季抽獎券',
        '限量 99 張抽獎入場券，完成首筆成交即可獲得',
        'lucky_draw_ticket',
        '{"draw_id": "spring-2026", "draw_name_zh": "2026 春季卡展抽獎"}'::jsonb,
        '{"kind": "trade_count", "role": "buyer", "count": 1, "once_per_user": true}'::jsonb,
        true,
        false,
        99,
        60
    )
ON CONFLICT (id) DO NOTHING;
