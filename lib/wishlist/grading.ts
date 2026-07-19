import {
  isSealedProductGrade,
  normalizeSealedProductScore,
  SEALED_PRODUCT_GRADING_COMPANY,
  sealedProductGradingOptionId,
} from "@/lib/catalog/item-kind";
import type { GradingOption } from "@/lib/grading/options";
import {
  DEFAULT_GRADING_OPTION_ID,
  GRADING_OPTIONS,
  normalizeGradingCompany,
} from "@/lib/grading/options";
import {
  formatMarketGradeLabel,
  resolveMarketPriceDbScore,
} from "@/lib/marketplace/market-price";

export function coerceLegacyWishlistGrading(
  gradingCompany: string,
  gradingScore: string | null | undefined,
): { gradingCompany: string; gradingScore: string | null | undefined } {
  const trimmedCompany = gradingCompany.trim();

  if (trimmedCompany === "密封") {
    return {
      gradingCompany: SEALED_PRODUCT_GRADING_COMPANY,
      gradingScore: "SEALED",
    };
  }

  if (trimmedCompany === "已開封") {
    return {
      gradingCompany: SEALED_PRODUCT_GRADING_COMPANY,
      gradingScore: "UNSEALED",
    };
  }

  if (isSealedProductGrade(gradingCompany, gradingScore)) {
    return {
      gradingCompany: SEALED_PRODUCT_GRADING_COMPANY,
      gradingScore: normalizeSealedProductScore(gradingCompany, gradingScore),
    };
  }

  return { gradingCompany, gradingScore };
}

export function normalizeWishlistGrading(
  gradingCompany: string,
  gradingScore: string | null | undefined,
): { gradingCompany: string; gradingScore: string; gradeLabel: string } {
  const coerced = coerceLegacyWishlistGrading(gradingCompany, gradingScore);
  const company = normalizeGradingCompany(coerced.gradingCompany);
  const score = resolveMarketPriceDbScore(
    company,
    coerced.gradingScore,
    company === "RAW" ? coerced.gradingScore : null,
  );

  return {
    gradingCompany: company,
    gradingScore: score,
    gradeLabel: formatMarketGradeLabel(company, score),
  };
}

export function gradingOptionIdFromWishlistRow(
  gradingCompany: string,
  gradingScore: string,
): string {
  if (isSealedProductGrade(gradingCompany, gradingScore)) {
    return sealedProductGradingOptionId(
      normalizeSealedProductScore(gradingCompany, gradingScore),
    );
  }

  const normalized = normalizeWishlistGrading(gradingCompany, gradingScore);

  for (const option of GRADING_OPTIONS) {
    const optionScore =
      option.company === "RAW" ? option.condition : option.score;
    const candidate = normalizeWishlistGrading(option.company, optionScore);
    if (
      candidate.gradingCompany === normalized.gradingCompany &&
      candidate.gradingScore === normalized.gradingScore
    ) {
      return option.id;
    }
  }

  return DEFAULT_GRADING_OPTION_ID;
}

export function wishlistGradeFromGradingOption(
  option: GradingOption,
): { gradingCompany: string; gradingScore: string } {
  const score = option.company === "RAW" ? option.condition : option.score;
  return normalizeWishlistGrading(option.company, score);
}

export function wishlistGradeKey(
  gradingCompany: string,
  gradingScore: string,
): string {
  return `${gradingCompany}::${gradingScore}`;
}

export function buildWishlistFavoredKey(
  productId: string,
  gradingCompany: string,
  gradingScore: string | null | undefined,
): string {
  const grading = normalizeWishlistGrading(gradingCompany, gradingScore);
  return `${productId}::${wishlistGradeKey(grading.gradingCompany, grading.gradingScore)}`;
}

/** Match listing row to wishlist grade after normalizing both sides. */
export function listingMatchesWishlistGrade(
  listingCompany: string,
  listingScore: string | null | undefined,
  wishlistCompany: string,
  wishlistScore: string,
): boolean {
  const listing = normalizeWishlistGrading(listingCompany, listingScore);
  const wishlist = normalizeWishlistGrading(wishlistCompany, wishlistScore);
  return (
    listing.gradingCompany === wishlist.gradingCompany &&
    listing.gradingScore === wishlist.gradingScore
  );
}
