import type { Tables } from "@/types/supabase";

export type DualPersonaContext = {
  hasDualPersona: boolean;
  memberDisplayName: string | null;
  memberUsername: string | null;
  shopName: string | null;
  shopHandle: string | null;
};

export const EMPTY_DUAL_PERSONA_CONTEXT: DualPersonaContext = {
  hasDualPersona: false,
  memberDisplayName: null,
  memberUsername: null,
  shopName: null,
  shopHandle: null,
};

type ProfileSnippet = Pick<
  Tables<"profiles">,
  "display_name" | "username" | "role"
>;

type MerchantShopSnippet = Pick<
  Tables<"merchant_shops">,
  "shop_name" | "shop_handle"
>;

export function buildDualPersonaContext(
  profile: ProfileSnippet | null | undefined,
  shop: MerchantShopSnippet | null | undefined,
): DualPersonaContext {
  if (!profile || profile.role !== "merchant" || !shop) {
    return EMPTY_DUAL_PERSONA_CONTEXT;
  }

  return {
    hasDualPersona: true,
    memberDisplayName: profile.display_name?.trim() || null,
    memberUsername: profile.username?.trim() || null,
    shopName: shop.shop_name?.trim() || null,
    shopHandle: shop.shop_handle?.trim() || null,
  };
}

export const SELF_OFFER_ERROR_MESSAGE =
  "您無法以另一身份對自己的商品出價（member / merchant 共用同一帳號）。";
