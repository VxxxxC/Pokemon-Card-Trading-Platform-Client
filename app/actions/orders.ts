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
import { resolveMerchantOrderIdForMerchant, resolveMerchantOrderIdForBuyer } from "@/lib/merchant-order/resolve-order-id";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/env";
import { getMerchantSellerActionFlags } from "@/app/lib/merchant-order/merchant-seller-actions";
import {
  loadBuyerMerchantTradingOrders,
  merchantBuyerOrderMatchesTab,
} from "@/lib/merchant-order/load-buyer-merchant-orders";
import { computeMerchantPaymentExpiresAt } from "@/lib/merchant-checkout/pending-payment-expiry";
import {
  getMerchantBuyerActionFlags,
  mapMerchantEscrowToMemberEscrowStatus,
} from "@/lib/merchant-order/buyer-actions";
import {
  mapMerchantEscrowToMemberStatus,
  rpcPrepareMerchantOrderPayout,
} from "@/lib/merchant-order/merchant-order-rpc";
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

function revalidateMerchantOrderPaths(orderId: string): void {
  revalidatePath("/profile/merchant/trading");
  revalidatePath("/profile/merchant/orderDetail/" + orderId);
  revalidatePath("/profile/user/trading");
}

function merchantBuyerOrderMatchesSearch(
  order: UserTradingOrder,
  searchQuery?: string,
): boolean {
  const query = searchQuery?.trim().toLowerCase();
  if (!query) {
    return true;
  }

  const haystack = [
    order.orderNumber,
    order.product.cardName,
    order.product.cardNumber,
    order.product.setCode,
    order.product.displayId,
    order.counterparty.displayName,
    order.counterparty.username,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(query);
}

async function loadReviewedMerchantOrderIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderIds: string[],
): Promise<Set<string>> {
  if (orderIds.length === 0) {
    return new Set();
  }

  const { data, error } = await (
    supabase as unknown as {
      rpc: (
        fn: "rpc_get_user_reviewed_merchant_order_ids",
        args: { p_order_ids: string[] },
      ) => Promise<{
        data: string[] | null;
        error: { message: string } | null;
      }>;
    }
  ).rpc("rpc_get_user_reviewed_merchant_order_ids", {
    p_order_ids: orderIds,
  });

  if (error) {
    console.error("[loadReviewedMerchantOrderIds]", error.message);
    return new Set();
  }

  return new Set(data ?? []);
}

function paginateMergedOrders(
  orders: UserTradingOrder[],
  page: number,
  pageSize: number,
): {
  data: UserTradingOrder[];
  meta: TradingOrdersPaginationMeta;
} {
  const total = orders.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const data = orders.slice(offset, offset + pageSize);
  const rangeStart = total === 0 ? 0 : offset + 1;
  const rangeEnd = total === 0 ? 0 : Math.min(offset + pageSize, total);

  return {
    data,
    meta: {
      total,
      page: safePage,
      pageSize,
      totalPages,
      rangeStart,
      rangeEnd,
    },
  };
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
  /** B2C 商戶訂單尚未完成 Stripe 託管付款（escrow_status = pending_payment）。 */
  pendingPayment: boolean;
  /** B2C 待付款截止時間（created_at + 48h），僅 pending_payment 時有值。 */
  paymentExpiresAt?: string | null;
  /** B2C 買家可確認收貨並觸發撥款（merchant orders only）。 */
  canCompleteMerchantPurchase?: boolean;
  /** 鑑定託管訂單買家完成 mock / 正式付款時間 */
  paymentConfirmedAt?: string | null;
  /** Raw merchant escrow for buyer badge mapping. */
  merchantEscrowStatus?: Tables<"merchant_orders">["escrow_status"];
  shippingMethod?: string | null;
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
  inboundCourierName: string | null;
  outboundTrackingNo: string | null;
  outboundCourierName: string | null;
  paymentAmount: number;
  listingAcceptsBuyerAuth: boolean;
  canPay: boolean;
  canSubmitInbound: boolean;
  canConfirmReceipt: boolean;
  canCancel: boolean;
  /** Seller FPS ID (auth orders, sell persona only). */
  sellerFpsId?: string | null;
  sellerFpsName?: string | null;
  sellerPayoutStatus?: Tables<"member_orders">["seller_payout_status"];
  payoutHoldUntil?: string | null;
  buyerConfirmedAt?: string | null;
  /** Merchant B2C checkout breakdown (non-auth). */
  itemSubtotal?: number;
  shippingFee?: number;
  shippingMethod?: string | null;
  totalAmount?: number;
  paymentCaptureStatus?: Tables<"merchant_orders">["payment_capture_status"];
  /** Raw merchant escrow for buyer badge mapping. */
  merchantEscrowStatus?: Tables<"merchant_orders">["escrow_status"];
  sfLockerCode?: string | null;
  sfAddress?: string | null;
  buyerPhone?: string | null;
  meetupDetail?: string | null;
  buyerRemark?: string | null;
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
  payment_confirmed_at: string | null;
  platform_received_at: string | null;
  payment_capture_status: string | null;
  inbound_tracking_no: string | null;
  inbound_courier_name: string | null;
  outbound_tracking_no: string | null;
  buyer_confirmed_at: string | null;
  payout_hold_until: string | null;
  seller_payout_status: Tables<"member_orders">["seller_payout_status"];
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
    fps_id: string | null;
    fps_name: string | null;
  };
};

type BuyerMerchantOrderDetailQueryRow = {
  id: string;
  order_number: string | null;
  buyer_id: string;
  merchant_id: string;
  final_price: number;
  escrow_status: Tables<"merchant_orders">["escrow_status"];
  requires_authentication: boolean | null;
  created_at: string | null;
  listing_id: string;
  item_subtotal: number | null;
  shipping_fee: number | null;
  shipping_method: string | null;
  total_amount: number | null;
  inbound_tracking_no: string | null;
  inbound_courier_name: string | null;
  outbound_tracking_no: string | null;
  outbound_courier_name: string | null;
  payment_capture_status: Tables<"merchant_orders">["payment_capture_status"];
  auth_result: string | null;
  sf_locker_code: string | null;
  sf_address: string | null;
  buyer_phone: string | null;
  meetup_detail: string | null;
  buyer_remark: string | null;
  listings: {
    grading_company: string;
    grading_score: string | null;
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
};

type BuyerMerchantShopSnippet = Pick<
  Tables<"merchant_shops">,
  "merchant_id" | "shop_name" | "shop_handle" | "shop_avatar_path"
>;

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
    pendingPayment: false,
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
      p_page: input.persona === "sell" ? page : 1,
      p_page_size: input.persona === "sell" ? pageSize : 200,
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

    if (input.persona === "sell") {
      return {
        success: true,
        data: mappedOrders,
        meta,
        filters,
      };
    }

    const merchantBuyerOrders = await loadBuyerMerchantTradingOrders(
      supabase,
      user.id,
      new Set(),
    );
    const reviewedMerchantIds = await loadReviewedMerchantOrderIds(
      supabase,
      merchantBuyerOrders.map((order) => order.id),
    );
    const merchantOrdersWithReviewState = merchantBuyerOrders.map((order) => ({
      ...order,
      hasReviewedByMe: reviewedMerchantIds.has(order.id),
    }));

    const filteredMerchantOrders = merchantOrdersWithReviewState.filter(
      (order) =>
        merchantBuyerOrderMatchesTab(order, input.tabStatus) &&
        merchantBuyerOrderMatchesSearch(order, input.searchQuery),
    );

    const personaFilteredMember =
      input.persona === "buy"
        ? mappedOrders.filter((order) => order.persona === "buy")
        : mappedOrders;

    const combined = [...personaFilteredMember, ...filteredMerchantOrders].sort(
      (left, right) => {
        const leftTime = new Date(left.createdAt ?? 0).getTime();
        const rightTime = new Date(right.createdAt ?? 0).getTime();
        return rightTime - leftTime;
      },
    );

    const merged = paginateMergedOrders(combined, page, pageSize);
    const merchantBuyCount = merchantOrdersWithReviewState.filter(
      (order) => order.persona === "buy",
    ).length;

    return {
      success: true,
      data: merged.data,
      meta: merged.meta,
      filters: {
        ...filters,
        persona: {
          all: filters.persona.all + merchantBuyCount,
          buy: filters.persona.buy + merchantBuyCount,
          sell: filters.persona.sell,
        },
      },
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

type SearchMerchantTradingOrdersRpcRow = {
  order_id: string;
  order_number: string | null;
  buyer_id: string;
  merchant_id: string;
  final_price: number;
  escrow_status: Tables<"merchant_orders">["escrow_status"];
  requires_authentication: boolean | null;
  created_at: string | null;
  has_reviewed_by_me: boolean;
  buyer_display_name: string | null;
  buyer_username: string | null;
  buyer_avatar_path: string | null;
  grading_company: string;
  grading_score: string | null;
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
  count_status_all: number | string;
  count_status_pending: number | string;
  count_status_completed: number | string;
  count_status_cancelled: number | string;
  count_needs_action: number | string;
  count_pending_payment: number | string;
  count_pending_auth: number | string;
};

export type GetMerchantTradingOrdersInput = {
  tabStatus: "all" | "pending" | "completed" | "cancelled";
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  includePaymentPending?: boolean;
  includeAuthInProgress?: boolean;
};

export type MerchantTradingBuyer = {
  id: string;
  displayName: string;
  username: string | null;
  avatarUrl: string;
};

export type MerchantTradingOrder = {
  id: string;
  orderKind: "merchant";
  orderNumber: string | null;
  buyerId: string;
  merchantId: string;
  finalPrice: number;
  escrowStatus: Tables<"merchant_orders">["escrow_status"];
  requiresAuthentication: boolean | null;
  createdAt: string | null;
  paymentExpiresAt?: string | null;
  hasReviewedByMe: boolean;
  buyer: MerchantTradingBuyer;
  listing: {
    gradingCompany: string;
    gradingScore: string | null;
  };
  product: {
    cardName: string;
    cardNumber: string | null;
    setCode: string;
    displayId: string | null;
    imageUrl: string;
  };
};

export type MerchantTradingFilterCounts = {
  status: {
    all: number;
    pending: number;
    completed: number;
    cancelled: number;
  };
  needsAction: number;
  pendingSub: {
    payment: number;
    authInProgress: number;
  };
};

export type SearchMerchantTradingOrdersResult =
  | {
      success: true;
      data: MerchantTradingOrder[];
      meta: TradingOrdersPaginationMeta;
      filters: MerchantTradingFilterCounts;
    }
  | { success: false; error: string };

type SearchMerchantTradingOrdersRpcArgs = {
  p_tab_status: GetMerchantTradingOrdersInput["tabStatus"];
  p_search_query?: string;
  p_page: number;
  p_page_size: number;
  p_include_payment_pending: boolean;
  p_include_auth_in_progress: boolean;
};

function toMerchantPaginationMeta(
  row: SearchMerchantTradingOrdersRpcRow | undefined,
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

function toMerchantFilterCounts(
  row: SearchMerchantTradingOrdersRpcRow | undefined,
): MerchantTradingFilterCounts {
  if (!row) {
    return {
      status: { all: 0, pending: 0, completed: 0, cancelled: 0 },
      needsAction: 0,
      pendingSub: { payment: 0, authInProgress: 0 },
    };
  }

  return {
    status: {
      all: Number(row.count_status_all),
      pending: Number(row.count_status_pending),
      completed: Number(row.count_status_completed),
      cancelled: Number(row.count_status_cancelled),
    },
    needsAction: Number(row.count_needs_action),
    pendingSub: {
      payment: Number(row.count_pending_payment),
      authInProgress: Number(row.count_pending_auth),
    },
  };
}

function mapMerchantRpcRow(
  row: SearchMerchantTradingOrdersRpcRow,
): MerchantTradingOrder {
  return {
    id: row.order_id,
    orderKind: "merchant",
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    merchantId: row.merchant_id,
    finalPrice: Number(row.final_price),
    escrowStatus: row.escrow_status,
    requiresAuthentication: row.requires_authentication,
    createdAt: row.created_at,
    hasReviewedByMe: row.has_reviewed_by_me,
    buyer: {
      id: row.buyer_id,
      displayName: row.buyer_display_name ?? "未知用戶",
      username: row.buyer_username,
      avatarUrl: resolveAvatarUrl(row.buyer_avatar_path),
    },
    listing: {
      gradingCompany: row.grading_company,
      gradingScore: row.grading_score,
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

export async function searchMerchantTradingOrders(
  input: GetMerchantTradingOrdersInput,
): Promise<SearchMerchantTradingOrdersResult> {
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
      console.error("[searchMerchantTradingOrders]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱訂單" };
    }

    const rpcArgs: SearchMerchantTradingOrdersRpcArgs = {
      p_tab_status: input.tabStatus,
      p_search_query: input.searchQuery?.trim() || undefined,
      p_page: page,
      p_page_size: pageSize,
      p_include_payment_pending: input.includePaymentPending ?? true,
      p_include_auth_in_progress: input.includeAuthInProgress ?? true,
    };

    const rpcStart = isTradingPerfLogEnabled() ? tradingPerfNow() : 0;

    const { data, error } = await (
      supabase as unknown as {
        rpc: (
          fn: "search_merchant_trading_orders",
          args: SearchMerchantTradingOrdersRpcArgs,
        ) => Promise<{
          data: SearchMerchantTradingOrdersRpcRow[] | null;
          error: { message: string } | null;
        }>;
      }
    ).rpc("search_merchant_trading_orders", rpcArgs);

    if (error) {
      console.error("[searchMerchantTradingOrders]", error.message);
      return { success: false, error: "無法載入訂單" };
    }

    const rows = (data ?? []) as SearchMerchantTradingOrdersRpcRow[];
    const meta = toMerchantPaginationMeta(rows[0], page, pageSize);
    const filters = toMerchantFilterCounts(rows[0]);

    if (isTradingPerfLogEnabled()) {
      tradingPerfLog(
        `merchant.search.rpcMs=${Math.round(tradingPerfNow() - rpcStart)} totalMs=${Math.round(tradingPerfNow() - totalStart)} orders=${rows.length} total=${meta.total} needsAction=${filters.needsAction} tab=${input.tabStatus}`,
      );
    }

    return {
      success: true,
      data: rows.map(mapMerchantRpcRow),
      meta,
      filters,
    };
  } catch (error) {
    console.error("[searchMerchantTradingOrders]", error);
    return { success: false, error: "無法連線至訂單服務" };
  }
}

export type MerchantOrderDetail = MerchantTradingOrder & {
  listingId: string;
  listingImageUrls: string[];
  logisticsProofPath: string | null;
  inboundTrackingNo: string | null;
  inboundCourierName: string | null;
  outboundTrackingNo: string | null;
  outboundCourierName: string | null;
  itemSubtotal: number;
  shippingFee: number;
  shippingMethod: string | null;
  totalAmount: number;
  authFee: number;
  canSubmitLogistics: boolean;
  canSubmitDirectFulfillment: boolean;
  canReviewBuyer: boolean;
  stripePaymentIntentId: string | null;
  stripeTransferId: string | null;
  commissionAmount: number | null;
  commissionRateApplied: number | null;
  merchantPayoutAmount: number | null;
  payoutStatus: string;
  sfLockerCode: string | null;
  sfAddress: string | null;
  buyerPhone: string | null;
  meetupDetail: string | null;
  buyerRemark: string | null;
};

export type GetMerchantOrderDetailResult =
  | { success: true; data: MerchantOrderDetail }
  | { success: false; error: string };

type MerchantOrderDetailQueryRow = {
  id: string;
  order_number: string | null;
  buyer_id: string;
  merchant_id: string;
  final_price: number;
  escrow_status: Tables<"merchant_orders">["escrow_status"];
  requires_authentication: boolean | null;
  created_at: string | null;
  listing_id: string;
  logistics_proof_path: string | null;
  inbound_tracking_no: string | null;
  inbound_courier_name: string | null;
  outbound_tracking_no: string | null;
  outbound_courier_name: string | null;
  item_subtotal: number | null;
  shipping_fee: number | null;
  shipping_method: string | null;
  total_amount: number | null;
  auth_fee: number | null;
  stripe_payment_intent_id: string | null;
  stripe_transfer_id: string | null;
  commission_amount: number | null;
  commission_rate_applied: number | null;
  merchant_payout_amount: number | null;
  payout_status: string;
  sf_locker_code: string | null;
  sf_address: string | null;
  buyer_phone: string | null;
  meetup_detail: string | null;
  buyer_remark: string | null;
  listings: {
    grading_company: string;
    grading_score: string | null;
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
};

function mapMerchantOrderDetailRow(
  row: MerchantOrderDetailQueryRow,
  hasReviewedByMe: boolean,
): MerchantOrderDetail {
  const catalog = row.listings.product_catalog;
  const listingImageUrls = parseListingImageUrls(row.listings.images);
  const sellerFlags = getMerchantSellerActionFlags({
    escrowStatus: row.escrow_status,
    hasReviewedByMe,
    requiresAuthentication: row.requires_authentication,
    shippingMethod: row.shipping_method,
  });
  const createdAt = row.created_at ?? new Date().toISOString();
  const paymentExpiresAt =
    row.escrow_status === "pending_payment"
      ? computeMerchantPaymentExpiresAt(createdAt)
      : null;

  return {
    id: row.id,
    orderKind: "merchant",
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    merchantId: row.merchant_id,
    finalPrice: Number(row.final_price),
    escrowStatus: row.escrow_status,
    requiresAuthentication: row.requires_authentication,
    createdAt: row.created_at,
    paymentExpiresAt,
    hasReviewedByMe,
    buyer: {
      id: row.buyer.id,
      displayName: row.buyer.display_name ?? "未知用戶",
      username: row.buyer.username,
      avatarUrl: resolveAvatarUrl(row.buyer.avatar_path),
    },
    listing: {
      gradingCompany: row.listings.grading_company,
      gradingScore: row.listings.grading_score,
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
    logisticsProofPath: row.logistics_proof_path,
    inboundTrackingNo: row.inbound_tracking_no,
    inboundCourierName: row.inbound_courier_name,
    outboundTrackingNo: row.outbound_tracking_no,
    outboundCourierName: row.outbound_courier_name,
    itemSubtotal: Number(row.item_subtotal ?? row.final_price),
    shippingFee: Number(row.shipping_fee ?? 0),
    shippingMethod: row.shipping_method,
    totalAmount: Number(row.total_amount ?? row.final_price),
    authFee: Number(row.auth_fee ?? 0),
    canSubmitLogistics: sellerFlags.canSubmitLogistics,
    canSubmitDirectFulfillment: sellerFlags.canSubmitDirectFulfillment,
    canReviewBuyer: sellerFlags.canReviewBuyer,
    stripePaymentIntentId: row.stripe_payment_intent_id,
    stripeTransferId: row.stripe_transfer_id,
    commissionAmount:
      row.commission_amount != null ? Number(row.commission_amount) : null,
    commissionRateApplied:
      row.commission_rate_applied != null
        ? Number(row.commission_rate_applied)
        : null,
    merchantPayoutAmount:
      row.merchant_payout_amount != null
        ? Number(row.merchant_payout_amount)
        : null,
    payoutStatus: row.payout_status,
    sfLockerCode: row.sf_locker_code,
    sfAddress: row.sf_address,
    buyerPhone: row.buyer_phone,
    meetupDetail: row.meetup_detail,
    buyerRemark: row.buyer_remark,
  };
}

export async function getMerchantOrderDetail(
  orderId: string,
): Promise<GetMerchantOrderDetailResult> {
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
      console.error("[getMerchantOrderDetail]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱訂單" };
    }

    // Admin override：管理員可由後台「商戶流水」跨越 merchant_id scope 唯讀查閱任何訂單。
    // TODO: [Admin Override] service-role 讀取暫代 RLS policy，待 DB 層補上
    //       is_admin() SECURITY DEFINER + merchant_orders admin bypass policy 後移除。
    const isAdminViewer = await isCurrentUserAdmin(supabase, user.id);
    // NOTE: service-role client 與 SSR client 的泛型簽名不同（supabase-js v2 為 4 個泛型，
    //       @supabase/ssr 為 3 個），此處僅為型別對齊，執行期行為一致。
    const db = isAdminViewer
      ? (createAdminClient() as unknown as typeof supabase)
      : supabase;

    const resolved = await resolveMerchantOrderIdForMerchant(
      db,
      orderId,
      user.id,
      { adminOverride: isAdminViewer },
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

    const { data, error } = await db
      .from("merchant_orders")
      .select(
        `
          id,
          order_number,
          buyer_id,
          merchant_id,
          final_price,
          escrow_status,
          requires_authentication,
          created_at,
          listing_id,
          logistics_proof_path,
          inbound_tracking_no,
          inbound_courier_name,
          outbound_tracking_no,
          outbound_courier_name,
          item_subtotal,
          shipping_fee,
          shipping_method,
          total_amount,
          auth_fee,
          stripe_payment_intent_id,
          stripe_transfer_id,
          commission_amount,
          commission_rate_applied,
          merchant_payout_amount,
          payout_status,
          sf_locker_code,
          sf_address,
          buyer_phone,
          meetup_detail,
          buyer_remark,
          listings!inner (
            grading_company,
            grading_score,
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
          buyer:profiles!fk_merchant_orders_buyer_id (
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
      console.error("[getMerchantOrderDetail]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    const row = data as MerchantOrderDetailQueryRow | null;
    if (!row) {
      return { success: false, error: "找不到指定的交易訂單記錄" };
    }

    if (!isAdminViewer && row.merchant_id !== user.id) {
      return { success: false, error: "您沒有權限查閱此訂單" };
    }

    const { data: reviewRows, error: reviewError } = await db
      .from("transaction_reviews")
      .select("id")
      .eq("merchant_order_id", trimmedOrderId)
      .eq("reviewer_id", user.id)
      .limit(1);

    if (reviewError) {
      console.error("[getMerchantOrderDetail] reviews", reviewError.message);
      return { success: false, error: "無法載入訂單" };
    }

    const hasReviewedByMe = (reviewRows?.length ?? 0) > 0;

    return {
      success: true,
      data: mapMerchantOrderDetailRow(row, hasReviewedByMe),
    };
  } catch (error) {
    console.error("[getMerchantOrderDetail]", error);
    return { success: false, error: "無法連線至訂單服務" };
  }
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
    platformReceivedAt: row.platform_received_at,
    paymentCaptureStatus: row.payment_capture_status,
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
    pendingPayment: false,
    paymentConfirmedAt: row.payment_confirmed_at,
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
    inboundCourierName: row.inbound_courier_name,
    outboundTrackingNo: row.outbound_tracking_no,
    outboundCourierName: null,
    paymentAmount: calculateMemberAuthPaymentTotal(Number(row.final_price)),
    listingAcceptsBuyerAuth: row.listings.use_authentication,
    canPay: authActions.canPay,
    canSubmitInbound: authActions.canSubmitInbound,
    canConfirmReceipt: authActions.canConfirmReceipt,
    canCancel: row.use_authentication
      ? authActions.canCancel
      : row.seller_id === viewerId && row.status === "pending",
    ...(persona === "sell" && row.use_authentication
      ? {
          sellerFpsId: row.seller.fps_id?.trim() || null,
          sellerFpsName: row.seller.fps_name?.trim() || null,
          sellerPayoutStatus: row.seller_payout_status,
          payoutHoldUntil: row.payout_hold_until,
          buyerConfirmedAt: row.buyer_confirmed_at,
        }
      : {}),
  };
}

function mapBuyerMerchantOrderDetailRow(
  row: BuyerMerchantOrderDetailQueryRow,
  shop: BuyerMerchantShopSnippet | null,
  hasReviewedByMe: boolean,
): MemberOrderDetail {
  const catalog = row.listings.product_catalog;
  const listingImageUrls = parseListingImageUrls(row.listings.images);
  const useAuthentication = Boolean(row.requires_authentication);
  const status = mapMerchantEscrowToMemberStatus(row.escrow_status);
  const pendingPayment = row.escrow_status === "pending_payment";
  const memberEscrowStatus = mapMerchantEscrowToMemberEscrowStatus(
    row.escrow_status,
    useAuthentication,
  );
  const buyerFlags = getMerchantBuyerActionFlags({
    escrowStatus: row.escrow_status,
    requiresAuthentication: useAuthentication,
    shippingMethod: row.shipping_method,
    outboundTrackingNo: row.outbound_tracking_no,
    authResult: row.auth_result,
    paymentCaptureStatus: row.payment_capture_status,
  });
  const createdAt = row.created_at ?? new Date().toISOString();
  const expiresAt = new Date(
    new Date(createdAt).getTime() + 14 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const paymentExpiresAt = pendingPayment
    ? computeMerchantPaymentExpiresAt(createdAt)
    : null;

  return {
    id: row.id,
    orderKind: "merchant",
    orderNumber: row.order_number,
    buyerId: row.buyer_id,
    sellerId: row.merchant_id,
    finalPrice: Number(row.final_price),
    status,
    createdAt: row.created_at,
    expiresAt,
    persona: "buy",
    hasReviewedByMe,
    useAuthentication,
    escrowStatus: memberEscrowStatus,
    pendingPayment,
    paymentExpiresAt,
    canCompleteMerchantPurchase: buyerFlags.canCompleteMerchantPurchase,
    counterparty: {
      id: row.merchant_id,
      displayName: shop?.shop_name?.trim() || "認證商戶",
      username: shop?.shop_handle?.trim() || null,
      avatarUrl: resolveAvatarUrl(shop?.shop_avatar_path),
    },
    listing: {
      gradingCompany: row.listings.grading_company,
      gradingScore: row.listings.grading_score,
      useAuthentication,
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
    inboundCourierName: row.inbound_courier_name,
    outboundTrackingNo: row.outbound_tracking_no,
    outboundCourierName: row.outbound_courier_name,
    paymentAmount: Number(row.total_amount ?? row.final_price),
    listingAcceptsBuyerAuth: useAuthentication,
    canPay: pendingPayment,
    canSubmitInbound: false,
    canConfirmReceipt: buyerFlags.canCompleteMerchantPurchase,
    canCancel: false,
    itemSubtotal: Number(row.item_subtotal ?? row.final_price),
    shippingFee: Number(row.shipping_fee ?? 0),
    shippingMethod: row.shipping_method,
    totalAmount: Number(row.total_amount ?? row.final_price),
    paymentCaptureStatus: row.payment_capture_status,
    merchantEscrowStatus: row.escrow_status,
    sfLockerCode: row.sf_locker_code,
    sfAddress: row.sf_address,
    buyerPhone: row.buyer_phone,
    meetupDetail: row.meetup_detail,
    buyerRemark: row.buyer_remark,
  };
}

async function getBuyerMerchantOrderDetail(
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
      console.error("[getBuyerMerchantOrderDetail]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱訂單" };
    }

    const isAdminViewer = await isCurrentUserAdmin(supabase, user.id);
    const db = isAdminViewer
      ? (createAdminClient() as unknown as typeof supabase)
      : supabase;

    const resolved = await resolveMerchantOrderIdForBuyer(
      db,
      orderId,
      user.id,
      { adminOverride: isAdminViewer },
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

    const { data, error } = await db
      .from("merchant_orders")
      .select(
        `
          id,
          order_number,
          buyer_id,
          merchant_id,
          final_price,
          escrow_status,
          requires_authentication,
          created_at,
          listing_id,
          item_subtotal,
          shipping_fee,
          shipping_method,
          total_amount,
          inbound_tracking_no,
          inbound_courier_name,
          outbound_tracking_no,
          outbound_courier_name,
          payment_capture_status,
          auth_result,
          sf_locker_code,
          sf_address,
          buyer_phone,
          meetup_detail,
          buyer_remark,
          listings!inner (
            grading_company,
            grading_score,
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
          )
        `,
      )
      .eq("id", trimmedOrderId)
      .maybeSingle();

    if (error) {
      console.error("[getBuyerMerchantOrderDetail]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    const row = data as BuyerMerchantOrderDetailQueryRow | null;
    if (!row) {
      return { success: false, error: "找不到指定的交易訂單記錄" };
    }

    if (!isAdminViewer && row.buyer_id !== user.id) {
      return { success: false, error: "您沒有權限查閱此訂單" };
    }

    const { data: shopRow, error: shopError } = await db
      .from("merchant_shops")
      .select("merchant_id, shop_name, shop_handle, shop_avatar_path")
      .eq("merchant_id", row.merchant_id)
      .maybeSingle();

    if (shopError) {
      console.error("[getBuyerMerchantOrderDetail] merchant_shops", shopError.message);
    }

    const { data: reviewRows, error: reviewError } = await db
      .from("transaction_reviews")
      .select("id")
      .eq("merchant_order_id", trimmedOrderId)
      .eq("reviewer_id", user.id)
      .limit(1);

    if (reviewError) {
      console.error("[getBuyerMerchantOrderDetail] reviews", reviewError.message);
      return { success: false, error: "無法載入訂單" };
    }

    const hasReviewedByMe = (reviewRows?.length ?? 0) > 0;

    return {
      success: true,
      data: mapBuyerMerchantOrderDetailRow(
        row,
        (shopRow as BuyerMerchantShopSnippet | null) ?? null,
        hasReviewedByMe,
      ),
    };
  } catch (error) {
    console.error("[getBuyerMerchantOrderDetail]", error);
    return { success: false, error: "無法連線至訂單服務" };
  }
}

export async function getUserOrderDetail(
  orderId: string,
): Promise<GetMemberOrderDetailResult> {
  const memberResult = await getMemberOrderDetail(orderId);
  if (memberResult.success) {
    return memberResult;
  }

  return getBuyerMerchantOrderDetail(orderId);
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

    // Admin override：管理員可由後台「FPS 批次處理」跨越交易雙方 scope 唯讀查閱任何訂單。
    // TODO: [Admin Override] service-role 讀取暫代 RLS policy，待 DB 層補上
    //       is_admin() SECURITY DEFINER + member_orders admin bypass policy 後移除。
    // TODO: [Admin Override] 管理員非交易方，mapMemberOrderDetailRow 會將其視為賣方視角
    //       (persona = "sell")，後續應加入獨立的 admin 唯讀 persona。
    const isAdminViewer = await isCurrentUserAdmin(supabase, user.id);
    // NOTE: service-role client 與 SSR client 的泛型簽名不同（supabase-js v2 為 4 個泛型，
    //       @supabase/ssr 為 3 個），此處僅為型別對齊，執行期行為一致。
    const db = isAdminViewer
      ? (createAdminClient() as unknown as typeof supabase)
      : supabase;

    const resolved = await resolveMemberOrderIdForUser(
      db,
      orderId,
      user.id,
      { adminOverride: isAdminViewer },
    );
    if (!resolved.ok) {
      return { success: false, error: resolved.error };
    }
    const trimmedOrderId = resolved.id;

    const { data, error } = await db
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
          payment_confirmed_at,
          platform_received_at,
          payment_capture_status,
          inbound_tracking_no,
          inbound_courier_name,
          outbound_tracking_no,
          buyer_confirmed_at,
          payout_hold_until,
          seller_payout_status,
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
            avatar_path,
            fps_id,
            fps_name
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

    if (!isAdminViewer && row.buyer_id !== user.id && row.seller_id !== user.id) {
      return { success: false, error: "您沒有權限查閱此訂單" };
    }

    const { data: reviewRows, error: reviewError } = await db
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

    const { data: orderRowData, error: orderLookupError } = await supabase
      .from("member_orders")
      .select(
        "use_authentication, payment_capture_status, stripe_payment_intent_id",
      )
      .eq("id", trimmedOrderId)
      .eq("seller_id", user.id)
      .maybeSingle();

    if (orderLookupError) {
      console.error("[cancelMemberOrder] lookup", orderLookupError.message);
      return { success: false, error: "無法讀取訂單狀態" };
    }

    const orderRow = orderRowData as {
      use_authentication: boolean;
      payment_capture_status: string | null;
      stripe_payment_intent_id: string | null;
    } | null;

    if (
      orderRow?.use_authentication &&
      orderRow.payment_capture_status === "authorized" &&
      orderRow.stripe_payment_intent_id
    ) {
      try {
        const stripe = await getStripeClient();
        if (!stripe) {
          return { success: false, error: "付款服務尚未設定，請稍後再試" };
        }
        await stripe.paymentIntents.cancel(
          orderRow.stripe_payment_intent_id,
          {},
          {
            idempotencyKey: `member-auth-void:${trimmedOrderId}`,
          },
        );
      } catch (stripeError) {
        const message =
          stripeError instanceof Error
            ? stripeError.message
            : "取消付款授權失敗";
        console.error("[cancelMemberOrder] stripe void", message);
        return { success: false, error: message };
      }
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

export async function submitMerchantLogistics(
  orderId: string,
  trackingNo: string,
  courierName: string,
): Promise<MemberOrderActionResult> {
  const invalidId = rejectNonUuidMutationOrderId(orderId);
  if (invalidId) {
    return invalidId;
  }

  const trimmedOrderId = orderId.trim();
  const trimmedTracking = trackingNo.trim();
  const trimmedCourier = courierName.trim();
  if (!trimmedTracking) {
    return { success: false, error: "請輸入有效的物流單號" };
  }
  if (!trimmedCourier) {
    return { success: false, error: "請輸入快遞公司名稱" };
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
      return { success: false, error: "請先登入後再操作" };
    }

    const identityError = rejectInvalidRpcIdentity(trimmedOrderId, user.id);
    if (identityError) {
      return identityError;
    }

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_submit_merchant_auth_inbound_tracking",
          args: {
            p_order_id: string;
            p_merchant_id: string;
            p_tracking_no: string;
            p_courier_name: string;
          },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc(
      "rpc_submit_merchant_auth_inbound_tracking",
      {
        p_order_id: trimmedOrderId,
        p_merchant_id: user.id,
        p_tracking_no: trimmedTracking,
        p_courier_name: trimmedCourier,
      },
    );

    if (error) {
      console.error("[submitMerchantLogistics]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    revalidatePath("/profile/merchant/trading");
    revalidateMerchantOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    console.error("[submitMerchantLogistics]", error);
    return { success: false, error: "物流提交失敗，請稍後再試" };
  }
}

export async function submitMerchantDirectFulfillment(
  orderId: string,
  trackingNo?: string,
  courierName?: string,
): Promise<MemberOrderActionResult> {
  const invalidId = rejectNonUuidMutationOrderId(orderId);
  if (invalidId) {
    return invalidId;
  }

  const trimmedOrderId = orderId.trim();
  const trimmedTracking = trackingNo?.trim() ?? "";
  const trimmedCourier = courierName?.trim() ?? "";

  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再操作" };
    }

    const identityError = rejectInvalidRpcIdentity(trimmedOrderId, user.id);
    if (identityError) {
      return identityError;
    }

    const { error } = await (
      supabase as unknown as {
        rpc: (
          fn: "rpc_submit_merchant_direct_fulfillment",
          args: {
            p_order_id: string;
            p_merchant_id: string;
            p_tracking_no?: string | null;
            p_courier_name?: string | null;
          },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_submit_merchant_direct_fulfillment", {
      p_order_id: trimmedOrderId,
      p_merchant_id: user.id,
      p_tracking_no: trimmedTracking || null,
      p_courier_name: trimmedCourier || null,
    });

    if (error) {
      console.error("[submitMerchantDirectFulfillment]", error.message);
      return { success: false, error: mapOrderRpcError(error.message) };
    }

    revalidatePath("/profile/merchant/trading");
    revalidateMerchantOrderPaths(trimmedOrderId);
    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    console.error("[submitMerchantDirectFulfillment]", error);
    return { success: false, error: "發貨確認失敗，請稍後再試" };
  }
}

type MerchantPayoutPreparation =
  | {
      alreadyApplied: true;
      orderId: string;
    }
  | {
      alreadyApplied: false;
      orderId: string;
      paymentIntentId: string;
      stripeAccountId: string;
      totalAmount: number;
      commissionAmount: number;
      merchantPayoutAmount: number;
    };

type MerchantPayoutAdminRpcClient = {
  rpc(
    fn: "rpc_finalize_merchant_order_payout",
    args: {
      p_order_id: string;
      p_transfer_id: string;
      p_transfer_amount_cents: number;
      p_destination_account_id: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_mark_merchant_order_payout_failed",
    args: {
      p_order_id: string;
      p_error: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

function readMerchantPayoutRpcString(
  row: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return "";
}

function parseMerchantPayoutPreparation(
  value: unknown,
): MerchantPayoutPreparation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const orderId = readMerchantPayoutRpcString(row, ["order_id"]);
  if (!orderId) {
    return null;
  }

  if (row.already_applied === true) {
    return { alreadyApplied: true, orderId };
  }

  const paymentIntentId = readMerchantPayoutRpcString(row, [
    "stripe_payment_intent_id",
    "payment_intent_id",
  ]);
  const stripeAccountId = readMerchantPayoutRpcString(row, [
    "stripe_destination_account_id",
    "stripe_account_id",
  ]);
  const totalAmount = Number(row.total_amount);
  const commissionAmount = Number(row.commission_amount);
  const merchantPayoutAmount = Number(row.merchant_payout_amount);

  if (
    !paymentIntentId ||
    !stripeAccountId ||
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0 ||
    !Number.isFinite(commissionAmount) ||
    commissionAmount < 0 ||
    !Number.isFinite(merchantPayoutAmount) ||
    merchantPayoutAmount <= 0
  ) {
    return null;
  }

  return {
    alreadyApplied: false,
    orderId,
    paymentIntentId,
    stripeAccountId,
    totalAmount,
    commissionAmount,
    merchantPayoutAmount,
  };
}

export async function completeMerchantOrder(
  orderId: string,
): Promise<MemberOrderActionResult> {
  let prepared: MerchantPayoutPreparation | null = null;

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

    const identityError = rejectInvalidRpcIdentity(trimmedOrderId, user.id);
    if (identityError) {
      return identityError;
    }

    const stripe = await getStripeClient();
    if (!stripe) {
      return { success: false, error: "撥款服務尚未設定，請稍後再試" };
    }

    const { data: prepareData, error: prepareError } =
      await rpcPrepareMerchantOrderPayout(supabase, {
      p_order_id: trimmedOrderId,
    });

    if (prepareError) {
      console.error(
        "[completeMerchantOrder] prepare payout",
        prepareError.message,
      );
      return {
        success: false,
        error: mapOrderRpcError(prepareError.message),
      };
    }

    prepared = parseMerchantPayoutPreparation(prepareData);
    if (!prepared) {
      console.error(
        "[completeMerchantOrder] invalid payout payload",
        prepareData,
      );
      return { success: false, error: "無法建立商戶撥款資料，請聯絡客服" };
    }

    if (prepared.alreadyApplied) {
      revalidatePath("/marketplace");
      revalidateMerchantOrderPaths(trimmedOrderId);
      revalidateMemberOrderPaths(trimmedOrderId);
      return { success: true };
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      prepared.paymentIntentId,
      { expand: ["latest_charge"] },
    );
    const expectedTotalInCents = Math.round(prepared.totalAmount * 100);
    const merchantPayoutInCents = Math.round(
      prepared.merchantPayoutAmount * 100,
    );
    const latestCharge =
      typeof paymentIntent.latest_charge === "string"
        ? paymentIntent.latest_charge
        : paymentIntent.latest_charge?.id;

    if (
      paymentIntent.status !== "succeeded" ||
      paymentIntent.currency !== "hkd" ||
      paymentIntent.metadata?.order_id !== prepared.orderId ||
      paymentIntent.amount_received < expectedTotalInCents ||
      !latestCharge ||
      merchantPayoutInCents <= 0
    ) {
      throw new Error("payment_not_settled");
    }

    const transfer = await stripe.transfers.create(
      {
        amount: merchantPayoutInCents,
        currency: "hkd",
        destination: prepared.stripeAccountId,
        source_transaction: latestCharge,
        transfer_group: `merchant_order_${prepared.orderId}`,
        metadata: {
          order_kind: "merchant_payout",
          order_id: prepared.orderId,
          destination_account_id: prepared.stripeAccountId,
          transfer_amount_cents: String(merchantPayoutInCents),
          commission_amount: String(prepared.commissionAmount),
        },
      },
      {
        idempotencyKey: `merchant-order-payout:${prepared.orderId}`,
      },
    );

    const admin = createAdminClient();
    const { error: finalizeError } = await (
      admin as unknown as MerchantPayoutAdminRpcClient
    ).rpc("rpc_finalize_merchant_order_payout", {
      p_order_id: prepared.orderId,
      p_transfer_id: transfer.id,
      p_transfer_amount_cents: transfer.amount,
      p_destination_account_id:
        typeof transfer.destination === "string"
          ? transfer.destination
          : (transfer.destination?.id ?? prepared.stripeAccountId),
    });

    if (finalizeError) {
      console.error(
        "[completeMerchantOrder] finalize payout",
        prepared.orderId,
        transfer.id,
        finalizeError.message,
      );
      return {
        success: false,
        error: "已確認收貨，商戶撥款正在核對中，請稍後重新整理",
      };
    }

    revalidatePath("/marketplace");
    revalidateMerchantOrderPaths(trimmedOrderId);
    revalidateMemberOrderPaths(trimmedOrderId);

    return { success: true };
  } catch (error) {
    if (prepared && !prepared.alreadyApplied) {
      const admin = createAdminClient();
      const { error: markFailedError } = await (
        admin as unknown as MerchantPayoutAdminRpcClient
      ).rpc("rpc_mark_merchant_order_payout_failed", {
        p_order_id: prepared.orderId,
        p_error: "stripe_transfer_failed",
      });
      if (markFailedError) {
        console.error(
          "[completeMerchantOrder] mark payout failed",
          markFailedError.message,
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "unknown payout error";
    console.error("[completeMerchantOrder]", error);
    return {
      success: false,
      error:
        message === "payment_not_settled"
          ? "付款尚未完成結算，暫時無法撥款"
          : "商戶撥款失敗，請稍後重試",
    };
  }
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
  if (process.env.NODE_ENV === "production") {
    return {
      success: false,
      error: "模擬付款僅供開發環境使用，請使用 Stripe 完成託管付款",
    };
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
  courierName: string,
): Promise<MemberOrderActionResult> {
  const trimmedTracking = trackingNo.trim();
  const trimmedCourier = courierName.trim();
  if (!trimmedTracking) {
    return { success: false, error: "請輸入有效的物流單號" };
  }
  if (!trimmedCourier) {
    return { success: false, error: "請輸入快遞公司名稱" };
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
            p_courier_name: string;
          },
        ) => Promise<{ error: { message: string } | null }>;
      }
    ).rpc("rpc_submit_inbound_tracking", {
      p_order_id: trimmedOrderId,
      p_seller_id: user.id,
      p_tracking_no: trimmedTracking,
      p_courier_name: trimmedCourier,
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
