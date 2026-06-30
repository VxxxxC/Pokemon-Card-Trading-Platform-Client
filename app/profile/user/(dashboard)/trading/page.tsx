"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useSyncExternalStore,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { SaleOrder } from "@/app/lib/types/trading";
import { Pagination } from "@/app/components/ui/Pagination";
import { UserOrderRow } from "@/app/components/user/UserOrderRow";

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

function UserTradingPageContent() {
  const searchParams = useSearchParams();
  const initialFilter = searchParams.get("filter") || "全部";

  const [filter, setFilter] = useState(initialFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Polymorphic Actor Filters
  const [showBuyOrders, setShowBuyOrders] = useState(true);
  const [showSellOrders, setShowSellOrders] = useState(true);

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
  }, [filter, searchQuery, showBuyOrders, showSellOrders]);

  const filteredOrders = useMemo(() => {
    return USER_MOCK_ORDERS_DB.filter((order) => {
      // 1. Base State Check (Filter Status)
      let matchFilter = true;
      if (filter === "待處理") {
        matchFilter =
          order.status === "payment" ||
          order.status === "custody" ||
          order.status === "shipped" ||
          order.status === "grading";
      } else if (filter === "已完成") {
        matchFilter = order.status === "released";
      } else if (filter === "已取消") {
        matchFilter = order.status === "cancelled";
      }

      // 2. Identity Context Matrix Alignment
      let matchContext = false;
      if (showBuyOrders && order.userContext === "BUYER") {
        matchContext = true;
      }
      if (showSellOrders && order.userContext === "SELLER") {
        matchContext = true;
      }

      // 3. Search Query Expansion
      const normalizedQuery = searchQuery.trim().toLowerCase();
      let matchSearch = true;
      if (normalizedQuery) {
        matchSearch =
          order.cardName.toLowerCase().includes(normalizedQuery) ||
          order.cardNo.toLowerCase().includes(normalizedQuery) ||
          order.buyerName.toLowerCase().includes(normalizedQuery) ||
          order.sellerName.toLowerCase().includes(normalizedQuery) ||
          order.id.toLowerCase().includes(normalizedQuery);
      }

      return matchFilter && matchContext && matchSearch;
    });
  }, [filter, searchQuery, showBuyOrders, showSellOrders]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const needsAction = USER_MOCK_ORDERS_DB.filter((o) => {
    const isSeller = o.userContext === "SELLER";
    if (isSeller) {
      return o.status === "custody" || o.status === "payment";
    } else {
      return o.status === "payment" || o.status === "shipped";
    }
  });

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
              {needsAction.length + " 件交易"}
            </span>{" "}
            需要您的處理：完成付款、寄出卡牌或確認收貨。
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
              placeholder="輸入卡牌名稱、卡號、交易對手姓名或訂單ID..."
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2
            id="user-trading-heading"
            className="font-sans font-semibold text-[16px] text-text-primary"
          >
            {"交易管理（" + filteredOrders.length + "）"}
          </h2>

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

        {/* 🎯 Polymorphic Dual-Role Controller Row */}
        <div className="flex items-center gap-4 px-4 py-2.5 bg-[#17130f] border border-white/5 rounded-xl animate-fadeIn mt-2 w-full sm:w-auto">
          <span className="font-sans text-[11px] text-text-secondary font-medium mr-2">
            交易方：
          </span>
          <label className="flex items-center gap-2 font-sans text-[12px] text-text-primary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showBuyOrders}
              onChange={(e) => setShowBuyOrders(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/10 bg-bg-card text-brand focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            買單
          </label>
          <label className="flex items-center gap-2 font-sans text-[12px] text-text-primary cursor-pointer select-none">
            <input
              type="checkbox"
              checked={showSellOrders}
              onChange={(e) => setShowSellOrders(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-white/10 bg-bg-card text-brand focus:ring-0 focus:ring-offset-0 cursor-pointer"
            />
            賣單
          </label>
        </div>

        <div className="space-y-3 min-h-[200px]">
          {paginatedOrders.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-white/5 p-12 text-center">
              <p className="font-sans text-[13px] text-text-disabled">
                沒有符合當前篩選與關鍵字的交易訂單記錄。
              </p>
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <UserOrderRow key={order.id} order={order} />
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
