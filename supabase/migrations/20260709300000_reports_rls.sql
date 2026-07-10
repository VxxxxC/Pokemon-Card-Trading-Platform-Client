-- User reports: table (idempotent) + party-scoped RLS for authenticated submitters

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
      AND t.typname = 'report_state'
  ) THEN
    CREATE TYPE public.report_state AS ENUM (
      'pending',
      'reviewing',
      'resolved',
      'dismissed'
    );
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status public.report_state DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id
  ON public.reports (reporter_id);

CREATE INDEX IF NOT EXISTS idx_reports_target
  ON public.reports (target_type, target_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_pending_reporter_target
  ON public.reports (reporter_id, target_id)
  WHERE status = 'pending';

GRANT SELECT, INSERT ON public.reports TO authenticated;

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reports_reporter_read" ON public.reports;
CREATE POLICY "reports_reporter_read"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (reporter_id = auth.uid());

DROP POLICY IF EXISTS "reports_reporter_insert" ON public.reports;
CREATE POLICY "reports_reporter_insert"
  ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    reporter_id = auth.uid()
    AND target_type = 'user'
    AND target_id <> auth.uid()
  );
