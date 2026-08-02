"use client";

import { useEffect, useState } from "react";
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
      className={`space-y-6 animate-fadeIn${isRefreshing ? " opacity-80 pointer-events-none" : ""}`}
    >
      {bootstrapError ? (
        <div className="px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入庫存：{bootstrapError}
          </p>
        </div>
      ) : null}

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "現貨", value: `${totalItems} 件` },
          { label: "上架中", value: `${activeCount} 件` },
          { label: "已售出", value: `${soldCount} 件` },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3 shadow-sm"
          >
            <p className="font-mono text-[11px] text-text-secondary mb-1">
              {label}
            </p>
            <p className="font-mono font-bold text-[18px] text-text-primary">
              {isSummaryLoading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      <div className="relative bg-bg-card border border-[rgba(237,232,224,0.08)] p-4 rounded-2xl shadow-sm flex flex-col gap-2">
        <label
          htmlFor="merchant-sku-search"
          className="font-mono pl-1 text-xs text-text-primary uppercase tracking-wider"
        >
          商品搜尋
        </label>
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
          <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary overflow-hidden w-full transition-all focus-within:border-brand/30">
            <input
              id="merchant-sku-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋卡牌名稱、卡號 (如 sv2a-182)..."
              className="pl-10 pr-10 w-full flex-1 h-10 bg-transparent px-4 font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="px-3 h-full font-sans text-[12px] text-text-disabled hover:text-text-primary transition-colors cursor-pointer"
              >
                清除
              </button>
            )}
          </div>
        </div>
      </div>

      <section
        id="listings-heading"
        aria-labelledby="listings-heading"
        className="pt-1"
      >
        <h2 className="font-sans font-semibold text-[16px] text-text-primary mb-4 space-x-2">
          <span>所有商品</span>
          <span className="font-mono text-sm px-1.5 py-0.5 rounded text-success bg-[rgba(16,185,129,0.12)]">
            {totalGroups} 款 卡牌
          </span>
          <span className="font-mono text-sm px-1.5 py-0.5 rounded bg-[rgba(212,165,116,0.10)] text-brand border border-brand/20 shrink-0">
            {totalItems} 張現貨
          </span>
        </h2>
        {isLoading && skuGroups.length === 0 ? (
          <p className="font-mono text-sm text-text-secondary px-1">載入中…</p>
        ) : skuGroups.length === 0 ? (
          <p className="font-mono text-sm text-text-secondary px-1">
            暫無上架商品
          </p>
        ) : (
          <InventoryAccordion skuGroups={skuGroups} inventoryContext="merchant" />
        )}

        <div className="pt-4">
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
      </section>
    </div>
  );
}
