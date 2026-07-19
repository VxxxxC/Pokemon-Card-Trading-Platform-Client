import {
  CATALOG_TYPES_BOX_SET,
  CATALOG_TYPES_CARD,
  type CatalogType,
} from "@/lib/constants/commerce";

/** Seller source chips shown in marketplace filters (maps to RPC `p_seller_modes`). */
export const MARKETPLACE_SELLER_SOURCE_OPTIONS = [
  { key: "MEMBER", label: "會員" },
  { key: "MERCHANT", label: "認證商戶" },
] as const;

export type MarketplaceSellerSourceKey =
  (typeof MARKETPLACE_SELLER_SOURCE_OPTIONS)[number]["key"];

/** Product kind chips (maps to RPC `p_catalog_types`). */
export const MARKETPLACE_PRODUCT_KIND_OPTIONS = [
  { key: "single_card", label: "單卡", catalogTypes: CATALOG_TYPES_CARD },
  {
    key: "sealed_product",
    label: "盒組／密封",
    catalogTypes: CATALOG_TYPES_BOX_SET,
  },
] as const;

export type MarketplaceProductKindKey =
  (typeof MARKETPLACE_PRODUCT_KIND_OPTIONS)[number]["key"];

/** Seal state grade filters for non-single-card listings (OTHER + SEALED|UNSEALED). */
export const MARKETPLACE_SEAL_STATE_OPTIONS = [
  { key: "sealed:SEALED", label: "密封", company: "OTHER", score: "SEALED" },
  {
    key: "sealed:UNSEALED",
    label: "已開封",
    company: "OTHER",
    score: "UNSEALED",
  },
] as const;

export type MarketplaceSealStateKey =
  (typeof MARKETPLACE_SEAL_STATE_OPTIONS)[number]["key"];

const sealStateOptionByKey = new Map(
  MARKETPLACE_SEAL_STATE_OPTIONS.map((option) => [option.key, option]),
);

const productKindOptionByKey = new Map(
  MARKETPLACE_PRODUCT_KIND_OPTIONS.map((option) => [option.key, option]),
);

export function isMarketplaceSealStateKey(key: string): boolean {
  return sealStateOptionByKey.has(key as MarketplaceSealStateKey);
}

export function getMarketplaceSealStateOption(key: string) {
  return sealStateOptionByKey.get(key as MarketplaceSealStateKey);
}

export function resolveCatalogTypesFromProductKinds(
  keys: string[],
): CatalogType[] {
  const types = new Set<CatalogType>();
  for (const key of keys) {
    const option = productKindOptionByKey.get(key as MarketplaceProductKindKey);
    if (!option) continue;
    for (const catalogType of option.catalogTypes) {
      types.add(catalogType);
    }
  }
  return [...types];
}
