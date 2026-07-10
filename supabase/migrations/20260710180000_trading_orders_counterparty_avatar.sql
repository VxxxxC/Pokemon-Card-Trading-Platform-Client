-- Add counterparty avatar to member trading order search RPC
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
