-- Increment listing view count when buyer opens ExecutionSlideOver

CREATE OR REPLACE FUNCTION public.rpc_increment_listing_view(p_listing_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.listings l
    WHERE l.id = p_listing_id
      AND l.status = 'active'
  ) THEN
    RETURN;
  END IF;

  UPDATE public.listing_stats
  SET
    views = views + 1,
    updated_at = now()
  WHERE listing_id = p_listing_id;

  IF NOT FOUND THEN
    INSERT INTO public.listing_stats (listing_id, views, offers_count)
    VALUES (p_listing_id, 1, 0)
    ON CONFLICT (listing_id) DO UPDATE
    SET
      views = public.listing_stats.views + 1,
      updated_at = now();
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.rpc_increment_listing_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_increment_listing_view(UUID) TO authenticated;
