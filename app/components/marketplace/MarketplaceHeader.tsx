"use client";

import { useState } from "react";

const CATEGORIES = [
  { id: "all",     label: "All" },
  { id: "trending",label: "Trending 🔥" },
  { id: "sar",     label: "SAR" },
  { id: "ar",      label: "AR" },
  { id: "ur",      label: "UR" },
  { id: "pikachu", label: "Pikachu" },
  { id: "charizard",label: "Charizard" },
  { id: "sealed",  label: "Sealed Box" },
];

function SearchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#8c7355"
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

export function MarketplaceHeader() {
  const [activeCategory, setActiveCategory] = useState("all");

  return (
    <div className="sticky top-0 z-30 bg-[#17130f]/95 backdrop-blur-md border-b border-[rgba(140,115,85,0.12)] px-4 pt-4 pb-3 space-y-3">
      {/* Page title */}
      <div className="flex items-baseline gap-2">
        <h1 className="font-sans font-bold text-[20px] text-[#eae1da] tracking-tight">
          市場
        </h1>
        <span className="font-mono text-[11px] text-[#8c7355]">Marketplace</span>
      </div>

      {/* Search input */}
      {/* TODO: [server] onChange must query Supabase `listings` table with .textSearch('card_name', query) or TCGdex API */}
      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
          <SearchIcon />
        </div>
        <input
          type="search"
          placeholder="リザードン ex · sv2a-182 · SAR"
          className="w-full h-11 pl-11 pr-4 bg-[#2B1F15] rounded-full font-mono text-[14px] text-[#eae1da] placeholder:text-[#8c7355]/60 border border-[rgba(140,115,85,0.20)] focus:outline-none focus:border-[#8c7355]/50 focus:ring-0 transition-colors"
        />
      </div>

      {/* Category pills — horizontally scrollable, no scrollbar */}
      {/* TODO: [server] category onChange must update URL search params (?category=sar) and re-filter Supabase listings */}
      <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] pb-0.5">
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={`flex-shrink-0 h-8 px-3.5 rounded-full font-mono text-[12px] font-medium transition-all active:scale-[0.96] ${
                isActive
                  ? "bg-[#8c7355]/20 text-[#d4a574] border border-[#8c7355]"
                  : "bg-[#3A2F1F] text-[#d4c4b7] border border-transparent hover:border-[#8c7355]/30"
              }`}
            >
              {cat.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
