"use client";

import { useState } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { CardItem, type CardData } from "@/app/components/cards/CardItem";

// TODO [database]: Replace with Supabase query — fetch listings from `listings` table with filters applied
const allListings: CardData[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 45000,
    delta: 2400,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/400/280",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 52000,
    delta: 1000,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-mewtwo/400/280",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 38000,
    delta: 1500,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/400/280",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu",
    set: "151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 8500,
    delta: 300,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-pikachu/400/280",
    seller: "東京TCG市場",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex",
    set: "151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "9" },
    price: 28000,
    delta: 3200,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-mimikyu/400/280",
    seller: "名古屋交易商",
  },
  {
    id: "sv2a-213",
    name: "Eevee",
    set: "151",
    rarity: "AR",
    grade: { authority: "RAW", score: "NM" },
    price: 6200,
    delta: 800,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-eevee/400/280",
    seller: "福岡卡牌店",
  },
  {
    id: "sv4a-084",
    name: "Garchomp ex",
    set: "Shiny Treasure ex",
    rarity: "UR",
    grade: { authority: "PSA", score: "10" },
    price: 32000,
    delta: 1800,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-garchomp/400/280",
    seller: "札幌珍稀卡牌",
  },
  {
    id: "sv4a-221",
    name: "Miraidon ex",
    set: "Shiny Treasure ex",
    rarity: "SR",
    grade: { authority: "BGS", score: "9" },
    price: 14500,
    delta: 650,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-miraidon/400/280",
    seller: "仙台收藏館",
  },
  {
    id: "s12a-086",
    name: "Umbreon VMAX",
    set: "VSTAR Universe",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 68000,
    delta: 4200,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon-vmax/400/280",
    seller: "東京TCG市場",
  },
];

type RarityFilter = "全部" | "SAR" | "UR" | "SR" | "AR" | "已評級";
type SortKey = "最新" | "價格↑" | "價格↓";

const RARITY_FILTERS: RarityFilter[] = ["全部", "SAR", "UR", "SR", "AR", "已評級"];
const SORT_OPTIONS: SortKey[] = ["最新", "價格↑", "價格↓"];

// TODO [database]: Replace series list with Supabase query on `card_series` table
const SERIES_FILTERS = [
  { code: "all", name: "所有系列" },
  { code: "sv2a", name: "151 系列" },
  { code: "sv4a", name: "Shiny Treasure ex" },
  { code: "sv6a", name: "Night Wanderer" },
  { code: "s12a", name: "VSTAR Universe" },
];

function SearchIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#50453b"
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

function FilterIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="11" y1="18" x2="13" y2="18" />
    </svg>
  );
}

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [activeRarity, setActiveRarity] = useState<RarityFilter>("全部");
  const [activeSeries, setActiveSeries] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("最新");

  // TODO [server]: Replace client-side filtering with Supabase query params
  const filtered = allListings
    .filter((card) => {
      const matchQuery =
        query === "" ||
        card.name.toLowerCase().includes(query.toLowerCase()) ||
        card.id.toLowerCase().includes(query.toLowerCase());
      const matchRarity =
        activeRarity === "全部"
          ? true
          : activeRarity === "已評級"
          ? card.grade.authority !== "RAW"
          : card.rarity === activeRarity;
      const matchSeries =
        activeSeries === "all" || card.id.startsWith(activeSeries);
      return matchQuery && matchRarity && matchSeries;
    })
    .sort((a, b) => {
      if (sortKey === "價格↑") return a.price - b.price;
      if (sortKey === "價格↓") return b.price - a.price;
      return 0; // 最新 — keep original order (would be DB sort in prod)
    });

  return (
    <div className="min-h-[100dvh] bg-bg-page flex flex-col">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1400px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-8">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="font-sans font-bold text-[24px] lg:text-[28px] text-text-primary">
              市場
            </h1>
            <p className="font-mono text-[12px] text-text-secondary mt-0.5">
              {/* TODO [database]: Replace with live count from Supabase `listings` table */}
              {allListings.length} 件商品上架中
            </p>
          </div>
          {/* Sort Selector */}
          <div className="flex items-center gap-1 bg-bg-card rounded-[10px] border border-[rgba(237,232,224,0.08)] p-1">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setSortKey(opt)}
                className={`h-7 px-3 font-mono text-[11px] font-medium rounded-[7px] transition-colors ${
                  sortKey === opt
                    ? "bg-[rgba(212,165,116,0.15)] text-brand"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* ── Search Bar ──────────────────────────────────────────────── */}
        {/* TODO [server]: Connect to Supabase full-text search on `listings` table — .textSearch('name', query) */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <SearchIcon />
          </div>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="以卡牌名稱或序號搜尋（例：sv2a-182 · Charizard ex）"
            className="w-full h-12 pl-11 pr-4 bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-[10px] font-sans text-[14px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:ring-2 focus:ring-[rgba(212,165,116,0.30)] transition-shadow"
          />
        </div>

        {/* ── Desktop Layout: Sidebar + Grid ──────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-6">
          {/* ── Sidebar Filters (desktop only) ──────────────────────── */}
          <aside className="hidden lg:block space-y-6">
            {/* Rarity */}
            <section aria-labelledby="rarity-filter-heading">
              <h2
                id="rarity-filter-heading"
                className="font-mono text-[11px] font-medium text-text-disabled uppercase tracking-widest mb-3"
              >
                稀有度
              </h2>
              <div className="space-y-1">
                {RARITY_FILTERS.map((r) => (
                  <button
                    key={r}
                    onClick={() => setActiveRarity(r)}
                    className={`w-full text-left px-3 py-2 rounded-[8px] font-sans text-[13px] font-medium transition-colors ${
                      activeRarity === r
                        ? "bg-[rgba(212,165,116,0.12)] text-brand"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </section>

            {/* Series */}
            <section aria-labelledby="series-filter-heading">
              <h2
                id="series-filter-heading"
                className="font-mono text-[11px] font-medium text-text-disabled uppercase tracking-widest mb-3"
              >
                系列
              </h2>
              <div className="space-y-1">
                {SERIES_FILTERS.map((s) => (
                  <button
                    key={s.code}
                    onClick={() => setActiveSeries(s.code)}
                    className={`w-full text-left px-3 py-2 rounded-[8px] font-sans text-[13px] font-medium transition-colors ${
                      activeSeries === s.code
                        ? "bg-[rgba(212,165,116,0.12)] text-brand"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </section>
          </aside>

          {/* ── Mobile Filter Chips ──────────────────────────────────── */}
          <div className="lg:hidden">
            {/* Rarity chips */}
            {/* TODO [server]: Update URL search params on filter change for shareable links */}
            <div className="flex gap-2 mb-3 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {RARITY_FILTERS.map((r) => (
                <button
                  key={r}
                  onClick={() => setActiveRarity(r)}
                  className={`shrink-0 h-8 px-3 font-mono text-[11px] font-medium rounded-[6px] border transition-colors active:scale-[0.98] ${
                    activeRarity === r
                      ? "bg-[rgba(212,165,116,0.15)] text-brand border-[rgba(212,165,116,0.30)]"
                      : "bg-bg-card text-text-secondary border-[rgba(237,232,224,0.08)] hover:border-[rgba(212,165,116,0.20)] hover:text-text-primary"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Series chips */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
              {SERIES_FILTERS.map((s) => (
                <button
                  key={s.code}
                  onClick={() => setActiveSeries(s.code)}
                  className={`shrink-0 h-8 px-3 font-sans text-[11px] font-medium rounded-[6px] border transition-colors active:scale-[0.98] ${
                    activeSeries === s.code
                      ? "bg-[rgba(212,165,116,0.15)] text-brand border-[rgba(212,165,116,0.30)]"
                      : "bg-bg-card text-text-secondary border-[rgba(237,232,224,0.08)] hover:border-[rgba(212,165,116,0.20)] hover:text-text-primary"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>

            {/* ── Mobile Sort + Result Count ─────────────────────────── */}
            <div className="flex items-center justify-between mb-4">
              <p className="font-mono text-[12px] text-text-secondary">
                {filtered.length} 件結果
              </p>
              <div className="flex items-center gap-1" role="group" aria-label="排序選項">
                <FilterIcon />
                <span className="font-mono text-[11px] text-text-secondary mr-1" aria-hidden="true">排序</span>
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setSortKey(opt)}
                    className={`h-7 px-2.5 font-mono text-[10px] font-medium rounded-[6px] border transition-colors ${
                      sortKey === opt
                        ? "bg-[rgba(212,165,116,0.15)] text-brand border-[rgba(212,165,116,0.30)]"
                        : "bg-bg-card text-text-secondary border-[rgba(237,232,224,0.08)]"
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Card grid — mobile */}
            {filtered.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filtered.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>

          {/* ── Card Grid (desktop) ──────────────────────────────────── */}
          <div className="hidden lg:block">
            {/* Desktop result count */}
            <p className="font-mono text-[12px] text-text-secondary mb-4">
              {filtered.length} 件結果
            </p>
            {filtered.length === 0 ? (
              <EmptyState query={query} />
            ) : (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((card) => (
                  <CardItem key={card.id} card={card} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-12 h-12 rounded-full bg-bg-card border border-[rgba(237,232,224,0.08)] flex items-center justify-center mb-4">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#50453b"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </div>
      {query ? (
        <>
          <p className="font-sans text-[15px] text-text-primary font-medium">
            找不到「{query}」的相關卡牌
          </p>
          <p className="font-mono text-[12px] text-text-secondary mt-2">
            請嘗試其他搜尋詞，例如：Charizard ex · sv2a-182 · SAR
          </p>
        </>
      ) : (
        <>
          <p className="font-sans text-[15px] text-text-primary font-medium">
            目前沒有符合條件的上架商品
          </p>
          <p className="font-mono text-[12px] text-text-secondary mt-2">
            請調整篩選條件或稍後再試
          </p>
        </>
      )}
    </div>
  );
}
