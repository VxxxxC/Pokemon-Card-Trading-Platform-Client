"use client";

import {
  useRef,
  useEffect,
  useSyncExternalStore,
  useMemo,
  Suspense,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { MarketplaceCard } from "@/app/components/marketplace/MarketplaceCard";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { SlideOver } from "@/app/components/ui/SlideOver";
import { useMarketStore, type SortKey } from "@/app/store/useMarketStore";
import { INITIAL_LISTINGS } from "@/app/lib/mock-data/cards";

// 🟢 核心引入：使用底層 Base UI 拋光後的奢華 Select 組件群
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 1. 將原本的大盤核心代碼提煉為獨立的內層組件，安全容納 useSearchParams
function MarketplaceContent() {
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
  const setIsSearchFocused = useMarketStore(
    (state) => state.setIsSearchFocused,
  );

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

  // Mobile Filter Panel State
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 核心防禦：建立網址參數歷史同步鎖，徹底封殺異步路由回流 Bug
  const lastSyncedParamsKey = useRef("");

  // 全域參數引流雷達
  useEffect(() => {
    const currentParamsKey = `${urlQuery}-${urlRarity}`;

    if (lastSyncedParamsKey.current === currentParamsKey) return;

    if (urlQuery !== null) {
      setQuery(urlQuery);
    }
    if (
      urlRarity !== null &&
      !activeRarities.includes(urlRarity.toUpperCase())
    ) {
      toggleRarity(urlRarity.toUpperCase());
    }

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

      // 100% 結構化強效斷言，穩健通過 eslint 檢驗
      const matchType =
        activeTypes.length === 0 ||
        activeTypes.includes(
          (card as { sellerType?: string; listingType?: string }).sellerType ||
            (card as { sellerType?: string; listingType?: string })
              .listingType ||
            "C2C",
        );

      return (
        matchQuery && matchRarity && matchGrade && matchCondition && matchType
      );
    }).sort((a, b) => {
      if (sortKey === "價格：由低到高") return a.price - b.price;
      if (sortKey === "價格：由高到低") return b.price - a.price;
      return 0;
    });
  }, [
    query,
    activeRarities,
    activeGrades,
    activeConditions,
    activeTypes,
    sortKey,
  ]);

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
            大盤市場
          </h1>
          <p className="font-mono text-[11.5px] text-[#d4c4b7] mt-0.5">
            🚀 {filteredListings.length} 件全網聚合現貨標的在庫
          </p>
        </div>

        {/* 🟢 排序控制區：使用 shadcn/base-ui Select 組件拋光 */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="font-mono text-[10px] text-[#8A8680] uppercase tracking-wider font-bold select-none">
            排序
          </span>
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
          >
            {/* 調整寬度與黑金背景相契合，並確保字體大小一致不變形 */}
            <SelectTrigger className="w-40 min-w-40 h-9 bg-[#26211C] border border-white/5 rounded-[8px] text-[#eae1da] font-sans text-[12px] hover:bg-[#322a24] hover:border-white/10 transition-colors focus-visible:ring-0 focus-visible:border-brand/40">
              <SelectValue placeholder="選擇排序規則" />
            </SelectTrigger>
            {/* 彈出層黑金風格塗層，確保層級 z-50 不會被下方卡片擊穿 */}
            <SelectContent className="bg-[#26211C] border border-white/10 rounded-lg text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
              <SelectItem
                value="最新"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                上架時間：最新
              </SelectItem>
              <SelectItem
                value="價格：由低到高"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                價格：由低到高
              </SelectItem>
              <SelectItem
                value="價格：由高到低"
                className="focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
              >
                價格：由高到低
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 搜尋欄位 + 行動篩選按鈕 + 一鍵還原重置按鈕 (Tri-partite Responsive System) */}
      <div
        ref={searchContainerRef}
        className="relative mb-6 flex gap-2 items-center"
      >
        {/* Slot A: Mobile-Only Filter Toggle Button */}
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="lg:hidden h-12 px-4 rounded-[10px] font-sans font-bold text-[12.5px] border border-brand/20 bg-[#26211C] text-[#eae1da] hover:border-brand/40 hover:bg-[rgba(212,165,116,0.06)] transition-all flex items-center gap-2 shrink-0 select-none focus:outline-none active:scale-[0.97]"
          title="開啟或關閉行動篩選面板"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="4" y1="21" x2="4" y2="14" />
            <line x1="4" y1="10" x2="4" y2="3" />
            <line x1="12" y1="21" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12" y2="3" />
            <line x1="20" y1="21" x2="20" y2="16" />
            <line x1="20" y1="12" x2="20" y2="3" />
            <line x1="1" y1="14" x2="7" y2="14" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="17" y1="16" x2="23" y2="16" />
          </svg>
        </button>

        {/* Slot B: Main Search Input */}
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

        {/* Slot C: Reset All Button */}
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
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
          </svg>
        </button>
      </div>

      {/* Mobile Filter SlideOver */}
      <SlideOver
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="📊 篩選"
        subtitle="ADVANCED FILTER"
      >
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
      </SlideOver>

      {/* 佈局雙欄 */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
        {/* 左欄：手風琴 (Desktop Only) */}
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

// 🟢 2. 作為唯一的 default export 入口，加裝全域 Suspense 安全隔離網，完美通關 Prerender
export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex items-center justify-center bg-[#17130f] min-h-screen">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
