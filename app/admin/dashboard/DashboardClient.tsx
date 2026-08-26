"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { getAdminSystemHealthStatus } from "@/app/actions/admin-dashboard";
import {
  BTN_OUTLINE_SM_CLASS,
  FORM_SECTION_CLASS,
} from "@/app/admin/campaigns/campaigns-ui";
import type {
  AdminDashboardMetrics,
  AdminDashboardSystemService,
} from "@/lib/admin-dashboard/types";

type AdminDashboardClientProps = {
  metrics: AdminDashboardMetrics | null;
  loadError: string | null;
  initialServices: AdminDashboardSystemService[];
  healthLoadError: string | null;
};

type DashboardTodoItem = {
  id: string;
  label: string;
  count: number;
  onClick: () => void;
  countClassName?: string;
};

const EMPTY_METRICS: AdminDashboardMetrics = {
  userEcology: {
    totalUsers: 0,
    totalUsersFormatted: "0",
    bannedUsers: null,
    activeRatio: null,
    activeCount: null,
    distribution: [],
  },
  marketVolume: {
    totalGmv: "HK$ 0",
    settledCount: "0 筆",
    listingCount: "0 件",
    growthRate: null,
  },
  revenues: {
    totalCommission: "HK$ 0",
    monthlyCommission: "HK$ 0",
    commissionRate: "8.0%",
    commissionGrowth: null,
    appraisalTotal: "HK$ 0",
    appraisalFeePerCard: "HK$ 150",
    totalAppraisals: "0 筆",
  },
  stripeBalance: {
    availableFormatted: "—",
    pendingFormatted: "—",
    currency: "HKD",
    lastSyncedAt: new Date(0).toISOString(),
    unavailable: true,
    unavailableReason: null,
  },
  alerts: {
    unprocessedReports: 0,
    pendingKyc: 0,
    pendingGrading: 0,
  },
  syncedAt: new Date(0).toISOString(),
};

function formatSyncedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return `${date.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })} ${date.toLocaleTimeString("zh-TW", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })}`;
}

function hasGrowthValue(value: string | null): boolean {
  if (!value) return false;
  const normalized = value.trim().toUpperCase();
  return normalized !== "N/A" && normalized !== "—";
}

function formatOptionalMetric(value: string | null): string {
  return value ?? "—";
}

function serviceStatusDotClass(
  status: AdminDashboardSystemService["status"],
): string {
  if (status === "offline") return "bg-warning";
  if (status === "degraded") return "bg-brand";
  return "bg-success";
}

function serviceStatusChipClass(
  status: AdminDashboardSystemService["status"],
): string {
  if (status === "offline") {
    return "border-warning/30 bg-warning/5";
  }
  if (status === "degraded") {
    return "border-brand/30 bg-brand/5";
  }
  return "border-white/[0.08]";
}

function serviceStatusLabel(
  status: AdminDashboardSystemService["status"],
): string | null {
  if (status === "offline") return "離線";
  if (status === "degraded") return "降級";
  return null;
}

function formatHealthToastDescription(
  services: AdminDashboardSystemService[],
): string {
  const offline = services.filter((service) => service.status === "offline");
  const degraded = services.filter((service) => service.status === "degraded");

  if (offline.length > 0) {
    return `離線：${offline.map((service) => service.name).join("、")}`;
  }

  if (degraded.length > 0) {
    return `降級：${degraded.map((service) => service.name).join("、")}`;
  }

  const maxLatency = Math.max(...services.map((service) => service.latency), 0);
  return `後台 Supabase、Stripe 及爬蟲引擎已檢測 (最高延遲 ${maxLatency}ms)`;
}

export default function AdminDashboardClient({
  metrics,
  loadError,
  initialServices,
  healthLoadError,
}: AdminDashboardClientProps) {
  const router = useRouter();
  const [isRefreshingMetrics, startMetricsRefresh] = useTransition();

  const dashboardMetrics = metrics ?? EMPTY_METRICS;
  const userEcology = dashboardMetrics.userEcology;
  const marketVolume = dashboardMetrics.marketVolume;
  const revenues = dashboardMetrics.revenues;
  const stripeBalance = dashboardMetrics.stripeBalance;
  const unprocessedReports = dashboardMetrics.alerts.unprocessedReports;
  const pendingKyc = dashboardMetrics.alerts.pendingKyc;
  const pendingGrading = dashboardMetrics.alerts.pendingGrading;

  const [services, setServices] = useState<AdminDashboardSystemService[]>(
    initialServices,
  );
  const [isRefreshingServices, startServicesRefresh] = useTransition();

  const syncedAtLabel = isRefreshingMetrics
    ? "更新中…"
    : metrics?.syncedAt
      ? `最後同步：${formatSyncedAt(metrics.syncedAt)}`
      : "最後同步：—";

  const todoItems = useMemo(() => {
    const items: DashboardTodoItem[] = [];

    if (unprocessedReports > 0) {
      items.push({
        id: "disputes",
        label: "未處理爭議",
        count: unprocessedReports,
        onClick: () => router.push("/admin/disputes?status=pending"),
        countClassName: "text-warning",
      });
    }

    if (pendingKyc > 0) {
      items.push({
        id: "kyc",
        label: "KYC 待審核",
        count: pendingKyc,
        onClick: () => router.push("/admin/merchants"),
        countClassName: "text-brand",
      });
    }

    if (pendingGrading > 0) {
      items.push({
        id: "grading",
        label: "鑑定待處理",
        count: pendingGrading,
        onClick: () => router.push("/admin/grading"),
        countClassName:
          pendingGrading >= 10 ? "text-brand font-bold" : "text-text-primary",
      });
    }

    return items;
  }, [
    unprocessedReports,
    pendingKyc,
    pendingGrading,
    router,
  ]);

  const handleRefreshMetrics = () => {
    startMetricsRefresh(() => {
      router.refresh();
    });
  };

  const handleRefreshServices = () => {
    startServicesRefresh(async () => {
      const result = await getAdminSystemHealthStatus();
      if (!result.success) {
        toast.error("系統服務狀態檢測失敗", {
          description: result.error,
        });
        return;
      }

      setServices(result.data.services);
      const hasOffline = result.data.services.some(
        (service) => service.status === "offline",
      );
      const hasDegraded = result.data.services.some(
        (service) => service.status === "degraded",
      );

      if (hasOffline) {
        toast.error("部分系統服務離線", {
          description: formatHealthToastDescription(result.data.services),
        });
        return;
      }

      if (hasDegraded) {
        toast.warning("部分系統服務降級", {
          description: formatHealthToastDescription(result.data.services),
        });
        return;
      }

      toast.success("系統服務狀態已更新", {
        description: formatHealthToastDescription(result.data.services),
      });
    });
  };

  return (
    <div className="space-y-5 pb-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">
              數據總覽
            </h1>
            <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-brand">
              DASHBOARD
            </span>
          </div>
          <p className="mt-1 font-mono text-[12px] text-text-secondary">
            {syncedAtLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={handleRefreshMetrics}
          disabled={isRefreshingMetrics}
          className={`${BTN_OUTLINE_SM_CLASS} shrink-0 gap-1.5 text-brand border-brand/30 disabled:opacity-60`}
        >
          <RefreshCw
            className={`size-3.5 ${isRefreshingMetrics ? "animate-spin" : ""}`}
          />
          重新整理數據
        </button>
      </header>

      {loadError ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 font-sans text-[13px] text-warning">
          {loadError}
        </div>
      ) : null}

      {healthLoadError ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 font-sans text-[13px] text-warning">
          {healthLoadError}
        </div>
      ) : null}

      <section className="space-y-4 border-b border-white/[0.08] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className={FORM_SECTION_CLASS}>核心營收與 GMV KPI</h2>
          <span className="rounded-lg border border-brand/20 bg-brand/10 px-2.5 py-0.5 font-mono text-[10px] text-brand">
            佣金率 {revenues.commissionRate}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="space-y-4">
            <p className="font-sans text-[12px] font-semibold text-text-secondary">
              平台淨營收
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
                  佣金
                </span>
                <p className="mt-1 font-mono text-[22px] font-bold tracking-tight text-text-primary">
                  {revenues.totalCommission}
                </p>
                <p className="mt-1 font-mono text-[10px] text-text-secondary">
                  本月 {revenues.monthlyCommission}
                </p>
                {hasGrowthValue(revenues.commissionGrowth) ? (
                  <span className="mt-1 inline-flex items-center gap-0.5 rounded border border-success/20 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success">
                    <TrendingUp className="size-3" />
                    {revenues.commissionGrowth}
                  </span>
                ) : null}
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
                  鑑定費用
                </span>
                <p className="mt-1 font-mono text-[22px] font-bold tracking-tight text-text-primary">
                  {revenues.appraisalTotal}
                </p>
                <p className="mt-1 font-mono text-[10px] text-text-secondary">
                  {revenues.totalAppraisals} · {revenues.appraisalFeePerCard}/件
                </p>
              </div>
            </div>
            <p className="border-t border-white/[0.06] pt-3 font-mono text-[10px] text-text-disabled">
              Stripe 可用 {stripeBalance.availableFormatted}
              <span className="mx-1.5 text-white/20">·</span>
              待結算 {stripeBalance.pendingFormatted}
              {stripeBalance.unavailable ? (
                <span className="mt-1 block text-warning">
                  {stripeBalance.unavailableReason ?? "餘額暫不可用"}
                </span>
              ) : null}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-sans text-[12px] font-semibold text-text-secondary">
                交易量分析
              </p>
              {hasGrowthValue(marketVolume.growthRate) ? (
                <span className="inline-flex items-center gap-0.5 rounded border border-success/20 bg-success/10 px-1.5 py-0.5 font-mono text-[10px] text-success">
                  <TrendingUp className="size-3" />
                  {marketVolume.growthRate} vs 上月
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
                  總成交
                </span>
                <p className="mt-1 font-mono text-[20px] font-bold text-brand">
                  {marketVolume.totalGmv}
                </p>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
                  成交量
                </span>
                <p className="mt-1 font-mono text-[18px] font-bold text-text-primary">
                  {marketVolume.settledCount}
                </p>
              </div>
              <div>
                <span className="block font-mono text-[10px] uppercase tracking-wide text-text-disabled">
                  現貨總數
                </span>
                <p className="mt-1 font-mono text-[18px] font-bold text-text-primary">
                  {marketVolume.listingCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 border-b border-white/[0.08] pb-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className={FORM_SECTION_CLASS}>用戶生態大盤</h2>
            <p className="mt-1 font-sans text-[12px] text-text-secondary">
              全平台會員角色分佈
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-success/20 bg-success/10 px-2.5 py-1 font-mono text-[10px] text-success">
              活躍 {formatOptionalMetric(userEcology.activeRatio)} (
              {formatOptionalMetric(userEcology.activeCount)})
            </span>
            <span className="rounded-lg border border-warning/20 bg-warning/10 px-2.5 py-1 font-mono text-[10px] text-warning">
              已封鎖 {formatOptionalMetric(
                userEcology.bannedUsers === null
                  ? null
                  : String(userEcology.bannedUsers),
              )}
            </span>
          </div>
        </div>

        <div className="mx-auto max-w-sm">
          <div className="relative flex h-[160px] w-full items-center justify-center sm:h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={userEcology.distribution}
                  dataKey="count"
                  nameKey="role"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={76}
                  paddingAngle={3}
                  stroke="none"
                >
                  {userEcology.distribution.map((entry) => (
                    <Cell
                      key={entry.key}
                      fill={entry.color}
                      className="transition-opacity hover:opacity-80"
                    />
                  ))}
                </Pie>
                <Tooltip
                  wrapperStyle={{ zIndex: 50 }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="space-y-1 rounded-lg border border-white/10 bg-bg-card p-2.5 font-mono text-[12px] shadow-xl">
                          <p
                            className="font-sans font-bold text-text-primary"
                            style={{ color: data.color }}
                          >
                            {data.role}
                          </p>
                          <p className="text-text-secondary">
                            數量{" "}
                            <span className="font-bold text-text-primary">
                              {data.formattedCount}
                            </span>
                          </p>
                          <p className="text-text-secondary">
                            佔比{" "}
                            <span className="font-bold text-text-primary">
                              {data.pctStr}
                            </span>
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-[10px] text-text-disabled">
                總註冊用戶
              </span>
              <span className="mt-0.5 font-mono text-[24px] font-bold leading-none tracking-tight text-text-primary">
                {userEcology.totalUsersFormatted}
              </span>
            </div>
          </div>

          <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
            {userEcology.distribution.map((item) => (
              <span
                key={item.key}
                className="font-mono text-[10px] text-text-secondary"
              >
                <span style={{ color: item.color }}>●</span>{" "}
                {item.role.split(" ")[0]} {item.pctStr}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 border-b border-white/[0.08] pb-3">
          <h2 className={`${FORM_SECTION_CLASS} shrink-0`}>系統運作狀態</h2>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-2">
            {services.map((service) => {
              const statusLabel = serviceStatusLabel(service.status);
              return (
                <div
                  key={service.id}
                  title={
                    statusLabel
                      ? `${service.name}：${statusLabel}`
                      : service.name
                  }
                  className={`flex min-w-0 max-w-[9.5rem] items-center gap-1.5 rounded-lg border px-2 py-1.5 ${serviceStatusChipClass(service.status)}`}
                >
                  <span
                    className={`size-1.5 shrink-0 rounded-full ${serviceStatusDotClass(service.status)}`}
                  />
                  <span className="truncate font-sans text-[11px] text-text-secondary">
                    {service.name}
                  </span>
                  {statusLabel ? (
                    <span
                      className={`shrink-0 font-mono text-[9px] ${
                        service.status === "offline"
                          ? "text-warning"
                          : "text-brand"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  ) : null}
                </div>
              );
            })}
            <button
              type="button"
              onClick={handleRefreshServices}
              disabled={isRefreshingServices}
              className={`${BTN_OUTLINE_SM_CLASS} shrink-0 gap-1 px-2 py-1 text-[11px] text-text-secondary disabled:opacity-60`}
            >
              <RefreshCw
                className={`size-3 ${isRefreshingServices ? "animate-spin" : ""}`}
              />
              檢測
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <h2 className={FORM_SECTION_CLASS}>待辦</h2>
          {todoItems.length === 0 ? (
            <p className="py-6 text-center font-sans text-[13px] text-text-secondary">
              暫無待處理項目
            </p>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {todoItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className="flex w-full items-center justify-between gap-3 px-1 py-3 text-left transition-colors hover:bg-brand/5"
                >
                  <span className="font-sans text-[13px] text-text-primary">
                    {item.label}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span
                      className={`font-mono text-[13px] tabular-nums ${item.countClassName ?? "text-text-primary"}`}
                    >
                      {item.count.toLocaleString("en-US")}
                    </span>
                    <span className="font-sans text-[11px] text-brand">
                      前往
                      <ArrowRight className="ml-0.5 inline size-3" />
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
