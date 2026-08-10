import Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { createServiceRoleClient } from "../../shared/supabase-admin";
import {
  ensureMemberListingAcceptsAuthentication,
  findMemberListingForIntegration,
  seedPendingMemberAuthOrders,
} from "../../rewards/helpers/checkout-fixture";
import { getBuyerUserId } from "../../shared/auth-context";

export type GradingFailStripeSmokeContext = {
  orderId: string;
  paymentIntentId: string;
  authFeeCents: number;
  buyerTotalCents: number;
};

export type PrepareGradingFailPayload = {
  success?: boolean;
  void_mode?: string;
  capture_cents?: number;
  payment_intent_id?: string;
  admin_id?: string;
  escrow_capture_model?: string;
};

function createStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY for grading Stripe smoke");
  }

  return new Stripe(secretKey, {
    apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
  });
}

export async function seedGradingFailStripeSmokeOrder(): Promise<GradingFailStripeSmokeContext> {
  const listing = await findMemberListingForIntegration();
  await ensureMemberListingAcceptsAuthentication(listing.listingId);

  const buyerId = getBuyerUserId();
  const [orderId] = await seedPendingMemberAuthOrders(
    buyerId,
    listing.listingId,
    1,
  );

  const admin = createServiceRoleClient();
  const { data: existing, error: readError } = await admin
    .from("member_orders")
    .select("final_price, item_subtotal, auth_fee")
    .eq("id", orderId)
    .maybeSingle();

  if (readError || !existing) {
    throw new Error(
      `[seedGradingFailStripeSmokeOrder] read: ${readError?.message ?? "missing order"}`,
    );
  }

  const itemSubtotal = Number(existing.item_subtotal ?? existing.final_price ?? 0);
  const authFee = Number(existing.auth_fee) > 0 ? Number(existing.auth_fee) : 150;
  const inbound = 30;
  const outbound = 30;
  const buyerTotal = itemSubtotal + authFee + inbound + outbound;
  const buyerTotalCents = Math.round(buyerTotal * 100);
  const authFeeCents = Math.round(authFee * 100);

  const stripe = createStripeClient();
  const paymentIntent = await stripe.paymentIntents.create({
    amount: buyerTotalCents,
    currency: "hkd",
    capture_method: "manual",
    automatic_payment_methods: {
      enabled: true,
      allow_redirects: "never",
    },
    payment_method_options: {
      card: {
        request_multicapture: "if_available",
      },
    },
    payment_method: "pm_card_visa",
    confirm: true,
    metadata: {
      order_kind: "member_auth",
      order_id: orderId,
      integration_smoke: "grading_fail_stripe",
    },
  });

  if (paymentIntent.status !== "requires_capture") {
    throw new Error(
      `[seedGradingFailStripeSmokeOrder] expected requires_capture, got ${paymentIntent.status}`,
    );
  }

  const { error: authError } = await admin.rpc(
    "rpc_mark_member_auth_order_authorized",
    {
      p_order_id: orderId,
      p_payment_intent_id: paymentIntent.id,
      p_amounts: {
        item_subtotal: itemSubtotal,
        auth_fee: authFee,
        inbound_shipping_fee: inbound,
        outbound_shipping_fee: outbound,
        total_amount: buyerTotal,
        buyer_total_amount: buyerTotal,
        platform_subsidy_amount: 0,
      },
    },
  );

  if (authError) {
    throw new Error(`[seedGradingFailStripeSmokeOrder] authorize: ${authError.message}`);
  }

  const { error: gradingError } = await admin
    .from("member_orders")
    .update({
      escrow_status: "grading",
      platform_received_at: new Date().toISOString(),
      inbound_tracking_no: `SF-STRIPE-${orderId.slice(0, 8)}`,
      payment_capture_status: "authorized",
      escrow_capture_model: "single",
      refund_status: "none",
      refund_error: null,
      auth_result: null,
      fault_party: null,
      item_subtotal: itemSubtotal,
      auth_fee: authFee,
      inbound_shipping_fee: inbound,
      outbound_shipping_fee: outbound,
      total_amount: buyerTotal,
      buyer_total_amount: buyerTotal,
    })
    .eq("id", orderId);

  if (gradingError) {
    throw new Error(`[seedGradingFailStripeSmokeOrder] grading: ${gradingError.message}`);
  }

  return {
    orderId,
    paymentIntentId: paymentIntent.id,
    authFeeCents,
    buyerTotalCents,
  };
}

export async function prepareAuthGradingFail(
  client: SupabaseClient<Database>,
  params: {
    orderId: string;
    faultParty: "buyer" | "seller";
    reason: string;
  },
): Promise<PrepareGradingFailPayload> {
  const { data, error } = await client.rpc("rpc_prepare_auth_grading_fail", {
    p_order_kind: "member",
    p_order_id: params.orderId,
    p_fault_party: params.faultParty,
    p_reason: params.reason,
  });

  if (error) {
    throw new Error(`[prepareAuthGradingFail] ${error.message}`);
  }

  return data as PrepareGradingFailPayload;
}

export async function finalizeAuthGradingFail(
  client: SupabaseClient<Database>,
  params: { orderId: string; paymentIntentId: string },
): Promise<void> {
  const { error } = await client.rpc("rpc_finalize_auth_grading_fail", {
    p_order_kind: "member",
    p_order_id: params.orderId,
    p_payment_intent_id: params.paymentIntentId,
  });

  if (error) {
    throw new Error(`[finalizeAuthGradingFail] ${error.message}`);
  }
}

export async function executeGradingFailStripeLeg(
  prepared: PrepareGradingFailPayload,
  orderId: string,
): Promise<void> {
  const voidMode = prepared.void_mode ?? "capture_zero";
  const paymentIntentId = prepared.payment_intent_id;
  const adminId = prepared.admin_id;

  if (!paymentIntentId || !adminId) {
    throw new Error("[executeGradingFailStripeLeg] missing payment_intent_id or admin_id");
  }

  const stripe = createStripeClient();
  const idempotencyKey = `auth-grading-fail:${voidMode}:member:${orderId}:stripe-smoke`;

  if (voidMode === "capture_auth_fee_only") {
    const captureCents = prepared.capture_cents ?? 0;
    if (captureCents <= 0) {
      throw new Error("[executeGradingFailStripeLeg] invalid capture_cents");
    }

    await stripe.paymentIntents.capture(
      paymentIntentId,
      {
        amount_to_capture: captureCents,
        final_capture: true,
        metadata: {
          capture_stage: "auth_grading_fail",
          order_kind: "auth_grading_member",
          order_id: orderId,
          admin_id: adminId,
        },
      },
      { idempotencyKey },
    );
    return;
  }

  if (voidMode === "cancel") {
    await stripe.paymentIntents.cancel(paymentIntentId, undefined, {
      idempotencyKey,
    });
    return;
  }

  await stripe.paymentIntents.capture(
    paymentIntentId,
    { amount_to_capture: 0, final_capture: true },
    { idempotencyKey },
  );
}

export async function retrievePaymentIntent(
  paymentIntentId: string,
): Promise<Stripe.PaymentIntent> {
  const stripe = createStripeClient();
  return stripe.paymentIntents.retrieve(paymentIntentId);
}
