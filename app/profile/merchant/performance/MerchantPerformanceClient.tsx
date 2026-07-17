"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { IoChevronBack } from "react-icons/io5";
import {
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getMerchantPerformanceAnalytics } from "@/app/actions/merchant-performance";
import { ProfilePersonaSwitch } from "@/app/components/profile/ProfilePersonaSwitch";
import type { DualPersonaContext } from "@/lib/auth/dual-persona";
import {
  MERCHANT_PERF_RANGES,
  RANGE_LABEL_MAP,
  SELECT_DISPLAY_MAP,
  isMerchantPerformanceRange,
} from "@/lib/dashboard/merchant-performance-ranges";
import type {
  MerchantPerformanceAnalytics,
  MerchantPerformanceRange,
} from "@/lib/dashboard/merchant-performance-types";
import { DEFAULT_AVATAR_URL } from "@/lib/profile/avatar";

const chartConfig = {
  turnover: {
    label: "營業額",
    color: "#d4a574",
  },
  avgPrice: {
    label: "平均價",
    color: "#00D2FF",
  },
  txCount: {
    label: "成交總數",
    color: "#10b981",
  },
} satisfies ChartConfig;

type MerchantPerformanceClientProps = {
  initialData: MerchantPerformanceAnalytics | null;
  dualPersona: DualPersonaContext;
  bootstrapError?: string;
};

export function MerchantPerformanceClient({
  initialData,
  dualPersona,
  bootstrapError,
}: MerchantPerformanceClientProps) {
  const router = useRouter();
  const [range, setRange] = useState<MerchantPerformanceRange>(
    initialData?.timeRange ?? "7d",
  );
  const [analytics, setAnalytics] = useState<MerchantPerformanceAnalytics | null>(
    initialData,
  );
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [displayArea, setDisplayArea] = useState(true);
  const [displayLine, setDisplayLine] = useState(true);
  const [displayBar, setDisplayBar] = useState(true);

  const handleRangeChange = useCallback(async (nextRange: string | null) => {
    if (!nextRange || !isMerchantPerformanceRange(nextRange) || nextRange === range) {
      return;
    }

    const previousRange = range;
    setRange(nextRange);
    setIsChartLoading(true);

    try {
      const result = await getMerchantPerformanceAnalytics(nextRange);
      if (!result.success) {
        throw new Error(result.error);
      }

      setAnalytics((current) =>
        current
          ? {
              ...current,
              interval: result.data.interval,
              series: result.data.series,
              timeRange: result.data.timeRange,
            }
          : result.data,
      );
    } catch (error) {
      setRange(previousRange);
      toast.error(
        error instanceof Error ? error.message : "無法載入區間業績資料",
      );
    } finally {
      setIsChartLoading(false);
    }
  }, [range]);

  const activeData = analytics?.series ?? [];
  const allTimeMetrics = analytics?.allTime ?? {
    turnover: 0,
    txCount: 0,
    avgPrice: 0,
  };
  const intervalMetrics = analytics?.interval ?? {
    turnover: 0,
    txCount: 0,
    avgPrice: 0,
  };
  const topProducts = analytics?.topProducts ?? [];
  const topSpenders = analytics?.topSpenders ?? [];
  const currentRangeLabel = RANGE_LABEL_MAP[range] || "當前區間";

  return (
    <section
      aria-labelledby="performance-heading"
      className="space-y-6 animate-fadeIn p-4 md:p-6 bg-bg-page min-h-screen text-text-primary"
    >
      {bootstrapError ? (
        <div className="mb-4 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入業績分析：{bootstrapError}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label="返回"
            className="w-10 h-10 rounded-full bg-[#26211C] border border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-brand hover:border-brand/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-[0.97] cursor-pointer shadow-md shrink-0 focus:outline-none"
          >
            <IoChevronBack className="w-5 h-5" />
          </button>
          <div>
            <h1
              id="performance-heading"
              className="font-sans font-black text-[22px] lg:text-[26px] text-text-primary tracking-tight"
            >
              店舖經營與業績分析
            </h1>
          </div>
        </div>
        {dualPersona.hasDualPersona ? (
          <ProfilePersonaSwitch
            activeContext="merchant"
            context={dualPersona}
          />
        ) : null}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            歷史累計總營業額
          </p>
          <p className="font-mono text-[24px] font-black text-[#d4a574] leading-none tracking-tight">
            HK$ {allTimeMetrics.turnover.toLocaleString()}
          </p>
        </div>

        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            歷史累計平均單價
          </p>
          <p className="font-mono text-[24px] font-black text-[#00D2FF] leading-none tracking-tight">
            HK$ {allTimeMetrics.avgPrice.toLocaleString()}
          </p>
        </div>

        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            歷史累計總成交次數
          </p>
          <p className="font-mono text-[24px] font-black text-[#10b981] leading-none tracking-tight">
            {allTimeMetrics.txCount.toLocaleString()} 次
          </p>
        </div>
      </div>

      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <p className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
                營收、價格與成交量
              </p>
            </div>

            <div className="w-[125px] shrink-0">
              <Select value={range} onValueChange={handleRangeChange}>
                <SelectTrigger className="w-full bg-[#1A1612] border border-white/5 rounded-xl text-text-primary text-[13px] font-sans h-9">
                  <SelectValue>
                    {SELECT_DISPLAY_MAP[range] || "選擇時間"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1A1612] border border-white/10 text-text-primary">
                  {MERCHANT_PERF_RANGES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {SELECT_DISPLAY_MAP[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-row justify-evenly text-text-secondary text-sm">
            <div className="flex flex-row items-center gap-x-2">
              <p>平均價</p>
              <input
                type="checkbox"
                checked={displayArea}
                onChange={() => setDisplayArea(!displayArea)}
              />
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <p>營業額</p>
              <input
                type="checkbox"
                checked={displayLine}
                onChange={() => setDisplayLine(!displayLine)}
              />
            </div>
            <div className="flex flex-row items-center gap-x-2">
              <p>成交總數</p>
              <input
                type="checkbox"
                checked={displayBar}
                onChange={() => setDisplayBar(!displayBar)}
              />
            </div>
          </div>
        </div>

        <div className="relative h-72 w-full">
          {isChartLoading ? (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-[#17130f]/50 rounded-xl">
              <div className="w-6 h-6 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            </div>
          ) : null}
          {activeData.length === 0 && !isChartLoading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="font-sans text-[13px] text-text-disabled">
                此區間暫無成交紀錄
              </p>
            </div>
          ) : null}
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={activeData}>
                <defs>
                  <linearGradient id="mixAvgPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00D2FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.04)"
                />

                <XAxis
                  dataKey="label"
                  scale="band"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={10}
                  style={{
                    fill: "#8A8680",
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                />

                <YAxis yAxisId="turnover" hide includeHidden domain={["auto", "auto"]} />
                <YAxis yAxisId="avgPrice" hide includeHidden domain={["auto", "auto"]} />
                <YAxis yAxisId="txCount" hide includeHidden domain={["auto", "auto"]} />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]"
                      labelClassName="text-lg"
                    />
                  }
                />

                <Area
                  yAxisId="avgPrice"
                  type="monotone"
                  dataKey="avgPrice"
                  fill="url(#mixAvgPrice)"
                  stroke={chartConfig.avgPrice.color}
                  strokeWidth={2}
                  hide={!displayArea}
                />

                <Line
                  yAxisId="turnover"
                  type="monotone"
                  dataKey="turnover"
                  stroke={chartConfig.turnover.color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  hide={!displayLine}
                />

                <Bar
                  yAxisId="txCount"
                  dataKey="txCount"
                  fill={chartConfig.txCount.color}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={8}
                  hide={!displayBar}
                />

                <ChartLegend content={<ChartLegendContent className="mt-4" />} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        <div className="mt-6 pt-5 border-t border-white/5 w-full">
          <h4 className="font-sans font-bold text-[13.5px] text-brand tracking-tight mb-4">
            📊 區間營收轉化動態分析 ({currentRangeLabel})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#17130f] border border-white/5 rounded-xl px-4 py-3 flex flex-col">
              <span className="font-mono text-[10.5px]">區間總營業額</span>
              <span className="text-[#d4a574] font-mono text-[16px] font-bold mt-1">
                HK$ {intervalMetrics.turnover.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#17130f] border border-white/5 rounded-xl px-4 py-3 flex flex-col">
              <span className="font-mono text-[10.5px]">區間平均價 (AOV)</span>
              <span className="text-[#00D2FF] font-mono text-[16px] font-bold mt-1">
                HK$ {intervalMetrics.avgPrice.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#17130f] border border-white/5 rounded-xl px-4 py-3 flex flex-col">
              <span className="font-mono text-[10.5px]">區間總交易筆數</span>
              <span className="text-[#10b981] font-mono text-[16px] font-bold mt-1">
                {intervalMetrics.txCount.toLocaleString()} 次
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
              暢銷商品排行榜
            </h3>
          </div>

          {topProducts.length === 0 ? (
            <p className="font-sans text-[13px] text-text-disabled py-6 text-center">
              暫無成交商品紀錄
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {topProducts.map((prod) => (
                <div
                  key={`${prod.rank}-${prod.productId}`}
                  className="flex items-center justify-between py-3 text-[13.5px]"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[11px] font-black shrink-0 ${
                        prod.rank === 1
                          ? "bg-brand text-[#17130f]"
                          : prod.rank === 2
                            ? "bg-[#a89888] text-[#17130f]"
                            : prod.rank === 3
                              ? "bg-[#5c554e] text-text-primary"
                              : "bg-[#26211C] text-text-secondary"
                      }`}
                    >
                      {prod.rank}
                    </span>
                    <Link
                      href={`/profile/merchant/analytics?productId=${encodeURIComponent(prod.productId)}`}
                      title={`查看 ${prod.name} 的深度經營分析數據看板`}
                    >
                      <div className="min-w-0">
                        <p className="text-text-primary font-medium truncate">
                          {prod.name}
                        </p>
                        <p className="font-mono text-[10.5px] text-stone-500 hover:text-brand underline decoration-dotted underline-offset-4 decoration-stone-500/30 hover:decoration-brand transition-colors cursor-pointer text-left focus:outline-none truncate block max-w-max uppercase mt-0.5">
                          {prod.skuNo}
                        </p>
                      </div>
                    </Link>
                  </div>

                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono font-bold text-brand text-[14px]">
                      HK$ {prod.revenue.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      已成交 {prod.volume} 件
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
              高價值客戶
            </h3>
          </div>

          {topSpenders.length === 0 ? (
            <p className="font-sans text-[13px] text-text-disabled py-6 text-center">
              暫無高價值客戶紀錄
            </p>
          ) : (
            <div className="divide-y divide-white/5">
              {topSpenders.map((client) => (
                <div
                  key={client.buyerId}
                  className="flex items-center justify-between py-3 text-[13.5px]"
                >
                  <Link
                    href={`/profile/${client.buyerId}`}
                    className="flex items-center gap-3 hover:text-brand transition-colors group min-w-0"
                  >
                    <span className="font-mono text-[11px] text-text-primary w-4 text-center shrink-0">
                      {client.rank}
                    </span>

                    <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                      <Image
                        src={client.avatarUrl || DEFAULT_AVATAR_URL}
                        alt={client.name}
                        fill
                        unoptimized
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-text-primary font-medium group-hover:text-brand transition-colors truncate">
                        {client.name}
                      </p>
                      <p className="text-[10.5px] text-brand uppercase mt-0.5">
                        VIP LEVEL {client.rank <= 3 ? "III" : client.rank <= 6 ? "II" : "I"}
                      </p>
                    </div>
                  </Link>

                  <div className="text-right shrink-0 ml-4">
                    <p className="font-mono font-semibold text-brand text-[14px]">
                      HK$ {client.spending.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-text-secondary mt-0.5">
                      累計消費額
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
