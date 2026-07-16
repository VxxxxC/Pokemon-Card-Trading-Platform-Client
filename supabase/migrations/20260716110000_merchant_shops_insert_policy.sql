-- Allow merchants to bootstrap their own merchant_shops row (settings page)

GRANT INSERT ON public.merchant_shops TO authenticated;

DROP POLICY IF EXISTS "merchant_shops_insert_own" ON public.merchant_shops;
CREATE POLICY "merchant_shops_insert_own"
  ON public.merchant_shops
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = merchant_id);
