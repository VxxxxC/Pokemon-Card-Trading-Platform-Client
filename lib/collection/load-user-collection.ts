import type {
  CollectionEntriesPage,
  CollectionEntry,
  CollectionListFilter,
  CollectionPortfolioSummary,
} from "@/app/lib/collection/types";
import {
  computePortfolioTotals,
  isListedCollectionRow,
  loadCollectionPricingContext,
  mapCollectionRowToEntry,
  matchesCollectionSearch,
  type CollectionPricingContext,
  type CollectionRow,
} from "@/lib/collection/build-entries";
import type { CatalogRow, ListingPriceRow } from "@/lib/marketplace/portfolio-pricing";
import {
  collectionPerfLog,
  collectionPerfNow,
  isCollectionPerfLogEnabled,
} from "@/lib/collection/perf-log";
import { createClient } from "@/lib/supabase/server";

export type UserCollectionViewInput = {
  page: number;
  pageSize: number;
  filter: CollectionListFilter;
  query: string;
};

export type UserCollectionView = {
  summary: CollectionPortfolioSummary;
  page: CollectionEntriesPage;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

const EMPTY_SUMMARY: CollectionPortfolioSummary = {
  totalMarketValue: 0,
  totalPurchasePrice: 0,
  unrealizedPnl: 0,
  pnlPercent: 0,
  cardCount: 0,
  gradedCount: 0,
  rawCount: 0,
  listedCount: 0,
};

const EMPTY_PAGE = (pageSize: number): CollectionEntriesPage => ({
  entries: [],
  total: 0,
  page: 1,
  pageSize,
  totalPages: 0,
});

export async function fetchAllCollectionRows(
  supabase: SupabaseServerClient,
  userId: string,
): Promise<CollectionRow[]> {
  const { data, error } = await supabase
    .from("user_collections")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchAllCollectionRows]", error.message);
    throw new Error("無法載入收藏庫");
  }

  return (data ?? []) as CollectionRow[];
}

function applyCollectionFilters(
  rows: CollectionRow[],
  filter: CollectionListFilter,
  query: string,
  catalogById: Map<string, CatalogRow>,
  userListingRows: ListingPriceRow[],
): CollectionRow[] {
  return rows.filter((row) => {
    if (filter === "graded" && row.grading_company === "RAW") return false;
    if (filter === "raw" && row.grading_company !== "RAW") return false;
    if (filter === "listed" && !isListedCollectionRow(row, userListingRows)) {
      return false;
    }

    if (query) {
      const catalog = catalogById.get(row.product_id);
      if (!matchesCollectionSearch(row, catalog, query)) return false;
    }

    return true;
  });
}

function buildPortfolioSummary(
  totals: ReturnType<typeof computePortfolioTotals>,
): CollectionPortfolioSummary {
  const unrealizedPnl = totals.totalMarketValue - totals.totalPurchasePrice;
  const pnlPercent =
    totals.totalPurchasePrice > 0
      ? Number(((unrealizedPnl / totals.totalPurchasePrice) * 100).toFixed(2))
      : 0;

  return {
    totalMarketValue: totals.totalMarketValue,
    totalPurchasePrice: totals.totalPurchasePrice,
    unrealizedPnl,
    pnlPercent,
    cardCount: totals.cardCount,
    gradedCount: totals.gradedCount,
    rawCount: totals.rawCount,
    listedCount: totals.listedCount,
  };
}

function buildCollectionEntriesPage(
  rows: CollectionRow[],
  context: CollectionPricingContext,
  input: UserCollectionViewInput,
): CollectionEntriesPage {
  const filtered = applyCollectionFilters(
    rows,
    input.filter,
    input.query,
    context.catalogById,
    context.userListingRows,
  );

  const total = filtered.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / input.pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(input.page, totalPages);
  const pageRows = filtered.slice(
    (safePage - 1) * input.pageSize,
    safePage * input.pageSize,
  );

  const entries: CollectionEntry[] = pageRows.map((row) =>
    mapCollectionRowToEntry(row, context),
  );

  return {
    entries,
    total,
    page: safePage,
    pageSize: input.pageSize,
    totalPages,
  };
}

export async function loadUserCollectionView(
  supabase: SupabaseServerClient,
  userId: string,
  input: UserCollectionViewInput,
  perfLabel = "view",
): Promise<UserCollectionView> {
  const rowsStart = isCollectionPerfLogEnabled() ? collectionPerfNow() : 0;
  const rows = await fetchAllCollectionRows(supabase, userId);

  if (isCollectionPerfLogEnabled()) {
    collectionPerfLog(
      `${perfLabel}.rowsMs=${Math.round(collectionPerfNow() - rowsStart)} count=${rows.length}`,
    );
  }

  if (rows.length === 0) {
    return {
      summary: EMPTY_SUMMARY,
      page: EMPTY_PAGE(input.pageSize),
    };
  }

  const productIds = [...new Set(rows.map((row) => row.product_id))];
  const pricingStart = isCollectionPerfLogEnabled() ? collectionPerfNow() : 0;
  const context = await loadCollectionPricingContext(supabase, userId, productIds, {
    includeChartData: false,
  });

  if (isCollectionPerfLogEnabled()) {
    collectionPerfLog(
      `${perfLabel}.pricingContextMs=${Math.round(collectionPerfNow() - pricingStart)} products=${productIds.length}`,
    );
  }

  const totals = computePortfolioTotals(rows, context);
  const summary = buildPortfolioSummary(totals);
  const page = buildCollectionEntriesPage(rows, context, input);

  return { summary, page };
}
