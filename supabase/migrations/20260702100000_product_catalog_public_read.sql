-- Allow public read access to master catalog (required for AddAssetModal search)
GRANT SELECT ON public.product_catalog TO anon, authenticated;

ALTER TABLE public.product_catalog ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "product_catalog_public_read" ON public.product_catalog;

CREATE POLICY "product_catalog_public_read"
  ON public.product_catalog
  FOR SELECT
  TO anon, authenticated
  USING (true);
