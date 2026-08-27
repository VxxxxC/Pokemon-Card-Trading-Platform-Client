"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/app/components/ui/Pagination";
import { MerchantOrderRow } from "@/app/components/merchant/MerchantOrderRow";
import {
  useMerchantTrading,
  type MerchantTradingInitialData,
} from "@/app/lib/hooks/useMerchantTrading";
import { mapMerchantTradingOrderToSaleOrder } from "@/app/lib/merchant-order/map-sale-order";
import {
  TAB_STATUS_FROM_PARAM,
  TAB_STATUS_TO_PARAM,
  type TabStatusFilter,
} from "@/lib/merchant-order/constants";

type MerchantTradingClientProps = {
  initialData: MerchantTradingInitialData;
  initialTabStatus: TabStatusFilter;
  bootstrapError?: string;
};

const STATUS_TAB_LABELS: TabStatusFilter[] = [
  "all",
  "pending",
  "completed",
  "cancelled",
];

export function MerchantTradingClient({
  initialData,
  initialTabStatus,
  bootstrapError,
}: MerchantTradingClientProps) {
  const searchParams = useSearchParams();
  const [tabStatus, setTabStatus] = useState<TabStatusFilter>(initialTabStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [subPaymentChecked, setSubPaymentChecked] = useState(true);
  const [subGradingChecked, setSubGradingChecked] = useState(true);

  const {
    orders,
    paginationMeta,
    filterCounts,
    isRefreshing,
    error: fetchError,
    setPage,
  } = useMerchantTrading({
    tabStatus,
    searchQuery,
    includePaymentPending: subPaymentChecked,
    includeAuthInProgress: subGradingChecked,
    initialData,
  });

  useEffect(() => {
    const queryFilter = searchParams.get("filter");
    if (queryFilter && TAB_STATUS_FROM_PARAM[queryFilter]) {
      const nextStatus = TAB_STATUS_FROM_PARAM[queryFilter];
      queueMicrotask(() => setTabStatus(nextStatus));
    }
  }, [searchParams]);

  const saleOrders = useMemo(
    () => orders.map(mapMerchantTradingOrderToSaleOrder),
    [orders],
  );

  const needsAction = filterCounts.needsAction;
  const displayError = bootstrapError ?? fetchError;
  const activeFilterLabel = TAB_STATUS_TO_PARAM[tabStatus];

  return (
    <div
      className={`space-y-5 animate-fadeIn${isRefreshing ? " opacity-80 pointer-events-none" : ""}`}
    >
      {needsAction > 0 && (
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
              {needsAction} 件訂單
            </span>{" "}
            需要您的處理：確認訂單或安排發貨。
          </p>
        </div>
      )}

      {displayError && (
        <div className="px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入訂單：{displayError}
          </p>
        </div>
      )}

      <section
        id="orders-list"
        aria-labelledby="trading-heading"
        className="space-y-4"
      >
        <div className="space-y-3">
          <h2
            id="trading-heading"
            className="font-sans font-semibold text-[16px] text-text-primary"
          >
            交易管理（{paginationMeta.total}）
          </h2>

          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled pointer-events-none"
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
              id="merchant-order-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="輸入卡牌名稱、卡號、交易對手姓名或訂單ID…"
              className="w-full h-10 pl-9 pr-10 bg-[#17130f] border border-white/[0.06] rounded-lg font-sans text-[13px] text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/30 transition-colors"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 font-sans text-[12px] text-text-disabled hover:text-text-primary transition-colors cursor-pointer"
              >
                清除
              </button>
            ) : null}
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {STATUS_TAB_LABELS.map((statusValue) => {
                const label = TAB_STATUS_TO_PARAM[statusValue];
                const isActive = tabStatus === statusValue;
                let btnClass =
                  "text-text-secondary border-white/5 hover:text-text-primary hover:bg-bg-elevated";
                if (isActive) {
                  if (statusValue === "pending") {
                    btnClass =
                      "text-warning border-warning/40 bg-[rgba(239,68,68,0.06)] font-bold shadow-xs animate-fadeIn";
                  } else {
                    btnClass =
                      "text-brand border-brand/40 bg-[rgba(212,165,116,0.08)] font-bold shadow-xs";
                  }
                }
                return (
                  <button
                    key={statusValue}
                    type="button"
                    onClick={() => setTabStatus(statusValue)}
                    className={
                      "font-mono text-[11px] px-3 py-1 rounded-lg border transition-all cursor-pointer " +
                      btnClass
                    }
                  >
                    {label}
                  </button>
                );
              })}
          </div>
        </div>

        {activeFilterLabel === "待處理" && (
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
          {saleOrders.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
              <p className="font-sans text-[13px] text-text-disabled">
                沒有符合當前篩選與關鍵字的交易訂單記錄。
              </p>
            </div>
          ) : (
            saleOrders.map((order) => (
              <MerchantOrderRow key={order.id} order={order} />
            ))
          )}
        </div>

        <div className="pt-2">
          <Pagination
            currentPage={paginationMeta.page}
            totalPages={paginationMeta.totalPages}
            onPageChange={(page) => setPage(page)}
            itemLabel="筆訂單記錄"
            totalItems={paginationMeta.total}
            itemsPerPage={paginationMeta.pageSize}
            enableScroll={true}
            scrollBlock="start"
            scrollToViewId="orders-list"
          />
        </div>
      </section>
    </div>
  );
}
