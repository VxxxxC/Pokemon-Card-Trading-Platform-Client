"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import {
  TrendingUp,
  ShieldAlert,
  Users,
  Wallet,
  Activity,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ArrowRight,
  CheckCircle2,
  Building2,
  DollarSign,
  Briefcase,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Mock metrics data aligned with master taxonomy
const userEcology = {
  totalUsers: 4829,
  totalUsersFormatted: "4,829",
  bannedUsers: 14,
  activeRatio: "64.2%",
  activeCount: "3,100",
  distribution: [
    {
      key: "user",
      role: "一般會員 (USER)",
      count: 4215,
      formattedCount: "4,215",
      pct: 87.3,
      pctStr: "87.3%",
      color: "#D4A574", // Warm Gold
      description: "個人買家與卡牌玩家",
    },
    {
      key: "merchant",
      role: "認證商戶 (MERCHANT)",
      count: 487,
      formattedCount: "487",
      pct: 10.1,
      pctStr: "10.1%",
      color: "#10B981", // Bullish Jade Green
      description: "已通過企業或實體店驗證",
    },
    {
      key: "pending",
      role: "待審核商戶",
      count: 118,
      formattedCount: "118",
      pct: 2.4,
      pctStr: "2.4%",
      color: "#F59E0B", // Amber Warning
      description: "等待管理員人工資質審查",
    },
  ],
};

const marketVolume = {
  totalGmv: "HK$ 24,840,000",
  monthlyGmv: "HK$ 3,842,000",
  growthRate: "+28.4%",
  totalSettledCount: "2,842 筆",
  pendingSettledCount: "148 筆",
  sellerPool: {
    totalListings: "18,402 件",
    activeListings: "12,104 件",
    averageListingPrice: "HK$ 2,050",
    escrowLockedAmount: "HK$ 1,840,000",
  },
};

const revenues = {
  totalCommission: "HK$ 1,242,000",
  monthlyCommission: "HK$ 192,100",
  commissionRate: "5.0%",
  commissionGrowth: "+5.2%",
  appraisalPool: "HK$ 482,000",
  appraisalFeePerCard: "HK$ 150",
  totalAppraisals: "3,213 筆",
  netPayoutPool: "HK$ 320,400",
};

interface SystemService {
  id: string;
  name: string;
  subName: string;
  status: "online" | "degraded" | "offline";
  latency: number;
}

const initialServices: SystemService[] = [
  {
    id: "supabase",
    name: "後台服務器 Supabase API",
    subName: "Database & Auth Engine",
    status: "online",
    latency: 28,
  },
  {
    id: "crawler",
    name: "SNKRDUNK / Mercari 爬蟲引擎",
    subName: "Market Real-time Aggregator",
    status: "online",
    latency: 142,
  },
  {
    id: "stripe",
    name: "Stripe API 金流網關",
    subName: "Escrow & Payout Gateway",
    status: "online",
    latency: 85,
  },
];

export default function AdminDashboardClient() {
  const router = useRouter();

  // Scroll ref and state for top KPI cards mobile indicator
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  const handleKPIContainerScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, clientWidth } = scrollContainerRef.current;
    if (clientWidth > 0) {
      const index = Math.round(scrollLeft / (clientWidth * 0.7));
      setActiveCardIndex(index >= 1 ? 1 : 0);
    }
  };

  // State for collapsible seller pool detail
  const [showSellerPoolDetails, setShowSellerPoolDetails] = useState(false);

  // State for system services latency check
  const [services, setServices] = useState<SystemService[]>(initialServices);
  const [isRefreshingServices, setIsRefreshingServices] = useState(false);

  // Selected cohort for interactive breakdown
  const [selectedCohort, setSelectedCohort] = useState<string | null>(null);

  // Urgent alerts count
  const unprocessedDisputes = 5;

  const handleRefreshServices = () => {
    setIsRefreshingServices(true);
    setTimeout(() => {
      setServices((prev) =>
        prev.map((s) => ({
          ...s,
          latency:
            Math.floor(Math.random() * 40) + (s.id === "crawler" ? 120 : 20),
        })),
      );
      setIsRefreshingServices(false);
      toast.success("系統服務狀態已更新", {
        description:
          "後台 Supabase, 爬蟲引擎及 Stripe 金流連線正常 (Latency < 200ms)",
      });
    }, 600);
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
            最後同步：
            {new Date().toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            })}{" "}
            {new Date().toLocaleTimeString("zh-TW", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })}
          </p>
        </div>

        {/* Action button header */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshServices}
            disabled={isRefreshingServices}
            className="border-[rgba(237,232,224,0.12)] bg-bg-card hover:bg-bg-hover text-text-primary text-[12px] h-9 gap-1.5 active:scale-[0.98]"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-brand ${
                isRefreshingServices ? "animate-spin" : ""
              }`}
            />
            重新整理數據
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 1. 頂部黃金視覺區 (Top Hero Zone): 平台營收與交易量 KPI 大卡片 */}
      {/* ────────────────────────────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <span className="font-sans font-semibold text-[13px] text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-brand" />
            核心營收與 GMV KPI
          </span>
          <div className="flex items-center gap-2">
            {/* Mobile Pagination Indicator */}
            <div className="flex items-center gap-2 lg:hidden font-mono text-[11px] text-text-secondary">
              <span className="bg-bg-card border border-[rgba(237,232,224,0.08)] px-2 py-0.5 rounded-full text-brand font-medium">
                {activeCardIndex + 1} / 2 卡片
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeCardIndex === 0
                      ? "w-4 bg-brand"
                      : "w-1.5 bg-[rgba(237,232,224,0.2)]"
                  }`}
                />
                <span
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    activeCardIndex === 1
                      ? "w-4 bg-brand"
                      : "w-1.5 bg-[rgba(237,232,224,0.2)]"
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile horizontal scrollable flex container, desktop 2-column grid */}
        <div
          ref={scrollContainerRef}
          onScroll={handleKPIContainerScroll}
          className="overflow-x-auto scrollbar-none flex gap-3.5 snap-x snap-mandatory pb-2 lg:grid lg:grid-cols-2 lg:pb-0"
        >
          {/* CARD A: 平台淨營收統計 (Net Revenues) */}
          <div className="snap-start min-w-[82vw] sm:min-w-[360px] lg:min-w-0 flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[rgba(212,165,116,0.3)] transition-all">
            {/* Background subtle gold glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Card A Header */}
              <div className="flex items-center justify-between mb-2">
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

              {/* Huge Metric: 累計純佣金收入 */}
              <div className="mt-3 mb-4">
                <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                  累計純佣金收入 (Net Revenue)
                </span>
                <div className="flex items-baseline gap-2.5 mt-1">
                  <span className="font-mono font-bold text-[30px] sm:text-[32px] text-text-primary tracking-tight leading-none">
                    {revenues.totalCommission}
                  </span>
                  <span className="inline-flex items-center gap-0.5 font-mono text-[12px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <TrendingUp className="w-3 h-3" />
                    {revenues.commissionGrowth}
                  </span>
                </div>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  本月佣金收益：
                  <span className="text-text-primary font-medium">
                    {revenues.monthlyCommission}
                  </span>
                </p>
              </div>
            </div>

            {/* Secondary Metric & Detailed Pool Breakdown */}
            <div className="border-t border-[rgba(237,232,224,0.08)] pt-3 mt-2 space-y-2">
              <div className="flex items-center justify-between bg-bg-page/60 rounded-xl px-3 py-2 border border-[rgba(237,232,224,0.05)]">
                <div>
                  <span className="font-mono text-[10px] text-text-disabled block uppercase">
                    專項鎖定資金池總量
                  </span>
                  <span className="font-mono font-bold text-[15px] text-emerald-400">
                    {revenues.appraisalPool}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-text-secondary bg-bg-elevated px-2 py-1 rounded border border-[rgba(237,232,224,0.08)]">
                  Appraisal + Payout Pool
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono text-[11px] pt-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-text-secondary">已鑑定卡數</span>
                  <span className="text-text-primary font-medium">
                    {revenues.totalAppraisals}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-text-secondary">單件鑑定費</span>
                  <span className="text-text-primary font-medium">
                    {revenues.appraisalFeePerCard}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[11px] col-span-2 border-t border-[rgba(237,232,224,0.06)] pt-1.5">
                  <span className="text-text-secondary">流動結算資金池</span>
                  <span className="text-text-primary font-medium">
                    {revenues.netPayoutPool}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CARD B: 交易所交易量分析 (GMV & Volume) */}
          <div className="snap-start min-w-[82vw] sm:min-w-[360px] lg:min-w-0 flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between relative overflow-hidden group hover:border-[rgba(212,165,116,0.3)] transition-all">
            {/* Background subtle gold glow accent */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            <div>
              {/* Card B Header */}
              <div className="flex items-center justify-between mb-2">
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
                  {marketVolume.growthRate} vs 上月
                </span>
              </div>

              {/* Huge Metric: 全平台總成交額 (GMV) */}
              <div className="mt-3 mb-4">
                <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                  全平台總成交額 (GMV)
                </span>
                <p className="font-mono font-bold text-[30px] sm:text-[32px] text-brand tracking-tight leading-none mt-1">
                  {marketVolume.totalGmv}
                </p>
                <p className="font-mono text-[11px] text-text-secondary mt-1">
                  本月 GMV：
                  <span className="text-text-primary font-medium">
                    {marketVolume.monthlyGmv}
                  </span>
                </p>
              </div>
            </div>

            {/* Secondary Metrics & Collapsible Seller Pool */}
            <div className="border-t border-[rgba(237,232,224,0.08)] pt-3 mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                <div className="bg-bg-page/60 p-2 rounded-lg border border-[rgba(237,232,224,0.05)]">
                  <span className="text-text-disabled text-[10px] block">
                    已成交數量
                  </span>
                  <span className="text-text-primary font-bold text-[13px]">
                    {marketVolume.totalSettledCount}
                  </span>
                </div>
                <div className="bg-bg-page/60 p-2 rounded-lg border border-[rgba(237,232,224,0.05)]">
                  <span className="text-text-disabled text-[10px] block">
                    待託管結算
                  </span>
                  <span className="text-brand font-bold text-[13px]">
                    {marketVolume.pendingSettledCount}
                  </span>
                </div>
              </div>

              {/* Collapsible / Secondary: 賣方現貨池 */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setShowSellerPoolDetails(!showSellerPoolDetails)
                  }
                  className="w-full flex items-center justify-between text-[11px] font-mono text-text-secondary bg-bg-elevated/70 hover:bg-bg-elevated px-3 py-1.5 rounded-lg border border-[rgba(237,232,224,0.08)] transition-colors active:scale-[0.99]"
                >
                  <span className="flex items-center gap-1.5 text-text-primary font-medium">
                    <Building2 className="w-3.5 h-3.5 text-brand" />
                    賣方現貨池 ({marketVolume.sellerPool.totalListings})
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-brand">
                    {showSellerPoolDetails ? "收起" : "展開詳情"}
                    {showSellerPoolDetails ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                  </span>
                </button>

                {showSellerPoolDetails && (
                  <div className="mt-2 p-3 bg-bg-page/80 rounded-xl border border-[rgba(237,232,224,0.08)] space-y-1.5 font-mono text-[11px] animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex justify-between">
                      <span className="text-text-secondary">總上架數量</span>
                      <span className="text-text-primary font-medium">
                        {marketVolume.sellerPool.totalListings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">活躍現貨刊登</span>
                      <span className="text-emerald-400 font-medium">
                        {marketVolume.sellerPool.activeListings}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-text-secondary">現貨平均單價</span>
                      <span className="text-text-primary font-medium">
                        {marketVolume.sellerPool.averageListingPrice}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-[rgba(237,232,224,0.06)] pt-1">
                      <span className="text-text-secondary">託管鎖定價值</span>
                      <span className="text-brand font-medium">
                        {marketVolume.sellerPool.escrowLockedAmount}
                      </span>
                    </div>
                  </div>
                )}
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
              活躍用戶比率 {userEcology.activeRatio} ({userEcology.activeCount})
            </span>
            <span className="font-mono text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full">
              已封鎖 {userEcology.bannedUsers} 戶
            </span>
          </div>
        </div>

        {/* Main Metric Hero inside Zone 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left / Donut Chart Visualization */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-3 bg-bg-page/50 rounded-xl border border-[rgba(237,232,224,0.06)] relative">
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
                        stroke={
                          selectedCohort === entry.key ? "#FFFFFF" : "none"
                        }
                        strokeWidth={2}
                        className="transition-all duration-300 cursor-pointer hover:opacity-80"
                        onClick={() => setSelectedCohort(entry.key)}
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
                一般會員 (87.3%) | 認證商戶 (10.1%) | 待審核 (2.4%)
              </p>
            </div>
          </div>

          {/* Right / Interactive Cohort Breakdown Cards */}
          <div className="lg:col-span-7 space-y-3">
            <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
              身份權限動態分佈 (點擊卡片查看詳細說明)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {userEcology.distribution.map((item) => {
                const isSelected = selectedCohort === item.key;
                return (
                  <div
                    key={item.key}
                    onClick={() => {
                      setSelectedCohort(isSelected ? null : item.key);
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between active:scale-[0.98] ${
                      isSelected
                        ? "bg-bg-elevated border-brand shadow-lg ring-1 ring-brand/40"
                        : "bg-bg-page/80 border-[rgba(237,232,224,0.08)] hover:bg-bg-hover hover:border-[rgba(237,232,224,0.15)]"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span
                          className="font-mono text-[10px] px-1.5 py-0.5 rounded border"
                          style={{
                            color: item.color,
                            borderColor: `${item.color}33`,
                            backgroundColor: `${item.color}15`,
                          }}
                        >
                          {item.pctStr}
                        </span>
                      </div>
                      <span className="font-sans font-semibold text-[13px] text-text-primary block truncate">
                        {item.role}
                      </span>
                      <p className="font-mono font-bold text-[20px] text-text-primary mt-1">
                        {item.formattedCount}
                        <span className="text-[11px] text-text-disabled font-normal ml-1">
                          人
                        </span>
                      </p>
                    </div>

                    <p className="font-sans text-[11px] text-text-secondary mt-2 line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between bg-bg-page/40 rounded-xl px-4 py-2.5 border border-[rgba(237,232,224,0.06)] font-mono text-[11px]">
              <span className="text-text-secondary flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                商戶審核隊列：
                <span className="text-text-primary font-medium">
                  118 件待審核
                </span>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/admin/merchants?tab=onboarding")}
                className="text-brand hover:text-brand-hover p-0 h-auto font-mono text-[11px] hover:bg-transparent gap-1"
              >
                前往審核商戶 <ArrowRight className="w-3 h-3" />
              </Button>
            </div>
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
        <div className="sticky bottom-4 sm:relative sm:bottom-0 z-30">
          <div className="w-full bg-gradient-to-r from-rose-950/90 via-bg-card to-rose-950/80 rounded-2xl border-2 border-rose-500/40 hover:border-rose-500 p-4 sm:p-5 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 w-full sm:w-auto">
              {/* Pulsating Alert Icon */}
              <div className="relative shrink-0">
                <div className="w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 group-hover:scale-105 transition-transform">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                {unprocessedDisputes > 0 && (
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
                      {unprocessedDisputes} 件
                    </span>
                  </span>
                </div>
                <p className="font-sans text-[12px] text-rose-200/80 mt-0.5">
                  有 {unprocessedDisputes}{" "}
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
      </section>
    </div>
  );
}
