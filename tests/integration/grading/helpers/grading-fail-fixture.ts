import { createServiceRoleClient } from "../../shared/supabase-admin";

export async function promoteMemberAuthOrderToGrading(
  orderId: string,
  paymentIntentId: string,
): Promise<void> {
  const admin = createServiceRoleClient();

  const { data: existing, error: readError } = await admin
    .from("member_orders")
    .select("final_price, item_subtotal, auth_fee")
    .eq("id", orderId)
    .maybeSingle();

  if (readError || !existing) {
    throw new Error(
      `[promoteMemberAuthOrderToGrading] read: ${readError?.message ?? "missing order"}`,
    );
  }

  const itemSubtotal = Number(existing.item_subtotal ?? existing.final_price ?? 0);
  const authFee = Number(existing.auth_fee) > 0 ? Number(existing.auth_fee) : 150;
  const inbound = 30;
  const outbound = 30;
  const buyerTotal = itemSubtotal + authFee + inbound + outbound;

  const { error: amountsError } = await admin
    .from("member_orders")
    .update({
      item_subtotal: itemSubtotal,
      auth_fee: authFee,
      inbound_shipping_fee: inbound,
      outbound_shipping_fee: outbound,
      total_amount: buyerTotal,
      buyer_total_amount: buyerTotal,
      escrow_capture_model: "single",
    })
    .eq("id", orderId);

  if (amountsError) {
    throw new Error(`[promoteMemberAuthOrderToGrading] amounts: ${amountsError.message}`);
  }

  const { error: authError } = await admin.rpc(
    "rpc_mark_member_auth_order_authorized",
    {
      p_order_id: orderId,
      p_payment_intent_id: paymentIntentId,
      p_amounts: {},
    },
  );
  if (authError) {
    throw new Error(`[promoteMemberAuthOrderToGrading] authorize: ${authError.message}`);
  }

  const { error } = await admin
    .from("member_orders")
    .update({
      escrow_status: "grading",
      platform_received_at: new Date().toISOString(),
      inbound_tracking_no: `SF-GRADING-${orderId.slice(0, 8)}`,
      payment_capture_status: "authorized",
      escrow_capture_model: "single",
      refund_status: "none",
      refund_error: null,
      auth_result: null,
      fault_party: null,
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(`[promoteMemberAuthOrderToGrading] update: ${error.message}`);
  }
}

export async function resetMemberAuthOrderGradingFailState(
  orderId: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("member_orders")
    .update({
      escrow_status: "grading",
      status: "pending",
      auth_result: null,
      fault_party: null,
      refund_status: "none",
      refund_error: null,
      payment_capture_status: "authorized",
      seller_settlement_status: "none",
    })
    .eq("id", orderId);

  if (error) {
    throw new Error(`[resetMemberAuthOrderGradingFailState] ${error.message}`);
  }

  await admin.from("seller_receivables").delete().eq("order_id", orderId);
}

export async function getMemberOrderGradingFailRow(orderId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("member_orders")
    .select(
      "id, auth_fee, buyer_total_amount, payment_capture_status, auth_result, fault_party, refund_status, escrow_capture_model, seller_id",
    )
    .eq("id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getMemberOrderGradingFailRow] ${error.message}`);
  }

  return data;
}

export async function getSellerReceivableForOrder(orderId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("seller_receivables")
    .select("order_id, amount_hkd, status")
    .eq("order_kind", "member")
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getSellerReceivableForOrder] ${error.message}`);
  }

  return data;
}
