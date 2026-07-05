-- ========================================================
-- Coupon inventory RPC (joins reward_templates under SECURITY DEFINER)
-- Direct PostgREST embed fails when reward_templates has no owner SELECT policy.
-- ========================================================

CREATE OR REPLACE FUNCTION public.get_user_reward_coupons()
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

    PERFORM public.fn_try_auto_grant_rewards(v_user_id);

    RETURN COALESCE((
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
END;
$$;

REVOKE ALL ON FUNCTION public.get_user_reward_coupons() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_reward_coupons() TO authenticated, service_role;
