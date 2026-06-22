"use client";

import Link from "next/link";
import { useState } from "react";
import {
  INITIAL_LISTINGS,
  getEffectivePrice,
  type UnifiedProductSpec,
} from "@/app/lib/mock-data/cards";
import { Pagination } from "@/app/components/ui/Pagination";

// ── Wishlist Registry ─────────────────────────────────────────────────────────
// trackedPrice: the price at which the user began tracking each card.
// All base card data (name, cardCode, rarity, chartPoints) is sourced from INITIAL_LISTINGS SSOT.
// TODO [BACKEND]: Replace with Supabase query — fetch from `wishlists` JOIN `price_history`
const WISHLIST_REGISTRY: { id: string; trackedPrice: number }[] = [
  { id: "sv2a-189", trackedPrice: 2700 }, // Mewtwo ex SAR — slight down trend
  { id: "sv6a-109", trackedPrice: 1700 }, // Umbreon ex SAR — up trend
  { id: "sv2a-215", trackedPrice: 450 }, // Pikachu AR — slight down trend
  { id: "sv3w-085", trackedPrice: 2800 }, // Giratina V SAR — strong up trend
  { id: "sv4k-079", trackedPrice: 1680 }, // Miraidon ex SAR — up trend
  { id: "sv5d-107", trackedPrice: 1480 }, // Koraidon ex SAR — up trend
  { id: "sv4pt5-086", trackedPrice: 2500 }, // Lugia V SAR — strong up trend
];

const ITEMS_PER_PAGE = 5;

const RARITY_STYLE: Record<string, string> = {
  SAR: "text-brand border-[#8c7355]/40 bg-[rgba(212,165,116,0.08)]",
  UR: "text-[#e8b896] border-[#e8b896]/30 bg-[rgba(232,184,150,0.08)]",
  SR: "text-[#a8b4c0] border-[#a8b4c0]/30 bg-[rgba(168,180,192,0.08)]",
  AR: "text-[#7ec8a0] border-[#7ec8a0]/30 bg-[rgba(126,200,160,0.08)]",
  CSR: "text-[#c084fc] border-[#c084fc]/30 bg-[rgba(192,132,252,0.08)]",
};

// ── Sparkline Math Projection Engine ──────────────────────────────────────────
/**
 * Dynamically maps a chartPoints price array into SVG polyline coordinates.
 * Inverts the Y-axis (SVG 0,0 = top-left) and normalises to a fixed viewport.
 */
function getSparklinePoints(
  chartPoints: UnifiedProductSpec["chartPoints"],
  width = 60,
  height = 24,
): string {
  if (!chartPoints || chartPoints.length < 2) return "0,12 60,12";
  const prices = chartPoints.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min === 0 ? 1 : max - min;
  return chartPoints
    .map((point, index) => {
      const x = (index / (chartPoints.length - 1)) * width;
      // Invert Y axis: SVG 0,0 starts from top-left corner
      const y = height - ((point.price - min) / range) * (height - 4) - 2;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

// ── WishlistEntry Type & Builder ──────────────────────────────────────────────
interface WishlistEntry {
  id: string;
  name: string;
  cardCode: string;
  rarity: "SAR" | "UR" | "SR" | "AR" | "CSR";
  trackedPrice: number;
  currentPrice: number;
  trend30d: number;
  sparklinePoints: string;
  sparklineDirection: "up" | "down";
}

/**
 * Builds WishlistEntry[] by joining WISHLIST_REGISTRY with INITIAL_LISTINGS.
 * currentPrice  → last chartPoints price (30-day snapshot)
 * trend30d      → % change from first to last chartPoints price
 * sparklinePoints → computed via getSparklinePoints projection engine
 */
function buildWishlistEntries(): WishlistEntry[] {
  return WISHLIST_REGISTRY.flatMap<WishlistEntry>((meta) => {
    const card = INITIAL_LISTINGS.find((c) => c.id === meta.id);
    if (!card) return [];

    const firstPrice = card.chartPoints[0]?.price ?? meta.trackedPrice;
    const lastPrice = card.chartPoints.at(-1)?.price ?? getEffectivePrice(card);
    const trend30d =
      firstPrice > 0
        ? Number((((lastPrice - firstPrice) / firstPrice) * 100).toFixed(1))
        : 0;

    return [
      {
        id: meta.id,
        name: card.name,
        cardCode: card.cardNo ?? meta.id,
        rarity: card.rarity as WishlistEntry["rarity"],
        trackedPrice: meta.trackedPrice,
        currentPrice: lastPrice,
        trend30d,
        sparklinePoints: getSparklinePoints(card.chartPoints),
        sparklineDirection: trend30d >= 0 ? "up" : "down",
      },
    ];
  });
}

// ── MiniSparkline SVG renderer ─────────────────────────────────────────────────
function MiniSparkline({
  points,
  direction,
}: {
  points: string;
  direction: "up" | "down";
}) {
  const color = direction === "up" ? "#10b981" : "#ef4444";
  return (
    <svg
      width="60"
      height="24"
      viewBox="0 0 60 24"
      fill="none"
      aria-hidden="true"
    >
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

// ── WishlistTable Component ────────────────────────────────────────────────────
export function WishlistTable() {
  // Function form of useState: buildWishlistEntries() runs once at mount only
  const [entries, setEntries] = useState<WishlistEntry[]>(() =>
    buildWishlistEntries(),
  );
  const [wishPage, setWishPage] = useState(1);

  // React 19 zero-useEffect pagination guard — all derived during render
  const totalWishPages = Math.ceil(entries.length / ITEMS_PER_PAGE);
  // Clamp to valid range: when entries are removed, page auto-snaps down
  const safePage =
    entries.length === 0 ? 1 : Math.min(wishPage, totalWishPages);
  const paginatedWishlist = entries.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE,
  );

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-[40px]" aria-hidden="true">
          ☆
        </span>
        <p className="font-sans text-[15px] text-text-secondary">
          願望清單為空
        </p>
        <Link
          href="/marketplace"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          瀏覽市場 →
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto -mx-4 lg:mx-0">
        <table className="w-full min-w-160 border-collapse">
          <thead>
            <tr className="border-b border-[rgba(237,232,224,0.08)]">
              {(
                [
                  {
                    label: "卡牧資料",
                    align: "text-left",
                    extra: "pl-4 lg:pl-0",
                  },
                  {
                    label: "稀有度",
                    align: "text-center text-nowrap",
                    extra: "px-3",
                  },
                  { label: "追蹤價格", align: "text-right", extra: "px-3" },
                  { label: "現市價格", align: "text-right", extra: "px-3" },
                  { label: "30D 走勢", align: "text-center", extra: "px-3" },
                  {
                    label: "操作",
                    align: "text-right",
                    extra: "pr-4 lg:pr-0",
                  },
                ] as const
              ).map(({ label, align, extra }) => (
                <th
                  key={label}
                  className={`font-mono text-[11px] text-text-disabled uppercase tracking-wider pb-3 ${align} ${extra}`}
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedWishlist.map((entry) => {
              const diff = entry.currentPrice - entry.trackedPrice;
              const diffSign = diff >= 0 ? "+" : "";
              const trendSign = entry.trend30d >= 0 ? "▲" : "▼";
              return (
                <tr
                  key={entry.id}
                  className="border-b border-[rgba(237,232,224,0.04)] hover:bg-bg-elevated/50 transition-colors"
                >
                  {/* Card Info */}
                  <td className="py-4 pl-4 lg:pl-0 pr-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-12 rounded-sm bg-bg-elevated border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                        <span className="font-mono text-[8px] text-text-disabled">
                          {entry.rarity}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-sans font-medium text-[13px] text-text-primary truncate">
                          {entry.name}
                        </p>
                        <p className="font-mono text-[10px] text-text-disabled">
                          {entry.cardCode}
                        </p>
                      </div>
                    </div>
                  </td>
                  {/* Rarity */}
                  <td className="py-4 px-3 text-center">
                    <span
                      className={`inline-block font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                        RARITY_STYLE[entry.rarity] ?? RARITY_STYLE.SR
                      }`}
                    >
                      {entry.rarity}
                    </span>
                  </td>
                  {/* Tracked Price */}
                  <td className="py-4 px-3 text-right">
                    <p className="font-mono text-[13px] text-text-secondary">
                      HK$ {entry.trackedPrice.toLocaleString("en-HK")}
                    </p>
                  </td>
                  {/* Current Market Price */}
                  <td className="py-4 px-3 text-right">
                    <p className="font-mono font-semibold text-[14px] text-text-primary">
                      HK$ {entry.currentPrice.toLocaleString("en-HK")}
                    </p>
                    <p
                      className={`font-mono text-[10px] ${
                        diff >= 0 ? "text-success" : "text-warning"
                      }`}
                    >
                      {diffSign}HK$ {Math.abs(diff).toLocaleString("en-HK")}
                    </p>
                  </td>
                  {/* 30D Sparkline */}
                  <td className="py-4 px-3">
                    <div className="flex flex-col items-center gap-0.5">
                      <MiniSparkline
                        points={entry.sparklinePoints}
                        direction={entry.sparklineDirection}
                      />
                      <span
                        className={`font-mono text-[10px] ${
                          entry.trend30d >= 0 ? "text-success" : "text-warning"
                        }`}
                      >
                        {trendSign} {Math.abs(entry.trend30d).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  {/* Remove Action */}
                  <td className="py-4 pl-3 pr-4 lg:pr-0 text-right">
                    <button
                      onClick={() => removeEntry(entry.id)}
                      aria-label={`從願望清單移除 ${entry.name}`}
                      className="font-mono text-[11px] text-nowrap text-text-disabled hover:text-warning transition-colors py-1 rounded border border-transparent hover:border-warning/30"
                    >
                      移除
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Pagination — React 19 zero-useEffect compound state ─────────────── */}
      <Pagination
        currentPage={safePage}
        totalPages={totalWishPages}
        onPageChange={setWishPage}
        itemLabel="筆追蹤記錄"
        totalItems={entries.length}
        itemsPerPage={ITEMS_PER_PAGE}
        hideControls={false}
        enableScroll={true}
        scrollToViewId="wishlist-heading"
        scrollBlock="start"
      />
    </div>
  );
}
