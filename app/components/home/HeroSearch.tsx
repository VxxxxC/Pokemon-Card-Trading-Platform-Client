"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
// 跨模組安全引入簽到卡片元件
import { CheckInCard } from "@/app/components/rewards/CheckInCard";

const quickFilters = [
  { label: "🐉 噴火龍系列", query: "q=charizard" },
  { label: "✨ SAR", query: "rarity=SAR" },
  { label: "UR", query: "rarity=UR" },
  { label: "SR", query: "rarity=SR" },
  { label: "AR", query: "rarity=AR" },
];

export function HeroSearch() {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();

  // 🟢 核心優化：提煉唯一的編程搜尋路由發射器
  const executeSearch = () => {
    const trimmed = searchValue.trim();
    if (trimmed) {
      router.push(`/marketplace?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/marketplace");
    }
  };

  return (
    <section
      className="relative mt-5 mb-8 rounded-[16px] overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
      aria-labelledby="hero-search-heading"
    >
      {/* Background 金屬感奢華漸變底色 */}
      <div className="absolute inset-0 bg-gradient-to-br from-[rgba(212,165,116,0.06)] via-transparent to-[rgba(212,165,116,0.03)]" />

      {/* 核心排版：利用 flex-col lg:flex-row 達成完美的手機端縱向堆疊、電腦端橫向左右分欄 */}
      <div className="relative z-10 px-5 py-6 lg:px-8 lg:py-8 flex flex-col lg:flex-row lg:items-stretch lg:justify-between gap-8">
        
        {/* 左側分欄：大盤核心搜尋中樞 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-start justify-between gap-4">
            <span className="font-mono text-[11px] text-brand uppercase tracking-widest">
              HKcardvault
            </span>
          </div>
          <h1
            id="hero-search-heading"
            className="font-sans font-black text-[26px] lg:text-[32px] text-text-primary leading-tight mt-1 mb-2 tracking-tight"
          >
            搜尋你的目標神卡
          </h1>
          <p className="font-sans text-[13.5px] text-text-secondary mb-5 max-w-[400px]">
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
                /* 🟢 核心修正：捕獲 Enter 鍵盤事件，按下的瞬間直接導流發射 */
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    executeSearch();
                  }
                }}
                placeholder="輸入卡牌編號 (例: SV8a-123)"
                className="w-full h-11 pl-10 pr-4 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-[8px] font-sans text-[13.5px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(140,115,85,0.40)]"
                aria-label="搜尋卡牌編號"
              />
            </div>
            
            {/* 點擊搜尋按鈕 */}
            <button
              type="button"
              onClick={executeSearch}
              className="inline-flex items-center justify-center h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[13.5px] rounded-[8px] active:scale-[0.98] transition-transform hover:bg-brand-hover shrink-0 cursor-pointer focus:outline-none"
            >
              搜尋
            </button>
          </div>

          {/* 快捷篩選晶片 */}
          <div className="flex flex-wrap gap-2 mt-4">
            {quickFilters.map((filter) => (
              <Link
                key={filter.query}
                href={`/marketplace?${filter.query}`}
                className="inline-flex items-center h-8 px-3 bg-[rgba(212,165,116,0.08)] border border-[rgba(212,165,116,0.15)] rounded-full font-sans text-[12px] text-text-secondary hover:text-brand hover:border-brand transition-colors active:scale-[0.97]"
              >
                {filter.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 右側分欄：固定電腦端最完美看盤寬度，融入 Hero 看板之內 */}
        <div className="w-full lg:w-[550px] shrink-0">
          <CheckInCard />
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
