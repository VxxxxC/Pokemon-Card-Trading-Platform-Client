-- Allow authenticated sellers to create and manage their own listings

GRANT INSERT, UPDATE ON public.listings TO authenticated;

DROP POLICY IF EXISTS "listings_owner_insert" ON public.listings;

CREATE POLICY "listings_owner_insert"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (
    seller_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.role IN ('member'::public.user_role, 'merchant'::public.user_role, 'admin'::public.user_role)
    )
  );

DROP POLICY IF EXISTS "listings_owner_update" ON public.listings;

CREATE POLICY "listings_owner_update"
  ON public.listings
  FOR UPDATE
  TO authenticated
  USING (seller_id = auth.uid())
  WITH CHECK (seller_id = auth.uid());

DROP POLICY IF EXISTS "listings_owner_read_own" ON public.listings;

CREATE POLICY "listings_owner_read_own"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (seller_id = auth.uid());
