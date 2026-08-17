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
