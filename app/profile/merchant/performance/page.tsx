"use client";

import * as React from "react";
import { useState, useMemo } from "react";
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

// ─── Data Types ──────────────────────────────────────────────────────────────

interface PerformanceMetric {
  label: string;
  turnover: number;
  avgPrice: number;
  txCount: number;
}

// ─── Mock Time Dimension Datasets ─────────────────────────────────────────────

const PERFORMANCE_DATA_MAP: Record<string, PerformanceMetric[]> = {
  "12h": [
    { label: "02:00", turnover: 12500, avgPrice: 12500, txCount: 1 },
    { label: "04:00", turnover: 28000, avgPrice: 14000, txCount: 2 },
    { label: "06:00", turnover: 18500, avgPrice: 18500, txCount: 1 },
    { label: "08:00", turnover: 45000, avgPrice: 15000, txCount: 3 },
    { label: "10:00", turnover: 32000, avgPrice: 16000, txCount: 2 },
    { label: "12:00", turnover: 55000, avgPrice: 18333, txCount: 3 },
  ],
  "7d": [
    { label: "週一", turnover: 65000, avgPrice: 13000, txCount: 5 },
    { label: "週二", turnover: 48000, avgPrice: 16000, txCount: 3 },
    { label: "週三", turnover: 82000, avgPrice: 13666, txCount: 6 },
    { label: "週四", turnover: 120000, avgPrice: 15000, txCount: 8 },
    { label: "週五", turnover: 95000, avgPrice: 19000, txCount: 5 },
    { label: "週六", turnover: 155000, avgPrice: 15500, txCount: 10 },
    { label: "週日", turnover: 140000, avgPrice: 17500, txCount: 8 },
  ],
  "1m": [
    { label: "第一週", turnover: 280000, avgPrice: 14000, txCount: 20 },
    { label: "第二週", turnover: 350000, avgPrice: 14583, txCount: 24 },
    { label: "第三週", turnover: 420000, avgPrice: 15000, txCount: 28 },
    { label: "第四週", turnover: 390000, avgPrice: 15600, txCount: 25 },
  ],
  "3m": [
    { label: "4月", turnover: 1150000, avgPrice: 14375, txCount: 80 },
    { label: "5月", turnover: 1480000, avgPrice: 15578, txCount: 95 },
    { label: "6月", turnover: 1620000, avgPrice: 16200, txCount: 100 },
  ],
  "6m": [
    { label: "1月", turnover: 950000, avgPrice: 13571, txCount: 70 },
    { label: "2月", turnover: 1100000, avgPrice: 13750, txCount: 80 },
    { label: "3月", turnover: 1300000, avgPrice: 14444, txCount: 90 },
    { label: "4月", turnover: 1150000, avgPrice: 14375, txCount: 80 },
    { label: "5月", turnover: 1480000, avgPrice: 15578, txCount: 95 },
    { label: "6月", turnover: 1620000, avgPrice: 16200, txCount: 100 },
  ],
  "12m": [
    { label: "去年7月", turnover: 850000, avgPrice: 13076, txCount: 65 },
    { label: "去年8月", turnover: 920000, avgPrice: 13142, txCount: 70 },
    { label: "去年9月", turnover: 880000, avgPrice: 13538, txCount: 65 },
    { label: "去年10月", turnover: 1050000, avgPrice: 14000, txCount: 75 },
    { label: "去年11月", turnover: 1120000, avgPrice: 14000, txCount: 80 },
    { label: "去年12月", turnover: 1250000, avgPrice: 14705, txCount: 85 },
    { label: "1月", turnover: 950000, avgPrice: 13571, txCount: 70 },
    { label: "2月", turnover: 1100000, avgPrice: 13750, txCount: 80 },
    { label: "3月", turnover: 1300000, avgPrice: 14444, txCount: 90 },
    { label: "4月", turnover: 1150000, avgPrice: 14375, txCount: 80 },
    { label: "5月", turnover: 1480000, avgPrice: 15578, txCount: 95 },
    { label: "6月", turnover: 1620000, avgPrice: 16200, txCount: 100 },
  ],
};

// ─── Top 9 Velocity SKU Products ──────────────────────────────────────────────

interface TopProduct {
  rank: number;
  name: string;
  skuNo: string;
  volume: number;
  revenue: number;
}

const TOP_PRODUCTS: TopProduct[] = [
  {
    rank: 1,
    name: "Pikachu AR",
    skuNo: "sv2a-173",
    volume: 84,
    revenue: 126000,
  },
  {
    rank: 2,
    name: "Charizard ex SAR",
    skuNo: "SKU-sv2a-182",
    volume: 52,
    revenue: 156000,
  },
  {
    rank: 3,
    name: "Lillie SR",
    skuNo: "sm4+-119",
    volume: 15,
    revenue: 450000,
  },
  {
    rank: 4,
    name: "Mew ex SAR",
    skuNo: "sku-sv2a-205",
    volume: 41,
    revenue: 82000,
  },
  {
    rank: 5,
    name: "Giratina V SA",
    skuNo: "sku-s11-111",
    volume: 23,
    revenue: 138000,
  },
  {
    rank: 6,
    name: "Rayquaza VMAX SA",
    skuNo: "s7r-083",
    volume: 18,
    revenue: 198000,
  },
  {
    rank: 7,
    name: "Mario Pikachu",
    skuNo: "294/XY-P",
    volume: 5,
    revenue: 225000,
  },
  {
    rank: 8,
    name: "Umbreon VMAX SA",
    skuNo: "s7d-095",
    volume: 12,
    revenue: 288000,
  },
  { rank: 9, name: "Acerola SR", skuNo: "sm2+056", volume: 8, revenue: 240000 },
];

// ─── Top 9 High-Value Consumers ───────────────────────────────────────────────

interface HighValueConsumer {
  id: string;
  name: string;
  spending: number;
  avatar: string;
}

const HIGH_VALUE_CONSUMERS: HighValueConsumer[] = [
  {
    id: "satoshi-k",
    name: "Satoshi_K",
    spending: 1280000,
    avatar: "https://picsum.photos/id/1025/100/100",
  },
  {
    id: "yugi-collector",
    name: "Yugi_Collector",
    spending: 940000,
    avatar: "https://picsum.photos/id/1012/100/100",
  },
  {
    id: "pika-rich",
    name: "Pika_Rich",
    spending: 750000,
    avatar: "https://picsum.photos/id/1027/100/100",
  },
  {
    id: "tomy-trading",
    name: "Tomy_Trading",
    spending: 580000,
    avatar: "https://picsum.photos/id/1005/100/100",
  },
  {
    id: "psa-10-hunter",
    name: "PSA_10_Hunter",
    spending: 460000,
    avatar: "https://picsum.photos/id/1062/100/100",
  },
  {
    id: "marnie-simp",
    name: "Marnie_Simp",
    spending: 390000,
    avatar: "https://picsum.photos/id/1074/100/100",
  },
  {
    id: "card-shogun",
    name: "Card_Shogun",
    spending: 320000,
    avatar: "https://picsum.photos/id/64/100/100",
  },
  {
    id: "neo-tokyo",
    name: "Neo_Tokyo",
    spending: 270000,
    avatar: "https://picsum.photos/id/91/100/100",
  },
  {
    id: "gengar-ghost",
    name: "Gengar_Ghost",
    spending: 210000,
    avatar: "https://picsum.photos/id/338/100/100",
  },
];

// ─── Chart Config ─────────────────────────────────────────────────────────────

const chartConfig = {
  turnover: {
    label: "營業額",
    color: "#d4a574", // 奢華金
  },
  avgPrice: {
    label: "平均價",
    color: "#00D2FF", // 🟢 優化點 2：換裝硬核高飽和「電光藍」，一秒撕開視覺差，極度搶眼！
  },
  txCount: {
    label: "成交總數",
    color: "#10b981", // 翡翠綠
  },
} satisfies ChartConfig;

const RANGE_LABEL_MAP: Record<string, string> = {
  "12h": "12小時內",
  "7d": "7日內",
  "1m": "1個月內",
  "3m": "3個月內",
  "6m": "6個月內",
  "12m": "12個月內",
};

const selectDisplayMap: Record<string, string> = {
  "12h": "12 小時",
  "7d": "7 日",
  "1m": "1 個月",
  "3m": "3 個月",
  "6m": "6 個月",
  "12m": "12 個月",
};

// ─── Component Root ───────────────────────────────────────────────────────────

export default function MerchantPerformancePage() {
  const router = useRouter();
  const [range, setRange] = useState<string>("7d"); // 預設對齊截圖的 7d 視角
  const [displayArea, setDisplayArea] = useState<boolean>(true);
  const [displayLine, setDisplayLine] = useState<boolean>(true);
  const [displayBar, setDisplayBar] = useState<boolean>(true);

  const activeData = useMemo(() => {
    return PERFORMANCE_DATA_MAP[range] || PERFORMANCE_DATA_MAP["7d"];
  }, [range]);

  // 演算法：計算 3 個 KPI 全量歷史總和
  const allTimeMetrics = useMemo(() => {
    let turnoverSum = 0;
    let txCountSum = 0;

    Object.values(PERFORMANCE_DATA_MAP).forEach((dataset) => {
      dataset.forEach((day) => {
        turnoverSum += day.turnover;
        txCountSum += day.txCount;
      });
    });

    const avgPriceCalc =
      txCountSum > 0 ? Math.round(turnoverSum / txCountSum) : 0;
    return { turnoverSum, txCountSum, avgPriceCalc };
  }, []);

  // 演算法：根據局部時間範圍計算動態分析區間值
  const intervalTurnover = useMemo(() => {
    return activeData.reduce((acc, d) => acc + d.turnover, 0);
  }, [activeData]);

  const intervalTxCount = useMemo(() => {
    return activeData.reduce((acc, d) => acc + d.txCount, 0);
  }, [activeData]);

  const intervalAvgPrice = useMemo(() => {
    const count = activeData.reduce((acc, d) => acc + d.txCount, 0);
    return count > 0 ? Math.round(intervalTurnover / count) : 0;
  }, [activeData, intervalTurnover]);

  const currentRangeLabel = RANGE_LABEL_MAP[range] || "當前區間";

  return (
    <section
      aria-labelledby="performance-heading"
      className="space-y-6 animate-fadeIn p-4 md:p-6 bg-bg-page min-h-screen text-text-primary"
    >
      {/* Header Control */}
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

      {/* 頂層歷史全量累計大盤 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            歷史累計總營業額
          </p>
          <p
            className={`font-mono text-[24px] font-black text-[${chartConfig.turnover.color}] leading-none tracking-tight`}
          >
            HK$ {allTimeMetrics.turnoverSum.toLocaleString()}
          </p>
        </div>

        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            歷史累計平均單價
          </p>
          <p
            className={`font-mono text-[24px] font-black text-[${chartConfig.avgPrice.color}] leading-none tracking-tight`}
          >
            HK$ {allTimeMetrics.avgPriceCalc.toLocaleString()}
          </p>
        </div>

        <div className="w-full bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 shadow-sm relative group overflow-hidden">
          <p className="font-sans text-[12px] text-text-secondary font-medium tracking-tight mb-2">
            歷史累計總成交次數
          </p>
          <p
            className={`font-mono text-[24px] font-black text-[${chartConfig.txCount.color}] leading-none tracking-tight`}
          >
            {allTimeMetrics.txCountSum.toLocaleString()} 次
          </p>
        </div>
      </div>

      {/* Interactive Multi-Scale Performance Engine Container */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
        <div className="flex flex-col">
          <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
            <div>
              <p className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
                營收、價格與成交量
              </p>
            </div>

            <div className="w-[125px] shrink-0">
              <Select
                value={range}
                onValueChange={(val) => val && setRange(val)}
              >
                <SelectTrigger className="w-full bg-[#1A1612] border border-white/5 rounded-xl text-text-primary text-[13px] font-sans h-9">
                  <SelectValue>
                    {selectDisplayMap[range] || "選擇時間"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-[#1A1612] border border-white/10 text-text-primary">
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

        {/* Bounding Graphic Viewport Frame */}
        <div className="h-72 w-full">
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

                {/* ── 🟢 核心修正 1：加裝 scale="band"，強行壓縮 Area 折線的錨點，精準鎖死在柱狀圖正中央！ ── */}
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

                {/* 左 Y 軸線路：主管大金額數值 */}
                <YAxis
                  yAxisId="turnover"
                  hide
                  includeHidden
                  label={chartConfig.turnover.label}
                  orientation="left"
                  domain={["auto", "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.turnover.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />

                {/* 右 Y 軸線路：主管平均價 */}
                <YAxis
                  yAxisId="avgPrice"
                  hide
                  includeHidden
                  label={chartConfig.avgPrice.label}
                  orientation="right"
                  domain={["auto", "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.avgPrice.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />

                {/* 右 Y 軸線路：交易次數 */}
                <YAxis
                  yAxisId="txCount"
                  hide
                  includeHidden
                  label={chartConfig.txCount.label}
                  orientation="right"
                  domain={["auto", "auto"]}
                  tickCount={6}
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  style={{
                    fill: chartConfig.avgPrice.color,
                    fontSize: 10,
                    fontFamily: "monospace",
                  }}
                  tickFormatter={(val) => `$${val.toLocaleString()}`}
                />

                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]"
                      labelClassName="text-lg"
                    />
                  }
                />

                {/* 平均價：Area 漸變底襯 */}
                <Area
                  yAxisId="avgPrice"
                  type="monotone"
                  dataKey="avgPrice"
                  fill="url(#mixAvgPrice)"
                  stroke={chartConfig.avgPrice.color}
                  strokeWidth={2}
                  hide={!displayArea}
                />

                {/* 營業額：Line 折線 */}
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

                {/* 成交總數 */}
                <Bar
                  yAxisId="txCount"
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

        {/* 局部篩選區間動態對數艙 */}
        <div className="mt-6 pt-5 border-t border-white/5 w-full">
          <h4 className="font-sans font-bold text-[13.5px] text-brand tracking-tight mb-4">
            📊 區間營收轉化動態分析 ({currentRangeLabel})
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#17130f] border border-white/5 rounded-xl px-4 py-3 flex flex-col">
              <span className="font-mono text-[10.5px]">區間總營業額</span>
              <span
                className={`text-[#d4a574] font-mono text-[16px] font-bold mt-1`}
              >
                HK$ {intervalTurnover.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#17130f] border border-white/5 rounded-xl px-4 py-3 flex flex-col">
              <span className="font-mono text-[10.5px]">區間平均價 (AOV)</span>
              <span
                className={`text-[#00D2FF] font-mono text-[16px] font-bold mt-1`}
              >
                HK$ {intervalAvgPrice.toLocaleString()}
              </span>
            </div>
            <div className="bg-[#17130f] border border-white/5 rounded-xl px-4 py-3 flex flex-col">
              <span className="font-mono text-[10.5px]">區間總交易筆數</span>
              <span
                className={`text-[#10b981] font-mono text-[16px] font-bold mt-1`}
              >
                {intervalTxCount.toLocaleString()} 次
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Side-by-Side Dual-List Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* List 1: Top 9 Velocity SKU Products */}
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
              暢銷商品排行榜
            </h3>
          </div>

          <div className="divide-y divide-white/5">
            {TOP_PRODUCTS.map((prod) => (
              <div
                key={prod.rank}
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
                    href={`/profile/merchant/analytics?sku=${encodeURIComponent(prod.skuNo)}`}
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
        </div>

        {/* List 2: Top 9 High-Value Consumers */}
        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
          <div className="mb-4">
            <h3 className="font-sans font-bold text-[15px] text-text-primary tracking-tight">
              高價值客戶
            </h3>
          </div>

          <div className="divide-y divide-white/5">
            {HIGH_VALUE_CONSUMERS.map((client, idx) => (
              <div
                key={client.id}
                className="flex items-center justify-between py-3 text-[13.5px]"
              >
                <Link
                  href={`/profile/${client.id}`}
                  className="flex items-center gap-3 hover:text-brand transition-colors group min-w-0"
                >
                  <span className="font-mono text-[11px] text-text-primary w-4 text-center shrink-0">
                    {idx + 1}
                  </span>

                  <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/10">
                    <Image
                      src={client.avatar}
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
                      VIP LEVEL {idx < 3 ? "III" : idx < 6 ? "II" : "I"}
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
        </div>
      </div>
    </section>
  );
}
