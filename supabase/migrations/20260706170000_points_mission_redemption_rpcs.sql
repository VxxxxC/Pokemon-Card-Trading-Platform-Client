-- ========================================================
-- Points SSOT entry points for missions + redemption spend
-- All balance changes MUST go through fn_apply_point_transaction
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_claim_mission_points(
    p_mission_id UUID,
    p_points INT,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_new_balance INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    IF p_mission_id IS NULL THEN
        RAISE EXCEPTION '任務 ID 無效';
    END IF;

    IF p_points IS NULL OR p_points <= 0 THEN
        RAISE EXCEPTION '任務積分必須大於零';
    END IF;

    v_new_balance := public.fn_apply_point_transaction(
        v_user_id,
        p_points,
        'mission_claim',
        p_mission_id,
        COALESCE(NULLIF(trim(p_description), ''), '任務獎勵積分')
    );

    RETURN jsonb_build_object(
        'success', true,
        'points_granted', p_points,
        'points_balance', v_new_balance,
        'mission_id', p_mission_id
    );
END;
$$;


CREATE OR REPLACE FUNCTION public.fn_redeem_member_points(
    p_amount INT,
    p_description TEXT DEFAULT NULL,
    p_source_ref UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_new_balance INT;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION '請先登入';
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        RAISE EXCEPTION '兌換積分必須大於零';
    END IF;

    v_new_balance := public.fn_apply_point_transaction(
        v_user_id,
        -p_amount,
        'redemption',
        p_source_ref,
        COALESCE(NULLIF(trim(p_description), ''), '積分兌換')
    );

    RETURN jsonb_build_object(
        'success', true,
        'points_redeemed', p_amount,
        'points_balance', v_new_balance
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_claim_mission_points(UUID, INT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.fn_redeem_member_points(INT, TEXT, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.fn_claim_mission_points(UUID, INT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.fn_redeem_member_points(INT, TEXT, UUID) TO authenticated, service_role;
