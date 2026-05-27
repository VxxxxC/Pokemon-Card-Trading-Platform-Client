"use client";

import { useState } from "react";

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

// TODO: [database] Replace with Supabase query — fetch from `wishlists` JOIN `price_history` for trend data
const MOCK_WISHLIST: WishlistEntry[] = [
  { id: "sv8a-123", name: "摩魯蛾 SAR",       cardCode: "SV8a-123", rarity: "SAR", trackedPrice: 1_020, currentPrice: 1_080, trend30d:  5.9, sparklinePoints: "0,30 10,26 20,22 30,24 40,18 50,14 60,10", sparklineDirection: "up"   },
  { id: "sv2a-182", name: "Charizard ex SAR", cardCode: "SV2a-182", rarity: "SAR", trackedPrice: 4_100, currentPrice: 3_900, trend30d: -4.9, sparklinePoints: "0,10 10,12 20,16 30,18 40,22 50,24 60,30", sparklineDirection: "down" },
  { id: "sv6a-109", name: "Umbreon ex SAR",   cardCode: "SV6a-109", rarity: "SAR", trackedPrice: 3_050, currentPrice: 3_200, trend30d:  4.9, sparklinePoints: "0,28 10,24 20,20 30,18 40,14 50,12 60,10", sparklineDirection: "up"   },
  { id: "sv2a-215", name: "Pikachu AR",        cardCode: "SV2a-215", rarity: "AR",  trackedPrice:   700, currentPrice:   680, trend30d: -2.9, sparklinePoints: "0,12 10,14 20,16 30,18 40,20 50,22 60,28", sparklineDirection: "down" },
  { id: "sv2a-233", name: "Mimikyu ex SAR",    cardCode: "SV2a-233", rarity: "SAR", trackedPrice: 2_200, currentPrice: 2_380, trend30d:  8.2, sparklinePoints: "0,30 10,26 20,20 30,16 40,14 50,10 60,8",  sparklineDirection: "up"   },
];

const RARITY_STYLE: Record<string, string> = {
  SAR: "text-brand border-[#8c7355]/40 bg-[rgba(212,165,116,0.08)]",
  UR:  "text-[#e8b896] border-[#e8b896]/30 bg-[rgba(232,184,150,0.08)]",
  SR:  "text-[#a8b4c0] border-[#a8b4c0]/30 bg-[rgba(168,180,192,0.08)]",
  AR:  "text-[#7ec8a0] border-[#7ec8a0]/30 bg-[rgba(126,200,160,0.08)]",
  CSR: "text-[#c084fc] border-[#c084fc]/30 bg-[rgba(192,132,252,0.08)]",
};

function MiniSparkline({
  points,
  direction,
}: {
  points: string;
  direction: "up" | "down";
}) {
  const color = direction === "up" ? "#10b981" : "#ef4444";
  return (
    <svg width="60" height="24" viewBox="0 0 60 24" fill="none" aria-hidden="true">
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

export function WishlistTable() {
  const [entries, setEntries] = useState<WishlistEntry[]>(MOCK_WISHLIST);

  const removeEntry = (id: string) =>
    setEntries((prev) => prev.filter((e) => e.id !== id));

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <span className="text-[40px]" aria-hidden="true">☆</span>
        <p className="font-sans text-[15px] text-text-secondary">願望清單為空</p>
        <a
          href="/marketplace"
          className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          瀏覽市場 →
        </a>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 lg:mx-0">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr className="border-b border-[rgba(237,232,224,0.08)]">
            {([
              { label: "卡牧資料",      align: "text-left",   extra: "pl-4 lg:pl-0" },
              { label: "稀有度",        align: "text-center", extra: "px-3" },
              { label: "追蹤價格",      align: "text-right",  extra: "px-3" },
              { label: "現市價格",      align: "text-right",  extra: "px-3" },
              { label: "30D 走勢",     align: "text-center", extra: "px-3" },
              { label: "操作",          align: "text-right",  extra: "pr-4 lg:pr-0" },
            ] as const).map(({ label, align, extra }) => (
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
          {entries.map((entry) => {
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
                    <div className="w-9 h-12 rounded-[4px] bg-bg-elevated border border-[rgba(237,232,224,0.08)] shrink-0 flex items-center justify-center">
                      <span className="font-mono text-[8px] text-text-disabled">{entry.rarity}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="font-sans font-medium text-[13px] text-text-primary truncate">
                        {entry.name}
                      </p>
                      <p className="font-mono text-[10px] text-text-disabled">{entry.cardCode}</p>
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
                    className="font-mono text-[11px] text-text-disabled hover:text-warning transition-colors px-2 py-1 rounded border border-transparent hover:border-warning/30"
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
  );
}
