"use server";

import { getNextBatchSchedule } from "@/lib/admin-payouts/fps-batch-config";
import { formatAdminDateTime } from "@/lib/admin-payouts/format";
import type {
  AdminPayoutsPageData,
  AdminPayoutsPageResult,
  ListAdminMerchantTransfersInput,
  ListAdminMerchantTransfersResult,
  MerchantTransferPage,
  MerchantTransferPayoutStatus,
  MerchantTransferRow,
  MerchantTransferSort,
  MerchantTransferStatusCounts,
  MerchantTransferStatusFilter,
} from "@/lib/admin-payouts/types";
import {
  EMPTY_MERCHANT_TRANSFER_STATUS_COUNTS,
  MERCHANT_NAME_SORT_FETCH_CAP,
  MERCHANT_TRANSFERS_EXPORT_CAP,
  MERCHANT_TRANSFERS_MAX_PAGE_SIZE,
  MERCHANT_TRANSFERS_PAGE_SIZE,
} from "@/lib/admin-payouts/types";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStripeBalance } from "@/lib/stripe/platform-balance";
import { getPlatformStripeTodayInflow } from "@/lib/stripe/platform-today-inflow";
import type { Tables } from "@/types/supabase";
import { revalidatePath } from "next/cache";

type MerchantOrderRow = Pick<
  Tables<"merchant_orders">,
  | "id"
  | "order_number"
  | "merchant_id"
  | "stripe_transfer_id"
  | "stripe_destination_account_id"
  | "merchant_payout_amount"
  | "commission_amount"
  | "commission_rate_applied"
  | "item_subtotal"
  | "auth_fee"
  | "buyer_confirmed_at"
  | "stripe_payment_intent_id"
  | "requires_authentication"
  | "transferred_at"
  | "payout_status"
  | "payout_error"
>;

const MERCHANT_ORDER_SELECT =
  "id, order_number, merchant_id, stripe_transfer_id, stripe_destination_account_id, merchant_payout_amount, commission_amount, commission_rate_applied, item_subtotal, auth_fee, buyer_confirmed_at, stripe_payment_intent_id, requires_authentication, transferred_at, payout_status, payout_error";

async function requireAdmin(): Promise<
  { ok: true; adminId: string } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "未登入" };
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    return { ok: false, error: "請先登入" };
  }

  const supabase = await createClient();
  const isAdmin = await isCurrentUserAdmin(supabase, user.id);
  if (!isAdmin) {
    return { ok: false, error: "無管理員權限" };
  }

  return { ok: true, adminId: user.id };
}

function normalizePayoutStatus(status: string | null): MerchantTransferPayoutStatus {
  if (
    status === "pending" ||
    status === "processing" ||
    status === "paid" ||
    status === "failed"
  ) {
    return status;
  }
  return "pending";
}

function resolvePageSize(pageSize?: number): number {
  const size = Math.floor(pageSize ?? MERCHANT_TRANSFERS_PAGE_SIZE);
  return Math.min(
    MERCHANT_TRANSFERS_MAX_PAGE_SIZE,
    Math.max(1, size),
  );
}

function resolvePage(page?: number): number {
  return Math.max(1, Math.floor(page ?? 1));
}

function isMerchantNameSort(
  sort: MerchantTransferSort | undefined,
): sort is "merchantName-asc" | "merchantName-desc" {
  return sort === "merchantName-asc" || sort === "merchantName-desc";
}

async function resolveSearchMerchantIds(
  admin: ReturnType<typeof createAdminClient>,
  search: string,
): Promise<string[]> {
  const term = search.trim();
  if (!term) {
    return [];
  }

  const { data } = await admin
    .from("merchant_shops")
    .select("merchant_id")
    .ilike("shop_name", `%${term}%`);

  return (data ?? [])
    .map((row) => row.merchant_id)
    .filter((id): id is string => Boolean(id));
}

function applyMerchantTransferFilters<T extends {
  not: (column: string, operator: string, value: null) => T;
  eq: (column: string, value: string) => T;
  gte: (column: string, value: string) => T;
  lte: (column: string, value: string) => T;
  or: (filters: string) => T;
}>(
  query: T,
  input: ListAdminMerchantTransfersInput,
  searchMerchantIds: string[],
): T {
  let filtered = query.not("stripe_transfer_id", "is", null);

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
    const orParts = [
      `order_number.ilike.%${escaped}%`,
      `stripe_transfer_id.ilike.%${escaped}%`,
    ];
    if (searchMerchantIds.length > 0) {
      orParts.push(`merchant_id.in.(${searchMerchantIds.join(",")})`);
    }
    filtered = filtered.or(orParts.join(","));
  }

  return filtered;
}

async function enrichMerchantTransferRows(
  orders: MerchantOrderRow[],
): Promise<MerchantTransferRow[]> {
  if (orders.length === 0) {
    return [];
  }

  const admin = createAdminClient();
  const merchantIds = [
    ...new Set(
      orders
        .map((order) => order.merchant_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  const shopNameByMerchantId = new Map<string, string>();
  const stripeAccountByMerchantId = new Map<string, string>();
  const displayNameByMerchantId = new Map<string, string>();

  if (merchantIds.length > 0) {
    const [{ data: shops }, { data: kycRows }, { data: profiles }] =
      await Promise.all([
        admin
          .from("merchant_shops")
          .select("merchant_id, shop_name")
          .in("merchant_id", merchantIds),
        admin
          .from("kyc_records")
          .select("merchant_id, stripe_account_id")
          .in("merchant_id", merchantIds),
        admin
          .from("profiles")
          .select("id, display_name")
          .in("id", merchantIds),
      ]);

    for (const shop of shops ?? []) {
      if (shop.shop_name) {
        shopNameByMerchantId.set(shop.merchant_id, shop.shop_name);
      }
    }

    for (const kyc of kycRows ?? []) {
      if (kyc.stripe_account_id) {
        stripeAccountByMerchantId.set(kyc.merchant_id, kyc.stripe_account_id);
      }
    }

    for (const profile of profiles ?? []) {
      displayNameByMerchantId.set(profile.id, profile.display_name);
    }
  }

  const orderIds = orders.map((order) => order.id);
  const ledgerAmountByOrderId = new Map<string, number>();

  if (orderIds.length > 0) {
    const { data: ledgerRows } = await admin
      .from("merchant_ledgers")
      .select("order_id, amount, transaction_type")
      .in("order_id", orderIds)
      .eq("transaction_type", "payout");

    for (const ledger of ledgerRows ?? []) {
      if (ledger.order_id) {
        ledgerAmountByOrderId.set(ledger.order_id, Number(ledger.amount));
      }
    }
  }

  return orders.map((order) => {
    const merchantName =
      shopNameByMerchantId.get(order.merchant_id) ??
      displayNameByMerchantId.get(order.merchant_id) ??
      "未知商戶";

    const subAccountId =
      order.stripe_destination_account_id ??
      stripeAccountByMerchantId.get(order.merchant_id) ??
      "—";

    const merchantPayoutAmount = Number(order.merchant_payout_amount ?? 0);
    const ledgerAmount = ledgerAmountByOrderId.get(order.id);
    let reconciliationWarning: string | undefined;

    if (
      ledgerAmount !== undefined &&
      Math.abs(ledgerAmount - merchantPayoutAmount) > 0.01
    ) {
      reconciliationWarning = `Ledger payout HK$${ledgerAmount} ≠ 訂單 HK$${merchantPayoutAmount}`;
      console.warn(
        "[listAdminMerchantTransfers] reconciliation mismatch",
        order.id,
        reconciliationWarning,
      );
    }

    const transferredAtIso = order.transferred_at;
    const transferredAtLabel = formatAdminDateTime(transferredAtIso);

    return {
      orderId: order.id,
      orderNumber: order.order_number ?? order.id.slice(0, 8),
      merchantId: order.merchant_id,
      stripeTransferId: order.stripe_transfer_id ?? "—",
      merchantName,
      subAccountId,
      requiresAuthentication: Boolean(order.requires_authentication),
      itemSubtotal: Number(order.item_subtotal ?? 0),
      commissionRateApplied:
        order.commission_rate_applied !== null &&
        order.commission_rate_applied !== undefined
          ? Number(order.commission_rate_applied)
          : null,
      platformCommission: Number(order.commission_amount ?? 0),
      authFee: Number(order.auth_fee ?? 0),
      merchantPayoutAmount,
      payoutStatus: normalizePayoutStatus(order.payout_status),
      payoutError: order.payout_error,
      reconciliationWarning,
      buyerConfirmedAt: formatAdminDateTime(order.buyer_confirmed_at),
      buyerConfirmedAtIso: order.buyer_confirmed_at,
      stripePaymentIntentId: order.stripe_payment_intent_id,
      transferredAt: transferredAtLabel,
      transferredAtIso,
      createdAt: transferredAtLabel,
    };
  });
}

function sortMerchantTransferRows(
  rows: MerchantTransferRow[],
  sort: MerchantTransferSort | undefined,
): MerchantTransferRow[] {
  if (!sort || sort === "transferred_at-desc") {
    return [...rows].sort((a, b) => {
      const aMs = a.transferredAtIso
        ? new Date(a.transferredAtIso).getTime()
        : 0;
      const bMs = b.transferredAtIso
        ? new Date(b.transferredAtIso).getTime()
        : 0;
      return bMs - aMs;
    });
  }

  if (sort === "transferred_at-asc") {
    return [...rows].sort((a, b) => {
      const aMs = a.transferredAtIso
        ? new Date(a.transferredAtIso).getTime()
        : 0;
      const bMs = b.transferredAtIso
        ? new Date(b.transferredAtIso).getTime()
        : 0;
      return aMs - bMs;
    });
  }

  if (sort === "merchantName-asc") {
    return [...rows].sort((a, b) =>
      a.merchantName.localeCompare(b.merchantName, "zh-HK"),
    );
  }

  return [...rows].sort((a, b) =>
    b.merchantName.localeCompare(a.merchantName, "zh-HK"),
  );
}

async function fetchMerchantTransferStatusCounts(
  input: ListAdminMerchantTransfersInput,
  searchMerchantIds: string[],
): Promise<MerchantTransferStatusCounts> {
  const admin = createAdminClient();
  const baseInput = { ...input, statusFilter: undefined };

  const countWithStatus = async (
    statusFilter: MerchantTransferStatusFilter,
  ): Promise<number> => {
    const query = applyMerchantTransferFilters(
      admin.from("merchant_orders").select("*", { count: "exact", head: true }),
      { ...baseInput, statusFilter },
      searchMerchantIds,
    );

    const { count, error } = await query;
    if (error) {
      console.error(
        "[fetchMerchantTransferStatusCounts]",
        statusFilter,
        error,
      );
      return 0;
    }
    return count ?? 0;
  };

  const [all, paid, processing, pending, failed] = await Promise.all([
    countWithStatus("all"),
    countWithStatus("paid"),
    countWithStatus("processing"),
    countWithStatus("pending"),
    countWithStatus("failed"),
  ]);

  return { all, paid, processing, pending, failed };
}

function emptyMerchantTransferPage(
  page: number,
  pageSize: number,
): MerchantTransferPage {
  return {
    rows: [],
    total: 0,
    page,
    pageSize,
    totalPages: 0,
    statusCounts: { ...EMPTY_MERCHANT_TRANSFER_STATUS_COUNTS },
  };
}

async function fetchMerchantTransferPage(
  input: ListAdminMerchantTransfersInput,
): Promise<MerchantTransferPage> {
  const admin = createAdminClient();
  const page = resolvePage(input.page);
  const pageSize = resolvePageSize(input.pageSize);
  const sort = input.sort ?? "transferred_at-desc";
  const searchMerchantIds = input.search
    ? await resolveSearchMerchantIds(admin, input.search)
    : [];

  const statusCountsPromise = fetchMerchantTransferStatusCounts(
    input,
    searchMerchantIds,
  );

  if (isMerchantNameSort(sort)) {
    const baseQuery = applyMerchantTransferFilters(
      admin.from("merchant_orders").select(MERCHANT_ORDER_SELECT),
      input,
      searchMerchantIds,
    );

    const { data: orders, error } = await baseQuery.limit(
      MERCHANT_NAME_SORT_FETCH_CAP,
    );

    if (error || !orders) {
      console.error("[listAdminMerchantTransfers] merchant name sort", error);
      return emptyMerchantTransferPage(page, pageSize);
    }

    const [enriched, statusCounts] = await Promise.all([
      enrichMerchantTransferRows(orders as MerchantOrderRow[]),
      statusCountsPromise,
    ]);
    const sorted = sortMerchantTransferRows(enriched, sort);
    const total = sorted.length;
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const safePage = totalPages === 0 ? 1 : Math.min(page, totalPages);
    const offset = (safePage - 1) * pageSize;

    return {
      rows: sorted.slice(offset, offset + pageSize),
      total,
      page: safePage,
      pageSize,
      totalPages,
      statusCounts,
    };
  }

  const offset = (page - 1) * pageSize;
  const ascending = sort === "transferred_at-asc";

  const listQuery = applyMerchantTransferFilters(
    admin.from("merchant_orders").select(MERCHANT_ORDER_SELECT, {
      count: "exact",
    }),
    input,
    searchMerchantIds,
  )
    .order("transferred_at", { ascending, nullsFirst: false })
    .range(offset, offset + pageSize - 1);

  const [{ data: orders, count, error }, statusCounts] = await Promise.all([
    listQuery,
    statusCountsPromise,
  ]);

  if (error || !orders) {
    console.error("[listAdminMerchantTransfers] merchant_orders", error);
    return emptyMerchantTransferPage(page, pageSize);
  }

  const total = count ?? 0;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const rows = await enrichMerchantTransferRows(orders as MerchantOrderRow[]);

  return {
    rows,
    total,
    page,
    pageSize,
    totalPages,
    statusCounts,
  };
}

export async function listAdminMerchantTransfers(
  input: ListAdminMerchantTransfersInput = {},
): Promise<ListAdminMerchantTransfersResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  try {
    const data = await fetchMerchantTransferPage({
      ...input,
      page: resolvePage(input.page),
      pageSize: resolvePageSize(input.pageSize),
      sort: input.sort ?? "transferred_at-desc",
    });
    return { success: true, data };
  } catch (error) {
    console.error("[listAdminMerchantTransfers]", error);
    return { success: false, error: "無法載入商戶流水" };
  }
}

export async function listAdminMerchantTransfersForExport(
  input: Omit<ListAdminMerchantTransfersInput, "page" | "pageSize">,
): Promise<ListAdminMerchantTransfersResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  try {
    const firstPage = await fetchMerchantTransferPage({
      ...input,
      page: 1,
      pageSize: 1,
    });

    const exportSize = Math.min(
      firstPage.total,
      MERCHANT_TRANSFERS_EXPORT_CAP,
    );

    if (exportSize === 0) {
      return {
        success: true,
        data: emptyMerchantTransferPage(1, MERCHANT_TRANSFERS_PAGE_SIZE),
      };
    }

    const data = await fetchMerchantTransferPage({
      ...input,
      page: 1,
      pageSize: exportSize,
    });

    return { success: true, data };
  } catch (error) {
    console.error("[listAdminMerchantTransfersForExport]", error);
    return { success: false, error: "無法導出商戶流水" };
  }
}

async function buildStripeBalanceSection(): Promise<{
  stripeBalance: AdminPayoutsPageData["stripeBalance"];
  stripeBalanceError?: string;
}> {
  const [balanceResult, todayInResult] = await Promise.all([
    getPlatformStripeBalance(),
    getPlatformStripeTodayInflow(),
  ]);

  if (!balanceResult.ok) {
    return {
      stripeBalance: null,
      stripeBalanceError: balanceResult.error,
    };
  }

  const errors: string[] = [];
  if (!todayInResult.ok && todayInResult.error) {
    errors.push(todayInResult.error);
  }

  return {
    stripeBalance: {
      available: balanceResult.data.available,
      pending: balanceResult.data.pending,
      todayIn: todayInResult.todayIn,
      currency: "HKD",
      lastSyncedAt: balanceResult.data.lastSyncedAt,
    },
    stripeBalanceError: errors.length > 0 ? errors.join("；") : undefined,
  };
}

export async function getAdminPayoutsPageData(): Promise<AdminPayoutsPageResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  try {
    const stripeSection = await buildStripeBalanceSection();

    return {
      success: true,
      data: {
        stripeBalance: stripeSection.stripeBalance,
        stripeBalanceError: stripeSection.stripeBalanceError,
      },
    };
  } catch (error) {
    console.error("[getAdminPayoutsPageData]", error);
    return { success: false, error: "無法載入財務資料" };
  }
}

export async function refreshAdminStripeBalance(): Promise<
  { success: true } | { success: false; error: string }
> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  revalidatePath("/admin/payouts");
  return { success: true };
}

export async function getAdminFpsBatchSchedule() {
  return getNextBatchSchedule();
}
