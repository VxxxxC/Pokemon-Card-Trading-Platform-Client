-- Allow public read of aggregated market prices (product detail chart + banner)
GRANT SELECT ON public.product_grading_market_prices TO anon, authenticated;

ALTER TABLE public.product_grading_market_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_grading_market_prices_public_read" ON public.product_grading_market_prices;

CREATE POLICY "product_grading_market_prices_public_read"
  ON public.product_grading_market_prices
  FOR SELECT
  TO anon, authenticated
  USING (true);
