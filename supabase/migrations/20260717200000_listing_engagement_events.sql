-- Listing engagement events: time-series for views + offers (dual-write with listing_stats)

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'listing_engagement_event_type'
      AND n.nspname = 'public'
  ) THEN
    CREATE TYPE public.listing_engagement_event_type AS ENUM ('view', 'offer');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.listing_engagement_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type public.listing_engagement_event_type NOT NULL,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_engagement_events_listing_occurred
  ON public.listing_engagement_events (listing_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_engagement_events_type_occurred
  ON public.listing_engagement_events (event_type, occurred_at DESC);

ALTER TABLE public.listing_engagement_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_engagement_events_seller_read ON public.listing_engagement_events;

CREATE POLICY listing_engagement_events_seller_read
  ON public.listing_engagement_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_engagement_events.listing_id
        AND l.seller_id = auth.uid()
    )
  );

GRANT SELECT ON public.listing_engagement_events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_engagement_events TO service_role;

DROP FUNCTION IF EXISTS public.fn_bump_listing_offers_count(uuid);

CREATE OR REPLACE FUNCTION public.rpc_increment_listing_view(p_listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
BEGIN
  v_actor_id := auth.uid();
  IF v_actor_id IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.status = 'active'
  ) THEN
    RETURN;
  END IF;

  UPDATE public.listing_stats
  SET
    views = views + 1,
    updated_at = now()
  WHERE listing_id = p_listing_id;

  IF NOT FOUND THEN
    INSERT INTO public.listing_stats (listing_id, views, offers_count)
    VALUES (p_listing_id, 1, 0)
    ON CONFLICT (listing_id) DO UPDATE
    SET
      views = public.listing_stats.views + 1,
      updated_at = now();
  END IF;

  INSERT INTO public.listing_engagement_events (
    listing_id,
    actor_id,
    event_type,
    occurred_at
  )
  VALUES (
    p_listing_id,
    v_actor_id,
    'view',
    now()
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fn_bump_listing_offers_count(
  p_listing_id UUID,
  p_actor_id UUID DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id uuid;
BEGIN
  v_actor_id := COALESCE(p_actor_id, auth.uid());

  UPDATE public.listing_stats
  SET
    offers_count = offers_count + 1,
    updated_at = now()
  WHERE listing_id = p_listing_id;

  IF NOT FOUND THEN
    INSERT INTO public.listing_stats (listing_id, views, offers_count)
    VALUES (p_listing_id, 0, 1)
    ON CONFLICT (listing_id) DO UPDATE
    SET
      offers_count = public.listing_stats.offers_count + 1,
      updated_at = now();
  END IF;

  INSERT INTO public.listing_engagement_events (
    listing_id,
    actor_id,
    event_type,
    occurred_at
  )
  VALUES (
    p_listing_id,
    v_actor_id,
    'offer',
    now()
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_increment_listing_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_increment_listing_view(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.fn_bump_listing_offers_count(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.fn_bump_listing_offers_count(UUID, UUID) TO service_role;
