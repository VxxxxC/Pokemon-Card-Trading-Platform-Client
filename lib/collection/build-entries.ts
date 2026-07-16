import type { CollectionEntry, CollectionEntryStatus } from "@/app/lib/collection/types";
import { formatMarketGradeLabel } from "@/lib/marketplace/market-price";
import {
  findActiveListingForGrade,
  findExactMarketPriceRow,
  resolveCardCode,
  resolveCollectionMarketValue,
  resolveProductName,
  toFiniteNumber,
  type CatalogRow,
  type ListingPriceRow,
  type MarketPriceRow,
} from "@/lib/marketplace/portfolio-pricing";
import { gradingOptionIdFromWishlistRow } from "@/lib/wishlist/grading";
import { matchesCatalogCardSearch } from "@/lib/search/card-identifier";
import type { Tables } from "@/types/supabase";

export type CollectionRow = Tables<"user_collections">;

export type CollectionPricingContext = {
  catalogById: Map<string, CatalogRow>;
  marketRows: MarketPriceRow[];
  platformListingRows: ListingPriceRow[];
  userListingRows: ListingPriceRow[];
};

const CATALOG_LIST_COLUMNS =
  "id, name_zh, name_en, name_ja, card_number, display_id, set_code, rarity, image_url";

export type CollectionPricingContextOptions = {
  includeChartData?: boolean;
  /** When provided, skips a duplicate seller listings query. */
  userListingRows?: ListingPriceRow[];
};

export async function loadCollectionPricingContext(
  supabase: Awaited<
    ReturnType<typeof import("@/lib/supabase/server").createClient>
  >,
  userId: string,
  productIds: string[],
  options: CollectionPricingContextOptions = {},
): Promise<CollectionPricingContext> {
  if (productIds.length === 0) {
    return {
      catalogById: new Map(),
      marketRows: [],
      platformListingRows: [],
      userListingRows: options.userListingRows ?? [],
    };
  }

  const { includeChartData = false, userListingRows } = options;

  const marketSelect = includeChartData
    ? "product_id, grading_company, grading_score, market_avg_price, market_trend_30d, market_chart_data"
    : "product_id, grading_company, grading_score, market_avg_price, market_trend_30d";

  const userListingsPromise =
    userListingRows !== undefined
      ? Promise.resolve({
          data: userListingRows,
          error: null as null,
        })
      : supabase
          .from("listings")
          .select(
            "id, product_id, grading_company, grading_score, price, source_collection_id, status",
          )
          .eq("seller_id", userId)
          .in("status", ["active", "inactive"]);

  const [catalogResult, marketResult, platformListingsResult, userListingsResult] =
    await Promise.all([
      supabase.from("product_catalog").select(CATALOG_LIST_COLUMNS).in("id", productIds),
      supabase
        .from("product_grading_market_prices")
        .select(marketSelect)
        .in("product_id", productIds),
      supabase
        .from("listings")
        .select(
          "id, product_id, grading_company, grading_score, price, source_collection_id, status",
        )
        .in("product_id", productIds)
        .eq("status", "active"),
      userListingsPromise,
    ]);

  if (catalogResult.error) {
    throw new Error("無法載入卡牌資料");
  }
  if (marketResult.error) {
    throw new Error("無法載入市場價格");
  }
  if (platformListingsResult.error) {
    throw new Error("無法載入掛單價格");
  }
  if (userListingsResult.error) {
    throw new Error("無法載入上架狀態");
  }

  return {
    catalogById: new Map(
      ((catalogResult.data ?? []) as CatalogRow[]).map((row) => [row.id, row]),
    ),
    marketRows: (marketResult.data ?? []) as MarketPriceRow[],
    platformListingRows: (platformListingsResult.data ?? []) as ListingPriceRow[],
    userListingRows: (userListingsResult.data ?? []) as ListingPriceRow[],
  };
}

function findLinkedListingForCollection(
  listings: ListingPriceRow[],
  row: CollectionRow,
): ListingPriceRow | undefined {
  return listings.find(
    (listing) => listing.source_collection_id === row.id,
  );
}

function resolveCollectionListingStatus(
  row: CollectionRow,
  listings: ListingPriceRow[],
): CollectionEntryStatus {
  const linkedListing = findLinkedListingForCollection(listings, row);

  if (linkedListing?.status === "active") {
    return "listed";
  }

  if (linkedListing?.status === "inactive") {
    return "in_trade";
  }

  if (
    findActiveListingForGrade(
      listings,
      row.product_id,
      row.grading_company,
      row.grading_score,
    )
  ) {
    return "listed";
  }

  return "holding";
}

function findActiveListingForCollection(
  listings: ListingPriceRow[],
  row: CollectionRow,
): ListingPriceRow | undefined {
  const status = resolveCollectionListingStatus(row, listings);
  if (status === "listed") {
    return (
      findLinkedListingForCollection(listings, row) ??
      findActiveListingForGrade(
        listings,
        row.product_id,
        row.grading_company,
        row.grading_score,
      )
    );
  }

  if (status === "in_trade") {
    return findLinkedListingForCollection(listings, row);
  }

  return undefined;
}

export function mapCollectionRowToEntry(
  row: CollectionRow,
  context: CollectionPricingContext,
): CollectionEntry {
  const catalog = context.catalogById.get(row.product_id);

  if (row.sold_at) {
    const purchasePrice = toFiniteNumber(row.purchase_price) ?? 0;
    const soldPrice = toFiniteNumber(row.sold_price);

    return {
      collectionId: row.id,
      productId: row.product_id,
      name: resolveProductName(catalog),
      cardCode: resolveCardCode(catalog),
      setCode: catalog?.set_code?.trim() ?? "",
      rarity: catalog?.rarity ?? null,
      imageUrl: catalog?.image_url ?? null,
      gradingCompany: row.grading_company,
      gradingScore: row.grading_score,
      gradeLabel: formatMarketGradeLabel(row.grading_company, row.grading_score),
      gradingOptionId: gradingOptionIdFromWishlistRow(
        row.grading_company,
        row.grading_score,
      ),
      purchasePrice,
      currentMarketValue: soldPrice,
      valuationSource: null,
      trend30d: null,
      status: "sold",
      activeListingId: row.sold_listing_id,
      soldAt: row.sold_at,
      soldPrice,
    };
  }

  const market = findExactMarketPriceRow(
    context.marketRows,
    row.product_id,
    row.grading_company,
    row.grading_score,
  );
  const activeListing = findActiveListingForCollection(
    context.userListingRows,
    row,
  );
  const collectionStatus = resolveCollectionListingStatus(
    row,
    context.userListingRows,
  );
  const purchasePrice = toFiniteNumber(row.purchase_price) ?? 0;
  const resolved = resolveCollectionMarketValue({
    marketRows: context.marketRows,
    listingRows: context.platformListingRows,
    productId: row.product_id,
    gradingCompany: row.grading_company,
    gradingScore: row.grading_score,
    purchasePrice,
  });

  return {
    collectionId: row.id,
    productId: row.product_id,
    name: resolveProductName(catalog),
    cardCode: resolveCardCode(catalog),
    setCode: catalog?.set_code?.trim() ?? "",
    rarity: catalog?.rarity ?? null,
    imageUrl: catalog?.image_url ?? null,
    gradingCompany: row.grading_company,
    gradingScore: row.grading_score,
    gradeLabel: formatMarketGradeLabel(row.grading_company, row.grading_score),
    gradingOptionId: gradingOptionIdFromWishlistRow(
      row.grading_company,
      row.grading_score,
    ),
    purchasePrice,
    currentMarketValue: resolved.value,
    valuationSource: resolved.source,
    trend30d: toFiniteNumber(market?.market_trend_30d ?? null),
    status: collectionStatus,
    activeListingId: activeListing?.id ?? null,
  };
}

export function computePortfolioTotals(
  rows: CollectionRow[],
  context: CollectionPricingContext,
): {
  totalMarketValue: number;
  totalPurchasePrice: number;
  cardCount: number;
  gradedCount: number;
  rawCount: number;
  listedCount: number;
} {
  let totalMarketValue = 0;
  let totalPurchasePrice = 0;
  let gradedCount = 0;
  let rawCount = 0;
  let listedCount = 0;

  for (const row of rows) {
    if (row.sold_at) continue;

    const purchasePrice = toFiniteNumber(row.purchase_price) ?? 0;
    totalPurchasePrice += purchasePrice;

    const resolved = resolveCollectionMarketValue({
      marketRows: context.marketRows,
      listingRows: context.platformListingRows,
      productId: row.product_id,
      gradingCompany: row.grading_company,
      gradingScore: row.grading_score,
      purchasePrice,
    });
    if (resolved.value != null) {
      totalMarketValue += resolved.value;
    }

    if (isListedCollectionRow(row, context.userListingRows)) {
      listedCount += 1;
    }

    if (row.grading_company === "RAW") {
      rawCount += 1;
    } else {
      gradedCount += 1;
    }
  }

  return {
    totalMarketValue,
    totalPurchasePrice,
    cardCount: rows.length,
    gradedCount,
    rawCount,
    listedCount,
  };
}

export function matchesCollectionSearch(
  row: CollectionRow,
  catalog: CatalogRow | undefined,
  query: string,
): boolean {
  void row;
  if (!query.trim()) return true;
  return matchesCatalogCardSearch(query, catalog ?? {});
}

export function isListedCollectionRow(
  row: CollectionRow,
  userListingRows: ListingPriceRow[],
): boolean {
  return resolveCollectionListingStatus(row, userListingRows) === "listed";
}
