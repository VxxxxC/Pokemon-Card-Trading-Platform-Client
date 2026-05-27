"use client";

import { useState, useRef, useEffect } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import { MarketplaceCard, type MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver";

// Realistic HKD pokemon listings translated from JPY for Hong Kong TCG investors
const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: "sv2a-182",
    name: "Charizard ex SAR (噴火龍)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 2250,
    delta: 120,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-charizard/400/280",
    seller: "渡邊道館",
  },
  {
    id: "sv2a-189",
    name: "Mewtwo ex SAR (超夢)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "BGS", score: "9.5" },
    price: 2600,
    delta: 50,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-mewtwo/400/280",
    seller: "京都卡牌專門店",
  },
  {
    id: "sv6a-109",
    name: "Umbreon ex SAR (月亮伊布)",
    set: "Night Wanderer",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 1900,
    delta: 75,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon/400/280",
    seller: "大阪收藏家",
  },
  {
    id: "sv2a-215",
    name: "Pikachu AR (皮卡丘)",
    set: "Pokémon 151",
    rarity: "AR",
    grade: { authority: "CGC", score: "9" },
    price: 425,
    delta: 15,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-pikachu/400/280",
    seller: "東京TCG市場",
  },
  {
    id: "sv2a-233",
    name: "Mimikyu ex SAR (謎擬Q)",
    set: "Pokémon 151",
    rarity: "SAR",
    grade: { authority: "PSA", score: "9" },
    price: 1400,
    delta: 160,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-mimikyu/400/280",
    seller: "名古屋交易商",
  },
  {
    id: "sv2a-213",
    name: "Eevee AR (伊布)",
    set: "Pokémon 151",
    rarity: "AR",
    grade: { authority: "Raw Card", score: "NM" },
    price: 310,
    delta: 40,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-eevee/400/280",
    seller: "福岡卡牌店",
  },
  {
    id: "sv4a-084",
    name: "Garchomp ex UR (烈咬陸鯊)",
    set: "Shiny Treasure ex",
    rarity: "UR",
    grade: { authority: "PSA", score: "10" },
    price: 1600,
    delta: 90,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-garchomp/400/280",
    seller: "札幌珍稀卡牌",
  },
  {
    id: "sv4a-221",
    name: "Miraidon ex SR (密勒頓)",
    set: "Shiny Treasure ex",
    rarity: "SR",
    grade: { authority: "BGS", score: "9" },
    price: 725,
    delta: 32,
    deltaDirection: "down",
    image: "https://picsum.photos/seed/poke-miraidon/400/280",
    seller: "仙台收藏館",
  },
  {
    id: "s12a-086",
    name: "Umbreon VMAX SAR (月亮伊布)",
    set: "VSTAR Universe",
    rarity: "SAR",
    grade: { authority: "PSA", score: "10" },
    price: 3400,
    delta: 210,
    deltaDirection: "up",
    image: "https://picsum.photos/seed/poke-umbreon-vmax/400/280",
    seller: "東京TCG市場",
  },
];

type SortKey = "最新" | "價格：由低到高" | "價格：由高到低";

export default function MarketplacePage() {
  const [query, setQuery] = useState("");
  const [activeRarities, setActiveRarities] = useState<string[]>([]);
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  const [activeConditions, setActiveConditions] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("最新");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global transactional slide-over states
  const [selectedListing, setSelectedListing] = useState<MarketplaceListing | null>(null);
  const [slideOverMode, setSlideOverMode] = useState<"buy" | "bid" | null>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRarityToggle = (rarity: string) => {
    setActiveRarities((prev) =>
      prev.includes(rarity) ? prev.filter((r) => r !== rarity) : [...prev, rarity]
    );
  };

  const handleGradeToggle = (grade: string) => {
    setActiveGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  };

  const handleConditionToggle = (condition: string) => {
    setActiveConditions((prev) =>
      prev.includes(condition) ? prev.filter((c) => c !== condition) : [...prev, condition]
    );
  };

  const clearAllFilters = () => {
    setActiveRarities([]);
    setActiveGrades([]);
    setActiveConditions([]);
    setQuery("");
  };

  // Advanced client-side filtering matching high density metadata
  const filtered = INITIAL_LISTINGS.filter((card) => {
    const matchQuery =
      query === "" ||
      card.name.toLowerCase().includes(query.toLowerCase()) ||
      card.id.toLowerCase().includes(query.toLowerCase());

    const matchRarity = activeRarities.length === 0 || activeRarities.includes(card.rarity);

    const isGradedCard = card.grade.authority !== "Raw Card";
    const matchGrade =
      activeGrades.length === 0 ||
      activeGrades.some((g) => {
        if (g === "Raw Card") return !isGradedCard;
        return card.grade.authority === g.split(" ")[0] && card.grade.score === g.split(" ")[1];
      });

    // Mock match for condition rules
    const matchCondition =
      activeConditions.length === 0 ||
      activeConditions.some((c) => {
        if (c === "美品 S") return card.grade.score === "10" || card.grade.score === "9.5";
        if (c === "微傷 A") return card.grade.score === "9" || card.grade.score === "NM";
        return card.grade.score === "8" || card.grade.score === "EX";
      });

    return matchQuery && matchRarity && matchGrade && matchCondition;
  }).sort((a, b) => {
    if (sortKey === "價格：由低到高") return a.price - b.price;
    if (sortKey === "價格：由高到低") return b.price - a.price;
    return 0; // Default: Latest/Index Order
  });

  return (
    <div className="min-h-[100dvh] bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12">
        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-sans font-bold text-[24px] lg:text-[28px] text-[#eae1da]">
              交易所市場
            </h1>
            <p className="font-mono text-[12px] text-[#d4c4b7] mt-0.5">
              {INITIAL_LISTINGS.length} 件精選實物商品上架中 · 實時更新
            </p>
          </div>

          {/* Sorting Dropdown */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-mono text-[11px] text-[#50453b] uppercase tracking-wider">排序</span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 px-3 bg-[#26211C] text-[#eae1da] border border-[rgba(237,232,224,0.08)] rounded-[8px] font-sans text-[12px] font-medium focus:outline-none focus:ring-1 focus:ring-[#d4a574]/40"
            >
              <option value="最新">上架時間：最新</option>
              <option value="價格：由低到高">價格：由低到高</option>
              <option value="價格：由高到低">價格：由高到低</option>
            </select>
          </div>
        </div>

        {/* ── Smart Search Auto-complete Bar ─────────────────────────────────────────── */}
        <div ref={searchContainerRef} className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="search"
            value={query}
            onFocus={() => setIsSearchFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            placeholder="以卡牌名稱、編號搜尋（例：sv2a-182 · Charizard ex）"
            className="w-full h-12 pl-11 pr-4 bg-[#26211C] border border-[rgba(237,232,224,0.08)] focus:border-[#d4a574]/40 rounded-[10px] font-sans text-[14px] text-[#eae1da] placeholder:text-[#50453b] focus:outline-none focus:ring-2 focus:ring-[#d4a574]/20 transition-all"
          />
          {/* Autocomplete drop panel */}
          <SmartSearch
            query={query}
            listings={INITIAL_LISTINGS}
            isOpen={isSearchFocused}
            onSelect={(name) => {
              setQuery(name);
              setIsSearchFocused(false);
            }}
          />
        </div>

        {/* ── Layout Grid: Sticky Sidebar + Product Cards ──────────────────────────── */}
        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
          
          {/* Sticky Sidebar Filter (Desktop) */}
          <aside className="hidden lg:block lg:sticky lg:top-[5.5rem] max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 scrollbar-hide space-y-4">
            <div className="flex items-center justify-between px-1">
              <span className="font-mono text-[11px] font-semibold text-[#8c7355] uppercase tracking-wider">篩選面板</span>
              {(activeRarities.length > 0 || activeGrades.length > 0 || activeConditions.length > 0 || query) && (
                <button
                  onClick={clearAllFilters}
                  className="font-sans text-[11px] text-[#50453b] hover:text-[#d4a574] transition-colors"
                >
                  清除全部
                </button>
              )}
            </div>
            <AccordionFilters
              activeRarities={activeRarities}
              onRarityToggle={handleRarityToggle}
              activeGrades={activeGrades}
              onGradeToggle={handleGradeToggle}
              activeConditions={activeConditions}
              onConditionToggle={handleConditionToggle}
            />
          </aside>

          {/* Interactive filter toggle for Mobile only */}
          <div className="lg:hidden flex gap-2 overflow-x-auto pb-3 mb-4 scrollbar-hide -mx-4 px-4">
            <button
              onClick={clearAllFilters}
              className="shrink-0 h-8 px-3 rounded-[6px] font-sans text-[11px] font-medium bg-[#26211C] border border-[rgba(237,232,224,0.08)] text-[#d4c4b7]"
            >
              🔄 重置
            </button>
            {["SAR", "UR", "SR", "AR"].map((r) => {
              const isSel = activeRarities.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => handleRarityToggle(r)}
                  className={`shrink-0 h-8 px-3 rounded-[6px] font-mono text-[11px] font-medium border transition-colors ${
                    isSel
                      ? "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/40"
                      : "bg-[#26211C] text-[#d4c4b7] border-[rgba(237,232,224,0.08)]"
                  }`}
                >
                  {r}
                </button>
              );
            })}
            {["PSA 10", "BGS 9.5", "Raw Card"].map((g) => {
              const isSel = activeGrades.includes(g);
              return (
                <button
                  key={g}
                  onClick={() => handleGradeToggle(g)}
                  className={`shrink-0 h-8 px-3 rounded-[6px] font-mono text-[11px] font-medium border transition-colors ${
                    isSel
                      ? "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/40"
                      : "bg-[#26211C] text-[#d4c4b7] border-[rgba(237,232,224,0.08)]"
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>

          {/* ── Right: Main Product Stream Grid ──────────────────────────────────── */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="font-mono text-[12px] text-[#d4c4b7]">
                已篩選出 <span className="text-[#d4a574] font-semibold">{filtered.length}</span> 件商品
              </span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-6">
                <div className="w-12 h-12 rounded-full bg-[#17130f] border border-[rgba(237,232,224,0.08)] flex items-center justify-center mb-4">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#50453b" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <p className="font-sans text-[15px] text-[#eae1da] font-semibold">
                  沒有符合當前篩選條件的商品
                </p>
                <p className="font-mono text-[12px] text-[#d4c4b7] mt-2 max-w-sm">
                  請嘗試清除搜尋詞或放寬稀有度、評分鑑定條件以尋找卡牌。
                </p>
                <button
                  onClick={clearAllFilters}
                  className="mt-5 h-9 px-4 bg-[#d4a574] text-[#17130f] font-sans font-semibold text-[12px] rounded-[8px] hover:bg-[#e8b896] transition-colors"
                >
                  重置所有篩選
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    listing={item}
                    onBuy={(l) => {
                      setSelectedListing(l);
                      setSlideOverMode("buy");
                    }}
                    onBid={(l) => {
                      setSelectedListing(l);
                      setSlideOverMode("bid");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

      {/* Global Transaction Sliding Drawer */}
      <ExecutionSlideOver
        listing={selectedListing}
        mode={slideOverMode}
        onClose={() => {
          setSelectedListing(null);
          setSlideOverMode(null);
        }}
      />
    </div>
  );
}
