import {
  computePortfolioTotals,
  type CollectionPricingContext,
  type CollectionRow,
} from "@/lib/collection/build-entries";
import {
  resolveCollectionMarketValue,
  toFiniteNumber,
  type ListingPriceRow,
} from "@/lib/marketplace/portfolio-pricing";
import { listingMatchesWishlistGrade } from "@/lib/wishlist/grading";

export type MemberTradingStatsInput = {
  completedTradesCount: number;
  collectionRows: CollectionRow[];
  activeListings: ListingPriceRow[];
  context: CollectionPricingContext;
};

export type MemberTradingStatsResult = {
  completedTradesCount: number;
  heldCardCount: number;
  listedForSaleCount: number;
  totalMarketValue: number;
};

function collectionRowMatchesListing(
  row: CollectionRow,
  listing: ListingPriceRow,
): boolean {
  return (
    row.product_id === listing.product_id &&
    listingMatchesWishlistGrade(
      listing.grading_company,
      listing.grading_score,
      row.grading_company,
      row.grading_score,
    )
  );
}

export function findOrphanActiveListings(
  collectionRows: CollectionRow[],
  activeListings: ListingPriceRow[],
): ListingPriceRow[] {
  return activeListings.filter(
    (listing) =>
      !collectionRows.some((row) => collectionRowMatchesListing(row, listing)),
  );
}

export function computeMemberTradingStats(
  input: MemberTradingStatsInput,
): MemberTradingStatsResult {
  const { completedTradesCount, collectionRows, activeListings, context } = input;
  const portfolio = computePortfolioTotals(collectionRows, context);
  const orphanListings = findOrphanActiveListings(collectionRows, activeListings);

  let orphanMarketValue = 0;
  for (const listing of orphanListings) {
    const purchasePrice = toFiniteNumber(listing.price) ?? 0;
    const resolved = resolveCollectionMarketValue({
      marketRows: context.marketRows,
      listingRows: context.platformListingRows,
      productId: listing.product_id,
      gradingCompany: listing.grading_company,
      gradingScore: listing.grading_score ?? "",
      purchasePrice,
    });
    if (resolved.value != null) {
      orphanMarketValue += resolved.value;
    }
  }

  const orphanCount = orphanListings.length;

  return {
    completedTradesCount,
    heldCardCount: portfolio.cardCount + orphanCount,
    listedForSaleCount: portfolio.listedCount + orphanCount,
    totalMarketValue: portfolio.totalMarketValue + orphanMarketValue,
  };
}
