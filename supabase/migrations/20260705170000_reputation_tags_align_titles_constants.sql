-- ========================================================
-- Align fn_recalculate_reputation_tags with lib/constants/titles.ts
-- Store title levels + badge IDs; recalc on all qualifying state changes
-- PLATFORM_LAUNCH_AT must stay in sync with lib/constants/titles.ts
-- ========================================================

-- Remote DB may enforce legacy nameZh payload; drop before backfill, re-add after
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS chk_reputation_tag_structure;

CREATE OR REPLACE FUNCTION public.fn_recalculate_reputation_tags(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    -- Synced with lib/constants/titles.ts PLATFORM_LAUNCH_AT
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

    -- Member main title (MEMBER_TITLES thresholds: 1 / 50 / 200 / 500)
    IF v_buyer_trades >= 500 THEN v_member_level := 4;
    ELSIF v_buyer_trades >= 200 THEN v_member_level := 3;
    ELSIF v_buyer_trades >= 50 THEN v_member_level := 2;
    ELSIF v_buyer_trades >= 1 THEN v_member_level := 1;
    END IF;

    -- Merchant main title (MERCHANT_TITLES; L1 = KYC-verified shop baseline)
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

    -- FOUNDING_MEMBER: registered within platform launch first 30 days
    IF v_created_at >= v_platform_launch
       AND v_created_at < v_platform_launch + INTERVAL '30 days' THEN
        v_badges := v_badges || jsonb_build_array('FOUNDING_MEMBER');
    END IF;

    -- ANNUAL_VETERAN: account age >= 365 days
    IF v_created_at <= (NOW() - INTERVAL '365 days') THEN
        v_badges := v_badges || jsonb_build_array('ANNUAL_VETERAN');
    END IF;

    -- FLAWLESS_REPUTATION: >= 50 public reviews, 100% positive (rating >= 4)
    IF v_public_review_count >= 50 AND NOT v_has_sub_four_star_review THEN
        v_badges := v_badges || jsonb_build_array('FLAWLESS_REPUTATION');
    END IF;

    -- HIGHLY_RECOMMENDED: >= 100 five-star public reviews
    IF v_five_star_review_count >= 100 THEN
        v_badges := v_badges || jsonb_build_array('HIGHLY_RECOMMENDED');
    END IF;

    -- Collection badges
    IF v_total_collection_cards >= 10000 THEN
        v_badges := v_badges || jsonb_build_array('THE_VAULT_TYCOON');
    ELSIF v_total_collection_cards >= 1000 THEN
        v_badges := v_badges || jsonb_build_array('VOLUME_COLLECTOR');
    ELSIF v_total_collection_cards >= 100 THEN
        v_badges := v_badges || jsonb_build_array('CENTURY_CURATOR');
    END IF;

    -- DAILY_ACTIVE_ENTHUSIAST
    IF v_longest_streak >= 30 THEN
        v_badges := v_badges || jsonb_build_array('DAILY_ACTIVE_ENTHUSIAST');
    END IF;

    -- MARKET_PRICE_HUNTER: >= 30 instant offers queued or matched
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


-- Refresh reviewee ratings + reputation tags (profiles + merchant_shops)
CREATE OR REPLACE FUNCTION public.fn_refresh_profile_rating_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_avg_rating NUMERIC;
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
    INTO v_avg_rating
    FROM public.transaction_reviews r
    WHERE r.reviewee_id = NEW.reviewee_id
      AND r.is_public = true;

    UPDATE public.profiles p
    SET rating_score = v_avg_rating
    WHERE p.id = NEW.reviewee_id;

    UPDATE public.merchant_shops ms
    SET rating_score = v_avg_rating
    WHERE ms.merchant_id = NEW.reviewee_id;

    PERFORM public.fn_recalculate_reputation_tags(NEW.reviewee_id);

    RETURN NEW;
END;
$$;


-- Generic reputation refresh on collections, gamification, offers
CREATE OR REPLACE FUNCTION public.fn_trigger_reputation_tags_refresh()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF TG_TABLE_NAME = 'user_collections' THEN
        v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'gamification_stats' THEN
        v_user_id := COALESCE(NEW.user_id, OLD.user_id);
    ELSIF TG_TABLE_NAME = 'offers' THEN
        v_user_id := COALESCE(NEW.buyer_id, OLD.buyer_id);
    END IF;

    IF v_user_id IS NOT NULL THEN
        PERFORM public.fn_recalculate_reputation_tags(v_user_id);
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_user_collections_reputation_tags ON public.user_collections;
CREATE TRIGGER trg_user_collections_reputation_tags
    AFTER INSERT OR UPDATE OR DELETE ON public.user_collections
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trigger_reputation_tags_refresh();

DROP TRIGGER IF EXISTS trg_gamification_stats_reputation_tags ON public.gamification_stats;
CREATE TRIGGER trg_gamification_stats_reputation_tags
    AFTER INSERT OR UPDATE ON public.gamification_stats
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trigger_reputation_tags_refresh();

DROP TRIGGER IF EXISTS trg_offers_reputation_tags ON public.offers;
CREATE TRIGGER trg_offers_reputation_tags
    AFTER INSERT OR UPDATE OF status ON public.offers
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trigger_reputation_tags_refresh();


-- Initialize reputation_tag on signup
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

  PERFORM public.fn_recalculate_reputation_tags(NEW.id);

  RETURN NEW;
END;
$$;


-- Backfill all profiles to ID-based reputation_tag payload
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT id FROM public.profiles LOOP
        PERFORM public.fn_recalculate_reputation_tags(r.id);
    END LOOP;
END $$;

ALTER TABLE public.profiles ADD CONSTRAINT chk_reputation_tag_structure CHECK (
    reputation_tag IS NULL
    OR (
        jsonb_typeof(reputation_tag) = 'object'
        AND jsonb_typeof(reputation_tag -> 'activity_badges') = 'array'
        AND (
            NOT (reputation_tag ? 'core_main_member')
            OR jsonb_typeof(reputation_tag -> 'core_main_member') IN ('null', 'number')
        )
        AND (
            NOT (reputation_tag ? 'core_main_merchant')
            OR jsonb_typeof(reputation_tag -> 'core_main_merchant') IN ('null', 'number')
        )
    )
);
