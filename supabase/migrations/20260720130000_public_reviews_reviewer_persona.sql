-- Public profile reviews: derive reviewer persona + merchant shop display for dual-identity users.

DROP FUNCTION IF EXISTS public.search_public_profile_reviews(
  UUID,
  public.review_persona,
  TEXT,
  INTEGER,
  INTEGER
);

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
  reviewer_persona public.review_persona,
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
      CASE
        WHEN r.merchant_order_id IS NOT NULL AND r.reviewer_id = mo.merchant_id THEN
          'merchant'::public.review_persona
        ELSE
          'member'::public.review_persona
      END AS reviewer_persona,
      CASE
        WHEN r.merchant_order_id IS NOT NULL AND r.reviewer_id = mo.merchant_id THEN
          COALESCE(NULLIF(trim(ms.shop_name), ''), reviewer.display_name)
        ELSE
          reviewer.display_name
      END AS reviewer_display_name,
      CASE
        WHEN r.merchant_order_id IS NOT NULL AND r.reviewer_id = mo.merchant_id THEN
          ms.shop_handle
        ELSE
          reviewer.username
      END AS reviewer_username,
      CASE
        WHEN r.merchant_order_id IS NOT NULL AND r.reviewer_id = mo.merchant_id THEN
          ms.shop_avatar_path
        ELSE
          reviewer.avatar_path
      END AS reviewer_avatar_path
    FROM public.transaction_reviews r
    INNER JOIN public.profiles reviewer ON reviewer.id = r.reviewer_id
    LEFT JOIN public.merchant_orders mo ON mo.id = r.merchant_order_id
    LEFT JOIN public.merchant_shops ms ON ms.merchant_id = r.reviewer_id
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
          FROM public.merchant_shops ms_check
          WHERE ms_check.merchant_id = p.profile_id
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
    pg.reviewer_persona,
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
