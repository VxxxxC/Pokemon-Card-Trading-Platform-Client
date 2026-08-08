import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type GradingFaultParty =
  | "buyer"
  | "seller"
  | "platform"
  | "carrier"
  | "inconclusive";

export type AuthGradingFailOrderKind = "member" | "merchant";

export type PrepareAuthGradingFailPayload = {
  success: boolean;
  order_kind: AuthGradingFailOrderKind;
  order_id: string;
  payment_intent_id: string;
  admin_id: string;
  fault_party: GradingFaultParty;
  void_mode?: "cancel" | "capture_zero";
  escrow_capture_model?: string | null;
  settlement_required?: boolean;
  refund_cents?: number;
};

type AuthGradingFailRpcClient = {
  rpc(
    fn: "rpc_prepare_auth_grading_fail",
    args: {
      p_order_kind: AuthGradingFailOrderKind;
      p_order_id: string;
      p_fault_party: GradingFaultParty;
      p_reason: string | null;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_finalize_auth_grading_fail",
    args: {
      p_order_kind: AuthGradingFailOrderKind;
      p_order_id: string;
      p_payment_intent_id: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_mark_auth_grading_fail_failed",
    args: {
      p_order_kind: AuthGradingFailOrderKind;
      p_order_id: string;
      p_error: string;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

const VALID_FAULT_PARTIES = new Set<GradingFaultParty>([
  "buyer",
  "seller",
  "platform",
  "carrier",
  "inconclusive",
]);

export function isGradingFaultParty(value: string): value is GradingFaultParty {
  return VALID_FAULT_PARTIES.has(value as GradingFaultParty);
}

function gradingRefundOrderKind(orderKind: AuthGradingFailOrderKind): string {
  return orderKind === "member" ? "auth_grading_member" : "auth_grading_merchant";
}

function parsePreparePayload(data: unknown): PrepareAuthGradingFailPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const orderKind = payload.order_kind;
  const faultParty = payload.fault_party;

  if (orderKind !== "member" && orderKind !== "merchant") {
    return null;
  }

  if (
    typeof faultParty !== "string" ||
    !isGradingFaultParty(faultParty) ||
    typeof payload.order_id !== "string" ||
    typeof payload.payment_intent_id !== "string" ||
    typeof payload.admin_id !== "string"
  ) {
    return null;
  }

  return {
    success: payload.success === true,
    order_kind: orderKind,
    order_id: payload.order_id,
    payment_intent_id: payload.payment_intent_id,
    admin_id: payload.admin_id,
    fault_party: faultParty,
    void_mode:
      payload.void_mode === "cancel" ? "cancel" : "capture_zero",
    escrow_capture_model:
      typeof payload.escrow_capture_model === "string"
        ? payload.escrow_capture_model
        : null,
    settlement_required: payload.settlement_required === true,
    refund_cents: Number(payload.refund_cents ?? 0),
  };
}

export async function runAuthGradingFailVoidSaga(input: {
  orderKind: AuthGradingFailOrderKind;
  orderId: string;
  faultParty: GradingFaultParty;
  reason?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rpc = (await createClient()) as unknown as AuthGradingFailRpcClient;
  const serviceRole = createAdminClient() as unknown as AuthGradingFailRpcClient;

  const { data: prepareData, error: prepareError } = await rpc.rpc(
    "rpc_prepare_auth_grading_fail",
    {
      p_order_kind: input.orderKind,
      p_order_id: input.orderId,
      p_fault_party: input.faultParty,
      p_reason: input.reason?.trim() || null,
    },
  );

  if (prepareError) {
    return { ok: false, error: prepareError.message };
  }

  const prepared = parsePreparePayload(prepareData);
  if (!prepared?.success) {
    return { ok: false, error: "鑑定失敗處理準備失敗" };
  }

  const refundCents =
    prepared.settlement_required && prepared.refund_cents
      ? prepared.refund_cents
      : 0;

  try {
    if (refundCents > 0) {
      await stripe.refunds.create(
        {
          payment_intent: prepared.payment_intent_id,
          amount: refundCents,
          metadata: {
            order_kind: gradingRefundOrderKind(input.orderKind),
            order_id: input.orderId,
            capture_stage: "auth_grading_fail",
            admin_id: prepared.admin_id,
          },
        },
        {
          idempotencyKey: `auth-grading-fail-refund:${input.orderKind}:${input.orderId}`,
        },
      );
    }

    const voidIdempotencyKey = `auth-grading-fail:${prepared.void_mode ?? "capture_zero"}:${input.orderKind}:${input.orderId}`;

    if (prepared.void_mode === "cancel") {
      await stripe.paymentIntents.cancel(
        prepared.payment_intent_id,
        undefined,
        { idempotencyKey: voidIdempotencyKey },
      );
    } else {
      await stripe.paymentIntents.capture(
        prepared.payment_intent_id,
        { amount_to_capture: 0, final_capture: true },
        { idempotencyKey: voidIdempotencyKey },
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe capture 失敗";

    await serviceRole.rpc("rpc_mark_auth_grading_fail_failed", {
      p_order_kind: input.orderKind,
      p_order_id: input.orderId,
      p_error: message,
    });

    return { ok: false, error: message };
  }

  const { error: finalizeError } = await rpc.rpc(
    "rpc_finalize_auth_grading_fail",
    {
      p_order_kind: input.orderKind,
      p_order_id: input.orderId,
      p_payment_intent_id: prepared.payment_intent_id,
    },
  );

  if (finalizeError) {
    await serviceRole.rpc("rpc_mark_auth_grading_fail_failed", {
      p_order_kind: input.orderKind,
      p_order_id: input.orderId,
      p_error: finalizeError.message,
    });
    return { ok: false, error: finalizeError.message };
  }

  return { ok: true };
}
