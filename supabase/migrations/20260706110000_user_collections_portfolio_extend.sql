-- Extend user_collections for per-card portfolio tracking (grade + purchase price; no photos)

ALTER TABLE public.user_collections
  ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS grading_company TEXT NOT NULL DEFAULT 'RAW',
  ADD COLUMN IF NOT EXISTS grading_score TEXT NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS purchase_price NUMERIC(12,2) NOT NULL DEFAULT 0;

UPDATE public.user_collections
SET id = gen_random_uuid()
WHERE id IS NULL;

ALTER TABLE public.user_collections
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE public.user_collections
  DROP CONSTRAINT IF EXISTS user_collections_pkey;

ALTER TABLE public.user_collections
  DROP CONSTRAINT IF EXISTS user_collections_user_id_product_id_key;

ALTER TABLE public.user_collections
  DROP CONSTRAINT IF EXISTS user_collections_pkey1;

ALTER TABLE public.user_collections
  ADD CONSTRAINT user_collections_pkey PRIMARY KEY (id);

ALTER TABLE public.user_collections
  DROP COLUMN IF EXISTS quantity;

CREATE INDEX IF NOT EXISTS idx_user_collections_user_created
  ON public.user_collections (user_id, created_at DESC);

ALTER TABLE public.user_collections ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_collections TO authenticated;

DROP POLICY IF EXISTS collections_owner ON public.user_collections;

CREATE POLICY collections_owner ON public.user_collections
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reputation badge: count collection rows instead of SUM(quantity)
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

    SELECT COALESCE(COUNT(*)::int, 0)
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
              AND r2.rating < 4
        )
    INTO
        v_public_review_count,
        v_five_star_review_count,
        v_has_sub_four_star_review
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = p_user_id
      AND r.is_public = true;

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
