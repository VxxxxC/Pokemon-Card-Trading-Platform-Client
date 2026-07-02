"use server";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeMarketplaceText,
  parseCatalogSearchQuery,
} from "@/app/lib/marketplace/searchParsers";
import type {
  MarketplacePaginationMeta,
  MarketplacePriceBoundsResult,
  MarketplaceProductRow,
  MarketplaceSearchInput,
  SearchMarketplaceResult,
} from "@/app/lib/marketplace/types";
import type { Database } from "@/types/supabase";
import type { SortKey } from "@/app/store/useMarketStore";

export type {
  GradeFilter,
  MarketplacePaginationMeta,
  MarketplacePriceBoundsResult,
  MarketplaceProductRow,
  MarketplaceSearchInput,
  SearchMarketplaceResult,
} from "@/app/lib/marketplace/types";

type SearchRpcArgs =
  Database["public"]["Functions"]["search_marketplace_products"]["Args"];
type SearchRpcRow =
  Database["public"]["Functions"]["search_marketplace_products"]["Returns"][number];

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

function mapSortKey(sortKey: SortKey | undefined): string {
  switch (sortKey) {
    case "價格：由低到高":
      return "price_asc";
    case "價格：由高到低":
      return "price_desc";
    case "最新":
    default:
      return "latest";
  }
}

function toProductRow(row: SearchRpcRow): MarketplaceProductRow {
  return {
    productId: row.product_id,
    productName: row.product_name,
    nameJa: row.name_ja,
    nameEn: row.name_en,
    nameZh: row.name_zh,
    setCode: row.set_code,
    cardNumber: row.card_number,
    displayId: row.display_id,
    rarity: row.rarity,
    imageUrl: row.image_url,
    catalogType: row.catalog_type,
    listingCount: Number(row.listing_count),
    lowestPrice: Number(row.lowest_price),
    highestPrice: Number(row.highest_price),
    lowestListingId: row.lowest_listing_id,
    lowestListingCreatedAt: row.lowest_listing_created_at,
    latestListingAt: row.latest_listing_at,
    gradingCompany: row.grading_company,
    gradingScore: row.grading_score,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerPersona: row.seller_persona,
    useAuthentication: row.use_authentication,
  };
}

function toPaginationMeta(
  row: SearchRpcRow | undefined,
  fallbackPage: number,
  fallbackPageSize: number,
): MarketplacePaginationMeta {
  if (!row) {
    return {
      total: 0,
      page: fallbackPage,
      pageSize: fallbackPageSize,
      totalPages: 0,
      rangeStart: 0,
      rangeEnd: 0,
    };
  }

  return {
    total: Number(row.total_count),
    page: Number(row.page),
    pageSize: Number(row.page_size),
    totalPages: Number(row.total_pages),
    rangeStart: Number(row.range_start),
    rangeEnd: Number(row.range_end),
  };
}

export async function searchMarketplaceProducts(
  input: MarketplaceSearchInput = {},
): Promise<SearchMarketplaceResult> {
  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
  );

  const parsedQuery = parseCatalogSearchQuery(input.query);

  try {
    const supabase = await createClient();

    const gradeFilters =
      input.gradeFilters && input.gradeFilters.length > 0
        ? input.gradeFilters
        : null;

    const rpcArgs: SearchRpcArgs = {
      p_set_code: normalizeMarketplaceText(input.setCode) ?? parsedQuery.setCode,
      p_card_number:
        normalizeMarketplaceText(input.cardNumber) ?? parsedQuery.cardNumber,
      p_name_query: parsedQuery.nameQuery,
      p_rarities:
        input.rarities && input.rarities.length > 0 ? input.rarities : null,
      p_seller_modes:
        input.sellerModes && input.sellerModes.length > 0
          ? input.sellerModes
          : null,
      p_grade_filters: gradeFilters,
      p_price_min: input.priceMin ?? null,
      p_price_max: input.priceMax ?? null,
      p_sort: mapSortKey(input.sortKey),
      p_page: page,
      p_page_size: pageSize,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "search_marketplace_products",
          args: SearchRpcArgs,
        ) => Promise<{
          data: SearchRpcRow[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("search_marketplace_products", rpcArgs);

    if (error) {
      console.error("[searchMarketplaceProducts]", error.message);
      return { success: false, error: "搜尋大盤市場時發生錯誤" };
    }

    const rows = (data ?? []) as SearchRpcRow[];

    return {
      success: true,
      data: rows.map(toProductRow),
      meta: toPaginationMeta(rows[0], page, pageSize),
    };
  } catch (error) {
    console.error("[searchMarketplaceProducts]", error);
    return { success: false, error: "無法連線至大盤市場" };
  }
}

export async function getMarketplacePriceBounds(): Promise<MarketplacePriceBoundsResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "get_marketplace_price_bounds",
        ) => Promise<{
          data: { min_price: number; max_price: number }[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("get_marketplace_price_bounds");

    if (error) {
      console.error("[getMarketplacePriceBounds]", error.message);
      return { success: false, error: "無法取得價格區間" };
    }

    const row = data?.[0];
    const minPrice = Number(row?.min_price ?? 0);
    const maxPrice = Number(row?.max_price ?? 100_000);

    return {
      success: true,
      data: {
        minPrice,
        maxPrice: maxPrice > minPrice ? maxPrice : minPrice + 100_000,
      },
    };
  } catch (error) {
    console.error("[getMarketplacePriceBounds]", error);
    return { success: false, error: "無法連線至大盤市場" };
  }
}
