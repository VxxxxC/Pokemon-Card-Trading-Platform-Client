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

export function normalizeWishlistGrading(
  gradingCompany: string,
  gradingScore: string | null | undefined,
): { gradingCompany: string; gradingScore: string; gradeLabel: string } {
  const company = normalizeGradingCompany(gradingCompany);
  const score = resolveMarketPriceDbScore(
    company,
    gradingScore,
    company === "RAW" ? gradingScore : null,
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
