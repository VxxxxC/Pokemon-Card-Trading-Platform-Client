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
// 全域黑金奢華分頁組件
import { Pagination } from "@/app/components/ui/Pagination";
import { MarketplaceCard } from "@/app/components/marketplace/MarketplaceCard";
import { MarketplaceEmptyState } from "@/app/components/marketplace/MarketplaceEmptyState";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { SlideOver } from "@/app/components/ui/SlideOver";
import { useMarketStore, type SortKey } from "@/app/store/useMarketStore";
import { useMarketplaceSearch } from "@/app/lib/hooks/useMarketplaceSearch";
import type { MarketplaceProductRow } from "@/app/lib/marketplace/types";
import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";

const RARITY_VALUES = new Set(["SAR", "UR", "SR", "AR"]);

function mapRarity(
  rarity: string | null,
): MarketplaceListing["rarity"] {
  const normalized = rarity?.toUpperCase() ?? "";
  return RARITY_VALUES.has(normalized)
    ? (normalized as MarketplaceListing["rarity"])
    : "SR";
}

function formatGrade(
  company: string,
  score: string | null,
): { authority: string; score: string } {
  const normalized = company.toUpperCase();
  if (normalized === "RAW") {
    return { authority: "Raw Card", score: score ?? "" };
  }
  return { authority: company, score: score ?? "" };
}

function toMarketplaceListing(
  product: MarketplaceProductRow,
): MarketplaceListing {
  return {
    id: product.productId,
    cardNo: product.cardNumber ?? product.displayId ?? product.productId,
    name: product.productName,
    set: product.setCode,
    rarity: mapRarity(product.rarity),
    grade: formatGrade(product.gradingCompany, product.gradingScore),
    price: product.lowestPrice,
    delta: 0,
    deltaDirection: "up",
    image: product.imageUrl,
    seller: product.sellerName,
    sellerId: product.sellerId,
    detailHref: `/marketplace/product/${product.productId}`,
  };
}

// 使用底層 Base UI 拋光後的奢華 Select 組件群
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// 使用底層 Base UI 雙軸價格區間滑桿
import { Slider } from "@/components/ui/slider";

function MarketplaceContent() {
  const _isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get("q");
  const urlRarity = searchParams.get("rarity");

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
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  // 響應式視窗寬度檢測（用於動態計算 Mobile 5 Rows vs Web 4 Rows）
  const [isMobileViewport, setIsMobileViewport] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const checkViewport = () => {
      setIsMobileViewport(window.innerWidth < 1280); // xl Breakpoint 之前視爲 Mobile/Tablet 雙列流
    };
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  // 大盤商品網格分頁狀態
  const [pageState, setPageState] = useState({ page: 1, forKey: "" });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100_000]);
  const priceBoundsInitialized = useRef(false);

  const itemsPerPage = isMobileViewport ? 9 : 11;

  const filterKey = `${query}|${sortKey}|${activeRarities.join(",")}|${activeGrades.join(",")}|${activeConditions.join(",")}|${activeTypes.join(",")}|${priceRange.join(",")}`;
  const currentPage = pageState.forKey === filterKey ? pageState.page : 1;

  const { products, meta, isLoading, error, priceBounds } = useMarketplaceSearch(
    {
      query,
      rarities: activeRarities,
      grades: activeGrades,
      sellerTypes: activeTypes,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      sortKey,
      page: currentPage,
      pageSize: itemsPerPage,
    },
  );

  const derivedListings = useMemo(
    () => products.map(toMarketplaceListing),
    [products],
  );

  const absoluteMinPrice = priceBounds?.minPrice ?? 0;
  const absoluteMaxPrice = priceBounds?.maxPrice ?? 100_000;

  useEffect(() => {
    if (!priceBounds || priceBoundsInitialized.current) return;
    priceBoundsInitialized.current = true;
    setPriceRange((prev) => {
      if (
        prev[0] === priceBounds.minPrice &&
        prev[1] === priceBounds.maxPrice
      ) {
        return prev;
      }
      return [priceBounds.minPrice, priceBounds.maxPrice];
    });
  }, [priceBounds]);

  const lastSyncedParamsKey = useRef("");

  useEffect(() => {
    const currentParamsKey = `${urlQuery}-${urlRarity}`;
    if (lastSyncedParamsKey.current === currentParamsKey) return;
    if (urlQuery !== null) setQuery(urlQuery);
    if (
      urlRarity !== null &&
      !activeRarities.includes(urlRarity.toUpperCase())
    ) {
      toggleRarity(urlRarity.toUpperCase());
    }
    lastSyncedParamsKey.current = currentParamsKey;
  }, [urlQuery, urlRarity, setQuery, toggleRarity, activeRarities]);

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

  const handleResetAllFilters = () => {
    resetAll();
    setPriceRange([absoluteMinPrice, absoluteMaxPrice]);
    router.push("/marketplace");
  };

  const setCurrentPage = (page: number) => {
    setPageState({ page, forKey: filterKey });
    if (typeof window !== "undefined") {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  };

  // Mobile (雙列流): 撈 9 個商品 + 1 個廣告 = 10 個滿格 (完美 5 整行)
  // Web (三列流): 撈 11 個商品 + 1 個廣告 = 12 個滿格 (完美 4 整行)
  const totalPages = Math.max(1, meta.totalPages || 1);
  const paginatedListings = derivedListings;

  const resultsSummary =
    meta.total === 0
      ? "暫無符合條件的現貨標的"
      : meta.rangeStart > 0
        ? `顯示第 ${meta.rangeStart}–${meta.rangeEnd} 件，共 ${meta.total} 件現貨`
        : `🚀 ${meta.total} 件全網聚合現貨標的在庫`;

  const hasActiveFilters =
    query !== "" ||
    activeRarities.length > 0 ||
    activeGrades.length > 0 ||
    activeConditions.length > 0 ||
    activeTypes.length > 0 ||
    priceRange[0] !== absoluteMinPrice ||
    priceRange[1] !== absoluteMaxPrice;

  return (
    <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12 animate-fadeIn">
      {/* 標題欄 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-sans font-black text-[24px] lg:text-[28px] text-[#eae1da] tracking-tight">
            大盤市場
          </h1>
          <p className="font-mono text-[11.5px] text-[#d4c4b7] mt-0.5">
            {resultsSummary}
          </p>
        </div>

        <div className="hidden lg:flex items-center gap-2 self-start sm:self-auto">
          <span className="font-mono text-[10px] text-[#8A8680] uppercase tracking-wider font-bold select-none">
            排序
          </span>
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
          >
            <SelectTrigger className="w-40 min-w-40 h-9 bg-[#26211C] border border-white/5 rounded-[8px] text-[#eae1da] font-sans text-[12px] hover:bg-[#322a24] hover:border-white/10 transition-colors focus-visible:ring-0 focus-visible:border-brand/40">
              <SelectValue placeholder="選擇排序規則" />
            </SelectTrigger>
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

      {/* 搜尋欄位系統 */}
      <div
        ref={searchContainerRef}
        className="relative mb-6 flex gap-2 items-center"
      >
        <button
          type="button"
          onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
          className="lg:hidden h-12 px-4 rounded-[10px] font-sans font-bold text-[12.5px] border border-brand/20 bg-[#26211C] text-[#eae1da] hover:border-brand/40 hover:bg-[rgba(212,165,116,0.06)] transition-all flex items-center gap-2 shrink-0 select-none focus:outline-none"
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
            listings={derivedListings}
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
        {/* Mobile Sorting Selector Section */}
        <div className="mb-6 rounded-xl border border-white/8 bg-[#26211C] p-5">
          <h3 className="font-sans font-bold text-[13px] text-[#eae1da] mb-1.5">
            商品排序
          </h3>
          <p className="font-mono text-[10.5px] text-[#8A8680] mb-4 uppercase tracking-wider">
            SORT PRODUCTS
          </p>
          <Select
            value={sortKey}
            onValueChange={(value) => setSortKey(value as SortKey)}
          >
            <SelectTrigger className="w-full h-11 bg-[#17130f] border border-white/5 rounded-[8px] text-[#eae1da] font-sans text-[12.5px] hover:bg-[#322a24] hover:border-white/10 transition-colors focus-visible:ring-0 focus-visible:border-brand/40">
              <SelectValue placeholder="選擇排序規則" />
            </SelectTrigger>
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

        <div className="mb-6 rounded-xl border border-white/8 bg-[#26211C] p-5">
          <h3 className="font-sans font-bold text-[13px] text-[#eae1da] mb-1.5">
            市場現貨價格區間 (HK$)
          </h3>
          <p className="font-mono text-[10.5px] text-[#8A8680] mb-4 uppercase tracking-wider">
            PRICE RANGE FILTER
          </p>
          <div className="flex items-center justify-between mb-4">
            <span className="font-mono text-[13px] text-brand font-bold">
              HK$ {priceRange[0].toLocaleString()}
            </span>
            <span className="font-mono text-[11px] text-[#8A8680]">—</span>
            <span className="font-mono text-[13px] text-brand font-bold">
              HK$ {priceRange[1].toLocaleString()}
            </span>
          </div>
          <Slider
            value={priceRange}
            onValueChange={(val) => setPriceRange(val as [number, number])}
            min={absoluteMinPrice}
            max={absoluteMaxPrice}
            step={50}
            className="w-full"
          />
        </div>
        <AccordionFilters
          activeRarities={activeRarities}
          onRarityToggle={toggleRarity}
          activeGrades={activeGrades}
          onGradeToggle={toggleGrade}
          activeConditions={activeConditions}
          onConditionToggle={toggleCondition}
          activeTypes={activeTypes}
          onTypeToggle={toggleType}
          hideTypeSection={false}
        />
      </SlideOver>

      {/* 佈局雙欄 */}
      <div className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 items-start">
        <aside className="hidden lg:block lg:sticky lg:top-[5.5rem] max-h-[calc(100vh-8rem)] overflow-y-auto space-y-4 scrollbar-none">
          <div className="rounded-xl border border-white/8 bg-[#26211C] p-4">
            <h3 className="font-sans font-bold text-[13px] text-[#eae1da] mb-1.5">
              市場現貨價格區間 (HK$)
            </h3>
            <p className="font-mono text-[10.5px] text-[#8A8680] mb-4 uppercase tracking-wider">
              PRICE RANGE FILTER
            </p>
            <div className="flex items-center justify-between mb-4">
              <span className="font-mono text-[13px] text-brand font-bold">
                HK$ {priceRange[0].toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-[#8A8680]">—</span>
              <span className="font-mono text-[13px] text-brand font-bold">
                HK$ {priceRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              value={priceRange}
              onValueChange={(val) => setPriceRange(val as [number, number])}
              min={absoluteMinPrice}
              max={absoluteMaxPrice}
              step={50}
              className="w-full"
            />
          </div>
          <AccordionFilters
            activeRarities={activeRarities}
            onRarityToggle={toggleRarity}
            activeGrades={activeGrades}
            onGradeToggle={toggleGrade}
            activeConditions={activeConditions}
            onConditionToggle={toggleCondition}
            activeTypes={useMarketStore.getState().activeTypes}
            onTypeToggle={toggleType}
            hideTypeSection={false}
          />
        </aside>

        {/* 右欄商品流 */}
        <div id="product-cards" className="flex-1 space-y-6">
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            </div>
          ) : !isLoading && (paginatedListings.length === 0 || meta.total === 0) ? (
            <MarketplaceEmptyState
              hasActiveFilters={hasActiveFilters}
              query={query}
              onResetFilters={handleResetAllFilters}
            />
          ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
            {paginatedListings.flatMap((item, idx) => {
              const card = <MarketplaceCard key={item.id} listing={item} />;

              if ((idx + 1) % 8 !== 0) return [card];
              return [
                card,
                <div
                  key={`merchant-promo-${item.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => router.push("/auth?role=merchant")}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      router.push("/auth?role=merchant");
                  }}
                  className="bg-gradient-to-br from-[#d4a574] via-[#eae1da] to-[#b88751] text-[#17130f] border border-[#d4a574]/40 rounded-2xl p-5 flex flex-col justify-between shadow-[0_8px_24px_rgba(212,165,116,0.18)] hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 select-none cursor-pointer relative overflow-hidden group min-h-[220px]"
                >
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

                  <div className="relative flex items-center justify-between">
                    <span className="font-sans font-black text-[10px] tracking-widest uppercase text-[#17130f]/80">
                      🏪 申請註冊成為認證商戶
                    </span>
                  </div>

                  <div className="relative flex-1 flex flex-col justify-center gap-2 py-4">
                    <h3 className="font-sans font-black text-[17px] leading-snug text-[#17130f] tracking-tight">
                      解鎖專業商家席位
                    </h3>
                    <p className="font-sans text-[11px] text-[#17130f]/65 leading-relaxed">
                      享受專業商戶交易體驗，秒變千筆成交頂級牌組道館。
                    </p>
                  </div>

                  <div className="relative w-full h-9 bg-[#17130f] text-brand font-sans text-[12.5px] font-black rounded-xl flex items-center justify-center gap-1.5">
                    申請商戶入駐 🚀
                  </div>
                </div>,
              ];
            })}
          </div>
          )}

          {/* 🟢 完美分頁交割：100% 抹平任何語法雜質，極致純淨，完美控局 */}
          {!isLoading && meta.total > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemLabel="件商品"
            totalItems={meta.total}
            itemsPerPage={itemsPerPage}
            hideControls={true}
            enableScroll={true}
            scrollToViewId="product-cards"
            className="mt-6"
          />
          )}
        </div>
      </div>
    </main>
  );
}

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
