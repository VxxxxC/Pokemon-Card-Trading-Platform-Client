"use client";

import { useState, useSyncExternalStore } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OrderLifecycleStepper } from "./components/OrderLifecycleStepper";
// 🟢 核心引入：全域狀態真理源
import { useTradeStore } from "@/store/useTradeStore";

type ListingStatus = "active" | "sold" | "unlisted" | "pending_trade";
type TradeType = "c2c" | "b2c";
type OrderSide = "buy" | "sell";
type FlowType = "meetup" | "delivery" | "escrow_auth" | "escrow_no_auth";

interface UserListing {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  price: number;
  status: ListingStatus;
  paymentMethods: string[];
  shippingMethods: string[];
  createdAt: string;
  views: number;
  watchers: number;
  linkedOrderId?: string;
  hasPriceOffer?: boolean;
  marketplaceOwnerId?: string;
  marketplaceProductId?: string;
}

interface Order {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string;
  seller: string;
  sellerId: string;
  amount: number;
  tradeType: TradeType;
  flowType: FlowType;
  side: OrderSide;
  status: string;
  statusLabel: string;
  createdAt: string;
  isHighValue: boolean;
}

const INITIAL_LISTINGS: UserListing[] = [
  {
    id: "LST-C2C-001",
    cardName: "Charizard ex SAR (噴火龍 ex)",
    cardNo: "sv2a-182",
    grade: "【美品 S】裸卡直送",
    cardImage: "https://picsum.photos/seed/user-zard/200/280",
    price: 2150,
    status: "active",
    paymentMethods: ["PayMe", "轉數快 (FPS)", "現金面交"],
    shippingMethods: ["順豐到付", "市區面交"],
    createdAt: "2026/05/28",
    views: 142,
    watchers: 18,
    marketplaceOwnerId: "PKT-8839-44A",
    marketplaceProductId: "LST-001",
  },
  {
    id: "LST-C2C-002",
    cardName: "Pikachu AR (經典肥皮卡丘)",
    cardNo: "sv2a-215",
    grade: "【微傷 A】卡盒割愛",
    cardImage: "https://picsum.photos/seed/user-pika/200/280",
    price: 620,
    status: "active",
    paymentMethods: ["轉數快 (FPS)", "現金面交"],
    shippingMethods: ["市區面交"],
    createdAt: "2026/05/25",
    views: 89,
    watchers: 5,
    linkedOrderId: "ORD-B2C-NOAUTH-004",
    hasPriceOffer: true,
    marketplaceOwnerId: "PKT-8839-44A",
    marketplaceProductId: "LST-003",
  },
  {
    id: "LST-C2C-003",
    cardName: "Mew ex SAR (復刻夢幻)",
    cardNo: "sv2a-205",
    grade: "【美品 S】剛拆封即入套",
    cardImage: "https://picsum.photos/seed/user-mew/200/280",
    price: 900,
    status: "sold",
    paymentMethods: ["PayMe"],
    shippingMethods: ["順豐速遞"],
    createdAt: "2026/05/10",
    views: 310,
    watchers: 24,
    linkedOrderId: "ORD-C2C-DONE-101",
  },
  {
    id: "LST-C2C-004",
    cardName: "Ting-Lu ex SR (古鼎鹿)",
    cardNo: "sv3-155",
    grade: "【傷あり B】打牌實用打法卡",
    cardImage: "https://picsum.photos/seed/user-tinglu/200/280",
    price: 180,
    status: "unlisted",
    paymentMethods: ["現金面交"],
    shippingMethods: ["市區面交"],
    createdAt: "2026/05/01",
    views: 45,
    watchers: 1,
  },
  {
    id: "LST-C2C-005",
    cardName: "Umbreon ex SAR (月亮伊布)",
    cardNo: "sv6a-109",
    grade: "Raw 完美裸卡",
    cardImage: "https://picsum.photos/seed/umbreon/200/280",
    price: 1900,
    status: "pending_trade",
    paymentMethods: ["轉數快 (FPS)"],
    shippingMethods: ["順豐速遞"],
    createdAt: "2026/05/26",
    views: 238,
    watchers: 31,
    linkedOrderId: "ORD-C2C-DELIVERY-002",
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-C2C-MEETUP-001",
    cardName: "Charizard ex SAR (噴火龍)",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    cardImage: "https://picsum.photos/seed/charizard/200/280",
    seller: "星光收藏家 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-01",
    amount: 2250,
    tradeType: "c2c",
    flowType: "meetup",
    side: "buy",
    status: "reserved",
    statusLabel: "已預留 (等待面交)",
    createdAt: "2026年 5月27日",
    isHighValue: true,
  },
  {
    id: "ORD-C2C-DELIVERY-002",
    cardName: "Umbreon ex SAR (月亮伊布)",
    cardNo: "sv6a-109",
    grade: "Raw 裸卡",
    cardImage: "https://picsum.photos/seed/umbreon/200/280",
    seller: "港島執雞王 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-02",
    amount: 1900,
    tradeType: "c2c",
    flowType: "delivery",
    side: "sell",
    status: "shipped",
    statusLabel: "賣家已發貨 (物流中)",
    createdAt: "2026年 5月26日",
    isHighValue: true,
  },
  {
    id: "ORD-B2C-NOAUTH-004",
    cardName: "Pikachu AR (皮卡丘)",
    cardNo: "sv2a-215",
    grade: "CGC 9",
    cardImage: "https://picsum.photos/seed/pikachu/200/280",
    seller: "東京TCG市場 (認證商戶)",
    sellerId: "ROOM-MOCK-B2C-02",
    amount: 425,
    tradeType: "b2c",
    flowType: "escrow_no_auth",
    side: "buy",
    status: "reserved",
    statusLabel: "買家 Price Offer 待確認",
    createdAt: "2026年 5月24日",
    isHighValue: false,
  },
  {
    id: "ORD-C2C-DONE-101",
    cardName: "Lillie (莉莉艾) SR 119/114",
    cardNo: "sm4+119",
    grade: "BGS 9.5",
    cardImage: "https://picsum.photos/seed/lillie/200/280",
    seller: "尖沙咀卡神 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-99",
    amount: 18500,
    tradeType: "c2c",
    flowType: "meetup",
    side: "buy",
    status: "completed_meetup",
    statusLabel: "交易完結 (當面已交收)",
    createdAt: "2026年 5月10日",
    isHighValue: true,
  },
];

const FLOW_STEPS_DEFINITION: Record<FlowType, { id: string; label: string }[]> =
  {
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

// 🟢 核心優化 1：完美更名為 [歷史交易]
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

// 🟢 完美合規：ProductRowItem 完整保持宣告在主 Render 體外，徹底封死 React 19 級聯重繪硬崩潰
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
  onToggleStatus: (id: string, currentStatus: ListingStatus) => void;
  onCancelListing: (item: UserListing) => void;
}) {
  // 🟢 智能交互控盤：只有交易中與已售出才具備點擊穿透權利
  const isClickable = item.status === "pending_trade" || item.status === "sold";
  const href = isClickable ? getProductNavigationHref(item, order) : "";
  const shouldRenderStepper = Boolean(
    order && (item.status === "pending_trade" || item.status === "sold"),
  );

  // 🟢 獲取當前卡片的買賣方向（預設為賣出）
  const tradeSide = order?.side || "sell";

  // Zustand 按需選取器
  const openGlobalChat = useTradeStore((state) => state.openGlobalChat);

  const handleContactCounterparty = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation(); // 斬斷冒泡
    if (!order) return;
    openGlobalChat(order.sellerId, order.seller);
  };

  const handlePriceOfferChat = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation(); // 阻止冒泡
    if (!order) return;

    openGlobalChat(order.sellerId, order.seller, {
      cardName: item.cardName,
      cardId: item.marketplaceProductId || item.id,
      offerPrice: order.amount,
      buyerName: order.seller,
      sellerId: order.sellerId,
    });
  };

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onNavigate(href) : undefined}
      onKeyDown={
        isClickable
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") onNavigate(href);
            }
          : undefined
      }
      // 🟢 智能外殼分流：非 Clickable 狀態時移除高亮 Hover 邊框，強行降維至靜態展示
      className={`bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl p-4 flex flex-col transition-colors group focus:outline-none ${
        isClickable
          ? "hover:border-[rgba(237,232,224,0.15)] cursor-pointer focus:ring-2 focus:ring-brand/35"
          : "cursor-default"
      }`}
      aria-label={
        isClickable
          ? `查看 ${item.cardName} 的交易履約詳情`
          : `${item.cardName} 的資產管理項目卡片`
      }
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
            {/* 🟢 核心優化 2：大大個高亮買賣身份分辨標示 */}
            {isClickable && (
              <span
                className={`font-sans text-[11px] font-black tracking-wide uppercase px-2 py-0.5 rounded border ${
                  tradeSide === "buy"
                    ? "text-[#38bdf8] bg-[#38bdf8]/10 border-[#38bdf8]/30 shadow-[0_0_12px_rgba(56,189,248,0.15)]"
                    : "text-[#10b981] bg-[#10b981]/10 border-[#10b981]/30 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                }`}
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
            {item.hasPriceOffer && (
              <button
                type="button"
                onClick={handlePriceOfferChat}
                className="font-mono text-[11px] sm:text-[11.5px] font-black tracking-wide uppercase text-[#00ff9d] bg-[#00ff9d]/10 border border-[#00ff9d]/30 hover:bg-[#00ff9d]/20 hover:border-[#00ff9d]/50 px-2.5 py-0.5 rounded shadow-[0_0_14px_rgba(0,255,157,0.15)] transition-colors cursor-pointer"
              >
                📩 PRICE OFFER →
              </button>
            )}
          </div>
          {/* 🟢 文字高亮流動對齊：只有可點擊狀態才賦予 group-hover 金色轉向提示 */}
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
              onClick={(event) => {
                event.stopPropagation();
                onToggleStatus(item.id, item.status);
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
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleStatus(item.id, item.status);
                }}
                className="h-9 px-4 bg-[#10b981] text-white font-sans font-bold text-[12px] rounded-xl hover:bg-[#0fa573] active:scale-95 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                ⚡ 重新上架商品
              </button>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onCancelListing(item);
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
  const [listings, setListings] = useState<UserListing[]>(INITIAL_LISTINGS);
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
  const filteredListings = listings.filter(
    (listing) => listing.status === activeTab,
  );

  const handleToggleStatus = (id: string, currentStatus: ListingStatus) => {
    if (currentStatus === "sold" || currentStatus === "pending_trade") return;

    const nextStatus = currentStatus === "active" ? "unlisted" : "active";
    const targetListing = listings.find((listing) => listing.id === id);

    setListings((prev) =>
      prev.map((listing) =>
        listing.id === id ? { ...listing, status: nextStatus } : listing,
      ),
    );

    if (nextStatus === "unlisted") {
      toast.warning("⏸️ 商品已暫時下架", {
        description: `【${targetListing?.cardName ?? "該卡牌商品"}】已暫時從現貨盤移出，可稍後重新上架。`,
      });
      return;
    }

    toast.success("🚀 商品已重新上架", {
      description: `【${targetListing?.cardName ?? "該卡牌商品"}】已重新回到全港現貨大盤。`,
    });
  };

  const handleCancelListing = (item: UserListing) => {
    setListings((prev) => prev.filter((listing) => listing.id !== item.id));
    toast.warning("🗑️ 商品已完全下架", {
      description: `【${item.cardName}】已從交易管理資產大盤移除。`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex border-b border-[rgba(237,232,224,0.08)] overflow-x-auto scrollbar-none">
        {(["active", "pending_trade", "sold", "unlisted"] as const).map(
          (tab) => {
            const count = listings.filter(
              (listing) => listing.status === tab,
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
