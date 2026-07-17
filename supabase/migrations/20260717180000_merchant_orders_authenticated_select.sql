-- merchant_orders: allow authenticated SELECT (RLS policy already restricts rows)

GRANT SELECT ON public.merchant_orders TO authenticated;
