-- Extend product_watchlists for wishlist tracking (grade, tracked/target price, alert fields)

ALTER TABLE public.product_watchlists
  ADD COLUMN IF NOT EXISTS grading_company TEXT NOT NULL DEFAULT 'RAW',
  ADD COLUMN IF NOT EXISTS grading_score TEXT NOT NULL DEFAULT 'A',
  ADD COLUMN IF NOT EXISTS tracked_price NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS target_price NUMERIC(12,2) NULL,
  ADD COLUMN IF NOT EXISTS alert_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS last_alerted_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Allow multiple grades per product per user
ALTER TABLE public.product_watchlists
  DROP CONSTRAINT IF EXISTS product_watchlists_pkey;

ALTER TABLE public.product_watchlists
  DROP CONSTRAINT IF EXISTS product_watchlists_user_id_product_id_key;

ALTER TABLE public.product_watchlists
  DROP CONSTRAINT IF EXISTS product_watchlists_user_product_grade_unique;

ALTER TABLE public.product_watchlists
  ADD CONSTRAINT product_watchlists_user_product_grade_unique
  UNIQUE (user_id, product_id, grading_company, grading_score);

ALTER TABLE public.product_watchlists ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_watchlists TO authenticated;

DROP POLICY IF EXISTS product_watchlists_select ON public.product_watchlists;
DROP POLICY IF EXISTS product_watchlists_insert ON public.product_watchlists;
DROP POLICY IF EXISTS product_watchlists_update ON public.product_watchlists;
DROP POLICY IF EXISTS product_watchlists_delete ON public.product_watchlists;

CREATE POLICY product_watchlists_select
  ON public.product_watchlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY product_watchlists_insert
  ON public.product_watchlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY product_watchlists_update
  ON public.product_watchlists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY product_watchlists_delete
  ON public.product_watchlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_product_watchlists_alert
  ON public.product_watchlists (product_id, grading_company, grading_score)
  WHERE target_price IS NOT NULL AND alert_enabled = TRUE;
