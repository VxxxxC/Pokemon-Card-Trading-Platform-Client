-- Fix series_rows: correlated subqueries referenced ungrouped b.bucket_end

CREATE OR REPLACE FUNCTION public.get_merchant_product_analytics(
  p_product_id text,
  p_time_range text DEFAULT '7d',
  p_history_page integer DEFAULT 1,
  p_history_page_size integer DEFAULT 6
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_merchant_id uuid;
  v_product_id text;
  v_time_range text;
  v_history_page integer;
  v_history_page_size integer;
  v_history_offset integer;
  v_range_end timestamptz;
  v_range_start timestamptz;
  v_product jsonb;
  v_summary jsonb;
  v_series jsonb;
  v_history jsonb;
BEGIN
  v_merchant_id := auth.uid();
  v_product_id := NULLIF(btrim(p_product_id), '');

  IF v_merchant_id IS NULL OR v_product_id IS NULL THEN
    RETURN NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.seller_id = v_merchant_id
      AND l.product_id = v_product_id

    UNION ALL

    SELECT 1
    FROM public.merchant_orders mo
    INNER JOIN public.listings l ON l.id = mo.listing_id
    WHERE mo.merchant_id = v_merchant_id
      AND l.product_id = v_product_id
      AND mo.escrow_status = 'completed_and_transferred'
  ) THEN
    RETURN NULL;
  END IF;

  v_time_range := COALESCE(NULLIF(trim(p_time_range), ''), '7d');
  IF v_time_range NOT IN ('12h', '7d', '1m', '3m', '6m', '12m') THEN
    v_time_range := '7d';
  END IF;

  v_history_page := GREATEST(COALESCE(p_history_page, 1), 1);
  v_history_page_size := LEAST(GREATEST(COALESCE(p_history_page_size, 6), 1), 50);
  v_history_offset := (v_history_page - 1) * v_history_page_size;
  v_range_end := now();

  v_range_start := CASE v_time_range
    WHEN '12h' THEN v_range_end - interval '12 hours'
    WHEN '7d' THEN date_trunc('day', v_range_end) - interval '6 days'
    WHEN '1m' THEN date_trunc('day', v_range_end) - interval '27 days'
    WHEN '3m' THEN date_trunc('month', v_range_end) - interval '2 months'
    WHEN '6m' THEN date_trunc('month', v_range_end) - interval '5 months'
    WHEN '12m' THEN date_trunc('month', v_range_end) - interval '11 months'
    ELSE date_trunc('day', v_range_end) - interval '6 days'
  END;

  WITH merchant_product_listings AS (
    SELECT l.id AS listing_id
    FROM public.listings l
    WHERE l.seller_id = v_merchant_id
      AND l.product_id = v_product_id
  ),
  completed_orders AS (
    SELECT
      mo.id,
      mo.buyer_id,
      mo.final_price,
      mo.order_number,
      COALESCE(mo.updated_at, mo.created_at) AS event_at
    FROM public.merchant_orders mo
    INNER JOIN public.listings l ON l.id = mo.listing_id
    WHERE mo.merchant_id = v_merchant_id
      AND l.product_id = v_product_id
      AND mo.escrow_status = 'completed_and_transferred'
  ),
  interval_orders AS (
    SELECT *
    FROM completed_orders
    WHERE event_at >= v_range_start
      AND event_at <= v_range_end
  ),
  engagement_events AS (
    SELECT
      e.event_type,
      e.occurred_at
    FROM public.listing_engagement_events e
    INNER JOIN merchant_product_listings mpl ON mpl.listing_id = e.listing_id
    WHERE e.occurred_at >= v_range_start
      AND e.occurred_at <= v_range_end
  ),
  buckets AS (
    SELECT bucket_start, bucket_end, label
    FROM (
      SELECT
        v_range_start + (gs * interval '2 hours') AS bucket_start,
        v_range_start + ((gs + 1) * interval '2 hours') AS bucket_end,
        to_char(v_range_start + (gs * interval '2 hours'), 'HH24:00') AS label
      FROM generate_series(0, 5) AS gs
      WHERE v_time_range = '12h'

      UNION ALL

      SELECT
        date_trunc('day', v_range_end) - ((6 - gs) * interval '1 day') AS bucket_start,
        date_trunc('day', v_range_end) - ((6 - gs) * interval '1 day') + interval '1 day' AS bucket_end,
        CASE extract(dow FROM date_trunc('day', v_range_end) - ((6 - gs) * interval '1 day'))::int
          WHEN 0 THEN '週日'
          WHEN 1 THEN '週一'
          WHEN 2 THEN '週二'
          WHEN 3 THEN '週三'
          WHEN 4 THEN '週四'
          WHEN 5 THEN '週五'
          WHEN 6 THEN '週六'
          ELSE '週'
        END AS label
      FROM generate_series(0, 6) AS gs
      WHERE v_time_range = '7d'

      UNION ALL

      SELECT
        v_range_start + (gs * interval '7 days') AS bucket_start,
        v_range_start + ((gs + 1) * interval '7 days') AS bucket_end,
        CASE gs
          WHEN 0 THEN '第一週'
          WHEN 1 THEN '第二週'
          WHEN 2 THEN '第三週'
          ELSE '第四週'
        END AS label
      FROM generate_series(0, 3) AS gs
      WHERE v_time_range = '1m'

      UNION ALL

      SELECT
        date_trunc('month', v_range_start) + (gs * interval '1 month') AS bucket_start,
        date_trunc('month', v_range_start) + ((gs + 1) * interval '1 month') AS bucket_end,
        CASE
          WHEN extract(year FROM date_trunc('month', v_range_start) + (gs * interval '1 month'))
            < extract(year FROM v_range_end)
          THEN '去年' || extract(month FROM date_trunc('month', v_range_start) + (gs * interval '1 month'))::text || '月'
          ELSE extract(month FROM date_trunc('month', v_range_start) + (gs * interval '1 month'))::text || '月'
        END AS label
      FROM generate_series(
        0,
        CASE v_time_range
          WHEN '3m' THEN 2
          WHEN '6m' THEN 5
          WHEN '12m' THEN 11
          ELSE 2
        END
      ) AS gs
      WHERE v_time_range IN ('3m', '6m', '12m')
    ) bucket_rows
  ),
  series_rows AS (
    SELECT
      b.bucket_start,
      b.label,
      COALESCE(order_agg.total_sales, 0)::numeric AS total_sales,
      COALESCE(order_agg.tx_count, 0)::bigint AS tx_count,
      COALESCE(view_agg.view_count, 0)::bigint AS view_count,
      COALESCE(offer_agg.offer_count, 0)::bigint AS offer_count
    FROM buckets b
    LEFT JOIN LATERAL (
      SELECT
        COALESCE(SUM(io.final_price), 0)::numeric AS total_sales,
        COUNT(io.id)::bigint AS tx_count
      FROM interval_orders io
      WHERE io.event_at >= b.bucket_start
        AND io.event_at < b.bucket_end
    ) order_agg ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS view_count
      FROM engagement_events ee
      WHERE ee.event_type = 'view'
        AND ee.occurred_at >= b.bucket_start
        AND ee.occurred_at < b.bucket_end
    ) view_agg ON true
    LEFT JOIN LATERAL (
      SELECT COUNT(*)::bigint AS offer_count
      FROM engagement_events ee
      WHERE ee.event_type = 'offer'
        AND ee.occurred_at >= b.bucket_start
        AND ee.occurred_at < b.bucket_end
    ) offer_agg ON true
  ),
  history_total AS (
    SELECT COUNT(*)::bigint AS total_count
    FROM interval_orders
  ),
  history_rows AS (
    SELECT
      io.id,
      io.order_number,
      io.buyer_id,
      io.final_price,
      io.event_at,
      COALESCE(
        NULLIF(trim(p.display_name), ''),
        NULLIF(trim(p.username), ''),
        '用戶'
      ) AS buyer_name
    FROM interval_orders io
    INNER JOIN public.profiles p ON p.id = io.buyer_id
    ORDER BY io.event_at DESC
    LIMIT v_history_page_size
    OFFSET v_history_offset
  )
  SELECT
    (
      SELECT jsonb_build_object(
        'id', pc.id,
        'name', COALESCE(
          NULLIF(trim(pc.name_zh), ''),
          NULLIF(trim(pc.name_ja), ''),
          NULLIF(trim(pc.name_en), ''),
          '未知商品'
        ),
        'skuNo', COALESCE(
          NULLIF(trim(pc.display_id), ''),
          pc.set_code || '-' || COALESCE(pc.card_number, '')
        ),
        'imageUrl', pc.image_url
      )
      FROM public.product_catalog pc
      WHERE pc.id = v_product_id
    ),
    (
      SELECT jsonb_build_object(
        'avgSoldPrice', COALESCE(ROUND(AVG(co.final_price)), 0),
        'marketLowestPrice', COALESCE((
          SELECT mps.lowest_price
          FROM public.marketplace_product_summaries mps
          WHERE mps.product_id = v_product_id
        ), 0),
        'totalViews', COALESCE((
          SELECT SUM(ls.views)::bigint
          FROM public.listing_stats ls
          INNER JOIN merchant_product_listings mpl ON mpl.listing_id = ls.listing_id
        ), 0),
        'totalOffers', COALESCE((
          SELECT SUM(ls.offers_count)::bigint
          FROM public.listing_stats ls
          INNER JOIN merchant_product_listings mpl ON mpl.listing_id = ls.listing_id
        ), 0)
      )
      FROM completed_orders co
    ),
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'label', sr.label,
            'totalSales', sr.total_sales,
            'txCount', sr.tx_count,
            'viewCount', sr.view_count,
            'offerCount', sr.offer_count
          )
          ORDER BY sr.bucket_start
        )
        FROM series_rows sr
      ),
      '[]'::jsonb
    ),
    (
      SELECT jsonb_build_object(
        'items', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'orderId', hr.id,
                'orderNumber', COALESCE(NULLIF(trim(hr.order_number), ''), hr.id::text),
                'buyerId', hr.buyer_id,
                'buyerName', hr.buyer_name,
                'finalPrice', hr.final_price,
                'eventAt', hr.event_at
              )
              ORDER BY hr.event_at DESC
            )
            FROM history_rows hr
          ),
          '[]'::jsonb
        ),
        'meta', jsonb_build_object(
          'totalCount', ht.total_count,
          'page', v_history_page,
          'pageSize', v_history_page_size,
          'totalPages', GREATEST(CEIL(ht.total_count::numeric / NULLIF(v_history_page_size, 0)), 1)
        )
      )
      FROM history_total ht
    )
  INTO v_product, v_summary, v_series, v_history;

  RETURN jsonb_build_object(
    'product', COALESCE(v_product, jsonb_build_object('id', v_product_id, 'name', '未知商品', 'skuNo', '—', 'imageUrl', '')),
    'summary', COALESCE(v_summary, jsonb_build_object('avgSoldPrice', 0, 'marketLowestPrice', 0, 'totalViews', 0, 'totalOffers', 0)),
    'series', COALESCE(v_series, '[]'::jsonb),
    'history', COALESCE(v_history, jsonb_build_object('items', '[]'::jsonb, 'meta', jsonb_build_object('totalCount', 0, 'page', v_history_page, 'pageSize', v_history_page_size, 'totalPages', 1))),
    'timeRange', v_time_range
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_product_analytics(text, text, integer, integer) TO authenticated;
