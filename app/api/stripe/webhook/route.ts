import { NextResponse } from "next/server";
import type Stripe from "stripe";
import {
  finalizeAuthFeeCaptureFromWebhook,
  isAuthFeeCapturePaymentIntent,
} from "@/lib/payments/auth-capture-saga";
import {
  finalizeGoodsCaptureFromWebhook,
  isGoodsCapturePaymentIntent,
} from "@/lib/payments/goods-capture-saga";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook：
 * - `account.updated`：同步 connected account 的 charges_enabled / payouts_enabled 返
 *   kyc_records（fail-closed：兩者皆 true 先算 Stripe 就緒，可成為 transfer 收款方）。
 * - `payment_intent.amount_capturable_updated`：鑑定訂單 authorize 成功 → authorized。
 * - `payment_intent.succeeded`：商戶非鑑定全額 capture；鑑定 partial auth_fee finalize。
 * - `payment_intent.canceled`：鑑定訂單 void 同步。
 * - `transfer.created`：補償確認 Merchant Connect 撥款，冪等完成 B2C 訂單。
 * - `refund.created`：補償確認鑑定失敗部分退款 finalize。
 * - `payment_intent.payment_failed`：只留痕，訂單維持 pending_payment 讓買家重試。
 *
 * 需要 env：STRIPE_WEBHOOK_SECRET（Stripe dashboard webhook endpoint 的 signing secret）。
 */

type AdminSupabaseClient = ReturnType<typeof createAdminClient>;

type MarkPaidRpcClient = {
  rpc(
    fn: "rpc_mark_merchant_order_paid",
    args: {
      p_order_id: string;
      p_payment_intent_id: string;
      p_amounts: Record<string, string>;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

type AuthOrderRpcClient = {
  rpc(
    fn: "rpc_mark_member_auth_order_authorized",
    args: {
      p_order_id: string;
      p_payment_intent_id: string;
      p_amounts: Record<string, string>;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_mark_merchant_order_authorized",
    args: {
      p_order_id: string;
      p_payment_intent_id: string;
      p_amounts: Record<string, string>;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_mark_auth_order_payment_voided",
    args: {
      p_order_kind: string;
      p_order_id: string;
      p_payment_intent_id: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

type MerchantPayoutRpcClient = {
  rpc(
    fn: "rpc_finalize_merchant_order_payout",
    args: {
      p_order_id: string;
      p_transfer_id: string;
      p_transfer_amount_cents: number;
      p_destination_account_id: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

type AuthRefundRpcClient = {
  rpc(
    fn: "rpc_finalize_auth_refund",
    args: {
      p_order_kind: string;
      p_order_id: string;
      p_refund_id: string;
      p_refund_amount_cents: number;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

function readMerchantOrderMetadata(
  paymentIntent: Stripe.PaymentIntent,
): { orderId: string; amounts: Record<string, string> } | null {
  const metadata = paymentIntent.metadata ?? {};
  if (metadata.order_kind !== "merchant") {
    return null;
  }

  const orderId = metadata.order_id?.trim();
  if (!orderId) {
    return null;
  }

  const amounts: Record<string, string> = {};
  for (const key of [
    "item_subtotal",
    "shipping_fee",
    "auth_fee",
    "total_amount",
    "shipping_method",
  ] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      amounts[key] = value.trim();
    }
  }

  return { orderId, amounts };
}

function readMemberAuthOrderMetadata(
  paymentIntent: Stripe.PaymentIntent,
): { orderId: string; amounts: Record<string, string> } | null {
  const metadata = paymentIntent.metadata ?? {};
  if (metadata.order_kind !== "member_auth") {
    return null;
  }

  const orderId = metadata.order_id?.trim();
  if (!orderId) {
    return null;
  }

  const amounts: Record<string, string> = {};
  for (const key of ["item_subtotal", "auth_fee", "total_amount"] as const) {
    const value = metadata[key];
    if (typeof value === "string" && value.trim()) {
      amounts[key] = value.trim();
    }
  }

  return { orderId, amounts };
}

async function handleAccountUpdated(
  admin: AdminSupabaseClient,
  account: Stripe.Account,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error } = await admin
    .from("kyc_records")
    .update({
      stripe_charges_enabled: account.charges_enabled === true,
      stripe_payouts_enabled: account.payouts_enabled === true,
    })
    .eq("stripe_account_id", account.id);

  if (error) {
    console.error("[stripe/webhook] kyc_records update", error.message);
    return { ok: false, error: "db update failed" };
  }

  return { ok: true };
}

async function handleMerchantPaymentSucceeded(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = readMerchantOrderMetadata(paymentIntent);
  if (!parsed) {
    // 非 B2C 商戶訂單（例如日後其他付款流程）— 直接放行，避免重試風暴。
    return { ok: true };
  }

  const { error } = await (admin as unknown as MarkPaidRpcClient).rpc(
    "rpc_mark_merchant_order_paid",
    {
      p_order_id: parsed.orderId,
      p_payment_intent_id: paymentIntent.id,
      p_amounts: parsed.amounts,
    },
  );

  if (error) {
    console.error(
      "[stripe/webhook] rpc_mark_merchant_order_paid",
      parsed.orderId,
      error.message,
    );
    return { ok: false, error: "order settlement failed" };
  }

  return { ok: true };
}

async function handleMemberAuthPaymentAuthorized(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = readMemberAuthOrderMetadata(paymentIntent);
  if (!parsed) {
    return { ok: true };
  }

  if (paymentIntent.status !== "requires_capture" || paymentIntent.amount_capturable <= 0) {
    return { ok: true };
  }

  const { error } = await (admin as unknown as AuthOrderRpcClient).rpc(
    "rpc_mark_member_auth_order_authorized",
    {
      p_order_id: parsed.orderId,
      p_payment_intent_id: paymentIntent.id,
      p_amounts: parsed.amounts,
    },
  );

  if (error) {
    console.error(
      "[stripe/webhook] rpc_mark_member_auth_order_authorized",
      parsed.orderId,
      error.message,
    );
    return { ok: false, error: "member auth order authorize failed" };
  }

  return { ok: true };
}

async function handleMerchantAuthPaymentAuthorized(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = readMerchantOrderMetadata(paymentIntent);
  if (!parsed) {
    return { ok: true };
  }

  if (paymentIntent.metadata?.capture_mode !== "manual") {
    return { ok: true };
  }

  if (paymentIntent.status !== "requires_capture" || paymentIntent.amount_capturable <= 0) {
    return { ok: true };
  }

  const { error } = await (admin as unknown as AuthOrderRpcClient).rpc(
    "rpc_mark_merchant_order_authorized",
    {
      p_order_id: parsed.orderId,
      p_payment_intent_id: paymentIntent.id,
      p_amounts: parsed.amounts,
    },
  );

  if (error) {
    console.error(
      "[stripe/webhook] rpc_mark_merchant_order_authorized",
      parsed.orderId,
      error.message,
    );
    return { ok: false, error: "merchant auth order authorize failed" };
  }

  return { ok: true };
}

async function handlePaymentIntentAmountCapturableUpdated(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const orderKind = paymentIntent.metadata?.order_kind?.trim();

  if (orderKind === "member_auth") {
    return handleMemberAuthPaymentAuthorized(admin, paymentIntent);
  }

  if (orderKind === "merchant") {
    return handleMerchantAuthPaymentAuthorized(admin, paymentIntent);
  }

  return { ok: true };
}

async function handleAuthFeeCaptureSucceeded(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
  orderKind: "member" | "merchant",
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await finalizeAuthFeeCaptureFromWebhook({
    orderKind,
    orderId,
    paymentIntent,
  });

  if (!result.ok) {
    console.error(
      "[stripe/webhook] rpc_finalize_auth_fee_capture",
      orderId,
      result.error,
    );
    return { ok: false, error: "auth fee capture finalize failed" };
  }

  return { ok: true };
}

async function handleGoodsCaptureSucceeded(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
  orderKind: "member" | "merchant",
  orderId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await finalizeGoodsCaptureFromWebhook({
    orderKind,
    orderId,
    paymentIntent,
  });

  if (!result.ok) {
    console.error(
      "[stripe/webhook] rpc_finalize_goods_capture",
      orderId,
      result.error,
    );
    return { ok: false, error: "goods capture finalize failed" };
  }

  return { ok: true };
}

async function handlePaymentIntentSucceeded(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const orderKind = paymentIntent.metadata?.order_kind?.trim();

  if (orderKind === "member_auth") {
    const parsed = readMemberAuthOrderMetadata(paymentIntent);
    if (!parsed) {
      return { ok: true };
    }

    if (isGoodsCapturePaymentIntent(paymentIntent)) {
      return handleGoodsCaptureSucceeded(
        admin,
        paymentIntent,
        "member",
        parsed.orderId,
      );
    }

    if (isAuthFeeCapturePaymentIntent(paymentIntent)) {
      return handleAuthFeeCaptureSucceeded(
        admin,
        paymentIntent,
        "member",
        parsed.orderId,
      );
    }

    return { ok: true };
  }

  if (orderKind === "merchant") {
    const parsed = readMerchantOrderMetadata(paymentIntent);
    if (!parsed) {
      return { ok: true };
    }

    if (paymentIntent.metadata?.capture_mode === "manual") {
      if (isGoodsCapturePaymentIntent(paymentIntent)) {
        return handleGoodsCaptureSucceeded(
          admin,
          paymentIntent,
          "merchant",
          parsed.orderId,
        );
      }

      if (isAuthFeeCapturePaymentIntent(paymentIntent)) {
        return handleAuthFeeCaptureSucceeded(
          admin,
          paymentIntent,
          "merchant",
          parsed.orderId,
        );
      }
      return { ok: true };
    }

    return handleMerchantPaymentSucceeded(admin, paymentIntent);
  }

  return { ok: true };
}

async function handlePaymentIntentCanceled(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const metadata = paymentIntent.metadata ?? {};
  const orderKind = metadata.order_kind?.trim();
  const orderId = metadata.order_id?.trim();

  if (!orderId) {
    return { ok: true };
  }

  if (orderKind === "member_auth") {
    const { error } = await (admin as unknown as AuthOrderRpcClient).rpc(
      "rpc_mark_auth_order_payment_voided",
      {
        p_order_kind: "member",
        p_order_id: orderId,
        p_payment_intent_id: paymentIntent.id,
      },
    );

    if (error) {
      console.error(
        "[stripe/webhook] rpc_mark_auth_order_payment_voided member",
        orderId,
        error.message,
      );
      return { ok: false, error: "member auth void sync failed" };
    }

    return { ok: true };
  }

  if (orderKind === "merchant" && metadata.capture_mode === "manual") {
    const { error } = await (admin as unknown as AuthOrderRpcClient).rpc(
      "rpc_mark_auth_order_payment_voided",
      {
        p_order_kind: "merchant",
        p_order_id: orderId,
        p_payment_intent_id: paymentIntent.id,
      },
    );

    if (error) {
      console.error(
        "[stripe/webhook] rpc_mark_auth_order_payment_voided merchant",
        orderId,
        error.message,
      );
      return { ok: false, error: "merchant auth void sync failed" };
    }
  }

  return { ok: true };
}

async function handleMerchantPayoutTransferCreated(
  admin: AdminSupabaseClient,
  transfer: Stripe.Transfer,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const metadata = transfer.metadata ?? {};
  if (metadata.order_kind !== "merchant_payout") {
    return { ok: true };
  }

  const orderId = metadata.order_id?.trim();
  const destination =
    typeof transfer.destination === "string"
      ? transfer.destination
      : transfer.destination?.id;
  if (!orderId || !destination) {
    return { ok: false, error: "invalid merchant payout transfer metadata" };
  }

  const { error } = await (admin as unknown as MerchantPayoutRpcClient).rpc(
    "rpc_finalize_merchant_order_payout",
    {
      p_order_id: orderId,
      p_transfer_id: transfer.id,
      p_transfer_amount_cents: transfer.amount,
      p_destination_account_id: destination,
    },
  );

  if (error) {
    console.error(
      "[stripe/webhook] rpc_finalize_merchant_order_payout",
      orderId,
      transfer.id,
      error.message,
    );
    return { ok: false, error: "merchant payout reconciliation failed" };
  }

  return { ok: true };
}

function readAuthGradingRefundMetadata(refund: Stripe.Refund): {
  orderKind: "member" | "merchant";
  orderId: string;
} | null {
  const metadata = refund.metadata ?? {};
  const rawKind = metadata.order_kind?.trim();
  const orderId = metadata.order_id?.trim();
  if (!orderId) {
    return null;
  }

  if (rawKind === "auth_grading_member") {
    return { orderKind: "member", orderId };
  }
  if (rawKind === "auth_grading_merchant") {
    return { orderKind: "merchant", orderId };
  }

  return null;
}

async function handleAuthGradingRefundCreated(
  admin: AdminSupabaseClient,
  refund: Stripe.Refund,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = readAuthGradingRefundMetadata(refund);
  if (!parsed) {
    return { ok: true };
  }

  const { error } = await (admin as unknown as AuthRefundRpcClient).rpc(
    "rpc_finalize_auth_refund",
    {
      p_order_kind: parsed.orderKind,
      p_order_id: parsed.orderId,
      p_refund_id: refund.id,
      p_refund_amount_cents: refund.amount,
    },
  );

  if (error) {
    console.error(
      "[stripe/webhook] rpc_finalize_auth_refund",
      parsed.orderId,
      error.message,
    );
    return { ok: false, error: "auth refund finalize failed" };
  }

  return { ok: true };
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { success: false, error: "webhook not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { success: false, error: "missing signature" },
      { status: 400 },
    );
  }

  let event: Stripe.Event;
  try {
    const rawBody = await request.text();
    event = await stripe.webhooks.constructEventAsync(
      rawBody,
      signature,
      webhookSecret,
    );
  } catch (error) {
    console.error("[stripe/webhook] signature verification failed", error);
    return NextResponse.json(
      { success: false, error: "invalid signature" },
      { status: 400 },
    );
  }

  try {
    switch (event.type) {
      case "account.updated": {
        const result = await handleAccountUpdated(
          createAdminClient(),
          event.data.object as Stripe.Account,
        );
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
          );
        }
        break;
      }

      case "payment_intent.amount_capturable_updated": {
        const result = await handlePaymentIntentAmountCapturableUpdated(
          createAdminClient(),
          event.data.object as Stripe.PaymentIntent,
        );
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
          );
        }
        break;
      }

      case "payment_intent.succeeded": {
        const result = await handlePaymentIntentSucceeded(
          createAdminClient(),
          event.data.object as Stripe.PaymentIntent,
        );
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
          );
        }
        break;
      }

      case "payment_intent.canceled": {
        const result = await handlePaymentIntentCanceled(
          createAdminClient(),
          event.data.object as Stripe.PaymentIntent,
        );
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
          );
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.warn(
          "[stripe/webhook] payment_intent.payment_failed",
          paymentIntent.id,
          paymentIntent.metadata?.order_id ?? "",
          paymentIntent.last_payment_error?.message ?? "",
        );
        break;
      }

      case "transfer.created": {
        const result = await handleMerchantPayoutTransferCreated(
          createAdminClient(),
          event.data.object as Stripe.Transfer,
        );
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
          );
        }
        break;
      }

      case "refund.created": {
        const result = await handleAuthGradingRefundCreated(
          createAdminClient(),
          event.data.object as Stripe.Refund,
        );
        if (!result.ok) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 500 },
          );
        }
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[stripe/webhook]", error);
    return NextResponse.json(
      { success: false, error: "webhook handler failed" },
      { status: 500 },
    );
  }
}
