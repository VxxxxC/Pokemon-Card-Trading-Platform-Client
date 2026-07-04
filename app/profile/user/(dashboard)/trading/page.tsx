"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useSyncExternalStore,
  Suspense,
  useCallback,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  getUserTradingOrders,
  type UserTradingOrder,
} from "@/app/actions/orders";
import { ReviewModal } from "@/app/components/trading/ReviewModal";
import { SaleOrder, OrderStatus } from "@/app/lib/types/trading";
import { Pagination } from "@/app/components/ui/Pagination";
import { UserOrderRow } from "@/app/components/user/UserOrderRow";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type PersonaFilter = "all" | "buy" | "sell";
type TabStatusFilter = "all" | "pending" | "completed" | "cancelled";

const TAB_STATUS_FROM_PARAM: Record<string, TabStatusFilter> = {
  全部: "all",
  待處理: "pending",
  已完成: "completed",
  已取消: "cancelled",
};

const PERSONA_OPTIONS: { value: PersonaFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "buy", label: "買單" },
  { value: "sell", label: "賣單" },
];

const STATUS_OPTIONS: { value: TabStatusFilter; label: string }[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待處理" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];

const ACTION_REQUIRED_STATUSES = new Set([
  "pending",
  "meetup_arranged",
  "in_custody",
]);

const PENDING_ACTION_STATUSES = new Set(["pending"]);

type ActiveReviewState = {
  orderId: string;
  revieweeId: string;
} | null;

const MOCK_ACTION_REQUIRED_STATUSES = new Set<OrderStatus>([
  "payment",
  "custody",
  "shipped",
]);

type TradingOrderRow =
  | { source: "db"; rowKey: string; order: UserTradingOrder }
  | { source: "mock"; rowKey: string; order: SaleOrder };

function parseSortableDate(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function matchesPersonaFilter(
  persona: PersonaFilter,
  userContext: "BUYER" | "SELLER",
): boolean {
  if (persona === "buy") {
    return userContext === "BUYER";
  }
  if (persona === "sell") {
    return userContext === "SELLER";
  }
  return true;
}

function matchesTabStatusFilter(
  tabStatus: TabStatusFilter,
  mockStatus: OrderStatus,
): boolean {
  if (tabStatus === "pending") {
    return (
      mockStatus === "payment" ||
      mockStatus === "custody" ||
      mockStatus === "shipped" ||
      mockStatus === "grading"
    );
  }
  if (tabStatus === "completed") {
    return mockStatus === "released";
  }
  if (tabStatus === "cancelled") {
    return mockStatus === "cancelled";
  }
  return true;
}

function matchesSearchQuery(order: SaleOrder, searchQuery: string): boolean {
  const normalizedQuery = searchQuery.trim().toLowerCase();
  if (!normalizedQuery) {
    return true;
  }

  return (
    order.cardName.toLowerCase().includes(normalizedQuery) ||
    order.cardNo.toLowerCase().includes(normalizedQuery) ||
    order.buyerName.toLowerCase().includes(normalizedQuery) ||
    order.sellerName.toLowerCase().includes(normalizedQuery) ||
    order.id.toLowerCase().includes(normalizedQuery)
  );
}

function filterMockOrders(
  persona: PersonaFilter,
  tabStatus: TabStatusFilter,
  searchQuery: string,
): SaleOrder[] {
  return USER_MOCK_ORDERS_DB.filter((order) => {
    return (
      matchesPersonaFilter(persona, order.userContext) &&
      matchesTabStatusFilter(tabStatus, order.status) &&
      matchesSearchQuery(order, searchQuery)
    );
  });
}

function mockStatusToBadgeKey(status: OrderStatus): string {
  switch (status) {
    case "payment":
      return "pending";
    case "custody":
    case "shipped":
      return "in_custody";
    case "grading":
      return "grading";
    case "released":
      return "completed";
    case "cancelled":
      return "cancelled";
    default:
      return status;
  }
}

export const USER_MOCK_ORDERS_DB: SaleOrder[] = [
  {
    id: "ORD-2026-U01",
    buyerId: "USR-ME",
    buyerName: "田中 Koji",
    sellerId: "HKCV-MER-001",
    sellerName: "KojiTCG Premium",
    cardName: "Charizard ex SAR (噴火龍)",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    amount: 49800,
    status: "payment",
    createdAt: "2026/05/27",
    orderType: "B2C",
    userContext: "BUYER",
  },
  {
    id: "ORD-2026-U02",
    buyerId: "USR-BUY-002",
    buyerName: "M.佐藤",
    sellerId: "USR-ME",
    sellerName: "田中 Koji",
    cardName: "Umbreon ex SAR (月亮伊布)",
    cardNo: "sv6a-109",
    grade: "Raw 裸卡",
    amount: 38200,
    status: "custody",
    createdAt: "2026/05/26",
    orderType: "C2C",
    userContext: "SELLER",
  },
  {
    id: "ORD-2026-U03",
    buyerId: "USR-ME",
    buyerName: "田中 Koji",
    sellerId: "HKCV-MER-002",
    sellerName: "渡邊道館",
    cardName: "Marnie (瑪俐) SR 198/190",
    cardNo: "s5a-070",
    grade: "PSA 10",
    amount: 4200,
    status: "grading",
    createdAt: "2026/05/25",
    orderType: "B2C",
    userContext: "BUYER",
  },
  {
    id: "ORD-2026-U04",
    buyerId: "USR-ME",
    buyerName: "田中 Koji",
    sellerId: "USR-SEL-004",
    sellerName: "東京TCG市場",
    cardName: "Pikachu AR (皮卡丘)",
    cardNo: "sv2a-215",
    grade: "CGC 9",
    amount: 425,
    status: "payment",
    createdAt: "2026/05/24",
    orderType: "C2C",
    userContext: "BUYER",
  },
  {
    id: "ORD-2026-U05",
    buyerId: "USR-ME",
    buyerName: "田中 Koji",
    sellerId: "USR-SEL-005",
    sellerName: "尖沙咀卡神",
    cardName: "Lillie (莉莉艾) SR 119/114",
    cardNo: "sm4+119",
    grade: "BGS 9.5",
    amount: 18500,
    status: "released",
    createdAt: "2026/05/10",
    orderType: "C2C",
    userContext: "BUYER",
  },
  {
    id: "ORD-2026-U06",
    buyerId: "USR-BUY-006",
    buyerName: "元朗李生",
    sellerId: "USR-ME",
    sellerName: "田中 Koji",
    cardName: "Gengar VMAX (耿鬼) SA 020/019",
    cardNo: "sGG-020",
    grade: "PSA 10",
    amount: 3400,
    status: "released",
    createdAt: "2026/05/08",
    orderType: "C2C",
    userContext: "SELLER",
  },
  {
    id: "ORD-2026-U07",
    buyerId: "USR-ME",
    buyerName: "田中 Koji",
    sellerId: "HKCV-MER-007",
    sellerName: "木戶卡牌旗艦店",
    cardName: "Rayquaza VMAX SA 083/067",
    cardNo: "s7R-083",
    grade: "PSA 10",
    amount: 4800,
    status: "released",
    createdAt: "2026/05/05",
    orderType: "B2C",
    userContext: "BUYER",
  },
];

function renderStatusBadge(status: string) {
  switch (status) {
    case "pending":
    case "meetup_arranged":
      return (
        <Badge variant="secondary" className="bg-amber-950 text-amber-400">
          待處理
        </Badge>
      );
    case "in_custody":
      return (
        <Badge variant="secondary" className="bg-blue-950 text-blue-400">
          保管中
        </Badge>
      );
    case "grading":
      return (
        <Badge variant="secondary" className="bg-purple-950 text-purple-400">
          鑑定中
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

function formatListingGrade(order: UserTradingOrder): string {
  const { gradingCompany, gradingScore } = order.listing;
  if (gradingScore) {
    return `${gradingCompany} ${gradingScore}`;
  }
  if (gradingCompany && gradingCompany.toLowerCase() !== "raw") {
    return gradingCompany;
  }
  return "Raw 裸卡";
}

function formatOrderDateTime(createdAt: string | null): string {
  if (!createdAt) {
    return "";
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function mapTradingOrderToSaleOrder(order: UserTradingOrder): SaleOrder {
  const isBuyer = order.persona === "buy";
  const counterpartyName = order.counterparty.displayName;

  return {
    id: order.id,
    buyerId: order.buyerId,
    buyerName: isBuyer ? "" : counterpartyName,
    sellerId: order.sellerId,
    sellerName: isBuyer ? counterpartyName : "",
    cardName: order.product.cardName,
    cardNo: order.product.cardNumber ?? order.product.displayId ?? "",
    grade: formatListingGrade(order),
    amount: order.finalPrice,
    status: "payment",
    createdAt: formatOrderDateTime(order.createdAt),
    orderType: "C2C",
    userContext: isBuyer ? "BUYER" : "SELLER",
    productListingId: order.id,
    hasAuthenticationToggle: order.listing.useAuthentication,
  };
}

function UserTradingPageContent() {
  const searchParams = useSearchParams();
  const initialTabStatus =
    TAB_STATUS_FROM_PARAM[searchParams.get("filter") ?? ""] ?? "all";

  const [persona, setPersona] = useState<PersonaFilter>("all");
  const [tabStatus, setTabStatus] = useState<TabStatusFilter>(initialTabStatus);
  const [searchQuery, setSearchQuery] = useState("");
  const [dbOrders, setDbOrders] = useState<UserTradingOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeReview, setActiveReview] = useState<ActiveReviewState>(null);

  useEffect(() => {
    const queryFilter = searchParams.get("filter");
    if (queryFilter && TAB_STATUS_FROM_PARAM[queryFilter]) {
      const nextStatus = TAB_STATUS_FROM_PARAM[queryFilter];
      queueMicrotask(() => setTabStatus(nextStatus));
    }
  }, [searchParams]);

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
  }, [persona, tabStatus, searchQuery]);

  useEffect(() => {
    let cancelled = false;
    const debounceMs = searchQuery.trim() ? 300 : 0;

    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      setFetchError(null);

      const result = await getUserTradingOrders({
        persona,
        tabStatus,
        searchQuery: searchQuery.trim() || undefined,
      });

      if (cancelled) {
        return;
      }

      if (result.success) {
        setDbOrders(result.data);
        setFetchError(null);
      } else {
        setDbOrders([]);
        setFetchError(result.error);
      }

      setIsLoading(false);
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [persona, tabStatus, searchQuery, refreshKey]);

  const handleOpenReview = useCallback(
    (orderId: string, revieweeId: string) => {
      setActiveReview({ orderId, revieweeId });
    },
    [],
  );

  const handleCloseReview = useCallback(() => {
    setActiveReview(null);
    setRefreshKey((key) => key + 1);
  }, []);

  const handleRefreshOrders = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const filteredMockOrders = useMemo(
    () => filterMockOrders(persona, tabStatus, searchQuery),
    [persona, tabStatus, searchQuery],
  );

  const displayRows = useMemo((): TradingOrderRow[] => {
    const dbRows: TradingOrderRow[] = dbOrders.map((order) => ({
      source: "db",
      rowKey: `db-${order.id}`,
      order,
    }));

    const mockRows: TradingOrderRow[] = filteredMockOrders.map((order) => ({
      source: "mock",
      rowKey: `mock-${order.id}`,
      order,
    }));

    return [...dbRows, ...mockRows].sort((left, right) => {
      const leftDate =
        left.source === "db"
          ? parseSortableDate(left.order.createdAt)
          : parseSortableDate(left.order.createdAt);
      const rightDate =
        right.source === "db"
          ? parseSortableDate(right.order.createdAt)
          : parseSortableDate(right.order.createdAt);
      return rightDate - leftDate;
    });
  }, [dbOrders, filteredMockOrders]);

  const totalPages = Math.ceil(displayRows.length / itemsPerPage);
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return displayRows.slice(start, end);
  }, [displayRows, currentPage, itemsPerPage]);

  const needsAction = useMemo(() => {
    const dbActionCount = dbOrders.filter((order) =>
      ACTION_REQUIRED_STATUSES.has(order.status ?? ""),
    ).length;

    const mockActionCount = USER_MOCK_ORDERS_DB.filter((order) => {
      if (!MOCK_ACTION_REQUIRED_STATUSES.has(order.status)) {
        return false;
      }

      if (order.userContext === "SELLER") {
        return order.status === "custody" || order.status === "payment";
      }

      return order.status === "payment" || order.status === "shipped";
    }).length;

    return dbActionCount + mockActionCount;
  }, [dbOrders]);

  return (
    <>
      <div className="space-y-5 animate-fadeIn">
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

      {fetchError && (
        <div className="px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <p className="font-sans text-[13px] text-warning">
            無法載入線上訂單：{fetchError}（仍顯示示範訂單）
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
              placeholder="輸入卡牌名稱、卡號、交易對手姓名或訂單編號..."
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
              {"交易管理（" + displayRows.length + "）"}
            </h2>

            <Tabs
              value={tabStatus}
              onValueChange={(value) => setTabStatus(value as TabStatusFilter)}
            >
              <TabsList className="bg-[#17130f] border border-white/5 h-auto p-1">
                {STATUS_OPTIONS.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className={cn(
                      "font-mono text-[11px] px-3 py-1 rounded-lg data-active:bg-[rgba(212,165,116,0.08)] data-active:text-brand",
                      option.value === "pending" &&
                        "data-active:bg-[rgba(239,68,68,0.06)] data-active:text-warning",
                    )}
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Tabs
            value={persona}
            onValueChange={(value) => setPersona(value as PersonaFilter)}
          >
            <TabsList className="bg-[#17130f] border border-white/5 h-auto p-1 w-full sm:w-auto">
              {PERSONA_OPTIONS.map((option) => (
                <TabsTrigger
                  key={option.value}
                  value={option.value}
                  className="font-sans text-[12px] px-4 py-1.5 data-active:text-text-primary"
                >
                  {option.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        <div className="space-y-3 min-h-[200px]">
          {isLoading && displayRows.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
              <div className="mx-auto w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
            </div>
          ) : paginatedRows.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
              <p className="font-sans text-[13px] text-text-disabled">
                沒有符合當前篩選與關鍵字的交易訂單記錄。
              </p>
            </div>
          ) : (
            paginatedRows.map((row) =>
              row.source === "db" ? (
                <UserOrderRow
                  key={row.rowKey}
                  order={mapTradingOrderToSaleOrder(row.order)}
                  detailOrderId={row.order.id}
                  orderNumber={row.order.orderNumber}
                  statusBadge={renderStatusBadge(row.order.status ?? "")}
                  onOpenReview={handleOpenReview}
                  dbOrderContext={{
                    orderId: row.order.id,
                    revieweeId: row.order.counterparty.id,
                    dbStatus: row.order.status ?? "",
                    hasReviewedByMe: row.order.hasReviewedByMe,
                    canCancel:
                      row.order.persona === "sell" &&
                      PENDING_ACTION_STATUSES.has(row.order.status ?? ""),
                    onRefresh: handleRefreshOrders,
                  }}
                />
              ) : (
                <UserOrderRow
                  key={row.rowKey}
                  order={row.order}
                  statusBadge={renderStatusBadge(
                    mockStatusToBadgeKey(row.order.status),
                  )}
                />
              ),
            )
          )}
        </div>

        {displayRows.length > 0 && (
          <div className="pt-2">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              itemLabel="筆訂單記錄"
              totalItems={displayRows.length}
              itemsPerPage={itemsPerPage}
              enableScroll={true}
              scrollBlock="start"
              scrollToViewId="orders-list"
            />
          </div>
        )}
      </section>
      </div>

      <ReviewModal
        isOpen={activeReview !== null}
        onClose={handleCloseReview}
        orderId={activeReview?.orderId ?? ""}
        revieweeId={activeReview?.revieweeId ?? ""}
      />
    </>
  );
}

export default function UserTradingPage() {
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
        </div>
      }
    >
      <UserTradingPageContent />
    </Suspense>
  );
}
