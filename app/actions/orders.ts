"use server";

import { revalidatePath } from "next/cache";
import { resolveOfferCardDisplayImage } from "@/app/lib/chat/offerCardImage";
import {
  TRADING_DEFAULT_PAGE_SIZE,
} from "@/lib/member-order/constants";
import {
  DEFAULT_MEMBER_ORDER_KIND,
  type BuyerCompleteOrderInput,
  type MemberOrderKind,
} from "@/lib/member-order/order-kind";
import {
  rpcCancelMemberOrder,
  rpcCompleteMemberOrder,
} from "@/lib/member-order/member-order-rpc";
import {
  isTradingPerfLogEnabled,
  tradingPerfLog,
  tradingPerfNow,
} from "@/lib/member-order/perf-log";
import {
  calculateMemberAuthPaymentTotal,
  createMemberAuthPaymentSession,
} from "@/lib/payments/member-auth-payment";
import {
  getMemberAuthOrderActions,
  type MemberEscrowStatus,
} from "@/app/lib/member-order/auth-escrow";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { parseListingImageUrls } from "@/lib/listings/images";
import { isUuid } from "@/lib/marketplace/seller-profile";
import {
  INVALID_MEMBER_ORDER_ID_ERROR,
  resolveMemberOrderIdForUser,
} from "@/lib/member-order/resolve-order-id";
import { ensureMemberOrderListingUuid } from "@/lib/member-order/repair-listing-id";
import { resolveAvatarUrl } from "@/lib/profile/avatar";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

export type { BuyerCompleteOrderInput, MemberOrderKind } from "@/lib/member-order/order-kind";

function shouldLogMemberOrderMutation(): boolean {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.MEMBER_ORDER_MUTATION_LOG === "1"
  );
}

function logMemberOrderMutation(
  action: string,
  payload: Record<string, unknown>,
): void {
  if (!shouldLogMemberOrderMutation()) {
    return;
  }
  console.error(`[${action}]`, payload);
}

function rejectNonUuidMutationOrderId(
  orderId: string,
): MemberOrderActionResult | null {
  const trimmed = orderId.trim();
  if (!trimmed) {
    return { success: false, error: "找不到此訂單" };
  }
  if (!isUuid(trimmed)) {
    return { success: false, error: INVALID_MEMBER_ORDER_ID_ERROR };
  }
  return null;
}

function rejectInvalidRpcIdentity(
  orderId: string,
  userId: string,
): MemberOrderActionResult | null {
  if (!isUuid(orderId)) {
    logMemberOrderMutation("memberOrderMutation", {
      reason: "invalid_p_order_id",
      orderId,
    });
    return { success: false, error: INVALID_MEMBER_ORDER_ID_ERROR };
  }
  if (!isUuid(userId)) {
    logMemberOrderMutation("memberOrderMutation", {
      reason: "invalid_p_user_id",
      userId,
    });
    return { success: false, error: "無法驗證登入狀態" };
  }
  return null;
}

function mapOrderRpcError(message: string): string {
  if (message.includes("invalid input syntax for type uuid")) {
    return INVALID_MEMBER_ORDER_ID_ERROR;
  }
  return message;
}

function revalidateMemberOrderPaths(orderId: string): void {
  revalidatePath("/profile/user/trading");
  revalidatePath("/profile/user/orderDetail/" + orderId);
  revalidatePath("/profile/user/inventory");
  revalidatePath("/profile/user/collection");
}

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
  counterparty_avatar_path: string | null;
  grading_company: string;
  grading_score: string | null;
  use_authentication: boolean;
  escrow_status: MemberEscrowStatus | null;
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
  avatarUrl: string;
};

export type UserTradingOrder = {
  id: string;
  orderKind: MemberOrderKind;
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
  escrowStatus: MemberEscrowStatus | null;
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
  inboundTrackingNo: string | null;
  outboundTrackingNo: string | null;
  paymentAmount: number;
  listingAcceptsBuyerAuth: boolean;
  canPay: boolean;
  canSubmitInbound: boolean;
  canConfirmReceipt: boolean;
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
  escrow_status: MemberEscrowStatus | null;
  inbound_tracking_no: string | null;
  outbound_tracking_no: string | null;
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
    avatar_path: string | null;
  };
  seller: {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_path: string | null;
  };
};

const MAX_PAGE_SIZE = 50;

function resolveTradingPageSize(pageSize?: number): number {
  return Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, Math.floor(pageSize ?? TRADING_DEFAULT_PAGE_SIZE)),
  );
}

function displayCardName(catalog: {
  name_ja: string;
  name_zh: string | null;
  name_en: string | null;
}): string {
  return catalog.name_zh ?? catalog.name_en ?? catalog.name_ja;
}

function toCounterparty(
  profile: Partial<UserTradingOrderCounterparty> | null | undefined,
): UserTradingOrderCounterparty {
  return {
    id: profile?.id ?? "",
    displayName: profile?.displayName ?? "未知用戶",
    username: profile?.username ?? null,
    avatarUrl: profile?.avatarUrl ?? resolveAvatarUrl(null),
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

function mapRpcRow(
  row: SearchUserTradingOrdersRpcRow,
  orderId: string,
): UserTradingOrder {
  return {
    id: orderId,
    orderKind: DEFAULT_MEMBER_ORDER_KIND,
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
    escrowStatus: row.escrow_status,
    counterparty: toCounterparty({
      id: row.counterparty_id,
      displayName: row.counterparty_display_name ?? "未知用戶",
      username: row.counterparty_username,
      avatarUrl: resolveAvatarUrl(row.counterparty_avatar_path),
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

async function mapRpcRowForUser(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  row: SearchUserTradingOrdersRpcRow,
): Promise<UserTradingOrder | null> {
  if (isUuid(row.order_id)) {
    return mapRpcRow(row, row.order_id);
  }

  console.error("[searchUserTradingOrders] invalid order_id from RPC", {
    order_id: row.order_id,
    order_number: row.order_number,
    display_id: row.display_id,
  });

  const fallbackKey =
    row.order_number?.trim() ||
    row.display_id?.trim() ||
    row.order_id?.trim() ||
    "";
  if (!fallbackKey) {
    return null;
  }

  const resolved = await resolveMemberOrderIdForUser(
    supabase,
    fallbackKey,
    userId,
  );
  if (!resolved.ok) {
    return null;
  }

  return mapRpcRow(row, resolved.id);
}

export async function searchUserTradingOrders(
  input: GetUserTradingOrdersInput,
): Promise<SearchUserTradingOrdersResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  const page = Math.max(1, input.page ?? 1);
  const pageSize = resolveTradingPageSize(input.pageSize);
  const totalStart = isTradingPerfLogEnabled() ? tradingPerfNow() : 0;

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

    const rpcStart = isTradingPerfLogEnabled() ? tradingPerfNow() : 0;

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
    const meta = toPaginationMeta(rows[0], page, pageSize);
    const filters = toFilterCounts(rows[0]);

    if (isTradingPerfLogEnabled()) {
      tradingPerfLog(
        `search.rpcMs=${Math.round(tradingPerfNow() - rpcStart)} totalMs=${Math.round(tradingPerfNow() - totalStart)} orders=${rows.length} total=${meta.total} needsAction=${filters.needsAction} persona=${input.persona} tab=${input.tabStatus}`,
      );
    }

    const mappedOrders = (
      await Promise.all(
        rows.map((row) => mapRpcRowForUser(supabase, user.id, row)),
      )
    ).filter((order): order is UserTradingOrder => order !== null);

    return {
      success: true,
      data: mappedOrders,
      meta,
      filters,
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
  const persona = isBuyer ? "buy" : "sell";
  const counterpartyProfile = isBuyer ? row.seller : row.buyer;
  const catalog = row.listings.product_catalog;
  const listingImageUrls = parseListingImageUrls(row.listings.images);
  const authActions = getMemberAuthOrderActions({
    persona,
    useAuthentication: row.use_authentication,
    escrowStatus: row.escrow_status,
    status: row.status,
  });

  return {
    id: row.id,
    orderKind: DEFAULT_MEMBER_ORDER_KIND,
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    finalPrice: Number(row.final_price),
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    persona,
    hasReviewedByMe,
    useAuthentication: row.use_authentication,
    escrowStatus: row.escrow_status,
    counterparty: toCounterparty({
      id: counterpartyProfile.id,
      displayName: counterpartyProfile.display_name ?? "未知用戶",
      username: counterpartyProfile.username,
      avatarUrl: resolveAvatarUrl(counterpartyProfile.avatar_path),
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
    inboundTrackingNo: row.inbound_tracking_no,
    outboundTrackingNo: row.outbound_tracking_no,
    paymentAmount: calculateMemberAuthPaymentTotal(Number(row.final_price)),
    listingAcceptsBuyerAuth: row.listings.use_authentication,
    canPay: authActions.canPay,
    canSubmitInbound: authActions.canSubmitInbound,
    canConfirmReceipt: authActions.canConfirmReceipt,
    canCancel: row.use_authentication
      ? authActions.canCancel
      : row.seller_id === viewerId && row.status === "pending",
  };
}

export async function getMemberOrderDetail(
  orderId: string,
): Promise<GetMemberOrderDetailResult> {
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

    const resolved = await resolveMemberOrderIdForUser(
      supabase,
      orderId,
      user.id,
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

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
          escrow_status,
          inbound_tracking_no,
          outbound_tracking_no,
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
            username,
            avatar_path
          ),
          seller:profiles!fk_member_orders_seller (
            id,
            display_name,
            username,
            avatar_path
          )
        `,
      )
      .eq("id", trimmedOrderId)
      .maybeSingle();

    if (error) {
      console.error("[getMemberOrderDetail]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
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
  try {
    const invalidId = rejectNonUuidMutationOrderId(orderId);
    if (invalidId) {
      return invalidId;
    }
    const trimmedOrderId = orderId.trim();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再取消訂單" };
    }

    const invalidRpcIdentity = rejectInvalidRpcIdentity(
      trimmedOrderId,
      user.id,
    );
    if (invalidRpcIdentity) {
      return invalidRpcIdentity;
    }

    logMemberOrderMutation("cancelMemberOrder", {
      input: orderId,
      p_order_id: trimmedOrderId,
      p_user_id: user.id,
      rpc: "rpc_cancel_member_order",
    });

    const { error } = await rpcCancelMemberOrder(supabase, {
      p_order_id: trimmedOrderId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("[cancelMemberOrder] rpc", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    revalidatePath("/marketplace");
    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "取消訂單時發生錯誤";
    console.error("[cancelMemberOrder]", error);
    return { success: false, error: message };
  }
}

export async function completeMerchantOrder(
  orderId: string,
): Promise<MemberOrderActionResult> {
  const invalidId = rejectNonUuidMutationOrderId(orderId);
  if (invalidId) {
    return invalidId;
  }

  return {
    success: false,
    error:
      "商戶訂單確認完成功能即將推出；請使用商戶交易頁完成操作。",
  };
}

export async function completeBuyerOrder(
  input: BuyerCompleteOrderInput,
): Promise<MemberOrderActionResult> {
  if (input.orderKind === "merchant") {
    return completeMerchantOrder(input.orderId);
  }
  return completeMemberOrder(input.orderId);
}

export async function completeMemberOrder(
  orderId: string,
): Promise<MemberOrderActionResult> {
  try {
    const invalidId = rejectNonUuidMutationOrderId(orderId);
    if (invalidId) {
      return invalidId;
    }
    const trimmedOrderId = orderId.trim();

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再確認完成" };
    }

    logMemberOrderMutation("completeMemberOrder", {
      phase: "mutation_input",
      input: orderId,
      member_order_id: trimmedOrderId,
      p_user_id: user.id,
    });

    const { data: orderRow, error: orderLookupError } = await supabase
      .from("member_orders")
      .select("id, buyer_id, status, listing_id, seller_id")
      .eq("id", trimmedOrderId)
      .maybeSingle();

    const orderSnapshot = orderRow as {
      id: string;
      buyer_id: string;
      seller_id: string;
      listing_id: string;
      status: Tables<"member_orders">["status"];
    } | null;

    if (orderLookupError) {
      console.error("[completeMemberOrder] lookup", orderLookupError.message);
      return { success: false, error: mapOrderRpcError(orderLookupError.message) };
    }

    if (!orderSnapshot) {
      return { success: false, error: "找不到指定的交易訂單記錄" };
    }

    if (orderSnapshot.buyer_id !== user.id) {
      return {
        success: false,
        error: "操作失敗：僅買家可確認完成交易，或訂單狀態不合法。",
      };
    }

    if (orderSnapshot.status !== "pending") {
      return {
        success: false,
        error: "操作失敗：僅買家可確認完成交易，或訂單狀態不合法。",
      };
    }

    if (!isUuid(orderSnapshot.listing_id)) {
      logMemberOrderMutation("completeMemberOrder", {
        phase: "listing_id_needs_resolve",
        member_order_id: trimmedOrderId,
        listing_id: orderSnapshot.listing_id,
        seller_id: orderSnapshot.seller_id,
      });

      const listingRepair = await ensureMemberOrderListingUuid(supabase, {
        orderId: trimmedOrderId,
        listingId: orderSnapshot.listing_id,
        sellerId: orderSnapshot.seller_id,
      });

      if (!listingRepair.ok) {
        logMemberOrderMutation("completeMemberOrder", {
          phase: "listing_id_repair_failed",
          member_order_id: trimmedOrderId,
          listing_id: orderSnapshot.listing_id,
          error: listingRepair.error,
        });
        return {
          success: false,
          error:
            "無法完成交易，請返回交易管理頁面重新整理後再試；若問題持續請聯繫客服。",
        };
      }

      if (listingRepair.wasRepaired) {
        logMemberOrderMutation("completeMemberOrder", {
          phase: "listing_id_repaired",
          member_order_id: trimmedOrderId,
          listing_id: listingRepair.listingId,
        });
      }
    }

    const invalidRpcIdentity = rejectInvalidRpcIdentity(
      trimmedOrderId,
      user.id,
    );
    if (invalidRpcIdentity) {
      return invalidRpcIdentity;
    }

    logMemberOrderMutation("completeMemberOrder", {
      phase: "rpc_invoke",
      input: orderId,
      resolved: trimmedOrderId,
      p_order_id: trimmedOrderId,
      p_user_id: user.id,
      rpc: "rpc_complete_member_order",
    });

    const { error } = await rpcCompleteMemberOrder(supabase, {
      p_order_id: trimmedOrderId,
      p_user_id: user.id,
    });

    if (error) {
      console.error("[completeMemberOrder] rpc", {
        message: error.message,
        input: orderId,
        p_order_id: trimmedOrderId,
        p_user_id: user.id,
      });
      const mapped = mapOrderRpcError(error.message);
      if (mapped === INVALID_MEMBER_ORDER_ID_ERROR) {
        return {
          success: false,
          error:
            "無法完成交易，請返回交易管理重新進入訂單；若問題持續請聯繫客服。",
        };
      }
      return { success: false, error: mapped };
    }

    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "確認完成時發生錯誤";
    console.error("[completeMemberOrder]", error);
    return { success: false, error: message };
  }
}

export async function mockPayMemberAuthOrder(
  orderId: string,
): Promise<MemberOrderActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再付款" };
    }

    const resolved = await resolveMemberOrderIdForUser(
      supabase,
      orderId,
      user.id,
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

    const session = createMemberAuthPaymentSession({
      orderId: trimmedOrderId,
      cardPrice: 0,
    });

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_mock_pay_member_auth_order",
          args: {
            p_order_id: string;
            p_buyer_id: string;
            p_mock_session_id?: string;
          },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_mock_pay_member_auth_order", {
      p_order_id: trimmedOrderId,
      p_buyer_id: user.id,
      p_mock_session_id: session.sessionId,
    });

    if (error) {
      console.error("[mockPayMemberAuthOrder]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    console.error("[mockPayMemberAuthOrder]", error);
    return { success: false, error: "模擬付款失敗，請稍後再試" };
  }
}

export async function submitInboundTracking(
  orderId: string,
  trackingNo: string,
): Promise<MemberOrderActionResult> {
  const trimmedTracking = trackingNo.trim();
  if (!trimmedTracking) {
    return { success: false, error: "請輸入有效的順豐物流單號" };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再提交" };
    }

    const resolved = await resolveMemberOrderIdForUser(
      supabase,
      orderId,
      user.id,
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_submit_inbound_tracking",
          args: {
            p_order_id: string;
            p_seller_id: string;
            p_tracking_no: string;
          },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_submit_inbound_tracking", {
      p_order_id: trimmedOrderId,
      p_seller_id: user.id,
      p_tracking_no: trimmedTracking,
    });

    if (error) {
      console.error("[submitInboundTracking]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    console.error("[submitInboundTracking]", error);
    return { success: false, error: "上載物流單號失敗" };
  }
}

export async function confirmBuyerReceived(
  orderId: string,
): Promise<MemberOrderActionResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再確認收貨" };
    }

    const resolved = await resolveMemberOrderIdForUser(
      supabase,
      orderId,
      user.id,
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_confirm_buyer_received",
          args: { p_order_id: string; p_buyer_id: string },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_confirm_buyer_received", {
      p_order_id: trimmedOrderId,
      p_buyer_id: user.id,
    });

    if (error) {
      console.error("[confirmBuyerReceived]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    console.error("[confirmBuyerReceived]", error);
    return { success: false, error: "確認收貨失敗" };
  }
}
