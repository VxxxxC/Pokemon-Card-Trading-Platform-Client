import { describe, expect, test } from "bun:test";
import type { WishlistEntry } from "@/app/lib/wishlist/types";
import {
  findExactMarketPriceRow,
  normalizeValuationGradeKey,
  resolveCollectionMarketValue,
  resolveMarketCacheValue,
  type ListingPriceRow,
  type MarketPriceRow,
} from "@/lib/marketplace/portfolio-pricing";
import { resolveWishlistDisplayValue } from "@/lib/wishlist/pricing";

const PRODUCT_ID = "prod-1";

function marketRow(
  overrides: Partial<MarketPriceRow> & Pick<MarketPriceRow, "grading_company" | "grading_score">,
): MarketPriceRow {
  return {
    product_id: PRODUCT_ID,
    market_avg_price: 1000,
    market_trend_30d: null,
    market_chart_data: null,
    market_data_source: "snkrdunk",
    ...overrides,
  };
}

const listingRows: ListingPriceRow[] = [
  {
    id: "listing-1",
    product_id: PRODUCT_ID,
    grading_company: "PSA",
    grading_score: "10",
    price: 500,
    source_collection_id: null,
    status: "active",
  },
];

describe("resolveMarketCacheValue", () => {
  test("returns snkrdunk for snkrdunk source", () => {
    const result = resolveMarketCacheValue(
      marketRow({ grading_company: "PSA", grading_score: "10" }),
    );
    expect(result).toEqual({ value: 1000, source: "snkrdunk" });
  });

  test("returns platform for platform source", () => {
    const result = resolveMarketCacheValue(
      marketRow({
        grading_company: "PSA",
        grading_score: "10",
        market_data_source: "platform",
      }),
    );
    expect(result).toEqual({ value: 1000, source: "platform" });
  });
});

describe("resolveCollectionMarketValue", () => {
  test("uses snkrdunk cache for exact grade", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [marketRow({ grading_company: "PSA", grading_score: "10" })],
      productId: PRODUCT_ID,
      gradingCompany: "PSA",
      gradingScore: "10",
      purchasePrice: 200,
    });
    expect(result).toEqual({ value: 1000, source: "snkrdunk" });
  });

  test("uses platform cache when source is platform", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [
        marketRow({
          grading_company: "PSA",
          grading_score: "10",
          market_data_source: "platform",
        }),
      ],
      productId: PRODUCT_ID,
      gradingCompany: "PSA",
      gradingScore: "10",
      purchasePrice: 200,
    });
    expect(result).toEqual({ value: 1000, source: "platform" });
  });

  test("falls back to purchase price when no cache", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [],
      productId: PRODUCT_ID,
      gradingCompany: "PSA",
      gradingScore: "10",
      purchasePrice: 200,
    });
    expect(result).toEqual({ value: 200, source: "purchase_price" });
  });

  test("ignores active listing prices", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [],
      productId: PRODUCT_ID,
      gradingCompany: "PSA",
      gradingScore: "10",
      purchasePrice: 0,
    });
    expect(result).toEqual({ value: null, source: null });
    expect(listingRows.length).toBeGreaterThan(0);
  });

  test("does not use PSA 9 cache for PSA 10 row", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [marketRow({ grading_company: "PSA", grading_score: "9" })],
      productId: PRODUCT_ID,
      gradingCompany: "PSA",
      gradingScore: "10",
      purchasePrice: 300,
    });
    expect(result).toEqual({ value: 300, source: "purchase_price" });
  });

  test("does not use RAW B cache for RAW A row", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [
        marketRow({
          grading_company: "RAW",
          grading_score: "B",
          market_avg_price: 400,
        }),
      ],
      productId: PRODUCT_ID,
      gradingCompany: "RAW",
      gradingScore: "A",
      purchasePrice: 150,
    });
    expect(result).toEqual({ value: 150, source: "purchase_price" });
  });

  test("does not use SEALED cache for UNSEALED box set", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [
        marketRow({
          grading_company: "OTHER",
          grading_score: "SEALED",
          market_avg_price: 800,
        }),
      ],
      productId: PRODUCT_ID,
      gradingCompany: "OTHER",
      gradingScore: "UNSEALED",
      purchasePrice: 250,
    });
    expect(result).toEqual({ value: 250, source: "purchase_price" });
  });

  test("normalizes legacy SEALED company to OTHER+SEALED cache", () => {
    const result = resolveCollectionMarketValue({
      marketRows: [
        marketRow({
          grading_company: "OTHER",
          grading_score: "SEALED",
          market_avg_price: 900,
        }),
      ],
      productId: PRODUCT_ID,
      gradingCompany: "SEALED",
      gradingScore: "SEALED",
      purchasePrice: 0,
    });
    expect(result).toEqual({ value: 900, source: "snkrdunk" });
  });
});

describe("findExactMarketPriceRow", () => {
  test("requires exact company and score", () => {
    const rows = [
      marketRow({ grading_company: "PSA", grading_score: "9" }),
      marketRow({ grading_company: "PSA", grading_score: "10", market_avg_price: 1200 }),
    ];
    const row = findExactMarketPriceRow(rows, PRODUCT_ID, "PSA", "10");
    expect(row?.market_avg_price).toBe(1200);
  });
});

describe("normalizeValuationGradeKey", () => {
  test("maps legacy sealed company to OTHER+SEALED", () => {
    expect(normalizeValuationGradeKey("SEALED", "SEALED")).toEqual({
      gradingCompany: "OTHER",
      gradingScore: "SEALED",
    });
  });
});

function wishlistEntry(overrides: Partial<WishlistEntry> = {}): WishlistEntry {
  return {
    productId: PRODUCT_ID,
    displayId: null,
    name: "Test",
    cardCode: "",
    rarity: null,
    catalogType: "single_card",
    gradingCompany: "PSA",
    gradingScore: "10",
    gradeLabel: "PSA 10",
    imageUrl: null,
    trackedPrice: null,
    targetPrice: null,
    currentMarketPrice: null,
    marketDataSource: null,
    lowestListingPrice: null,
    trend30d: null,
    chartPoints: [],
    ...overrides,
  };
}

describe("resolveWishlistDisplayValue", () => {
  test("uses snkrdunk cache before tracked price", () => {
    const result = resolveWishlistDisplayValue(
      wishlistEntry({
        currentMarketPrice: 1000,
        marketDataSource: "snkrdunk",
        trackedPrice: 200,
      }),
    );
    expect(result).toEqual({ value: 1000, source: "snkrdunk" });
  });

  test("uses platform cache before tracked price", () => {
    const result = resolveWishlistDisplayValue(
      wishlistEntry({
        currentMarketPrice: 1000,
        marketDataSource: "platform",
        trackedPrice: 200,
      }),
    );
    expect(result).toEqual({ value: 1000, source: "platform" });
  });

  test("falls back to tracked price", () => {
    const result = resolveWishlistDisplayValue(
      wishlistEntry({
        trackedPrice: 200,
        lowestListingPrice: 500,
      }),
    );
    expect(result).toEqual({ value: 200, source: "tracked_price" });
  });

  test("ignores listing price when no cache or tracked price", () => {
    const result = resolveWishlistDisplayValue(
      wishlistEntry({
        lowestListingPrice: 500,
      }),
    );
    expect(result).toEqual({ value: null, source: null });
  });
});
