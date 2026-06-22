"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useMerchantStore } from "@/app/store/useMerchantStore";
import { Pagination } from "@/app/components/ui/Pagination";
import { MerchantOrderRow } from "@/app/components/merchant/MerchantOrderRow";

function MerchantTradingPageContent() {
  const { orders } = useMerchantStore();

  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "全部";

  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  const [subPaymentChecked, setSubPaymentChecked] = useState(true);
  const [subGradingChecked, setSubGradingChecked] = useState(true);

  // Sync state if URL query param changes dynamically (e.g. click "View All" link)
  useEffect(() => {
    const queryFilter = searchParams.get("filter");
    if (queryFilter && queryFilter !== filter) {
      queueMicrotask(() => setFilter(queryFilter));
    }
  }, [searchParams, filter]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setItemsPerPage(5);
      } else {
        setItemsPerPage(8);
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    queueMicrotask(() => setCurrentPage(1));
  }, [filter, searchQuery, subPaymentChecked, subGradingChecked]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      let matchFilter = true;
      if (filter === "待處理") {
        let matchSub = false;
        if (subPaymentChecked && order.status === "payment") matchSub = true;
        if (
          subGradingChecked &&
          (order.status === "custody" ||
            order.status === "shipped" ||
            order.status === "grading")
        )
          matchSub = true;
        matchFilter = matchSub;
      } else if (filter === "已完成") {
        matchFilter = order.status === "released";
      } else if (filter === "已取消") {
        matchFilter = order.status === "cancelled";
      }

      const normalizedQuery = searchQuery.trim().toLowerCase();
      let matchSearch = true;
      if (normalizedQuery) {
        matchSearch =
          order.cardName.toLowerCase().includes(normalizedQuery) ||
          order.cardNo.toLowerCase().includes(normalizedQuery) ||
          order.buyerName.toLowerCase().includes(normalizedQuery) ||
          order.id.toLowerCase().includes(normalizedQuery);
      }

      return matchFilter && matchSearch;
    });
  }, [orders, filter, searchQuery, subPaymentChecked, subGradingChecked]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const needsAction = orders.filter(
    (o) => o.status === "custody" || o.status === "payment",
  );

  return (
    <div className="space-y-5 animate-fadeIn">
      {needsAction.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl animate-fadeIn">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#ef4444"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-sans text-[13px] text-text-primary">
            <span className="font-semibold text-warning">
              {needsAction.length} 件訂單
            </span>{" "}
            需要您的處理：確認訂單或安排發貨。
          </p>
        </div>
      )}

      <div className="relative bg-bg-card rounded-2xl border border-white/5 p-4 shadow-sm flex flex-col gap-2">
        <label
          htmlFor="merchant-order-search"
          className="font-mono text-[11px] text-text-secondary uppercase tracking-wider"
        >
          智慧訂單檢索控制台
        </label>
        <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary overflow-hidden w-full transition-all focus-within:border-brand/30">
          <input
            id="merchant-order-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="輸入卡牌名稱、卡號如 sv2a-182、買家姓名或訂單 ID 進行精確過濾..."
            className="flex-1 h-full bg-transparent px-4 font-sans text-[13.5px] text-text-primary placeholder-text-disabled focus:outline-none"
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

      <section
        id="orders-list"
        aria-labelledby="trading-heading"
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2
            id="trading-heading"
            className="font-sans font-semibold text-[16px] text-text-primary"
          >
            交易管理（{filteredOrders.length}）
          </h2>

          {/* ── 🟢 核心修正 1：已精準切除多餘的「待付款」與「鑑定中」按鈕 ── */}
          <div className="flex gap-1.5 flex-wrap justify-start sm:justify-end">
            {["全部", "待處理", "已完成", "已取消"].map((f) => {
              const isActive = filter === f;
              let btnClass =
                "text-text-secondary border-white/5 hover:text-text-primary hover:bg-bg-elevated";
              if (isActive) {
                if (f === "待處理") {
                  btnClass =
                    "text-warning border-warning/40 bg-[rgba(239,68,68,0.06)] font-bold shadow-xs animate-fadeIn";
                } else {
                  btnClass =
                    "text-brand border-brand/40 bg-[rgba(212,165,116,0.08)] font-bold shadow-xs";
                }
              }
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={
                    "font-mono text-[11px] px-3 py-1 rounded-lg border transition-all cursor-pointer " +
                    btnClass
                  }
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {filter === "待處理" && (
          <div className="flex items-center gap-4 px-4 py-2.5 bg-[#17130f] border border-white/5 rounded-xl animate-fadeIn mt-2 w-full sm:w-auto">
            <span className="font-sans text-[11px] text-text-secondary font-medium mr-2">
              進階子篩選：
            </span>
            <label className="flex items-center gap-2 font-sans text-[12px] text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subPaymentChecked}
                onChange={(e) => setSubPaymentChecked(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/10 bg-bg-card text-brand focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              待付款
            </label>
            <label className="flex items-center gap-2 font-sans text-[12px] text-text-primary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={subGradingChecked}
                onChange={(e) => setSubGradingChecked(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-white/10 bg-bg-card text-brand focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
              鑑定中
            </label>
          </div>
        )}

        <div className="space-y-3 min-h-[200px]">
          {paginatedOrders.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
              <p className="font-sans text-[13px] text-text-disabled">
                沒有符合當前篩選與關鍵字的交易訂單記錄。
              </p>
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <MerchantOrderRow key={order.id} order={order} />
            ))
          )}
        </div>

        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="筆訂單記錄"
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            enableScroll={true}
            scrollBlock="start"
            scrollToViewId="orders-list"
          />
        </div>
      </section>
    </div>
  );
}

export default function MerchantTradingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <MerchantTradingPageContent />
    </Suspense>
  );
}
