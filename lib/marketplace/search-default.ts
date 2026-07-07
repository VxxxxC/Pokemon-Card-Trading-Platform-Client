import type { MarketplaceSearchInput } from "@/app/lib/marketplace/types";
import {
  MARKETPLACE_GRID_PAGE_SIZE,
  MARKETPLACE_SEARCH_CACHE_SECONDS,
} from "@/lib/marketplace/constants";

export function isDefaultBrowsableMarketplaceSearch(
  input: MarketplaceSearchInput,
  page: number,
  pageSize: number,
): boolean {
  const hasKeyword =
    Boolean(input.query?.trim()) ||
    Boolean(input.setCode?.trim()) ||
    Boolean(input.cardNumber?.trim());

  const hasRarities = Boolean(input.rarities && input.rarities.length > 0);
  const hasGrades = Boolean(input.gradeFilters && input.gradeFilters.length > 0);
  const hasSellerModes = Boolean(
    input.sellerModes && input.sellerModes.length > 0,
  );
  const hasPriceFilter =
    input.priceMin != null || input.priceMax != null;
  const sortKey = input.sortKey ?? "最新";

  return (
    page === 1 &&
    pageSize === MARKETPLACE_GRID_PAGE_SIZE &&
    !hasKeyword &&
    !hasRarities &&
    !hasGrades &&
    !hasSellerModes &&
    !hasPriceFilter &&
    sortKey === "最新"
  );
}

export { MARKETPLACE_SEARCH_CACHE_SECONDS };
