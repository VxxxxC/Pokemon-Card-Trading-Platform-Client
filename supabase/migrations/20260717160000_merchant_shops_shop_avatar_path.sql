-- Merchant shop avatar (storefront SSOT — independent from profiles.avatar_path)

ALTER TABLE public.merchant_shops
  ADD COLUMN IF NOT EXISTS shop_avatar_path TEXT;

COMMENT ON COLUMN public.merchant_shops.shop_avatar_path IS
  'Bunny CDN URL or storage path for merchant storefront avatar; not profiles.avatar_path';

-- Chat / inbox snippets: merchant persona uses shop avatar
CREATE OR REPLACE FUNCTION public.fn_chat_party_profile_snippet(
  p_profile_id UUID,
  p_persona public.seller_persona_type
)
RETURNS JSONB
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', p.id,
    'persona', p_persona,
    'display_name', p.display_name,
    'username', p.username,
    'role', p.role,
    'avatar_path', CASE
      WHEN p_persona = 'merchant' THEN ms.shop_avatar_path
      ELSE p.avatar_path
    END,
    'shop_name', ms.shop_name,
    'shop_handle', ms.shop_handle,
    'is_merchant', (p_persona = 'merchant')
  )
  FROM public.profiles p
  LEFT JOIN public.merchant_shops ms ON ms.merchant_id = p.id
  WHERE p.id = p_profile_id;
$$;

GRANT EXECUTE ON FUNCTION public.fn_chat_party_profile_snippet(UUID, public.seller_persona_type)
  TO anon, authenticated, service_role;
