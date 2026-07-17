-- Merchant performance analytics: completed-order aggregates per merchant (live RPC, no MV)

CREATE INDEX IF NOT EXISTS idx_merchant_orders_perf_completed
  ON public.merchant_orders (merchant_id, updated_at DESC)
  WHERE escrow_status = 'completed_and_transferred';

CREATE OR REPLACE FUNCTION public.get_merchant_performance_analytics(
  p_time_range text DEFAULT '7d',
  p_top_limit integer DEFAULT 9
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  v_merchant_id uuid;
  v_time_range text;
  v_top_limit integer;
  v_range_end timestamptz;
  v_range_start timestamptz;
  v_all_time jsonb;
  v_interval jsonb;
  v_series jsonb;
  v_top_products jsonb;
  v_top_spenders jsonb;
BEGIN
  v_merchant_id := auth.uid();
  IF v_merchant_id IS NULL THEN
    RETURN NULL;
  END IF;

  v_time_range := COALESCE(NULLIF(trim(p_time_range), ''), '7d');
  IF v_time_range NOT IN ('12h', '7d', '1m', '3m', '6m', '12m') THEN
    v_time_range := '7d';
  END IF;

  v_top_limit := LEAST(GREATEST(COALESCE(p_top_limit, 9), 1), 50);
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

  WITH completed_orders AS (
    SELECT
      mo.id,
      mo.buyer_id,
      mo.final_price,
      COALESCE(mo.updated_at, mo.created_at) AS event_at,
      l.product_id
    FROM public.merchant_orders mo
    INNER JOIN public.listings l ON l.id = mo.listing_id
    WHERE mo.merchant_id = v_merchant_id
      AND mo.escrow_status = 'completed_and_transferred'
  ),
  all_time_stats AS (
    SELECT
      COALESCE(SUM(final_price), 0)::numeric AS turnover,
      COUNT(*)::bigint AS tx_count
    FROM completed_orders
  ),
  interval_orders AS (
    SELECT *
    FROM completed_orders
    WHERE event_at >= v_range_start
      AND event_at <= v_range_end
  ),
  interval_stats AS (
    SELECT
      COALESCE(SUM(final_price), 0)::numeric AS turnover,
      COUNT(*)::bigint AS tx_count
    FROM interval_orders
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
      COALESCE(SUM(co.final_price), 0)::numeric AS turnover,
      COUNT(co.id)::bigint AS tx_count
    FROM buckets b
    LEFT JOIN completed_orders co
      ON co.event_at >= b.bucket_start
      AND co.event_at < b.bucket_end
    GROUP BY b.bucket_start, b.label
  ),
  product_rows AS (
    SELECT
      l.product_id,
      COALESCE(NULLIF(trim(pc.name_zh), ''), NULLIF(trim(pc.name_ja), ''), NULLIF(trim(pc.name_en), ''), '未知商品') AS name,
      COALESCE(
        NULLIF(trim(pc.display_id), ''),
        pc.set_code || '-' || COALESCE(pc.card_number, '')
      ) AS sku_no,
      COUNT(*)::bigint AS volume,
      COALESCE(SUM(mo.final_price), 0)::numeric AS revenue
    FROM public.merchant_orders mo
    INNER JOIN public.listings l ON l.id = mo.listing_id
    INNER JOIN public.product_catalog pc ON pc.id = l.product_id
    WHERE mo.merchant_id = v_merchant_id
      AND mo.escrow_status = 'completed_and_transferred'
    GROUP BY l.product_id, pc.name_zh, pc.name_ja, pc.name_en, pc.display_id, pc.set_code, pc.card_number
    ORDER BY revenue DESC, volume DESC
    LIMIT v_top_limit
  ),
  spender_rows AS (
    SELECT
      mo.buyer_id,
      COALESCE(
        NULLIF(trim(p.display_name), ''),
        NULLIF(trim(p.username), ''),
        '用戶'
      ) AS name,
      p.avatar_path,
      COALESCE(SUM(mo.final_price), 0)::numeric AS spending
    FROM public.merchant_orders mo
    INNER JOIN public.profiles p ON p.id = mo.buyer_id
    WHERE mo.merchant_id = v_merchant_id
      AND mo.escrow_status = 'completed_and_transferred'
    GROUP BY mo.buyer_id, p.display_name, p.username, p.avatar_path
    ORDER BY spending DESC
    LIMIT v_top_limit
  )
  SELECT
    (
      SELECT jsonb_build_object(
        'turnover', ats.turnover,
        'txCount', ats.tx_count,
        'avgPrice', COALESCE(ROUND(ats.turnover / NULLIF(ats.tx_count, 0)), 0)
      )
      FROM all_time_stats ats
    ),
    (
      SELECT jsonb_build_object(
        'turnover', ist.turnover,
        'txCount', ist.tx_count,
        'avgPrice', COALESCE(ROUND(ist.turnover / NULLIF(ist.tx_count, 0)), 0)
      )
      FROM interval_stats ist
    ),
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'label', sr.label,
            'turnover', sr.turnover,
            'txCount', sr.tx_count,
            'avgPrice', COALESCE(ROUND(sr.turnover / NULLIF(sr.tx_count, 0)), 0)
          )
          ORDER BY sr.bucket_start
        )
        FROM series_rows sr
      ),
      '[]'::jsonb
    ),
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'rank', pr.rank,
            'productId', pr.product_id,
            'name', pr.name,
            'skuNo', pr.sku_no,
            'volume', pr.volume,
            'revenue', pr.revenue
          )
          ORDER BY pr.rank
        )
        FROM (
          SELECT
            product_id,
            name,
            sku_no,
            volume,
            revenue,
            ROW_NUMBER() OVER (ORDER BY revenue DESC, volume DESC) AS rank
          FROM product_rows
        ) pr
      ),
      '[]'::jsonb
    ),
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'rank', sr.rank,
            'buyerId', sr.buyer_id,
            'name', sr.name,
            'avatarPath', sr.avatar_path,
            'spending', sr.spending
          )
          ORDER BY sr.rank
        )
        FROM (
          SELECT
            buyer_id,
            name,
            avatar_path,
            spending,
            ROW_NUMBER() OVER (ORDER BY spending DESC) AS rank
          FROM spender_rows
        ) sr
      ),
      '[]'::jsonb
    )
  INTO v_all_time, v_interval, v_series, v_top_products, v_top_spenders;

  RETURN jsonb_build_object(
    'allTime', COALESCE(v_all_time, jsonb_build_object('turnover', 0, 'txCount', 0, 'avgPrice', 0)),
    'interval', COALESCE(v_interval, jsonb_build_object('turnover', 0, 'txCount', 0, 'avgPrice', 0)),
    'series', COALESCE(v_series, '[]'::jsonb),
    'topProducts', COALESCE(v_top_products, '[]'::jsonb),
    'topSpenders', COALESCE(v_top_spenders, '[]'::jsonb),
    'timeRange', v_time_range
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_merchant_performance_analytics(text, integer) TO authenticated;
