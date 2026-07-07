import type { MarketplaceProductListingsInput } from "@/app/lib/marketplace/types";
import {
  MARKETPLACE_PRODUCT_CATALOG_CACHE_SECONDS,
  MARKETPLACE_PRODUCT_DEFAULT_LISTINGS_CACHE_SECONDS,
  MARKETPLACE_PRODUCT_MARKET_PRICES_CACHE_SECONDS,
} from "@/lib/marketplace/constants";

export const DEFAULT_PRODUCT_DETAIL_LISTINGS_PAGE_SIZE = 5;

/** First paint on product detail — matches ProductDetailPageData SSR + client defaults. */
export function isDefaultProductDetailListingsInput(
  input: MarketplaceProductListingsInput,
): boolean {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.max(1, input.pageSize ?? DEFAULT_PRODUCT_DETAIL_LISTINGS_PAGE_SIZE);
  const sort = input.sort ?? "price_asc";
  const onlyGraded = input.onlyGraded ?? false;
  const hasGradeFilters = Boolean(
    input.gradeFilters && input.gradeFilters.length > 0,
  );

  return (
    page === 1 &&
    pageSize === DEFAULT_PRODUCT_DETAIL_LISTINGS_PAGE_SIZE &&
    sort === "price_asc" &&
    !onlyGraded &&
    !hasGradeFilters
  );
}
