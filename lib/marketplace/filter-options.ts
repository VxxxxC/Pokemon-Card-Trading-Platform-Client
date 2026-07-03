/** Seller source chips shown in marketplace filters (maps to RPC `p_seller_modes`). */
export const MARKETPLACE_SELLER_SOURCE_OPTIONS = [
  { key: "MEMBER", label: "會員" },
  { key: "MERCHANT", label: "認證商戶" },
] as const;

export type MarketplaceSellerSourceKey =
  (typeof MARKETPLACE_SELLER_SOURCE_OPTIONS)[number]["key"];
