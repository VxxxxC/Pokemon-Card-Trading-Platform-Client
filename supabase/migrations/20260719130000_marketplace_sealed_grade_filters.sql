-- Patch grade filters for product detail order book + seller storefront
-- Align OTHER+SEALED|UNSEALED logic with search_marketplace_products (20260719120000)

-- Product detail order book: active listings for one product with grading filters + sort + pagination

CREATE INDEX IF NOT EXISTS idx_listings_active_product_id
  ON public.listings (product_id)
  WHERE status = 'active';

CREATE OR REPLACE FUNCTION public.listing_grade_sort_score(
  grading_company text,
  grading_score text
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN upper(trim(coalesce(grading_company, ''))) IN ('RAW', 'RAW CARD') THEN 0
    ELSE coalesce(
      nullif(
        substring(coalesce(grading_score, '') from '([0-9]+(?:\.[0-9]+)?)'),
        ''
      )::numeric,
      0
    )
  END;
$$;

CREATE OR REPLACE FUNCTION public.get_marketplace_product_listings(
  p_product_id text,
  p_grade_filters jsonb DEFAULT NULL,
  p_only_graded boolean DEFAULT false,
  p_sort text DEFAULT 'price_asc',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 5
)
RETURNS TABLE (
  listing_id uuid,
  price numeric,
  grading_company text,
  grading_score text,
  seller_id uuid,
  seller_name text,
  seller_rating numeric,
  seller_total_trades integer,
  seller_persona public.seller_persona_type,
  use_authentication boolean,
  created_at timestamptz,
  filtered_lowest_price numeric,
  total_count bigint,
  page integer,
  page_size integer,
  total_pages integer,
  range_start integer,
  range_end integer
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      GREATEST(COALESCE(p_page, 1), 1) AS page,
      GREATEST(COALESCE(p_page_size, 5), 1) AS page_size
  ),
  filtered_listings AS (
    SELECT
      l.id AS listing_id,
      l.price,
      l.grading_company,
      l.grading_score,
      l.seller_id,
      l.seller_persona,
      l.use_authentication,
      l.created_at,
      p.display_name AS seller_name,
      p.rating_score AS seller_rating,
      p.total_trades AS seller_total_trades
    FROM public.listings l
    INNER JOIN public.profiles p ON p.id = l.seller_id
    WHERE l.status = 'active'
      AND l.product_id = p_product_id
      AND (
        p_only_graded = false
        OR upper(trim(l.grading_company)) NOT IN ('RAW', 'RAW CARD')
      )
      AND (
        p_grade_filters IS NULL
        OR jsonb_typeof(p_grade_filters) <> 'array'
        OR jsonb_array_length(p_grade_filters) = 0
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p_grade_filters) AS gf(filter)
          WHERE (
            upper(coalesce(filter->>'company', '')) = 'OTHER'
            AND coalesce(nullif(trim(filter->>'score'), ''), '') <> ''
            AND (
              (
                upper(l.grading_company) = 'OTHER'
                AND l.grading_score = trim(filter->>'score')
              )
              OR (
                upper(l.grading_company) = 'SEALED'
                AND trim(filter->>'score') = 'SEALED'
              )
            )
          )
          OR (
            upper(coalesce(filter->>'company', '')) = 'OTHER'
            AND coalesce(nullif(trim(filter->>'score'), ''), '') = ''
            AND upper(l.grading_company) NOT IN ('PSA', 'CGC', 'BGS', 'RAW')
          )
          OR (
            upper(coalesce(filter->>'company', '')) <> 'OTHER'
            AND upper(l.grading_company) = upper(coalesce(filter->>'company', ''))
            AND (
              coalesce(nullif(trim(filter->>'score'), ''), '') = ''
              OR l.grading_score = trim(filter->>'score')
            )
          )
        )
      )
  ),
  stats AS (
    SELECT
      COUNT(*)::bigint AS total_count,
      MIN(fl.price) AS filtered_lowest_price
    FROM filtered_listings fl
  ),
  paged AS (
    SELECT
      fl.*,
      s.total_count,
      s.filtered_lowest_price,
      params.page,
      params.page_size,
      GREATEST(CEIL(s.total_count::numeric / params.page_size::numeric), 0)::integer AS total_pages
    FROM filtered_listings fl
    CROSS JOIN stats s
    CROSS JOIN params
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN fl.price END ASC NULLS LAST,
      CASE
        WHEN p_sort = 'grade_desc' THEN public.listing_grade_sort_score(fl.grading_company, fl.grading_score)
      END DESC NULLS LAST,
      CASE WHEN p_sort = 'grade_desc' THEN fl.price END ASC NULLS LAST,
      CASE WHEN p_sort = 'rating_desc' THEN coalesce(fl.seller_rating, 0) END DESC NULLS LAST,
      CASE WHEN p_sort = 'rating_desc' THEN fl.price END ASC NULLS LAST,
      fl.created_at DESC,
      fl.listing_id ASC
    LIMIT (SELECT page_size FROM params)
    OFFSET (SELECT (page - 1) * page_size FROM params)
  )
  SELECT
    p.listing_id,
    p.price,
    p.grading_company,
    p.grading_score,
    p.seller_id,
    p.seller_name,
    p.seller_rating,
    p.seller_total_trades,
    p.seller_persona,
    p.use_authentication,
    p.created_at,
    p.filtered_lowest_price,
    p.total_count,
    p.page,
    p.page_size,
    p.total_pages,
    CASE
      WHEN p.total_count = 0 THEN 0
      ELSE ((p.page - 1) * p.page_size) + 1
    END AS range_start,
    CASE
      WHEN p.total_count = 0 THEN 0
      ELSE LEAST(p.page * p.page_size, p.total_count::integer)
    END AS range_end
  FROM paged p;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_product_listings(
  text, jsonb, boolean, text, integer, integer
)
  TO anon, authenticated, service_role;

GRANT EXECUTE ON FUNCTION public.listing_grade_sort_score(text, text)
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_marketplace_seller_listings(
  p_seller_id uuid,
  p_name_query text DEFAULT NULL,
  p_rarities text[] DEFAULT NULL,
  p_grade_filters jsonb DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_sort text DEFAULT 'latest',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS TABLE (
  listing_id uuid,
  product_id text,
  product_name text,
  name_ja text,
  name_en text,
  name_zh text,
  set_code text,
  card_number text,
  display_id text,
  rarity text,
  image_url text,
  grading_company text,
  grading_score text,
  price numeric,
  created_at timestamptz,
  seller_id uuid,
  seller_name text,
  seller_persona public.seller_persona_type,
  use_authentication boolean,
  market_avg_price numeric,
  market_data_source text,
  price_vs_market_pct numeric,
  seller_min_price numeric,
  seller_max_price numeric,
  total_count bigint,
  page integer,
  page_size integer,
  total_pages integer,
  range_start integer,
  range_end integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      GREATEST(COALESCE(p_page, 1), 1) AS page,
      GREATEST(COALESCE(p_page_size, 12), 1) AS page_size
  ),
  seller_bounds AS (
    SELECT
      MIN(l.price) AS seller_min_price,
      MAX(l.price) AS seller_max_price
    FROM public.listings l
    WHERE l.status = 'active'
      AND l.seller_id = p_seller_id
  ),
  filtered_listings AS (
    SELECT
      l.id AS listing_id,
      l.product_id,
      l.price,
      l.grading_company,
      l.grading_score,
      l.seller_id,
      l.seller_persona,
      l.use_authentication,
      l.created_at,
      COALESCE(pc.name_zh, pc.name_ja) AS product_name,
      pc.name_ja,
      pc.name_en,
      pc.name_zh,
      pc.set_code,
      pc.card_number,
      pc.display_id,
      pc.rarity,
      pc.image_url,
      p.display_name AS seller_name
    FROM public.listings l
    INNER JOIN public.product_catalog pc ON pc.id = l.product_id
    INNER JOIN public.profiles p ON p.id = l.seller_id
    WHERE l.status = 'active'
      AND l.seller_id = p_seller_id
      AND (
        p_name_query IS NULL
        OR trim(p_name_query) = ''
        OR pc.name_ja ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
        OR pc.name_en ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
        OR pc.name_zh ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
        OR pc.card_number ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
        OR pc.display_id ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
        OR public.catalog_card_identifier_matches(trim(p_name_query), pc.set_code, pc.card_number, pc.display_id)
      )
      AND (
        p_rarities IS NULL
        OR cardinality(p_rarities) = 0
        OR pc.rarity = ANY (p_rarities)
      )
      AND (p_price_min IS NULL OR l.price >= p_price_min)
      AND (p_price_max IS NULL OR l.price <= p_price_max)
      AND (
        p_grade_filters IS NULL
        OR jsonb_typeof(p_grade_filters) <> 'array'
        OR jsonb_array_length(p_grade_filters) = 0
        OR EXISTS (
          SELECT 1
          FROM jsonb_array_elements(p_grade_filters) AS gf(filter)
          WHERE (
            upper(coalesce(filter->>'company', '')) = 'OTHER'
            AND coalesce(nullif(trim(filter->>'score'), ''), '') <> ''
            AND (
              (
                upper(l.grading_company) = 'OTHER'
                AND l.grading_score = trim(filter->>'score')
              )
              OR (
                upper(l.grading_company) = 'SEALED'
                AND trim(filter->>'score') = 'SEALED'
              )
            )
          )
          OR (
            upper(coalesce(filter->>'company', '')) = 'OTHER'
            AND coalesce(nullif(trim(filter->>'score'), ''), '') = ''
            AND upper(l.grading_company) NOT IN ('PSA', 'CGC', 'BGS', 'RAW')
          )
          OR (
            upper(coalesce(filter->>'company', '')) <> 'OTHER'
            AND upper(l.grading_company) = upper(coalesce(filter->>'company', ''))
            AND (
              coalesce(nullif(trim(filter->>'score'), ''), '') = ''
              OR l.grading_score = trim(filter->>'score')
            )
          )
        )
      )
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total_count FROM filtered_listings
  ),
  paged AS (
    SELECT
      fl.*,
      sb.seller_min_price,
      sb.seller_max_price,
      c.total_count,
      params.page,
      params.page_size,
      GREATEST(CEIL(c.total_count::numeric / params.page_size::numeric), 0)::integer AS total_pages
    FROM filtered_listings fl
    CROSS JOIN seller_bounds sb
    CROSS JOIN counted c
    CROSS JOIN params
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN fl.price END ASC NULLS LAST,
      CASE WHEN p_sort = 'price_desc' THEN fl.price END DESC NULLS LAST,
      CASE WHEN p_sort = 'latest' THEN fl.created_at END DESC NULLS LAST,
      fl.listing_id ASC
    LIMIT (SELECT page_size FROM params)
    OFFSET (SELECT (page - 1) * page_size FROM params)
  )
  SELECT
    p.listing_id,
    p.product_id,
    p.product_name,
    p.name_ja,
    p.name_en,
    p.name_zh,
    p.set_code,
    p.card_number,
    p.display_id,
    p.rarity,
    p.image_url,
    p.grading_company,
    p.grading_score,
    p.price,
    p.created_at,
    p.seller_id,
    p.seller_name,
    p.seller_persona,
    p.use_authentication,
    mp.market_avg_price,
    mp.market_data_source,
    public.compute_price_vs_market_pct(p.price, mp.market_avg_price) AS price_vs_market_pct,
    p.seller_min_price,
    p.seller_max_price,
    p.total_count,
    p.page,
    p.page_size,
    p.total_pages,
    CASE
      WHEN p.total_count = 0 THEN 0
      ELSE ((p.page - 1) * p.page_size) + 1
    END AS range_start,
    CASE
      WHEN p.total_count = 0 THEN 0
      ELSE LEAST(p.page * p.page_size, p.total_count::integer)
    END AS range_end
  FROM paged p
  LEFT JOIN public.product_grading_market_prices mp
    ON mp.product_id::text = p.product_id
   AND mp.grading_company = public.resolve_listing_market_price_company(p.grading_company)
   AND mp.grading_score = public.resolve_listing_market_price_score(p.grading_company, p.grading_score);
$$;



GRANT EXECUTE ON FUNCTION public.search_marketplace_seller_listings(
  uuid, text, text[], jsonb, numeric, numeric, text, integer, integer
)
  TO anon, authenticated, service_role;
