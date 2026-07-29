"use server";

import type Stripe from "stripe";
import { getMemberAuthOrderActions } from "@/app/lib/member-order/auth-escrow";
import { calculateMemberAuthPaymentTotal } from "@/lib/payments/member-auth-payment";
import { resolveMemberOrderIdForUser } from "@/lib/member-order/resolve-order-id";
import { getStripeClient, getStripePublishableKey } from "@/lib/stripe/env";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";
import type { MemberEscrowStatus } from "@/app/lib/member-order/auth-escrow";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type MemberAuthCheckoutOrder = {
  orderId: string;
  orderNumber: string | null;
  escrowStatus: MemberEscrowStatus | null;
  isPayable: boolean;
  canPay: boolean;
  itemSubtotal: number;
  authFee: number;
  totalAmount: number;
  paymentAmount: number;
  useAuthentication: boolean;
};

export type MemberAuthCheckoutPaymentIntent = {
  orderId: string;
  clientSecret: string;
  publishableKey: string;
  itemSubtotal: number;
  authFee: number;
  totalAmount: number;
};

export type MemberAuthPaymentStatus = {
  orderId: string;
  orderNumber: string | null;
  escrowStatus: MemberEscrowStatus | null;
  paymentConfirmedAt: string | null;
  totalAmount: number;
};

type MemberAuthCheckoutRow = Pick<
  Tables<"member_orders">,
  | "id"
  | "order_number"
  | "buyer_id"
  | "seller_id"
  | "listing_id"
  | "final_price"
  | "item_subtotal"
  | "auth_fee"
  | "total_amount"
  | "escrow_status"
  | "use_authentication"
  | "status"
  | "payment_confirmed_at"
  | "stripe_payment_intent_id"
>;

type PrepareMemberAuthPaymentPayload = {
  order_id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  item_subtotal: number;
  auth_fee: number;
  total_amount: number;
  stripe_payment_intent_id: string | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type MemberAuthCheckoutRpcClient = {
  rpc(
    fn: "rpc_prepare_member_auth_order_payment",
    args: { p_order_id: string },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_attach_member_auth_order_payment_intent",
    args: { p_order_id: string; p_payment_intent_id: string },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

const MEMBER_AUTH_CHECKOUT_SELECT = `
  id,
  order_number,
  buyer_id,
  seller_id,
  listing_id,
  final_price,
  item_subtotal,
  auth_fee,
  total_amount,
  escrow_status,
  use_authentication,
  status,
  payment_confirmed_at,
  stripe_payment_intent_id
`;

function asMemberAuthCheckoutRpcClient(
  supabase: ServerSupabaseClient,
): MemberAuthCheckoutRpcClient {
  return supabase as unknown as MemberAuthCheckoutRpcClient;
}

function parsePreparePayload(data: unknown): PrepareMemberAuthPaymentPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  if (
    typeof payload.order_id !== "string" ||
    typeof payload.buyer_id !== "string" ||
    typeof payload.seller_id !== "string" ||
    typeof payload.listing_id !== "string"
  ) {
    return null;
  }

  return {
    order_id: payload.order_id,
    buyer_id: payload.buyer_id,
    seller_id: payload.seller_id,
    listing_id: payload.listing_id,
    item_subtotal: Number(payload.item_subtotal ?? 0),
    auth_fee: Number(payload.auth_fee ?? 0),
    total_amount: Number(payload.total_amount ?? 0),
    stripe_payment_intent_id:
      typeof payload.stripe_payment_intent_id === "string"
        ? payload.stripe_payment_intent_id
        : null,
  };
}

async function loadMemberAuthCheckoutRow(
  supabase: ServerSupabaseClient,
  orderIdOrNumber: string,
  userId: string,
): Promise<ActionResult<MemberAuthCheckoutRow>> {
  const resolved = await resolveMemberOrderIdForUser(
    supabase,
    orderIdOrNumber,
    userId,
  );

  if (!resolved.ok) {
    return { success: false, error: resolved.error };
  }

  const { data, error } = await supabase
    .from("member_orders")
    .select(MEMBER_AUTH_CHECKOUT_SELECT)
    .eq("id", resolved.id)
    .maybeSingle<MemberAuthCheckoutRow>();

  if (error) {
    console.error("[loadMemberAuthCheckoutRow]", error.message);
    return { success: false, error: "無法載入訂單資料" };
  }

  if (!data) {
    return { success: false, error: "找不到指定的交易訂單記錄" };
  }

  if (data.buyer_id !== userId && data.seller_id !== userId) {
    return { success: false, error: "您沒有權限查閱此訂單" };
  }

  return { success: true, data };
}

function mapCheckoutSnapshot(
  row: MemberAuthCheckoutRow,
  viewerId: string,
): MemberAuthCheckoutOrder {
  const isBuyer = row.buyer_id === viewerId;
  const itemSubtotal = Number(row.item_subtotal ?? row.final_price);
  const authFee = Number(row.auth_fee ?? 0);
  const totalAmount = Number(
    row.total_amount ?? calculateMemberAuthPaymentTotal(itemSubtotal),
  );
  const authActions = getMemberAuthOrderActions({
    persona: isBuyer ? "buy" : "sell",
    useAuthentication: row.use_authentication,
    escrowStatus: row.escrow_status,
    status: row.status,
  });

  const isPayable =
    Boolean(row.use_authentication) &&
    row.escrow_status === "payment" &&
    row.payment_confirmed_at == null &&
    row.status === "pending";

  return {
    orderId: row.id,
    orderNumber: row.order_number,
    escrowStatus: row.escrow_status,
    isPayable,
    canPay: isBuyer && authActions.canPay && row.payment_confirmed_at == null,
    itemSubtotal,
    authFee,
    totalAmount,
    paymentAmount: totalAmount,
    useAuthentication: row.use_authentication,
  };
}

/** 鑑定託管訂單付款快照（買家 / 賣家可讀）。 */
export async function loadMemberAuthCheckoutOrder(
  orderIdOrNumber: string,
): Promise<ActionResult<MemberAuthCheckoutOrder>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再查詢訂單" };
    }

    const rowResult = await loadMemberAuthCheckoutRow(
      supabase,
      orderIdOrNumber,
      user.id,
    );
    if (!rowResult.success) {
      return rowResult;
    }

    return {
      success: true,
      data: mapCheckoutSnapshot(rowResult.data, user.id),
    };
  } catch (error) {
    console.error("[loadMemberAuthCheckoutOrder]", error);
    return { success: false, error: "載入訂單資料時發生錯誤" };
  }
}

/**
 * 建立（或重用）鑑定託管 PaymentIntent — 資金 100% 入平台 Stripe 帳戶。
 */
export async function createMemberAuthPaymentIntent(
  orderIdOrNumber: string,
): Promise<ActionResult<MemberAuthCheckoutPaymentIntent>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  const publishableKey = getStripePublishableKey();
  const stripe = await getStripeClient();
  if (!stripe || !publishableKey) {
    return { success: false, error: "付款服務尚未設定，請稍後再試" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再付款" };
    }

    const rowResult = await loadMemberAuthCheckoutRow(
      supabase,
      orderIdOrNumber,
      user.id,
    );
    if (!rowResult.success) {
      return rowResult;
    }

    const row = rowResult.data;

    if (row.buyer_id !== user.id) {
      return { success: false, error: "僅買家本人可完成此筆託管付款" };
    }

    if (!row.use_authentication) {
      return { success: false, error: "此訂單非鑑定託管流程" };
    }

    if (row.escrow_status !== "payment" || row.payment_confirmed_at != null) {
      return { success: false, error: "此訂單並非待付款狀態，無法重複付款" };
    }

    const { data: prepareData, error: prepareError } =
      await asMemberAuthCheckoutRpcClient(supabase).rpc(
        "rpc_prepare_member_auth_order_payment",
        { p_order_id: row.id },
      );

    if (prepareError) {
      console.error(
        "[createMemberAuthPaymentIntent] prepare",
        prepareError.message,
      );
      return { success: false, error: prepareError.message };
    }

    const prepared = parsePreparePayload(prepareData);
    if (!prepared) {
      console.error(
        "[createMemberAuthPaymentIntent] invalid prepare payload",
        prepareData,
      );
      return { success: false, error: "結帳金額計算失敗，請重試" };
    }

    const amountInCents = Math.round(prepared.total_amount * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return { success: false, error: "訂單金額異常，請聯絡客服" };
    }

    const metadata: Stripe.MetadataParam = {
      order_kind: "member_auth",
      order_id: prepared.order_id,
      order_number: row.order_number ?? "",
      buyer_id: user.id,
      seller_id: prepared.seller_id,
      listing_id: prepared.listing_id,
      item_subtotal: String(prepared.item_subtotal),
      auth_fee: String(prepared.auth_fee),
      total_amount: String(prepared.total_amount),
    };

    let paymentIntent: Stripe.PaymentIntent | null = null;

    if (prepared.stripe_payment_intent_id) {
      try {
        const existing = await stripe.paymentIntents.retrieve(
          prepared.stripe_payment_intent_id,
        );

        if (
          existing.status === "succeeded" ||
          existing.status === "processing"
        ) {
          return {
            success: false,
            error: "此訂單已在付款處理中，請稍候或重新載入訂單狀態",
          };
        }

        if (existing.status !== "canceled") {
          paymentIntent = await stripe.paymentIntents.update(existing.id, {
            amount: amountInCents,
            metadata,
          });
        }
      } catch (retrieveError) {
        const stripeCode =
          typeof retrieveError === "object" &&
          retrieveError !== null &&
          "code" in retrieveError
            ? String((retrieveError as { code?: string }).code)
            : null;
        if (stripeCode !== "resource_missing") {
          throw retrieveError;
        }
      }
    }

    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "hkd",
        capture_method: "automatic",
        automatic_payment_methods: { enabled: true },
        metadata,
      });
    }

    const { error: attachError } = await asMemberAuthCheckoutRpcClient(
      supabase,
    ).rpc("rpc_attach_member_auth_order_payment_intent", {
      p_order_id: prepared.order_id,
      p_payment_intent_id: paymentIntent.id,
    });

    if (attachError) {
      console.error(
        "[createMemberAuthPaymentIntent] attach",
        attachError.message,
      );
      return { success: false, error: attachError.message };
    }

    if (!paymentIntent.client_secret) {
      return { success: false, error: "無法取得付款憑證，請重試" };
    }

    return {
      success: true,
      data: {
        orderId: prepared.order_id,
        clientSecret: paymentIntent.client_secret,
        publishableKey,
        itemSubtotal: prepared.item_subtotal,
        authFee: prepared.auth_fee,
        totalAmount: prepared.total_amount,
      },
    };
  } catch (error) {
    console.error("[createMemberAuthPaymentIntent]", error);
    const message =
      error instanceof Error ? error.message : "建立付款時發生錯誤";
    return { success: false, error: message };
  }
}

/** 付款後輪詢：webhook 非同步，確認是否已進入 custody。 */
export async function getMemberAuthPaymentStatus(
  orderIdOrNumber: string,
): Promise<ActionResult<MemberAuthPaymentStatus>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再查詢訂單" };
    }

    const rowResult = await loadMemberAuthCheckoutRow(
      supabase,
      orderIdOrNumber,
      user.id,
    );
    if (!rowResult.success) {
      return rowResult;
    }

    const row = rowResult.data;

    return {
      success: true,
      data: {
        orderId: row.id,
        orderNumber: row.order_number,
        escrowStatus: row.escrow_status,
        paymentConfirmedAt: row.payment_confirmed_at,
        totalAmount: Number(
          row.total_amount ?? calculateMemberAuthPaymentTotal(Number(row.final_price)),
        ),
      },
    };
  } catch (error) {
    console.error("[getMemberAuthPaymentStatus]", error);
    return { success: false, error: "查詢付款狀態時發生錯誤" };
  }
}

/** Client 判斷是否應顯示 Stripe Payment Element（非 secret，僅 publishable key）。 */
export async function isMemberAuthStripePaymentAvailable(): Promise<boolean> {
  return Boolean(getStripePublishableKey());
}
