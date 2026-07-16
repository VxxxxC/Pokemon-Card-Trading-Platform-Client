-- merchant_shops had RLS enabled without SELECT grants — authenticated reads failed

GRANT SELECT ON public.merchant_shops TO anon, authenticated;

ALTER TABLE public.merchant_shops
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_handle TEXT;

ALTER TABLE public.merchant_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_shops_select_public" ON public.merchant_shops;
CREATE POLICY "merchant_shops_select_public"
  ON public.merchant_shops
  FOR SELECT
  TO anon, authenticated
  USING (true);
