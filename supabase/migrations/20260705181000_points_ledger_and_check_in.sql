-- ========================================================
-- Points: gamification_stats.points_balance + point_ledger audit trail
-- reward_type 'points' added in 20260705180000 (separate txn)
-- Sync CHECK_IN_POINT_LADDER with lib/constants/rewards.ts
-- ========================================================

ALTER TABLE public.gamification_stats
ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 0 NOT NULL;

CREATE TABLE IF NOT EXISTS public.point_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
    amount INT NOT NULL,
    balance_after INT NOT NULL,
    source_type TEXT NOT NULL,
    source_ref UUID NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_point_ledger_amount_nonzero CHECK (amount <> 0),
    CONSTRAINT chk_point_ledger_balance_non_negative CHECK (balance_after >= 0),
    CONSTRAINT chk_point_ledger_source_type CHECK (
        source_type IN (
            'daily_check_in',
            'reward_template',
            'mission_claim',
            'admin_adjust',
            'redemption'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_point_ledger_user_created
ON public.point_ledger (user_id, created_at DESC);

ALTER TABLE public.point_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS point_ledger_owner_read ON public.point_ledger;
CREATE POLICY point_ledger_owner_read
    ON public.point_ledger
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

GRANT SELECT ON public.point_ledger TO authenticated;
GRANT ALL ON public.point_ledger TO service_role;


CREATE OR REPLACE FUNCTION public.fn_apply_point_transaction(
    p_user_id UUID,
    p_amount INT,
    p_source_type TEXT,
    p_source_ref UUID DEFAULT NULL,
    p_description TEXT DEFAULT NULL
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_new_balance INT;
BEGIN
    IF p_amount = 0 THEN
        RAISE EXCEPTION '積分變動不可為零';
    END IF;

    INSERT INTO public.gamification_stats (user_id, points_balance, current_streak, longest_streak)
    VALUES (p_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT gs.points_balance + p_amount
    INTO v_new_balance
    FROM public.gamification_stats gs
    WHERE gs.user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到用戶遊戲化資料';
    END IF;

    IF v_new_balance < 0 THEN
        RAISE EXCEPTION '積分餘額不足';
    END IF;

    UPDATE public.gamification_stats
    SET points_balance = v_new_balance,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    INSERT INTO public.point_ledger (
        user_id,
        amount,
        balance_after,
        source_type,
        source_ref,
        description
    )
    VALUES (
        p_user_id,
        p_amount,
        v_new_balance,
        p_source_type,
        p_source_ref,
        p_description
    );

    RETURN v_new_balance;
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
    v_points INT;
    v_new_balance INT;
BEGIN
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

    v_points := COALESCE((v_template.reward_value ->> 'points')::int, 0);

    IF v_points <= 0 THEN
        RAISE EXCEPTION '積分模板設定無效';
    END IF;

    v_new_balance := public.fn_apply_point_transaction(
        p_user_id,
        v_points,
        'reward_template',
        p_template_id,
        v_template.title
    );

    RETURN jsonb_build_object(
        'success', true,
        'points_granted', v_points,
        'points_balance', v_new_balance,
        'template_id', p_template_id
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

    RETURN jsonb_build_object(
        'success', true,
        'points_earned', v_points,
        'points_balance', v_new_balance,
        'current_streak', v_streak,
        'longest_streak', v_longest,
        'cycle_day', v_cycle_day,
        'checked_in_today', true
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_apply_point_transaction(UUID, INT, TEXT, UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_grant_points_from_template(UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_daily_check_in() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_apply_point_transaction(UUID, INT, TEXT, UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_grant_points_from_template(UUID, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.execute_daily_check_in() TO authenticated, service_role;


-- Seed: points-type reward templates (cold start; admin can add more later)
INSERT INTO public.reward_templates (
    id,
    title,
    description,
    type,
    reward_value,
    trigger_conditions,
    is_active,
    is_infinite,
    valid_duration_days
)
VALUES
    (
        'a1000001-0001-4001-8001-000000000001',
        '簽到第七日加碼積分',
        '連續簽到週期第 7 日額外積分（模板示例，簽到 RPC 已直接發放循環積分）',
        'points',
        '{"points": 50}'::jsonb,
        '{"kind": "check_in_cycle_day", "day": 7, "once_per_cycle": true}'::jsonb,
        true,
        true,
        NULL
    ),
    (
        'a1000001-0001-4001-8001-000000000002',
        '首筆成交獎勵積分',
        '完成首筆 P2P 或商戶訂單後可領取',
        'points',
        '{"points": 150}'::jsonb,
        '{"kind": "trade_count", "role": "buyer", "count": 1, "once_per_user": true}'::jsonb,
        true,
        false,
        NULL
    ),
    (
        'a1000001-0001-4001-8001-000000000003',
        '連續簽到 30 日里程碑',
        '連續簽到 30 天一次性積分獎勵',
        'points',
        '{"points": 300}'::jsonb,
        '{"kind": "check_in_streak", "min_streak": 30, "once_per_user": true}'::jsonb,
        true,
        false,
        NULL
    )
ON CONFLICT (id) DO NOTHING;


CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role public.user_role;
BEGIN
  BEGIN
    requested_role := COALESCE(
      (NEW.raw_user_meta_data->>'role')::public.user_role,
      'member'::public.user_role
    );
  EXCEPTION
    WHEN invalid_text_representation THEN
      requested_role := 'member'::public.user_role;
  END;

  INSERT INTO public.profiles (id, display_name, username, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'display_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    public.generate_profile_username(),
    requested_role
  )
  ON CONFLICT (id) DO UPDATE
  SET
    display_name = EXCLUDED.display_name,
    role = EXCLUDED.role,
    username = COALESCE(public.profiles.username, EXCLUDED.username),
    updated_at = now();

  INSERT INTO public.gamification_stats (user_id, points_balance, current_streak, longest_streak)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  PERFORM public.fn_recalculate_reputation_tags(NEW.id);

  RETURN NEW;
END;
$$;
