"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { getMerchantProductAnalytics } from "@/app/actions/merchant-product-analytics";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  MERCHANT_PERF_RANGES,
  SELECT_DISPLAY_MAP,
  isMerchantPerformanceRange,
} from "@/lib/dashboard/merchant-performance-ranges";
import type { MerchantPerformanceRange } from "@/lib/dashboard/merchant-performance-types";
import type { MerchantProductAnalytics } from "@/lib/dashboard/merchant-product-analytics-types";

const chartConfig = {
  totalSales: {
    label: "總銷售額 (HK$)",
    color: "#d4a574",
  },
  viewCount: {
    label: "瀏覽次數 (次)",
    color: "#00D2FF",
  },
  txCount: {
    label: "成交次數 (次)",
    color: "#10b981",
  },
  offerCount: {
    label: "叫價次數 (次)",
    color: "#a78bfa",
  },
} satisfies ChartConfig;

function formatCurrency(value: number): string {
  return `HK$ ${value.toLocaleString("zh-TW")}`;
}

function formatEventAt(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

type MerchantAnalyticsClientProps = {
  productId: string;
  initialData: MerchantProductAnalytics | null;
  bootstrapError?: string;
};

export function MerchantAnalyticsClient({
  productId,
  initialData,
  bootstrapError,
}: MerchantAnalyticsClientProps) {
  const router = useRouter();
  const [range, setRange] = useState<MerchantPerformanceRange>(
    initialData?.timeRange ?? "7d",
  );
  const [analytics, setAnalytics] = useState<MerchantProductAnalytics | null>(
    initialData,
  );
  const [historyPage, setHistoryPage] = useState(1);
  const [isChartLoading, setIsChartLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [displayArea, setDisplayArea] = useState(true);
  const [displayLine, setDisplayLine] = useState(true);
  const [displayBar, setDisplayBar] = useState(true);
  const [displayOffer, setDisplayOffer] = useState(true);

  const chartData = useMemo(
    () =>
      (analytics?.series ?? []).map((point) => ({
        time: point.label,
        totalSales: point.totalSales,
        viewCount: point.viewCount,
        txCount: point.txCount,
        offerCount: point.offerCount,
      })),
    [analytics?.series],
  );

  const fetchAnalytics = useCallback(
    async (
      nextRange: MerchantPerformanceRange,
      nextHistoryPage: number,
      options?: { chartOnly?: boolean },
    ) => {
      const result = await getMerchantProductAnalytics({
        productId,
        timeRange: nextRange,
        historyPage: nextHistoryPage,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      if (options?.chartOnly) {
        setAnalytics((current) =>
          current
            ? {
                ...current,
                series: result.data.series,
                timeRange: result.data.timeRange,
                history: result.data.history,
              }
            : result.data,
        );
      } else {
        setAnalytics(result.data);
      }
    },
    [productId],
  );

  const handleRangeChange = useCallback(
    async (nextRange: string | null) => {
      if (
        !nextRange ||
        !isMerchantPerformanceRange(nextRange) ||
        nextRange === range
      ) {
        return;
      }

      const previousRange = range;
      const previousPage = historyPage;
      setRange(nextRange);
      setHistoryPage(1);
      setIsChartLoading(true);

      try {
        await fetchAnalytics(nextRange, 1, { chartOnly: true });
      } catch (error) {
        setRange(previousRange);
        setHistoryPage(previousPage);
        toast.error(
          error instanceof Error ? error.message : "無法載入區間商品分析",
        );
      } finally {
        setIsChartLoading(false);
      }
    },
    [fetchAnalytics, historyPage, range],
  );

  const handleHistoryPageChange = useCallback(
    async (page: number) => {
      if (page === historyPage || page < 1) {
        return;
      }

      const previousPage = historyPage;
      setHistoryPage(page);
      setIsHistoryLoading(true);

      try {
        await fetchAnalytics(range, page);
      } catch (error) {
        setHistoryPage(previousPage);
        toast.error(
          error instanceof Error ? error.message : "無法載入交易歷史",
        );
      } finally {
        setIsHistoryLoading(false);
      }
    },
    [fetchAnalytics, historyPage, range],
  );

  const summary = analytics?.summary;
  const history = analytics?.history;
  const productName = analytics?.product.name ?? "未知商品";

  return (
    <section
      aria-labelledby="analytics-heading"
      className="space-y-6 animate-fadeIn p-4 md:p-6"
    >
      <div className="flex items-center gap-4 select-none">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-[#26211C] border border-[rgba(237,232,224,0.12)] text-[#8A8680] hover:text-[#d4a574] hover:border-[#d4a574]/40 flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer shadow-md"
          aria-label="回上頁"
        >
          <IoChevronBack className="size-5" />
        </button>
        <div>
          <div
            id="analytics-heading"
            className="font-sans font-black text-[22px] lg:text-[25px] text-brand tracking-tight flex items-center gap-2 text-norwap"
          >
            <span>{productName}</span>
          </div>
        </div>
      </div>

      {bootstrapError ? (
        <p className="text-sm text-red-400">{bootstrapError}</p>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          {
            label: "平均成交價",
            value: formatCurrency(summary?.avgSoldPrice ?? 0),
          },
          {
            label: "市場最低價",
            value: formatCurrency(summary?.marketLowestPrice ?? 0),
          },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-[#26211C] rounded-2xl border border-white/5 p-5 shadow-sm transition-all"
          >
            <p className="font-mono text-[11px] text-[#8A8680] uppercase tracking-wider mb-1">
              {label}
            </p>
            <p className="font-mono font-bold text-[24px] text-[#eae1da] tracking-tight">
              {value}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-[#26211C] rounded-2xl border border-white/5 p-5 shadow-lg">
        <div className="flex flex-col">
          <div className="flex flex-row items-center justify-between gap-4 mb-6 flex-wrap">
            <p className="font-sans font-bold text-[15px] text-[#eae1da]">
              商品表現
            </p>

            <div className="w-[125px] shrink-0">
              <Select value={range} onValueChange={handleRangeChange}>
                <SelectTrigger className="w-full bg-[#1A1612] border border-white/5 rounded-xl text-text-primary text-[13px] font-sans h-9">
                  <SelectValue>
                    {SELECT_DISPLAY_MAP[range] || "選擇時間"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {MERCHANT_PERF_RANGES.map((option) => (
                    <SelectItem key={option} value={option}>
                      {SELECT_DISPLAY_MAP[option]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-row justify-evenly text-text-secondary text-sm gap-x-2 flex-wrap gap-y-2">
            <div className="flex flex-row gap-x-1">
              <p>總銷售額</p>
              <input
                type="checkbox"
                checked={displayLine}
                onChange={() => setDisplayLine(!displayLine)}
              />
            </div>
            <div className="flex flex-row gap-x-1">
              <p>成交次數</p>
              <input
                type="checkbox"
                checked={displayBar}
                onChange={() => setDisplayBar(!displayBar)}
              />
            </div>
            <div className="flex flex-row gap-x-1">
              <p>瀏覽</p>
              <input
                type="checkbox"
                checked={displayArea}
                onChange={() => setDisplayArea(!displayArea)}
              />
            </div>
            <div className="flex flex-row gap-x-1">
              <p>叫價次數</p>
              <input
                type="checkbox"
                checked={displayOffer}
                onChange={() => setDisplayOffer(!displayOffer)}
              />
            </div>
          </div>
        </div>

        <div
          className={`h-72 w-full relative ${isChartLoading ? "opacity-60" : ""}`}
        >
          {isChartLoading ? (
            <div className="absolute inset-0 flex items-center justify-center z-10 text-sm text-text-secondary">
              載入中…
            </div>
          ) : null}
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData}>
                <defs>
                  <linearGradient id="mixViewCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00D2FF" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="mixOfferCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#a78bfa" stopOpacity={0.0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  vertical={false}
                  stroke="rgba(255,255,255,0.04)"
                />

                <XAxis
                  dataKey="time"
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

                <YAxis
                  yAxisId="totalSalesId"
                  hide
                  includeHidden
                  label={chartConfig.totalSales.label}
                  orientation="left"
                  domain={[0, "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.totalSales.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />

                <YAxis
                  yAxisId="viewCountId"
                  hide
                  includeHidden
                  label={chartConfig.viewCount.label}
                  orientation="right"
                  domain={[0, "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.viewCount.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                />

                <YAxis
                  yAxisId="txCountId"
                  hide
                  includeHidden
                  label={chartConfig.txCount.label}
                  domain={[0, "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.txCount.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                />

                <YAxis
                  yAxisId="offerCountId"
                  hide
                  includeHidden
                  label={chartConfig.offerCount.label}
                  domain={[0, "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.offerCount.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                />

                <ChartTooltip
                  cursor={{ fill: "#ffffff", opacity: 0.04 }}
                  content={
                    <ChartTooltipContent
                      className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]"
                      labelClassName="text-lg"
                    />
                  }
                />

                <Area
                  yAxisId="viewCountId"
                  type="monotone"
                  dataKey="viewCount"
                  fill="url(#mixViewCount)"
                  stroke={chartConfig.viewCount.color}
                  strokeWidth={2}
                  hide={!displayArea}
                />

                <Area
                  yAxisId="offerCountId"
                  type="monotone"
                  dataKey="offerCount"
                  fill="url(#mixOfferCount)"
                  stroke={chartConfig.offerCount.color}
                  strokeWidth={2}
                  hide={!displayOffer}
                />

                <Line
                  yAxisId="totalSalesId"
                  type="monotone"
                  dataKey="totalSales"
                  stroke={chartConfig.totalSales.color}
                  strokeWidth={2.5}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                  hide={!displayLine}
                />

                <Bar
                  yAxisId="txCountId"
                  dataKey="txCount"
                  fill={chartConfig.txCount.color}
                  radius={[3, 3, 0, 0]}
                  maxBarSize={8}
                  hide={!displayBar}
                />

                <ChartLegend
                  content={<ChartLegendContent className="mt-4" />}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>

      <div
        id="sku-history"
        className={`bg-[#26211C] rounded-2xl border border-white/5 p-5 shadow-lg space-y-4 ${isHistoryLoading ? "opacity-60" : ""}`}
      >
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
            📊 交易歷史
          </h3>
        </div>

        {(history?.meta.totalCount ?? 0) === 0 ? (
          <div className="py-8 text-center font-sans text-[13px] text-text-disabled">
            該商品於當前區間內暫無交易歷史記錄
          </div>
        ) : (
          <div className="space-y-2.5">
            <div className="grid grid-cols-4 px-3 text-[11px] font-mono text-[#8A8680] uppercase tracking-wider">
              <span>交易日期</span>
              <span>訂單編號</span>
              <span>買家藏家</span>
              <span className="text-right">成交價金額</span>
            </div>

            {(history?.items ?? []).map((tx) => (
              <div
                key={tx.orderId}
                className="grid grid-cols-4 items-center px-3 py-3 bg-[#17130f]/50 border border-white/[0.03] rounded-xl font-mono text-[12.5px] transition-all hover:border-brand/20"
              >
                <span className="text-text-disabled">
                  {formatEventAt(tx.eventAt)}
                </span>
                <Link
                  href={`/profile/merchant/orderDetail/${tx.orderId}`}
                  className="text-brand font-bold hover:text-brand/80 underline decoration-dotted underline-offset-4 decoration-brand/30 hover:decoration-brand transition-colors truncate block max-w-max"
                  title="查看訂單詳情"
                >
                  {tx.orderNumber}
                </Link>
                <Link
                  href={`/profile/${tx.buyerId}`}
                  className="font-sans font-medium text-[#eae1da] hover:text-brand underline decoration-dotted underline-offset-4 decoration-white/20 hover:decoration-brand transition-colors cursor-pointer text-left focus:outline-none truncate block max-w-max"
                  title={`查看 ${tx.buyerName} 的公開個人檔案`}
                >
                  {tx.buyerName}
                </Link>
                <span className="text-right text-brand font-black">
                  {formatCurrency(tx.finalPrice)}
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2">
          <Pagination
            currentPage={historyPage}
            totalPages={history?.meta.totalPages ?? 1}
            onPageChange={handleHistoryPageChange}
            itemLabel="筆交易流水"
            totalItems={history?.meta.totalCount ?? 0}
            itemsPerPage={history?.meta.pageSize ?? 6}
            enableScroll={true}
            scrollToViewId="sku-history"
          />
        </div>
      </div>
    </section>
  );
}
