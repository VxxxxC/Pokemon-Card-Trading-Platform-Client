"use server";

import { revalidatePath } from "next/cache";
import { resolveOfferCardDisplayImage } from "@/app/lib/chat/offerCardImage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseListingImageUrls } from "@/lib/listings/images";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type RpcCancelMemberOrderArgs = {
  p_order_id: string;
  p_user_id: string;
};

type RpcCompleteMemberOrderArgs = {
  p_order_id: string;
  p_user_id: string;
};

type SearchUserTradingOrdersRpcArgs = {
  p_persona: string;
  p_tab_status: string;
  p_search_query?: string;
  p_page: number;
  p_page_size: number;
};

type SearchUserTradingOrdersRpcRow = {
  order_id: string;
  order_number: string | null;
  buyer_id: string;
  seller_id: string;
  final_price: number;
  status: Tables<"member_orders">["status"];
  created_at: string | null;
  expires_at: string;
  persona: string;
  has_reviewed_by_me: boolean;
  counterparty_id: string;
  counterparty_display_name: string | null;
  counterparty_username: string | null;
  grading_company: string;
  grading_score: string | null;
  use_authentication: boolean;
  listing_images: unknown;
  product_name_ja: string;
  product_name_zh: string | null;
  product_name_en: string | null;
  card_number: string | null;
  set_code: string;
  display_id: string | null;
  catalog_image_url: string;
  total_count: number | string;
  page: number | string;
  page_size: number | string;
  total_pages: number | string;
  range_start: number | string;
  range_end: number | string;
  count_persona_all: number | string;
  count_persona_buy: number | string;
  count_persona_sell: number | string;
  count_status_all: number | string;
  count_status_pending: number | string;
  count_status_completed: number | string;
  count_status_cancelled: number | string;
  count_needs_action: number | string;
};

export type MemberOrderActionResult =
  | { success: true }
  | { success: false; error: string };

export type GetUserTradingOrdersInput = {
  persona: "all" | "buy" | "sell";
  tabStatus: "all" | "pending" | "completed" | "cancelled";
  searchQuery?: string;
  page?: number;
  pageSize?: number;
};

export type UserTradingOrderCounterparty = {
  id: string;
  displayName: string;
  username: string | null;
};

export type UserTradingOrder = {
  id: string;
  orderNumber: string | null;
  buyerId: string;
  sellerId: string;
  finalPrice: number;
  status: Tables<"member_orders">["status"];
  createdAt: string | null;
  expiresAt: string;
  persona: "buy" | "sell";
  hasReviewedByMe: boolean;
  useAuthentication: boolean;
  counterparty: UserTradingOrderCounterparty;
  listing: {
    gradingCompany: string;
    gradingScore: string | null;
    useAuthentication: boolean;
  };
  product: {
    cardName: string;
    cardNumber: string | null;
    setCode: string;
    displayId: string | null;
    imageUrl: string;
  };
};

export type TradingOrdersPaginationMeta = {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
};

export type TradingOrdersFilterCounts = {
  persona: {
    all: number;
    buy: number;
    sell: number;
  };
  status: {
    all: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  needsAction: number;
};

export type SearchUserTradingOrdersResult =
  | {
      success: true;
      data: UserTradingOrder[];
      meta: TradingOrdersPaginationMeta;
      filters: TradingOrdersFilterCounts;
    }
  | { success: false; error: string };

export type GetUserTradingOrdersResult =
  | { success: true; data: UserTradingOrder[] }
  | { success: false; error: string };

export type MemberOrderDetail = UserTradingOrder & {
  listingId: string;
  listingImageUrls: string[];
  canCancel: boolean;
};

export type GetMemberOrderDetailResult =
  | { success: true; data: MemberOrderDetail }
  | { success: false; error: string };

type MemberOrderDetailQueryRow = {
  id: string;
  order_number: string | null;
  buyer_id: string;
  seller_id: string;
  final_price: number;
  status: Tables<"member_orders">["status"];
  created_at: string | null;
  expires_at: string;
  listing_id: string;
  use_authentication: boolean;
  listings: {
    grading_company: string;
    grading_score: string | null;
    use_authentication: boolean;
    images: unknown;
    product_catalog: {
      name_ja: string;
      name_zh: string | null;
      name_en: string | null;
      card_number: string | null;
      set_code: string;
      display_id: string | null;
      image_url: string;
    };
  };
  buyer: {
    id: string;
    display_name: string | null;
    username: string | null;
  };
  seller: {
    id: string;
    display_name: string | null;
    username: string | null;
  };
};

const DEFAULT_PAGE_SIZE = 8;
const MAX_PAGE_SIZE = 50;

function displayCardName(catalog: {
  name_ja: string;
  name_zh: string | null;
  name_en: string | null;
}): string {
  return catalog.name_zh ?? catalog.name_en ?? catalog.name_ja;
}

function toCounterparty(
  profile: UserTradingOrderCounterparty | null | undefined,
): UserTradingOrderCounterparty {
  return {
    id: profile?.id ?? "",
    displayName: profile?.displayName ?? "未知用戶",
    username: profile?.username ?? null,
  };
}

function toPaginationMeta(
  row: SearchUserTradingOrdersRpcRow | undefined,
  fallbackPage: number,
  fallbackPageSize: number,
): TradingOrdersPaginationMeta {
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

function toFilterCounts(
  row: SearchUserTradingOrdersRpcRow | undefined,
): TradingOrdersFilterCounts {
  if (!row) {
    return {
      persona: { all: 0, buy: 0, sell: 0 },
      status: { all: 0, pending: 0, completed: 0, cancelled: 0 },
      needsAction: 0,
    };
  }

  return {
    persona: {
      all: Number(row.count_persona_all),
      buy: Number(row.count_persona_buy),
      sell: Number(row.count_persona_sell),
    },
    status: {
      all: Number(row.count_status_all),
      pending: Number(row.count_status_pending),
      completed: Number(row.count_status_completed),
      cancelled: Number(row.count_status_cancelled),
    },
    needsAction: Number(row.count_needs_action),
  };
}

function mapRpcRow(row: SearchUserTradingOrdersRpcRow): UserTradingOrder {
  return {
    id: row.order_id,
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    finalPrice: Number(row.final_price),
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    persona: row.persona === "sell" ? "sell" : "buy",
    hasReviewedByMe: row.has_reviewed_by_me,
    useAuthentication: row.use_authentication,
    counterparty: toCounterparty({
      id: row.counterparty_id,
      displayName: row.counterparty_display_name ?? "未知用戶",
      username: row.counterparty_username,
    }),
    listing: {
      gradingCompany: row.grading_company,
      gradingScore: row.grading_score,
      useAuthentication: row.use_authentication,
    },
    product: {
      cardName: displayCardName({
        name_ja: row.product_name_ja,
        name_zh: row.product_name_zh,
        name_en: row.product_name_en,
      }),
      cardNumber: row.card_number,
      setCode: row.set_code,
      displayId: row.display_id,
      imageUrl: resolveOfferCardDisplayImage(
        row.listing_images,
        row.catalog_image_url,
      ),
    },
  };
}

export async function searchUserTradingOrders(
  input: GetUserTradingOrdersInput,
): Promise<SearchUserTradingOrdersResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, input.pageSize ?? DEFAULT_PAGE_SIZE),
  );

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[searchUserTradingOrders]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱訂單" };
    }

    const rpcArgs: SearchUserTradingOrdersRpcArgs = {
      p_persona: input.persona,
      p_tab_status: input.tabStatus,
      p_search_query: input.searchQuery?.trim() || undefined,
      p_page: page,
      p_page_size: pageSize,
    };

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "search_user_trading_orders",
          args: SearchUserTradingOrdersRpcArgs,
        ) => Promise<{
          data: SearchUserTradingOrdersRpcRow[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("search_user_trading_orders", rpcArgs);

    if (error) {
      console.error("[searchUserTradingOrders]", error.message);
      return { success: false, error: "無法載入訂單" };
    }

    const rows = (data ?? []) as SearchUserTradingOrdersRpcRow[];

    return {
      success: true,
      data: rows.map(mapRpcRow),
      meta: toPaginationMeta(rows[0], page, pageSize),
      filters: toFilterCounts(rows[0]),
    };
  } catch (error) {
    console.error("[searchUserTradingOrders]", error);
    return { success: false, error: "無法連線至訂單服務" };
  }
}

export async function getUserTradingOrders(
  input: GetUserTradingOrdersInput,
): Promise<GetUserTradingOrdersResult> {
  const result = await searchUserTradingOrders({
    ...input,
    page: 1,
    pageSize: MAX_PAGE_SIZE,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data };
}

function mapMemberOrderDetailRow(
  row: MemberOrderDetailQueryRow,
  viewerId: string,
  hasReviewedByMe: boolean,
): MemberOrderDetail {
  const isBuyer = row.buyer_id === viewerId;
  const counterpartyProfile = isBuyer ? row.seller : row.buyer;
  const catalog = row.listings.product_catalog;
  const listingImageUrls = parseListingImageUrls(row.listings.images);

  return {
    id: row.id,
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    finalPrice: Number(row.final_price),
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    persona: isBuyer ? "buy" : "sell",
    hasReviewedByMe,
    useAuthentication: row.use_authentication,
    counterparty: toCounterparty({
      id: counterpartyProfile.id,
      displayName: counterpartyProfile.display_name ?? "未知用戶",
      username: counterpartyProfile.username,
    }),
    listing: {
      gradingCompany: row.listings.grading_company,
      gradingScore: row.listings.grading_score,
      useAuthentication: row.listings.use_authentication,
    },
    product: {
      cardName: displayCardName(catalog),
      cardNumber: catalog.card_number,
      setCode: catalog.set_code,
      displayId: catalog.display_id,
      imageUrl: resolveOfferCardDisplayImage(
        row.listings.images,
        catalog.image_url,
      ),
    },
    listingId: row.listing_id,
    listingImageUrls,
    canCancel:
      row.seller_id === viewerId &&
      row.status === "pending",
  };
}

export async function getMemberOrderDetail(
  orderId: string,
): Promise<GetMemberOrderDetailResult> {
  const trimmedOrderId = orderId.trim();
  if (!trimmedOrderId) {
    return { success: false, error: "找不到此訂單" };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("[getMemberOrderDetail]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱訂單" };
    }

    const { data, error } = await supabase
      .from("member_orders")
      .select(
        `
          id,
          order_number,
          buyer_id,
          seller_id,
          final_price,
          status,
          created_at,
          expires_at,
          listing_id,
          use_authentication,
          listings!inner (
            grading_company,
            grading_score,
            use_authentication,
            images,
            product_catalog!inner (
              name_ja,
              name_zh,
              name_en,
              card_number,
              set_code,
              display_id,
              image_url
            )
          ),
          buyer:profiles!fk_member_orders_buyer (
            id,
            display_name,
            username
          ),
          seller:profiles!fk_member_orders_seller (
            id,
            display_name,
            username
          )
        `,
      )
      .eq("id", trimmedOrderId)
      .maybeSingle();

    if (error) {
      console.error("[getMemberOrderDetail]", error.message);
      return { success: false, error: "無法載入訂單" };
    }

    const row = data as MemberOrderDetailQueryRow | null;
    if (!row) {
      return { success: false, error: "找不到指定的交易訂單記錄" };
    }

    if (row.buyer_id !== user.id && row.seller_id !== user.id) {
      return { success: false, error: "您沒有權限查閱此訂單" };
    }

    const { data: reviewRows, error: reviewError } = await supabase
      .from("transaction_reviews")
      .select("id")
      .eq("member_order_id", trimmedOrderId)
      .eq("reviewer_id", user.id)
      .limit(1);

    if (reviewError) {
      console.error("[getMemberOrderDetail] reviews", reviewError.message);
      return { success: false, error: "無法載入訂單" };
    }

    const hasReviewedByMe = (reviewRows?.length ?? 0) > 0;

    return {
      success: true,
      data: mapMemberOrderDetailRow(row, user.id, hasReviewedByMe),
    };
  } catch (error) {
    console.error("[getMemberOrderDetail]", error);
    return { success: false, error: "無法連線至訂單服務" };
  }
}

export async function cancelMemberOrder(
  orderId: string,
): Promise<MemberOrderActionResult> {
  const trimmedOrderId = orderId.trim();
  if (!trimmedOrderId) {
    return { success: false, error: "找不到此訂單" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再取消訂單" };
    }

    const rpcArgs: RpcCancelMemberOrderArgs = {
      p_order_id: trimmedOrderId,
      p_user_id: user.id,
    };

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_cancel_member_order",
          args: RpcCancelMemberOrderArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_cancel_member_order", rpcArgs);

    if (error) {
      console.error("[cancelMemberOrder] rpc", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/marketplace");
    revalidatePath("/profile/user/trading");
    revalidatePath("/profile/user/orderDetail/" + trimmedOrderId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "取消訂單時發生錯誤";
    console.error("[cancelMemberOrder]", error);
    return { success: false, error: message };
  }
}

export async function completeMemberOrder(
  orderId: string,
): Promise<MemberOrderActionResult> {
  const trimmedOrderId = orderId.trim();
  if (!trimmedOrderId) {
    return { success: false, error: "找不到此訂單" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再確認完成" };
    }

    const rpcArgs: RpcCompleteMemberOrderArgs = {
      p_order_id: trimmedOrderId,
      p_user_id: user.id,
    };

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_complete_member_order",
          args: RpcCompleteMemberOrderArgs,
        ) => Promise<{
          data: unknown;
          error: { message: string } | null;
        }>;
      }
    ).rpc("rpc_complete_member_order", rpcArgs);

    if (error) {
      console.error("[completeMemberOrder] rpc", error.message);
      return { success: false, error: error.message };
    }

    revalidatePath("/profile/user/trading");
    revalidatePath("/profile/user/orderDetail/" + trimmedOrderId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "確認完成時發生錯誤";
    console.error("[completeMemberOrder]", error);
    return { success: false, error: message };
  }
}
