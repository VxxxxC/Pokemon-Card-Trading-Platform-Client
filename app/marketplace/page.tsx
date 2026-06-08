"use client";

import { useRef, useEffect, useSyncExternalStore, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MarketplaceCard } from "@/app/components/marketplace/MarketplaceCard";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { useMarketStore, type SortKey } from "@/app/store/useMarketStore";
import { INITIAL_LISTINGS } from "@/app/lib/mock-data/cards";

export default function MarketplacePage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const searchParams = useSearchParams();
  const router = useRouter();
  
  // 精準分流捕捉網址列不同的業務意圖參數
  const urlQuery = searchParams.get("q");
  const urlRarity = searchParams.get("rarity");

  // 按需原子級狀態訂閱
  const query = useMarketStore((state) => state.query);
  const setQuery = useMarketStore((state) => state.setQuery);
  const sortKey = useMarketStore((state) => state.sortKey);
  const setSortKey = useMarketStore((state) => state.setSortKey);
  const isSearchFocused = useMarketStore((state) => state.isSearchFocused);
  const setIsSearchFocused = useMarketStore((state) => state.setIsSearchFocused);

  const activeRarities = useMarketStore((state) => state.activeRarities);
  const activeGrades = useMarketStore((state) => state.activeGrades);
  const activeConditions = useMarketStore((state) => state.activeConditions);
  const activeTypes = useMarketStore((state) => state.activeTypes);

  const toggleRarity = useMarketStore((state) => state.toggleRarity);
  const toggleGrade = useMarketStore((state) => state.toggleGrade);
  const toggleCondition = useMarketStore((state) => state.toggleCondition);
  const toggleType = useMarketStore((state) => state.toggleType);
  const resetAll = useMarketStore((state) => state.resetAll);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  
  // 🟢 核心防禦：建立網址參數歷史同步鎖，徹底封殺異步路由回流 Bug
  const lastSyncedParamsKey = useRef("");

  // 全域參數引流雷達
  useEffect(() => {
    const currentParamsKey = `${urlQuery}-${urlRarity}`;
    
    // 🟢 如果當前網址的參數組合與上一次處理的一模一樣，代表這是由 Zustand 重置觸發的連鎖渲染，直接攔截不重複執行！
    if (lastSyncedParamsKey.current === currentParamsKey) return;

    if (urlQuery !== null) {
      setQuery(urlQuery);
    }
    if (urlRarity !== null && !activeRarities.includes(urlRarity.toUpperCase())) {
      toggleRarity(urlRarity.toUpperCase());
    }

    // 記錄本次成功交割的網址參數狀態
    lastSyncedParamsKey.current = currentParamsKey;
  }, [urlQuery, urlRarity, setQuery, toggleRarity, activeRarities]);

  // 點擊搜尋框外部自動失去焦點
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
  }, [setIsSearchFocused]);

  // 本地重置打包線
  const handleResetAllFilters = () => {
    resetAll();
    router.push("/marketplace");
  };

  // 使用原生 useMemo 進行本地快照引用緩存
  const filteredListings = useMemo(() => {
    return INITIAL_LISTINGS.filter((card) => {
      const searchableCardNo = (card.cardNo ?? card.id).toLowerCase();
      const normalizedQuery = query.toLowerCase();
      
      const matchQuery =
        normalizedQuery === "" ||
        card.name.toLowerCase().includes(normalizedQuery) ||
        searchableCardNo.includes(normalizedQuery);

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

      const matchType =
        activeTypes.length === 0 || 
        activeTypes.includes((card as any).sellerType || (card as any).listingType || "C2C");

      return matchQuery && matchRarity && matchGrade && matchCondition && matchType;
    }).sort((a, b) => {
      if (sortKey === "價格：由低到高") return a.price - b.price;
      if (sortKey === "價格：由高到低") return b.price - a.price;
      return 0;
    });
  }, [query, activeRarities, activeGrades, activeConditions, activeTypes, sortKey]);

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const hasActiveFilters = 
    query !== "" || 
    activeRarities.length > 0 || 
    activeGrades.length > 0 || 
    activeConditions.length > 0 ||
    activeTypes.length > 0;

  return (
    <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12 animate-fadeIn">
      {/* 標題欄 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] tracking-tight">
            交易所大盤市場
          </h1>
          <p className="font-mono text-[11.5px] text-[#d4c4b7] mt-0.5">
            🚀 {filteredListings.length} 件全網聚合現貨標的在庫
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="font-mono text-[10px] text-[#50453b] uppercase tracking-wider font-bold">
            排序
          </span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="h-9 px-3 bg-[#26211C] text-[#eae1da] border border-white/5 rounded-[8px] font-sans text-[12px] focus:outline-none cursor-pointer"
          >
            <option value="最新">上架時間：最新</option>
            <option value="價格：由低到高">價格：由低到高</option>
            <option value="價格：由高到低">價格：由高到低</option>
          </select>
        </div>
      </div>

      {/* 搜尋欄位 + 一鍵還原重置按鈕 */}
      <div ref={searchContainerRef} className="relative mb-6 flex gap-2 items-center">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d4c4b7"
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
            placeholder="搜尋官方卡牌名稱、編號..."
            className="w-full h-12 pl-11 pr-4 bg-[#26211C] border border-white/5 rounded-[10px] text-[13.5px] text-[#eae1da] focus:outline-none"
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

        <button
          type="button"
          onClick={handleResetAllFilters}
          disabled={!hasActiveFilters}
          className={`h-12 px-4 rounded-[10px] font-sans font-bold text-[12.5px] border transition-all flex items-center gap-1.5 shrink-0 select-none focus:outline-none ${
            hasActiveFilters
              ? "border-brand/40 text-brand bg-[rgba(212,165,116,0.06)] hover:border-brand hover:bg-[rgba(212,165,116,0.1)] cursor-pointer active:scale-[0.97]"
              : "border-white/5 text-text-disabled bg-[#26211C]/40 opacity-40 cursor-not-allowed"
          }`}
          title="清除所有搜尋關鍵字與複選矩陣"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
          重置全部
        </button>
      </div>

      {/* 佈局雙欄 */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
        {/* 左欄：手風琴 */}
        <aside className="hidden lg:block lg:sticky lg:top-[5.5rem] max-h-[calc(100vh-8rem)] overflow-y-auto space-y-4 scrollbar-none">
          <AccordionFilters
            activeRarities={activeRarities}
            onRarityToggle={toggleRarity}
            activeGrades={activeGrades}
            onGradeToggle={toggleGrade}
            activeConditions={activeConditions}
            onConditionToggle={toggleCondition}
            activeTypes={activeTypes}
            onTypeToggle={toggleType}
          />
        </aside>

        {/* 右欄：網格 */}
        <div className="flex-1">
          {filteredListings.length === 0 ? (
            <div className="py-20 text-center bg-[#26211C] border border-dashed border-white/5 rounded-2xl font-sans text-[13.5px] text-text-disabled">
              沒有符合篩選條件的商品
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredListings.map((item) => {
                const calibratedCommodityItem = {
                  ...item,
                  detailHref: `/marketplace/product/${item.id}`,
                };
                return (
                  <MarketplaceCard
                    key={item.id}
                    listing={calibratedCommodityItem}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
