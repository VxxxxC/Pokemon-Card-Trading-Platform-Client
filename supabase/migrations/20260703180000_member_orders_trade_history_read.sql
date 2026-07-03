-- Product detail trade history: authenticated read on completed member_orders + sold listings join

GRANT SELECT ON public.member_orders TO authenticated;

ALTER TABLE public.member_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "member_orders_completed_read_authenticated" ON public.member_orders;

CREATE POLICY "member_orders_completed_read_authenticated"
  ON public.member_orders
  FOR SELECT
  TO authenticated
  USING (status = 'completed');

DROP POLICY IF EXISTS "listings_authenticated_read_sold" ON public.listings;

CREATE POLICY "listings_authenticated_read_sold"
  ON public.listings
  FOR SELECT
  TO authenticated
  USING (status IN ('active', 'sold', 'inactive'));

CREATE INDEX IF NOT EXISTS idx_member_orders_completed_listing_created
  ON public.member_orders (listing_id, created_at DESC)
  WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_listings_product_id
  ON public.listings (product_id);
