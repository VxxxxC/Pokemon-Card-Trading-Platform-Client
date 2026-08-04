-- Admin moderation: one open/reviewing case per subject (no 7d window),
-- merge duplicate open cases, subject history RPC.

-- ---------------------------------------------------------------------------
-- 1. Merge duplicate open/reviewing cases per subject (keeper = oldest)
-- ---------------------------------------------------------------------------

DO $$
DECLARE
  v_subject UUID;
  v_keeper UUID;
  v_dup UUID;
BEGIN
  FOR v_subject IN
    SELECT mc.subject_user_id
    FROM public.moderation_cases mc
    WHERE mc.status IN ('open', 'reviewing')
    GROUP BY mc.subject_user_id
    HAVING COUNT(*) > 1
  LOOP
    SELECT mc.id
    INTO v_keeper
    FROM public.moderation_cases mc
    WHERE mc.subject_user_id = v_subject
      AND mc.status IN ('open', 'reviewing')
    ORDER BY mc.created_at ASC
    LIMIT 1;

    FOR v_dup IN
      SELECT mc.id
      FROM public.moderation_cases mc
      WHERE mc.subject_user_id = v_subject
        AND mc.status IN ('open', 'reviewing')
        AND mc.id <> v_keeper
      ORDER BY mc.created_at ASC
    LOOP
      UPDATE public.reports r
      SET case_id = v_keeper
      WHERE r.case_id = v_dup;

      IF NOT EXISTS (
        SELECT 1
        FROM public.reports r
        WHERE r.case_id = v_dup
      ) THEN
        DELETE FROM public.moderation_cases mc
        WHERE mc.id = v_dup;
      END IF;
    END LOOP;

    PERFORM public._recompute_moderation_case_scores(v_keeper);
  END LOOP;
END;
$$;

-- ---------------------------------------------------------------------------
-- 2. Unique partial index — at most one open/reviewing case per subject
-- ---------------------------------------------------------------------------

DROP INDEX IF EXISTS public.idx_moderation_cases_subject_open;

CREATE UNIQUE INDEX idx_moderation_cases_subject_open_unique
  ON public.moderation_cases (subject_user_id)
  WHERE status IN ('open', 'reviewing');

-- ---------------------------------------------------------------------------
-- 3. _find_or_create_moderation_case — no 7d window, oldest first, race-safe
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public._find_or_create_moderation_case(
  p_subject_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_case_id UUID;
  v_case_number TEXT;
BEGIN
  SELECT mc.id
  INTO v_case_id
  FROM public.moderation_cases mc
  WHERE mc.subject_user_id = p_subject_user_id
    AND mc.status IN ('open', 'reviewing')
  ORDER BY mc.created_at ASC
  LIMIT 1;

  IF v_case_id IS NOT NULL THEN
    RETURN v_case_id;
  END IF;

  v_case_number := public._moderation_next_case_number();

  BEGIN
    INSERT INTO public.moderation_cases (
      case_number,
      subject_user_id,
      status
    )
    VALUES (
      v_case_number,
      p_subject_user_id,
      'open'
    )
    RETURNING id INTO v_case_id;

    RETURN v_case_id;
  EXCEPTION
    WHEN unique_violation THEN
      SELECT mc.id
      INTO v_case_id
      FROM public.moderation_cases mc
      WHERE mc.subject_user_id = p_subject_user_id
        AND mc.status IN ('open', 'reviewing')
      ORDER BY mc.created_at ASC
      LIMIT 1;

      IF v_case_id IS NULL THEN
        RAISE;
      END IF;

      RETURN v_case_id;
  END;
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Subject moderation history (admin read-only)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_get_subject_moderation_history(
  p_subject_user_id UUID,
  p_exclude_case_id UUID DEFAULT NULL,
  p_case_limit INT DEFAULT 10,
  p_sanction_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id UUID;
  v_stats JSONB;
  v_prior_cases JSONB;
  v_sanction_history JSONB;
  v_case_limit INT;
  v_sanction_limit INT;
BEGIN
  v_admin_id := public._grading_require_admin();

  v_case_limit := LEAST(GREATEST(COALESCE(p_case_limit, 10), 1), 50);
  v_sanction_limit := LEAST(GREATEST(COALESCE(p_sanction_limit, 20), 1), 100);

  SELECT jsonb_build_object(
    'priorCaseCount', COUNT(*)::INT,
    'upheldCount', COUNT(*) FILTER (WHERE mc.resolution = 'upheld')::INT,
    'dismissedCount', COUNT(*) FILTER (
      WHERE mc.resolution IN ('dismissed', 'insufficient_evidence')
    )::INT,
    'reportsLast90Days', (
      SELECT COUNT(*)::INT
      FROM public.reports r
      JOIN public.moderation_cases mc2 ON mc2.id = r.case_id
      WHERE mc2.subject_user_id = p_subject_user_id
        AND r.created_at > (now() - INTERVAL '90 days')
    ),
    'distinctSanctionTypes', COALESCE(
      (
        SELECT jsonb_agg(sub.type ORDER BY sub.type)
        FROM (
          SELECT DISTINCT s.type::TEXT AS type
          FROM public.account_sanctions s
          WHERE s.user_id = p_subject_user_id
        ) sub
      ),
      '[]'::JSONB
    )
  )
  INTO v_stats
  FROM public.moderation_cases mc
  WHERE mc.subject_user_id = p_subject_user_id
    AND (p_exclude_case_id IS NULL OR mc.id <> p_exclude_case_id);

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', pc.id,
        'caseNumber', pc.case_number,
        'status', pc.status,
        'primaryCategory', pc.primary_category,
        'finalScore', pc.final_score,
        'resolution', pc.resolution,
        'createdAt', pc.created_at,
        'resolvedAt', pc.resolved_at
      )
      ORDER BY pc.resolved_at DESC NULLS LAST, pc.created_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_prior_cases
  FROM (
    SELECT
      mc.id,
      mc.case_number,
      mc.status,
      mc.primary_category,
      mc.final_score,
      mc.resolution,
      mc.created_at,
      mc.resolved_at
    FROM public.moderation_cases mc
    WHERE mc.subject_user_id = p_subject_user_id
      AND (p_exclude_case_id IS NULL OR mc.id <> p_exclude_case_id)
    ORDER BY mc.resolved_at DESC NULLS LAST, mc.created_at DESC
    LIMIT v_case_limit
  ) pc;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'id', sh.id,
        'scope', sh.scope,
        'type', sh.type,
        'caseId', sh.case_id,
        'caseNumber', sh.case_number,
        'startsAt', sh.starts_at,
        'endsAt', sh.ends_at,
        'revokedAt', sh.revoked_at,
        'reason', sh.reason,
        'status', sh.status
      )
      ORDER BY sh.starts_at DESC
    ),
    '[]'::JSONB
  )
  INTO v_sanction_history
  FROM (
    SELECT
      s.id,
      s.scope,
      s.type,
      s.case_id,
      mc.case_number,
      s.starts_at,
      s.ends_at,
      s.revoked_at,
      s.reason,
      CASE
        WHEN s.revoked_at IS NOT NULL THEN 'revoked'
        WHEN s.ends_at IS NOT NULL AND s.ends_at <= now() THEN 'expired'
        ELSE 'active'
      END AS status
    FROM public.account_sanctions s
    LEFT JOIN public.moderation_cases mc ON mc.id = s.case_id
    WHERE s.user_id = p_subject_user_id
    ORDER BY s.starts_at DESC
    LIMIT v_sanction_limit
  ) sh;

  RETURN jsonb_build_object(
    'subjectUserId', p_subject_user_id,
    'stats', COALESCE(v_stats, jsonb_build_object(
      'priorCaseCount', 0,
      'upheldCount', 0,
      'dismissedCount', 0,
      'reportsLast90Days', 0,
      'distinctSanctionTypes', '[]'::JSONB
    )),
    'priorCases', COALESCE(v_prior_cases, '[]'::JSONB),
    'sanctionHistory', COALESCE(v_sanction_history, '[]'::JSONB)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.admin_get_subject_moderation_history(
  UUID,
  UUID,
  INT,
  INT
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_get_subject_moderation_history(
  UUID,
  UUID,
  INT,
  INT
) TO authenticated, service_role;
