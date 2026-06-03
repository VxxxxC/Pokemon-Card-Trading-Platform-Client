"use client";

import { useState, useRef, useEffect } from "react";
import { TopNav } from "@/app/components/navigation/TopNav";
import { MobileHeader } from "@/app/components/navigation/MobileHeader";
import { BottomNav } from "@/app/components/navigation/BottomNav";
import {
  MarketplaceCard,
  type MarketplaceListing,
} from "@/app/components/marketplace/MarketplaceCard";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { ExecutionSlideOver } from "@/app/components/transactions/ExecutionSlideOver"; // 🟢 全域抽屜常駐

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleRarityToggle = (rarity: string) => {
    setActiveRarities((prev) =>
      prev.includes(rarity)
        ? prev.filter((r) => r !== rarity)
        : [...prev, rarity],
    );
  };

  const handleGradeToggle = (grade: string) => {
    setActiveGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade],
    );
  };

  const handleConditionToggle = (condition: string) => {
    setActiveConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition],
    );
  };

  const clearAllFilters = () => {
    setActiveRarities([]);
    setActiveGrades([]);
    setActiveConditions([]);
    setQuery("");
  };

  const filtered = INITIAL_LISTINGS.filter((card) => {
    const matchQuery =
      query === "" ||
      card.name.toLowerCase().includes(query.toLowerCase()) ||
      card.id.toLowerCase().includes(query.toLowerCase());
    const matchRarity =
      activeRarities.length === 0 || activeRarities.includes(card.rarity);
    const isGradedCard = card.grade.authority !== "Raw Card";
    const matchGrade =
      activeGrades.length === 0 ||
      activeGrades.some((g) => {
        if (g === "Raw Card") return !isGradedCard;
        return (
          card.grade.authority === g.split(" ")[0] &&
          card.grade.score === g.split(" ")[1]
        );
      });
    const matchCondition =
      activeConditions.length === 0 ||
      activeConditions.some((c) => {
        if (c === "美品 S")
          return card.grade.score === "10" || card.grade.score === "9.5";
        if (c === "微傷 A")
          return card.grade.score === "9" || card.grade.score === "NM";
        return card.grade.score === "8" || card.grade.score === "EX";
      });
    return matchQuery && matchRarity && matchGrade && matchCondition;
  }).sort((a, b) => {
    if (sortKey === "價格：由低到高") return a.price - b.price;
    if (sortKey === "價格：由高到低") return b.price - a.price;
    return 0;
  });

  return (
    <div className="min-h-[100dvh] bg-[#17130f] text-[#eae1da] flex flex-col font-sans">
      <TopNav />
      <MobileHeader />

      <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="font-sans font-bold text-[24px] lg:text-[28px] text-[#eae1da]">
              交易所市場
            </h1>
            <p className="font-mono text-[12px] text-[#d4c4b7] mt-0.5">
              {INITIAL_LISTINGS.length} 件精選商品上架中
            </p>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="font-mono text-[11px] text-[#50453b] uppercase tracking-wider">
              排序
            </span>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="h-9 px-3 bg-[#26211C] text-[#eae1da] border border-white/5 rounded-[8px] font-sans text-[12px] focus:outline-none"
            >
              <option value="最新">上架時間：最新</option>
              <option value="價格：由低到高">價格：由低到高</option>
              <option value="價格：由高到低">價格：由高到低</option>
            </select>
          </div>
        </div>

        <div ref={searchContainerRef} className="relative mb-6">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#50453b"
              strokeWidth="2.5"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
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
            placeholder="以卡牌名稱、編號搜尋..."
            className="w-full h-12 pl-11 pr-4 bg-[#26211C] border border-white/5 rounded-[10px] text-[14px] focus:outline-none"
          />
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

        <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
          <aside className="hidden lg:block lg:sticky lg:top-[5.5rem] max-h-[calc(100vh-8rem)] overflow-y-auto space-y-4">
            <AccordionFilters
              activeRarities={activeRarities}
              onRarityToggle={handleRarityToggle}
              activeGrades={activeGrades}
              onGradeToggle={handleGradeToggle}
              activeConditions={activeConditions}
              onConditionToggle={handleConditionToggle}
            />
          </aside>

          <div className="flex-1">
            {filtered.length === 0 ? (
              <div className="py-20 text-center bg-[#26211C] rounded-2xl">
                沒有符合篩選條件的商品
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filtered.map((item) => (
                  <MarketplaceCard
                    key={item.id}
                    listing={item}
                    /* 🟢 提示：MarketplaceCard 內可以直接引入我們剛寫好嘅 BuyButton 同 BidButton
                       完全不需要在 page.tsx 裡面層層傳遞回呼函數！ */
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <BottomNav />

      {/* 🟢 常駐全域監聽交易抽屜：不需要任何 Local Props 控制，全自動捕獲事件 */}
      <ExecutionSlideOver />
    </div>
  );
}
