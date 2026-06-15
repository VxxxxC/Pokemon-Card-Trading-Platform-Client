"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { IoChevronBack } from "react-icons/io5";
import { ComposedChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
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

const chartConfig: ChartConfig = {
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
};

const rangeLabelMap: Record<string, string> = {
  "12h": "12 小時",
  "7d": "7 日",
  "1m": "1 個月",
  "3m": "3 個月",
  "6m": "6 個月",
  "12m": "12 個月"
};

interface MerchantAnalyticsPageProps {
 searchParams: Promise<{ sku?: string }>;
}

export default function MerchantAnalyticsPage({
 searchParams,
}: MerchantAnalyticsPageProps) {
 const router = useRouter();
 const [timeRange, setTimeRange] = useState<string>("7d");

 // Await searchParams in client side safe pattern using React.use
 const resolvedParams = React.use(searchParams);
 const sku = resolvedParams?.sku ?? null;

 // Extract selected timeseries data
 const currentChartData = useMemo(() => {
   return MOCK_DATA_MAP[timeRange] ?? MOCK_DATA_MAP["7d"];
 }, [timeRange]);

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
         <h1
           id="analytics-heading"
           className="font-sans font-black text-[22px] lg:text-[25px] text-[#eae1da] tracking-tight flex items-center gap-2 flex-wrap"
         >
           {sku && (
             <span className="font-mono text-[#d4a574]">
               {sku}
             </span>
           )}
           <span>商品分析</span>
         </h1>
         <p className="font-mono text-[10px] text-[#8A8680] uppercase tracking-wider mt-0.5">
           Client Container Live Data Stream Viewport
         </p>
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
       <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
         <div>
           <p className="font-sans font-bold text-[15px] text-[#eae1da]">
             商品表現
           </p>
         </div>

         <div className="w-[125px] shrink-0">
         {/* 6-Tier Time-Range Select Controller */}
         <Select value={timeRange} onValueChange={(val) => setTimeRange(val ?? "7d")}>
           <SelectTrigger className="w-full bg-[#1A1612] border border-white/5 rounded-xl text-text-primary text-[13px] font-sans h-9">
             <SelectValue>{rangeLabelMap[timeRange] || "選擇時間"}</SelectValue>
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

               <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
                
               <XAxis
                 dataKey="time"
                 scale="band"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={10}
                 style={{ fill: "#8A8680", fontSize: 10, fontFamily: "monospace" }}
               />
                
               {/* 左 Y 軸線路：主管大金額數值 */}
               <YAxis
                 yAxisId="totalSales"
                 orientation="left"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 style={{ fill: chartConfig.totalSales.color, fontSize: 10, fontFamily: "monospace" }}
                 tickFormatter={(val) => `$${val.toLocaleString()}`}
               />
                
               {/* 右 Y 軸線路：主管小數額次數 */}
               <YAxis
                 yAxisId="viewCount"
                 orientation="right"
                 tickLine={false}
                 axisLine={false}
                 tickMargin={8}
                 style={{ fill: chartConfig.viewCount.color, fontSize: 10, fontFamily: "monospace" }}
                 tickFormatter={(val) => `$${val.toLocaleString()}`}
               />
                
               <ChartTooltip
                 cursor={{ fill: "#ffffff", opacity: 0.04 }}
                 content={
                    <ChartTooltipContent className="bg-[#1A1612] border border-white/10 [&&_*]:text-[#eae1da]" labelClassName="text-lg"/>
                 }
               />

               {/* 瀏覽次數：Area 漸變底襯 */}
               <Area
                 yAxisId="viewCount"
                 type="monotone"
                 dataKey="viewCount"
                 fill="url(#mixViewCount)"
                 stroke={chartConfig.viewCount.color}
                 strokeWidth={2}
               />

               {/* 總銷售額：Line 折線 */}
               <Line
                 yAxisId="totalSales"
                 type="monotone"
                 dataKey="totalSales"
                 stroke={chartConfig.totalSales.color}
                 strokeWidth={2.5}
                 dot={{ r: 3 }}
                 activeDot={{ r: 5 }}
               />
                
               {/* 成交次數 */}
               <Bar
                 dataKey="txCount"
                 fill={chartConfig.txCount.color}
                 radius={[3, 3, 0, 0]}
                 maxBarSize={14}
               />
                
               <ChartLegend content={<ChartLegendContent className="mt-4" />} />
             </ComposedChart>
           </ResponsiveContainer>
         </ChartContainer>
       </div>
     </div>

   </section>
 );
}
