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

export type MerchantFinanceStatusFilter =
  | "all"
  | "paid"
  | "held"
  | "processing"
  | "failed";

export type MerchantFinanceSort = "transferred_at-desc" | "transferred_at-asc";

export type ListMerchantFinanceSettlementsInput = {
  page?: number;
  pageSize?: number;
  statusFilter?: MerchantFinanceStatusFilter;
  sort?: MerchantFinanceSort;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
};

export type MerchantFinanceSettlementsPage = {
  rows: MerchantFinanceSettlement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  monthEarned: number;
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

function mapOrderRowToSettlement(
  row: MerchantFinanceOrderRow,
): MerchantFinanceSettlement {
  return {
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
  };
}

function isSettlementListRow(row: MerchantFinanceOrderRow): boolean {
  return (
    row.merchant_payout_amount != null ||
    row.payout_status === "failed" ||
    row.payout_status === "held"
  );
}

const MERCHANT_FINANCE_SELECT = `
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
`;

async function computeMonthEarned(
  supabase: Awaited<ReturnType<typeof createClient>>,
  merchantId: string,
): Promise<number> {
  const monthStart = getMonthStartIso();
  const { data, error } = await supabase
    .from("merchant_orders")
    .select("merchant_payout_amount, transferred_at, paid_at")
    .eq("merchant_id", merchantId)
    .eq("payout_status", "paid");

  if (error) {
    console.error("[computeMonthEarned]", error.message);
    return 0;
  }

  let monthEarned = 0;
  for (const row of data ?? []) {
    const settledAt = row.transferred_at ?? row.paid_at;
    if (
      settledAt &&
      settledAt >= monthStart &&
      row.merchant_payout_amount != null
    ) {
      monthEarned += Number(row.merchant_payout_amount);
    }
  }
  return monthEarned;
}

function applyMerchantFinanceFilters<
  T extends {
    eq: (column: string, value: string) => T;
    in: (column: string, values: string[]) => T;
    gte: (column: string, value: string) => T;
    lte: (column: string, value: string) => T;
    or: (filters: string) => T;
    ilike: (column: string, pattern: string) => T;
  },
>(query: T, input: ListMerchantFinanceSettlementsInput, merchantId: string): T {
  let filtered = query
    .eq("merchant_id", merchantId)
    .in("payout_status", ["paid", "processing", "failed", "held"]);

  if (input.statusFilter && input.statusFilter !== "all") {
    filtered = filtered.eq("payout_status", input.statusFilter);
  }

  if (input.dateFrom) {
    filtered = filtered.gte("transferred_at", input.dateFrom);
  }

  if (input.dateTo) {
    filtered = filtered.lte("transferred_at", input.dateTo);
  }

  const search = input.search?.trim();
  if (search) {
    const escaped = search.replace(/[%_,]/g, "");
    filtered = filtered.or(
      `order_number.ilike.%${escaped}%,stripe_transfer_id.ilike.%${escaped}%`,
    );
  }

  return filtered;
}

export async function listMerchantFinanceSettlements(
  input: ListMerchantFinanceSettlementsInput = {},
): Promise<ActionResult<MerchantFinanceSettlementsPage>> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const user = await getOptionalAuthUser();
    if (!user) {
      return { success: false, error: "請先登入" };
    }

    const page = Math.max(1, input.page ?? 1);
    const pageSize = Math.min(50, Math.max(5, input.pageSize ?? 10));
    const sort = input.sort ?? "transferred_at-desc";
    const ascending = sort === "transferred_at-asc";

    const supabase = await createClient();
    const monthEarned = await computeMonthEarned(supabase, user.id);

    const countQuery = applyMerchantFinanceFilters(
      supabase.from("merchant_orders").select("*", { count: "exact", head: true }),
      input,
      user.id,
    );
    const { count, error: countError } = await countQuery;
    if (countError) {
      console.error("[listMerchantFinanceSettlements] count", countError.message);
      return { success: false, error: "無法載入撥款記錄" };
    }

    const total = count ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    const listQuery = applyMerchantFinanceFilters(
      supabase.from("merchant_orders").select(MERCHANT_FINANCE_SELECT),
      input,
      user.id,
    )
      .order("transferred_at", { ascending, nullsFirst: false })
      .order("payout_attempted_at", { ascending, nullsFirst: false })
      .range(offset, offset + pageSize - 1);

    const { data, error } = await listQuery;
    if (error) {
      console.error("[listMerchantFinanceSettlements] list", error.message);
      return { success: false, error: "無法載入撥款記錄" };
    }

    const rows = sortSettlementsByRecency(
      (data ?? []) as MerchantFinanceOrderRow[],
    )
      .filter(isSettlementListRow)
      .map(mapOrderRowToSettlement);

    return {
      success: true,
      data: {
        rows,
        total,
        page: safePage,
        pageSize,
        totalPages,
        monthEarned,
      },
    };
  } catch (error) {
    console.error("[listMerchantFinanceSettlements]", error);
    return { success: false, error: "無法載入撥款記錄" };
  }
}

export async function getMerchantFinanceSummary(): Promise<
  ActionResult<MerchantFinanceSummary>
> {
  const pageResult = await listMerchantFinanceSettlements({
    page: 1,
    pageSize: 20,
    sort: "transferred_at-desc",
  });

  if (!pageResult.success) {
    return pageResult;
  }

  return {
    success: true,
    data: {
      monthEarned: pageResult.data.monthEarned,
      recentSettlements: pageResult.data.rows,
    },
  };
}
