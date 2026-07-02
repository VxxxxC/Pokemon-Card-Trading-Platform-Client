-- Marketplace browse: public read on active listings + aggregated product search RPC

GRANT SELECT ON public.listings TO anon, authenticated;

ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "listings_public_read_active" ON public.listings;

CREATE POLICY "listings_public_read_active"
  ON public.listings
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

GRANT SELECT ON public.profiles TO anon, authenticated;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read" ON public.profiles;

CREATE POLICY "profiles_public_read"
  ON public.profiles
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_listings_active_product_price
  ON public.listings (product_id, price ASC, created_at DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_product_catalog_rarity
  ON public.product_catalog (rarity);

CREATE OR REPLACE FUNCTION public.get_marketplace_price_bounds()
RETURNS TABLE (min_price numeric, max_price numeric)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT
    COALESCE(MIN(l.price), 0)::numeric AS min_price,
    COALESCE(MAX(l.price), 100000)::numeric AS max_price
  FROM public.listings l
  WHERE l.status = 'active';
$$;

GRANT EXECUTE ON FUNCTION public.get_marketplace_price_bounds()
  TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_marketplace_products(
  p_query text DEFAULT NULL,
  p_rarities text[] DEFAULT NULL,
  p_seller_types text[] DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_sort text DEFAULT 'latest',
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 12
)
RETURNS TABLE (
  product_id text,
  product_name text,
  set_code text,
  card_number text,
  display_id text,
  rarity text,
  image_url text,
  listing_count bigint,
  lowest_price numeric,
  lowest_listing_id uuid,
  lowest_listing_created_at timestamptz,
  seller_id uuid,
  seller_name text,
  seller_role public.user_role,
  use_authentication boolean,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH filtered_listings AS (
    SELECT
      l.id AS listing_id,
      l.product_id,
      l.price,
      l.created_at,
      l.seller_id,
      l.use_authentication,
      pc.name_zh,
      pc.name_ja,
      pc.name_en,
      pc.set_code,
      pc.card_number,
      pc.display_id,
      pc.rarity,
      pc.image_url,
      p.display_name AS seller_name,
      p.role AS seller_role
    FROM public.listings l
    INNER JOIN public.product_catalog pc ON pc.id = l.product_id
    INNER JOIN public.profiles p ON p.id = l.seller_id
    WHERE l.status = 'active'
      AND (
        p_query IS NULL
        OR trim(p_query) = ''
        OR pc.name_ja ILIKE '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
        OR pc.name_en ILIKE '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
        OR pc.name_zh ILIKE '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
        OR pc.set_code ILIKE '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
        OR pc.card_number ILIKE '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
        OR pc.display_id ILIKE '%' || replace(replace(replace(trim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%'
      )
      AND (
        p_rarities IS NULL
        OR cardinality(p_rarities) = 0
        OR pc.rarity = ANY (p_rarities)
      )
      AND (p_price_min IS NULL OR l.price >= p_price_min)
      AND (p_price_max IS NULL OR l.price <= p_price_max)
      AND (
        p_seller_types IS NULL
        OR cardinality(p_seller_types) = 0
        OR (
          ('MERCHANT' = ANY (p_seller_types) AND p.role = 'merchant')
          OR (
            'C2C' = ANY (p_seller_types)
            AND p.role = 'member'
            AND l.use_authentication = false
          )
          OR ('P2P' = ANY (p_seller_types) AND l.use_authentication = true)
        )
      )
  ),
  ranked AS (
    SELECT
      fl.*,
      ROW_NUMBER() OVER (
        PARTITION BY fl.product_id
        ORDER BY fl.price ASC, fl.created_at DESC
      ) AS rn,
      COUNT(*) OVER (PARTITION BY fl.product_id) AS listing_count
    FROM filtered_listings fl
  ),
  best_per_product AS (
    SELECT
      r.product_id,
      COALESCE(r.name_zh, r.name_ja) AS product_name,
      r.set_code,
      r.card_number,
      r.display_id,
      r.rarity,
      r.image_url,
      r.listing_count,
      r.price AS lowest_price,
      r.listing_id AS lowest_listing_id,
      r.created_at AS lowest_listing_created_at,
      r.seller_id,
      r.seller_name,
      r.seller_role,
      r.use_authentication
    FROM ranked r
    WHERE r.rn = 1
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total_count FROM best_per_product
  )
  SELECT
    b.product_id,
    b.product_name,
    b.set_code,
    b.card_number,
    b.display_id,
    b.rarity,
    b.image_url,
    b.listing_count,
    b.lowest_price,
    b.lowest_listing_id,
    b.lowest_listing_created_at,
    b.seller_id,
    b.seller_name,
    b.seller_role,
    b.use_authentication,
    c.total_count
  FROM best_per_product b
  CROSS JOIN counted c
  ORDER BY
    CASE WHEN p_sort = 'price_asc' THEN b.lowest_price END ASC NULLS LAST,
    CASE WHEN p_sort = 'price_desc' THEN b.lowest_price END DESC NULLS LAST,
    CASE WHEN p_sort = 'latest' THEN b.lowest_listing_created_at END DESC NULLS LAST,
    b.product_id ASC
  LIMIT GREATEST(p_page_size, 1)
  OFFSET GREATEST(p_page - 1, 0) * GREATEST(p_page_size, 1);
$$;

GRANT EXECUTE ON FUNCTION public.search_marketplace_products(
  text, text[], text[], numeric, numeric, text, integer, integer
)
  TO anon, authenticated, service_role;
