"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { OrderLifecycleStepper } from "./_components/OrderLifecycleStepper";

export type TradeType = "c2c" | "b2c";
export type OrderSide = "buy" | "sell";
export type FlowType = "meetup" | "delivery" | "escrow_auth" | "escrow_no_auth";

export interface Order {
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

const INITIAL_ORDERS: Order[] = [
  // ── ⏳ 進行中交易數據 (Active Orders) ──
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
    id: "ORD-B2C-AUTH-003",
    cardName: "Marnie (瑪俐) SR 198/190",
    cardNo: "s5a-070",
    grade: "PSA 10",
    cardImage: "https://picsum.photos/seed/marnie/200/280",
    seller: "渡邊道館 (認證商戶)",
    sellerId: "PKT-8839-44A",
    amount: 4200,
    tradeType: "b2c",
    flowType: "escrow_auth",
    side: "buy",
    status: "grading",
    statusLabel: "官方鑑定中",
    createdAt: "2026年 5月25日",
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
    status: "paid",
    statusLabel: "已付款 (等待商戶出貨)",
    createdAt: "2026年 5月24日",
    isHighValue: false,
  },

  // ── 🏅 歷史已完成交易數據 (Completed Orders) ──
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
  {
    id: "ORD-C2C-DONE-102",
    cardName: "Gengar VMAX (耿鬼) SA 020/019",
    cardNo: "sGG-020",
    grade: "PSA 10",
    cardImage: "https://picsum.photos/seed/gengar/200/280",
    seller: "九龍灣阿木 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-98",
    amount: 3400,
    tradeType: "c2c",
    flowType: "delivery",
    side: "sell",
    status: "received",
    statusLabel: "交易完結 (自提點已簽收)",
    createdAt: "2026年 5月08日",
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
      { id: "paid", label: "已付款" },
      { id: "shipped", label: "已發貨" },
      { id: "received", label: "已簽收" },
    ],
  };

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<"active" | "completed">("active");

  // 訂單修改視窗專用 Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editMethod, setEditMethod] = useState<FlowType>("meetup");
  const [editLocation, setEditLocation] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const activeOrders = orders.filter(
    (o) => o.status !== "completed_meetup" && o.status !== "received",
  );
  const completedOrders = orders.filter(
    (o) => o.status === "completed_meetup" || o.status === "received",
  );

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditPrice(order.amount.toString());
    setEditMethod(order.flowType);
    setEditLocation("");
    setEditPhone("");
    setEditAddress("");
    setShowEditModal(true);
  };

  const handleSaveOrderEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder || !editPrice) return;

    setOrders((prev) =>
      prev.map((o) =>
        o.id === editingOrder.id
          ? {
              ...o,
              amount: Number(editPrice),
              flowType: editMethod,
            }
          : o,
      ),
    );

    setShowEditModal(false);
    alert(`💾 訂單流水 #${editingOrder.id} 交易詳情已成功變更修復！`);
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#17130f] min-h-screen text-[#eae1da]">
      {/* 雙 Tab 導航欄 */}
      <div className="flex border-b border-[rgba(237,232,224,0.08)]">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${activeTab === "active" ? "text-[#d4a574]" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
        >
          進行中訂單 ({activeOrders.length})
          {activeTab === "active" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a574]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${activeTab === "completed" ? "text-[#d4a574]" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
        >
          歷史交易已完成 ({completedOrders.length})
          {activeTab === "completed" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a574]" />
          )}
        </button>
      </div>

      {/* 列表 */}
      <div className="space-y-4">
        {activeTab === "active" ? (
          activeOrders.length === 0 ? (
            <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
              目前沒有進行中的交易單
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onEditClick={() => handleOpenEditModal(order)}
              />
            ))
          )
        ) : completedOrders.length === 0 ? (
          <div className="py-12 text-center text-text-disabled font-sans text-[13px]">
            目前沒有已完成的交易紀錄
          </div>
        ) : (
          completedOrders.map((order) => (
            <OrderCard key={order.id} order={order} compact />
          ))
        )}
      </div>

      {/* 修改訂單 Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 z-[300] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-[640px] bg-[#26211C] border border-[rgba(237,232,224,0.12)] rounded-2xl p-6 shadow-[0_24px_48px_rgba(0,0,0,0.8)] space-y-5 overflow-y-auto max-h-[90vh] scrollbar-none">
            <div className="border-b border-[rgba(237,232,224,0.06)] pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-sans font-black text-[16px] md:text-[18px] text-[#eae1da]">
                  ⚙️ 修改實時訂單交易細節
                </h3>
                <p className="font-mono text-[9px] text-brand uppercase tracking-widest mt-0.5">
                  ORDER LIFECYCLE RECONFIG TERMINAL
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="w-9 h-9 rounded-full bg-[#17130f] hover:bg-[#39342f] text-text-disabled hover:text-brand flex items-center justify-center font-mono text-[18px] font-bold active:scale-90 transition-all shadow-inner border border-white/5"
              >
                ✕
              </button>
            </div>

            <div className="flex gap-3 items-center p-3 bg-[#17130f] rounded-xl border border-white/5">
              <div className="relative w-10 h-14 rounded-lg overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={editingOrder.cardImage}
                  alt={editingOrder.cardName}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-mono text-[9px] text-[#50453b]">
                  流水號: #{editingOrder.id}
                </span>
                <h4 className="font-sans font-bold text-[13px] text-[#eae1da] truncate mt-0.5">
                  {editingOrder.cardName}
                </h4>
              </div>
            </div>

            <form onSubmit={handleSaveOrderEdit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="edit-price"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    修改成交價格 (HK$)
                  </label>
                  <div className="flex items-center h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden focus-within:border-brand/40 transition-colors">
                    <span className="px-3 font-mono text-[13px] font-bold text-brand bg-[#26211C] border-r border-white/5">
                      HK$
                    </span>
                    <input
                      id="edit-price"
                      type="number"
                      required
                      value={editPrice}
                      onChange={(e) => setEditPrice(e.target.value)}
                      className="flex-1 h-full bg-transparent px-4 font-mono text-[14px] text-brand focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="edit-flow"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    調整交收模式流向
                  </label>
                  <select
                    id="edit-flow"
                    value={editMethod}
                    onChange={(e) => setEditMethod(e.target.value as FlowType)}
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] focus:outline-none"
                  >
                    <option value="meetup">🤝 [見面交易] 本地當面交收</option>
                    <option value="delivery">📦 [送貨物流] 私人快遞直送</option>
                  </select>
                </div>
              </div>

              {editMethod === "meetup" ? (
                <div className="animate-fadeIn">
                  <label
                    htmlFor="edit-loc"
                    className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                  >
                    變更約定面交地點/時間
                  </label>
                  <input
                    id="edit-loc"
                    type="text"
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="例：改為星期六 15:00 旺角站 B 出口"
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-[#eae1da] focus:outline-none"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                  <div>
                    <label
                      htmlFor="edit-tel"
                      className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                    >
                      更新手提電話
                    </label>
                    {/* 🟢 核心修正：將錯置的 setPhone 徹底洗淨，精準套用 setEditPhone 狀態變更器，降伏 TS2552 報警！ */}
                    <input
                      id="edit-tel"
                      type="tel"
                      maxLength={8}
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="91234567"
                      className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-[#eae1da] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="edit-addr"
                      className="font-mono text-[11px] text-[#d4c4b7] block mb-1.5 uppercase tracking-wide"
                    >
                      更新自提點詳細地址
                    </label>
                    <input
                      id="edit-addr"
                      type="text"
                      value={editAddress}
                      onChange={(e) => setEditAddress(e.target.value)}
                      placeholder="例：智能櫃代碼與商場名"
                      className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 text-[13px] text-[#eae1da] focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 h-11 font-sans text-[13px] font-medium text-text-secondary border border-white/10 rounded-xl hover:bg-[#39342f] active:scale-95 transition-transform"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="flex-1 h-11 bg-brand text-[#1A1612] font-sans font-bold text-[13px] rounded-xl hover:bg-brand-hover active:scale-95 transition-transform shadow-md"
                >
                  💾 儲存修改
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DynamicCardStepper({ order }: { order: Order }) {
  const isFinished =
    order.status === "completed_meetup" || order.status === "received";

  return (
    <OrderLifecycleStepper
      steps={FLOW_STEPS_DEFINITION[order.flowType] || []}
      status={order.status}
      isFinished={isFinished}
      variant="compact"
      className="mt-4 pb-1"
    />
  );
}

function OrderCard({
  order,
  onEditClick,
}: {
  order: Order;
  compact?: boolean;
  onEditClick?: () => void;
}) {
  const handleContactSeller = () => {
    window.dispatchEvent(
      new CustomEvent("open-global-chat", {
        detail: { roomId: order.sellerId, partnerName: order.seller },
      }),
    );
  };

  const isFinished =
    order.status === "completed_meetup" || order.status === "received";
  const isBuy = order.side === "buy";

  return (
    <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 hover:border-[#d4a574]/30 transition-all group">
      <Link
        href={`/profile/user/orders/${order.id}`}
        className="block space-y-4 cursor-pointer"
      >
        <div className="flex gap-4 items-start">
          <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 shadow-md">
            <Image
              src={order.cardImage}
              alt={order.cardName}
              fill
              sizes="64px"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              unoptimized
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`flex items-center gap-0.5 font-sans text-[10px] px-2 py-0.5 rounded font-extrabold uppercase tracking-wide border ${isBuy ? "bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30" : "bg-[#ef4444]/20 text-[#ef4444] border-[#ef4444]/30"}`}
                  >
                    {isBuy ? "📥 買" : "📤 賣"}
                  </span>
                  <span
                    className={`font-mono text-[8.5px] px-2 py-0.5 rounded border uppercase font-semibold tracking-wide ${order.tradeType === "b2c" ? "bg-brand/10 text-brand border-brand/20" : "bg-[#50453b]/30 text-[#d4c4b7] border-[rgba(237,232,224,0.1)]"}`}
                  >
                    {order.tradeType === "b2c" ? "認證商戶" : "C2C散戶"}
                  </span>
                  <span className="font-mono text-[9px] text-[#50453b]">
                    #{order.id}
                  </span>
                </div>
                <h3 className="font-sans text-[14.5px] font-bold text-[#eae1da] group-hover:text-[#d4a574] transition-colors mt-2 truncate">
                  {order.cardName}
                </h3>
                <p className="font-mono text-[11px] text-[#d4c4b7] mt-0.5 truncate">
                  編號: {order.cardNo} · 等級: {order.grade} ·{" "}
                  {isBuy ? "賣方:" : "買方:"} {order.seller}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-mono font-bold text-[15.5px] text-[#eae1da]">
                  HK$ {order.amount.toLocaleString()}
                </p>
                <span
                  className={`inline-block font-sans text-[9.5px] px-2 py-0.5 rounded mt-1.5 font-medium ${isFinished ? "text-[#10b981] bg-[#10b981]/5" : "text-brand bg-brand/5"}`}
                >
                  {order.statusLabel}
                </span>
              </div>
            </div>
          </div>
        </div>

        {(order.isHighValue || isFinished) && (
          <DynamicCardStepper order={order} />
        )}
      </Link>

      {!isFinished && (
        <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[rgba(237,232,224,0.06)] gap-4">
          <button
            type="button"
            onClick={onEditClick}
            className="flex-1 h-9 px-4 bg-[#26211C] border border-white/10 text-text-secondary font-mono font-bold text-[12px] rounded-xl transition-all hover:bg-white/5 hover:border-white/20 hover:text-text-primary active:scale-95 flex items-center justify-center gap-1"
          >
            ⚙️ 修改訂單
          </button>
          <button
            type="button"
            onClick={handleContactSeller}
            className="flex-1 h-9 px-4 bg-[#26211C] border border-brand/30 text-brand/80 font-mono font-bold text-[12px] rounded-xl transition-all hover:bg-brand/10 hover:border-brand hover:text-brand active:scale-95 flex items-center justify-center gap-1"
          >
            💬 聯絡對方
          </button>
        </div>
      )}
    </div>
  );
}
