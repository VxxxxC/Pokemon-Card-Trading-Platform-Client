"use client";

import { useState, useEffect } from "react";
import { NewListingForm } from "@/app/components/merchant/NewListingForm";
import { InventoryAccordion } from "@/app/components/merchant/InventoryAccordion";
import { Pagination } from "@/app/components/ui/Pagination";
import { useInventory } from "@/app/lib/hooks/useInventory";
import { INVENTORY_DEFAULT_PAGE_SIZE } from "@/lib/listings/constants";

export default function UserInventoryPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const {
    groups: skuGroups,
    totalGroups,
    page: currentSkuPage,
    pageSize: skusPerPage,
    totalPages,
    summary,
    isLoading,
    setPage: setCurrentSkuPage,
    refetch,
  } = useInventory({
    query: searchQuery,
    pageSize: INVENTORY_DEFAULT_PAGE_SIZE,
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
    <div className="space-y-6 animate-fadeIn">
      {/* ── Summary 數據統計卡 ─────────────────────────────────────────── */}
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
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── 🟢 智慧卡牌商品搜尋欄 ────────────────────────────────── */}
      <div className="relative bg-bg-card border border-[rgba(237,232,224,0.08)] p-4 rounded-2xl shadow-sm flex flex-col gap-2">
        <label
          htmlFor="user-sku-search"
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
              id="user-sku-search"
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

      {/* ── 🟢 HIGH-PERFORMANCE GRID ACCORDION SHIELD FOR CREATION CABINET ── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-5 py-3.5 shadow-md">
        <button
          type="button"
          onClick={() => setIsFormOpen((prev) => !prev)}
          aria-expanded={isFormOpen}
          aria-controls="new-listing-form-panel"
          className="w-full flex items-center justify-between font-sans text-[14.5px] md:text-[15.5px] font-black text-brand normal-case tracking-tight group focus:outline-none cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <span>新增商品</span>
          </div>

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#a89888"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`shrink-0 transition-transform duration-300 ${isFormOpen ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        <div
          id="new-listing-form-panel"
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${
            isFormOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="pt-4 mt-3 border-t border-white/5">
              <NewListingForm />
            </div>
          </div>
        </div>
      </div>

      {/* ── SKU Grouped Inventory Accordion ───────────────────────────── */}
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
        {isLoading ? (
          <p className="font-mono text-sm text-text-secondary px-1">載入中…</p>
        ) : skuGroups.length === 0 ? (
          <p className="font-mono text-sm text-text-secondary px-1">
            暫無上架商品
          </p>
        ) : (
          <InventoryAccordion skuGroups={skuGroups} analytics={false} />
        )}

        {/* ── 🟢 SKU Group Pagination ── */}
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
