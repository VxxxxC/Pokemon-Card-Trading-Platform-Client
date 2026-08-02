"use client";

import {
  useRef,
  useEffect,
  useSyncExternalStore,
  useMemo,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserWishlistFavoredKeys } from "@/app/actions/wishlist";
import { Pagination } from "@/app/components/ui/Pagination";
import { MarketplaceCard } from "@/app/components/marketplace/MarketplaceCard";
import { MarketplaceEmptyState } from "@/app/components/marketplace/MarketplaceEmptyState";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { MarketplaceQuickCategoryPills } from "@/app/components/marketplace/MarketplaceQuickCategoryPills";
import { SlideOver } from "@/app/components/ui/SlideOver";
import { useMarketStore, type SortKey } from "@/app/store/useMarketStore";
import {
  useMarketplaceSearch,
  type MarketplaceSearchInitialData,
} from "@/app/lib/hooks/useMarketplaceSearch";
import type { MarketplaceProductRow } from "@/app/lib/marketplace/types";
import type { MarketplaceListing } from "@/app/components/marketplace/MarketplaceCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  isMarketplaceClientPerfLogEnabled,
  marketplaceClientPerfLog,
} from "@/app/lib/marketplace/perf-log-client";
import { MARKETPLACE_GRID_PAGE_SIZE } from "@/lib/marketplace/constants";
import { formatListingGrade } from "@/lib/marketplace/listing-display";

const MOBILE_VIEWPORT_QUERY = "(max-width: 1279px)";

function subscribeMobileViewport(onStoreChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_VIEWPORT_QUERY);
  mediaQuery.addEventListener("change", onStoreChange);
  return () => mediaQuery.removeEventListener("change", onStoreChange);
}

function getMobileViewportSnapshot() {
  return window.matchMedia(MOBILE_VIEWPORT_QUERY).matches;
}

function getMobileViewportServerSnapshot() {
  return true;
}

function toMarketplaceListing(
  product: MarketplaceProductRow,
): MarketplaceListing {
  const grade = formatListingGrade(product.gradingCompany, product.gradingScore);

  return {
    id: product.lowestListingId,
    productId: product.productId,
    cardNo: product.cardNumber ?? product.displayId ?? product.productId,
    name: product.productName,
    nameZh: product.nameZh,
    nameJa: product.nameJa,
    set: product.setCode,
    rarity: product.rarity,
    grade: {
      authority: grade.authority,
      score: grade.score || "",
    },
    gradingCompany: product.gradingCompany,
    gradingScore: product.gradingScore,
    price: product.lowestPrice,
    delta: 0,
    deltaDirection: "up",
    marketAvgPrice: product.marketAvgPrice,
    marketReferenceSource: product.marketReferenceSource,
    priceVsMarketPct: product.priceVsMarketPct,
    image: product.imageUrl,
    seller: product.sellerName,
    sellerId: product.sellerId,
    sellerPersona: product.sellerPersona,
    detailHref: `/marketplace/product/${product.productId}`,
    baseCourierShippingFee: product.baseCourierShippingFee,
    listingExtraShippingFee: product.listingExtraShippingFee,
    courierShippingTotal: product.courierShippingTotal,
    deliverySummary: product.deliverySummary,
  };
}

export type MarketplacePageClientProps = {
  currentUserId: string | null;
  initialData?: MarketplaceSearchInitialData;
  initialFavoredKeys?: string[];
  bootstrapError?: string;
};

export function MarketplacePageClient({
  currentUserId,
  initialData,
  initialFavoredKeys,
  bootstrapError,
}: MarketplacePageClientProps) {
  const _isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const searchParams = useSearchParams();
  const router = useRouter();

  const urlQuery = searchParams.get("q");
  const urlRarity = searchParams.get("rarity");
  const urlKind = searchParams.get("kind");

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
  const activeTypes = useMarketStore((state) => state.activeTypes);
  const activeProductKinds = useMarketStore((state) => state.activeProductKinds);

  const toggleRarity = useMarketStore((state) => state.toggleRarity);
  const toggleGrade = useMarketStore((state) => state.toggleGrade);
  const toggleType = useMarketStore((state) => state.toggleType);
  const toggleProductKind = useMarketStore((state) => state.toggleProductKind);
  const resetAll = useMarketStore((state) => state.resetAll);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const isMobileViewport = useSyncExternalStore(
    subscribeMobileViewport,
    getMobileViewportSnapshot,
    getMobileViewportServerSnapshot,
  );

  const [pageState, setPageState] = useState({ page: 1, forKey: "" });
  const [priceRange, setPriceRange] = useState<[number, number] | null>(() =>
    initialData?.priceBounds
      ? [initialData.priceBounds.minPrice, initialData.priceBounds.maxPrice]
      : null,
  );
  const [favoredKeys, setFavoredKeys] = useState<ReadonlySet<string>>(
    () => new Set(initialFavoredKeys ?? []),
  );

  useEffect(() => {
    if (initialFavoredKeys !== undefined) return;

    if (!currentUserId) {
      setFavoredKeys(new Set());
      return;
    }

    let cancelled = false;

    (async () => {
      const result = await getUserWishlistFavoredKeys();
      if (cancelled) return;
      if (!result.success) {
        setFavoredKeys(new Set());
        return;
      }
      setFavoredKeys(new Set(result.data));
    })();

    return () => {
      cancelled = true;
    };
  }, [currentUserId, initialFavoredKeys]);

  const itemsPerPage = MARKETPLACE_GRID_PAGE_SIZE;

  const filterKey = `${query}|${sortKey}|${activeRarities.join(",")}|${activeGrades.join(",")}|${activeTypes.join(",")}|${activeProductKinds.join(",")}|${priceRange?.join(",") ?? ""}`;
  const currentPage = pageState.forKey === filterKey ? pageState.page : 1;

  const [resolvedPriceBounds, setResolvedPriceBounds] = useState<{
    minPrice: number;
    maxPrice: number;
  } | null>(initialData?.priceBounds ?? null);

  const { products, meta, isLoading, isRefreshing, error, priceBounds, rarities } =
    useMarketplaceSearch(
      {
        query,
        rarities: activeRarities,
        grades: activeGrades,
        sellerTypes: activeTypes,
        productKinds: activeProductKinds,
        priceMin: priceRange?.[0] ?? 0,
        priceMax: priceRange?.[1] ?? 100_000,
        sortKey,
        page: currentPage,
        pageSize: itemsPerPage,
      },
      { initialData, absolutePriceBounds: resolvedPriceBounds },
    );

  useEffect(() => {
    if (!priceBounds) return;
    setResolvedPriceBounds(priceBounds);
  }, [priceBounds]);

  const interactiveLoggedRef = useRef(false);

  useEffect(() => {
    if (!isMarketplaceClientPerfLogEnabled()) return;

    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;

    if (navigation) {
      marketplaceClientPerfLog(
        `ttfb=${Math.round(navigation.responseStart)}ms domContentLoaded=${Math.round(navigation.domContentLoadedEventEnd)}ms load=${Math.round(navigation.loadEventEnd)}ms`,
      );
    }

    if (typeof PerformanceObserver === "undefined") return;

    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (!last) return;
        marketplaceClientPerfLog(
          `lcp=${Math.round(last.startTime)}ms element=${last.name || "unknown"}`,
        );
        lcpObserver.disconnect();
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // LCP observer unsupported in this browser
    }
  }, []);

  useEffect(() => {
    if (!isMarketplaceClientPerfLogEnabled()) return;
    if (interactiveLoggedRef.current || isLoading) return;

    interactiveLoggedRef.current = true;
    marketplaceClientPerfLog(
      `timeToInteractive=${Math.round(performance.now())}ms viewport=${isMobileViewport ? "mobile" : "desktop"} pageSize=${itemsPerPage} hasInitialData=${Boolean(initialData)}`,
    );
  }, [isLoading, isMobileViewport, itemsPerPage, initialData]);

  const derivedListings = useMemo(
    () => products.map(toMarketplaceListing),
    [products],
  );

  const absoluteMinPrice = priceBounds?.minPrice ?? 0;
  const absoluteMaxPrice = priceBounds?.maxPrice ?? 100_000;
  const sliderPriceRange: [number, number] = priceRange ?? [
    absoluteMinPrice,
    absoluteMaxPrice,
  ];

  useEffect(() => {
    if (!priceBounds || priceRange !== null) return;
    setPriceRange([priceBounds.minPrice, priceBounds.maxPrice]);
  }, [priceBounds, priceRange]);

  const lastSyncedParamsKey = useRef("");

  useEffect(() => {
    const currentParamsKey = `${urlQuery}-${urlRarity}-${urlKind}`;
    if (lastSyncedParamsKey.current === currentParamsKey) return;
    if (urlQuery !== null) setQuery(urlQuery);
    if (urlRarity !== null) {
      const matchedRarity =
        activeRarities.find(
          (rarity) => rarity.toLowerCase() === urlRarity.toLowerCase(),
        ) ?? urlRarity;
      if (!activeRarities.includes(matchedRarity)) {
        toggleRarity(matchedRarity);
      }
    }
    if (urlKind === "sealed_product" && !activeProductKinds.includes("sealed_product")) {
      toggleProductKind("sealed_product");
    }
    lastSyncedParamsKey.current = currentParamsKey;
  }, [
    urlQuery,
    urlRarity,
    urlKind,
    setQuery,
    toggleRarity,
    toggleProductKind,
    activeRarities,
    activeProductKinds,
  ]);

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
    activeTypes.length > 0 ||
    activeProductKinds.length > 0 ||
    (priceRange !== null &&
      (priceRange[0] !== absoluteMinPrice ||
        priceRange[1] !== absoluteMaxPrice));

  const displayError = error ?? bootstrapError ?? null;

  return (
    <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12 animate-fadeIn">
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

      <MarketplaceQuickCategoryPills />

      <SlideOver
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="📊 篩選"
        subtitle="ADVANCED FILTER"
      >
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
              HK$ {sliderPriceRange[0].toLocaleString()}
            </span>
            <span className="font-mono text-[11px] text-[#8A8680]">—</span>
            <span className="font-mono text-[13px] text-brand font-bold">
              HK$ {sliderPriceRange[1].toLocaleString()}
            </span>
          </div>
          <Slider
            value={sliderPriceRange}
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
          activeTypes={activeTypes}
          onTypeToggle={toggleType}
          activeProductKinds={activeProductKinds}
          onProductKindToggle={toggleProductKind}
          hideTypeSection={false}
          rarities={rarities}
          disableRarityFetch
        />
      </SlideOver>

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
                HK$ {sliderPriceRange[0].toLocaleString()}
              </span>
              <span className="font-mono text-[11px] text-[#8A8680]">—</span>
              <span className="font-mono text-[13px] text-brand font-bold">
                HK$ {sliderPriceRange[1].toLocaleString()}
              </span>
            </div>
            <Slider
              value={sliderPriceRange}
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
            activeTypes={useMarketStore.getState().activeTypes}
            onTypeToggle={toggleType}
            activeProductKinds={useMarketStore.getState().activeProductKinds}
            onProductKindToggle={toggleProductKind}
            hideTypeSection={false}
            rarities={rarities}
            disableRarityFetch
          />
        </aside>

        <div id="product-cards" className="flex-1 space-y-6">
          {displayError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-200">
              {displayError}
            </div>
          )}

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`marketplace-skeleton-${index}`}
                  className="bg-[#26211C] rounded-2xl border border-white/5 overflow-hidden animate-pulse"
                >
                  <div className="w-full aspect-[3/4] bg-white/5" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 w-3/4 rounded bg-white/5" />
                    <div className="h-3 w-1/2 rounded bg-white/5" />
                    <div className="h-5 w-1/3 rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : !isLoading && (paginatedListings.length === 0 || meta.total === 0) ? (
            <MarketplaceEmptyState
              hasActiveFilters={hasActiveFilters}
              query={query}
              onResetFilters={handleResetAllFilters}
            />
          ) : (
          <div className="relative">
            {isRefreshing ? (
              <div className="absolute inset-0 z-10 bg-[#17130f]/35 backdrop-blur-[1px] flex items-start justify-center pt-20 pointer-events-none">
                <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              </div>
            ) : null}
          <div
            className={`grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5 transition-opacity duration-200 ${
              isRefreshing ? "opacity-60" : "opacity-100"
            }`}
          >
            {paginatedListings.flatMap((item, idx) => {
              const card = (
                <MarketplaceCard
                  key={item.id}
                  listing={item}
                  currentUserId={currentUserId}
                  favoredKeys={favoredKeys}
                  imagePriority={idx < 4}
                />
              );

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
          </div>
          )}

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
