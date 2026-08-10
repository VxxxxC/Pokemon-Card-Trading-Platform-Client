import {
  isGradingFaultParty,
  type GradingFaultParty,
} from "@/lib/payments/auth-grading-fail-void-saga";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ModerationOrderKind =
  | "merchant_direct"
  | "merchant_auth"
  | "member_auth";

export type PrepareModerationOrderRefundPayload = {
  success: boolean;
  orderKind: ModerationOrderKind;
  orderId: string;
  paymentIntentId: string;
  refundCents: number;
  refundHkd?: number;
  settlementRequired: boolean;
  faultParty: GradingFaultParty;
  adminId?: string;
};

type ModerationRefundRpcClient = {
  rpc(
    fn: "rpc_finalize_moderation_order_refund",
    args: {
      p_order_id: string;
      p_payment_intent_id: string;
      p_refund_id: string;
      p_refund_cents: number;
      p_stripe_fee_hkd?: number;
      p_case_id?: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_mark_moderation_order_refund_failed",
    args: {
      p_order_id: string;
      p_error: string;
      p_case_id?: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_retry_moderation_order_refund_prepare",
    args: {
      p_case_id: string;
      p_order_id: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

const VALID_MODERATION_ORDER_KINDS = new Set<ModerationOrderKind>([
  "merchant_direct",
  "merchant_auth",
  "member_auth",
]);

export function isModerationOrderKind(value: string): value is ModerationOrderKind {
  return VALID_MODERATION_ORDER_KINDS.has(value as ModerationOrderKind);
}

export function parsePrepareModerationOrderRefundPayload(
  data: unknown,
): PrepareModerationOrderRefundPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const orderKind = payload.orderKind ?? payload.order_kind;
  const faultParty = payload.faultParty ?? payload.fault_party;

  if (typeof orderKind !== "string" || !isModerationOrderKind(orderKind)) {
    return null;
  }

  if (
    typeof faultParty !== "string" ||
    !isGradingFaultParty(faultParty)
  ) {
    return null;
  }

  const orderId =
    typeof payload.orderId === "string"
      ? payload.orderId
      : typeof payload.order_id === "string"
        ? payload.order_id
        : null;

  if (!orderId) {
    return null;
  }
  const paymentIntentId =
    typeof payload.paymentIntentId === "string"
      ? payload.paymentIntentId
      : typeof payload.payment_intent_id === "string"
        ? payload.payment_intent_id
        : null;

  if (!paymentIntentId) {
    return null;
  }

  const refundCents = Number(payload.refundCents ?? payload.refund_cents ?? 0);

  return {
    success: payload.success === true,
    orderKind,
    orderId,
    paymentIntentId,
    refundCents: Number.isFinite(refundCents) ? refundCents : 0,
    refundHkd:
      payload.refundHkd !== undefined
        ? Number(payload.refundHkd)
        : payload.refund_hkd !== undefined
          ? Number(payload.refund_hkd)
          : undefined,
    settlementRequired:
      payload.settlementRequired === true || payload.settlement_required === true,
    faultParty,
    adminId:
      typeof payload.adminId === "string"
        ? payload.adminId
        : typeof payload.admin_id === "string"
          ? payload.admin_id
          : undefined,
  };
}

async function resolveCapturableAndFeeCents(
  paymentIntentId: string,
): Promise<{ capturableCents: number; stripeFeeCents: number }> {
  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["latest_charge.balance_transaction"],
  });

  const capturableCents = pi.amount_received ?? pi.amount ?? 0;
  let stripeFeeCents = 0;

  const charge = pi.latest_charge;
  if (charge && typeof charge !== "string") {
    const balanceTx = charge.balance_transaction;
    if (balanceTx && typeof balanceTx !== "string") {
      stripeFeeCents = Math.abs(balanceTx.fee ?? 0);
    }
  }

  return { capturableCents, stripeFeeCents };
}

async function extractStripeFeeHkd(refundId: string): Promise<number> {
  const refund = await stripe.refunds.retrieve(refundId, {
    expand: ["balance_transaction"],
  });

  const balanceTx = refund.balance_transaction;
  if (!balanceTx || typeof balanceTx === "string") {
    return 0;
  }

  const feeCents = Math.abs(balanceTx.fee ?? 0);
  return feeCents / 100;
}

function computeRefundCents(input: {
  snapshotCents: number;
  capturableCents: number;
  faultParty: GradingFaultParty;
  stripeFeeCents: number;
}): number {
  let cents = Math.min(input.snapshotCents, input.capturableCents);

  if (input.faultParty === "buyer") {
    cents = Math.max(0, cents - input.stripeFeeCents);
  }

  return cents;
}

export async function runModerationOrderRefundSaga(input: {
  caseId: string;
  prepared: PrepareModerationOrderRefundPayload;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rpc = (await createClient()) as unknown as ModerationRefundRpcClient;
  const serviceRole = createAdminClient() as unknown as ModerationRefundRpcClient;
  const { prepared, caseId } = input;

  if (!prepared.success || prepared.refundCents <= 0) {
    return { ok: false, error: "售後退款準備資料無效" };
  }

  const idempotencyKey = `moderation-refund:${caseId}:${prepared.orderId}`;

  try {
    const { capturableCents, stripeFeeCents } = await resolveCapturableAndFeeCents(
      prepared.paymentIntentId,
    );
    const refundCents = computeRefundCents({
      snapshotCents: prepared.refundCents,
      capturableCents,
      faultParty: prepared.faultParty,
      stripeFeeCents,
    });

    if (refundCents <= 0) {
      throw new Error("可退款金額為零");
    }

    const refund = await stripe.refunds.create(
      {
        payment_intent: prepared.paymentIntentId,
        amount: refundCents,
        metadata: {
          order_kind: prepared.orderKind,
          order_id: prepared.orderId,
          capture_stage: "moderation_post_sale",
          case_id: caseId,
          admin_id: prepared.adminId ?? "",
        },
      },
      { idempotencyKey },
    );

    const stripeFeeHkd =
      prepared.faultParty === "buyer"
        ? stripeFeeCents / 100
        : await extractStripeFeeHkd(refund.id);

    const { error: finalizeError } = await rpc.rpc(
      "rpc_finalize_moderation_order_refund",
      {
        p_order_id: prepared.orderId,
        p_payment_intent_id: prepared.paymentIntentId,
        p_refund_id: refund.id,
        p_refund_cents: refundCents,
        p_stripe_fee_hkd: prepared.settlementRequired ? stripeFeeHkd : 0,
        p_case_id: caseId,
      },
    );

    if (finalizeError) {
      throw new Error(finalizeError.message);
    }

    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe 售後退款失敗";

    await serviceRole.rpc("rpc_mark_moderation_order_refund_failed", {
      p_order_id: prepared.orderId,
      p_error: message,
      p_case_id: caseId,
    });

    return { ok: false, error: message };
  }
}

export async function runModerationOrderRefundRetry(input: {
  caseId: string;
  orderId: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rpc = (await createClient()) as unknown as ModerationRefundRpcClient;

  const { data, error } = await rpc.rpc("rpc_retry_moderation_order_refund_prepare", {
    p_case_id: input.caseId,
    p_order_id: input.orderId,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const prepared = parsePrepareModerationOrderRefundPayload(data);
  if (!prepared?.success) {
    return { ok: false, error: "重試退款準備失敗" };
  }

  return runModerationOrderRefundSaga({
    caseId: input.caseId,
    prepared,
  });
}
