"use client";

import {
  useRef,
  useEffect,
  useSyncExternalStore,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { MarketplaceCard } from "@/app/components/marketplace/MarketplaceCard";
import { PublicPersonaProfileHeader } from "@/app/components/profile/PublicPersonaProfileHeader";
import { AccordionFilters } from "@/app/components/marketplace/filters/AccordionFilters";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";
import { SlideOver } from "@/app/components/ui/SlideOver";
import { useHkCardVaultStore } from "@/app/store/useHkCardVaultStore";
import type { MarketplaceSellerProfile } from "@/app/lib/marketplace/types";
import {
  useMarketplaceSellerSearch,
  type MarketplaceSellerSearchInitialData,
} from "@/app/lib/hooks/useMarketplaceSellerSearch";
import { toMarketplaceCardListing } from "@/lib/marketplace/map-seller-listing";
import { MARKETPLACE_STOREFRONT_PAGE_SIZE } from "@/lib/marketplace/constants";
import type { SortKey } from "@/app/store/useMarketStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

interface MerchantStorefrontPageClientProps {
  seller: MarketplaceSellerProfile | null;
  initialListings?: MarketplaceSellerSearchInitialData;
  currentUserId?: string | null;
  bootstrapError?: string;
}

export function MerchantStorefrontPageClient({
  seller,
  initialListings,
  currentUserId = null,
  bootstrapError,
}: MerchantStorefrontPageClientProps) {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const openChatWithPartner = useHkCardVaultStore(
    (state) => state.openChatWithPartner,
  );

  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("最新");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeRarities, setActiveRarities] = useState<string[]>([]);
  const [activeGrades, setActiveGrades] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const absolutePriceBounds = initialListings?.priceBounds ?? null;
  const [priceRange, setPriceRange] = useState<[number, number]>(() => [
    absolutePriceBounds?.minPrice ?? 0,
    absolutePriceBounds?.maxPrice ?? 100000,
  ]);

  const { listings, meta, error, priceBounds, isRefreshing } =
    useMarketplaceSellerSearch(
      {
        sellerId: seller?.id ?? "",
        query,
        rarities: activeRarities,
        grades: activeGrades,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        sortKey,
        page: 1,
        pageSize: MARKETPLACE_STOREFRONT_PAGE_SIZE,
      },
      {
        initialData: initialListings,
        absolutePriceBounds,
      },
    );

  const absoluteMinPrice = priceBounds?.minPrice ?? absolutePriceBounds?.minPrice ?? 0;
  const absoluteMaxPrice =
    priceBounds?.maxPrice ?? absolutePriceBounds?.maxPrice ?? 100000;

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

  const handleResetAllFilters = () => {
    setQuery("");
    setActiveRarities([]);
    setActiveGrades([]);
    setSortKey("最新");
    setPriceRange([absoluteMinPrice, absoluteMaxPrice]);
  };

  const storefrontListings = useMemo(
    () => listings.map((listing) => toMarketplaceCardListing(listing)),
    [listings],
  );

  const toggleFilterValue = (
    value: string,
    setState: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setState((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  if (!isMounted) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#17130f]">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#17130f] py-20">
        <h1 className="text-xl font-sans font-bold text-text-disabled">
          {bootstrapError ?? "未找到該商戶的市集櫥窗"}
        </h1>
        <Link
          href="/marketplace"
          className="text-brand text-sm mt-3 hover:underline"
        >
          ← 返回全網大盤
        </Link>
      </div>
    );
  }

  const hasActiveFilters =
    query !== "" ||
    activeRarities.length > 0 ||
    activeGrades.length > 0 ||
    priceRange[0] !== absoluteMinPrice ||
    priceRange[1] !== absoluteMaxPrice;

  const displayError = bootstrapError ?? error;
  const listingCount = meta.total;

  return (
    <main className="flex-1 max-w-[1360px] mx-auto w-full px-4 lg:px-8 py-6 pb-28 lg:pb-12 animate-fadeIn">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 mb-6">
        <PublicPersonaProfileHeader
          profile={seller}
          rating={seller.ratingScore}
          reviewCount={0}
          variant="storefront"
          listingCount={listingCount}
          onStorefrontChat={() => {
            if (!seller) return;
            openChatWithPartner(seller.id, seller.username, "merchant");
          }}
        />
      </div>

      <div className="hidden lg:flex items-center mb-6 gap-2 self-start xl:self-start shrink-0">
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
        {isRefreshing ? (
          <span className="font-mono text-[10px] text-[#8A8680]">更新中…</span>
        ) : null}
      </div>

      <div
        ref={searchContainerRef}
        className="relative mb-6 flex gap-2 items-center"
      >
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
            onChange={(event) => {
              setQuery(event.target.value);
              setIsSearchFocused(true);
            }}
            placeholder="搜尋此商戶櫥窗內官方卡牌名稱、編號..."
            className="w-full h-12 pl-11 pr-4 bg-[#26211C] border border-white/5 rounded-[10px] text-[13.5px] text-[#eae1da] focus:outline-none"
          />
          <SmartSearch
            query={query}
            listings={storefrontListings}
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
          title="清除此櫥窗所有搜尋關鍵字與複選矩陣"
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

      <SlideOver
        isOpen={isMobileFilterOpen}
        onClose={() => setIsMobileFilterOpen(false)}
        title="📊 篩選"
        subtitle="ADVANCE FILTER"
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
          onRarityToggle={(rarity) =>
            toggleFilterValue(rarity, setActiveRarities)
          }
          activeGrades={activeGrades}
          onGradeToggle={(grade) => toggleFilterValue(grade, setActiveGrades)}
          hideTypeSection={true}
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
            onRarityToggle={(rarity) =>
              toggleFilterValue(rarity, setActiveRarities)
            }
            activeGrades={activeGrades}
            onGradeToggle={(grade) => toggleFilterValue(grade, setActiveGrades)}
            hideTypeSection={true}
          />
        </aside>

        <div className="flex-1">
          {displayError ? (
            <div className="py-20 text-center bg-[#26211C] border border-dashed border-white/5 rounded-2xl font-sans text-[13.5px] text-text-disabled">
              {displayError}
            </div>
          ) : storefrontListings.length === 0 ? (
            <div className="py-20 text-center bg-[#26211C] border border-dashed border-white/5 rounded-2xl font-sans text-[13.5px] text-text-disabled">
              此商戶私域櫥窗暫時沒有符合篩選條件的商品
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-5">
              {storefrontListings.map((listing) => (
                <MarketplaceCard
                  key={listing.id}
                  listing={listing}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
