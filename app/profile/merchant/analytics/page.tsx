"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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

import { INITIAL_LISTINGS } from "@/app/lib/mock-data/cards";
import { Pagination } from "@/app/components/ui/Pagination";

// ─── Data Types ──────────────────────────────────────────────────────────────

interface MetricData {
  time: string;
  totalSales: number;
  viewCount: number;
  txCount: number;
}

// ─── Mock Time Dimension Datasets ─────────────────────────────────────────────

const MOCK_DATA_MAP: Record<string, MetricData[]> = {
  "12h": [
    { time: "02:00", totalSales: 12500, viewCount: 45, txCount: 1 },
    { time: "04:00", totalSales: 28500, viewCount: 68, txCount: 2 },
    { time: "06:00", totalSales: 15000, viewCount: 89, txCount: 1 },
    { time: "08:00", totalSales: 42000, viewCount: 112, txCount: 3 },
    { time: "10:00", totalSales: 35000, viewCount: 154, txCount: 2 },
    { time: "12:00", totalSales: 49800, viewCount: 180, txCount: 4 },
  ],
  "7d": [
    { time: "週一", totalSales: 42000, viewCount: 210, txCount: 3 },
    { time: "週二", totalSales: 68000, viewCount: 340, txCount: 5 },
    { time: "週三", totalSales: 51000, viewCount: 280, txCount: 4 },
    { time: "週四", totalSales: 92000, viewCount: 450, txCount: 6 },
    { time: "週五", totalSales: 74000, viewCount: 390, txCount: 5 },
    { time: "週六", totalSales: 118000, viewCount: 580, txCount: 8 },
    { time: "週日", totalSales: 135000, viewCount: 640, txCount: 9 },
  ],
  "1m": [
    { time: "W1", totalSales: 120000, viewCount: 890, txCount: 12 },
    { time: "W2", totalSales: 185000, viewCount: 1240, txCount: 16 },
    { time: "W3", totalSales: 142000, viewCount: 1050, txCount: 11 },
    { time: "W4", totalSales: 215000, viewCount: 1680, txCount: 19 },
  ],
  "3m": [
    { time: "四月", totalSales: 420000, viewCount: 3100, txCount: 42 },
    { time: "五月", totalSales: 580000, viewCount: 4800, txCount: 56 },
    { time: "六月", totalSales: 640000, viewCount: 5200, txCount: 61 },
  ],
  "6m": [
    { time: "一月", totalSales: 380000, viewCount: 2800, txCount: 35 },
    { time: "二月", totalSales: 450000, viewCount: 3400, txCount: 41 },
    { time: "三月", totalSales: 510000, viewCount: 4100, txCount: 49 },
    { time: "四月", totalSales: 420000, viewCount: 3100, txCount: 42 },
    { time: "五月", totalSales: 580000, viewCount: 4800, txCount: 56 },
    { time: "六月", totalSales: 640000, viewCount: 5200, txCount: 61 },
  ],
  "12m": [
    { time: "25/07", totalSales: 310000, viewCount: 2200, txCount: 28 },
    { time: "25/08", totalSales: 290000, viewCount: 1950, txCount: 24 },
    { time: "25/09", totalSales: 340000, viewCount: 2500, txCount: 31 },
    { time: "25/10", totalSales: 420000, viewCount: 3100, txCount: 38 },
    { time: "25/11", totalSales: 380000, viewCount: 2900, txCount: 33 },
    { time: "25/12", totalSales: 490000, viewCount: 3800, txCount: 44 },
    { time: "26/01", totalSales: 380000, viewCount: 2800, txCount: 35 },
    { time: "26/02", totalSales: 450000, viewCount: 3400, txCount: 41 },
    { time: "26/03", totalSales: 510000, viewCount: 4100, txCount: 49 },
    { time: "26/04", totalSales: 420000, viewCount: 3100, txCount: 42 },
    { time: "26/05", totalSales: 580000, viewCount: 4800, txCount: 56 },
    { time: "26/06", totalSales: 640000, viewCount: 5200, txCount: 61 },
  ],
};

// ─── Chart Config Matrix ──────────────────────────────────────────────────────

const chartConfig = {
  totalSales: {
    label: "總銷售額 (HK$)",
    color: "#d4a574", // Custom Branding Theme Gold Hue
  },
  viewCount: {
    label: "瀏覽次數 (次)",
    color: "#00D2FF",
  },
  txCount: {
    label: "成交次數 (次)",
    color: "#10b981",
  },
} satisfies ChartConfig;

const rangeLabelMap: Record<string, string> = {
  "12h": "12 小時",
  "7d": "7 日",
  "1m": "1 個月",
  "3m": "3 個月",
  "6m": "6 個月",
  "12m": "12 個月",
};

interface MerchantAnalyticsPageProps {
  searchParams: Promise<{ sku?: string }>;
}

// ─── Immutable Relative Offsets Database for High-Fidelity Transaction History ───
const MOCK_RELATIVE_OFFSETS = [
  {
    offsetDays: 0.05,
    buyerName: "佐藤 健一 (Sato)",
    id: "ORD-2026-X901",
    buyerId: "USR-BUYER-901",
  },
  {
    offsetDays: 0.15,
    buyerName: "高橋 翼 (Tsubasa)",
    id: "ORD-2026-X902",
    buyerId: "USR-BUYER-902",
  },
  {
    offsetDays: 0.35,
    buyerName: "田中 櫻 (Sakura)",
    id: "ORD-2026-X903",
    buyerId: "USR-BUYER-903",
  },
  {
    offsetDays: 0.45,
    buyerName: "伊藤 信一 (Shinichi)",
    id: "ORD-2026-X904",
    buyerId: "USR-BUYER-904",
  },
  {
    offsetDays: 1.2,
    buyerName: "渡邊 翔 (Sho)",
    id: "ORD-2026-X905",
    buyerId: "USR-BUYER-905",
  },
  {
    offsetDays: 2.1,
    buyerName: "山本 美優 (Miyu)",
    id: "ORD-2026-X906",
    buyerId: "USR-BUYER-906",
  },
  {
    offsetDays: 3.5,
    buyerName: "中村 蓮 (Ren)",
    id: "ORD-2026-X907",
    buyerId: "USR-BUYER-907",
  },
  {
    offsetDays: 5.8,
    buyerName: "小林 駿 (Shun)",
    id: "ORD-2026-X908",
    buyerId: "USR-BUYER-908",
  },
  {
    offsetDays: 8.2,
    buyerName: "加藤 拓也 (Takuya)",
    id: "ORD-2026-X909",
    buyerId: "USR-BUYER-909",
  },
  {
    offsetDays: 12.5,
    buyerName: "吉田 葵 (Aoi)",
    id: "ORD-2026-X910",
    buyerId: "USR-BUYER-910",
  },
  {
    offsetDays: 18.1,
    buyerName: "山田 大介 (Daisuke)",
    id: "ORD-2026-X911",
    buyerId: "USR-BUYER-911",
  },
  {
    offsetDays: 24.3,
    buyerName: "佐々木 陸 (Riku)",
    id: "ORD-2026-X912",
    buyerId: "USR-BUYER-912",
  },
  {
    offsetDays: 35.0,
    buyerName: "山口 陽菜 (Hina)",
    id: "ORD-2026-X913",
    buyerId: "USR-BUYER-913",
  },
  {
    offsetDays: 45.2,
    buyerName: "松本 裕太 (Yuta)",
    id: "ORD-2026-X914",
    buyerId: "USR-BUYER-914",
  },
  {
    offsetDays: 60.1,
    buyerName: "井上 翔太 (Shota)",
    id: "ORD-2026-X915",
    buyerId: "USR-BUYER-915",
  },
  {
    offsetDays: 85.4,
    buyerName: "木村 拓哉 (Takuya)",
    id: "ORD-2026-X916",
    buyerId: "USR-BUYER-916",
  },
  {
    offsetDays: 110.2,
    buyerName: "林 奈々 (Nana)",
    id: "ORD-2026-X917",
    buyerId: "USR-BUYER-917",
  },
  {
    offsetDays: 150.5,
    buyerName: "清水 健 (Ken)",
    id: "ORD-2026-X918",
    buyerId: "USR-BUYER-918",
  },
  {
    offsetDays: 220.0,
    buyerName: "阿部 寬 (Hiroshi)",
    id: "ORD-2026-X919",
    buyerId: "USR-BUYER-919",
  },
  {
    offsetDays: 310.4,
    buyerName: "森 翔平 (Shohei)",
    id: "ORD-2026-X920",
    buyerId: "USR-BUYER-920",
  },
];

export default function MerchantAnalyticsPage({
  searchParams,
}: MerchantAnalyticsPageProps) {
  const router = useRouter();
  const [timeRange, setTimeRange] = useState<string>("7d");
  const [historyPage, setHistoryPage] = useState<number>(1);
  const itemsPerPage = 6;
  const [displayArea, setDisplayArea] = useState<boolean>(true);
  const [displayLine, setDisplayLine] = useState<boolean>(true);
  const [displayBar, setDisplayBar] = useState<boolean>(true);

  // Await searchParams in client side safe pattern using React.use
  const resolvedParams = React.use(searchParams);
  const sku = resolvedParams?.sku ?? null;

  // Resolve canonical name from SKU parameter string
  const resolvedSkuName = useMemo(() => {
    if (!sku) return "未知商品";
    const found = INITIAL_LISTINGS.find((c) => c.id === sku);
    return found ? found.name : `標準合約資產 (${sku})`;
  }, [sku]);

  // Extract selected timeseries data
  const currentChartData = useMemo(() => {
    return MOCK_DATA_MAP[timeRange] ?? MOCK_DATA_MAP["7d"];
  }, [timeRange]);

  // Dynamically compute the price anchor of the SKU
  const skuBasePrice = useMemo(() => {
    if (!sku) return 40000;
    const found = INITIAL_LISTINGS.find((c) => c.id === sku);
    if (found && found.sellOrders.length > 0) {
      return Math.min(...found.sellOrders.map((o) => o.price));
    }
    return 42500;
  }, [sku]);

  // Dynamic filter pipeline for high-fidelity transaction ledger entries
  const filteredHistory = useMemo(() => {
    // Standard thresholds (in days ago) for 6-tier time filter controls
    const thresholdDays = (() => {
      switch (timeRange) {
        case "12h":
          return 0.5;
        case "7d":
          return 7;
        case "1m":
          return 30;
        case "3m":
          return 90;
        case "6m":
          return 180;
        case "12m":
          return 365;
        default:
          return 7;
      }
    })();

    const baseTime = new Date("2026-06-22T20:52:29").getTime();

    return MOCK_RELATIVE_OFFSETS.filter(
      (item) => item.offsetDays <= thresholdDays,
    ).map((item) => {
      // Calculate dynamic past timestamp
      const txDate = new Date(baseTime - item.offsetDays * 24 * 60 * 60 * 1000);
      const yyyy = txDate.getFullYear();
      const mm = String(txDate.getMonth() + 1).padStart(2, "0");
      const dd = String(txDate.getDate()).padStart(2, "0");
      const hh = String(txDate.getHours()).padStart(2, "0");
      const min = String(txDate.getMinutes()).padStart(2, "0");

      // Fluctuating dynamic price with custom sine-wave variation centered on the SKU ask price
      const priceVariance = Math.sin(item.offsetDays) * 0.05;
      const finalPrice = Math.round(skuBasePrice * (1 + priceVariance));

      return {
        id: item.id,
        date: `${yyyy}-${mm}-${dd} ${hh}:${min}`,
        buyerName: item.buyerName,
        buyerId: item.buyerId, // 🆕 Propagate to rendering template
        price: finalPrice,
      };
    });
  }, [timeRange, skuBasePrice]);

  const paginatedHistory = useMemo(() => {
    const startIdx = (historyPage - 1) * itemsPerPage;
    return filteredHistory.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredHistory, historyPage]);

  return (
    <section
      aria-labelledby="analytics-heading"
      className="space-y-6 animate-fadeIn p-4 md:p-6"
    >
      {/* ── Standardized Minimalist History Back Navigation Node ─────────────── */}
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
            <span>{resolvedSkuName}</span>
          </div>
        </div>
      </div>

      {/* ── Executive KPI Summary Widgets ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[
          { label: "平均成交價", value: "HK$ 42,500" },
          { label: "市場最低價", value: "HK$ 38,000" },
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

      {/* ── Interactive Area Chart Area ────────────────────────────────────────── */}
      <div className="bg-[#26211C] rounded-2xl border border-white/5 p-5 shadow-lg">
        <div className="flex flex-col">
          <div className="flex flex-row items-center justify-between gap-4 mb-6 flex-wrap">
            <p className="font-sans font-bold text-[15px] text-[#eae1da]">
              商品表現
            </p>

            <div className="w-[125px] shrink-0">
              {/* 6-Tier Time-Range Select Controller */}
              <Select
                value={timeRange}
                onValueChange={(val) => {
                  setTimeRange(val ?? "7d");
                  setHistoryPage(1);
                }}
              >
                <SelectTrigger className="w-full bg-[#1A1612] border border-white/5 rounded-xl text-text-primary text-[13px] font-sans h-9">
                  <SelectValue>
                    {rangeLabelMap[timeRange] || "選擇時間"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 小時</SelectItem>
                  <SelectItem value="7d">7 日</SelectItem>
                  <SelectItem value="1m">1 個月</SelectItem>
                  <SelectItem value="3m">3 個月</SelectItem>
                  <SelectItem value="6m">6 個月</SelectItem>
                  <SelectItem value="12m">12 個月</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-row justify-evenly text-text-secondary text-sm gap-x-2">
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
          </div>
        </div>

        <div className="h-72 w-full">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={currentChartData}>
                <defs>
                  <linearGradient id="mixViewCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00D2FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00D2FF" stopOpacity={0.0} />
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

                {/* 左 Y 軸線路：總銷售金額 */}
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

                {/* 右 Y 軸線路：查看次數 */}
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
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />

                {/* 右 Y 軸線路：交易次數 */}
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
                    fill: chartConfig.viewCount.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
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

                {/* 瀏覽次數：Area 漸變底襯 */}
                <Area
                  yAxisId="viewCountId"
                  type="monotone"
                  dataKey="viewCount"
                  fill="url(#mixViewCount)"
                  stroke={chartConfig.viewCount.color}
                  strokeWidth={2}
                  hide={!displayArea}
                />

                {/* 總銷售額：Line 折線 */}
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

                {/* 成交次數 */}
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
      {/* Paginated Trading History Section */}
      <div
        id="sku-history"
        className="bg-[#26211C] rounded-2xl border border-white/5 p-5 shadow-lg space-y-4"
      >
        <div className="border-b border-white/5 pb-3">
          <h3 className="font-sans font-bold text-[15px] text-[#eae1da]">
            📊 交易歷史
          </h3>
        </div>

        {filteredHistory.length === 0 ? (
          <div className="py-8 text-center font-sans text-[13px] text-text-disabled">
            該商品於當前區間內暫無交易歷史記錄
          </div>
        ) : (
          <div className="space-y-2.5">
            {/* Header Labels */}
            <div className="grid grid-cols-4 px-3 text-[11px] font-mono text-[#8A8680] uppercase tracking-wider">
              <span>交易日期</span>
              <span>訂單編號</span>
              <span>買家藏家</span>
              <span className="text-right">成交價金額</span>
            </div>

            {/* Paginated Rows Iteration */}
            {paginatedHistory.map((tx) => (
              <div
                key={tx.id}
                className="grid grid-cols-4 items-center px-3 py-3 bg-[#17130f]/50 border border-white/[0.03] rounded-xl font-mono text-[12.5px] transition-all hover:border-brand/20"
              >
                <span className="text-text-disabled">{tx.date}</span>
                <span className="text-brand font-bold">{tx.id}</span>
                <Link
                  href={`/profile/${tx.buyerId}`}
                  className="font-sans font-medium text-[#eae1da] hover:text-brand underline decoration-dotted underline-offset-4 decoration-white/20 hover:decoration-brand transition-colors cursor-pointer text-left focus:outline-none truncate block max-w-max"
                  title={`查看 ${tx.buyerName} 的公開個人檔案`}
                >
                  {tx.buyerName}
                </Link>
                <span className="text-right text-brand font-black">
                  HK$ {tx.price.toLocaleString("zh-TW")}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Integrated Shared Pagination Link Controller */}
        <div className="pt-2">
          <Pagination
            currentPage={historyPage}
            totalPages={Math.ceil(filteredHistory.length / itemsPerPage)}
            onPageChange={(page) => setHistoryPage(page)}
            itemLabel="筆交易流水"
            totalItems={filteredHistory.length}
            itemsPerPage={itemsPerPage}
            enableScroll={true}
            scrollToViewId="sku-history"
          />
        </div>
      </div>
    </section>
  );
}
