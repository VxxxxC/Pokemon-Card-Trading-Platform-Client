-- ========================================================
-- Gamification stats read RPC (SECURITY DEFINER — bypass RLS if enabled)
-- Ensures stats row exists before read (cold-start users)
-- ========================================================

CREATE OR REPLACE FUNCTION public.get_gamification_stats_for_me()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_stats public.gamification_stats%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    INSERT INTO public.gamification_stats (user_id, points_balance, current_streak, longest_streak)
    VALUES (v_user_id, 0, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT * INTO v_stats
    FROM public.gamification_stats
    WHERE user_id = v_user_id;

    RETURN jsonb_build_object(
        'points_balance', COALESCE(v_stats.points_balance, 0),
        'current_streak', COALESCE(v_stats.current_streak, 0),
        'longest_streak', COALESCE(v_stats.longest_streak, 0),
        'last_check_in', v_stats.last_check_in
    );
END;
$$;

REVOKE ALL ON FUNCTION public.get_gamification_stats_for_me() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_gamification_stats_for_me() TO authenticated, service_role;
