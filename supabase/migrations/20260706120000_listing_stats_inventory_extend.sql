-- listing_stats: slim to views + offers_count; seller read RLS; init trigger

-- 1. offers_count column
ALTER TABLE public.listing_stats
  ADD COLUMN IF NOT EXISTS offers_count INTEGER NOT NULL DEFAULT 0;

-- 2. Normalize views + backfill offers_count
UPDATE public.listing_stats
SET
  views = COALESCE(views, 0),
  offers_count = COALESCE(
    offers_count,
    (
      SELECT COUNT(*)::int
      FROM public.offers o
      WHERE o.listing_id = listing_stats.listing_id
    ),
    0
  );

ALTER TABLE public.listing_stats
  ALTER COLUMN views SET DEFAULT 0;

ALTER TABLE public.listing_stats
  ALTER COLUMN views SET NOT NULL;

-- 3. Drop legacy columns
ALTER TABLE public.listing_stats DROP COLUMN IF EXISTS likes;
ALTER TABLE public.listing_stats DROP COLUMN IF EXISTS trade_records_count;

-- 4. FK to listings (skip if already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'listing_stats_listing_id_fkey'
      AND conrelid = 'public.listing_stats'::regclass
  ) THEN
    ALTER TABLE public.listing_stats
      ADD CONSTRAINT listing_stats_listing_id_fkey
      FOREIGN KEY (listing_id) REFERENCES public.listings (id) ON DELETE CASCADE;
  END IF;
END;
$$;

-- 5. Init stats row on new listing
CREATE OR REPLACE FUNCTION public.fn_init_listing_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.listing_stats (listing_id, views, offers_count)
  VALUES (NEW.id, 0, 0)
  ON CONFLICT (listing_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_init_listing_stats ON public.listings;

CREATE TRIGGER trigger_init_listing_stats
  AFTER INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_init_listing_stats();

-- 6. Backfill missing stats rows for existing listings
INSERT INTO public.listing_stats (listing_id, views, offers_count)
SELECT
  l.id,
  0,
  COALESCE((
    SELECT COUNT(*)::int
    FROM public.offers o
    WHERE o.listing_id = l.id
  ), 0)
FROM public.listings l
WHERE NOT EXISTS (
  SELECT 1
  FROM public.listing_stats s
  WHERE s.listing_id = l.id
);

-- 7. RLS: sellers read own listing stats
ALTER TABLE public.listing_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS listing_stats_seller_read ON public.listing_stats;

CREATE POLICY listing_stats_seller_read
  ON public.listing_stats
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.listings l
      WHERE l.id = listing_stats.listing_id
        AND l.seller_id = auth.uid()
    )
  );

GRANT SELECT ON public.listing_stats TO authenticated;
