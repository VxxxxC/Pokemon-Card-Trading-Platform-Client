import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type GoodsCaptureOrderKind = "member" | "merchant";

export type PrepareGoodsCapturePayload = {
  success: boolean;
  already_applied?: boolean;
  order_kind: GoodsCaptureOrderKind;
  order_id: string;
  payment_intent_id: string;
  goods_cents: number;
  admin_id: string;
  notes?: string | null;
};

type GoodsCaptureRpcClient = {
  rpc(
    fn: "rpc_prepare_goods_capture",
    args: {
      p_order_kind: GoodsCaptureOrderKind;
      p_order_id: string;
      p_notes: string | null;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
  rpc(
    fn: "rpc_finalize_goods_capture",
    args: {
      p_order_kind: GoodsCaptureOrderKind;
      p_order_id: string;
      p_payment_intent_id: string;
      p_captured_amount_cents: number;
      p_admin_id: string | null;
      p_notes: string | null;
    },
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

function parsePreparePayload(data: unknown): PrepareGoodsCapturePayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as Record<string, unknown>;
  const orderKind = payload.order_kind;
  if (orderKind !== "member" && orderKind !== "merchant") {
    return null;
  }

  if (
    typeof payload.order_id !== "string" ||
    typeof payload.payment_intent_id !== "string" ||
    typeof payload.admin_id !== "string"
  ) {
    return null;
  }

  return {
    success: payload.success === true,
    already_applied: payload.already_applied === true,
    order_kind: orderKind,
    order_id: payload.order_id,
    payment_intent_id: payload.payment_intent_id,
    goods_cents: Number(payload.goods_cents ?? 0),
    admin_id: payload.admin_id,
    notes:
      typeof payload.notes === "string" ? payload.notes : null,
  };
}

function stripeOrderKind(orderKind: GoodsCaptureOrderKind): string {
  return orderKind === "member" ? "member_auth" : "merchant";
}

export async function runGoodsCaptureSaga(input: {
  orderKind: GoodsCaptureOrderKind;
  orderId: string;
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const rpc = (await createClient()) as unknown as GoodsCaptureRpcClient;

  const { data: prepareData, error: prepareError } = await rpc.rpc(
    "rpc_prepare_goods_capture",
    {
      p_order_kind: input.orderKind,
      p_order_id: input.orderId,
      p_notes: input.notes?.trim() || null,
    },
  );

  if (prepareError) {
    return { ok: false, error: prepareError.message };
  }

  const prepared = parsePreparePayload(prepareData);
  if (!prepared?.success) {
    return { ok: false, error: "鑑定通過扣款準備失敗" };
  }

  if (prepared.already_applied) {
    return { ok: true };
  }

  if (prepared.goods_cents <= 0) {
    return { ok: false, error: "卡價金額異常" };
  }

  const idempotencyKey = `goods-capture:${input.orderKind}:${input.orderId}`;

  let capturedIntent: Stripe.PaymentIntent;
  try {
    const existingIntent = await stripe.paymentIntents.retrieve(
      prepared.payment_intent_id,
    );
    if (existingIntent.status !== "requires_capture") {
      return { ok: false, error: "付款狀態不允許扣款，請聯絡技術支援" };
    }
    const capturable = existingIntent.amount_capturable ?? 0;
    if (capturable < prepared.goods_cents) {
      return {
        ok: false,
        error: `可扣款餘額不足（可扣 ${capturable}，需扣 ${prepared.goods_cents}）。此訂單可能於舊版 checkout 建立，請開新單測試。`,
      };
    }

    capturedIntent = await stripe.paymentIntents.capture(
      prepared.payment_intent_id,
      {
        amount_to_capture: prepared.goods_cents,
        final_capture: true,
        metadata: {
          capture_stage: "goods",
          admin_id: prepared.admin_id,
          order_kind: stripeOrderKind(input.orderKind),
          order_id: input.orderId,
        },
      },
      { idempotencyKey },
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Stripe capture 失敗";
    return { ok: false, error: message };
  }

  const capturedCents = capturedIntent.amount_received;
  if (capturedCents <= 0) {
    return { ok: false, error: "鑑定通過扣款尚未完成" };
  }

  const { error: finalizeError } = await rpc.rpc("rpc_finalize_goods_capture", {
    p_order_kind: input.orderKind,
    p_order_id: input.orderId,
    p_payment_intent_id: prepared.payment_intent_id,
    p_captured_amount_cents: capturedCents,
    p_admin_id: prepared.admin_id,
    p_notes: prepared.notes?.trim() || input.notes?.trim() || null,
  });

  if (finalizeError) {
    return { ok: false, error: finalizeError.message };
  }

  return { ok: true };
}

export function isGoodsCapturePaymentIntent(
  paymentIntent: Stripe.PaymentIntent,
): boolean {
  return paymentIntent.metadata?.capture_stage === "goods";
}

export async function finalizeGoodsCaptureFromWebhook(input: {
  orderKind: GoodsCaptureOrderKind;
  orderId: string;
  paymentIntent: Stripe.PaymentIntent;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient() as unknown as GoodsCaptureRpcClient;
  const adminId = input.paymentIntent.metadata?.admin_id?.trim() || null;

  const { error } = await admin.rpc("rpc_finalize_goods_capture", {
    p_order_kind: input.orderKind,
    p_order_id: input.orderId,
    p_payment_intent_id: input.paymentIntent.id,
    p_captured_amount_cents: input.paymentIntent.amount_received,
    p_admin_id: adminId,
    p_notes: null,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
