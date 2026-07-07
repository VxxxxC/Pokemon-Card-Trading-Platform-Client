-- Keep marketplace_product_summaries in sync when listings change.
-- MV filters status = 'active' at refresh time; without this trigger, inactive
-- listings can remain visible until a manual refresh.

CREATE OR REPLACE FUNCTION public.trg_refresh_marketplace_product_summaries()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Non-concurrent refresh: CONCURRENTLY cannot run in the same transaction
  -- that modified underlying listings rows.
  REFRESH MATERIALIZED VIEW public.marketplace_product_summaries;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS listings_refresh_marketplace_summaries ON public.listings;

CREATE TRIGGER listings_refresh_marketplace_summaries
  AFTER INSERT OR DELETE OR UPDATE OF
    status,
    price,
    product_id,
    grading_company,
    grading_score,
    seller_id,
    use_authentication,
    seller_persona
  ON public.listings
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.trg_refresh_marketplace_product_summaries();

-- Clear stale rows that were visible before this trigger existed.
REFRESH MATERIALIZED VIEW public.marketplace_product_summaries;
