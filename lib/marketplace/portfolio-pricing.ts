import type { MarketplacePriceChartPoint } from "@/app/lib/marketplace/types";
import { listingMatchesWishlistGrade } from "@/lib/wishlist/grading";
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
>;
export type ListingPriceRow = Pick<
  Tables<"listings">,
  "id" | "product_id" | "grading_company" | "grading_score" | "price"
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

export function findMarketPriceRow(
  rows: MarketPriceRow[],
  productId: string,
  gradingCompany: string,
  gradingScore: string,
): MarketPriceRow | undefined {
  const exact = rows.find(
    (row) =>
      row.product_id === productId &&
      row.grading_company === gradingCompany &&
      row.grading_score === gradingScore,
  );
  if (exact) return exact;

  return rows.find(
    (row) =>
      row.product_id === productId &&
      row.grading_company === gradingCompany,
  );
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

export type CollectionValuationSource = "snkrdunk" | "platform" | "purchase_price";

export type ResolvedCollectionMarketValue = {
  value: number | null;
  source: CollectionValuationSource | null;
};

/**
 * Collection portfolio valuation: exact grade SNKRDUNK → same-grade platform MIN → purchase_price.
 * Does not use other grades (price gaps are too large).
 */
export function resolveCollectionMarketValue(input: {
  marketRows: MarketPriceRow[];
  listingRows: ListingPriceRow[];
  productId: string;
  gradingCompany: string;
  gradingScore: string;
  purchasePrice: number;
}): ResolvedCollectionMarketValue {
  const {
    marketRows,
    listingRows,
    productId,
    gradingCompany,
    gradingScore,
    purchasePrice,
  } = input;

  const exactMarket = findExactMarketPriceRow(
    marketRows,
    productId,
    gradingCompany,
    gradingScore,
  );
  const snkrdunk = toFiniteNumber(exactMarket?.market_avg_price ?? null);
  if (snkrdunk != null && snkrdunk > 0) {
    return { value: snkrdunk, source: "snkrdunk" };
  }

  const platform = lowestListingForGrade(
    listingRows,
    productId,
    gradingCompany,
    gradingScore,
  );
  if (platform != null && platform > 0) {
    return { value: platform, source: "platform" };
  }

  if (purchasePrice > 0) {
    return { value: purchasePrice, source: "purchase_price" };
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

/** SNKRDUNK market avg first; fallback to platform lowest active listing price. */
export function resolveCurrentMarketValue(
  marketRows: MarketPriceRow[],
  listingRows: ListingPriceRow[],
  productId: string,
  gradingCompany: string,
  gradingScore: string,
): number | null {
  const market = findMarketPriceRow(
    marketRows,
    productId,
    gradingCompany,
    gradingScore,
  );
  const snkrdunk = toFiniteNumber(market?.market_avg_price ?? null);
  if (snkrdunk != null && snkrdunk > 0) {
    return snkrdunk;
  }

  return lowestListingForGrade(
    listingRows,
    productId,
    gradingCompany,
    gradingScore,
  );
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
