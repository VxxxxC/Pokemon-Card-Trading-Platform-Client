-- E2E admin client (service_role) needs table grants for report audit helpers

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reports TO service_role;
