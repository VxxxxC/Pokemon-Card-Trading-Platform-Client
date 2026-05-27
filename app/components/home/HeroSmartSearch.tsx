"use client";

/**
 * Hero Smart Search (Section 1 from HKcardvault spec)
 * 殿堂級首屏：智能搜尋與快速篩選 (Hero & Smart Search)
 *
 * Features:
 * - Large card number search input
 * - PWA install prompt button
 * - Quick filter chips (人氣女角, 噴火龍系列, SAR, UR, SR, AR)
 * - Holographic foil effect on hero cards (CSS gradient, tilt effect)
 */

import { useState } from "react";
import Link from "next/link";

export function HeroSmartSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  // TODO [BACKEND]: onChange must query Supabase `card_catalog` table with card number search
  // TODO [API]: Integrate with TCGdex API for card suggestions

  const quickFilters = [
    { label: "🔥 人氣女角", value: "popular-female" },
    { label: "🐉 噴火龍系列", value: "charizard" },
    { label: "✨ SAR", value: "sar" },
    { label: "UR", value: "ur" },
    { label: "SR", value: "sr" },
    { label: "AR", value: "ar" },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  return (
    <section
      className="relative bg-bg-card rounded-[16px] border border-[rgba(237,232,224,0.08)] p-6 lg:p-10 shadow-[0_2px_12px_rgba(0,0,0,0.50)] overflow-hidden"
      aria-labelledby="hero-search-heading"
    >
      {/* Background pattern or gradient (optional subtle effect) */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,165,116,0.03)] to-transparent pointer-events-none" />

      <div className="relative z-10">
        {/* Heading */}
        <div className="text-center mb-6">
          <h1
            id="hero-search-heading"
            className="font-sans font-bold text-[24px] lg:text-[32px] text-text-primary mb-2"
          >
            搜尋神卡編號
          </h1>
          <p className="font-sans text-[14px] lg:text-[16px] text-text-secondary max-w-[480px] mx-auto">
            輸入卡牌編號（如 SV8a-123），毫秒級找到官方高清原圖與最低價現貨
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleSearch} className="mb-5">
          <div className="relative max-w-[600px] mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入卡牌編號或名稱（例：SV2a-182）"
              className="w-full h-14 px-5 pr-28 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-[10px] font-sans text-[16px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.40)] transition-all"
              aria-label="搜尋卡牌編號"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 px-5 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover"
              aria-label="搜尋"
            >
              搜尋
            </button>
          </div>
        </form>

        {/* Quick Filter Chips */}
        <div
          className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide"
          role="group"
          aria-label="快速篩選"
        >
          {quickFilters.map((filter) => (
            <Link
              key={filter.value}
              href={`/marketplace?filter=${filter.value}`}
              className="inline-flex items-center justify-center h-9 px-4 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-full font-sans text-[13px] text-text-primary hover:bg-bg-hover hover:border-brand transition-colors whitespace-nowrap shrink-0"
            >
              {filter.label}
            </Link>
          ))}
        </div>

        {/* Optional: PWA Install hint */}
        {/* This could be conditionally shown if PWA is not installed */}
        {/* Moved to separate PwaInstallPrompt component in app/components/pwa/ */}
      </div>
    </section>
  );
}
