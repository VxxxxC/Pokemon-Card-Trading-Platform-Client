"use server";

import type {
  GetUserInventoryGroupsInput,
  InventoryGroupsPage,
  InventorySummary,
} from "@/app/lib/inventory/types";
import {
  INVENTORY_DEFAULT_PAGE_SIZE,
  INVENTORY_MAX_PAGE_SIZE,
} from "@/lib/listings/constants";
import {
  groupListingsByProduct,
  matchesInventorySearch,
  summarizeInventoryListings,
  type InventoryListingRow,
  type InventoryStatsRow,
} from "@/lib/listings/build-inventory-groups";
import {
  type CatalogRow,
} from "@/lib/marketplace/portfolio-pricing";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type InventoryResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

const CATALOG_LIST_COLUMNS =
  "id, name_zh, name_en, name_ja, card_number, display_id, set_code, image_url";

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

function normalizeGroupsInput(input: GetUserInventoryGroupsInput): {
  page: number;
  pageSize: number;
  query: string;
} {
  const page = Math.max(1, Math.floor(input.page ?? 1));
  const pageSize = Math.min(
    INVENTORY_MAX_PAGE_SIZE,
    Math.max(1, Math.floor(input.pageSize ?? INVENTORY_DEFAULT_PAGE_SIZE)),
  );
  const query = (input.query ?? "").trim();

  return { page, pageSize, query };
}

async function fetchSellerListings(userId: string): Promise<InventoryListingRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("listings")
    .select(
      "id, product_id, price, grading_company, grading_score, images, status, seller_description, created_at",
    )
    .eq("seller_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[fetchSellerListings]", error.message);
    throw new Error("無法載入上架商品");
  }

  return (data ?? []) as InventoryListingRow[];
}

async function loadInventoryContext(
  listingRows: InventoryListingRow[],
): Promise<{
  catalogById: Map<string, CatalogRow>;
  statsByListingId: Map<string, InventoryStatsRow>;
}> {
  const productIds = [...new Set(listingRows.map((row) => row.product_id))];
  const listingIds = listingRows.map((row) => row.id);

  if (productIds.length === 0) {
    return {
      catalogById: new Map(),
      statsByListingId: new Map(),
    };
  }

  const supabase = await createClient();

  const [catalogResult, statsResult] = await Promise.all([
    supabase.from("product_catalog").select(CATALOG_LIST_COLUMNS).in("id", productIds),
    listingIds.length > 0
      ? supabase
          .from("listing_stats")
          .select("listing_id, views, offers_count")
          .in("listing_id", listingIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (catalogResult.error) {
    throw new Error("無法載入卡牌資料");
  }
  if (statsResult.error) {
    throw new Error("無法載入掛單統計");
  }

  const catalogById = new Map<string, CatalogRow>();
  for (const row of (catalogResult.data ?? []) as CatalogRow[]) {
    catalogById.set(row.id, row);
  }

  const statsByListingId = new Map<string, InventoryStatsRow>();
  for (const row of (statsResult.data ?? []) as InventoryStatsRow[]) {
    statsByListingId.set(row.listing_id, row);
  }

  return { catalogById, statsByListingId };
}

export async function getUserInventorySummary(): Promise<
  InventoryResult<InventorySummary>
> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  try {
    const listings = await fetchSellerListings(userId);
    return {
      success: true,
      data: summarizeInventoryListings(listings),
    };
  } catch (error) {
    console.error("[getUserInventorySummary]", error);
    return { success: false, error: "無法載入庫存統計" };
  }
}

export async function getUserInventoryGroups(
  input: GetUserInventoryGroupsInput = {},
): Promise<InventoryResult<InventoryGroupsPage>> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    return { success: false, error: "請先登入" };
  }

  const { page, pageSize, query } = normalizeGroupsInput(input);

  try {
    const listings = await fetchSellerListings(userId);
    const { catalogById, statsByListingId } = await loadInventoryContext(listings);

    let groups = groupListingsByProduct({
      listings,
      catalogById,
      statsByListingId,
    });

    if (query) {
      groups = groups.filter((group) => {
        const catalog = catalogById.get(group.id);
        return matchesInventorySearch(catalog, query);
      });
    }

    const totalGroups = groups.length;
    const totalPages = totalGroups === 0 ? 0 : Math.ceil(totalGroups / pageSize);
    const safePage =
      totalPages === 0 ? 1 : Math.min(page, Math.max(totalPages, 1));
    const start = (safePage - 1) * pageSize;
    const paginatedGroups = groups.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        groups: paginatedGroups,
        totalGroups,
        page: safePage,
        pageSize,
        totalPages,
      },
    };
  } catch (error) {
    console.error("[getUserInventoryGroups]", error);
    return { success: false, error: "無法載入庫存商品" };
  }
}
