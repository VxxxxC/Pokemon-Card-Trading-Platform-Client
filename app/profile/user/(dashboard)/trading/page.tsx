"use client";

import { useState, useSyncExternalStore, type MouseEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderLifecycleStepper } from "@/app/components/transactions/OrderLifecycleStepper";
import { type ListingStatus } from "@/app/lib/mock-data/members";
import { useTradeStore } from "@/app/store/useTradeStore";
import { INITIAL_ORDERS } from "@/app/lib/mock-data/transactions";
// 🟢 核心對接：引入中央模擬數據庫與強型態
import { useMockDbStore, type UserListing } from "@/app/store/useMockDbStore";

interface Order {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  seller: string;
  sellerId: string;
  amount: number;
  tradeType: "c2c" | "b2c";
  flowType: "meetup" | "delivery" | "escrow_auth" | "escrow_no_auth";
  side: "buy" | "sell";
  status: string;
  statusLabel: string;
  createdAt: string;
  isHighValue: boolean;
}

const FLOW_STEPS_DEFINITION: Record<string, { id: string; label: string }[]> = {
  meetup: [
    { id: "reserved", label: "已預留" },
    { id: "completed_meetup", label: "已面交結單" },
  ],
  delivery: [
    { id: "reserved", label: "已預留" },
    { id: "paid", label: "已付款" },
    { id: "shipped", label: "已發貨" },
    { id: "received", label: "已簽收" },
  ],
  escrow_auth: [
    { id: "paid", label: "已付款" },
    { id: "custody", label: "保管中" },
    { id: "grading", label: "鑑定中" },
    { id: "released", label: "已釋放" },
    { id: "shipped", label: "已發貨" },
    { id: "received", label: "已簽收" },
  ],
  escrow_no_auth: [
    { id: "reserved", label: "Price Offer" },
    { id: "paid", label: "已付款" },
    { id: "shipped", label: "已發貨" },
    { id: "received", label: "已簽收" },
  ],
};

const TAB_LABELS: Record<ListingStatus, string> = {
  active: "出售中現貨",
  pending_trade: "交易中 / 待交收",
  sold: "歷史交易",
  unlisted: "已暫時下架",
};

function isFinishedOrder(order: Order) {
  return order.status === "completed_meetup" || order.status === "received";
}

function getProductNavigationHref(item: UserListing, order?: Order) {
  if (item.status === "pending_trade" || item.status === "sold") {
    return `/profile/user/trading/${order?.id ?? item.linkedOrderId ?? item.id}`;
  }
  return "";
}

function DynamicProductStepper({ order }: { order: Order }) {
  return (
    <OrderLifecycleStepper
      steps={FLOW_STEPS_DEFINITION[order.flowType] || []}
      status={order.status}
      isFinished={isFinishedOrder(order)}
      statusLabel={order.statusLabel}
      variant="compact"
      className="mt-4 pb-1"
    />
  );
}

function ProductRowItem({
  item,
  order,
  onNavigate,
  onToggleStatus,
  onCancelListing,
}: {
  item: UserListing;
  order?: Order;
  onNavigate: (href: string) => void;
  onToggleStatus: (id: string) => void;
  onCancelListing: (id: string, name: string) => void;
}) {
  const isClickable = item.status === "pending_trade" || item.status === "sold";
  const href = isClickable ? getProductNavigationHref(item, order) : "";
  const shouldRenderStepper = Boolean(
    order && (item.status === "pending_trade" || item.status === "sold"),
  );

  const tradeSide = order?.side || "sell";
  const openGlobalChat = useTradeStore((state) => state.openGlobalChat);

  const handleContactCounterparty = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (!order) return;
    openGlobalChat(order.sellerId, order.seller);
  };

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onNavigate(href) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onNavigate(href);
            }
          : undefined
      }
      className={`bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 flex flex-col transition-colors group focus:outline-none ${isClickable ? "hover:border-[rgba(237,232,224,0.15)] cursor-pointer focus:ring-2 focus:ring-brand/35" : "cursor-default"}`}
    >
      <div className="flex gap-4 items-start w-full">
        <div className="relative w-14 h-20 sm:w-16 sm:h-22 rounded-xl overflow-hidden bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 shadow-sm">
          <Image
            src={item.cardImage}
            alt={item.cardName}
            fill
            sizes="80px"
            className="object-cover"
            unoptimized
          />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {isClickable && (
              <span
                className={`font-sans text-[11px] font-black tracking-wide uppercase px-2 py-0.5 rounded border ${tradeSide === "buy" ? "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]" : "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"}`}
              >
                {tradeSide === "buy" ? "📥 買入" : "📤 賣出"}
              </span>
            )}
            <span className="font-mono text-[9px] text-[#50453b]">
              #{item.id}
            </span>
            <span className="font-mono text-[10px] text-brand font-medium">
              {item.grade}
            </span>
          </div>
          <h3
            className={`font-sans font-bold text-[14.5px] text-[#eae1da] transition-colors truncate ${isClickable ? "group-hover:text-brand" : ""}`}
          >
            {item.cardName}
          </h3>
          <p className="font-mono text-[11px] text-text-secondary">
            官方卡號:{" "}
            <span className="text-[#eae1da]">{item.cardNo.toUpperCase()}</span>{" "}
            · 上架日期: {item.createdAt}
          </p>
          <div className="flex gap-1.5 flex-wrap pt-1">
            {item.paymentMethods.map((pm) => (
              <span
                key={pm}
                className="font-sans text-[9px] text-text-secondary bg-[#17130f] px-2 py-0.5 rounded-[4px] border border-[rgba(237,232,224,0.04)]"
              >
                💸 {pm}
              </span>
            ))}
          </div>
        </div>

        <div className="text-right shrink-0 ml-2">
          <p className="font-mono font-bold text-[16px] text-brand">
            HK$ {item.price.toLocaleString()}
          </p>
          <p className="font-mono text-[9px] text-[#50453b] mt-0.5">
            👁 {item.views} 點擊 · ★ {item.watchers} 心水
          </p>
        </div>
      </div>

      {shouldRenderStepper && order && <DynamicProductStepper order={order} />}

      {item.status !== "sold" && (
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-[rgba(237,232,224,0.06)] w-full">
          {item.status === "active" && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleStatus(item.id);
              }}
              className="h-9 px-4 bg-transparent border border-amber-500/40 text-amber-400 font-sans font-bold text-[12px] rounded-xl hover:bg-amber-500/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 ml-auto cursor-pointer"
            >
              ⚙ 暫時下架
            </button>
          )}
          {item.status === "pending_trade" && (
            <>
              <button
                type="button"
                onClick={handleContactCounterparty}
                className="h-9 px-4 bg-[#17130f] border border-brand/30 text-brand font-sans font-bold text-[12px] rounded-xl hover:bg-brand/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                💬 聯絡對方
              </button>
              <span className="font-mono text-[11px] text-text-disabled ml-auto bg-[#17130f] px-2.5 py-1 rounded border border-white/5 select-none">
                🔒 資產已鎖定
              </span>
            </>
          )}
          {item.status === "unlisted" && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleStatus(item.id);
                }}
                className="h-9 px-4 bg-[#10b981] text-white font-sans font-bold text-[12px] rounded-xl hover:bg-[#0fa573] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                ⚡ 重新上架商品
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onCancelListing(item.id, item.cardName);
                }}
                className="h-9 px-4 bg-transparent border border-[#ef4444]/50 text-[#ef4444] font-sans font-bold text-[12px] rounded-xl hover:bg-[#ef4444]/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 ml-auto cursor-pointer"
              >
                🗑️ 取消商品上架
              </button>
            </>
          )}
        </div>
      )}

      {item.status === "sold" && order && (
        <div className="flex flex-wrap items-center gap-2 pt-3 mt-3 border-t border-[rgba(237,232,224,0.06)] w-full">
          <button
            type="button"
            onClick={handleContactCounterparty}
            className="h-9 px-4 bg-[#17130f] border border-brand/30 text-brand font-sans font-bold text-[12px] rounded-xl hover:bg-brand/10 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            💬 聯絡對方
          </button>
          <span className="font-mono text-[11px] text-[#10b981] ml-auto bg-[#10b981]/10 px-2.5 py-1 rounded border border-[#10b981]/20 select-none">
            ✓ 平台存證已完成
          </span>
        </div>
      )}
    </div>
  );
}

export default function UserTradingPage() {
  const router = useRouter();

  // 🟢 核心改動：直接對接全域持久化 Mock 資料庫，完美接收來自卡牌庫嘅上架數據
  const tradingListings = useMockDbStore((state) => state.tradingListings);
  const toggleListingStatus = useMockDbStore(
    (state) => state.toggleListingStatus,
  );
  const cancelListingAndRemove = useMockDbStore(
    (state) => state.cancelListingAndRemove,
  );

  const [activeTab, setActiveTab] = useState<ListingStatus>("active");

  const isMounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  if (!isMounted) {
    return (
      <div className="min-h-screen bg-[#17130f] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    );
  }

  const orderById = new Map(INITIAL_ORDERS.map((order) => [order.id, order]));
  const filteredListings = tradingListings.filter(
    (listing) => listing.status === activeTab,
  );

  const handleToggleStatus = (id: string) => {
    const targetListing = tradingListings.find((l) => l.id === id);
    if (!targetListing) return;

    toggleListingStatus(id);

    if (targetListing.status === "active") {
      toast.warning("⏸️ 商品已暫時下架", {
        description: `【${targetListing.cardName}】已暫時從現貨盤移出，可稍後重新上架。`,
      });
    } else {
      toast.success("🚀 商品已重新上架", {
        description: `【${targetListing.cardName}】已重新回到全港現貨大盤。`,
      });
    }
  };

  const handleCancelListing = (id: string, name: string) => {
    cancelListingAndRemove(id);
    toast.warning("🗑️ 商品已完全下架", {
      description: `【${name}】已從交易管理資產大盤移除。`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-[rgba(237,232,224,0.08)] overflow-x-auto scrollbar-none">
        {(["active", "pending_trade", "sold", "unlisted"] as const).map(
          (tab) => {
            const count = tradingListings.filter(
              (l) => l.status === tab,
            ).length;
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative shrink-0 cursor-pointer ${isActive ? "text-brand" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
              >
                {TAB_LABELS[tab]} ({count})
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-brand" />
                )}
              </button>
            );
          },
        )}
      </div>

      <div className="space-y-4">
        {filteredListings.length === 0 ? (
          <div className="py-16 text-center bg-[#26211C]/40 border border-[rgba(237,232,224,0.04)] rounded-2xl">
            <p className="font-sans text-[13.5px] text-text-disabled select-none">
              該分類下目前沒有卡牌資產紀錄
            </p>
          </div>
        ) : (
          filteredListings.map((item) => (
            <ProductRowItem
              key={item.id}
              item={item}
              order={
                item.linkedOrderId
                  ? orderById.get(item.linkedOrderId)
                  : undefined
              }
              onNavigate={(href) => router.push(href)}
              onToggleStatus={handleToggleStatus}
              onCancelListing={handleCancelListing}
            />
          ))
        )}
      </div>
    </div>
  );
}
