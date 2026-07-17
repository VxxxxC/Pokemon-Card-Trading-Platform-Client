import { describe, expect, test } from "bun:test";
import type { CollectionPricingContext } from "@/lib/collection/build-entries";
import { computeMemberTradingStats } from "@/lib/dashboard/member-trading-stats";
import type { ListingPriceRow } from "@/lib/marketplace/portfolio-pricing";

const PRODUCT_ID = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function emptyContext(): CollectionPricingContext {
  return {
    catalogById: new Map(),
    marketRows: [],
    platformListingRows: [],
    userListingRows: [],
  };
}

function memberOrphanListing(price: number): ListingPriceRow {
  return {
    id: "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",
    product_id: PRODUCT_ID,
    grading_company: "PSA",
    grading_score: "10",
    price,
  };
}

describe("computeMemberTradingStats", () => {
  test("empty collection and no member listings yields zero portfolio stats", () => {
    const result = computeMemberTradingStats({
      completedTradesCount: 3,
      collectionRows: [],
      activeListings: [],
      context: emptyContext(),
    });

    expect(result).toEqual({
      completedTradesCount: 3,
      heldCardCount: 0,
      listedForSaleCount: 0,
      totalMarketValue: 0,
    });
  });

  test("member orphan listing counts toward held cards and market value", () => {
    const listing = memberOrphanListing(500);

    const result = computeMemberTradingStats({
      completedTradesCount: 0,
      collectionRows: [],
      activeListings: [listing],
      context: {
        ...emptyContext(),
        userListingRows: [listing],
      },
    });

    expect(result.heldCardCount).toBe(1);
    expect(result.listedForSaleCount).toBe(1);
    expect(result.totalMarketValue).toBe(500);
  });
});
