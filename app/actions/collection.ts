"use server";

import { revalidatePath } from "next/cache";
import type {
  CollectionAddInput,
  CollectionEntriesPage,
  CollectionPageBootstrap,
  CollectionPortfolioSummary,
  CollectionRemoveInput,
  CollectionUpdateGradeInput,
  CollectionUpdatePurchasePriceInput,
  GetCollectionEntriesInput,
} from "@/app/lib/collection/types";
import type { CollectionRow } from "@/lib/collection/build-entries";
import {
  COLLECTION_DEFAULT_PAGE_SIZE,
  COLLECTION_MAX_PAGE_SIZE,
} from "@/lib/collection/constants";
import {
  loadUserCollectionView,
  type UserCollectionViewInput,
} from "@/lib/collection/load-user-collection";
import {
  collectionPerfLog,
  collectionPerfNow,
  isCollectionPerfLogEnabled,
} from "@/lib/collection/perf-log";
import { getGradingOption } from "@/lib/grading/options";
import { guardMemberPersonaPersonalFeatures } from "@/lib/auth/guard-member-persona-server";
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

function normalizePageInput(input: GetCollectionEntriesInput): UserCollectionViewInput {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(
    COLLECTION_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(input.pageSize ?? COLLECTION_DEFAULT_PAGE_SIZE)),
  );
  const filter = input.filter ?? "all";
  const query = (input.query ?? "").trim();

  return { page, pageSize, filter, query };
}

async function loadViewForUser(userId: string, input: UserCollectionViewInput) {
  const supabase = await createClient();
  return loadUserCollectionView(supabase, userId, input, "collection");
}

export async function getCollectionPageBootstrap(
  input: GetCollectionEntriesInput = {},
): Promise<CollectionResult<CollectionPageBootstrap>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const personaGuard = await guardMemberPersonaPersonalFeatures(
    "/profile/user/collection",
  );
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
  }

  const viewInput = normalizePageInput(input);
  const totalStart = isCollectionPerfLogEnabled() ? collectionPerfNow() : 0;

  try {
    const rowsStart = isCollectionPerfLogEnabled() ? collectionPerfNow() : 0;
    const supabase = await createClient();
    const view = await loadUserCollectionView(supabase, userId, viewInput, "bootstrap");

    if (isCollectionPerfLogEnabled()) {
      const rowsMs = Math.round(collectionPerfNow() - rowsStart);
      collectionPerfLog(
        `bootstrap.totalMs=${Math.round(collectionPerfNow() - totalStart)} rowsMs=${rowsMs} cards=${view.summary.cardCount} listed=${view.page.total} filter=${viewInput.filter}`,
      );
    }

    return {
      success: true,
      data: {
        summary: view.summary,
        page: view.page,
      },
    };
  } catch (error) {
    console.error("[getCollectionPageBootstrap]", error);
    return { success: false, error: "無法載入收藏庫" };
  }
}

export async function getCollectionPortfolioSummary(): Promise<
  CollectionResult<CollectionPortfolioSummary>
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const personaGuard = await guardMemberPersonaPersonalFeatures(
    "/profile/user/collection",
  );
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
  }

  try {
    const view = await loadViewForUser(userId, {
      page: 1,
      pageSize: COLLECTION_DEFAULT_PAGE_SIZE,
      filter: "all",
      query: "",
    });

    return { success: true, data: view.summary };
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

  const personaGuard = await guardMemberPersonaPersonalFeatures(
    "/profile/user/collection",
  );
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
  }

  const viewInput = normalizePageInput(input);

  try {
    const view = await loadViewForUser(userId, viewInput);
    return { success: true, data: view.page };
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

  const personaGuard = await guardMemberPersonaPersonalFeatures();
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
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

  const personaGuard = await guardMemberPersonaPersonalFeatures();
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
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

  const personaGuard = await guardMemberPersonaPersonalFeatures();
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
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

  const personaGuard = await guardMemberPersonaPersonalFeatures();
  if (!personaGuard.allowed) {
    return { success: false, error: personaGuard.error };
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
