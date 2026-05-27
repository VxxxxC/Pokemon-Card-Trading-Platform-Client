"use client";

import { useState } from "react";
import Link from "next/link";

// TODO: [API] Connect search to Supabase `card_catalog` table for real-time card lookup by set number (e.g. SV8a-123)
// TODO: [database] Query `card_catalog` with indexed search on `card_number` column for millisecond autocomplete

const quickFilters = [
  { label: "🐉 噴火龍系列", query: "charizard" },
  { label: "✨ SAR", query: "rarity=SAR" },
  { label: "UR", query: "rarity=UR" },
  { label: "SR", query: "rarity=SR" },
  { label: "AR", query: "rarity=AR" },
];

export function HeroSearch() {
  const [searchValue, setSearchValue] = useState("");

  return (
    <section
      className="relative mt-5 mb-8 rounded-[16px] overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
      aria-labelledby="hero-search-heading"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,165,116,0.06)] via-transparent to-[rgba(212,165,116,0.03)]" />

      <div className="relative z-10 px-5 py-8 lg:px-10 lg:py-12">
        <span className="font-mono text-[11px] text-brand uppercase tracking-widest">
          HKcardvault
        </span>
        <h1
          id="hero-search-heading"
          className="font-sans font-bold text-[26px] lg:text-[34px] text-text-primary leading-tight mt-1 mb-2"
        >
          搜尋你的目標神卡
        </h1>
        <p className="font-sans text-[14px] text-text-secondary mb-5 max-w-[400px]">
          輸入卡牌編號，毫秒級查詢全港最低價現貨。
        </p>

        {/* Search bar */}
        <div className="flex gap-2 max-w-[520px]">
          <div className="flex-1 relative">
            <SearchIcon />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="輸入卡牌編號 (例: SV8a-123)"
              className="w-full h-11 pl-10 pr-4 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-[8px] font-sans text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(140,115,85,0.40)]"
              aria-label="搜尋卡牌編號"
            />
          </div>
          <Link
            href={`/search?q=${encodeURIComponent(searchValue)}`}
            className="inline-flex items-center justify-center h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover shrink-0"
          >
            搜尋
          </Link>
        </div>

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap gap-2 mt-4">
          {quickFilters.map((filter) => (
            <Link
              key={filter.query}
              href={`/search?${filter.query}`}
              className="inline-flex items-center h-8 px-3 bg-[rgba(212,165,116,0.08)] border border-[rgba(212,165,116,0.15)] rounded-full font-sans text-[12px] text-text-secondary hover:text-brand hover:border-brand transition-colors active:scale-[0.97]"
            >
              {filter.label}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function SearchIcon() {
  return (
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}
