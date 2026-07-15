"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import type { TradingOrdersFilterCounts, UserTradingOrder } from "@/app/actions/orders";
import { Pagination } from "@/app/components/ui/Pagination";
import { UserOrderRow } from "@/app/components/user/UserOrderRow";
import {
  useUserTrading,
  type TradingInitialData,
} from "@/app/lib/hooks/useUserTrading";
import { getMemberAuthOrderActions } from "@/app/lib/member-order/auth-escrow";
import { mapTradingOrderToSaleOrder } from "@/app/lib/member-order/map-sale-order";
import { Badge } from "@/components/ui/badge";
import {
  PERSONA_OPTIONS,
  PENDING_ACTION_STATUSES,
  STATUS_OPTIONS,
  TAB_STATUS_FROM_PARAM,
  type PersonaFilter,
  type TabStatusFilter,
} from "@/lib/member-order/constants";
import { cn } from "@/lib/utils";

const ReviewModal = dynamic(
  () =>
    import("@/app/components/trading/ReviewModal").then(
      (module) => module.ReviewModal,
    ),
  { ssr: false },
);

type ActiveReviewState = {
  orderId: string;
  revieweeId: string;
} | null;

type UserTradingClientProps = {
  initialData: TradingInitialData;
  initialTabStatus: TabStatusFilter;
  bootstrapError?: string;
};

function formatPersonaTabLabel(
  value: PersonaFilter,
  label: string,
  counts: TradingOrdersFilterCounts,
): string {
  const count = counts.persona[value];
  return count > 0 ? `${label} (${count})` : label;
}

function formatStatusTabLabel(
  value: TabStatusFilter,
  label: string,
  counts: TradingOrdersFilterCounts,
): string {
  const count = counts.status[value];
  return count > 0 ? `${label} (${count})` : label;
}

function renderStatusBadge(order: UserTradingOrder) {
  if (order.useAuthentication && order.status === "pending" && order.escrowStatus) {
    switch (order.escrowStatus) {
      case "payment":
        return (
          <Badge variant="secondary" className="bg-amber-950 text-amber-400">
            待付款
          </Badge>
        );
      case "custody":
        return (
          <Badge variant="secondary" className="bg-blue-950 text-blue-400">
            待寄平台
          </Badge>
        );
      case "grading":
        return (
          <Badge variant="secondary" className="bg-purple-950 text-purple-400">
            鑑定中
          </Badge>
        );
      case "shipped":
        return (
          <Badge variant="secondary" className="bg-cyan-950 text-cyan-400">
            運送中
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="bg-amber-950 text-amber-400">
            待處理
          </Badge>
        );
    }
  }

  switch (order.status ?? "") {
    case "pending":
    case "meetup_arranged":
      return (
        <Badge variant="secondary" className="bg-amber-950 text-amber-400">
          待處理
        </Badge>
      );
    case "completed":
      return <Badge variant="success">已完成</Badge>;
    case "cancelled":
      return <Badge variant="destructive">已取消</Badge>;
    default:
      return null;
  }
}

export function UserTradingClient({
  initialData,
  initialTabStatus,
  bootstrapError,
}: UserTradingClientProps) {
  const searchParams = useSearchParams();
  const [persona, setPersona] = useState<PersonaFilter>("all");
  const [tabStatus, setTabStatus] = useState<TabStatusFilter>(initialTabStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeReview, setActiveReview] = useState<ActiveReviewState>(null);

  const {
    orders,
    paginationMeta,
    filterCounts,
    isLoading,
    isRefreshing,
    error: fetchError,
    refetch,
    setPage,
  } = useUserTrading({
    persona,
    tabStatus,
    searchQuery,
    initialData,
  });

  useEffect(() => {
    const queryFilter = searchParams.get("filter");
    if (queryFilter && TAB_STATUS_FROM_PARAM[queryFilter]) {
      const nextStatus = TAB_STATUS_FROM_PARAM[queryFilter];
      queueMicrotask(() => setTabStatus(nextStatus));
    }
  }, [searchParams]);

  const handleOpenReview = useCallback(
    (orderId: string, revieweeId: string) => {
      setActiveReview({ orderId, revieweeId });
    },
    [],
  );

  const handleCloseReview = useCallback(() => {
    setActiveReview(null);
    refetch();
  }, [refetch]);

  const handleRefreshOrders = useCallback(() => {
    refetch();
  }, [refetch]);

  const needsAction = filterCounts.needsAction;
  const displayError = bootstrapError ?? fetchError;

  return (
    <>
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
                {needsAction + " 件交易"}
              </span>{" "}
              需要您的處理：完成付款、寄出卡牌或確認收貨。
            </p>
          </div>
        )}

        {displayError && (
          <div className="px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
            <p className="font-sans text-[13px] text-warning">
              無法載入線上訂單：{displayError}
            </p>
          </div>
        )}

        <div className="relative bg-bg-card rounded-2xl border border-white/5 p-4 shadow-sm flex flex-col gap-2">
          <label
            htmlFor="user-order-search"
            className="font-mono pl-1 text-xs text-text-primary uppercase tracking-wider"
          >
            訂單搜尋
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
                id="user-order-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="輸入訂單編號、卡牌名稱、卡號、系列代碼或交易對手姓名..."
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
          id="orders-list"
          aria-labelledby="user-trading-heading"
          className="space-y-4"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2
                id="user-trading-heading"
                className="font-sans font-semibold text-[16px] text-text-primary"
              >
                {"交易管理（" + paginationMeta.total + "）"}
              </h2>

              <div className="flex gap-1.5 flex-wrap justify-start sm:justify-end">
                {STATUS_OPTIONS.map((option) => {
                  const isActive = tabStatus === option.value;
                  let btnClass =
                    "text-text-secondary border-white/5 hover:text-text-primary hover:bg-bg-elevated";
                  if (isActive) {
                    if (option.value === "pending") {
                      btnClass =
                        "text-warning border-warning/40 bg-[rgba(239,68,68,0.06)] font-bold shadow-xs animate-fadeIn";
                    } else {
                      btnClass =
                        "text-brand border-brand/40 bg-[rgba(212,165,116,0.08)] font-bold shadow-xs";
                    }
                  }
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTabStatus(option.value)}
                      className={cn(
                        "font-mono text-[11px] px-3 py-1 rounded-lg border transition-all cursor-pointer",
                        btnClass,
                      )}
                    >
                      {formatStatusTabLabel(
                        option.value,
                        option.label,
                        filterCounts,
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-1.5 flex-wrap justify-start sm:justify-start">
              {PERSONA_OPTIONS.map((option) => {
                const isActive = persona === option.value;
                const btnClass = isActive
                  ? "text-brand border-brand/40 bg-[rgba(212,165,116,0.08)] font-bold shadow-xs"
                  : "text-text-secondary border-white/5 hover:text-text-primary hover:bg-bg-elevated";
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPersona(option.value)}
                    className={cn(
                      "font-mono text-[11px] px-3 py-1 rounded-lg border transition-all cursor-pointer",
                      btnClass,
                    )}
                  >
                    {formatPersonaTabLabel(
                      option.value,
                      option.label,
                      filterCounts,
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3 min-h-[200px]">
            {isLoading && orders.length === 0 ? (
              <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
                <div className="mx-auto w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
                <p className="font-sans text-[13px] text-text-disabled">
                  沒有符合當前篩選與關鍵字的交易訂單記錄。
                </p>
              </div>
            ) : (
              orders.map((order) => {
                const authActions = order.useAuthentication
                  ? getMemberAuthOrderActions({
                      persona: order.persona,
                      useAuthentication: order.useAuthentication,
                      escrowStatus: order.escrowStatus,
                      status: order.status,
                    })
                  : null;

                return (
                <UserOrderRow
                  key={order.id}
                  order={mapTradingOrderToSaleOrder(order)}
                  detailOrderId={order.id}
                  orderNumber={order.orderNumber}
                  statusBadge={renderStatusBadge(order)}
                  onOpenReview={handleOpenReview}
                  dbOrderContext={{
                    orderKind: order.orderKind,
                    orderId: order.id,
                    revieweeId: order.counterparty.id,
                    dbStatus: order.status ?? "",
                    hasReviewedByMe: order.hasReviewedByMe,
                    useAuthentication: order.useAuthentication,
                    escrowStatus: order.escrowStatus,
                    canPay: authActions?.canPay ?? false,
                    canCancel:
                      authActions?.canCancel ??
                      (order.persona === "sell" &&
                        PENDING_ACTION_STATUSES.has(order.status ?? "")),
                    onRefresh: handleRefreshOrders,
                  }}
                />
              );
              })
            )}
          </div>

          {paginationMeta.total > 0 && (
            <div className="pt-2">
              <Pagination
                currentPage={paginationMeta.page}
                totalPages={paginationMeta.totalPages}
                onPageChange={(nextPage) => setPage(nextPage)}
                itemLabel="筆訂單記錄"
                totalItems={paginationMeta.total}
                itemsPerPage={paginationMeta.pageSize}
                enableScroll={true}
                scrollBlock="start"
                scrollToViewId="orders-list"
              />
            </div>
          )}
        </section>
      </div>

      {activeReview ? (
        <ReviewModal
          isOpen={activeReview !== null}
          onClose={handleCloseReview}
          orderId={activeReview.orderId}
          revieweeId={activeReview.revieweeId}
        />
      ) : null}
    </>
  );
}
