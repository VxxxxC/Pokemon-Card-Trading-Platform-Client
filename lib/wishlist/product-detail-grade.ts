import {
  defaultSealedProductScore,
  isSealedCatalogType,
} from "@/lib/catalog/item-kind";
import { getGradingOption, hasGradingOption } from "@/lib/grading/options";
import {
  getMarketplaceSealStateOption,
  isMarketplaceSealStateKey,
} from "@/lib/marketplace/filter-options";
import { wishlistGradeFromGradingOption } from "@/lib/wishlist/grading";
import type { MarketplaceProductDetail } from "@/app/lib/marketplace/types";

type LowestListingGrade = {
  gradingCompany: string;
  gradingScore: string | null;
};

export function resolveProductDetailWishlistGrade(
  product: Pick<MarketplaceProductDetail, "catalogType">,
  selectedGradeFilterId: string,
  lowestListing?: LowestListingGrade | null,
): { gradingCompany: string; gradingScore: string } {
  const isSealed = isSealedCatalogType(product.catalogType);

  if (isSealed) {
    if (isMarketplaceSealStateKey(selectedGradeFilterId)) {
      const option = getMarketplaceSealStateOption(selectedGradeFilterId)!;
      return {
        gradingCompany: option.company,
        gradingScore: option.score,
      };
    }
    const sealState = defaultSealedProductScore();
    return { gradingCompany: "OTHER", gradingScore: sealState };
  }

  if (selectedGradeFilterId !== "ALL" && hasGradingOption(selectedGradeFilterId)) {
    const option = getGradingOption(selectedGradeFilterId);
    return wishlistGradeFromGradingOption(option);
  }

  if (lowestListing?.gradingCompany) {
    return {
      gradingCompany: lowestListing.gradingCompany,
      gradingScore: lowestListing.gradingScore?.trim() || "A",
    };
  }

  return { gradingCompany: "RAW", gradingScore: "A" };
}
