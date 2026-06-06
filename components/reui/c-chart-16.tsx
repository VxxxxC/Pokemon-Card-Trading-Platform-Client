"use client";

import React, { useId } from "react";
import type { CSSProperties } from "react";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Datum = Record<string, unknown>;

export interface CChart16Props {
  data: Datum[];
  xKey?: string;
  yKey?: string;
  height?: number;
  color?: string;
}

// Tooltip formatter declared at module scope to satisfy React 19 safety rules
export function chartTooltipFormatter(value: unknown, name?: string | number) {
  return (
    <div className="flex w-full items-center justify-between gap-2">
      <div className="flex items-center gap-1.5">
        <div
          className="h-2.5 w-2.5 shrink-0 rounded-xs bg-(--color-bg)"
          style={
            {
              "--color-bg": `var(--color-${String(name ?? "value")})`,
            } as CSSProperties
          }
        />
        <span className="text-muted-foreground">{String(name ?? "value")}</span>
      </div>
      <span className="text-foreground font-semibold tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : String(value)}
      </span>
    </div>
  );
}

export function CChart16({
  data,
  xKey = "date",
  yKey = "price",
  height = 120,
  color = "#d4a574",
}: CChart16Props) {
  const uniqueId = useId();
  const gradientId = `chart16-fill-${uniqueId}`;
  const dotFilterId = `chart16-dot-glow-${uniqueId}`;
  const lineFilterId = `chart16-line-glow-${uniqueId}`;

  const config: ChartConfig = {
    [yKey]: {
      label: "Price",
      color,
    },
  };

  return (
    <div className="w-full h-full">
      <ChartContainer config={config} initialDimension={{ width: 320, height }}>
        {/* 🟢 核心修正 1：全面調校 AreaChart 邊距矩陣
            - left/right 提升至 12: 配合 XAxis padding，留足空間俾最頭最尾兩粒點，完美拒絕切剩一半
            - bottom 提速至 24: 喺 SVG 視口內部強行騰出 24px 空間，等最底排嘅時間文字完整曝光 */}
        <AreaChart
          data={data}
          margin={{ top: 15, right: 12, bottom: 24, left: 12 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={`var(--color-${yKey})`}
                stopOpacity={0.2}
              />
              <stop
                offset="95%"
                stopColor={`var(--color-${yKey})`}
                stopOpacity={0}
              />
            </linearGradient>

            <filter
              id={dotFilterId}
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            {/* 🟢 核心修正 2：收緊 K 線微光發光濾鏡的邊界範圍
                - 將 height 由 140% 收斂至 115%，y 由 -20% 修正至 -8%
                - 將 stdDeviation 由 8 降噪至 4，在保證黑金微光質感的同時，徹底切斷其向下越獄穿透的能量流！ */}
            <filter
              id={lineFilterId}
              x="-5%"
              y="-8%"
              width="110%"
              height="115%"
            >
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* 網格虛線背景：微弱調和，不喧賓奪主 */}
          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            stroke="rgba(237,232,224,0.05)"
          />

          {/* 🟢 核心修正 3：在 XAxis 注入 padding 擠壓機制
              - padding={{ left: 10, right: 10 }} 會溫柔地將最左同最右嘅極端 K 線點向中央收進 10px
              - 搭配 tickMargin 意圖與樣式，讓底盤時間軸（Date Ticks）顯現得極之專業絲滑 */}
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            padding={{ left: 10, right: 10 }}
            style={{
              fontSize: "10px",
              fontFamily: "var(--font-mono)",
              fill: "#8A8680",
            }}
          />

          <ChartTooltip
            cursor={{ stroke: "rgba(212,165,116,0.15)", strokeWidth: 1 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={chartTooltipFormatter}
              />
            }
          />

          <Area
            dataKey={yKey}
            type="monotone" // 改為更平滑的單調張力曲線
            fill={`url(#${gradientId})`}
            stroke={`var(--color-${yKey})`}
            strokeWidth={2}
            filter={`url(#${lineFilterId})`}
            dot={{
              r: 3.5,
              fill: `var(--color-${yKey})`,
              strokeWidth: 1.5,
              stroke: "#26211C",
              filter: `url(#${dotFilterId})`,
            }}
            activeDot={{ r: 5.5, strokeWidth: 2, stroke: "#eae1da" }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
