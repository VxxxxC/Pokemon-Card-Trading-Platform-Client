-- Merchant storefront identity columns (SSOT for merchant persona, separate from profiles)

ALTER TABLE public.merchant_shops
  ADD COLUMN IF NOT EXISTS shop_name TEXT,
  ADD COLUMN IF NOT EXISTS shop_handle TEXT;

-- One-time backfill from profiles for existing merchants
UPDATE public.merchant_shops ms
SET
  shop_name = COALESCE(ms.shop_name, p.display_name),
  shop_handle = COALESCE(ms.shop_handle, p.username)
FROM public.profiles p
WHERE p.id = ms.merchant_id
  AND p.role = 'merchant';

UPDATE public.merchant_shops
SET shop_name = COALESCE(shop_name, '新認證商戶')
WHERE shop_name IS NULL OR btrim(shop_name) = '';

CREATE UNIQUE INDEX IF NOT EXISTS merchant_shops_shop_handle_lower_idx
  ON public.merchant_shops (lower(shop_handle))
  WHERE shop_handle IS NOT NULL AND btrim(shop_handle) <> '';

-- Owner can update own shop row (storefront settings)
GRANT SELECT ON public.merchant_shops TO anon, authenticated;
GRANT UPDATE ON public.merchant_shops TO authenticated;

ALTER TABLE public.merchant_shops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "merchant_shops_select_public" ON public.merchant_shops;
CREATE POLICY "merchant_shops_select_public"
  ON public.merchant_shops
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "merchant_shops_update_own" ON public.merchant_shops;
CREATE POLICY "merchant_shops_update_own"
  ON public.merchant_shops
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = merchant_id)
  WITH CHECK (auth.uid() = merchant_id);

GRANT INSERT ON public.merchant_shops TO authenticated;

DROP POLICY IF EXISTS "merchant_shops_insert_own" ON public.merchant_shops;
CREATE POLICY "merchant_shops_insert_own"
  ON public.merchant_shops
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = merchant_id);

-- KYC init: default shop_name on new merchant_shops rows
CREATE OR REPLACE FUNCTION public.fn_handle_kyc_verified()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT' AND NEW.kyc_status = 'verified') OR
       (TG_OP = 'UPDATE' AND NEW.kyc_status = 'verified' AND OLD.kyc_status IS DISTINCT FROM 'verified') THEN

        INSERT INTO public.merchant_shops (
            merchant_id,
            completed_trades_count,
            rating_score,
            shop_rating_score,
            shop_description,
            shop_name
        )
        VALUES (
            NEW.merchant_id,
            0,
            5.0,
            5.0,
            '新認證優質商戶店鋪',
            '新認證優質商戶店鋪'
        )
        ON CONFLICT (merchant_id) DO NOTHING;

        PERFORM public.fn_recalculate_reputation_tags(NEW.merchant_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
