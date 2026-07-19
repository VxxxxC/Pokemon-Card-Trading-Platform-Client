import type { MarketplacePriceChartPoint } from "@/app/lib/marketplace/types";
import { listingMatchesWishlistGrade, normalizeWishlistGrading } from "@/lib/wishlist/grading";
import type { Json, Tables } from "@/types/supabase";

export type CatalogRow = Tables<"product_catalog">;
export type MarketPriceRow = Pick<
  Tables<"product_grading_market_prices">,
  | "product_id"
  | "grading_company"
  | "grading_score"
  | "market_avg_price"
  | "market_trend_30d"
  | "market_chart_data"
  | "market_data_source"
>;
export type ListingPriceRow = Pick<
  Tables<"listings">,
  | "id"
  | "product_id"
  | "grading_company"
  | "grading_score"
  | "price"
  | "source_collection_id"
  | "status"
>;

export function toFiniteNumber(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(Number(value))) {
    return null;
  }
  return Number(value);
}

export function parseMarketChartData(
  json: Json | null,
): MarketplacePriceChartPoint[] {
  if (!json || !Array.isArray(json)) {
    return [];
  }

  const points: MarketplacePriceChartPoint[] = [];

  for (const item of json) {
    if (
      typeof item !== "object" ||
      item === null ||
      !("date" in item) ||
      !("price" in item)
    ) {
      continue;
    }

    const date = String((item as { date: unknown }).date);
    const price = Number((item as { price: unknown }).price);
    if (!date || !Number.isFinite(price)) {
      continue;
    }

    points.push({ date, price });
  }

  return points;
}

export function resolveProductName(catalog: CatalogRow | undefined): string {
  if (!catalog) return "未知卡牌";
  return (
    catalog.name_zh?.trim() ||
    catalog.name_en?.trim() ||
    catalog.name_ja?.trim() ||
    "未知卡牌"
  );
}

export function resolveCardCode(catalog: CatalogRow | undefined): string {
  if (!catalog) return "";
  return (
    catalog.card_number?.trim() ||
    catalog.display_id?.trim() ||
    catalog.set_code?.trim() ||
    ""
  );
}

export function normalizeValuationGradeKey(
  gradingCompany: string,
  gradingScore: string | null | undefined,
): { gradingCompany: string; gradingScore: string } {
  const grading = normalizeWishlistGrading(gradingCompany, gradingScore);
  return {
    gradingCompany: grading.gradingCompany,
    gradingScore: grading.gradingScore,
  };
}

/** Exact product + grading_company + grading_score only (no cross-score fallback). */
export function findExactMarketPriceRow(
  rows: MarketPriceRow[],
  productId: string,
  gradingCompany: string,
  gradingScore: string,
): MarketPriceRow | undefined {
  return rows.find(
    (row) =>
      row.product_id === productId &&
      row.grading_company === gradingCompany &&
      row.grading_score === gradingScore,
  );
}

export type MarketCacheValuationSource = "snkrdunk" | "platform";

export function resolveMarketCacheValue(
  marketRow: MarketPriceRow | undefined,
): { value: number | null; source: MarketCacheValuationSource | null } {
  const avg = toFiniteNumber(marketRow?.market_avg_price ?? null);
  if (avg == null || avg <= 0) {
    return { value: null, source: null };
  }

  const rawSource = (marketRow?.market_data_source ?? "").trim().toLowerCase();
  if (rawSource === "platform") {
    return { value: avg, source: "platform" };
  }

  return { value: avg, source: "snkrdunk" };
}

export type CollectionValuationSource = "snkrdunk" | "platform" | "purchase_price";

export type ResolvedCollectionMarketValue = {
  value: number | null;
  source: CollectionValuationSource | null;
};

/**
 * Collection portfolio valuation: exact-grade SNKRDUNK cache → exact-grade platform-trade cache → purchase_price.
 * Does not use other grades or active listing ask prices.
 */
export function resolveCollectionMarketValue(input: {
  marketRows: MarketPriceRow[];
  productId: string;
  gradingCompany: string;
  gradingScore: string;
  purchasePrice: number;
}): ResolvedCollectionMarketValue {
  const { gradingCompany, gradingScore } = normalizeValuationGradeKey(
    input.gradingCompany,
    input.gradingScore,
  );
  const exactMarket = findExactMarketPriceRow(
    input.marketRows,
    input.productId,
    gradingCompany,
    gradingScore,
  );
  const cache = resolveMarketCacheValue(exactMarket);
  if (cache.value != null && cache.source != null) {
    return { value: cache.value, source: cache.source };
  }

  if (input.purchasePrice > 0) {
    return { value: input.purchasePrice, source: "purchase_price" };
  }

  return { value: null, source: null };
}

export function lowestListingForGrade(
  listings: ListingPriceRow[],
  productId: string,
  gradingCompany: string,
  gradingScore: string,
): number | null {
  const prices = listings
    .filter(
      (row) =>
        row.product_id === productId &&
        listingMatchesWishlistGrade(
          row.grading_company,
          row.grading_score,
          gradingCompany,
          gradingScore,
        ),
    )
    .map((row) => Number(row.price))
    .filter((price) => Number.isFinite(price) && price > 0);

  if (prices.length === 0) return null;
  return Math.min(...prices);
}

export function findActiveListingForGrade(
  listings: ListingPriceRow[],
  productId: string,
  gradingCompany: string,
  gradingScore: string,
): ListingPriceRow | undefined {
  return listings.find(
    (row) =>
      row.product_id === productId &&
      listingMatchesWishlistGrade(
        row.grading_company,
        row.grading_score,
        gradingCompany,
        gradingScore,
      ),
  );
}
