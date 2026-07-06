"use server";

import { revalidatePath } from "next/cache";
import type {
  CollectionAddInput,
  CollectionEntriesPage,
  CollectionEntry,
  CollectionListFilter,
  CollectionPortfolioSummary,
  CollectionRemoveInput,
  CollectionUpdateGradeInput,
  CollectionUpdatePurchasePriceInput,
  GetCollectionEntriesInput,
} from "@/app/lib/collection/types";
import {
  COLLECTION_DEFAULT_PAGE_SIZE,
  COLLECTION_MAX_PAGE_SIZE,
} from "@/lib/collection/constants";
import {
  computePortfolioTotals,
  isListedCollectionRow,
  loadCollectionPricingContext,
  mapCollectionRowToEntry,
  matchesCollectionSearch,
  type CollectionRow,
} from "@/lib/collection/build-entries";
import { getGradingOption } from "@/lib/grading/options";
import { wishlistGradeFromGradingOption } from "@/lib/wishlist/grading";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert, TablesUpdate } from "@/types/supabase";

type CollectionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user?.id ?? null;
}

function revalidateCollectionPaths(): void {
  revalidatePath("/profile/user/collection");
}

function normalizePageInput(input: GetCollectionEntriesInput): {
  page: number;
  pageSize: number;
  filter: CollectionListFilter;
  query: string;
} {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(
    COLLECTION_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(input.pageSize ?? COLLECTION_DEFAULT_PAGE_SIZE)),
  );
  const filter = input.filter ?? "all";
  const query = (input.query ?? "").trim();

  return { page, pageSize, filter, query };
}

async function fetchAllCollectionRows(userId: string): Promise<CollectionRow[]> {
  const supabase = await createClient();

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
  catalogById: Map<string, import("@/lib/marketplace/portfolio-pricing").CatalogRow>,
  userListingRows: import("@/lib/marketplace/portfolio-pricing").ListingPriceRow[],
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

export async function getCollectionPortfolioSummary(): Promise<
  CollectionResult<CollectionPortfolioSummary>
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  try {
    const rows = await fetchAllCollectionRows(userId);
    if (rows.length === 0) {
      return {
        success: true,
        data: {
          totalMarketValue: 0,
          totalPurchasePrice: 0,
          unrealizedPnl: 0,
          pnlPercent: 0,
          cardCount: 0,
          gradedCount: 0,
          rawCount: 0,
          listedCount: 0,
        },
      };
    }

    const productIds = [...new Set(rows.map((row) => row.product_id))];
    const supabase = await createClient();
    const context = await loadCollectionPricingContext(supabase, userId, productIds, {
      includeChartData: false,
    });

    const totals = computePortfolioTotals(rows, context);
    const unrealizedPnl = totals.totalMarketValue - totals.totalPurchasePrice;
    const pnlPercent =
      totals.totalPurchasePrice > 0
        ? Number(((unrealizedPnl / totals.totalPurchasePrice) * 100).toFixed(2))
        : 0;

    return {
      success: true,
      data: {
        totalMarketValue: totals.totalMarketValue,
        totalPurchasePrice: totals.totalPurchasePrice,
        unrealizedPnl,
        pnlPercent,
        cardCount: totals.cardCount,
        gradedCount: totals.gradedCount,
        rawCount: totals.rawCount,
        listedCount: totals.listedCount,
      },
    };
  } catch (error) {
    console.error("[getCollectionPortfolioSummary]", error);
    return { success: false, error: "無法載入身家摘要" };
  }
}

export async function getCollectionEntries(
  input: GetCollectionEntriesInput = {},
): Promise<CollectionResult<CollectionEntriesPage>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const { page, pageSize, filter, query } = normalizePageInput(input);

  try {
    const rows = await fetchAllCollectionRows(userId);
    if (rows.length === 0) {
      return {
        success: true,
        data: {
          entries: [],
          total: 0,
          page: 1,
          pageSize,
          totalPages: 0,
        },
      };
    }

    const allProductIds = [...new Set(rows.map((row) => row.product_id))];
    const supabase = await createClient();

    const filterContext = await loadCollectionPricingContext(
      supabase,
      userId,
      allProductIds,
      { includeChartData: false },
    );

    const filtered = applyCollectionFilters(
      rows,
      filter,
      query,
      filterContext.catalogById,
      filterContext.userListingRows,
    );

    const total = filtered.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const pageRows = filtered.slice(
      (safePage - 1) * pageSize,
      safePage * pageSize,
    );

    const pageProductIds = [...new Set(pageRows.map((row) => row.product_id))];
    const pageContext =
      pageProductIds.length === allProductIds.length
        ? filterContext
        : await loadCollectionPricingContext(supabase, userId, pageProductIds, {
            includeChartData: false,
          });

    const entries: CollectionEntry[] = pageRows.map((row) =>
      mapCollectionRowToEntry(row, pageContext),
    );

    return {
      success: true,
      data: {
        entries,
        total,
        page: safePage,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error("[getCollectionEntries]", error);
    return { success: false, error: "無法載入收藏庫" };
  }
}

export async function addToCollection(
  input: CollectionAddInput,
): Promise<CollectionResult<{ collectionId: string }>> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const gradingOption = getGradingOption(input.gradingOptionId);
  const grading = wishlistGradeFromGradingOption(gradingOption);
  const purchasePrice = Number(input.purchasePrice);

  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    return { success: false, error: "入手價格式不正確" };
  }

  try {
    const supabase = await createClient();
    const insertPayload: TablesInsert<"user_collections"> = {
      user_id: userId,
      product_id: productId,
      grading_company: grading.gradingCompany,
      grading_score: grading.gradingScore,
      purchase_price: purchasePrice,
    };

    const { data, error } = await supabase
      .from("user_collections")
      .insert([insertPayload] as never)
      .select("id")
      .single();

    if (error || !data) {
      console.error("[addToCollection]", error?.message);
      return { success: false, error: "無法收錄至收藏庫" };
    }

    revalidateCollectionPaths();
    return {
      success: true,
      data: { collectionId: (data as Pick<CollectionRow, "id">).id },
    };
  } catch (error) {
    console.error("[addToCollection]", error);
    return { success: false, error: "無法連線至收藏庫" };
  }
}

export async function removeFromCollection(
  input: CollectionRemoveInput,
): Promise<CollectionResult<{ ok: true }>> {
  const collectionId = input.collectionId.trim();
  if (!collectionId) {
    return { success: false, error: "缺少收藏項目識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("user_collections")
      .delete()
      .eq("id", collectionId)
      .eq("user_id", userId);

    if (error) {
      console.error("[removeFromCollection]", error.message);
      return { success: false, error: "無法移除收藏項目" };
    }

    revalidateCollectionPaths();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error("[removeFromCollection]", error);
    return { success: false, error: "無法連線至收藏庫" };
  }
}

export async function updateCollectionGrade(
  input: CollectionUpdateGradeInput,
): Promise<CollectionResult<{ ok: true }>> {
  const collectionId = input.collectionId.trim();
  if (!collectionId) {
    return { success: false, error: "缺少收藏項目識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const nextOption = getGradingOption(input.nextGradingOptionId);
  const next = wishlistGradeFromGradingOption(nextOption);

  try {
    const supabase = await createClient();
    const updatePayload: TablesUpdate<"user_collections"> = {
      grading_company: next.gradingCompany,
      grading_score: next.gradingScore,
    };

    const { error } = await supabase
      .from("user_collections")
      .update(updatePayload as never)
      .eq("id", collectionId)
      .eq("user_id", userId);

    if (error) {
      console.error("[updateCollectionGrade]", error.message);
      return { success: false, error: "無法更新鑑定規格" };
    }

    revalidateCollectionPaths();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error("[updateCollectionGrade]", error);
    return { success: false, error: "無法連線至收藏庫" };
  }
}

export async function updateCollectionPurchasePrice(
  input: CollectionUpdatePurchasePriceInput,
): Promise<CollectionResult<{ ok: true }>> {
  const collectionId = input.collectionId.trim();
  if (!collectionId) {
    return { success: false, error: "缺少收藏項目識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const purchasePrice = Number(input.purchasePrice);
  if (!Number.isFinite(purchasePrice) || purchasePrice < 0) {
    return { success: false, error: "入手價格式不正確" };
  }

  try {
    const supabase = await createClient();
    const updatePayload: TablesUpdate<"user_collections"> = {
      purchase_price: purchasePrice,
    };

    const { error } = await supabase
      .from("user_collections")
      .update(updatePayload as never)
      .eq("id", collectionId)
      .eq("user_id", userId);

    if (error) {
      console.error("[updateCollectionPurchasePrice]", error.message);
      return { success: false, error: "無法更新入手價" };
    }

    revalidateCollectionPaths();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error("[updateCollectionPurchasePrice]", error);
    return { success: false, error: "無法連線至收藏庫" };
  }
}
