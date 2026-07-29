import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Stripe webhook（最小版）— 目前只處理 `account.updated`：
 * 將 connected account 的 charges_enabled / payouts_enabled 同步返
 * kyc_records（fail-closed：兩者皆 true 先算 Stripe 就緒，可成為 transfer 收款方）。
 *
 * 需要 env：STRIPE_WEBHOOK_SECRET（Stripe dashboard webhook endpoint 的 signing secret）。
 */
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
    if (event.type === "account.updated") {
      const account = event.data.object as Stripe.Account;

      const admin = createAdminClient();
      const { error } = await admin
        .from("kyc_records")
        .update({
          stripe_charges_enabled: account.charges_enabled === true,
          stripe_payouts_enabled: account.payouts_enabled === true,
        })
        .eq("stripe_account_id", account.id);

      if (error) {
        console.error("[stripe/webhook] kyc_records update", error.message);
        return NextResponse.json(
          { success: false, error: "db update failed" },
          { status: 500 },
        );
      }
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
