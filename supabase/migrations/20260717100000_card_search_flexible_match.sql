-- Flexible card identifier search: ignore separators and support reordered letter/number tokens.

CREATE OR REPLACE FUNCTION public.compact_alphanumeric(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT regexp_replace(lower(coalesce(trim(input), '')), '[^a-z0-9]', '', 'g');
$$;

CREATE OR REPLACE FUNCTION public.card_search_tokens_array(input text)
RETURNS text[]
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  raw text;
  parts text[];
  single text;
  letter_digits text[];
BEGIN
  raw := lower(trim(coalesce(input, '')));
  IF raw = '' THEN
    RETURN ARRAY[]::text[];
  END IF;

  parts := regexp_split_to_array(raw, '[^a-z0-9]+');
  parts := (
    SELECT coalesce(array_agg(part ORDER BY ord), ARRAY[]::text[])
    FROM (
      SELECT part, row_number() OVER () AS ord
      FROM unnest(parts) AS part
      WHERE part IS NOT NULL AND part <> ''
    ) ordered_parts
  );

  IF coalesce(array_length(parts, 1), 0) <= 1 THEN
    single := coalesce(parts[1], raw);
    IF single ~ '^[a-z0-9]*[a-z]\d+$' THEN
      letter_digits := regexp_match(single, '^([a-z0-9]*[a-z])(\d+)$');
      RETURN ARRAY[letter_digits[1], letter_digits[2]];
    ELSIF single ~ '^\d+[a-z0-9]*[a-z]$' THEN
      letter_digits := regexp_match(single, '^(\d+)([a-z0-9]*[a-z])$');
      RETURN ARRAY[letter_digits[1], letter_digits[2]];
    END IF;
    RETURN ARRAY[single];
  END IF;

  RETURN parts;
END;
$$;

CREATE OR REPLACE FUNCTION public.canonical_card_search_key(input text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(
    (
      SELECT string_agg(token, '' ORDER BY token)
      FROM unnest(public.card_search_tokens_array(input)) AS token
    ),
    ''
  );
$$;

CREATE OR REPLACE FUNCTION public.card_identifier_flexible_match(
  p_query text,
  p_target text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  q text;
  t text;
  q_compact text;
  t_compact text;
  q_canon text;
  t_canon text;
  min_prefix integer := 4;
BEGIN
  q := trim(coalesce(p_query, ''));
  t := trim(coalesce(p_target, ''));
  IF q = '' OR t = '' THEN
    RETURN false;
  END IF;

  IF (
    q ~ '[^a-z0-9]'
    OR length(q) >= min_prefix
  ) AND lower(t) LIKE '%' || lower(q) || '%' THEN
    RETURN true;
  END IF;

  q_compact := public.compact_alphanumeric(q);
  t_compact := public.compact_alphanumeric(t);
  IF q_compact <> '' THEN
    IF q_compact = t_compact THEN
      RETURN true;
    END IF;
    IF length(q_compact) >= min_prefix AND strpos(t_compact, q_compact) > 0 THEN
      RETURN true;
    END IF;
    IF length(t_compact) >= min_prefix AND strpos(q_compact, t_compact) > 0 THEN
      RETURN true;
    END IF;
  END IF;

  q_canon := public.canonical_card_search_key(q);
  t_canon := public.canonical_card_search_key(t);
  IF q_canon <> '' AND t_canon <> '' THEN
    IF q_canon = t_canon THEN
      RETURN true;
    END IF;
    IF length(q_canon) >= min_prefix AND strpos(t_canon, q_canon) > 0 THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
END;
$$;

CREATE OR REPLACE FUNCTION public.catalog_card_identifier_matches(
  p_query text,
  p_set_code text,
  p_card_number text,
  p_display_id text
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  q text;
  set_code text;
  card_number text;
BEGIN
  q := trim(coalesce(p_query, ''));
  IF q = '' THEN
    RETURN true;
  END IF;

  set_code := coalesce(trim(p_set_code), '');
  card_number := coalesce(trim(p_card_number), '');

  IF public.card_identifier_flexible_match(q, coalesce(p_display_id, '')) THEN
    RETURN true;
  END IF;
  IF public.card_identifier_flexible_match(q, set_code) THEN
    RETURN true;
  END IF;
  IF public.card_identifier_flexible_match(q, card_number) THEN
    RETURN true;
  END IF;

  IF set_code <> '' AND card_number <> '' THEN
    IF public.card_identifier_flexible_match(q, set_code || card_number) THEN RETURN true; END IF;
    IF public.card_identifier_flexible_match(q, set_code || '-' || card_number) THEN RETURN true; END IF;
    IF public.card_identifier_flexible_match(q, set_code || ' ' || card_number) THEN RETURN true; END IF;
    IF public.card_identifier_flexible_match(q, card_number || set_code) THEN RETURN true; END IF;
    IF public.card_identifier_flexible_match(q, card_number || ' ' || set_code) THEN RETURN true; END IF;
  END IF;

  RETURN false;
END;
$$;

GRANT EXECUTE ON FUNCTION public.compact_alphanumeric(text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.card_search_tokens_array(text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.canonical_card_search_key(text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.card_identifier_flexible_match(text, text)
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.catalog_card_identifier_matches(text, text, text, text)
  TO anon, authenticated, service_role;

-- Patch search_marketplace_products
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
  market_avg_price numeric,
  market_data_source text,
  price_vs_market_pct numeric,
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
            OR public.catalog_card_identifier_matches(trim(p_keyword), pc.set_code, pc.card_number, pc.display_id)
          )
        )
        OR (
          (p_keyword IS NULL OR trim(p_keyword) = '')
          AND (
            p_set_code IS NULL
            OR trim(p_set_code) = ''
            OR pc.set_code ILIKE '%' || public.escape_ilike_pattern(trim(p_set_code)) || '%'
            OR public.card_identifier_flexible_match(trim(p_set_code), pc.set_code)
          )
          AND (
            p_card_number IS NULL
            OR trim(p_card_number) = ''
            OR pc.card_number ILIKE '%' || public.escape_ilike_pattern(trim(p_card_number)) || '%'
            OR pc.display_id ILIKE '%' || public.escape_ilike_pattern(trim(p_card_number)) || '%'
            OR public.catalog_card_identifier_matches(trim(p_card_number), pc.set_code, pc.card_number, pc.display_id)
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
    mp.market_avg_price,
    mp.market_data_source,
    CASE
      WHEN mp.market_avg_price IS NOT NULL
       AND mp.market_avg_price > 0
       AND p.lowest_price > 0
      THEN round(
        ((p.lowest_price - mp.market_avg_price) / mp.market_avg_price * 100)::numeric,
        1
      )
      ELSE NULL
    END AS price_vs_market_pct,
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


DROP FUNCTION IF EXISTS public.search_marketplace_seller_listings(
  uuid, text, text[], jsonb, numeric, numeric, text, integer, integer
);

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
            AND upper(trim(l.grading_company)) NOT IN ('PSA', 'CGC', 'BGS', 'ARS', 'RAW', 'RAW CARD')
          )
          OR (
            upper(coalesce(filter->>'company', '')) <> 'OTHER'
            AND upper(trim(l.grading_company)) = upper(coalesce(filter->>'company', ''))
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


DROP FUNCTION IF EXISTS public.search_user_trading_orders(text, text, text, integer, integer);

CREATE FUNCTION public.search_user_trading_orders(
  p_persona text DEFAULT 'all',
  p_tab_status text DEFAULT 'all',
  p_search_query text DEFAULT NULL,
  p_page integer DEFAULT 1,
  p_page_size integer DEFAULT 8
)
RETURNS TABLE (
  order_id uuid,
  order_number text,
  buyer_id uuid,
  seller_id uuid,
  final_price numeric,
  status public.member_order_state,
  escrow_status public.member_escrow_status,
  created_at timestamptz,
  expires_at timestamptz,
  persona text,
  has_reviewed_by_me boolean,
  counterparty_id uuid,
  counterparty_display_name text,
  counterparty_username text,
  counterparty_avatar_path text,
  grading_company text,
  grading_score text,
  use_authentication boolean,
  listing_images jsonb,
  product_name_ja text,
  product_name_zh text,
  product_name_en text,
  card_number text,
  set_code text,
  display_id text,
  catalog_image_url text,
  total_count bigint,
  page integer,
  page_size integer,
  total_pages integer,
  range_start integer,
  range_end integer,
  count_persona_all bigint,
  count_persona_buy bigint,
  count_persona_sell bigint,
  count_status_all bigint,
  count_status_pending bigint,
  count_status_completed bigint,
  count_status_cancelled bigint,
  count_needs_action bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH params AS (
    SELECT
      auth.uid() AS user_id,
      GREATEST(COALESCE(p_page, 1), 1) AS page,
      LEAST(GREATEST(COALESCE(p_page_size, 8), 1), 50) AS page_size,
      NULLIF(trim(COALESCE(p_search_query, '')), '') AS search_query,
      COALESCE(NULLIF(trim(p_persona), ''), 'all') AS persona,
      COALESCE(NULLIF(trim(p_tab_status), ''), 'all') AS tab_status
  ),
  enriched AS (
    SELECT
      mo.id,
      mo.order_number,
      mo.buyer_id,
      mo.seller_id,
      mo.final_price,
      mo.status,
      mo.escrow_status,
      mo.created_at,
      mo.expires_at,
      CASE
        WHEN mo.buyer_id = p.user_id THEN 'buy'
        ELSE 'sell'
      END AS persona,
      EXISTS (
        SELECT 1
        FROM public.transaction_reviews r
        WHERE r.member_order_id = mo.id
          AND r.reviewer_id = p.user_id
      ) AS has_reviewed_by_me,
      CASE
        WHEN mo.buyer_id = p.user_id THEN mo.seller_id
        ELSE mo.buyer_id
      END AS counterparty_id,
      CASE
        WHEN mo.buyer_id = p.user_id THEN seller.display_name
        ELSE buyer.display_name
      END AS counterparty_display_name,
      CASE
        WHEN mo.buyer_id = p.user_id THEN seller.username
        ELSE buyer.username
      END AS counterparty_username,
      CASE
        WHEN mo.buyer_id = p.user_id THEN seller.avatar_path
        ELSE buyer.avatar_path
      END AS counterparty_avatar_path,
      l.grading_company,
      l.grading_score,
      mo.use_authentication,
      l.images AS listing_images,
      pc.name_ja AS product_name_ja,
      pc.name_zh AS product_name_zh,
      pc.name_en AS product_name_en,
      pc.card_number,
      pc.set_code,
      pc.display_id,
      pc.image_url AS catalog_image_url
    FROM public.member_orders mo
    INNER JOIN public.listings l ON l.id = mo.listing_id
    INNER JOIN public.product_catalog pc ON pc.id = l.product_id
    INNER JOIN public.profiles buyer ON buyer.id = mo.buyer_id
    INNER JOIN public.profiles seller ON seller.id = mo.seller_id
    CROSS JOIN params p
    WHERE p.user_id IS NOT NULL
      AND (mo.buyer_id = p.user_id OR mo.seller_id = p.user_id)
  ),
  search_matched AS (
    SELECT e.*
    FROM enriched e
    CROSS JOIN params p
    WHERE
      p.search_query IS NULL
      OR e.order_number ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR e.product_name_ja ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR e.product_name_en ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR e.product_name_zh ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR e.card_number ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR e.set_code ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR e.display_id ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR public.catalog_card_identifier_matches(p.search_query, e.set_code, e.card_number, e.display_id)
      OR e.counterparty_display_name ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
      OR COALESCE(e.counterparty_username, '') ILIKE '%' || public.escape_ilike_pattern(p.search_query) || '%'
  ),
  filtered AS (
    SELECT sm.*
    FROM search_matched sm
    CROSS JOIN params p
    WHERE
      (p.persona = 'all' OR sm.persona = p.persona)
      AND (
        p.tab_status = 'all'
        OR (
          p.tab_status = 'pending'
          AND public.fn_member_order_is_open(sm.status, sm.use_authentication, sm.escrow_status)
        )
        OR (p.tab_status = 'completed' AND sm.status = 'completed')
        OR (p.tab_status = 'cancelled' AND sm.status = 'cancelled')
      )
  ),
  facet_counts AS (
    SELECT
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE
          p.tab_status = 'all'
          OR (
            p.tab_status = 'pending'
            AND public.fn_member_order_is_open(sm.status, sm.use_authentication, sm.escrow_status)
          )
          OR (p.tab_status = 'completed' AND sm.status = 'completed')
          OR (p.tab_status = 'cancelled' AND sm.status = 'cancelled')
      ) AS count_persona_all,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE
          sm.persona = 'buy'
          AND (
            p.tab_status = 'all'
            OR (
              p.tab_status = 'pending'
              AND public.fn_member_order_is_open(sm.status, sm.use_authentication, sm.escrow_status)
            )
            OR (p.tab_status = 'completed' AND sm.status = 'completed')
            OR (p.tab_status = 'cancelled' AND sm.status = 'cancelled')
          )
      ) AS count_persona_buy,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE
          sm.persona = 'sell'
          AND (
            p.tab_status = 'all'
            OR (
              p.tab_status = 'pending'
              AND public.fn_member_order_is_open(sm.status, sm.use_authentication, sm.escrow_status)
            )
            OR (p.tab_status = 'completed' AND sm.status = 'completed')
            OR (p.tab_status = 'cancelled' AND sm.status = 'cancelled')
          )
      ) AS count_persona_sell,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE p.persona = 'all' OR sm.persona = p.persona
      ) AS count_status_all,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE
          (p.persona = 'all' OR sm.persona = p.persona)
          AND public.fn_member_order_is_open(sm.status, sm.use_authentication, sm.escrow_status)
      ) AS count_status_pending,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE
          (p.persona = 'all' OR sm.persona = p.persona)
          AND sm.status = 'completed'
      ) AS count_status_completed,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        CROSS JOIN params p
        WHERE
          (p.persona = 'all' OR sm.persona = p.persona)
          AND sm.status = 'cancelled'
      ) AS count_status_cancelled,
      (
        SELECT COUNT(*)::bigint
        FROM search_matched sm
        WHERE public.fn_member_order_is_open(sm.status, sm.use_authentication, sm.escrow_status)
      ) AS count_needs_action
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total_count
    FROM filtered
  ),
  paged AS (
    SELECT
      f.*,
      c.total_count,
      params.page,
      params.page_size,
      GREATEST(CEIL(c.total_count::numeric / params.page_size::numeric), 0)::integer AS total_pages
    FROM filtered f
    CROSS JOIN counted c
    CROSS JOIN params
    ORDER BY f.created_at DESC NULLS LAST, f.id DESC
    LIMIT (SELECT page_size FROM params)
    OFFSET (SELECT (page - 1) * page_size FROM params)
  )
  SELECT
    p.id AS order_id,
    p.order_number,
    p.buyer_id,
    p.seller_id,
    p.final_price,
    p.status,
    p.escrow_status,
    p.created_at,
    p.expires_at,
    p.persona,
    p.has_reviewed_by_me,
    p.counterparty_id,
    p.counterparty_display_name,
    p.counterparty_username,
    p.counterparty_avatar_path,
    p.grading_company,
    p.grading_score,
    p.use_authentication,
    p.listing_images,
    p.product_name_ja,
    p.product_name_zh,
    p.product_name_en,
    p.card_number,
    p.set_code,
    p.display_id,
    p.catalog_image_url,
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
    END AS range_end,
    fc.count_persona_all,
    fc.count_persona_buy,
    fc.count_persona_sell,
    fc.count_status_all,
    fc.count_status_pending,
    fc.count_status_completed,
    fc.count_status_cancelled,
    fc.count_needs_action
  FROM paged p
  CROSS JOIN facet_counts fc;
$$;

REVOKE ALL ON FUNCTION public.search_user_trading_orders(text, text, text, integer, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.search_user_trading_orders(text, text, text, integer, integer)
  TO anon, authenticated, service_role;


CREATE OR REPLACE FUNCTION public.search_product_catalog(
  p_query text,
  p_item_type text DEFAULT 'card'
)
RETURNS TABLE (
  id text,
  name_ja text,
  name_en text,
  name_zh text,
  set_code text,
  card_number text,
  display_id text,
  image_url text,
  type public.catalog_type,
  rarity text,
  pokemon_stage text,
  snkr_rank integer,
  total_count bigint
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  WITH params AS (
    SELECT trim(coalesce(p_query, '')) AS query
  ),
  filtered AS (
    SELECT
      pc.id,
      pc.name_ja,
      pc.name_en,
      pc.name_zh,
      pc.set_code,
      pc.card_number,
      pc.display_id,
      pc.image_url,
      pc.type,
      pc.rarity,
      pc.pokemon_stage,
      pc.snkr_rank
    FROM public.product_catalog pc
    CROSS JOIN params p
    WHERE length(p.query) >= 2
      AND (
        (
          p_item_type = 'box_set'
          AND pc.type IN (
            'booster_box',
            'gift_set',
            'booster_pack',
            'starter_deck'
          )
        )
        OR (
          p_item_type <> 'box_set'
          AND pc.type = 'single_card'
        )
      )
      AND (
        pc.name_ja ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.name_en ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.name_zh ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.set_code ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.card_number ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR pc.display_id ILIKE '%' || public.escape_ilike_pattern(p.query) || '%'
        OR public.catalog_card_identifier_matches(
          p.query,
          pc.set_code,
          pc.card_number,
          pc.display_id
        )
      )
  ),
  counted AS (
    SELECT COUNT(*)::bigint AS total_count FROM filtered
  )
  SELECT
    f.id,
    f.name_ja,
    f.name_en,
    f.name_zh,
    f.set_code,
    f.card_number,
    f.display_id,
    f.image_url,
    f.type,
    f.rarity,
    f.pokemon_stage,
    f.snkr_rank,
    c.total_count
  FROM filtered f
  CROSS JOIN counted c
  ORDER BY f.snkr_rank NULLS LAST, f.name_ja ASC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION public.search_product_catalog(text, text)
  TO anon, authenticated, service_role;
