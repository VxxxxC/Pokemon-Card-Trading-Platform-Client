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
        <AreaChart
          data={data}
          margin={{ top: 20, right: 2, bottom: 0, left: 2 }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="5%"
                stopColor={`var(--color-${yKey})`}
                stopOpacity={0.25}
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
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter
              id={lineFilterId}
              x="-10%"
              y="-20%"
              width="120%"
              height="140%"
            >
              <feGaussianBlur stdDeviation="8" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          <CartesianGrid vertical={false} strokeDasharray="3 3" />
          <XAxis
            dataKey={xKey}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
          />

          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="dot"
                formatter={chartTooltipFormatter}
              />
            }
          />

          <Area
            dataKey={yKey}
            type="natural"
            fill={`url(#${gradientId})`}
            stroke={`var(--color-${yKey})`}
            strokeWidth={2}
            filter={`url(#${lineFilterId})`}
            dot={{
              r: 3.5,
              fill: `var(--color-${yKey})`,
              strokeWidth: 2,
              stroke: "var(--background)",
              filter: `url(#${dotFilterId})`,
            }}
            activeDot={{ r: 6, strokeWidth: 3, stroke: "var(--background)" }}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
