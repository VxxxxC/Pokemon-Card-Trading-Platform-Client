-- Marketplace performance: DISTINCT rarities RPC, product summary MV, browse fast path

CREATE OR REPLACE FUNCTION public.get_marketplace_rarities()
RETURNS TABLE (rarity text)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT DISTINCT pc.rarity
  FROM public.product_catalog pc
  WHERE pc.rarity IS NOT NULL
    AND trim(pc.rarity) <> ''
  ORDER BY pc.rarity;
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_rarities()
  TO anon, authenticated, service_role;

DROP MATERIALIZED VIEW IF EXISTS public.marketplace_product_summaries;

CREATE MATERIALIZED VIEW public.marketplace_product_summaries AS
WITH active_listings AS (
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
),
product_stats AS (
  SELECT
    al.product_id,
    COUNT(*)::bigint AS listing_count,
    MIN(al.price) AS lowest_price,
    MAX(al.price) AS highest_price,
    MAX(al.created_at) AS latest_listing_at
  FROM active_listings al
  GROUP BY al.product_id
),
ranked AS (
  SELECT
    al.*,
    ps.listing_count,
    ps.lowest_price,
    ps.highest_price,
    ps.latest_listing_at,
    ROW_NUMBER() OVER (
      PARTITION BY al.product_id
      ORDER BY al.price ASC, al.created_at DESC
    ) AS rn
  FROM active_listings al
  INNER JOIN product_stats ps ON ps.product_id = al.product_id
)
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
WHERE r.rn = 1;

CREATE UNIQUE INDEX marketplace_product_summaries_product_id_idx
  ON public.marketplace_product_summaries (product_id);

CREATE INDEX marketplace_product_summaries_latest_idx
  ON public.marketplace_product_summaries (latest_listing_at DESC NULLS LAST);

CREATE INDEX marketplace_product_summaries_price_asc_idx
  ON public.marketplace_product_summaries (lowest_price ASC NULLS LAST);

CREATE INDEX marketplace_product_summaries_price_desc_idx
  ON public.marketplace_product_summaries (lowest_price DESC NULLS LAST);

GRANT SELECT ON public.marketplace_product_summaries TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.refresh_marketplace_product_summaries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.marketplace_product_summaries;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_marketplace_product_summaries()
  TO service_role;

REFRESH MATERIALIZED VIEW public.marketplace_product_summaries;

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

GRANT EXECUTE ON FUNCTION public.search_marketplace_products_browse(
  text, integer, integer
)
  TO anon, authenticated, service_role;
