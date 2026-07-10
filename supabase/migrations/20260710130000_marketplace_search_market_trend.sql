-- Marketplace grid: join cached market trend on search RPCs (lowest listing grade key).
-- Read path: product_grading_market_prices only — no runtime member_orders scan.

ALTER TABLE public.product_grading_market_prices
  ADD COLUMN IF NOT EXISTS market_data_source text NOT NULL DEFAULT 'snkrdunk';

COMMENT ON COLUMN public.product_grading_market_prices.market_data_source IS
  'snkrdunk | platform — which snapshot source produced this cache row';

CREATE OR REPLACE FUNCTION public.resolve_listing_market_price_company(
  p_grading_company text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN upper(coalesce(trim(p_grading_company), '')) IN ('', 'RAW') THEN 'RAW'
    WHEN upper(trim(p_grading_company)) IN ('PSA', 'BGS', 'CGC', 'ARS') THEN upper(trim(p_grading_company))
    ELSE 'OTHER'
  END;
$$;

CREATE OR REPLACE FUNCTION public.resolve_listing_market_price_score(
  p_grading_company text,
  p_grading_score text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN public.resolve_listing_market_price_company(p_grading_company) = 'RAW' THEN
      CASE
        WHEN upper(trim(coalesce(p_grading_score, ''))) IN ('A', 'B', 'C', 'D')
          THEN upper(trim(p_grading_score))
        ELSE '-'
      END
    ELSE coalesce(nullif(trim(p_grading_score), ''), '-')
  END;
$$;

DROP FUNCTION IF EXISTS public.search_marketplace_products(
  text, text, text, text, text[], text[], jsonb, numeric, numeric, text, integer, integer
);

CREATE OR REPLACE FUNCTION public.search_marketplace_products(
  p_keyword text DEFAULT NULL,
  p_set_code text DEFAULT NULL,
  p_card_number text DEFAULT NULL,
  p_name_query text DEFAULT NULL,
  p_rarities text[] DEFAULT NULL,
  p_seller_modes text[] DEFAULT NULL,
  p_grade_filters jsonb DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_sort text DEFAULT 'latest',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS TABLE (
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
  catalog_type public.catalog_type,
  listing_count bigint,
  lowest_price numeric,
  highest_price numeric,
  lowest_listing_id uuid,
  lowest_listing_created_at timestamptz,
  latest_listing_at timestamptz,
  grading_company text,
  grading_score text,
  seller_id uuid,
  seller_name text,
  seller_persona public.seller_persona_type,
  use_authentication boolean,
  market_trend_30d numeric,
  market_chart_data jsonb,
  market_data_source text,
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
      GREATEST(COALESCE(p_page_size, 12), 1) AS page_size
  ),
  filtered_listings AS (
    SELECT
      l.id AS listing_id,
      l.product_id,
      l.price,
      l.created_at,
      l.seller_id,
      l.use_authentication,
      l.grading_company,
      l.grading_score,
      l.seller_persona,
      pc.name_zh,
      pc.name_ja,
      pc.name_en,
      pc.set_code,
      pc.card_number,
      pc.display_id,
      pc.rarity,
      pc.image_url,
      pc.type AS catalog_type,
      p.display_name AS seller_name
    FROM public.listings l
    INNER JOIN public.product_catalog pc ON pc.id = l.product_id
    INNER JOIN public.profiles p ON p.id = l.seller_id
    WHERE l.status = 'active'
      AND (
        (
          (p_keyword IS NULL OR trim(p_keyword) = '')
          AND (p_set_code IS NULL OR trim(p_set_code) = '')
          AND (p_card_number IS NULL OR trim(p_card_number) = '')
          AND (p_name_query IS NULL OR trim(p_name_query) = '')
        )
        OR (
          p_keyword IS NOT NULL
          AND trim(p_keyword) <> ''
          AND (
            pc.name_ja ILIKE '%' || public.escape_ilike_pattern(trim(p_keyword)) || '%'
            OR pc.name_en ILIKE '%' || public.escape_ilike_pattern(trim(p_keyword)) || '%'
            OR pc.name_zh ILIKE '%' || public.escape_ilike_pattern(trim(p_keyword)) || '%'
            OR pc.set_code ILIKE '%' || public.escape_ilike_pattern(trim(p_keyword)) || '%'
            OR pc.card_number ILIKE '%' || public.escape_ilike_pattern(trim(p_keyword)) || '%'
            OR pc.display_id ILIKE '%' || public.escape_ilike_pattern(trim(p_keyword)) || '%'
          )
        )
        OR (
          (p_keyword IS NULL OR trim(p_keyword) = '')
          AND (
            p_set_code IS NULL
            OR trim(p_set_code) = ''
            OR pc.set_code ILIKE '%' || public.escape_ilike_pattern(trim(p_set_code)) || '%'
          )
          AND (
            p_card_number IS NULL
            OR trim(p_card_number) = ''
            OR pc.card_number ILIKE '%' || public.escape_ilike_pattern(trim(p_card_number)) || '%'
            OR pc.display_id ILIKE '%' || public.escape_ilike_pattern(trim(p_card_number)) || '%'
          )
          AND (
            p_name_query IS NULL
            OR trim(p_name_query) = ''
            OR pc.name_ja ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
            OR pc.name_en ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
            OR pc.name_zh ILIKE '%' || public.escape_ilike_pattern(trim(p_name_query)) || '%'
          )
        )
      )
      AND (
        p_rarities IS NULL
        OR cardinality(p_rarities) = 0
        OR pc.rarity = ANY (p_rarities)
      )
      AND (p_price_min IS NULL OR l.price >= p_price_min)
      AND (p_price_max IS NULL OR l.price <= p_price_max)
      AND (
        p_seller_modes IS NULL
        OR cardinality(p_seller_modes) = 0
        OR (
          ('MERCHANT' = ANY (p_seller_modes) AND l.seller_persona = 'merchant')
          OR (
            'MEMBER' = ANY (p_seller_modes)
            AND l.seller_persona = 'member'
          )
          OR ('P2P' = ANY (p_seller_modes) AND l.use_authentication = true)
        )
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
  product_stats AS (
    SELECT
      fl.product_id,
      COUNT(*) AS listing_count,
      MIN(fl.price) AS lowest_price,
      MAX(fl.price) AS highest_price,
      MAX(fl.created_at) AS latest_listing_at
    FROM filtered_listings fl
    GROUP BY fl.product_id
  ),
  ranked AS (
    SELECT
      fl.*,
      ps.listing_count,
      ps.lowest_price,
      ps.highest_price,
      ps.latest_listing_at,
      ROW_NUMBER() OVER (
        PARTITION BY fl.product_id
        ORDER BY fl.price ASC, fl.created_at DESC
      ) AS rn
    FROM filtered_listings fl
    INNER JOIN product_stats ps ON ps.product_id = fl.product_id
  ),
  best_per_product AS (
    SELECT
      r.product_id,
      COALESCE(r.name_zh, r.name_ja) AS product_name,
      r.name_ja,
      r.name_en,
      r.name_zh,
      r.set_code,
      r.card_number,
      r.display_id,
      r.rarity,
      r.image_url,
      r.catalog_type,
      r.listing_count,
      r.lowest_price,
      r.highest_price,
      r.listing_id AS lowest_listing_id,
      r.created_at AS lowest_listing_created_at,
      r.latest_listing_at,
      r.grading_company,
      r.grading_score,
      r.seller_id,
      r.seller_name,
      r.seller_persona,
      r.use_authentication
    FROM ranked r
    WHERE r.rn = 1
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total_count FROM best_per_product
  ),
  paged AS (
    SELECT
      b.*,
      c.total_count,
      params.page,
      params.page_size,
      GREATEST(CEIL(c.total_count::numeric / params.page_size::numeric), 0)::integer AS total_pages
    FROM best_per_product b
    CROSS JOIN counted c
    CROSS JOIN params
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN b.lowest_price END ASC NULLS LAST,
      CASE WHEN p_sort = 'price_desc' THEN b.lowest_price END DESC NULLS LAST,
      CASE WHEN p_sort = 'latest' THEN b.latest_listing_at END DESC NULLS LAST,
      b.product_id ASC
    LIMIT (SELECT page_size FROM params)
    OFFSET (SELECT (page - 1) * page_size FROM params)
  )
  SELECT
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
    p.catalog_type,
    p.listing_count,
    p.lowest_price,
    p.highest_price,
    p.lowest_listing_id,
    p.lowest_listing_created_at,
    p.latest_listing_at,
    p.grading_company,
    p.grading_score,
    p.seller_id,
    p.seller_name,
    p.seller_persona,
    p.use_authentication,
    mp.market_trend_30d,
    mp.market_chart_data,
    mp.market_data_source,
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

GRANT EXECUTE ON FUNCTION public.search_marketplace_products(
  text, text, text, text, text[], text[], jsonb, numeric, numeric, text, integer, integer
)
  TO anon, authenticated, service_role;

DROP FUNCTION IF EXISTS public.search_marketplace_products_browse(text, integer, integer);

CREATE OR REPLACE FUNCTION public.search_marketplace_products_browse(
  p_sort text DEFAULT 'latest',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS TABLE (
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
  catalog_type public.catalog_type,
  listing_count bigint,
  lowest_price numeric,
  highest_price numeric,
  lowest_listing_id uuid,
  lowest_listing_created_at timestamptz,
  latest_listing_at timestamptz,
  grading_company text,
  grading_score text,
  seller_id uuid,
  seller_name text,
  seller_persona public.seller_persona_type,
  use_authentication boolean,
  market_trend_30d numeric,
  market_chart_data jsonb,
  market_data_source text,
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
  counted AS (
    SELECT COUNT(*)::bigint AS total_count
    FROM public.marketplace_product_summaries
  ),
  paged AS (
    SELECT
      s.product_id,
      s.product_name,
      s.name_ja,
      s.name_en,
      s.name_zh,
      s.set_code,
      s.card_number,
      s.display_id,
      s.rarity,
      s.image_url,
      s.catalog_type,
      s.listing_count,
      s.lowest_price,
      s.highest_price,
      s.lowest_listing_id,
      s.lowest_listing_created_at,
      s.latest_listing_at,
      s.grading_company,
      s.grading_score,
      s.seller_id,
      s.seller_name,
      s.seller_persona,
      s.use_authentication,
      c.total_count,
      params.page,
      params.page_size,
      GREATEST(CEIL(c.total_count::numeric / params.page_size::numeric), 0)::integer AS total_pages
    FROM public.marketplace_product_summaries s
    CROSS JOIN counted c
    CROSS JOIN params
    ORDER BY
      CASE WHEN p_sort = 'price_asc' THEN s.lowest_price END ASC NULLS LAST,
      CASE WHEN p_sort = 'price_desc' THEN s.lowest_price END DESC NULLS LAST,
      CASE WHEN p_sort = 'latest' THEN s.latest_listing_at END DESC NULLS LAST,
      s.product_id ASC
    LIMIT (SELECT page_size FROM params)
    OFFSET (SELECT (page - 1) * page_size FROM params)
  )
  SELECT
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
    p.catalog_type,
    p.listing_count,
    p.lowest_price,
    p.highest_price,
    p.lowest_listing_id,
    p.lowest_listing_created_at,
    p.latest_listing_at,
    p.grading_company,
    p.grading_score,
    p.seller_id,
    p.seller_name,
    p.seller_persona,
    p.use_authentication,
    mp.market_trend_30d,
    mp.market_chart_data,
    mp.market_data_source,
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

GRANT EXECUTE ON FUNCTION public.search_marketplace_products_browse(
  text, integer, integer
)
  TO anon, authenticated, service_role;
