-- Platform completed trades → product_price_snapshots ledger (source=platform).

ALTER TABLE public.product_price_snapshots
  ADD COLUMN IF NOT EXISTS member_order_id uuid NULL;

CREATE UNIQUE INDEX IF NOT EXISTS product_price_snapshots_member_order_id_key
  ON public.product_price_snapshots (member_order_id)
  WHERE member_order_id IS NOT NULL;

ALTER TABLE public.product_price_snapshots
  DROP CONSTRAINT IF EXISTS product_price_snapshots_member_order_id_fkey;

ALTER TABLE public.product_price_snapshots
  ADD CONSTRAINT product_price_snapshots_member_order_id_fkey
  FOREIGN KEY (member_order_id)
  REFERENCES public.member_orders (id)
  ON DELETE SET NULL;

GRANT INSERT, UPDATE ON public.product_price_snapshots TO service_role;
