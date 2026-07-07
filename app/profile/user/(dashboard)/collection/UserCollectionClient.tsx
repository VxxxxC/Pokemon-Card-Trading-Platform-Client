"use client";

import { useState, useEffect, useMemo } from "react";
import { WishlistTable } from "@/app/components/market/WishlistTable";
import { CollectionTable } from "@/app/components/market/CollectionTable";
import { useWishlist } from "@/app/lib/hooks/useWishlist";
import {
  COLLECTION_FILTER_LABELS,
  useCollection,
  type CollectionInitialData,
} from "@/app/lib/hooks/useCollection";
import { useUIStore } from "@/app/store/useUIStore";
import { SmartSearch } from "@/app/components/marketplace/filters/SmartSearch";

type UserCollectionClientProps = {
  initialData: CollectionInitialData;
  bootstrapError?: string;
};

export function UserCollectionClient({
  initialData,
  bootstrapError,
}: UserCollectionClientProps) {
  const [activeFilter, setActiveFilter] = useState("全部");
  const [query, setQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [odometerValue, setOdometerValue] = useState(
    initialData.summary?.totalMarketValue ?? 0,
  );

  const listFilter = COLLECTION_FILTER_LABELS[activeFilter] ?? "all";

  const {
    entries: collectionEntries,
    total: collectionTotal,
    page: collectionPage,
    pageSize: collectionPageSize,
    totalPages: collectionTotalPages,
    summary,
    isLoading: isCollectionLoading,
    isSummaryLoading,
    isRefreshing,
    setPage: setCollectionPage,
    removeEntry: removeCollectionEntry,
    updateGrade: updateCollectionGrade,
    refetch: refetchCollection,
  } = useCollection({
    filter: listFilter,
    query,
    initialData,
  });

  const {
    entries: wishlistEntries,
    isLoading: isWishlistLoading,
    removeEntry: removeWishlistEntry,
    updateTargetPrice,
    updateGrade,
  } = useWishlist({ deferLoad: true });

  const openAddAssetModal = useUIStore((state) => state.openAddAssetModal);

  useEffect(() => {
    const handleRefresh = () => {
      refetchCollection();
    };
    window.addEventListener("collection-should-refresh", handleRefresh);
    return () => {
      window.removeEventListener("collection-should-refresh", handleRefresh);
    };
  }, [refetchCollection]);

  const portfolioSummary = useMemo(() => {
    if (!summary) {
      return {
        totalValue: 0,
        unrealizedPnl: 0,
        pnlPercent: 0,
        cardCount: 0,
        gradedCount: 0,
        rawCount: 0,
        listedCount: 0,
      };
    }

    return {
      totalValue: summary.totalMarketValue,
      unrealizedPnl: summary.unrealizedPnl,
      pnlPercent: summary.pnlPercent,
      cardCount: summary.cardCount,
      gradedCount: summary.gradedCount,
      rawCount: summary.rawCount,
      listedCount: summary.listedCount,
    };
  }, [summary]);

  useEffect(() => {
    let start = 0;
    const end = portfolioSummary.totalValue;
    const duration = 1000;
    const increment = Math.ceil(end / (duration / 16)) || 1;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        clearInterval(timer);
        setOdometerValue(end);
      } else {
        setOdometerValue(start);
      }
    }, 16);

    return () => clearInterval(timer);
  }, [portfolioSummary.totalValue]);

  const emptyCollectionMessage = query
    ? `找不到包含「${query}」的卡牌`
    : "此篩選條件下沒有卡牌";

  const showCollectionLoading =
    isCollectionLoading && collectionEntries.length === 0;

  return (
    <div className="space-y-6">
      {bootstrapError ? (
        <div className="px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入收藏庫：{bootstrapError}
          </p>
        </div>
      ) : null}

      <section aria-labelledby="portfolio-heading">
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(212,165,116,0.20)] p-5 shadow-[0_2px_8px_rgba(0,0,0,0.40)]">
          <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
            <div>
              <p className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-widest mb-1.5">
                AI 總身家估值 (PORTFOLIO VALUE)
              </p>
              <p className="font-mono font-bold text-[32px] text-[#eae1da] leading-none transition-all">
                {isSummaryLoading ? (
                  <span className="text-[#8A8680] text-[24px]">載入中…</span>
                ) : (
                  <>HK$ {odometerValue.toLocaleString("en-HK")}</>
                )}
              </p>
              <p
                className={`font-mono text-[13px] mt-2 inline-flex items-center gap-1 font-semibold ${portfolioSummary.unrealizedPnl >= 0 ? "text-[#10b981]" : "text-error"}`}
              >
                {portfolioSummary.unrealizedPnl >= 0 ? "▲" : "▼"} HK${" "}
                {Math.abs(portfolioSummary.unrealizedPnl).toLocaleString(
                  "en-HK",
                )}{" "}
                ({portfolioSummary.unrealizedPnl >= 0 ? "+" : ""}
                {portfolioSummary.pnlPercent}% 未實現損益)
              </p>
              <p className="font-mono text-[10px] text-[#8A8680] mt-1">
                估值：SNKRDUNK 同規格 → 平台同規格最低價 → 無則入手價
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAddAssetModal({ mode: "hobby" })}
              className="flex items-center gap-1.5 px-4 h-10 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] font-sans text-[13px] font-semibold rounded-xl active:scale-[0.98] transition-all shrink-0 min-h-[40px] cursor-pointer focus:outline-none"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              收錄新卡
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "持有卡牌", value: `${portfolioSummary.cardCount} 張` },
              {
                label: "已鑑定規格",
                value: `${portfolioSummary.gradedCount} 張`,
              },
              { label: "未鑑定 Raw", value: `${portfolioSummary.rawCount} 張` },
              { label: "已上架", value: `${portfolioSummary.listedCount} 張` },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-[#17130f] rounded-xl px-3 py-2.5 border border-white/[0.02]"
              >
                <p className="font-mono text-[10px] text-[#d4c4b7] mb-0.5">
                  {label}
                </p>
                <p className="font-mono font-semibold text-[15px] text-[#eae1da]">
                  {isSummaryLoading ? "—" : value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="relative">
        <div className="relative flex items-center">
          <svg
            className="absolute left-3.5 text-[#8A8680] pointer-events-none"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsSearchOpen(false);
            }}
            placeholder="搜尋持有卡牌名稱或編號..."
            className="w-full h-10 pl-10 pr-10 bg-[#26211C] border border-white/5 rounded-[10px] font-sans text-[13px] text-[#eae1da] placeholder:text-[#8A8680] focus:outline-none focus:border-[rgba(212,165,116,0.30)] transition-colors"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setIsSearchOpen(false);
              }}
              className="absolute right-3 text-[#8A8680] hover:text-[#eae1da] transition-colors text-[12px] focus:outline-none"
              aria-label="清除搜尋"
            >
              ✕
            </button>
          )}
        </div>
        <SmartSearch
          query={query}
          listings={[]}
          isOpen={isSearchOpen}
          onSelect={(name) => {
            setQuery(name);
            setIsSearchOpen(false);
          }}
        />
      </div>

      <div className={isRefreshing ? "opacity-80 pointer-events-none" : ""}>
        <section aria-labelledby="cards-heading" className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h2
              id="cards-heading"
              className="font-sans font-semibold text-[16px] text-[#eae1da]"
            >
              我的持有卡牌庫{" "}
              <span className="font-mono text-[13px] text-[#8A8680]">
                ({collectionTotal})
              </span>
            </h2>
            <div className="flex gap-1">
              {["全部", "已鑑定", "未鑑定", "已上架"].map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  type="button"
                  className={`font-mono text-[10.5px] px-2.5 py-1 rounded-lg border transition-colors ${activeFilter === f ? "text-[#d4a574] border-[#d4a574]/40 bg-[rgba(212,165,116,0.08)]" : "text-[#d4c4b7] border-[rgba(237,232,224,0.08)] hover:text-[#eae1da]"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-2 overflow-hidden">
            <CollectionTable
              entries={collectionEntries}
              isLoading={showCollectionLoading}
              emptyMessage={emptyCollectionMessage}
              currentPage={collectionPage}
              totalPages={collectionTotalPages}
              totalItems={collectionTotal}
              itemsPerPage={collectionPageSize}
              onPageChange={setCollectionPage}
              onRemove={async (entry) => {
                await removeCollectionEntry(entry);
              }}
              onUpdateGrade={updateCollectionGrade}
            />
          </div>
        </section>
      </div>

      <section aria-labelledby="wishlist-heading" className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2
            id="wishlist-heading"
            className="font-sans font-semibold text-[16px] text-[#eae1da] flex items-center gap-2"
          >
            <span className="text-[#d4a574]">★</span> 追蹤願望清單
          </h2>
        </div>
        <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-2">
          <WishlistTable
            entries={wishlistEntries}
            isLoading={isWishlistLoading}
            onRemove={async (entry) => {
              await removeWishlistEntry(entry);
            }}
            onUpdateTarget={updateTargetPrice}
            onUpdateGrade={updateGrade}
          />
        </div>
      </section>
    </div>
  );
}
