"use client";

import React, { useState, useEffect, useMemo } from "react";
import type { OrderStatus } from "@/app/lib/types/rbac";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import { Pagination } from "@/app/components/ui/Pagination"; // 完美引入全站統一分頁控制器
import { toast } from "sonner";

// 🟢 擴充版中央數據源：注入海量級模擬數據，以供完美測試網頁端(8張)與手機端(5張)的分頁切片
const initialSaleOrders: SaleOrder[] = [
  { id: "ORD-20250519-041", buyer: "M.佐藤",     cardName: "Charizard ex SAR", cardNo: "sv2a-182", grade: "PSA 10", amount: 49_800, depositPaid: 9_960,  status: "custody",  createdAt: "2025/5/19" },
  { id: "ORD-20250519-039", buyer: "K.田中",     cardName: "Umbreon ex SAR",   cardNo: "sv6a-109", grade: "BGS 9",  amount: 38_200, depositPaid: 7_640,  status: "payment",  createdAt: "2025/5/19" },
  { id: "ORD-20250517-035", buyer: "C.Chen",     cardName: "Pikachu ex SAR",   cardNo: "sv3a-062", grade: "PSA 10", amount: 32_500, depositPaid: 32_500, status: "grading",  createdAt: "2025/5/17", trackingNo: "SF1234567890JP" },
  { id: "ORD-20250515-030", buyer: "A.Yamamoto", cardName: "Gardevoir ex SAR", cardNo: "sv4a-237", grade: "PSA 9",  amount: 28_000, depositPaid: 5_600,  status: "shipped",  createdAt: "2025/5/15", trackingNo: "YM9876543210JP" },
  { id: "ORD-20250510-025", buyer: "R.Suzuki",   cardName: "Sylveon ex SAR",   cardNo: "s6a-210",  grade: "BGS 9.5",amount: 22_800, depositPaid: 22_800, status: "released", createdAt: "2025/5/10" },
  { id: "ORD-20250508-012", buyer: "H.渡邊",     cardName: "Mewtwo ex SAR",    cardNo: "sv4a-222", grade: "PSA 10", amount: 19_500, depositPaid: 3_900,  status: "released", createdAt: "2025/5/08" },
  { id: "ORD-20250505-009", buyer: "T.高橋",     cardName: "Lugia V SA",       cardNo: "s12a-110", grade: "BGS 9.5",amount: 62_000, depositPaid: 62_000, status: "released", createdAt: "2025/5/05" },
  { id: "ORD-20250430-004", buyer: "J.Lin",      cardName: "Rayquaza VMAX SA", cardNo: "s7r-083",  grade: "PSA 10", amount: 88_000, depositPaid: 17_600, status: "payment",  createdAt: "2025/4/30" },
  { id: "ORD-20250428-002", buyer: "W.王",       cardName: "Gengar VMAX SA",   cardNo: "s8b-020",  grade: "PSA 9",  amount: 41_000, depositPaid: 8_200,  status: "custody",  createdAt: "2025/4/28" },
  { id: "ORD-20250425-001", buyer: "K.中村",     cardName: "Eeeve ex SAR",     cardNo: "sv5a-088", grade: "RAW NM", amount: 12_500, depositPaid: 2_500,  status: "released", createdAt: "2025/4/25" },
];

interface SaleOrder {
  id: string;
  buyer: string;
  cardName: string;
  cardNo: string;
  grade: string;
  amount: number;
  depositPaid: number;
  status: OrderStatus;
  createdAt: string;
  trackingNo?: string;
}

const STATUS_STEP_INDEX: Record<OrderStatus, number> = {
  payment: 0, custody: 1, shipped: 2, grading: 3, released: 4,
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const step = ESCROW_STEPS[STATUS_STEP_INDEX[status]];
  const colorMap: Record<OrderStatus, string> = {
    payment:  "text-warning bg-[rgba(239,68,68,0.10)]",
    custody:  "text-brand bg-[rgba(212,165,116,0.12)]",
    shipped:  "text-[#3b9eff] bg-[rgba(59,158,255,0.12)]",
    grading:  "text-success bg-[rgba(16,185,129,0.12)]",
    released: "text-text-secondary bg-bg-elevated",
  };
  return (
    <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full ${colorMap[status] ?? "text-text-disabled bg-bg-elevated"}`}>
      {step?.label ?? (status === "released" ? "已完成" : status)}
    </span>
  );
}

export default function MerchantTradingPage() {
  // 🟢 狀態機核心管理艙
  const [orders, setOrders] = useState<SaleOrder[]>(initialSaleOrders);
  const [filter, setFilter] = useState<string>("全部");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(8); // 預設網頁端每頁 8 筆

  // 🟢 響應式佈局監聽：動態切換 Web(8單) 與 Mobile(5單) 嘅分頁每頁載入量
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth < 768) {
        setItemsPerPage(5); // Mobile View
      } else {
        setItemsPerPage(8); // Web View
      }
    }
    handleResize(); // 初始化執行
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 重置頁碼防線：當過濾條件或搜尋關鍵字改變時，自動退回第 1 頁
  useEffect(() => {
    queueMicrotask(() => setCurrentPage(1));
  }, [filter, searchQuery]);

  // 🟢 核心數據加工鏈：聯動過濾器 + 全文本模糊檢索搜尋
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. 管線狀態機分流篩選
      let matchFilter = true;
      if (filter === "待付款") {
        matchFilter = order.status === "payment";
      } else if (filter === "鑑定中") {
        matchFilter = order.status === "custody" || order.status === "shipped" || order.status === "grading";
      } else if (filter === "已完成") {
        matchFilter = order.status === "released";
      } else if (filter === "已取消") {
        matchFilter = order.status === ("cancelled" as OrderStatus);
      }

      // 2. 全域關鍵字模糊比對（卡名、編號、買家、訂單ID）
      const normalizedQuery = searchQuery.trim().toLowerCase();
      let matchSearch = true;
      if (normalizedQuery) {
        matchSearch =
          order.cardName.toLowerCase().includes(normalizedQuery) ||
          order.cardNo.toLowerCase().includes(normalizedQuery) ||
          order.buyer.toLowerCase().includes(normalizedQuery) ||
          order.id.toLowerCase().includes(normalizedQuery);
      }

      return matchFilter && matchSearch;
    });
  }, [orders, filter, searchQuery]);

  // 🟢 數據切片（Pagination Slice Computation）
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filteredOrders.slice(start, end);
  }, [filteredOrders, currentPage, itemsPerPage]);

  const needsAction = orders.filter((o) => o.status === "custody" || o.status === "payment");

  // 模擬發貨操作控制流
  const handleShipConfirm = (id: string, trackingNo: string) => {
    if (!trackingNo.trim()) {
      toast.error("請先填寫物流追蹤號碼");
      return;
    }
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "shipped" as OrderStatus, trackingNo } : o))
    );
    toast.success(`訂單 #${id.slice(-6)} 已成功確認發貨`);
  };

  return (
    <div className="space-y-5">
      {/* ── Needs Action Banner ───────────────────────────────────────── */}
      {needsAction.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl animate-fadeIn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-sans text-[13px] text-text-primary">
            <span className="font-semibold text-warning">{needsAction.length} 件訂單</span> 需要您的處理：確認訂單或安排發貨。
          </p>
        </div>
      )}

      {/* ── 🟢 全域高感光訂單智慧搜尋欄 ────────────────────────────────── */}
      <div className="relative bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-sm flex flex-col gap-2">
        <label htmlFor="merchant-order-search" className="font-mono text-[11px] text-text-secondary uppercase tracking-wider">
          🔍 智慧訂單檢索控制台 (SUPPORT FUZZY QUERY)
        </label>
        <div className="flex items-center bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary overflow-hidden w-full transition-all focus-within:border-brand/30">
          <input
            id="merchant-order-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="輸入卡牌名稱、卡號 (如 sv2a-182)、買家姓名或訂單 ID 進行精確過濾..."
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

      {/* ── Orders List Workspace ─────────────────────────────────────── */}
      <section aria-labelledby="trading-heading" className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 id="trading-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            交易管理 ({filteredOrders.length})
          </h2>
          
          {/* ── 🟢 完美接通狀態機：四階段交易管線分流篩選器 ── */}
          <div className="flex gap-1.5 flex-wrap justify-start sm:justify-end">
            {["全部", "已取消", "待付款", "鑑定中", "已完成"].map((f) => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`font-mono text-[11px] px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? "text-brand border-brand/40 bg-[rgba(212,165,116,0.08)] font-bold shadow-xs"
                      : "text-text-secondary border-[rgba(237,232,224,0.08)] hover:text-text-primary hover:bg-bg-elevated"
                  }`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* 訂單卡片矩陣流 */}
        <div className="space-y-3 min-h-[200px]">
          {paginatedOrders.length === 0 ? (
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-12 text-center">
              <p className="font-sans text-[13px] text-text-disabled">沒有符合當前篩選與關鍵字的交易訂單記錄。</p>
            </div>
          ) : (
            paginatedOrders.map((order) => (
              <div
                key={order.id}
                className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-xs hover:border-[rgba(237,232,224,0.15)] transition-colors animate-fadeIn"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-sans text-[14px] font-semibold text-text-primary truncate">{order.cardName}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="font-mono text-[11px] text-text-secondary">{order.cardNo} · {order.grade} · 買家：{order.buyer}</p>
                    <p className="font-mono text-[10px] text-text-disabled mt-0.5">#{order.id} · {order.createdAt}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-bold text-[15px] text-text-primary">
                      HK$ {order.amount.toLocaleString("zh-TW")}
                    </p>
                    <p className="font-mono text-[11px] text-text-disabled">
                      訂金 HK$ {order.depositPaid.toLocaleString("zh-TW")}
                    </p>
                  </div>
                </div>

                {/* 狀態機對應功能按鈕區 */}
                {order.status === "payment" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "custody" as OrderStatus } : o));
                        toast.success("已確認接收訂金，請填寫物流單號準備出貨。");
                      }}
                      className="flex-1 h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer"
                    >
                      確認並準備發貨
                    </button>
                    <button
                      type="button"
                      onClick={() => toast.info(`正在發起與買家「${order.buyer}」的私域加密對話視窗...`)}
                      className="px-4 h-10 font-sans text-[13px] text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated hover:text-text-primary transition-colors cursor-pointer"
                    >
                      聯絡買家
                    </button>
                  </div>
                )}

                {order.status === "custody" && (
                  <div className="space-y-2">
                    <div className="flex items-center h-10 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden transition-all focus-within:border-brand/30">
                      <input
                        id={`tracking-${order.id}`}
                        type="text"
                        placeholder="填入 順豐 / 郵便 / 宅急便 物流追蹤號碼"
                        className="flex-1 h-full bg-transparent px-4 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleShipConfirm(order.id, (e.target as HTMLInputElement).value);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const el = document.getElementById(`tracking-${order.id}`) as HTMLInputElement;
                          handleShipConfirm(order.id, el?.value ?? "");
                        }}
                        className="px-4 h-full font-mono text-[11px] text-brand border-l border-[rgba(237,232,224,0.08)] hover:bg-[rgba(212,165,116,0.08)] transition-colors cursor-pointer"
                      >
                        確認發貨
                      </button>
                    </div>
                    <p className="font-mono text-[10px] text-text-disabled">
                      ⚠ 嚴禁在聊天中共享銀行帳號或個人聯絡方式，所有付款均透過平台託管處理。
                    </p>
                  </div>
                )}

                {order.trackingNo && order.status !== "custody" && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2 bg-bg-elevated rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                        <rect x="9" y="11" width="14" height="10" rx="2" ry="2" />
                        <circle cx="12" cy="18" r="1.5" />
                      </svg>
                      <span className="font-mono text-[11px] text-text-secondary">
                        順豐速運追蹤號：<span className="text-brand font-bold">{order.trackingNo}</span>
                      </span>
                    </div>
                    {order.status === "shipped" && (
                      <button
                        type="button"
                        onClick={() => {
                          setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "grading" as OrderStatus } : o));
                          toast.success("模擬變更：包裹已寄達，進入專家鑑定中心檢驗狀態。");
                        }}
                        className="font-sans text-[11px] text-brand bg-brand/5 border border-brand/20 px-2 py-0.5 rounded-md hover:bg-brand/10 transition-colors cursor-pointer"
                      >
                        送入鑑定所 🔍
                      </button>
                    )}
                  </div>
                )}

                {order.status === "released" && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.08)] border border-success/20 rounded-lg">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="font-mono text-[11px] text-success font-medium">款項已釋放成功，交易全量閉環完成</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* ── 🟢 3. 全站統一高級分頁組件注入 ── */}
        <div className="pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            itemLabel="筆訂單記錄"
            totalItems={filteredOrders.length}
            itemsPerPage={itemsPerPage}
            enableScroll={true}
          />
        </div>
      </section>
    </div>
  );
}
