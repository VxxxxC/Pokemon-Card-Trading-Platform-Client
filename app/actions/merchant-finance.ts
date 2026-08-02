"use server";

import { getOptionalAuthUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/types/supabase";

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export type MerchantFinanceSettlement = {
  orderId: string;
  orderNumber: string | null;
  cardName: string | null;
  amount: number;
  commissionAmount: number | null;
  paidAt: string | null;
  payoutStatus: string;
  payoutHoldUntil: string | null;
  stripeTransferId: string | null;
  stripePaymentIntentId: string | null;
  payoutError: string | null;
};

export type MerchantFinanceSummary = {
  monthEarned: number;
  recentSettlements: MerchantFinanceSettlement[];
};

type MerchantFinanceOrderRow = Pick<
  Tables<"merchant_orders">,
  | "id"
  | "order_number"
  | "merchant_payout_amount"
  | "commission_amount"
  | "transferred_at"
  | "paid_at"
  | "payout_attempted_at"
  | "payout_status"
  | "payout_hold_until"
  | "payout_error"
  | "stripe_transfer_id"
  | "stripe_payment_intent_id"
  | "escrow_status"
> & {
  listings: {
    product_catalog: {
      name_ja: string;
      name_zh: string | null;
      name_en: string | null;
    } | null;
  } | null;
};

function getMonthStartIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

function resolveCardName(row: MerchantFinanceOrderRow): string | null {
  const catalog = row.listings?.product_catalog;
  if (!catalog) {
    return null;
  }
  const name =
    catalog.name_zh?.trim() ||
    catalog.name_en?.trim() ||
    catalog.name_ja?.trim() ||
    null;
  return name;
}

function resolveSettlementTimestamp(row: MerchantFinanceOrderRow): string | null {
  return row.transferred_at ?? row.payout_attempted_at ?? row.paid_at;
}

function sortSettlementsByRecency(
  rows: MerchantFinanceOrderRow[],
): MerchantFinanceOrderRow[] {
  return [...rows].sort((a, b) => {
    const aTime = resolveSettlementTimestamp(a);
    const bTime = resolveSettlementTimestamp(b);
    if (!aTime && !bTime) {
      return 0;
    }
    if (!aTime) {
      return 1;
    }
    if (!bTime) {
      return -1;
    }
    return bTime.localeCompare(aTime);
  });
}

export async function getMerchantFinanceSummary(): Promise<
  ActionResult<MerchantFinanceSummary>
> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const user = await getOptionalAuthUser();
    if (!user) {
      return { success: false, error: "請先登入" };
    }

    const supabase = await createClient();
    const monthStart = getMonthStartIso();

    const { data: rows, error } = await supabase
      .from("merchant_orders")
      .select(
        `
        id,
        order_number,
        merchant_payout_amount,
        commission_amount,
        transferred_at,
        paid_at,
        payout_attempted_at,
        payout_status,
        payout_hold_until,
        payout_error,
        stripe_transfer_id,
        stripe_payment_intent_id,
        escrow_status,
        listings (
          product_catalog (
            name_zh,
            name_en,
            name_ja
          )
        )
      `,
      )
      .eq("merchant_id", user.id)
      .in("payout_status", ["paid", "processing", "failed", "held"])
      .order("transferred_at", { ascending: false, nullsFirst: false })
      .limit(20);

    if (error) {
      console.error("[getMerchantFinanceSummary]", error.message);
      return { success: false, error: "無法載入資金摘要" };
    }

    const orderRows = sortSettlementsByRecency(
      (rows ?? []) as MerchantFinanceOrderRow[],
    ).slice(0, 20);

    let monthEarned = 0;
    for (const row of orderRows) {
      const transferredAt = row.transferred_at ?? row.paid_at;
      if (
        row.payout_status === "paid" &&
        transferredAt &&
        transferredAt >= monthStart &&
        row.merchant_payout_amount != null
      ) {
        monthEarned += Number(row.merchant_payout_amount);
      }
    }

    const recentSettlements: MerchantFinanceSettlement[] = orderRows
      .filter(
        (row) =>
          row.merchant_payout_amount != null ||
          row.payout_status === "failed" ||
          row.payout_status === "held",
      )
      .map((row) => ({
        orderId: row.id,
        orderNumber: row.order_number,
        cardName: resolveCardName(row),
        amount:
          row.merchant_payout_amount != null
            ? Number(row.merchant_payout_amount)
            : 0,
        commissionAmount:
          row.commission_amount != null ? Number(row.commission_amount) : null,
        paidAt: resolveSettlementTimestamp(row) ?? row.payout_hold_until,
        payoutStatus: row.payout_status,
        payoutHoldUntil: row.payout_hold_until,
        stripeTransferId: row.stripe_transfer_id,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        payoutError: row.payout_error,
      }));

    return {
      success: true,
      data: {
        monthEarned,
        recentSettlements,
      },
    };
  } catch (error) {
    console.error("[getMerchantFinanceSummary]", error);
    return { success: false, error: "無法載入資金摘要" };
  }
}
