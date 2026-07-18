-- Map merchant escrow_state to member_order_state for unified user trading list.

CREATE OR REPLACE FUNCTION public.fn_map_merchant_escrow_to_member_status(
  p_escrow_status public.escrow_state
)
RETURNS public.member_order_state
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE p_escrow_status
    WHEN 'completed_and_transferred'::public.escrow_state THEN 'completed'::public.member_order_state
    WHEN 'refunded'::public.escrow_state THEN 'cancelled'::public.member_order_state
    ELSE 'pending'::public.member_order_state
  END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_user_reviewed_merchant_order_ids(
  p_order_ids UUID[]
)
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT r.merchant_order_id
  FROM public.transaction_reviews r
  WHERE r.reviewer_id = auth.uid()
    AND r.merchant_order_id IS NOT NULL
    AND r.merchant_order_id = ANY(p_order_ids);
$$;

REVOKE ALL ON FUNCTION public.rpc_get_user_reviewed_merchant_order_ids(UUID[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rpc_get_user_reviewed_merchant_order_ids(UUID[]) TO authenticated, service_role;
