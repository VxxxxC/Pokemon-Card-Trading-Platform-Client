"use server";

import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { resolveOfferCardDisplayImage } from "@/app/lib/chat/offerCardImage";
import { formatTradeGradeLabel } from "@/lib/marketplace/listing-display";
import {
  isMerchantShippingMethod,
  type MerchantShippingMethod,
} from "@/lib/merchant-checkout/pricing";
import { resolveMerchantOrderIdForBuyer } from "@/lib/merchant-order/resolve-order-id";
import { AUTH_ESCROW_PAYMENT_METHOD_OPTIONS } from "@/lib/payments/escrow-payment-intent";
import { getStripeClient, getStripePublishableKey } from "@/lib/stripe/env";
import { isMerchantPayoutReady } from "@/lib/stripe/payout-ready";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

type MerchantEscrowStatus = Tables<"merchant_orders">["escrow_status"];

export type MerchantCheckoutOrder = {
  orderId: string;
  orderNumber: string | null;
  escrowStatus: MerchantEscrowStatus;
  isPayable: boolean;
  itemSubtotal: number;
  shippingFee: number;
  authFee: number;
  totalAmount: number;
  shippingMethod: MerchantShippingMethod | null;
  requiresAuthentication: boolean;
  listingAcceptsAuthentication: boolean;
  merchant: {
    id: string;
    shopName: string;
    shopHandle: string | null;
  };
  product: {
    cardName: string;
    cardNumber: string | null;
    setCode: string;
    displayId: string | null;
    gradeLabel: string;
    imageUrl: string;
  };
};

export type MerchantCheckoutPaymentIntent = {
  orderId: string;
  clientSecret: string;
  publishableKey: string;
  itemSubtotal: number;
  shippingFee: number;
  authFee: number;
  totalAmount: number;
};

export type MerchantCheckoutPaymentStatus = {
  orderId: string;
  orderNumber: string | null;
  escrowStatus: MerchantEscrowStatus;
  totalAmount: number;
  paidAt: string | null;
  paymentCaptureStatus: string | null;
};

type CheckoutOrderQueryRow = Pick<
  Tables<"merchant_orders">,
  | "id"
  | "order_number"
  | "buyer_id"
  | "merchant_id"
  | "listing_id"
  | "final_price"
  | "item_subtotal"
  | "shipping_fee"
  | "auth_fee"
  | "shipping_method"
  | "total_amount"
  | "paid_at"
  | "escrow_status"
  | "requires_authentication"
  | "stripe_payment_intent_id"
  | "payment_capture_status"
> & {
  listings: {
    grading_company: string;
    grading_score: string | null;
    images: unknown;
    use_authentication: boolean;
    product_catalog: {
      name_ja: string;
      name_zh: string | null;
      name_en: string | null;
      card_number: string | null;
      set_code: string;
      display_id: string | null;
      image_url: string;
    } | null;
  } | null;
};

const CHECKOUT_ORDER_SELECT = `
  id,
  order_number,
  buyer_id,
  merchant_id,
  listing_id,
  final_price,
  item_subtotal,
  shipping_fee,
  auth_fee,
  shipping_method,
  total_amount,
  paid_at,
  escrow_status,
  requires_authentication,
  stripe_payment_intent_id,
  payment_capture_status,
  listings (
    grading_company,
    grading_score,
    images,
    use_authentication,
    product_catalog (
      name_ja,
      name_zh,
      name_en,
      card_number,
      set_code,
      display_id,
      image_url
    )
  )
`;

export type BuyNowMerchantListingPayload = {
  orderId: string;
  orderNumber: string | null;
  checkoutHref: string;
};

type PrepareMerchantOrderPaymentPayload = {
  order_id: string;
  merchant_id: string;
  item_subtotal: number;
  shipping_fee: number;
  auth_fee: number;
  total_amount: number;
  shipping_method: string;
  stripe_payment_intent_id: string | null;
};

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>;

type CheckoutRpcClient = {
  rpc(
    fn: "rpc_buy_now_merchant_listing",
    args: {
      p_listing_id: string;
      p_buyer_id: string;
      p_use_auth: boolean;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_prepare_merchant_order_payment",
    args: {
      p_order_id: string;
      p_shipping_method: string;
      p_use_auth: boolean;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_attach_merchant_order_payment_intent",
    args: { p_order_id: string; p_payment_intent_id: string },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

function asCheckoutRpcClient(
  supabase: ServerSupabaseClient,
): CheckoutRpcClient {
  return supabase as unknown as CheckoutRpcClient;
}

function displayCardName(catalog: {
  name_ja: string;
  name_zh: string | null;
  name_en: string | null;
}): string {
  return (
    catalog.name_zh?.trim() ||
    catalog.name_en?.trim() ||
    catalog.name_ja?.trim() ||
    "未知商品"
  );
}

function parsePreparePayload(
  data: unknown,
): PrepareMerchantOrderPaymentPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  if (
    typeof payload.order_id !== "string" ||
    typeof payload.merchant_id !== "string" ||
    typeof payload.shipping_method !== "string"
  ) {
    return null;
  }

  return {
    order_id: payload.order_id,
    merchant_id: payload.merchant_id,
    item_subtotal: Number(payload.item_subtotal ?? 0),
    shipping_fee: Number(payload.shipping_fee ?? 0),
    auth_fee: Number(payload.auth_fee ?? 0),
    total_amount: Number(payload.total_amount ?? 0),
    shipping_method: payload.shipping_method,
    stripe_payment_intent_id:
      typeof payload.stripe_payment_intent_id === "string"
        ? payload.stripe_payment_intent_id
        : null,
  };
}

function toShippingMethod(
  value: string | null,
): MerchantShippingMethod | null {
  return isMerchantShippingMethod(value) ? value : null;
}

async function loadCheckoutRow(
  supabase: ServerSupabaseClient,
  orderIdOrNumber: string,
  buyerId: string,
): Promise<ActionResult<CheckoutOrderQueryRow>> {
  const resolved = await resolveMerchantOrderIdForBuyer(
    supabase,
    orderIdOrNumber,
    buyerId,
  );

  if (!resolved.ok) {
    return { success: false, error: resolved.error };
  }

  const { data, error } = await supabase
    .from("merchant_orders")
    .select(CHECKOUT_ORDER_SELECT)
    .eq("id", resolved.id)
    .eq("buyer_id", buyerId)
    .maybeSingle<CheckoutOrderQueryRow>();

  if (error) {
    console.error("[loadCheckoutRow]", error.message);
    return { success: false, error: "無法載入訂單資料" };
  }

  if (!data) {
    return { success: false, error: "找不到指定的交易訂單記錄" };
  }

  return { success: true, data };
}

/** @deprecated 請改用 `buyNowListing`；保留相容舊 import。 */
export async function buyNowMerchantListing(
  listingId: string,
  useAuth = false,
): Promise<ActionResult<BuyNowMerchantListingPayload>> {
  const { buyNowListing } = await import("@/app/actions/buy-now");
  const result = await buyNowListing(listingId, useAuth);
  if (!result.success) {
    return result;
  }
  if (result.data.orderKind !== "merchant") {
    return { success: false, error: "此商品非認證商戶掛售" };
  }
  return {
    success: true,
    data: {
      orderId: result.data.orderId,
      orderNumber: result.data.orderNumber,
      checkoutHref: result.data.checkoutHref ?? `/checkout/${result.data.orderId}`,
    },
  };
}

/** 買家結帳頁所需的訂單快照（含金額預覽與商品資料）。 */
export async function loadMerchantCheckoutOrder(
  orderIdOrNumber: string,
): Promise<ActionResult<MerchantCheckoutOrder>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入後再結帳" };
    }

    const rowResult = await loadCheckoutRow(
      supabase,
      orderIdOrNumber,
      user.id,
    );
    if (!rowResult.success) {
      return rowResult;
    }

    const row = rowResult.data;
    const catalog = row.listings?.product_catalog;

    const { data: shop } = await supabase
      .from("merchant_shops")
      .select("shop_name, shop_handle")
      .eq("merchant_id", row.merchant_id)
      .maybeSingle<Pick<Tables<"merchant_shops">, "shop_name" | "shop_handle">>();

    const itemSubtotal = Number(row.item_subtotal ?? row.final_price);

    return {
      success: true,
      data: {
        orderId: row.id,
        orderNumber: row.order_number,
        escrowStatus: row.escrow_status,
        isPayable: row.escrow_status === "pending_payment",
        itemSubtotal,
        shippingFee: Number(row.shipping_fee ?? 0),
        authFee: Number(row.auth_fee ?? 0),
        totalAmount: Number(row.total_amount ?? itemSubtotal),
        shippingMethod: toShippingMethod(row.shipping_method),
        requiresAuthentication: Boolean(row.requires_authentication),
        listingAcceptsAuthentication: Boolean(
          row.listings?.use_authentication,
        ),
        merchant: {
          id: row.merchant_id,
          shopName: shop?.shop_name?.trim() || "認證商戶",
          shopHandle: shop?.shop_handle?.trim() || null,
        },
        product: {
          cardName: catalog ? displayCardName(catalog) : "未知商品",
          cardNumber: catalog?.card_number ?? null,
          setCode: catalog?.set_code ?? "",
          displayId: catalog?.display_id ?? null,
          gradeLabel: formatTradeGradeLabel(
            row.listings?.grading_company ?? "",
            row.listings?.grading_score ?? null,
          ),
          imageUrl: resolveOfferCardDisplayImage(
            row.listings?.images,
            catalog?.image_url,
          ),
        },
      },
    };
  } catch (error) {
    console.error("[loadMerchantCheckoutOrder]", error);
    return { success: false, error: "載入結帳資料時發生錯誤" };
  }
}

/**
 * 建立（或重用）全額 PaymentIntent。
 *
 * 資金 100% 收入平台 Stripe 帳戶託管，刻意不帶 `application_fee_amount` /
 * `transfer_data` —— 撥款給商戶與平台佣金於訂單完成階段（Milestone 2）另行 transfer。
 */
export async function createMerchantOrderPaymentIntent(
  orderIdOrNumber: string,
  options: { shippingMethod: string; useAuth: boolean },
): Promise<ActionResult<MerchantCheckoutPaymentIntent>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  if (!isMerchantShippingMethod(options.shippingMethod)) {
    return { success: false, error: "請選擇有效的配送方式" };
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

    const rowResult = await loadCheckoutRow(
      supabase,
      orderIdOrNumber,
      user.id,
    );
    if (!rowResult.success) {
      return rowResult;
    }

    const row = rowResult.data;

    if (row.escrow_status !== "pending_payment") {
      return { success: false, error: "此訂單並非待付款狀態，無法重複付款" };
    }

    // Fail-closed：商戶未完成 KYC / Stripe Connect 就緒前不可收款，否則無法撥款。
    const { data: kyc, error: kycError } = await supabase
      .from("kyc_records")
      .select(
        "kyc_status, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled",
      )
      .eq("merchant_id", row.merchant_id)
      .maybeSingle();

    if (kycError) {
      console.error(
        "[createMerchantOrderPaymentIntent] kyc lookup",
        kycError.message,
      );
      return { success: false, error: "無法驗證商戶收款資格" };
    }

    if (!isMerchantPayoutReady(kyc)) {
      return {
        success: false,
        error: "此商戶尚未完成收款設定，暫時無法付款，請聯絡客服",
      };
    }

    const { data: prepareData, error: prepareError } = await asCheckoutRpcClient(
      supabase,
    ).rpc("rpc_prepare_merchant_order_payment", {
      p_order_id: row.id,
      p_shipping_method: options.shippingMethod,
      p_use_auth: options.useAuth,
    });

    if (prepareError) {
      console.error(
        "[createMerchantOrderPaymentIntent] prepare",
        prepareError.message,
      );
      return { success: false, error: prepareError.message };
    }

    const prepared = parsePreparePayload(prepareData);
    if (!prepared) {
      console.error(
        "[createMerchantOrderPaymentIntent] invalid prepare payload",
        prepareData,
      );
      return { success: false, error: "結帳金額計算失敗，請重試" };
    }

    const amountInCents = Math.round(prepared.total_amount * 100);
    if (!Number.isFinite(amountInCents) || amountInCents <= 0) {
      return { success: false, error: "訂單金額異常，請聯絡客服" };
    }

    const captureMethod = options.useAuth ? "manual" : "automatic";

    const metadata: Stripe.MetadataParam = {
      order_kind: "merchant",
      ...(options.useAuth ? { capture_mode: "manual" } : {}),
      order_id: prepared.order_id,
      order_number: row.order_number ?? "",
      buyer_id: user.id,
      merchant_id: prepared.merchant_id,
      listing_id: row.listing_id,
      item_subtotal: String(prepared.item_subtotal),
      shipping_fee: String(prepared.shipping_fee),
      auth_fee: String(prepared.auth_fee),
      total_amount: String(prepared.total_amount),
      shipping_method: prepared.shipping_method,
    };

    let paymentIntent: Stripe.PaymentIntent | null = null;

    if (prepared.stripe_payment_intent_id) {
      const existing = await stripe.paymentIntents.retrieve(
        prepared.stripe_payment_intent_id,
      );

      if (existing.status === "succeeded" || existing.status === "processing") {
        return {
          success: false,
          error: "此訂單已在付款處理中，請稍候或重新載入訂單狀態",
        };
      }

      if (existing.status === "requires_capture") {
        paymentIntent = existing;
      } else if (existing.status !== "canceled") {
        paymentIntent = await stripe.paymentIntents.update(existing.id, {
          amount: amountInCents,
          metadata,
          capture_method: captureMethod,
          ...(options.useAuth
            ? { payment_method_options: AUTH_ESCROW_PAYMENT_METHOD_OPTIONS }
            : {}),
        });
      }
    }

    if (!paymentIntent) {
      paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "hkd",
        capture_method: captureMethod,
        automatic_payment_methods: { enabled: true },
        metadata,
        ...(options.useAuth
          ? { payment_method_options: AUTH_ESCROW_PAYMENT_METHOD_OPTIONS }
          : {}),
      });
    }

    const { error: attachError } = await asCheckoutRpcClient(supabase).rpc(
      "rpc_attach_merchant_order_payment_intent",
      {
        p_order_id: prepared.order_id,
        p_payment_intent_id: paymentIntent.id,
      },
    );

    if (attachError) {
      console.error(
        "[createMerchantOrderPaymentIntent] attach",
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
        shippingFee: prepared.shipping_fee,
        authFee: prepared.auth_fee,
        totalAmount: prepared.total_amount,
      },
    };
  } catch (error) {
    console.error("[createMerchantOrderPaymentIntent]", error);
    const message =
      error instanceof Error ? error.message : "建立付款時發生錯誤";
    return { success: false, error: message };
  }
}

/**
 * 付款回跳頁輪詢用：webhook 為非同步，前端需自行確認託管是否已鎖定。
 */
export async function getMerchantCheckoutPaymentStatus(
  orderIdOrNumber: string,
): Promise<ActionResult<MerchantCheckoutPaymentStatus>> {
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

    const rowResult = await loadCheckoutRow(
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
        totalAmount: Number(row.total_amount ?? row.final_price),
        paidAt: row.paid_at,
        paymentCaptureStatus: row.payment_capture_status ?? null,
      },
    };
  } catch (error) {
    console.error("[getMerchantCheckoutPaymentStatus]", error);
    return { success: false, error: "查詢付款狀態時發生錯誤" };
  }
}
