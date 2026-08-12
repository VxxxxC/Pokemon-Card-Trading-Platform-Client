import { findMerchantListingForIntegration } from "../../rewards/helpers/checkout-fixture";
import { createServiceRoleClient } from "../../shared/supabase-admin";

export async function seedMerchantOrderReadyForBuyerConfirm(params: {
  buyerId: string;
  suffix: string;
  itemSubtotal?: number;
}): Promise<{ orderId: string; merchantId: string; itemSubtotal: number }> {
  const admin = createServiceRoleClient();
  const { listingId, sellerId: merchantId } =
    await findMerchantListingForIntegration();
  const itemSubtotal = params.itemSubtotal ?? 100;

  const { data: orderId, error: seedError } = await admin.rpc(
    "rpc_e2e_seed_merchant_shipped_awaiting_confirm",
    {
      p_listing_id: listingId,
      p_buyer_id: params.buyerId,
      p_payment_intent_suffix: params.suffix,
      p_item_subtotal: itemSubtotal,
    },
  );

  if (seedError || !orderId) {
    throw new Error(
      `[seedMerchantOrderReadyForBuyerConfirm] ${seedError?.message ?? "missing order id"}`,
    );
  }

  return { orderId, merchantId, itemSubtotal };
}

export async function confirmMerchantBuyerReceipt(
  orderId: string,
): Promise<void> {
  const { getBuyerClient } = await import("../../shared/auth-context");
  const { error } = await getBuyerClient().rpc(
    "rpc_confirm_merchant_buyer_receipt",
    { p_order_id: orderId },
  );
  if (error) {
    throw new Error(`[confirmMerchantBuyerReceipt] ${error.message}`);
  }
}

export async function backdateMerchantPayoutHold(orderId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.rpc("rpc_e2e_backdate_merchant_payout_hold", {
    p_order_id: orderId,
  });
  if (error) {
    throw new Error(`[backdateMerchantPayoutHold] ${error.message}`);
  }
}
