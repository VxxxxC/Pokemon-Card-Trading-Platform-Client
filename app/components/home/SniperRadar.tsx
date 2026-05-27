"use client";

/**
 * Sniper Radar (Section 4 from HKcardvault spec)
 * 🔥【玩家極致尋寶】狙擊雷達 / 破底價專區 (Sniper Radar)
 *
 * Features:
 * - Shows cards priced below Japanese market average (Mercari JP data)
 * - Displays "📉 低於日本市價 X%", "⚡ 性價比極高" badges
 * - Radar scanning micro-animation
 * - Price delta pre-computed in database (per HKcardvault spec)
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { RarityBadge } from "../cards/RarityBadge";
import { GradeBadge } from "../cards/GradeBadge";

// TODO [MOCK DATA]: Replace with Supabase query on `listings` WHERE price_delta_percentage <= -10
// TODO [BACKEND]: price_delta_percentage field must be pre-computed by database trigger (see HKcardvault spec Section 4)
const sniperDeals = [
  {
    id: "sv2a-182",
    name: "Charizard ex",
    set: "151",
    rarity: "SAR" as const,
    grade: { authority: "PSA" as const, score: "10" },
    price: 38000,
    marketAvg: 45000,
    priceDelta: -15.6, // Pre-computed: (38000 - 45000) / 45000 * 100
    image: "https://picsum.photos/seed/sniper-charizard/320/240",
    seller: "渡邊道館",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex",
    set: "Night Wanderer",
    rarity: "SAR" as const,
    grade: { authority: "PSA" as const, score: "10" },
    price: 32000,
    marketAvg: 38000,
    priceDelta: -15.8,
    image: "https://picsum.photos/seed/sniper-umbreon/320/240",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex",
    set: "151",
    rarity: "SAR" as const,
    grade: { authority: "PSA" as const, score: "9" },
    price: 24000,
    marketAvg: 28000,
    priceDelta: -14.3,
    image: "https://picsum.photos/seed/sniper-mimikyu/320/240",
    seller: "名古屋交易商",
  },
  {
    id: "sv3-199",
    name: "Gardevoir ex",
    set: "Obsidian Flames",
    rarity: "SAR" as const,
    grade: { authority: "BGS" as const, score: "9" },
    price: 18500,
    marketAvg: 22000,
    priceDelta: -15.9,
    image: "https://picsum.photos/seed/sniper-gardevoir/320/240",
    seller: "東京TCG市場",
  },
];

export function SniperRadar() {
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    // Simulate radar scanning animation toggle
    const interval = setInterval(() => {
      setScanning((prev) => !prev);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section aria-labelledby="sniper-radar-heading" className="mb-8">
      {/* Section header with radar animation */}
      <div className="flex items-center gap-3 mb-4">
        {/* Radar icon with pulse animation */}
        <div className="relative w-8 h-8 flex items-center justify-center">
          {scanning && (
            <span className="absolute inset-0 rounded-full bg-warning opacity-20 animate-ping" />
          )}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            className="relative z-10 text-warning"
            aria-hidden="true"
          >
            <circle
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="4 2"
              className={scanning ? "animate-spin-slow" : ""}
            />
            <circle cx="12" cy="12" r="2" fill="currentColor" />
          </svg>
        </div>

        <h2
          id="sniper-radar-heading"
          className="font-sans font-semibold text-[20px] text-text-primary"
        >
          🔥 狙擊雷達 · 破底價專區
        </h2>

        <Link
          href="/marketplace?filter=deals"
          className="ml-auto font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
        >
          查看全部 →
        </Link>
      </div>

      {/* Description */}
      <p className="font-sans text-[13px] text-text-secondary mb-5 max-w-[600px]">
        系統自動對比日本市價（Mercari JP 真實成交數據），發現低於市價 10% 以上的絕佳機會
      </p>

      {/* Deal cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {sniperDeals.map((deal) => (
          <Link
            key={deal.id}
            href={`/listing/${deal.id}`}
            className="block bg-bg-card rounded-[12px] border border-[rgba(237,232,224,0.08)] overflow-hidden shadow-[0_2px_12px_rgba(0,0,0,0.30)] hover:shadow-[0_4px_24px_rgba(0,0,0,0.45)] hover:scale-[1.02] transition-all"
          >
            {/* Card image */}
            <div className="relative h-[180px] bg-bg-elevated">
              <Image
                src={deal.image}
                alt={`${deal.name} - ${deal.set}`}
                fill
                className="object-cover"
              />
              {/* Deal badge overlay */}
              <div className="absolute top-2 left-2">
                <div className="flex items-center gap-1 px-2 py-1 bg-warning rounded-[6px]">
                  <span className="font-mono font-semibold text-[11px] text-[#17130f]">
                    📉 {Math.abs(deal.priceDelta).toFixed(1)}%
                  </span>
                </div>
              </div>
              {/* Rarity badge */}
              <div className="absolute top-2 right-2">
                <RarityBadge rarity={deal.rarity} />
              </div>
              {/* "性價比極高" badge */}
              {deal.priceDelta <= -15 && (
                <div className="absolute bottom-2 left-2">
                  <div className="px-2 py-1 bg-success rounded-[6px]">
                    <span className="font-mono font-semibold text-[11px] text-[#17130f]">
                      ⚡ 性價比極高
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Card info */}
            <div className="p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-sans font-semibold text-[14px] text-text-primary truncate">
                    {deal.name}
                  </h3>
                  <p className="font-mono text-[11px] text-text-secondary truncate">
                    {deal.set}
                  </p>
                </div>
                <GradeBadge authority={deal.grade.authority} score={deal.grade.score} />
              </div>

              {/* Price comparison */}
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-semibold text-[16px] text-success">
                  ¥{deal.price.toLocaleString("zh-TW")}
                </span>
                <span className="font-mono text-[12px] text-text-disabled line-through">
                  ¥{deal.marketAvg.toLocaleString("zh-TW")}
                </span>
              </div>

              <p className="font-sans text-[11px] text-text-secondary truncate">
                {deal.seller}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Info note */}
      <div className="mt-4 p-3 bg-bg-elevated rounded-[10px] border border-[rgba(237,232,224,0.08)]">
        <p className="font-sans text-[12px] text-text-secondary text-center">
          ⚠️ 日本市價數據每 6 小時更新一次，來源：Mercari JP 已成交記錄
        </p>
      </div>
    </section>
  );
}
