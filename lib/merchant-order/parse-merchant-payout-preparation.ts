export type MerchantPayoutPreparation =
  | {
      alreadyApplied: true;
      orderId: string;
    }
  | {
      alreadyApplied: false;
      orderId: string;
      paymentIntentId: string;
      stripeAccountId: string;
      totalAmount: number;
      commissionAmount: number;
      merchantPayoutAmount: number;
    };

function readMerchantPayoutRpcString(
  row: Record<string, unknown>,
  keys: readonly string[],
): string {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed) {
        return trimmed;
      }
    }
  }
  return "";
}

export function parseMerchantPayoutPreparation(
  value: unknown,
): MerchantPayoutPreparation | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const row = value as Record<string, unknown>;
  const orderId = readMerchantPayoutRpcString(row, ["order_id"]);
  if (!orderId) {
    return null;
  }

  if (row.already_applied === true) {
    return { alreadyApplied: true, orderId };
  }

  const paymentIntentId = readMerchantPayoutRpcString(row, [
    "stripe_payment_intent_id",
    "payment_intent_id",
  ]);
  const stripeAccountId = readMerchantPayoutRpcString(row, [
    "stripe_destination_account_id",
    "stripe_account_id",
  ]);
  const totalAmount = Number(row.total_amount);
  const commissionAmount = Number(row.commission_amount);
  const merchantPayoutAmount = Number(row.merchant_payout_amount);

  if (
    !paymentIntentId ||
    !stripeAccountId ||
    !Number.isFinite(totalAmount) ||
    totalAmount <= 0 ||
    !Number.isFinite(commissionAmount) ||
    commissionAmount < 0 ||
    !Number.isFinite(merchantPayoutAmount) ||
    merchantPayoutAmount <= 0
  ) {
    return null;
  }

  return {
    alreadyApplied: false,
    orderId,
    paymentIntentId,
    stripeAccountId,
    totalAmount,
    commissionAmount,
    merchantPayoutAmount,
  };
}
