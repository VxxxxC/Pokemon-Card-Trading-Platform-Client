-- Atomic transaction review submit + batch reviewed-order lookup (bypasses RLS friction)

CREATE OR REPLACE FUNCTION public.rpc_get_user_reviewed_member_order_ids(
    p_order_ids UUID[]
)
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT r.member_order_id
    FROM public.transaction_reviews r
    WHERE r.reviewer_id = auth.uid()
      AND r.member_order_id IS NOT NULL
      AND r.member_order_id = ANY(p_order_ids);
$$;

CREATE OR REPLACE FUNCTION public.rpc_submit_transaction_review(
    p_order_id UUID,
    p_reviewee_id UUID,
    p_rating INTEGER,
    p_comment TEXT DEFAULT NULL,
    p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_trimmed_comment TEXT;
    v_reviewee_persona public.review_persona;
    v_expected_reviewee UUID;
    v_member_order public.member_orders%ROWTYPE;
    v_merchant_order public.merchant_orders%ROWTYPE;
    v_review_id UUID;
BEGIN
    IF p_user_id IS NULL OR p_user_id <> auth.uid() THEN
        RAISE EXCEPTION '請先登入後再提交評價';
    END IF;

    IF p_reviewee_id = p_user_id THEN
        RAISE EXCEPTION '無法評價自己';
    END IF;

    IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
        RAISE EXCEPTION '請選擇 1 至 5 星評分';
    END IF;

    v_trimmed_comment := NULLIF(BTRIM(COALESCE(p_comment, '')), '');

    IF v_trimmed_comment IS NOT NULL AND char_length(v_trimmed_comment) > 200 THEN
        RAISE EXCEPTION '留言不可超過 200 字';
    END IF;

    SELECT * INTO v_member_order
    FROM public.member_orders
    WHERE id = p_order_id;

    IF FOUND THEN
        IF v_member_order.status <> 'completed' THEN
            RAISE EXCEPTION '僅能對已完成的交易提交評價';
        END IF;

        IF p_user_id NOT IN (v_member_order.buyer_id, v_member_order.seller_id) THEN
            RAISE EXCEPTION '您非此筆交易的關係人';
        END IF;

        IF p_user_id = v_member_order.buyer_id THEN
            v_expected_reviewee := v_member_order.seller_id;
        ELSE
            v_expected_reviewee := v_member_order.buyer_id;
        END IF;

        IF p_reviewee_id <> v_expected_reviewee THEN
            RAISE EXCEPTION '被評價對象與此訂單不符';
        END IF;

        IF EXISTS (
            SELECT 1
            FROM public.transaction_reviews r
            WHERE r.reviewer_id = p_user_id
              AND r.member_order_id = p_order_id
        ) THEN
            RAISE EXCEPTION '您已評價過此筆交易';
        END IF;

        SELECT CASE
            WHEN p.role = 'merchant' THEN 'merchant'::public.review_persona
            ELSE 'member'::public.review_persona
        END
        INTO v_reviewee_persona
        FROM public.profiles p
        WHERE p.id = p_reviewee_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION '找不到被評價用戶';
        END IF;

        INSERT INTO public.transaction_reviews (
            reviewer_id,
            reviewee_id,
            reviewee_persona,
            member_order_id,
            merchant_order_id,
            rating,
            comment,
            is_public
        )
        VALUES (
            p_user_id,
            p_reviewee_id,
            v_reviewee_persona,
            p_order_id,
            NULL,
            p_rating,
            v_trimmed_comment,
            true
        )
        RETURNING id INTO v_review_id;

        RETURN jsonb_build_object('success', true, 'review_id', v_review_id);
    END IF;

    SELECT * INTO v_merchant_order
    FROM public.merchant_orders
    WHERE id = p_order_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到此訂單';
    END IF;

    IF v_merchant_order.escrow_status <> 'completed_and_transferred' THEN
        RAISE EXCEPTION '僅能對已完成的交易提交評價';
    END IF;

    IF p_user_id NOT IN (v_merchant_order.buyer_id, v_merchant_order.merchant_id) THEN
        RAISE EXCEPTION '您非此筆交易的關係人';
    END IF;

    IF p_user_id = v_merchant_order.buyer_id THEN
        v_expected_reviewee := v_merchant_order.merchant_id;
    ELSE
        v_expected_reviewee := v_merchant_order.buyer_id;
    END IF;

    IF p_reviewee_id <> v_expected_reviewee THEN
        RAISE EXCEPTION '被評價對象與此訂單不符';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM public.transaction_reviews r
        WHERE r.reviewer_id = p_user_id
          AND r.merchant_order_id = p_order_id
    ) THEN
        RAISE EXCEPTION '您已評價過此筆交易';
    END IF;

    SELECT CASE
        WHEN p.role = 'merchant' THEN 'merchant'::public.review_persona
        ELSE 'member'::public.review_persona
    END
    INTO v_reviewee_persona
    FROM public.profiles p
    WHERE p.id = p_reviewee_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION '找不到被評價用戶';
    END IF;

    INSERT INTO public.transaction_reviews (
        reviewer_id,
        reviewee_id,
        reviewee_persona,
        member_order_id,
        merchant_order_id,
        rating,
        comment,
        is_public
    )
    VALUES (
        p_user_id,
        p_reviewee_id,
        v_reviewee_persona,
        NULL,
        p_order_id,
        p_rating,
        v_trimmed_comment,
        true
    )
    RETURNING id INTO v_review_id;

    RETURN jsonb_build_object('success', true, 'review_id', v_review_id);
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_get_user_reviewed_member_order_ids(UUID[]) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.rpc_submit_transaction_review(UUID, UUID, INTEGER, TEXT, UUID) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.rpc_get_user_reviewed_member_order_ids(UUID[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rpc_submit_transaction_review(UUID, UUID, INTEGER, TEXT, UUID) TO authenticated, service_role;
