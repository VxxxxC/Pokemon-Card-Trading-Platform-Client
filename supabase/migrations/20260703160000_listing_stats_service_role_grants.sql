-- listing_stats row is created by trigger_init_listing_stats after listings INSERT.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listing_stats TO service_role;
