import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook：
 * - `account.updated`：同步 connected account 的 charges_enabled / payouts_enabled 返
 *   kyc_records（fail-closed：兩者皆 true 先算 Stripe 就緒，可成為 transfer 收款方）。
 * - `payment_intent.succeeded`：B2C 商戶訂單全額入平台託管，pending_payment → payment_held；
 *   鑑定託管 member 訂單 payment → custody。
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
  rpc(
    fn: "rpc_mark_member_auth_order_paid",
    args: {
      p_order_id: string;
      p_payment_intent_id: string;
      p_amounts: Record<string, string>;
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

async function handleMemberAuthPaymentSucceeded(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = readMemberAuthOrderMetadata(paymentIntent);
  if (!parsed) {
    return { ok: true };
  }

  const { error } = await (admin as unknown as MarkPaidRpcClient).rpc(
    "rpc_mark_member_auth_order_paid",
    {
      p_order_id: parsed.orderId,
      p_payment_intent_id: paymentIntent.id,
      p_amounts: parsed.amounts,
    },
  );

  if (error) {
    console.error(
      "[stripe/webhook] rpc_mark_member_auth_order_paid",
      parsed.orderId,
      error.message,
    );
    return { ok: false, error: "member auth order settlement failed" };
  }

  return { ok: true };
}

async function handlePaymentIntentSucceeded(
  admin: AdminSupabaseClient,
  paymentIntent: Stripe.PaymentIntent,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const orderKind = paymentIntent.metadata?.order_kind?.trim();

  if (orderKind === "member_auth") {
    return handleMemberAuthPaymentSucceeded(admin, paymentIntent);
  }

  if (orderKind === "merchant") {
    return handleMerchantPaymentSucceeded(admin, paymentIntent);
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
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
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
