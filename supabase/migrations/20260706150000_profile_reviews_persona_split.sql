-- Profile reviews: dual-persona rating split + public paginated read RPC
-- Member persona → profiles.rating_score (C2C + B2C buyer-side reviews)
-- Merchant persona → merchant_shops.rating_score (B2C seller-side reviews)

-- ========================================================
-- 1. Backfill reviewee_persona from order context
-- ========================================================

UPDATE public.transaction_reviews
SET reviewee_persona = 'member'::public.review_persona
WHERE member_order_id IS NOT NULL;

UPDATE public.transaction_reviews r
SET reviewee_persona = 'merchant'::public.review_persona
FROM public.merchant_orders mo
WHERE r.merchant_order_id = mo.id
  AND r.reviewee_id = mo.merchant_id;

UPDATE public.transaction_reviews r
SET reviewee_persona = 'member'::public.review_persona
FROM public.merchant_orders mo
WHERE r.merchant_order_id = mo.id
  AND r.reviewee_id = mo.buyer_id;

-- ========================================================
-- 2. Recalculate denormalized rating scores per persona
-- ========================================================

UPDATE public.profiles p
SET rating_score = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 1)
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = p.id
      AND r.is_public = true
      AND r.reviewee_persona = 'member'::public.review_persona
), 0.0);

UPDATE public.merchant_shops ms
SET rating_score = COALESCE((
    SELECT ROUND(AVG(r.rating)::numeric, 1)
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = ms.merchant_id
      AND r.is_public = true
      AND r.reviewee_persona = 'merchant'::public.review_persona
), 0.0);

CREATE INDEX IF NOT EXISTS idx_transaction_reviews_reviewee_persona_public
  ON public.transaction_reviews (reviewee_id, reviewee_persona, created_at DESC)
  WHERE is_public = true;

-- ========================================================
-- 3. Fix submit RPC — derive reviewee_persona from order context
-- ========================================================

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

    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_reviewee_id) THEN
        RAISE EXCEPTION '找不到被評價用戶';
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

        v_reviewee_persona := 'member'::public.review_persona;

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

    IF p_reviewee_id = v_merchant_order.merchant_id THEN
        v_reviewee_persona := 'merchant'::public.review_persona;
    ELSE
        v_reviewee_persona := 'member'::public.review_persona;
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

-- ========================================================
-- 4. Fix rating refresh trigger — split member vs merchant aggregates
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_refresh_profile_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_member_avg NUMERIC;
    v_merchant_avg NUMERIC;
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_public = false THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        IF NEW.is_public = false OR NEW.is_public IS NOT DISTINCT FROM OLD.is_public THEN
            RETURN NEW;
        END IF;
    END IF;

    SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0)
    INTO v_member_avg
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = NEW.reviewee_id
      AND r.is_public = true
      AND r.reviewee_persona = 'member'::public.review_persona;

    UPDATE public.profiles p
    SET rating_score = v_member_avg
    WHERE p.id = NEW.reviewee_id;

    SELECT COALESCE(ROUND(AVG(r.rating)::numeric, 1), 0.0)
    INTO v_merchant_avg
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = NEW.reviewee_id
      AND r.is_public = true
      AND r.reviewee_persona = 'merchant'::public.review_persona;

    UPDATE public.merchant_shops ms
    SET rating_score = v_merchant_avg
    WHERE ms.merchant_id = NEW.reviewee_id;

    PERFORM public.fn_recalculate_reputation_tags(NEW.reviewee_id);

    RETURN NEW;
END;
$$;

-- ========================================================
-- 5. Fix reputation tags — member badges use member-persona reviews only
-- ========================================================

CREATE OR REPLACE FUNCTION public.fn_recalculate_reputation_tags(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_platform_launch TIMESTAMPTZ := '2026-07-01T00:00:00+08:00'::timestamptz;

    v_buyer_trades INT := 0;
    v_has_merchant_shop BOOLEAN := false;
    v_seller_trades INT := 0;
    v_profile_rating NUMERIC := 0.0;
    v_merchant_rating NUMERIC := 5.0;
    v_created_at TIMESTAMPTZ;
    v_total_collection_cards INT := 0;
    v_longest_streak INT := 0;

    v_public_review_count INT := 0;
    v_five_star_review_count INT := 0;
    v_has_sub_four_star_review BOOLEAN := false;
    v_offer_count INT := 0;

    v_member_level INT := NULL;
    v_merchant_level INT := NULL;
    v_badges JSONB := '[]'::jsonb;
    v_final_payload JSONB;
BEGIN
    SELECT completed_trades_count, rating_score, created_at
    INTO v_buyer_trades, v_profile_rating, v_created_at
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT
        ms.completed_trades_count,
        ms.rating_score
    INTO
        v_seller_trades,
        v_merchant_rating
    FROM public.merchant_shops ms
    WHERE ms.merchant_id = p_user_id;

    v_has_merchant_shop := FOUND;

    SELECT COALESCE(SUM(quantity), 0)
    INTO v_total_collection_cards
    FROM public.user_collections
    WHERE user_id = p_user_id;

    SELECT COALESCE(longest_streak, 0)
    INTO v_longest_streak
    FROM public.gamification_stats
    WHERE user_id = p_user_id;

    SELECT
        COUNT(*)::int,
        COUNT(*) FILTER (WHERE rating = 5)::int,
        EXISTS (
            SELECT 1
            FROM public.transaction_reviews r2
            WHERE r2.reviewee_id = p_user_id
              AND r2.is_public = true
              AND r2.reviewee_persona = 'member'::public.review_persona
              AND r2.rating < 4
        )
    INTO
        v_public_review_count,
        v_five_star_review_count,
        v_has_sub_four_star_review
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = p_user_id
      AND r.is_public = true
      AND r.reviewee_persona = 'member'::public.review_persona;

    SELECT COUNT(*)::int
    INTO v_offer_count
    FROM public.offers o
    WHERE o.buyer_id = p_user_id
      AND o.status IN ('pending', 'accepted');

    IF v_buyer_trades >= 500 THEN v_member_level := 4;
    ELSIF v_buyer_trades >= 200 THEN v_member_level := 3;
    ELSIF v_buyer_trades >= 50 THEN v_member_level := 2;
    ELSIF v_buyer_trades >= 1 THEN v_member_level := 1;
    END IF;

    IF v_has_merchant_shop THEN
        v_merchant_level := 1;

        IF v_seller_trades >= 500 AND v_merchant_rating >= 4.95 THEN
            v_merchant_level := 4;
        ELSIF v_seller_trades >= 200 AND v_merchant_rating >= 4.85 THEN
            v_merchant_level := 3;
        ELSIF v_seller_trades >= 50 AND v_merchant_rating >= 4.7 THEN
            v_merchant_level := 2;
        END IF;
    END IF;

    IF v_created_at >= v_platform_launch
       AND v_created_at < v_platform_launch + INTERVAL '30 days' THEN
        v_badges := v_badges || jsonb_build_array('FOUNDING_MEMBER');
    END IF;

    IF v_created_at <= (NOW() - INTERVAL '365 days') THEN
        v_badges := v_badges || jsonb_build_array('ANNUAL_VETERAN');
    END IF;

    IF v_public_review_count >= 50 AND NOT v_has_sub_four_star_review THEN
        v_badges := v_badges || jsonb_build_array('FLAWLESS_REPUTATION');
    END IF;

    IF v_five_star_review_count >= 100 THEN
        v_badges := v_badges || jsonb_build_array('HIGHLY_RECOMMENDED');
    END IF;

    IF v_total_collection_cards >= 10000 THEN
        v_badges := v_badges || jsonb_build_array('THE_VAULT_TYCOON');
    ELSIF v_total_collection_cards >= 1000 THEN
        v_badges := v_badges || jsonb_build_array('VOLUME_COLLECTOR');
    ELSIF v_total_collection_cards >= 100 THEN
        v_badges := v_badges || jsonb_build_array('CENTURY_CURATOR');
    END IF;

    IF v_longest_streak >= 30 THEN
        v_badges := v_badges || jsonb_build_array('DAILY_ACTIVE_ENTHUSIAST');
    END IF;

    IF v_offer_count >= 30 THEN
        v_badges := v_badges || jsonb_build_array('MARKET_PRICE_HUNTER');
    END IF;

    v_final_payload := jsonb_build_object(
        'core_main_member', v_member_level,
        'core_main_merchant', v_merchant_level,
        'activity_badges', v_badges
    );

    UPDATE public.profiles
    SET reputation_tag = v_final_payload,
        updated_at = NOW()
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================================
-- 6. Public paginated review list RPC (anon + authenticated)
-- ========================================================

CREATE OR REPLACE FUNCTION public.search_public_profile_reviews(
  p_profile_id UUID,
  p_persona public.review_persona,
  p_sort TEXT DEFAULT 'date-desc',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  review_id UUID,
  rating INTEGER,
  comment TEXT,
  created_at TIMESTAMPTZ,
  is_merchant_tx BOOLEAN,
  reviewer_id UUID,
  reviewer_display_name TEXT,
  reviewer_username TEXT,
  reviewer_avatar_path TEXT,
  aggregate_rating NUMERIC,
  public_review_count BIGINT,
  total_count BIGINT,
  page INTEGER,
  page_size INTEGER,
  total_pages INTEGER,
  range_start INTEGER,
  range_end INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      p_profile_id AS profile_id,
      p_persona AS persona,
      COALESCE(NULLIF(trim(p_sort), ''), 'date-desc') AS sort_key,
      GREATEST(COALESCE(p_page, 1), 1) AS page,
      LEAST(GREATEST(COALESCE(p_page_size, 10), 1), 50) AS page_size
  ),
  profile_exists AS (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles pr WHERE pr.id = (SELECT profile_id FROM params)
    ) AS found
  ),
  filtered AS (
    SELECT
      r.id AS review_id,
      r.rating,
      r.comment,
      r.created_at,
      (r.merchant_order_id IS NOT NULL) AS is_merchant_tx,
      r.reviewer_id,
      reviewer.display_name AS reviewer_display_name,
      reviewer.username AS reviewer_username,
      reviewer.avatar_path AS reviewer_avatar_path
    FROM public.transaction_reviews r
    INNER JOIN public.profiles reviewer ON reviewer.id = r.reviewer_id
    CROSS JOIN params p
    CROSS JOIN profile_exists pe
    WHERE pe.found
      AND r.reviewee_id = p.profile_id
      AND r.reviewee_persona = p.persona
      AND r.is_public = true
      AND (
        p.persona = 'member'::public.review_persona
        OR EXISTS (
          SELECT 1
          FROM public.merchant_shops ms
          WHERE ms.merchant_id = p.profile_id
        )
      )
  ),
  counts AS (
    SELECT COUNT(*)::bigint AS total_count
    FROM filtered
  ),
  paged AS (
    SELECT
      f.*,
      c.total_count,
      params.page,
      params.page_size,
      GREATEST(1, CEIL(c.total_count::numeric / NULLIF(params.page_size, 0)))::integer AS total_pages
    FROM filtered f
    CROSS JOIN counts c
    CROSS JOIN params
    ORDER BY
      CASE WHEN params.sort_key = 'rating-desc' THEN f.rating END DESC NULLS LAST,
      CASE WHEN params.sort_key = 'rating-asc' THEN f.rating END ASC NULLS LAST,
      CASE WHEN params.sort_key = 'date-asc' THEN f.created_at END ASC NULLS LAST,
      CASE WHEN params.sort_key = 'date-desc' THEN f.created_at END DESC NULLS LAST,
      f.review_id DESC
    LIMIT (SELECT page_size FROM params)
    OFFSET (SELECT (page - 1) * page_size FROM params)
  ),
  aggregates AS (
    SELECT
      CASE
        WHEN (SELECT persona FROM params) = 'merchant'::public.review_persona THEN
          (SELECT ms.rating_score FROM public.merchant_shops ms
           WHERE ms.merchant_id = (SELECT profile_id FROM params))
        ELSE
          (SELECT pr.rating_score FROM public.profiles pr
           WHERE pr.id = (SELECT profile_id FROM params))
      END AS aggregate_rating,
      (SELECT COUNT(*)::bigint
       FROM public.transaction_reviews r
       CROSS JOIN params p
       WHERE r.reviewee_id = p.profile_id
         AND r.reviewee_persona = p.persona
         AND r.is_public = true) AS public_review_count
  )
  SELECT
    pg.review_id,
    pg.rating,
    pg.comment,
    pg.created_at,
    pg.is_merchant_tx,
    pg.reviewer_id,
    pg.reviewer_display_name,
    pg.reviewer_username,
    pg.reviewer_avatar_path,
    agg.aggregate_rating,
    agg.public_review_count,
    pg.total_count,
    pg.page,
    pg.page_size,
    pg.total_pages,
    CASE
      WHEN pg.total_count = 0 THEN 0
      ELSE ((pg.page - 1) * pg.page_size + 1)::integer
    END AS range_start,
    CASE
      WHEN pg.total_count = 0 THEN 0
      ELSE LEAST((pg.page * pg.page_size)::integer, pg.total_count::integer)
    END AS range_end
  FROM paged pg
  CROSS JOIN aggregates agg;
$$;

REVOKE ALL ON FUNCTION public.search_public_profile_reviews(UUID, public.review_persona, TEXT, INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_public_profile_reviews(UUID, public.review_persona, TEXT, INTEGER, INTEGER)
  TO anon, authenticated, service_role;
