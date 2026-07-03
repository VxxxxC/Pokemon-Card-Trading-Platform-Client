import type { GradeFilter } from "@/app/lib/marketplace/types";
import { parseGradeFilters } from "@/app/lib/marketplace/searchParsers";

/** Build RPC grade filters from product detail order-book chip selection. */
export function buildProductListingGradeFilters(
  selectedGradeFilterId: string,
): GradeFilter[] | undefined {
  if (selectedGradeFilterId === "ALL") {
    return undefined;
  }
  return parseGradeFilters([selectedGradeFilterId]);
}
