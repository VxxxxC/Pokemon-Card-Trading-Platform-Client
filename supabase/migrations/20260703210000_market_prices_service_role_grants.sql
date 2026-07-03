-- Cron Job 2: market pricing aggregation writes via service_role.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_grading_market_prices TO service_role;
GRANT SELECT ON public.product_price_snapshots TO service_role;
