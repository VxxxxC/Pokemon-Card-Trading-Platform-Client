"use server";

import { revalidatePath } from "next/cache";
import type { MarketplacePriceChartPoint } from "@/app/lib/marketplace/types";
import type {
  WishlistEntry,
  WishlistRemoveInput,
  WishlistToggleInput,
  WishlistUpdateGradeInput,
  WishlistUpdateTargetInput,
} from "@/app/lib/wishlist/types";
import {
  buildWishlistFavoredKey,
  listingMatchesWishlistGrade,
  normalizeWishlistGrading,
} from "@/lib/wishlist/grading";
import { formatMarketGradeLabel } from "@/lib/marketplace/market-price";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Json, Tables, TablesInsert, TablesUpdate } from "@/types/supabase";

type WishlistResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type ToggleWishlistResult =
  | { success: true; data: { isFavored: boolean } }
  | { success: false; error: string };

type WatchlistRow = Tables<"product_watchlists">;
type CatalogRow = Tables<"product_catalog">;
type MarketPriceRow = Pick<
  Tables<"product_grading_market_prices">,
  | "product_id"
  | "grading_company"
  | "grading_score"
  | "market_avg_price"
  | "market_trend_30d"
  | "market_chart_data"
>;
type ListingPriceRow = Pick<
  Tables<"listings">,
  "product_id" | "grading_company" | "grading_score" | "price"
>;

function toFiniteNumber(value: number | null | undefined): number | null {
  if (value == null || !Number.isFinite(Number(value))) {
    return null;
  }
  return Number(value);
}

function parseMarketChartData(json: Json | null): MarketplacePriceChartPoint[] {
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

function revalidateWishlistPaths(): void {
  revalidatePath("/profile/user/collection");
  revalidatePath("/marketplace");
}

function resolveProductName(catalog: CatalogRow | undefined): string {
  if (!catalog) return "未知卡牌";
  return (
    catalog.name_zh?.trim() ||
    catalog.name_en?.trim() ||
    catalog.name_ja?.trim() ||
    "未知卡牌"
  );
}

function resolveCardCode(catalog: CatalogRow | undefined): string {
  if (!catalog) return "";
  return (
    catalog.card_number?.trim() ||
    catalog.display_id?.trim() ||
    catalog.set_code?.trim() ||
    ""
  );
}

function findMarketPriceRow(
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

function lowestListingForGrade(
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

async function buildWishlistEntriesForUser(
  userId: string,
): Promise<WishlistEntry[]> {
  const supabase = await createClient();

  const { data: watchRows, error: watchError } = await supabase
    .from("product_watchlists")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (watchError) {
    console.error("[getWishlistEntries]", watchError.message);
    throw new Error("無法載入願望清單");
  }

  const rows = (watchRows ?? []) as WatchlistRow[];
  if (rows.length === 0) {
    return [];
  }

  const productIds = [...new Set(rows.map((row) => row.product_id))];

  const [catalogResult, marketResult, listingsResult] = await Promise.all([
    supabase.from("product_catalog").select("*").in("id", productIds),
    supabase
      .from("product_grading_market_prices")
      .select(
        "product_id, grading_company, grading_score, market_avg_price, market_trend_30d, market_chart_data",
      )
      .in("product_id", productIds),
    supabase
      .from("listings")
      .select("product_id, grading_company, grading_score, price")
      .in("product_id", productIds)
      .eq("status", "active"),
  ]);

  if (catalogResult.error) {
    console.error("[getWishlistEntries]", catalogResult.error.message);
    throw new Error("無法載入卡牌資料");
  }

  if (marketResult.error) {
    console.error("[getWishlistEntries]", marketResult.error.message);
    throw new Error("無法載入市場價格");
  }

  if (listingsResult.error) {
    console.error("[getWishlistEntries]", listingsResult.error.message);
    throw new Error("無法載入掛單價格");
  }

  const catalogById = new Map(
    ((catalogResult.data ?? []) as CatalogRow[]).map((row) => [row.id, row]),
  );
  const marketRows = (marketResult.data ?? []) as MarketPriceRow[];
  const listingRows = (listingsResult.data ?? []) as ListingPriceRow[];

  return rows.map((row) => {
    const catalog = catalogById.get(row.product_id);
    const market = findMarketPriceRow(
      marketRows,
      row.product_id,
      row.grading_company,
      row.grading_score,
    );
    const chartPoints = parseMarketChartData(market?.market_chart_data ?? null);

    return {
      productId: row.product_id,
      displayId: catalog?.display_id ?? null,
      name: resolveProductName(catalog),
      cardCode: resolveCardCode(catalog),
      rarity: catalog?.rarity ?? null,
      gradingCompany: row.grading_company,
      gradingScore: row.grading_score,
      gradeLabel: formatMarketGradeLabel(
        row.grading_company,
        row.grading_score,
      ),
      imageUrl: catalog?.image_url ?? null,
      trackedPrice: toFiniteNumber(row.tracked_price),
      targetPrice: toFiniteNumber(row.target_price),
      currentMarketPrice: toFiniteNumber(market?.market_avg_price ?? null),
      lowestListingPrice: lowestListingForGrade(
        listingRows,
        row.product_id,
        row.grading_company,
        row.grading_score,
      ),
      trend30d: toFiniteNumber(market?.market_trend_30d ?? null),
      chartPoints,
    };
  });
}

export async function toggleWishlist(
  input: WishlistToggleInput,
): Promise<ToggleWishlistResult> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const grading = normalizeWishlistGrading(
    input.gradingCompany,
    input.gradingScore,
  );
  const trackedPrice = toFiniteNumber(input.trackedPrice ?? null);

  try {
    const supabase = await createClient();

    const { data: existing, error: existingError } = await supabase
      .from("product_watchlists")
      .select("user_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("grading_company", grading.gradingCompany)
      .eq("grading_score", grading.gradingScore)
      .maybeSingle();

    if (existingError) {
      console.error("[toggleWishlist]", existingError.message);
      return { success: false, error: "無法更新願望清單" };
    }

    if (existing) {
      const { error: deleteError } = await supabase
        .from("product_watchlists")
        .delete()
        .eq("user_id", userId)
        .eq("product_id", productId)
        .eq("grading_company", grading.gradingCompany)
        .eq("grading_score", grading.gradingScore);

      if (deleteError) {
        console.error("[toggleWishlist]", deleteError.message);
        return { success: false, error: "無法更新願望清單" };
      }

      revalidateWishlistPaths();
      return { success: true, data: { isFavored: false } };
    }

    const insertPayload: TablesInsert<"product_watchlists"> = {
      user_id: userId,
      product_id: productId,
      grading_company: grading.gradingCompany,
      grading_score: grading.gradingScore,
      tracked_price: trackedPrice,
    };

    const { error: insertError } = await supabase
      .from("product_watchlists")
      .insert([insertPayload] as never);

    if (insertError) {
      console.error("[toggleWishlist]", insertError.message);
      return { success: false, error: "無法更新願望清單" };
    }

    revalidateWishlistPaths();
    return { success: true, data: { isFavored: true } };
  } catch (error) {
    console.error("[toggleWishlist]", error);
    return { success: false, error: "無法連線至願望清單" };
  }
}

export async function removeFromWishlist(
  input: WishlistRemoveInput,
): Promise<WishlistResult<{ ok: true }>> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const grading = normalizeWishlistGrading(
    input.gradingCompany,
    input.gradingScore,
  );

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("product_watchlists")
      .delete()
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("grading_company", grading.gradingCompany)
      .eq("grading_score", grading.gradingScore);

    if (error) {
      console.error("[removeFromWishlist]", error.message);
      return { success: false, error: "無法移除願望清單項目" };
    }

    revalidateWishlistPaths();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error("[removeFromWishlist]", error);
    return { success: false, error: "無法連線至願望清單" };
  }
}

export async function updateWishlistGrade(
  input: WishlistUpdateGradeInput,
): Promise<WishlistResult<{ ok: true }>> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const current = normalizeWishlistGrading(
    input.gradingCompany,
    input.gradingScore,
  );
  const next = normalizeWishlistGrading(
    input.nextGradingCompany,
    input.nextGradingScore,
  );

  if (
    current.gradingCompany === next.gradingCompany &&
    current.gradingScore === next.gradingScore
  ) {
    return { success: true, data: { ok: true } };
  }

  try {
    const supabase = await createClient();

    const { data: conflict, error: conflictError } = await supabase
      .from("product_watchlists")
      .select("user_id")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("grading_company", next.gradingCompany)
      .eq("grading_score", next.gradingScore)
      .maybeSingle();

    if (conflictError) {
      console.error("[updateWishlistGrade]", conflictError.message);
      return { success: false, error: "無法更新追蹤規格" };
    }

    if (conflict) {
      return { success: false, error: "此規格已在願望清單中" };
    }

    const updatePayload: TablesUpdate<"product_watchlists"> = {
      grading_company: next.gradingCompany,
      grading_score: next.gradingScore,
    };

    const { error } = await supabase
      .from("product_watchlists")
      .update(updatePayload as never)
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("grading_company", current.gradingCompany)
      .eq("grading_score", current.gradingScore);

    if (error) {
      console.error("[updateWishlistGrade]", error.message);
      return { success: false, error: "無法更新追蹤規格" };
    }

    revalidateWishlistPaths();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error("[updateWishlistGrade]", error);
    return { success: false, error: "無法連線至願望清單" };
  }
}

export async function updateWishlistTarget(
  input: WishlistUpdateTargetInput,
): Promise<WishlistResult<{ ok: true }>> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const grading = normalizeWishlistGrading(
    input.gradingCompany,
    input.gradingScore,
  );
  const targetPrice =
    input.targetPrice == null ? null : toFiniteNumber(input.targetPrice);

  if (input.targetPrice != null && targetPrice == null) {
    return { success: false, error: "目標價格式不正確" };
  }

  try {
    const supabase = await createClient();
    const updatePayload: TablesUpdate<"product_watchlists"> = {
      target_price: targetPrice,
      ...(input.alertEnabled != null
        ? { alert_enabled: input.alertEnabled }
        : {}),
    };

    const { error } = await supabase
      .from("product_watchlists")
      .update(updatePayload as never)
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("grading_company", grading.gradingCompany)
      .eq("grading_score", grading.gradingScore);

    if (error) {
      console.error("[updateWishlistTarget]", error.message);
      return { success: false, error: "無法更新目標價" };
    }

    revalidateWishlistPaths();
    return { success: true, data: { ok: true } };
  } catch (error) {
    console.error("[updateWishlistTarget]", error);
    return { success: false, error: "無法連線至願望清單" };
  }
}

export async function getUserWishlistProductIds(): Promise<
  WishlistResult<string[]>
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: true, data: [] };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_watchlists")
      .select("product_id")
      .eq("user_id", userId);

    if (error) {
      console.error("[getUserWishlistProductIds]", error.message);
      return { success: false, error: "無法載入願望清單" };
    }

    const productIds = [
      ...new Set(
        ((data ?? []) as Pick<WatchlistRow, "product_id">[]).map(
          (row) => row.product_id,
        ),
      ),
    ];

    return { success: true, data: productIds };
  } catch (error) {
    console.error("[getUserWishlistProductIds]", error);
    return { success: false, error: "無法連線至願望清單" };
  }
}

export async function getUserWishlistFavoredKeys(): Promise<
  WishlistResult<string[]>
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: true, data: [] };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("product_watchlists")
      .select("product_id, grading_company, grading_score")
      .eq("user_id", userId);

    if (error) {
      console.error("[getUserWishlistFavoredKeys]", error.message);
      return { success: false, error: "無法載入願望清單" };
    }

    const keys = ((data ?? []) as Pick<
      WatchlistRow,
      "product_id" | "grading_company" | "grading_score"
    >[]).map((row) =>
      buildWishlistFavoredKey(
        row.product_id,
        row.grading_company,
        row.grading_score,
      ),
    );

    return { success: true, data: keys };
  } catch (error) {
    console.error("[getUserWishlistFavoredKeys]", error);
    return { success: false, error: "無法連線至願望清單" };
  }
}

export async function getWishlistEntries(): Promise<
  WishlistResult<WishlistEntry[]>
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  try {
    const entries = await buildWishlistEntriesForUser(userId);
    return { success: true, data: entries };
  } catch (error) {
    console.error("[getWishlistEntries]", error);
    return { success: false, error: "無法載入願望清單" };
  }
}
