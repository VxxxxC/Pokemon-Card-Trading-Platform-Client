-- Double-blind reviews: is_public stays false until BOTH parties rate the same order.

-- Remove leaky legacy policy if present (exposes all reviews)
DROP POLICY IF EXISTS "Allow public read reviews" ON public.transaction_reviews;

DROP POLICY IF EXISTS "transaction_reviews_authenticated_read" ON public.transaction_reviews;
CREATE POLICY "transaction_reviews_authenticated_read"
  ON public.transaction_reviews
  FOR SELECT
  TO authenticated
  USING (
    reviewer_id = auth.uid()
    OR is_public = true
  );

-- Only refresh public rating_score when a review is public (insert) or newly revealed (update)
CREATE OR REPLACE FUNCTION public.fn_refresh_profile_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_public = false THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.is_public = false OR NEW.is_public IS NOT DISTINCT FROM OLD.is_public THEN
            RETURN NEW;
        END IF;
    END IF;

    UPDATE public.profiles p
    SET rating_score = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM public.transaction_reviews r
        WHERE r.reviewee_id = p.id
          AND r.is_public = true
    ), 0.0)
    WHERE p.id = NEW.reviewee_id;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_on_review_insert_refresh_rating ON public.transaction_reviews;

CREATE TRIGGER tr_on_review_insert_refresh_rating
    AFTER INSERT OR UPDATE OF is_public ON public.transaction_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_refresh_profile_rating_on_review();

-- Reveal both reviews on an order once buyer + seller each submitted exactly one review
CREATE OR REPLACE FUNCTION public.fn_try_reveal_order_reviews(
    p_order_id UUID,
    p_order_kind TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_participant_review_count INTEGER;
BEGIN
    IF p_order_kind = 'member' THEN
        SELECT COUNT(*)::INTEGER INTO v_participant_review_count
        FROM public.transaction_reviews r
        INNER JOIN public.member_orders mo ON mo.id = r.member_order_id
        WHERE r.member_order_id = p_order_id
          AND r.reviewer_id IN (mo.buyer_id, mo.seller_id)
          AND r.reviewee_id IN (mo.buyer_id, mo.seller_id)
          AND r.reviewer_id <> r.reviewee_id;

        IF v_participant_review_count < 2 THEN
            RETURN false;
        END IF;

        UPDATE public.transaction_reviews
        SET is_public = true
        WHERE member_order_id = p_order_id
          AND is_public = false;

        RETURN true;
    END IF;

    IF p_order_kind = 'merchant' THEN
        SELECT COUNT(*)::INTEGER INTO v_participant_review_count
        FROM public.transaction_reviews r
        INNER JOIN public.merchant_orders mo ON mo.id = r.merchant_order_id
        WHERE r.merchant_order_id = p_order_id
          AND r.reviewer_id IN (mo.buyer_id, mo.merchant_id)
          AND r.reviewee_id IN (mo.buyer_id, mo.merchant_id)
          AND r.reviewer_id <> r.reviewee_id;

        IF v_participant_review_count < 2 THEN
            RETURN false;
        END IF;

        UPDATE public.transaction_reviews
        SET is_public = true
        WHERE merchant_order_id = p_order_id
          AND is_public = false;

        RETURN true;
    END IF;

    RETURN false;
END;
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
    v_revealed BOOLEAN;
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
            false
        )
        RETURNING id INTO v_review_id;

        v_revealed := public.fn_try_reveal_order_reviews(p_order_id, 'member');

        RETURN jsonb_build_object(
            'success', true,
            'review_id', v_review_id,
            'revealed', v_revealed
        );
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
        false
    )
    RETURNING id INTO v_review_id;

    v_revealed := public.fn_try_reveal_order_reviews(p_order_id, 'merchant');

    RETURN jsonb_build_object(
        'success', true,
        'review_id', v_review_id,
        'revealed', v_revealed
    );
END;
$$;

REVOKE ALL ON FUNCTION public.fn_try_reveal_order_reviews(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_try_reveal_order_reviews(UUID, TEXT) TO service_role;
