-- Simplify listings INSERT policy: authenticated seller only (no profile role subquery)

DROP POLICY IF EXISTS "listings_owner_insert" ON public.listings;

CREATE POLICY "listings_owner_insert"
  ON public.listings
  FOR INSERT
  TO authenticated
  WITH CHECK (seller_id = auth.uid());
