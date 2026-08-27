"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { InventoryAccordion } from "@/app/components/merchant/InventoryAccordion";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  useInventory,
  type InventoryInitialData,
} from "@/app/lib/hooks/useInventory";
import { INVENTORY_DEFAULT_PAGE_SIZE } from "@/lib/listings/constants";

type MerchantInventoryClientProps = {
  initialData: InventoryInitialData;
  bootstrapError?: string;
};

export function MerchantInventoryClient({
  initialData,
  bootstrapError,
}: MerchantInventoryClientProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const {
    groups: skuGroups,
    totalGroups,
    page: currentSkuPage,
    pageSize: skusPerPage,
    totalPages,
    summary,
    isLoading,
    isSummaryLoading,
    isRefreshing,
    setPage: setCurrentSkuPage,
    refetch,
  } = useInventory({
    query: searchQuery,
    pageSize: INVENTORY_DEFAULT_PAGE_SIZE,
    initialData,
    sellerPersona: "merchant",
  });

  useEffect(() => {
    const handleRefresh = () => {
      refetch();
    };

    window.addEventListener("inventory-should-refresh", handleRefresh);
    return () => {
      window.removeEventListener("inventory-should-refresh", handleRefresh);
    };
  }, [refetch]);

  const totalItems = summary?.totalListings ?? 0;
  const activeCount = summary?.activeCount ?? 0;
  const soldCount = summary?.soldCount ?? 0;

  return (
    <div
      className={`animate-fadeIn${isRefreshing ? " opacity-80 pointer-events-none" : ""}`}
    >
      {bootstrapError ? (
        <div className="mb-4 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入庫存：{bootstrapError}
          </p>
        </div>
      ) : null}

      <section
        aria-labelledby="listings-heading"
        className="rounded-xl overflow-hidden bg-bg-card border border-[rgba(237,232,224,0.08)]"
      >
        <div
          className="flex divide-x divide-[rgba(237,232,224,0.06)] border-b border-[rgba(237,232,224,0.06)]"
          aria-label="庫存摘要"
        >
          {[
            { label: "現貨", value: totalItems, suffix: "件" },
            { label: "上架中", value: activeCount, suffix: "件" },
            { label: "已售出", value: soldCount, suffix: "件" },
          ].map(({ label, value, suffix }) => (
            <div
              key={label}
              className="flex-1 min-w-0 px-2 py-2.5 sm:px-3 sm:py-3 text-center"
            >
              <p className="font-mono text-[9px] sm:text-[10px] text-text-secondary truncate">
                {label}
              </p>
              <p className="font-mono font-semibold text-[13px] sm:text-[15px] text-text-primary mt-0.5 tabular-nums">
                {isSummaryLoading ? "—" : value}
                {!isSummaryLoading ? (
                  <span className="text-[10px] text-text-disabled font-normal ml-0.5">
                    {suffix}
                  </span>
                ) : null}
              </p>
            </div>
          ))}
        </div>

        <div className="px-3 py-2.5 sm:px-4 border-b border-[rgba(237,232,224,0.06)]">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-disabled pointer-events-none"
              aria-hidden
            />
            <input
              id="merchant-sku-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋卡牌名稱、卡號 (如 sv2a-182)…"
              className="w-full h-9 pl-9 pr-9 bg-bg-page/50 border border-[rgba(237,232,224,0.08)] rounded-lg font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/30 transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary transition-colors focus:outline-none"
                aria-label="清除搜尋"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 px-3 py-2.5 sm:px-4 border-b border-[rgba(237,232,224,0.06)]">
          <h2
            id="listings-heading"
            className="font-sans font-semibold text-[15px] text-text-primary min-w-0 truncate"
          >
            所有商品
          </h2>
          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded text-success bg-[rgba(16,185,129,0.12)]"
              aria-label={`共 ${totalGroups} 款卡牌`}
            >
              <data value={totalGroups} className="not-italic" aria-hidden="true">
                {totalGroups}
              </data>
              <span aria-hidden="true"> 款</span>
            </span>
            <span
              className="font-mono text-[10px] px-2 py-0.5 rounded bg-[rgba(212,165,116,0.10)] text-brand border border-brand/20"
              aria-label={`${totalItems} 張現貨`}
            >
              <data value={totalItems} className="not-italic" aria-hidden="true">
                {totalItems}
              </data>
              <span aria-hidden="true"> 張現貨</span>
            </span>
          </div>
        </div>

        <div className="px-3 py-1 sm:px-4">
          {isLoading && skuGroups.length === 0 ? (
            <p className="font-mono text-[13px] text-text-secondary py-12 text-center">
              載入中…
            </p>
          ) : skuGroups.length === 0 ? (
            <p className="font-mono text-[13px] text-text-secondary py-12 text-center">
              暫無上架商品
            </p>
          ) : (
            <InventoryAccordion skuGroups={skuGroups} inventoryContext="merchant" />
          )}

          {totalPages > 1 ? (
            <div className="pt-2 pb-1">
              <Pagination
                currentPage={currentSkuPage}
                totalPages={totalPages}
                onPageChange={(page) => setCurrentSkuPage(page)}
                itemLabel="款卡牌商品"
                totalItems={totalGroups}
                itemsPerPage={skusPerPage}
                enableScroll={true}
                scrollToViewId="listings-heading"
                scrollBlock="end"
              />
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
