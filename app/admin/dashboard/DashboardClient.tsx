"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  ShieldAlert,
  Users,
  Wallet,
  Activity,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { getAdminSystemHealthStatus } from "@/app/actions/admin-dashboard";
import { Button } from "@/components/ui/button";
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

function formatGrowthLabel(value: string | null): string {
  return value ?? "N/A";
}

function formatOptionalMetric(value: string | null): string {
  return value ?? "—";
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
  const pendingKycCount =
    userEcology.distribution.find((segment) => segment.key === "pending")
      ?.count ?? 0;
  const ecologySummary = userEcology.distribution
    .map((segment) => `${segment.role.split(" ")[0]} (${segment.pctStr})`)
    .join(" | ");

  // State for system services latency check
  const [services, setServices] = useState<AdminDashboardSystemService[]>(
    initialServices,
  );
  const [isRefreshingServices, startServicesRefresh] = useTransition();

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

  const handleAlertClick = () => {
    router.push("/admin/disputes?status=pending");
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* ── Page Title Header ────────────────────────────────────────── */}
      <div className="flex flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans font-bold text-[22px] sm:text-[26px] text-text-primary tracking-tight">
              數據總覽
            </h1>
            <span className="rounded-full bg-brand/10 border border-brand/20 text-brand px-2.5 py-0.5 font-mono text-[11px] font-medium">
              LIVE MONITOR
            </span>
          </div>
          <p className="font-mono text-[12px] text-text-secondary mt-1">
            最後同步：{formatSyncedAt(dashboardMetrics.syncedAt)}
          </p>
        </div>

        {/* Action button header */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshMetrics}
            disabled={isRefreshingMetrics}
            className="border-[rgba(237,232,224,0.12)] bg-bg-card hover:bg-bg-hover text-text-primary text-[12px] h-9 gap-1.5 active:scale-[0.98]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-brand ${
                isRefreshingMetrics ? "animate-spin" : ""
              }`}
            />
            重新整理數據
          </Button>
        </div>
      </div>

      {loadError ? (
        <p>{loadError}</p>
      ) : null}

      {healthLoadError ? (
        <p>{healthLoadError}</p>
      ) : null}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 1. 頂部黃金視覺區 (Top Hero Zone): 平台營收與交易量 KPI 大卡片 */}
      {/* ────────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans font-semibold text-[13px] text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-brand" />
            核心營收與 GMV KPI
          </span>
        </div>

        <div className="flex flex-col gap-6">
          {/* CARD A: 平台淨營收統計 (Net Revenues) */}
          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 relative overflow-hidden group hover:border-[rgba(212,165,116,0.3)] transition-all">
            {/* Background subtle gold glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

            {/* Card A Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="font-sans font-semibold text-[14px] text-text-secondary">
                  平台淨營收統計
                </span>
              </div>
              <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] border border-brand/20 px-2.5 py-0.5 rounded-full font-medium">
                佣金率 {revenues.commissionRate}
              </span>
            </div>

            <div className="space-y-5">
              {/* Upper block: 佣金 */}
              <div>
                <span className="font-sans font-semibold text-[13px] text-text-secondary block mb-2">
                  佣金
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono font-bold text-[30px] sm:text-[32px] text-text-primary tracking-tight leading-none">
                    {revenues.totalCommission}
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-mono text-[12px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3" />
                    {formatGrowthLabel(revenues.commissionGrowth)}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  本月佣金收益：{revenues.monthlyCommission}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.08]" />

              {/* Lower block: 鑑定費用 */}
              <div>
                <span className="font-sans font-semibold text-[13px] text-text-secondary block mb-2">
                  鑑定費用
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono font-bold text-[30px] sm:text-[32px] text-text-primary tracking-tight leading-none">
                    {revenues.appraisalTotal}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  已鑑定卡數：{revenues.totalAppraisals} · 單件鑑定費：{revenues.appraisalFeePerCard}
                </p>
              </div>

              {/* Divider */}
              <div className="border-t border-white/[0.08]" />

              {/* Third block: Stripe 平台帳戶餘額 */}
              <div>
                <span className="font-sans font-semibold text-[13px] text-text-secondary block mb-2">
                  Stripe 平台帳戶餘額
                </span>
                <div className="flex items-baseline gap-2.5">
                  <span className="font-mono font-bold text-[30px] sm:text-[32px] text-brand tracking-tight leading-none">
                    {stripeBalance.availableFormatted}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  <p className="font-mono text-[11px] text-text-secondary">
                    可用餘額 (Available){" "}
                    <span className="font-mono text-text-primary">
                      {stripeBalance.availableFormatted}
                    </span>
                  </p>
                  <p className="font-mono text-[11px] text-text-secondary">
                    待結算 (Pending){" "}
                    <span className="font-mono text-text-primary">
                      {stripeBalance.pendingFormatted}
                    </span>
                  </p>
                  <p className="font-mono text-[11px] text-text-secondary">
                    幣種{" "}
                    <span className="font-mono text-text-primary">
                      {stripeBalance.currency}
                    </span>
                  </p>
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  {stripeBalance.unavailable
                    ? (stripeBalance.unavailableReason ??
                      "Stripe Connect 官方即時可用清算資金")
                    : "Stripe Connect 官方即時可用清算資金"}
                </p>
              </div>
            </div>
          </div>

          {/* CARD B: 交易量分析 (GMV & Volume) */}
          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 relative overflow-hidden group hover:border-[rgba(212,165,116,0.3)] transition-all">
            {/* Background subtle gold glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Card B Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Briefcase className="w-4 h-4" />
                </div>
                <span className="font-sans font-semibold text-[14px] text-text-secondary">
                  交易量分析
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {formatGrowthLabel(marketVolume.growthRate)} vs 上月
              </span>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                  總成交 (GMV)
                </span>
                <span className="font-mono font-bold text-[26px] sm:text-[28px] text-brand tracking-tight leading-none block mt-1">
                  {marketVolume.totalGmv}
                </span>
              </div>
              <div>
                <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                  成交量
                </span>
                <span className="font-mono font-bold text-[18px] sm:text-[20px] text-text-primary tracking-tight leading-none block mt-1">
                  {marketVolume.settledCount}
                </span>
              </div>
              <div>
                <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                  現貨總數
                </span>
                <span className="font-mono font-bold text-[18px] sm:text-[20px] text-text-primary tracking-tight leading-none block mt-1">
                  {marketVolume.listingCount}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 2. 中段視覺區 (Mid Zone): 用戶生態大盤 (簡潔視覺化圖表)        */}
      {/* ────────────────────────────────────────────────────────────── */}
      <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 sm:p-6 space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(237,232,224,0.08)] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-brand" />
              <h2 className="font-sans font-bold text-[16px] sm:text-[18px] text-text-primary">
                用戶生態大盤
              </h2>
            </div>
            <p className="font-mono text-[12px] text-text-secondary mt-0.5">
              全平台會員角色分佈與審核動態
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              活躍用戶比率 {formatOptionalMetric(userEcology.activeRatio)} (
              {formatOptionalMetric(userEcology.activeCount)})
            </span>
            <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
              已封鎖 {formatOptionalMetric(
                userEcology.bannedUsers === null
                  ? null
                  : String(userEcology.bannedUsers),
              )}{" "}
              戶
            </span>
          </div>
        </div>

        {/* Main Metric Hero inside Zone 2 */}
        <div className="max-w-2xl mx-auto">
          {/* Donut Chart Visualization */}
          <div className="flex flex-col items-center justify-center p-3 bg-bg-page/50 rounded-xl border border-[rgba(237,232,224,0.06)] relative">
            <div className="w-full h-[200px] sm:h-[220px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={userEcology.distribution}
                    dataKey="count"
                    nameKey="role"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {userEcology.distribution.map((entry) => (
                      <Cell
                        key={entry.key}
                        fill={entry.color}
                        className="transition-all duration-300 hover:opacity-80"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    wrapperStyle={{ zIndex: 50 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-bg-elevated border border-[rgba(237,232,224,0.12)] p-2.5 rounded-lg shadow-xl font-mono text-[12px] space-y-1">
                            <p
                              className="font-sans font-bold text-text-primary"
                              style={{ color: data.color }}
                            >
                              {data.role}
                            </p>
                            <p className="text-text-secondary">
                              數量:{" "}
                              <span className="text-text-primary font-bold">
                                {data.formattedCount} 人
                              </span>
                            </p>
                            <p className="text-text-secondary">
                              佔比:{" "}
                              <span className="text-text-primary font-bold">
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

              {/* Donut Center Label */}
              <div className="absolute inset-0 z-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="font-mono text-[10px] text-text-disabled uppercase">
                  總註冊用戶量
                </span>
                <span className="font-mono font-bold text-[24px] text-text-primary tracking-tight leading-none mt-0.5">
                  {userEcology.totalUsersFormatted}
                </span>
                <span className="font-mono text-[10px] text-brand mt-0.5">
                  USER ECOLOGY
                </span>
              </div>
            </div>

            {/* Segmented Progress Bar underneath Donut */}
            <div className="w-full mt-2 space-y-1">
              <div className="h-2 w-full bg-bg-elevated rounded-full overflow-hidden flex gap-0.5 p-0.5 border border-[rgba(237,232,224,0.06)]">
                {userEcology.distribution.map((item) => (
                  <div
                    key={item.key}
                    style={{
                      width: `${item.pct}%`,
                      backgroundColor: item.color,
                    }}
                    className="h-full rounded-full transition-all hover:brightness-110"
                    title={`${item.role}: ${item.pctStr}`}
                  />
                ))}
              </div>
              <p className="text-center font-mono text-[10px] text-text-secondary">
                {ecologySummary || "—"}
              </p>
            </div>
          </div>

          {/* Merchant onboarding queue footer */}
          <div className="flex items-center justify-between bg-bg-page/40 rounded-xl px-4 py-2.5 border border-[rgba(237,232,224,0.06)] font-mono text-[11px]">
            <span className="text-text-secondary flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              商戶審核隊列：
              <span className="text-text-primary font-medium">
                {pendingKycCount} 件待審核
              </span>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/user_control")}
              className="text-brand hover:text-brand-hover p-0 h-auto font-mono text-[11px] hover:bg-transparent gap-1"
            >
              前往審核商戶 <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </section>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 3. 底部互動區 (Bottom Zone): 系統運作狀態與未處理緊急警報       */}
      {/* ────────────────────────────────────────────────────────────── */}
      <section className="space-y-4">
        {/* Status Indicators (紅綠燈指標) */}
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <div className="flex flex-row items-center justify-between gap-3 mb-4 border-b border-[rgba(237,232,224,0.08)] pb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="font-sans font-semibold text-[14px] sm:text-[15px] text-text-primary">
                系統運作狀態 (紅綠燈指標)
              </h2>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshServices}
              disabled={isRefreshingServices}
              className="border-[rgba(237,232,224,0.1)] bg-bg-page hover:bg-bg-hover text-text-secondary text-[11px] h-7 px-2.5 gap-1.5"
            >
              <RefreshCw
                className={`w-3 h-3 text-emerald-400 ${
                  isRefreshingServices ? "animate-spin" : ""
                }`}
              />
              實時檢測
            </Button>
          </div>

          {/* 3 Core Background Infrastructure Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-bg-page rounded-xl border border-[rgba(237,232,224,0.06)] px-4 py-3 flex items-center justify-between hover:border-[rgba(237,232,224,0.12)] transition-colors"
              >
                <div>
                  <span className="font-sans text-[13px] font-medium text-text-primary block">
                    {service.name}
                  </span>
                  <span className="font-mono text-[10px] text-text-disabled block">
                    {service.subName}
                  </span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-[12px] text-emerald-400 font-medium flex items-center justify-end gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    正常
                  </span>
                  <span className="font-mono text-[10px] text-text-secondary block">
                    {service.latency}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── 未處理緊急警報數 (Red Alert Badge Action Button) ──────────────── */}
        {/* Placed prominently in the mobile thumb zone & desktop banner */}
        {unprocessedReports > 0 ? (
        <div className="sticky bottom-4 sm:relative sm:bottom-0 z-30">
          <div className="w-full bg-gradient-to-r from-rose-950/90 via-bg-card to-rose-950/80 rounded-2xl border-2 border-rose-500/40 hover:border-rose-500 p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              {/* Pulsating Alert Icon */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                {unprocessedReports > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500" />
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-sans font-bold text-[15px] sm:text-[16px] text-white flex items-center gap-1.5">
                    🚨 未處理緊急警報：
                    <span className="font-mono text-rose-400 underline underline-offset-2">
                      {unprocessedReports} 件
                    </span>
                  </span>
                </div>
                <p className="font-sans text-[12px] text-rose-200/80 mt-0.5">
                  有 {unprocessedReports}{" "}
                  件高風險買賣爭議、品相申訴與私下交易舉報待人工仲裁處理
                </p>
              </div>
            </div>

            {/* CTA Action Trigger */}
            <div className="w-full sm:w-auto shrink-0 flex items-center justify-end">
              <Button
                onClick={handleAlertClick}
                type="button"
                className="w-full sm:w-auto bg-rose-600 hover:bg-rose-500 text-white font-sans font-semibold text-[13px] px-5 py-2.5 h-10 rounded-xl shadow-lg gap-2 group-hover:translate-x-0.5 transition-transform"
              >
                立即處理爭議
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
        ) : null}
      </section>
    </div>
  );
}
