"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Spec Section 1: Quick Filter Chips — popular categories
const quickFilters = [
  { label: "🔥 人氣女角", query: "人氣女角" },
  { label: "🐉 噴火龍系列", query: "Charizard" },
  { label: "✨ SAR", query: "SAR" },
  { label: "UR", query: "UR" },
  { label: "SR", query: "SR" },
  { label: "AR", query: "AR" },
  { label: "ACE", query: "ACE" },
  { label: "🎴 151系列", query: "151" },
];

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export function HeroSection() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/marketplace?q=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/marketplace");
    }
  };

  const handleChipClick = (filterQuery: string) => {
    router.push(`/marketplace?q=${encodeURIComponent(filterQuery)}`);
  };

  return (
    <section
      className="relative mt-5 mb-8 rounded-[16px] overflow-hidden min-h-[320px] lg:min-h-[400px] flex flex-col justify-end"
      aria-labelledby="hero-heading"
    >
      <Image
        src="https://picsum.photos/seed/poke-hero-charizard/800/400"
        alt="Charizard ex SAR — 151 系列"
        fill
        className="object-cover"
        priority
      />
      {/* TODO [server]: Replace picsum placeholder with real card image from Supabase Storage or bunny.net CDN */}

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#17130f] via-[#17130f]/80 to-transparent" />

      <div className="relative z-10 p-6 lg:p-10 w-full">
        <div className="lg:max-w-[600px]">
          <span className="font-mono text-[11px] text-brand uppercase tracking-widest">
            日版寶可夢卡牌專業交易平台
          </span>
          <h1
            id="hero-heading"
            className="font-sans font-bold text-[28px] lg:text-[36px] text-text-primary leading-tight mt-1 mb-2"
          >
            高分鑑定卡收藏，安心交易
          </h1>
          <p className="font-sans text-[14px] text-text-secondary mb-5 max-w-[400px]">
            實時日本市價參考、第三方託管保障、專業鑑定。收藏家與投資者的首選平台。
          </p>

          {/* Spec: Smart Search Bar — card number search (e.g. SV8a-123) */}
          <form onSubmit={handleSubmit} className="relative mb-4 max-w-[520px]">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜尋卡牌編號或名稱（例：sv8a-123 · Charizard ex）"
              className="w-full h-12 pl-12 pr-20 bg-[rgba(38,33,28,0.90)] backdrop-blur-sm border border-[rgba(237,232,224,0.12)] rounded-[10px] font-sans text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.30)] transition-shadow"
            />
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 px-4 bg-brand text-[#17130f] font-sans font-medium text-[13px] rounded-[6px] active:scale-[0.98] transition-transform hover:bg-brand-hover min-h-[36px]"
            >
              搜尋
            </button>
          </form>

          {/* Spec: Quick Filter Chips — horizontal scrolling pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none max-w-[520px]">
            {quickFilters.map((filter) => (
              <button
                key={filter.query}
                onClick={() => handleChipClick(filter.query)}
                className="shrink-0 px-3 py-1.5 bg-[rgba(212,165,116,0.10)] border border-[rgba(212,165,116,0.15)] text-brand font-sans text-[12px] rounded-full hover:bg-[rgba(212,165,116,0.20)] active:scale-[0.98] transition-all min-h-[32px]"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="flex items-center gap-3 mt-5 lg:max-w-[600px]">
          <Link
            href="/marketplace"
            className="inline-flex items-center justify-center h-11 px-6 bg-brand text-[#17130f] font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-brand-hover min-h-[44px]"
          >
            瀏覽市場
          </Link>
          <Link
            href="/auth"
            className="inline-flex items-center justify-center h-11 px-6 border border-[rgba(237,232,224,0.12)] text-brand font-sans font-semibold text-[14px] rounded-[8px] active:scale-[0.98] active:translate-y-[1px] transition-transform hover:bg-bg-elevated min-h-[44px]"
          >
            立即註冊
          </Link>
        </div>
      </div>
    </section>
  );
}
