-- Trusted server-side listing writes use service_role after auth verification.

GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO service_role;
