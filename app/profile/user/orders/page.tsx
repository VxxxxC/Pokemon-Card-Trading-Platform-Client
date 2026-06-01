"use client";

import { useState } from "react";
import Link from "next/link";

export type TradeType = "c2c" | "b2c";
export type FlowType = "meetup" | "delivery" | "escrow_auth" | "escrow_no_auth";

export interface Order {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  cardImage: string; // 🟢 新增：卡牌高清原圖 / 實物圖
  seller: string;
  sellerId: string;
  amount: number;
  tradeType: TradeType;
  flowType: FlowType;
  status: string;
  statusLabel: string;
  createdAt: string;
  isHighValue: boolean;
}

// TODO: [server/api/database]
// 後端對接提示：`card_image` 欄位未來直接儲存儲存在 bunny.net CDN 或 Supabase Storage 嘅圖片路徑。
const INITIAL_ORDERS: Order[] = [
  // ── ⏳ 進行中交易數據 (Active Orders) ──
  {
    id: "ORD-C2C-MEETUP-001",
    cardName: "Charizard ex SAR (噴火龍)",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    cardImage: "https://picsum.photos/seed/charizard/200/280", // 🟢 豐富商品圖
    seller: "星光收藏家 (C2C 散戶)",
    sellerId: "ROOM-MOCK-C2C-01",
    amount: 2250,
    tradeType: "c2c",
    flowType: "meetup",
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
    status: "received",
    statusLabel: "交易完結 (自提點已簽收)",
    createdAt: "2026年 5月08日",
    isHighValue: true,
  },
  {
    id: "ORD-B2C-DONE-103",
    cardName: "Rayquaza VMAX (烈空坐) SA 083/067",
    cardNo: "s7R-083",
    grade: "PSA 10",
    cardImage: "https://picsum.photos/seed/rayquaza/200/280",
    seller: "木戶卡牌旗艦店 (認證商戶)",
    sellerId: "ROOM-MOCK-B2C-97",
    amount: 4800,
    tradeType: "b2c",
    flowType: "escrow_auth",
    status: "received",
    statusLabel: "交易完結 (官方鑑定合格)",
    createdAt: "2026年 5月05日",
    isHighValue: true,
  },
  {
    id: "ORD-B2C-DONE-104",
    cardName: "Eevee (伊布) AR 210/165",
    cardNo: "sv2a-210",
    grade: "PSA 9",
    cardImage: "https://picsum.photos/seed/eevee/200/280",
    seller: "秋葉原海外直送店 (認證商戶)",
    sellerId: "ROOM-MOCK-B2C-96",
    amount: 180,
    tradeType: "b2c",
    flowType: "escrow_no_auth",
    status: "received",
    statusLabel: "交易完結 (商戶直發簽收)",
    createdAt: "2026年 5月01日",
    isHighValue: false,
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
  const [activeTab, setActiveTab] = useState<
    "active" | "checkout" | "completed"
  >("active");

  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [lockerCode, setLockerCode] = useState("852-smart-locker");
  const [lockerAddress, setLockerAddress] = useState("");
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);

  const activeOrders = orders.filter(
    (o) => o.status !== "completed_meetup" && o.status !== "received",
  );
  const completedOrders = orders.filter(
    (o) => o.status === "completed_meetup" || o.status === "received",
  );

  const subtotal = 1480;
  const shippingFee = 30;
  const subsidyAmount = 30;
  const totalDue = subtotal + shippingFee - subsidyAmount;

  const handlePhoneChange = (val: string) => {
    setPhone(val);
    if (val && !/^[4-9]\d{7}$/.test(val)) {
      setPhoneError("❌ 請輸入有效的香港 8 位數手提電話號碼（例：91234567）");
    } else {
      setPhoneError("");
    }
  };

  const handleConfirmCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneError || !phone || !lockerAddress) return;
    setIsCheckoutSubmitting(true);
    setTimeout(() => {
      const newOrder: Order = {
        id: `ORD-C2C-DELIVERY-${Math.floor(100 + Math.random() * 900)}`,
        cardName: "Mimikyu ex SAR (謎擬Q)",
        cardNo: "sv2a-233",
        grade: "PSA 9",
        cardImage: "https://picsum.photos/seed/mimikyu/200/280",
        seller: "名古屋交易商 (C2C)",
        sellerId: "ROOM-MOCK-C2C-03",
        amount: 1480,
        tradeType: "c2c",
        flowType: "delivery",
        status: "payment",
        statusLabel: "已預留 (等待付款鎖定)",
        createdAt: "2026年 5月28日",
        isHighValue: true,
      };
      setOrders((prev) => [newOrder, ...prev]);
      setIsCheckoutSubmitting(false);
      setActiveTab("active");
      alert("⚡ 結帳資料已保存！交易定金託管中。");
    }, 1200);
  };

  return (
    <div className="space-y-6 p-4 lg:p-8 bg-[#17130f] min-h-screen text-[#eae1da]">
      {/* Tab 切換導航 */}
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
          onClick={() => setActiveTab("checkout")}
          className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${activeTab === "checkout" ? "text-[#d4a574]" : "text-[#d4c4b7] hover:text-[#eae1da]"}`}
        >
          📝 結帳明細確認
          {activeTab === "checkout" && (
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

      {activeTab === "active" && (
        <div className="space-y-4">
          {activeOrders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </div>
      )}

      {activeTab === "checkout" && (
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start animate-fadeIn">
          <form
            onSubmit={handleConfirmCheckout}
            className="lg:col-span-7 space-y-4"
          >
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-5 space-y-4">
              <h3 className="font-sans font-semibold text-[15px] text-[#eae1da] border-b border-[rgba(237,232,224,0.06)] pb-2">
                香港本地物流收貨人資料
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="font-mono text-[11px] text-[#d4c4b7] uppercase block mb-1.5"
                  >
                    香港手提電話號碼
                  </label>
                  <input
                    id="checkout-phone"
                    type="tel"
                    required
                    maxLength={8}
                    value={phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="91234567"
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[14px] text-[#eae1da] focus:outline-none focus:border-[#d4a574]/40"
                  />
                  {phoneError && (
                    <p className="font-sans text-[10px] text-[#ef4444] mt-1.5 leading-relaxed">
                      {phoneError}
                    </p>
                  )}
                </div>
                <div>
                  <label
                    htmlFor="checkout-locker"
                    className="font-mono text-[11px] text-[#d4c4b7] uppercase block mb-1.5"
                  >
                    順豐智能櫃網點
                  </label>
                  <select
                    id="checkout-locker"
                    value={lockerCode}
                    onChange={(e) => setLockerCode(e.target.value)}
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-[#eae1da] focus:outline-none"
                  >
                    <option value="852-smart-locker">
                      852-smart-locker (智能櫃)
                    </option>
                    <option value="SF-station">SF-station (順豐站)</option>
                    <option value="HK-pickup">HK-pickup (自提點)</option>
                  </select>
                </div>
              </div>
              <div>
                <label
                  htmlFor="checkout-address"
                  className="font-mono text-[11px] text-[#d4c4b7] uppercase block mb-1.5"
                >
                  自提點詳細地址
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={lockerAddress}
                  onChange={(e) => setLockerAddress(e.target.value)}
                  className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] focus:outline-none"
                />
              </div>
            </section>
            <button
              type="submit"
              className="w-full h-12 bg-[#d4a574] text-[#1A1612] font-sans font-bold text-[14px] rounded-xl flex items-center justify-center"
            >
              ⚡ 確認物流配送資料並鎖定訂單
            </button>
          </form>
          <section className="lg:col-span-5 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-5 space-y-4">
            <h3 className="font-sans font-semibold text-[15px] text-[#eae1da] border-b border-[rgba(237,232,224,0.06)] pb-2">
              應付結帳明細
            </h3>
            <div className="font-mono text-[12px] space-y-2.5">
              <div className="flex justify-between items-center text-[#d4c4b7]">
                <span>商品小計 (Subtotal)</span>
                <span>HK$ {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#d4c4b7]">
                <span>順豐速遞運費 (Shipping)</span>
                <span>HK$ {shippingFee.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[#ef4444]">
                <span>平台優惠券補貼 (Subsidy)</span>
                <span>-HK$ {subsidyAmount.toLocaleString()}</span>
              </div>
              <div className="border-t border-[rgba(237,232,224,0.08)] pt-2.5 flex justify-between items-center text-[#eae1da] font-bold text-[14px]">
                <span>本次實時應付總額</span>
                <span className="text-[#d4a574]">
                  HK$ {totalDue.toLocaleString()}
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedOrders.map((order) => (
            <OrderCard key={order.id} order={order} compact />
          ))}
        </div>
      )}
    </div>
  );
}

// 🟢 智能外顯步進器：完美支援進行中狀態，或完結歷史路徑（全亮綠燈）
function DynamicCardStepper({ order }: { order: Order }) {
  const steps = FLOW_STEPS_DEFINITION[order.flowType] || [];
  const isFinished =
    order.status === "completed_meetup" || order.status === "received";
  // 如果已完成交易，activeIndex 設為最後一個 node 的 index，令前方全部亮綠燈！
  const activeIndex = isFinished
    ? steps.length - 1
    : steps.findIndex((s) => s.id === order.status);

  return (
    <div className="mt-4 overflow-x-auto scrollbar-none pb-1">
      <div className="flex items-start gap-0 min-w-max">
        {steps.map((step, i) => {
          const isDone = isFinished ? i <= activeIndex : i < activeIndex;
          const isActive = !isFinished && i === activeIndex;
          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center w-[78px]">
                <div
                  className={`w-5.5 h-5.5 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isFinished || isDone
                      ? "bg-[#10b981] border-[#10b981]"
                      : isActive
                        ? "bg-[rgba(212,165,116,0.15)] border-[#d4a574]"
                        : "bg-[#2e2925] border-[rgba(237,232,224,0.12)]"
                  }`}
                >
                  {isFinished || isDone ? (
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-[#d4a574]" : "bg-[#39342f]"}`}
                    />
                  )}
                </div>
                <p
                  className={`font-mono text-[9px] mt-1 text-center leading-tight ${isActive ? "text-[#d4a574] font-medium" : isFinished || isDone ? "text-[#10b981]" : "text-[#50453b]"}`}
                >
                  {step.label}
                </p>
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-[18px] mt-2.5 shrink-0 ${isFinished || i < activeIndex ? "bg-[#10b981]" : "bg-[#2e2925]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({
  order,
  compact = false,
}: {
  order: Order;
  compact?: boolean;
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

  return (
    <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 hover:border-[#d4a574]/30 transition-all group">
      <Link
        href={`/profile/user/orders/${order.id}`}
        className="block space-y-4 cursor-pointer"
      >
        <div className="flex gap-4 items-start">
          {/* 🟢 左側：高清晰度實物防潮箱存證圖片 */}
          <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-[#17130f] border border-[rgba(237,232,224,0.08)] shrink-0 shadow-md">
            <img
              src={order.cardImage}
              alt={order.cardName}
              className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* 右側：商品核心數據 */}
          <div className="min-w-0 flex-1">
            <div className="flex justify-between items-start flex-wrap gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-mono text-[8.5px] px-2 py-0.5 rounded border uppercase font-semibold tracking-wide ${
                      order.tradeType === "b2c"
                        ? "bg-brand/10 text-brand border-brand/20"
                        : "bg-[#50453b]/30 text-[#d4c4b7] border-[rgba(237,232,224,0.1)]"
                    }`}
                  >
                    {order.tradeType === "b2c" ? "認證商戶" : "C2C散戶"}
                  </span>
                  <span className="font-mono text-[9px] text-[#50453b]">
                    #{order.id}
                  </span>
                </div>
                <p className="font-sans text-[14.5px] font-bold text-[#eae1da] group-hover:text-[#d4a574] transition-colors mt-2 truncate">
                  {order.cardName}
                </p>
                <p className="font-mono text-[11px] text-[#d4c4b7] mt-0.5 truncate">
                  編號: {order.cardNo} · 等級: {order.grade} · 賣方:{" "}
                  {order.seller}
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

        {/* 🟢 修正：無論是進行中，還是歷史完結單，一律強制外顯歷史生命週期進度條線！ */}
        {(order.isHighValue || isFinished) && (
          <DynamicCardStepper order={order} />
        )}
      </Link>

      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[rgba(237,232,224,0.06)]">
        <Link
          href={`/profile/user/orders/${order.id}`}
          className="font-mono text-[11px] text-[#d4c4b7] hover:text-[#d4a574] transition-colors"
        >
          🔍 查看詳細交易生命週期存證
        </Link>
        {!isFinished && (
          <button
            onClick={handleContactSeller}
            className="font-mono text-[11px] text-[#d4a574] hover:text-[#e8b896] transition-colors bg-transparent border-none p-0 cursor-pointer"
          >
            💬 聯絡賣家進行加密安全對話
          </button>
        )}
      </div>
    </div>
  );
}
