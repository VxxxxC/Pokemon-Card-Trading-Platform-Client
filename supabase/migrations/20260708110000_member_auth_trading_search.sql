-- Marketplace MEMBER filter: include listings regardless of use_authentication (seller auth policy)

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

-- Pending tab helper for auth escrow + meetup orders
CREATE OR REPLACE FUNCTION public.fn_member_order_is_open(
  p_status public.member_order_state,
  p_use_authentication boolean,
  p_escrow_status public.member_escrow_status
)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    CASE
      WHEN COALESCE(p_use_authentication, false) THEN
        p_status = 'pending'
        AND p_escrow_status IS NOT NULL
        AND p_escrow_status NOT IN ('released', 'cancelled')
      ELSE
        p_status::text IN ('pending', 'meetup_arranged')
    END;
$$;

-- search_user_trading_orders: expose escrow_status + auth-aware pending filters
-- PostgreSQL cannot change RETURNS TABLE shape via CREATE OR REPLACE (42P13).
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
  TO authenticated, service_role;

-- Cancel auth orders: also mark escrow cancelled
CREATE OR REPLACE FUNCTION public.rpc_cancel_member_order(
    p_order_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_listing_id UUID;
    v_room_id UUID;
    v_message_id UUID;
BEGIN
    SELECT listing_id INTO v_listing_id
    FROM public.member_orders
    WHERE id = p_order_id AND seller_id = p_user_id AND status = 'pending';

    IF NOT FOUND THEN
        RAISE EXCEPTION '取消失敗：訂單狀態不合法，或您非此筆交易的賣家。';
    END IF;

    UPDATE public.member_orders
    SET
        status = 'cancelled',
        escrow_status = CASE
            WHEN use_authentication AND escrow_status IS NOT NULL THEN 'cancelled'::public.member_escrow_status
            ELSE escrow_status
        END,
        updated_at = now()
    WHERE id = p_order_id;

    UPDATE public.listings SET status = 'active' WHERE id = v_listing_id;

    SELECT id INTO v_room_id FROM public.chat_rooms
    WHERE buyer_id = (SELECT buyer_id FROM public.member_orders WHERE id = p_order_id)
      AND seller_id = p_user_id;

    IF FOUND THEN
        INSERT INTO public.chat_messages (room_id, sender_id, content, member_order_id, is_system_warning)
        VALUES (v_room_id, p_user_id, 'SYSTEM_ORDER_CANCELLED', p_order_id, true)
        RETURNING id INTO v_message_id;
    END IF;

    RETURN jsonb_build_object('success', true, 'message_id', v_message_id);
END;
$$;
