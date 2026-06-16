"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/app/lib/types/rbac";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import { Pagination } from "@/app/components/ui/Pagination"; // 完美引入全站統一分頁控制器
import { toast } from "sonner";
import { SaleOrder } from "./types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// 🟢 擴充版中央數據源：注入海量級模擬數據，以供完美測試網頁端(8張)與手機端(5張)的分頁切片
const initialSaleOrders: SaleOrder[] = [
  { id: "ORD-20250519-041", buyerName: "M.佐藤", sellerName: "PokéTrade JP", cardName: "Charizard ex SAR", cardNo: "sv2a-182", grade: "PSA 10", amount: 49_800, depositPaid: 9_960,  status: "custody",  createdAt: "2025/5/19", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250519-039", buyerName: "K.田中", sellerName: "PokéTrade JP", cardName: "Umbreon ex SAR",   cardNo: "sv6a-109", grade: "BGS 9",  amount: 38_200, depositPaid: 7_640,  status: "payment",  createdAt: "2025/5/19", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250517-035", buyerName: "C.Chen", sellerName: "PokéTrade JP", cardName: "Pikachu ex SAR",   cardNo: "sv3a-062", grade: "PSA 10", amount: 32_500, depositPaid: 32_500, status: "grading",  createdAt: "2025/5/17", trackingNo: "SF1234567890JP", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250515-030", buyerName: "A.Yamamoto", sellerName: "PokéTrade JP", cardName: "Gardevoir ex SAR", cardNo: "sv4a-237", grade: "PSA 9",  amount: 28_000, depositPaid: 5_600,  status: "shipped",  createdAt: "2025/5/15", trackingNo: "YM9876543210JP", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250510-025", buyerName: "R.Suzuki", sellerName: "PokéTrade JP", cardName: "Sylveon ex SAR",   cardNo: "s6a-210",  grade: "BGS 9.5",amount: 22_800, depositPaid: 22_800, status: "released", createdAt: "2025/5/10", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250508-012", buyerName: "H.渡邊", sellerName: "PokéTrade JP", cardName: "Mewtwo ex SAR",    cardNo: "sv4a-222", grade: "PSA 10", amount: 19_500, depositPaid: 3_900,  status: "released", createdAt: "2025/5/08", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250505-009", buyerName: "T.高橋", sellerName: "PokéTrade JP", cardName: "Lugia V SA",       cardNo: "s12a-110", grade: "BGS 9.5",amount: 62_000, depositPaid: 62_000, status: "released", createdAt: "2025/5/05", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250430-004", buyerName: "J.Lin", sellerName: "PokéTrade JP", cardName: "Rayquaza VMAX SA", cardNo: "s7r-083",  grade: "PSA 10", amount: 88_000, depositPaid: 17_600, status: "payment",  createdAt: "2025/4/30", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250428-002", buyerName: "W.王", sellerName: "PokéTrade JP", cardName: "Gengar VMAX SA",   cardNo: "s8b-020",  grade: "PSA 9",  amount: 41_000, depositPaid: 8_200,  status: "custody",  createdAt: "2025/4/28", tradeContext: "B2C", userPerspective: "SELLER" },
  { id: "ORD-20250425-001", buyerName: "K.中村", sellerName: "PokéTrade JP", cardName: "Eeeve ex SAR",     cardNo: "sv5a-088", grade: "RAW NM", amount: 12_500, depositPaid: 2_500,  status: "released", createdAt: "2025/4/25", tradeContext: "B2C", userPerspective: "SELLER" },
];

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
  const [selectedOrder, setSelectedOrder] = useState<SaleOrder | null>(null);

  // Two localized standalone boolean states to handle granular sub-filtering variables dynamically
  const [subPaymentChecked, setSubPaymentChecked] = useState(true);
  const [subGradingChecked, setSubGradingChecked] = useState(true);

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
  }, [filter, searchQuery, subPaymentChecked, subGradingChecked]);

  // 🟢 核心數據加工鏈：聯動過濾器 + 全文本模糊檢索搜尋
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. 管線狀態機分流篩選
      let matchFilter = true;
      if (filter === "待處理") {
        let matchSub = false;
        if (subPaymentChecked && order.status === "payment") matchSub = true;
        if (subGradingChecked && (order.status === "custody" || order.status === "shipped" || order.status === "grading")) matchSub = true;
        matchFilter = matchSub;
      } else if (filter === "待付款") {
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
          order.buyerName.toLowerCase().includes(normalizedQuery) ||
          order.id.toLowerCase().includes(normalizedQuery);
      }

      return matchFilter && matchSearch;
    });
  }, [orders, filter, searchQuery, subPaymentChecked, subGradingChecked]);

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
            {["全部", "待處理", "待付款", "鑑定中", "已完成", "已取消"].map((f) => {
              const isActive = filter === f;
              let btnClass = "text-text-secondary border-[rgba(237,232,224,0.08)] hover:text-text-primary hover:bg-bg-elevated";
              if (isActive) {
                if (f === "待處理") {
                  btnClass = "text-warning border-warning/40 bg-[rgba(239,68,68,0.06)] font-bold shadow-xs animate-fadeIn";
                } else {
                  btnClass = "text-brand border-brand/40 bg-[rgba(212,165,116,0.08)] font-bold shadow-xs";
                }
              }
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`font-mono text-[11px] px-3 py-1 rounded-lg border transition-all cursor-pointer ${btnClass}`}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Conditional Rendering Trigger: If filter === "待處理", render sub-filter checkbox row panel ── */}
        {filter === "待處理" && (
          <div className="flex items-center gap-4 px-4 py-2.5 bg-[#17130f] border border-white/5 rounded-xl animate-fadeIn mt-2 w-full sm:w-auto">
            <span className="font-sans text-[11px] text-text-secondary font-medium mr-2">進階子篩選：</span>
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
                onClick={() => setSelectedOrder(order)}
                className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 shadow-xs hover:border-[rgba(237,232,224,0.15)] hover:bg-[#1a1612]/30 transition-all duration-200 animate-fadeIn cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <p className="font-sans text-[14px] font-semibold text-text-primary truncate">{order.cardName}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="font-mono text-[11px] text-text-secondary">{order.cardNo} · {order.grade} · 買家：{order.buyerName}</p>
                    <p className="font-mono text-[10px] text-text-disabled mt-0.5">#{order.id} · {order.createdAt}</p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                    <p className="font-mono font-bold text-[15px] text-text-primary">
                      HK$ {order.amount.toLocaleString("zh-TW")}
                    </p>
                    <p className="font-mono text-[11px] text-text-disabled">
                      訂金 HK$ {order.depositPaid.toLocaleString("zh-TW")}
                    </p>
                    <span className="font-sans text-[11px] font-bold text-brand bg-brand/5 border border-brand/20 px-2 py-0.5 rounded hover:bg-brand/10 transition-all">
                      詳情 / 履約 ➔
                    </span>
                  </div>
                </div>

                {/* 狀態機對應功能按鈕區 */}
                {order.status === "payment" && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOrders((prev) => prev.map((o) => o.id === order.id ? { ...o, status: "custody" as OrderStatus } : o));
                        toast.success("已確認接收訂金，請填寫物流單號準備出貨。");
                      }}
                      className="flex-1 h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer"
                    >
                      確認並準備發貨
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toast.info(`正在發起與買家「${order.buyerName}」的私域加密對話視窗...`);
                      }}
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
                        onClick={(e) => e.stopPropagation()}
                        placeholder="填入 順豐 / 郵便 / 宅急便 物流追蹤號碼"
                        className="flex-1 h-full bg-transparent px-4 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.stopPropagation();
                            handleShipConfirm(order.id, (e.target as HTMLInputElement).value);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
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
                        onClick={(e) => {
                          e.stopPropagation();
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

      {/* ── 🟢 4. 奢華黑金：高密度交易履約與擔保託管對話框 ── */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        {selectedOrder && (
          <DialogContent className="sm:max-w-[700px] w-full max-w-[calc(100%-2rem)] bg-[#1A1612] border border-[rgba(212,165,116,0.20)] text-text-primary overflow-y-auto max-h-[90dvh] p-6 rounded-2xl animate-scaleUp">
            <DialogHeader className="mb-4">
              <DialogTitle className="font-sans font-black text-[18px] text-brand tracking-tight flex items-center gap-2">
                🛡️ PokéTrade 擔保託管與履約中心
              </DialogTitle>
              <DialogDescription className="font-mono text-[10.5px] text-[#8A8680] uppercase tracking-wider mt-0.5">
                Escrow Agreement ID: {selectedOrder.id} · {selectedOrder.createdAt}
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* 左欄: 卡片預覽 + 交易屬性 (5 cols) */}
              <div className="md:col-span-5 space-y-4">
                <div className="relative w-full aspect-[3/4] max-h-[35dvh] md:max-h-none rounded-xl overflow-hidden bg-[#120f0c] border border-white/5 shadow-inner group">
                  <Image
                    src={`https://picsum.photos/seed/${selectedOrder.cardNo}/400/500`}
                    alt={selectedOrder.cardName}
                    fill
                    sizes="(max-width: 768px) 100vw, 300px"
                    className="object-cover scale-100 transition-transform duration-500 hover:scale-105"
                    unoptimized
                  />
                  {/* PSA Grade Badge Badge Overlay */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-[#17130f]/80 backdrop-blur-xs border border-brand/20 text-[11px] font-sans font-bold text-brand">
                    {selectedOrder.grade}
                  </div>
                </div>

                {/* 交易詳情小卡 */}
                <div className="p-3.5 bg-[#17130f] rounded-xl border border-white/5 space-y-2">
                  <div className="flex justify-between items-center text-[12.5px]">
                    <span className="text-text-secondary">交易模式</span>
                    <span className="font-mono font-bold text-brand px-1.5 py-0.5 bg-brand/5 border border-brand/15 rounded text-[11px]">
                      {selectedOrder.tradeContext} 擔保交易
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px]">
                    <span className="text-text-secondary">買家會員</span>
                    <span className="text-text-primary font-medium">{selectedOrder.buyerName}</span>
                  </div>
                  <div className="flex justify-between items-center text-[12.5px]">
                    <span className="text-text-secondary">資金狀態</span>
                    <span className="text-success font-medium flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                      PokéTrade 託管
                    </span>
                  </div>
                </div>
              </div>

              {/* 右欄: 履約進度與控制面板 (7 cols) */}
              <div className="md:col-span-7 space-y-5">
                <div>
                  <h3 className="font-sans font-black text-[16px] text-text-primary">{selectedOrder.cardName}</h3>
                  <p className="font-mono text-[11.5px] text-text-disabled mt-0.5">編號：{selectedOrder.cardNo}</p>
                </div>

                {/* 1. 履約步進圖 (Order Escrow Stepper) */}
                <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
                  <h4 className="font-sans font-bold text-[12.5px] text-brand uppercase tracking-wider">
                    🛡️ 資金與鑑定履約階段 (Escrow Progress)
                  </h4>
                  
                  <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
                    {ESCROW_STEPS.map((step, idx) => {
                      const currentStepIdx = STATUS_STEP_INDEX[selectedOrder.status];
                      const isCompleted = idx < currentStepIdx;
                      const isActive = idx === currentStepIdx;
                      
                      return (
                        <div key={step.id} className="relative text-[12.5px] leading-relaxed">
                          {/* Stepper Dot */}
                          <div className={cn(
                            "absolute left-[-23px] top-1 w-3.5 h-3.5 rounded-full border-2 transition-all flex items-center justify-center",
                            isCompleted ? "bg-success border-success text-white" :
                            isActive ? "bg-brand border-brand animate-pulse" :
                            "bg-[#1A1612] border-white/20"
                          )}>
                            {isCompleted && (
                              <svg width="6" height="6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            )}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={cn(
                              "font-sans font-bold",
                              isActive ? "text-brand" : isCompleted ? "text-success" : "text-text-secondary"
                            )}>
                              {step.label}
                            </span>
                            <span className="text-[11px] text-text-disabled">{step.description}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 2. 實體控制面板 (Interactive Control Panel) */}
                <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
                  <h4 className="font-sans font-bold text-[12.5px] text-text-primary flex items-center gap-1.5">
                    ⚙️ 交易控制與模擬狀態
                  </h4>

                  {selectedOrder.status === "payment" && (
                    <div className="space-y-3">
                      <p className="text-[12.5px] text-text-secondary leading-relaxed">
                        買家已支付此交易的訂金 <span className="text-brand font-mono font-bold">HK$ {selectedOrder.depositPaid.toLocaleString("zh-TW")}</span>，
                        此資金已安全存入 PokéTrade 官方擔保帳戶。請您確認此交易並準備安排發貨。
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: "custody" as OrderStatus } : o));
                          setSelectedOrder((prev) => prev ? { ...prev, status: "custody" } : null);
                          toast.success("已確認訂單！請填寫物流追蹤號碼準備出貨。");
                        }}
                        className="w-full h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer"
                      >
                        確認交易並進駐保管中
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === "custody" && (
                    <div className="space-y-3">
                      <p className="text-[12.5px] text-text-secondary leading-relaxed">
                        資金正處於平台安全代管保管中。請發送卡牌實物並在下方填寫物流號碼完成發貨。
                      </p>
                      <div className="flex items-center h-10 bg-[#1A1612] border border-white/10 rounded-xl overflow-hidden focus-within:border-brand/30">
                        <input
                          id={`dialog-tracking-${selectedOrder.id}`}
                          type="text"
                          placeholder="填寫順豐、郵便或宅急便物流追蹤號"
                          defaultValue={selectedOrder.trackingNo || ""}
                          className="flex-1 h-full bg-transparent px-3 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`dialog-tracking-${selectedOrder.id}`) as HTMLInputElement;
                            const val = input?.value ?? "";
                            if (!val.trim()) {
                              toast.error("請先填寫物流追蹤號碼");
                              return;
                            }
                            setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: "shipped" as OrderStatus, trackingNo: val } : o));
                            setSelectedOrder((prev) => prev ? { ...prev, status: "shipped", trackingNo: val } : null);
                            toast.success("已成功發貨！追蹤號碼已登錄。");
                          }}
                          className="px-4 h-full bg-brand/10 font-sans text-[11px] text-brand border-l border-white/5 hover:bg-brand/15 transition-colors cursor-pointer"
                        >
                          確認發貨
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedOrder.status === "shipped" && (
                    <div className="space-y-3">
                      <p className="text-[12.5px] text-text-secondary leading-relaxed">
                        包裹已由快遞承運發送。物流單號：<span className="font-mono text-brand font-bold">{selectedOrder.trackingNo}</span>。
                        您可以修改物流追蹤號，或確認包裹已送達鑑定所。
                      </p>
                      
                      <div className="flex items-center h-10 bg-[#1A1612] border border-white/10 rounded-xl overflow-hidden focus-within:border-brand/30">
                        <input
                          id={`dialog-tracking-update-${selectedOrder.id}`}
                          type="text"
                          placeholder="修改物流號碼"
                          defaultValue={selectedOrder.trackingNo || ""}
                          className="flex-1 h-full bg-transparent px-3 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const input = document.getElementById(`dialog-tracking-update-${selectedOrder.id}`) as HTMLInputElement;
                            const val = input?.value ?? "";
                            if (!val.trim()) {
                              toast.error("物流號碼不能為空");
                              return;
                            }
                            setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, trackingNo: val } : o));
                            setSelectedOrder((prev) => prev ? { ...prev, trackingNo: val } : null);
                            toast.success("物流追蹤號碼已成功更新");
                          }}
                          className="px-4 h-full bg-white/5 font-sans text-[11px] text-text-primary border-l border-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          修改單號
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: "grading" as OrderStatus } : o));
                          setSelectedOrder((prev) => prev ? { ...prev, status: "grading" } : null);
                          toast.success("卡牌已成功寄達！送入專家鑑定中心檢驗中。");
                        }}
                        className="w-full h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer"
                      >
                        確認送抵鑑定中心 🔍
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === "grading" && (
                    <div className="space-y-3">
                      <p className="text-[12.5px] text-text-secondary leading-relaxed">
                        卡牌實物正在由 PokéTrade 專業鑑定機構進行表面、四角、邊緣與對中度檢驗（PSA/BGS 標準驗證）。
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setOrders((prev) => prev.map((o) => o.id === selectedOrder.id ? { ...o, status: "released" as OrderStatus } : o));
                          setSelectedOrder((prev) => prev ? { ...prev, status: "released" } : null);
                          toast.success("鑑定審核通過！款項已成功釋放，存入您的商家錢包。");
                        }}
                        className="w-full h-10 bg-success text-white font-sans font-semibold text-[13px] rounded-xl hover:bg-success-hover active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                      >
                        模擬鑑定通過並放款給賣家 🪙
                      </button>
                    </div>
                  )}

                  {selectedOrder.status === "released" && (
                    <div className="p-3 bg-[rgba(16,185,129,0.06)] border border-success/20 rounded-xl flex items-start gap-3">
                      <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                      <div className="space-y-1">
                        <p className="font-sans font-bold text-[13px] text-success">款項釋放成功，交易全流程關閉</p>
                        <p className="text-[11.5px] text-text-secondary">
                          此訂單已完成全量閉環。款項 <span className="font-mono text-brand font-bold">HK$ {selectedOrder.amount.toLocaleString()}</span> 已存入您的 Stripe / Supabase 錢包中。
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="mt-6 pt-4 border-t border-white/5 flex flex-col sm:flex-row sm:justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-5 h-9 bg-bg-elevated hover:bg-bg-elevated-hover text-text-primary border border-white/5 font-sans font-bold text-[12px] rounded-xl cursor-pointer transition-colors"
              >
                關閉視窗
              </button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}
