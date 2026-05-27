"use client";

/**
 * Tokyo Market Reference (Section 8 from HKcardvault spec)
 * 大盤風向：日本東京連線市價參考 (Tokyo Market Reference Index)
 *
 * Features:
 * - Clean card tiles with mini sparkline trend charts (no heavy K-line charts)
 * - Data from Apify Mercari JP scraper (actual sold prices, not listing prices)
 * - Update frequency: Top 100 hot cards = 4x daily, regular = 1x daily
 * - Provides final scientific reference before purchase decision
 */

import Link from "next/link";

// TODO [MOCK DATA]: Replace with Supabase query on `price_history` table aggregated from Mercari scraper
// TODO [API]: Connect to Apify Mercari JP scraper for real sold transaction data
const marketCards = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR",
    set: "151",
    avgPrice: 45000,
    trend: [42000, 43500, 44000, 45000, 45500, 46000, 45000], // 7-day price history
    trendDirection: "up" as const,
    volume: 156, // Number of sales this week
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR",
    set: "151",
    avgPrice: 52000,
    trend: [54000, 53000, 52500, 52000, 51500, 51800, 52000],
    trendDirection: "down" as const,
    volume: 98,
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR",
    set: "Night Wanderer",
    avgPrice: 38000,
    trend: [36000, 36500, 37000, 37500, 38000, 38200, 38000],
    trendDirection: "up" as const,
    volume: 112,
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR",
    set: "151",
    avgPrice: 8500,
    trend: [8800, 8700, 8600, 8500, 8400, 8450, 8500],
    trendDirection: "neutral" as const,
    volume: 245,
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR",
    set: "151",
    avgPrice: 28000,
    trend: [24000, 25000, 26000, 27000, 28000, 28500, 28000],
    trendDirection: "up" as const,
    volume: 78,
  },
  {
    id: "sv3-199",
    name: "Gardevoir ex SAR",
    set: "Obsidian Flames",
    avgPrice: 22000,
    trend: [23500, 23000, 22500, 22000, 21800, 21900, 22000],
    trendDirection: "down" as const,
    volume: 89,
  },
];

// Simple sparkline SVG component
function Sparkline({
  data,
  direction,
}: {
  data: number[];
  direction: "up" | "down" | "neutral";
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const padding = 2;

  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
      const y =
        height - padding - ((value - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  const color =
    direction === "up"
      ? "#10b981"
      : direction === "down"
        ? "#ef4444"
        : "#8A8680";

  return (
    <svg width={width} height={height} className="shrink-0">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TokyoMarketReference() {
  return (
    <section aria-labelledby="tokyo-market-heading">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2
            id="tokyo-market-heading"
            className="font-sans font-semibold text-[20px] text-text-primary"
          >
            東京市價參考
          </h2>
          <p className="font-sans text-[12px] text-text-secondary mt-1">
            來自 Mercari JP 真實成交數據（7 日趨勢）
          </p>
        </div>
        <Link
          href="/market-trends"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          完整報告 →
        </Link>
      </div>

      {/* Market cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {marketCards.map((card) => (
          <Link
            key={card.id}
            href={`/listing/${card.id}`}
            className="flex items-center justify-between p-4 bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] hover:bg-bg-elevated transition-colors"
          >
            {/* Left: Card info */}
            <div className="flex-1 min-w-0 pr-3">
              <h3 className="font-sans font-semibold text-[14px] text-text-primary truncate">
                {card.name}
              </h3>
              <p className="font-mono text-[11px] text-text-secondary truncate">
                {card.set}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="font-mono font-semibold text-[16px] text-text-primary">
                  ¥{card.avgPrice.toLocaleString("zh-TW")}
                </span>
                <span className="font-mono text-[11px] text-text-disabled">
                  {card.volume} 筆成交
                </span>
              </div>
            </div>

            {/* Right: Sparkline */}
            <div className="flex flex-col items-end gap-1">
              <Sparkline data={card.trend} direction={card.trendDirection} />
              <span
                className={`font-mono text-[11px] ${
                  card.trendDirection === "up"
                    ? "text-success"
                    : card.trendDirection === "down"
                      ? "text-warning"
                      : "text-text-disabled"
                }`}
              >
                {card.trendDirection === "up"
                  ? "▲ 上升"
                  : card.trendDirection === "down"
                    ? "▼ 下跌"
                    : "─ 持平"}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Data source note */}
      <div className="mt-4 p-3 bg-bg-elevated rounded-[10px] border border-[rgba(237,232,224,0.08)]">
        <p className="font-sans text-[12px] text-text-secondary text-center">
          📊 熱門卡牌每日更新 4 次，普通卡牌每日更新 1 次 · 數據來源：Mercari JP 已完成交易
        </p>
      </div>
    </section>
  );
}
