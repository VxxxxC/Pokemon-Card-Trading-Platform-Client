"use client";

import React, { useSyncExternalStore } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useMerchantStore } from "@/app/store/useMerchantStore";
import { useTradeStore } from "@/app/store/useTradeStore";
import { OrderStatus, STATUS_STEP_INDEX } from "@/app/lib/types/trading";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import { toast } from "sonner";

export default function MerchantOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  // Hydration Guard using useSyncExternalStore
  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // Retrieve orders and actions from our centralized Merchant Store
  const {
    orders,
    confirmOrderAndSetCustody,
    updateOrderTracking,
    sendOrderToGrading,
    releaseOrderEscrow
  } = useMerchantStore();

  const { openGlobalChat } = useTradeStore();

  const order = orders.find((o) => o.id === orderId);

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#17130f] text-text-primary p-6 flex flex-col items-center justify-center gap-4">
        <p className="font-sans text-[14px] text-text-disabled">找不到指定的交易訂單記錄。</p>
        <Link
          href="/profile/merchant/trading"
          className="font-sans text-[13px] font-bold text-brand hover:underline"
        >
          返回交易管理
        </Link>
      </div>
    );
  }

  const currentStepIdx = STATUS_STEP_INDEX[order.status as Exclude<OrderStatus, "cancelled">];

  return (
    <div className="min-h-screen bg-[#17130f] text-[#eae1da] font-sans p-4 sm:p-6 space-y-6 animate-fadeIn">
      {/* Upper Navigation Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <Link
          href="/profile/merchant/trading"
          className="font-sans text-[13.5px] font-bold text-[#d4c4b7] hover:text-brand flex items-center gap-1 transition-colors"
        >
          ← 返回交易管理資產大盤
        </Link>
        <button
          onClick={() => {
            openGlobalChat(order.buyerId, order.buyerName, order.sellerId, order.sellerName, "SELLER");
          }}
          className="h-10 px-5 bg-[#26211C] border border-brand/20 hover:border-brand text-brand font-sans text-[13px] font-bold rounded-xl active:scale-[0.96] transition-all shadow-md cursor-pointer flex items-center gap-2"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          呼叫買家對話 💬
        </button>
      </div>

      {/* Symmetrical Twin Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sized Card Carousel mockup + Twin Metadata Deck */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative w-full aspect-[3/4] max-h-[35dvh] lg:max-h-[55vh] rounded-2xl overflow-hidden bg-[#120f0c] border border-white/5 shadow-inner group">
            <Image
              src={"https://picsum.photos/seed/" + order.cardNo + "/400/500"}
              alt={order.cardName}
              fill
              sizes="(max-width: 768px) 100vw, 400px"
              className="object-cover scale-100 transition-transform duration-500 hover:scale-105"
              unoptimized
            />
            {/* PSA Badge Overlay */}
            <div className="absolute top-3 left-3 px-3 py-1 rounded-md bg-[#17130f]/80 backdrop-blur-xs border border-brand/20 text-[11px] font-sans font-bold text-brand">
              {order.grade}
            </div>
          </div>

          {/* Twin Metadata Deck (品相與邊角詳情) */}
          <div className="p-4 bg-[#17130f] rounded-xl border border-white/5 space-y-3">
            <h4 className="font-sans font-bold text-[12.5px] text-[#eae1da] border-b border-white/5 pb-2">
              📋 擔保合約屬性與品相描述
            </h4>
            <div className="text-[12px] space-y-2 text-text-secondary font-mono">
              <div className="flex justify-between">
                <span>合約模式</span>
                <span className="text-brand font-bold">{order.orderType} 擔保託管</span>
              </div>
              <div className="flex justify-between">
                <span>買方帳號</span>
                <span className="text-text-primary">{order.buyerName}</span>
              </div>
              <div className="flex justify-between">
                <span>鑑定標準</span>
                <span className="text-text-primary">{order.grade}</span>
              </div>
              <div className="flex justify-between border-t border-white/5 pt-2">
                <span>交易金額</span>
                <span className="text-[#10b981] font-bold">HK$ {order.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>託管押金</span>
                <span className="text-brand font-bold">HK$ {order.depositPaid.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Escrow Steps and Interactive Controls */}
        <div className="lg:col-span-7 space-y-5">
          <div>
            <h2 className="font-sans font-black text-[22px] text-text-primary leading-tight">
              {order.cardName}
            </h2>
            <p className="font-mono text-[12.5px] text-text-disabled mt-1">
              卡片編號: {order.cardNo} · 訂單ID: {order.id}
            </p>
          </div>

          {/* 1. Escrow Stepper */}
          <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
            <h4 className="font-sans font-bold text-[12.5px] text-brand uppercase tracking-wider">
              🛡️ 資金與鑑定履約階段 (Escrow Progress)
            </h4>
            
            <div className="relative pl-6 space-y-5 before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
              {ESCROW_STEPS.map((step, idx) => {
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

          {/* 2. Interactive Controls */}
          <div className="p-4 bg-[#17130f] border border-white/5 rounded-xl space-y-4">
            <h4 className="font-sans font-bold text-[12.5px] text-text-primary flex items-center gap-1.5">
              ⚙️ 交易控制與模擬狀態 (Escrow Control Deck)
            </h4>

            {order.status === "payment" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-text-secondary leading-relaxed">
                  買家已支付此交易的保證訂金 <span className="text-brand font-mono font-bold">HK$ {order.depositPaid.toLocaleString()}</span>，
                  此資金已安全存入 PokéTrade 官方擔保帳戶。請您確認此交易並準備安排發貨。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    confirmOrderAndSetCustody(order.id);
                    toast.success("已確認訂單！請在下方填寫物流追蹤號碼準備出貨。");
                  }}
                  className="w-full h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer"
                >
                  確認訂單並移交保管 ➔
                </button>
              </div>
            )}

            {order.status === "custody" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-text-secondary leading-relaxed">
                  資金正處於平台安全託管中。請將卡牌實物寄出，並在下方登錄物流號碼完成出貨手續。
                </p>
                <div className="flex items-center h-10 bg-[#1A1612] border border-white/10 rounded-xl overflow-hidden focus-within:border-brand/30">
                  <input
                    id={"page-tracking-" + order.id}
                    type="text"
                    placeholder="填寫順豐、郵便或宅急便物流追蹤號"
                    defaultValue={order.trackingNo || ""}
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("page-tracking-" + order.id) as HTMLInputElement;
                      const val = input?.value ?? "";
                      if (!val.trim()) {
                        toast.error("請先填寫物流追蹤號碼");
                        return;
                      }
                      updateOrderTracking(order.id, val);
                      toast.success("已成功發貨！追蹤號碼已登錄。");
                    }}
                    className="px-4 h-full bg-brand/10 font-sans text-[11px] text-brand border-l border-white/5 hover:bg-brand/15 transition-colors cursor-pointer"
                  >
                    確認發貨
                  </button>
                </div>
              </div>
            )}

            {order.status === "shipped" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-text-secondary leading-relaxed">
                  包裹已由快遞承運發送。物流單號：<span className="font-mono text-brand font-bold">{order.trackingNo}</span>。
                  您可以修改物流追蹤號，或確認包裹已送達鑑定所。
                </p>
                
                <div className="flex items-center h-10 bg-[#1A1612] border border-white/10 rounded-xl overflow-hidden focus-within:border-brand/30">
                  <input
                    id={"page-tracking-update-" + order.id}
                    type="text"
                    placeholder="修改物流號碼"
                    defaultValue={order.trackingNo || ""}
                    className="flex-1 h-full bg-transparent px-3 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const input = document.getElementById("page-tracking-update-" + order.id) as HTMLInputElement;
                      const val = input?.value ?? "";
                      if (!val.trim()) {
                        toast.error("物流號碼不能為空");
                        return;
                      }
                      updateOrderTracking(order.id, val);
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
                    sendOrderToGrading(order.id);
                    toast.success("卡牌已成功寄達！送入專家鑑定中心檢驗中。");
                  }}
                  className="w-full h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all cursor-pointer"
                >
                  確認抵達專家鑑定所 🔍
                </button>
              </div>
            )}

            {order.status === "grading" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-text-secondary leading-relaxed">
                  卡牌實物正在由 PokéTrade 專業鑑定機構進行表面、四角、邊緣與對中度檢驗（PSA/BGS 標準驗證）。
                </p>
                <button
                  type="button"
                  onClick={() => {
                    releaseOrderEscrow(order.id);
                    toast.success("鑑定審核通過！款項已成功釋放，存入您的商家錢包。");
                  }}
                  className="w-full h-10 bg-success text-white font-sans font-semibold text-[13px] rounded-xl hover:bg-success-hover active:scale-[0.98] transition-all cursor-pointer shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                >
                  模擬鑑定通過並放款給賣家 🪙
                </button>
              </div>
            )}

            {order.status === "released" && (
              <div className="p-3.5 bg-[rgba(16,185,129,0.06)] border border-success/20 rounded-xl flex items-start gap-3 animate-fadeIn">
                <svg className="mt-0.5 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
                <div className="space-y-1">
                  <p className="font-sans font-bold text-[13.5px] text-success">款項釋放成功，交易全流程關閉</p>
                  <p className="text-[11.5px] text-text-secondary">
                    此合約已完成全量閉環。款項 <span className="font-mono text-brand font-bold">HK$ {order.amount.toLocaleString()}</span> 已存入您的 Stripe / Supabase 託管錢包中。
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
