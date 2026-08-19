import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { getProfileIdByEmail } from "../fixtures/supabase-admin";
import { resolveReconcileMerchantListing } from "./stripe-reconcile";

function createE2eAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("Missing Supabase env for merchant order E2E seed");
  }
  return createClient<Database>(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function hasMerchantOrderE2eEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.E2E_BUYER_EMAIL?.trim(),
  );
}

export async function seedMerchantShippedOrderForSellerDetail(params?: {
  suffix?: string;
}): Promise<{ orderId: string; merchantId: string }> {
  const buyerEmail = process.env.E2E_BUYER_EMAIL?.trim();
  if (!buyerEmail) {
    throw new Error("Missing E2E_BUYER_EMAIL");
  }

  const buyerId = await getProfileIdByEmail(buyerEmail);
  if (!buyerId) {
    throw new Error(`Buyer profile not found for ${buyerEmail}`);
  }

  const { listingId, sellerId } = await resolveReconcileMerchantListing();
  const suffix = params?.suffix ?? `mord-${Date.now()}`;

  const admin = createE2eAdminClient();
  const { data: orderId, error } = await admin.rpc(
    "rpc_e2e_seed_merchant_shipped_awaiting_confirm",
    {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
      p_payment_intent_suffix: suffix,
      p_item_subtotal: 100,
    },
  );

  if (error || !orderId) {
    throw new Error(
      `[seedMerchantShippedOrderForSellerDetail] ${error?.message ?? "missing order id"}`,
    );
  }

  return { orderId, merchantId: sellerId };
}

export async function seedMerchantPendingPaymentOrder(): Promise<{
  orderId: string;
  listingId: string;
  merchantId: string;
  buyerId: string;
}> {
  const buyerEmail = process.env.E2E_BUYER_EMAIL?.trim();
  if (!buyerEmail) {
    throw new Error("Missing E2E_BUYER_EMAIL");
  }

  const buyerId = await getProfileIdByEmail(buyerEmail);
  if (!buyerId) {
    throw new Error(`Buyer profile not found for ${buyerEmail}`);
  }

  const { listingId, sellerId } = await resolveReconcileMerchantListing();
  const admin = createE2eAdminClient();
  const { data: orderId, error } = await admin.rpc(
    "rpc_e2e_seed_merchant_pending_payment_order",
    {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
    },
  );

  if (error || !orderId) {
    throw new Error(
      `[seedMerchantPendingPaymentOrder] ${error?.message ?? "missing order id"}`,
    );
  }

  return { orderId, listingId, merchantId: sellerId, buyerId };
}

export async function backdateMerchantOrderCreatedAt(
  orderId: string,
  hoursAgo = 49,
): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin.rpc("rpc_e2e_backdate_merchant_order_created_at", {
    p_order_id: orderId,
    p_hours_ago: hoursAgo,
  });
  if (error) {
    throw new Error(`[backdateMerchantOrderCreatedAt] ${error.message}`);
  }
}

export async function expireMerchantPendingPaymentOrder(
  orderId: string,
): Promise<void> {
  const admin = createE2eAdminClient();
  const { error } = await admin.rpc(
    "rpc_finalize_merchant_pending_payment_expiry",
    { p_order_id: orderId },
  );
  if (error) {
    throw new Error(`[expireMerchantPendingPaymentOrder] ${error.message}`);
  }
}

export async function seedMerchantAuthAwaitingBuyerConfirm(): Promise<{
  orderId: string;
  merchantId: string;
}> {
  const buyerEmail = process.env.E2E_BUYER_EMAIL?.trim();
  if (!buyerEmail) {
    throw new Error("Missing E2E_BUYER_EMAIL");
  }

  const buyerId = await getProfileIdByEmail(buyerEmail);
  if (!buyerId) {
    throw new Error(`Buyer profile not found for ${buyerEmail}`);
  }

  const { listingId, sellerId } = await resolveReconcileMerchantListing();
  const suffix = `p-a-auth-${Date.now()}`;
  const admin = createE2eAdminClient();
  const { data: orderId, error } = await admin.rpc(
    "rpc_e2e_seed_merchant_auth_confirm_guard_order",
    {
      p_listing_id: listingId,
      p_buyer_id: buyerId,
      p_payment_intent_suffix: suffix,
    },
  );

  if (error || !orderId) {
    throw new Error(
      `[seedMerchantAuthAwaitingBuyerConfirm] ${error?.message ?? "missing order id"}`,
    );
  }

  const { error: captureError } = await admin
    .from("merchant_orders")
    .update({
      payment_capture_status: "fully_captured",
      shipping_method: "sf",
    })
    .eq("id", orderId);

  if (captureError) {
    throw new Error(
      `[seedMerchantAuthAwaitingBuyerConfirm] capture update ${captureError.message}`,
    );
  }

  return { orderId, merchantId: sellerId };
}

export async function seedMemberAuthHeldForSellerInvoice(params: {
  listingId: string;
  buyerId: string;
}): Promise<{ orderId: string }> {
  const admin = createE2eAdminClient();
  const { data: orderId, error } = await admin.rpc(
    "rpc_e2e_seed_member_auth_pending_payment_order",
    {
      p_listing_id: params.listingId,
      p_buyer_id: params.buyerId,
    },
  );

  if (error || !orderId) {
    throw new Error(
      `[seedMemberAuthHeldForSellerInvoice] ${error?.message ?? "missing order id"}`,
    );
  }

  const { error: updateError } = await admin
    .from("member_orders")
    .update({
      status: "completed",
      escrow_status: "released",
      seller_payout_status: "held",
      inbound_shipping_fee: 30,
      item_subtotal: 100,
      final_price: 100,
      auth_fee: 150,
    })
    .eq("id", orderId);

  if (updateError) {
    throw new Error(
      `[seedMemberAuthHeldForSellerInvoice] ${updateError.message}`,
    );
  }

  return { orderId };
}
