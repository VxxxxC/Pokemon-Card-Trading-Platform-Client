-- ========================================================
-- Archive lucky_draw_ticket templates (HK licensing — v2 TBD)
-- Add HK$2 discount coupon template
-- ========================================================

UPDATE public.reward_templates
SET
    is_active = false,
    description = COALESCE(description, '') || ' [已封存：香港抽獎牌照限制，v2 前暫停]',
    updated_at = NOW()
WHERE type = 'lucky_draw_ticket';

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
          AND type <> 'lucky_draw_ticket'
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
        'a1000001-0001-4001-8001-000000000012',
        '平台 HK$2 現金折價券',
        '完善個人資料後自動發放，全網 C2C 交易滿 HK$20 可扣減 HK$2',
        'discount_coupon',
        '{"amount_hkd": 2, "min_spend_hkd": 20, "code_prefix": "HK2"}'::jsonb,
        '{"kind": "event_once", "event": "profile_complete", "once_per_user": true}'::jsonb,
        true,
        true,
        NULL,
        30
    )
ON CONFLICT (id) DO NOTHING;


CREATE OR REPLACE FUNCTION public.run_auto_grant_rewards_for_me()
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

    RETURN public.fn_try_auto_grant_rewards(v_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.run_auto_grant_rewards_for_me() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.run_auto_grant_rewards_for_me() TO authenticated, service_role;
