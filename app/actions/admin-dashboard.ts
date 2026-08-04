"use server";

import { countAdminPendingGradingOrders } from "@/app/actions/admin-grading";
import {
  formatCountWithUnit,
  formatGrowthPct,
  formatHkd,
  formatIntegerCount,
  formatPercentRate,
  sumInRange,
} from "@/lib/admin-dashboard/format";
import {
  getHktMonthRange,
  getHktRollingWindowStartIso,
} from "@/lib/admin-dashboard/hkt-month-bounds";
import { runAdminDashboardHealthProbes } from "@/lib/admin-dashboard/health-probes";
import type {
  AdminDashboardEcologySegment,
  AdminDashboardHealthResult,
  AdminDashboardMetrics,
  AdminDashboardMetricsResult,
} from "@/lib/admin-dashboard/types";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getPlatformStripeBalance } from "@/lib/stripe/platform-balance";

const ECOLOGY_COLORS = {
  user: "#D4A574",
  merchant: "#10B981",
  pending: "#F59E0B",
} as const;

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

async function fetchProfileCount(role?: "member" | "merchant"): Promise<number> {
  const admin = createAdminClient();
  let query = admin.from("profiles").select("id", { count: "exact", head: true });

  if (role) {
    query = query.eq("role", role);
  } else {
    query = query.neq("role", "admin");
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function fetchPendingKycCount(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("kyc_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function fetchActiveListingCount(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("listings")
    .select("id", { count: "exact", head: true })
    .eq("status", "active");

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

async function fetchUnprocessedReportsCount(): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .in("status", ["pending", "reviewing"]);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

function buildStripeBalanceMetrics(): AdminDashboardMetrics["stripeBalance"] {
  return {
    availableFormatted: "—",
    pendingFormatted: "—",
    currency: "HKD",
    lastSyncedAt: new Date().toISOString(),
    unavailable: true,
    unavailableReason: null,
  };
}

async function resolveStripeBalanceMetrics(): Promise<
  AdminDashboardMetrics["stripeBalance"]
> {
  const stripeResult = await getPlatformStripeBalance();

  if (!stripeResult.ok) {
    return {
      ...buildStripeBalanceMetrics(),
      unavailableReason: stripeResult.error,
    };
  }

  return {
    availableFormatted: formatHkd(stripeResult.data.available),
    pendingFormatted: formatHkd(stripeResult.data.pending),
    currency: "HKD",
    lastSyncedAt: stripeResult.data.lastSyncedAt,
    unavailable: false,
    unavailableReason: null,
  };
}

function buildEcologySegment(
  key: AdminDashboardEcologySegment["key"],
  role: string,
  count: number,
  denominator: number,
  description: string,
): AdminDashboardEcologySegment {
  const pct = denominator > 0 ? (count / denominator) * 100 : 0;

  return {
    key,
    role,
    count,
    formattedCount: formatIntegerCount(count),
    pct,
    pctStr: `${pct.toFixed(1)}%`,
    color: ECOLOGY_COLORS[key],
    description,
  };
}

function resolveOrderRecognitionAt(
  buyerConfirmedAt: string | null,
  updatedAt: string | null,
): string | null {
  return buyerConfirmedAt ?? updatedAt;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetricsResult> {
  const guard = await requireAdmin();
  if (!guard.ok) {
    return { success: false, error: guard.error };
  }

  try {
    const admin = createAdminClient();
    const currentMonth = getHktMonthRange(0);
    const previousMonth = getHktMonthRange(-1);
    const rolling90dStartIso = getHktRollingWindowStartIso(90);

    const [
      memberCount,
      merchantCount,
      pendingKycCount,
      totalUsers,
      listingCount,
      unprocessedReportsCount,
      pendingGradingResult,
      completedOrdersResult,
      capturedAuthFeesResult,
      stripeBalance,
    ] = await Promise.all([
      fetchProfileCount("member"),
      fetchProfileCount("merchant"),
      fetchPendingKycCount(),
      fetchProfileCount(),
      fetchActiveListingCount(),
      fetchUnprocessedReportsCount(),
      countAdminPendingGradingOrders(),
      admin
        .from("merchant_orders")
        .select(
          "item_subtotal, commission_amount, commission_rate_applied, buyer_confirmed_at, updated_at",
        )
        .eq("escrow_status", "completed_and_transferred"),
      admin
        .from("merchant_orders")
        .select("auth_fee, auth_fee_captured_at")
        .not("auth_fee_captured_at", "is", null),
      resolveStripeBalanceMetrics(),
    ]);

    if (!pendingGradingResult.success) {
      return { success: false, error: pendingGradingResult.error };
    }

    if (completedOrdersResult.error) {
      console.error(
        "[getAdminDashboardMetrics] completed orders",
        completedOrdersResult.error.message,
      );
      return { success: false, error: "無法載入訂單統計" };
    }

    if (capturedAuthFeesResult.error) {
      console.error(
        "[getAdminDashboardMetrics] auth fees",
        capturedAuthFeesResult.error.message,
      );
      return { success: false, error: "無法載入鑑定費統計" };
    }

    const completedOrders = completedOrdersResult.data ?? [];
    const capturedAuthFees = capturedAuthFeesResult.data ?? [];

    const gmvRows = completedOrders.map((order) => ({
      amount: order.item_subtotal ?? 0,
      recognizedAt: resolveOrderRecognitionAt(
        order.buyer_confirmed_at,
        order.updated_at,
      ),
    }));

    const commissionRows = completedOrders.map((order) => ({
      amount: order.commission_amount ?? 0,
      recognizedAt: resolveOrderRecognitionAt(
        order.buyer_confirmed_at,
        order.updated_at,
      ),
    }));

    const authFeeRows = capturedAuthFees.map((order) => ({
      amount: order.auth_fee ?? 0,
      recognizedAt: order.auth_fee_captured_at,
    }));

    const totalGmv = gmvRows.reduce((sum, row) => sum + row.amount, 0);
    const totalCommission = commissionRows.reduce(
      (sum, row) => sum + row.amount,
      0,
    );
    const totalAppraisal = authFeeRows.reduce((sum, row) => sum + row.amount, 0);

    const currentMonthGmv = sumInRange(
      gmvRows,
      currentMonth.startIso,
      currentMonth.endIso,
    );
    const previousMonthGmv = sumInRange(
      gmvRows,
      previousMonth.startIso,
      previousMonth.endIso,
    );

    const currentMonthCommission = sumInRange(
      commissionRows,
      currentMonth.startIso,
      currentMonth.endIso,
    );
    const previousMonthCommission = sumInRange(
      commissionRows,
      previousMonth.startIso,
      previousMonth.endIso,
    );

    const recentCompletedOrders = completedOrders.filter((order) => {
      const recognizedAt = resolveOrderRecognitionAt(
        order.buyer_confirmed_at,
        order.updated_at,
      );
      if (!recognizedAt) {
        return false;
      }
      return Date.parse(recognizedAt) >= Date.parse(rolling90dStartIso);
    });

    const recentCommissionTotal = recentCompletedOrders.reduce(
      (sum, order) => sum + (order.commission_amount ?? 0),
      0,
    );
    const recentSubtotalTotal = recentCompletedOrders.reduce(
      (sum, order) => sum + (order.item_subtotal ?? 0),
      0,
    );

    const commissionRate =
      recentSubtotalTotal > 0
        ? formatPercentRate(recentCommissionTotal / recentSubtotalTotal)
        : "8.0%";

    const appraisalFeePerCard =
      capturedAuthFees.length > 0
        ? formatHkd(totalAppraisal / capturedAuthFees.length)
        : "HK$ 150";

    const ecologyDenominator = memberCount + merchantCount + pendingKycCount;
    const distribution: AdminDashboardEcologySegment[] = [
      buildEcologySegment(
        "user",
        "一般會員 (USER)",
        memberCount,
        ecologyDenominator,
        "個人買家與卡牌玩家",
      ),
      buildEcologySegment(
        "merchant",
        "認證商戶 (MERCHANT)",
        merchantCount,
        ecologyDenominator,
        "已通過企業或實體店驗證",
      ),
      buildEcologySegment(
        "pending",
        "待審核商戶",
        pendingKycCount,
        ecologyDenominator,
        "等待管理員人工資質審查",
      ),
    ];

    const data: AdminDashboardMetrics = {
      userEcology: {
        totalUsers,
        totalUsersFormatted: formatIntegerCount(totalUsers),
        bannedUsers: null,
        activeRatio: null,
        activeCount: null,
        distribution,
      },
      marketVolume: {
        totalGmv: formatHkd(totalGmv),
        settledCount: formatCountWithUnit(completedOrders.length, "筆"),
        listingCount: formatCountWithUnit(listingCount, "件"),
        growthRate: formatGrowthPct(currentMonthGmv, previousMonthGmv),
      },
      revenues: {
        totalCommission: formatHkd(totalCommission),
        monthlyCommission: formatHkd(currentMonthCommission),
        commissionRate,
        commissionGrowth: formatGrowthPct(
          currentMonthCommission,
          previousMonthCommission,
        ),
        appraisalTotal: formatHkd(totalAppraisal),
        appraisalFeePerCard,
        totalAppraisals: formatCountWithUnit(capturedAuthFees.length, "筆"),
      },
      stripeBalance,
      alerts: {
        unprocessedReports: unprocessedReportsCount,
        pendingKyc: pendingKycCount,
        pendingGrading: pendingGradingResult.data,
      },
      syncedAt: new Date().toISOString(),
    };

    return { success: true, data };
  } catch (error) {
    console.error("[getAdminDashboardMetrics]", error);
    return { success: false, error: "無法載入後台數據總覽" };
  }
}

export async function getAdminSystemHealthStatus(): Promise<AdminDashboardHealthResult> {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const services = await runAdminDashboardHealthProbes();
    return { success: true, data: { services } };
  } catch (error) {
    console.error("[getAdminSystemHealthStatus]", error);
    return { success: false, error: "無法檢測系統服務狀態" };
  }
}
