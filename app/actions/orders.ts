"use server";

import { revalidatePath } from "next/cache";
import { resolveOfferCardDisplayImage } from "@/app/lib/chat/offerCardImage";
import { isSupabaseConfigured } from "@/lib/supabase/env";
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

export type MemberOrderActionResult =
  | { success: true }
  | { success: false; error: string };

export type GetUserTradingOrdersInput = {
  persona: "all" | "buy" | "sell";
  tabStatus: "all" | "pending" | "completed" | "cancelled";
  searchQuery?: string;
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

export type GetUserTradingOrdersResult =
  | { success: true; data: UserTradingOrder[] }
  | { success: false; error: string };

type MemberOrderQueryRow = Tables<"member_orders"> & {
  order_number?: string | null;
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
    display_name: string;
    username: string | null;
  };
  seller: {
    id: string;
    display_name: string;
    username: string | null;
  };
};

const PENDING_TAB_STATUSES = ["pending", "in_custody", "grading"] as const;

const PRODUCT_NAME_SEARCH_COLUMNS = [
  "name_ja",
  "name_en",
  "name_zh",
  "card_number",
  "display_id",
] as const;

function toIlikePattern(query: string): string {
  const escaped = query.replace(/[%_\\]/g, "\\$&");
  return `%${escaped}%`;
}

function quoteIlikePattern(pattern: string): string {
  return `"${pattern.replace(/"/g, '""')}"`;
}

function buildProductNameOrIlikeFilter(pattern: string): string {
  const quotedPattern = quoteIlikePattern(pattern);
  return PRODUCT_NAME_SEARCH_COLUMNS.map(
    (column) => `listings.product_catalog.${column}.ilike.${quotedPattern}`,
  ).join(",");
}

function buildOrderSearchOrFilter(searchQuery: string): string {
  const pattern = toIlikePattern(searchQuery.trim());
  const quotedPattern = quoteIlikePattern(pattern);
  return [
    `order_number.ilike.${quotedPattern}`,
    buildProductNameOrIlikeFilter(pattern),
  ].join(",");
}

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

function mapOrderRow(
  row: MemberOrderQueryRow,
  userId: string,
  reviewedOrderIds: ReadonlySet<string>,
): UserTradingOrder | null {
  const listing = row.listings;
  const catalog = listing?.product_catalog;

  if (!listing || !catalog) {
    return null;
  }

  const isBuyer = row.buyer_id === userId;
  const counterpartyProfile = isBuyer ? row.seller : row.buyer;

  return {
    id: row.id,
    orderNumber: row.order_number ?? null,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    finalPrice: row.final_price,
    status: row.status,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
    persona: isBuyer ? "buy" : "sell",
    hasReviewedByMe: reviewedOrderIds.has(row.id),
    counterparty: toCounterparty(
      counterpartyProfile
        ? {
            id: counterpartyProfile.id,
            displayName: counterpartyProfile.display_name,
            username: counterpartyProfile.username,
          }
        : null,
    ),
    listing: {
      gradingCompany: listing.grading_company,
      gradingScore: listing.grading_score,
      useAuthentication: listing.use_authentication,
    },
    product: {
      cardName: displayCardName(catalog),
      cardNumber: catalog.card_number,
      setCode: catalog.set_code,
      displayId: catalog.display_id,
      imageUrl: resolveOfferCardDisplayImage(
        listing.images,
        catalog.image_url,
      ),
    },
  };
}

export async function getUserTradingOrders(
  input: GetUserTradingOrdersInput,
): Promise<GetUserTradingOrdersResult> {
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
      console.error("[getUserTradingOrders]", authError.message);
      return { success: false, error: "無法驗證登入狀態" };
    }

    if (!user) {
      return { success: false, error: "請登入以查閱訂單" };
    }

    let query = supabase
      .from("member_orders")
      .select(
        `
          id,
          buyer_id,
          seller_id,
          final_price,
          status,
          created_at,
          expires_at,
          order_number,
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
      .order("created_at", { ascending: false });

    if (input.persona === "buy") {
      query = query.eq("buyer_id", user.id);
    } else if (input.persona === "sell") {
      query = query.eq("seller_id", user.id);
    } else {
      query = query.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);
    }

    if (input.tabStatus === "pending") {
      query = query.in("status", [...PENDING_TAB_STATUSES]);
    } else if (input.tabStatus === "completed") {
      query = query.eq("status", "completed");
    } else if (input.tabStatus === "cancelled") {
      query = query.eq("status", "cancelled");
    }

    const trimmedSearch = input.searchQuery?.trim();
    if (trimmedSearch) {
      query = query.or(buildOrderSearchOrFilter(trimmedSearch));
    }

    const { data, error } = await query;

    if (error) {
      console.error("[getUserTradingOrders]", error.message);
      return { success: false, error: "無法載入訂單" };
    }

    const rows = (data ?? []) as MemberOrderQueryRow[];
    const orderIds = rows.map((row) => row.id);

    let reviewedOrderIds = new Set<string>();

    if (orderIds.length > 0) {
      const { data: reviewedIds, error: reviewError } = await (
        supabase as unknown as {
          rpc: (
            fn: "rpc_get_user_reviewed_member_order_ids",
            args: { p_order_ids: string[] },
          ) => Promise<{
            data: string[] | null;
            error: { message: string } | null;
          }>;
        }
      ).rpc("rpc_get_user_reviewed_member_order_ids", {
        p_order_ids: orderIds,
      });

      if (reviewError) {
        console.error("[getUserTradingOrders] reviews", reviewError.message);
      } else {
        reviewedOrderIds = new Set(reviewedIds ?? []);
      }
    }

    const orders = rows
      .map((row) => mapOrderRow(row, user.id, reviewedOrderIds))
      .filter((row): row is UserTradingOrder => row !== null);

    return { success: true, data: orders };
  } catch (error) {
    console.error("[getUserTradingOrders]", error);
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

    return { success: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "確認完成時發生錯誤";
    console.error("[completeMemberOrder]", error);
    return { success: false, error: message };
  }
}
