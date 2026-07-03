"use server";

import { createClient } from "@/lib/supabase/server";
import {
  normalizeMarketplaceText,
  parseCatalogSearchQuery,
} from "@/app/lib/marketplace/searchParsers";
import type {
  MarketplacePaginationMeta,
  MarketplacePriceBoundsResult,
  MarketplaceProductDetail,
  MarketplaceProductDetailResult,
  MarketplaceProductListingRow,
  MarketplaceProductListingsInput,
  MarketplaceProductListingsResult,
  MarketplaceProductRow,
  MarketplaceProductTradeHistoryInput,
  MarketplaceProductTradeHistoryResult,
  MarketplaceProductTradeHistoryRow,
  MarketplaceSearchInput,
  SearchMarketplaceResult,
} from "@/app/lib/marketplace/types";
import type { Database } from "@/types/supabase";
import type { SortKey } from "@/app/store/useMarketStore";
import {
  formatTradeGradeLabel,
} from "@/lib/marketplace/listing-display";

export type {
  GradeFilter,
  MarketplacePaginationMeta,
  MarketplacePriceBoundsResult,
  MarketplaceProductDetail,
  MarketplaceProductDetailResult,
  MarketplaceProductListingRow,
  MarketplaceProductListingsInput,
  MarketplaceProductListingsResult,
  MarketplaceProductRow,
  MarketplaceProductTradeHistoryInput,
  MarketplaceProductTradeHistoryResult,
  MarketplaceProductTradeHistoryRow,
  MarketplaceSearchInput,
  ProductListingSortKey,
  SearchMarketplaceResult,
} from "@/app/lib/marketplace/types";

type SearchRpcArgs =
  Database["public"]["Functions"]["search_marketplace_products"]["Args"];
type SearchRpcRow =
  Database["public"]["Functions"]["search_marketplace_products"]["Returns"][number];
type ProductListingsRpcArgs =
  Database["public"]["Functions"]["get_marketplace_product_listings"]["Args"];
type ProductListingsRpcRow =
  Database["public"]["Functions"]["get_marketplace_product_listings"]["Returns"][number];

const DEFAULT_PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;
const DEFAULT_PRODUCT_LISTINGS_PAGE_SIZE = 5;
const MAX_PRODUCT_LISTINGS_PAGE_SIZE = 50;
const DEFAULT_TRADE_HISTORY_PAGE_SIZE = 5;
const MAX_TRADE_HISTORY_PAGE_SIZE = 50;

type TradeHistoryQueryRow = {
  id: string;
  final_price: number;
  created_at: string | null;
  listings: {
    product_id: string;
    grading_company: string;
    grading_score: string | null;
  };
};

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

type ProductCatalogRow = Database["public"]["Tables"]["product_catalog"]["Row"];

function displayProductName(row: {
  name_ja: string;
  name_zh: string | null;
}): string {
  return row.name_zh ?? row.name_ja;
}

function toProductDetail(row: ProductCatalogRow): MarketplaceProductDetail {
  return {
    productId: row.id,
    productName: displayProductName(row),
    nameJa: row.name_ja,
    nameEn: row.name_en,
    nameZh: row.name_zh,
    setCode: row.set_code,
    cardNumber: row.card_number,
    displayId: row.display_id,
    rarity: row.rarity,
    imageUrl: row.image_url,
    images: [row.image_url],
    catalogType: row.type,
    elementType: row.element_type,
    pokemonStage: row.pokemon_stage,
    hp: row.hp,
    subTypeJa: row.sub_type_ja,
  };
}

function toProductListingRow(row: ProductListingsRpcRow): MarketplaceProductListingRow {
  return {
    listingId: row.listing_id,
    price: Number(row.price),
    gradingCompany: row.grading_company,
    gradingScore: row.grading_score,
    sellerId: row.seller_id,
    sellerName: row.seller_name,
    sellerRating: Number(row.seller_rating ?? 0),
    sellerTotalTrades: Number(row.seller_total_trades ?? 0),
    sellerPersona: row.seller_persona,
    useAuthentication: row.use_authentication,
    createdAt: row.created_at,
  };
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

type PaginationRpcRow = {
  total_count: number | string;
  page: number | string;
  page_size: number | string;
  total_pages: number | string;
  range_start: number | string;
  range_end: number | string;
};

function toPaginationMeta(
  row: PaginationRpcRow | undefined,
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

function toPaginationMetaFromCount(
  total: number,
  page: number,
  pageSize: number,
): MarketplacePaginationMeta {
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  return {
    total,
    page,
    pageSize,
    totalPages,
    rangeStart: total === 0 ? 0 : (page - 1) * pageSize + 1,
    rangeEnd: total === 0 ? 0 : Math.min(page * pageSize, total),
  };
}

function toTradeHistoryRow(
  row: TradeHistoryQueryRow,
): MarketplaceProductTradeHistoryRow {
  return {
    orderId: row.id,
    createdAt: row.created_at,
    grade: formatTradeGradeLabel(
      row.listings.grading_company,
      row.listings.grading_score,
    ),
    price: Number(row.final_price),
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
        : undefined;

    const rpcArgs: SearchRpcArgs = {
      p_set_code:
        normalizeMarketplaceText(input.setCode) ??
        parsedQuery.setCode ??
        undefined,
      p_card_number:
        normalizeMarketplaceText(input.cardNumber) ??
        parsedQuery.cardNumber ??
        undefined,
      p_name_query: parsedQuery.nameQuery ?? undefined,
      p_rarities:
        input.rarities && input.rarities.length > 0 ? input.rarities : undefined,
      p_seller_modes:
        input.sellerModes && input.sellerModes.length > 0
          ? input.sellerModes
          : undefined,
      p_grade_filters: gradeFilters,
      p_price_min: input.priceMin ?? undefined,
      p_price_max: input.priceMax ?? undefined,
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

export type MarketplaceRaritiesResult =
  | { success: true; data: string[] }
  | { success: false; error: string };

export async function getMarketplaceProductDetail(
  productKey: string,
): Promise<MarketplaceProductDetailResult> {
  const key = productKey.trim();
  if (!key) {
    return { success: false, error: "缺少商品識別碼" };
  }

  try {
    const supabase = await createClient();

    const { data: byId, error: idError } = await supabase
      .from("product_catalog")
      .select("*")
      .eq("id", key)
      .maybeSingle();

    if (idError) {
      console.error("[getMarketplaceProductDetail]", idError.message);
      return { success: false, error: "無法載入商品資料" };
    }

    if (byId) {
      return { success: true, data: toProductDetail(byId) };
    }

    const { data: byDisplayId, error: displayError } = await supabase
      .from("product_catalog")
      .select("*")
      .eq("display_id", key)
      .maybeSingle();

    if (displayError) {
      console.error("[getMarketplaceProductDetail]", displayError.message);
      return { success: false, error: "無法載入商品資料" };
    }

    if (!byDisplayId) {
      return { success: false, error: "找不到此商品" };
    }

    return { success: true, data: toProductDetail(byDisplayId) };
  } catch (error) {
    console.error("[getMarketplaceProductDetail]", error);
    return { success: false, error: "無法連線至商品目錄" };
  }
}

export async function getMarketplaceProductListings(
  input: MarketplaceProductListingsInput,
): Promise<MarketplaceProductListingsResult> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(
    MAX_PRODUCT_LISTINGS_PAGE_SIZE,
    Math.max(1, input.pageSize ?? DEFAULT_PRODUCT_LISTINGS_PAGE_SIZE),
  );
  const sort = input.sort ?? "price_asc";
  const onlyGraded = input.onlyGraded ?? false;
  const gradeFilters =
    input.gradeFilters && input.gradeFilters.length > 0
      ? input.gradeFilters
      : undefined;

  try {
    const supabase = await createClient();

    const rpcArgs: ProductListingsRpcArgs = {
      p_product_id: productId,
      p_grade_filters: gradeFilters,
      p_only_graded: onlyGraded,
      p_sort: sort,
      p_page: page,
      p_page_size: pageSize,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "get_marketplace_product_listings",
          args: ProductListingsRpcArgs,
        ) => Promise<{
          data: ProductListingsRpcRow[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("get_marketplace_product_listings", rpcArgs);

    if (error) {
      console.error("[getMarketplaceProductListings]", error.message);
      return { success: false, error: "無法載入商品掛單" };
    }

    const rows = (data ?? []) as ProductListingsRpcRow[];
    const lowestRaw = rows[0]?.filtered_lowest_price;

    return {
      success: true,
      data: rows.map(toProductListingRow),
      meta: toPaginationMeta(rows[0], page, pageSize),
      lowestPrice:
        lowestRaw != null && Number.isFinite(Number(lowestRaw))
          ? Number(lowestRaw)
          : null,
    };
  } catch (error) {
    console.error("[getMarketplaceProductListings]", error);
    return { success: false, error: "無法連線至大盤市場" };
  }
}

export async function getMarketplaceProductTradeHistory(
  input: MarketplaceProductTradeHistoryInput,
): Promise<MarketplaceProductTradeHistoryResult> {
  const productId = input.productId.trim();
  if (!productId) {
    return { success: false, error: "缺少商品識別碼" };
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(
    MAX_TRADE_HISTORY_PAGE_SIZE,
    Math.max(1, input.pageSize ?? DEFAULT_TRADE_HISTORY_PAGE_SIZE),
  );
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[getMarketplaceProductTradeHistory]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱成交紀錄" };
    }

    const { data, error, count } = await supabase
      .from("member_orders")
      .select(
        `
          id,
          final_price,
          created_at,
          listings!inner (
            product_id,
            grading_company,
            grading_score
          )
        `,
        { count: "exact" },
      )
      .eq("status", "completed")
      .eq("listings.product_id", productId)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) {
      console.error("[getMarketplaceProductTradeHistory]", error.message);
      return { success: false, error: "無法載入成交紀錄" };
    }

    const rows = (data ?? []) as TradeHistoryQueryRow[];
    const total = count ?? 0;

    return {
      success: true,
      data: rows.map(toTradeHistoryRow),
      meta: toPaginationMetaFromCount(total, page, pageSize),
    };
  } catch (error) {
    console.error("[getMarketplaceProductTradeHistory]", error);
    return { success: false, error: "無法連線至大盤市場" };
  }
}

export async function getMarketplaceRarities(): Promise<MarketplaceRaritiesResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("product_catalog")
      .select("rarity")
      .not("rarity", "is", null);

    if (error) {
      console.error("[getMarketplaceRarities]", error.message);
      return { success: false, error: "無法載入稀有度選項" };
    }

    const unique = [
      ...new Set(
        (data ?? [])
          .map((row) => row.rarity?.trim())
          .filter((rarity): rarity is string => Boolean(rarity)),
      ),
    ].sort((a, b) => a.localeCompare(b, "en"));

    return { success: true, data: unique };
  } catch (error) {
    console.error("[getMarketplaceRarities]", error);
    return { success: false, error: "無法連線至商品目錄" };
  }
}
