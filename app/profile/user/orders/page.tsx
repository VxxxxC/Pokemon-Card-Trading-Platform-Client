"use client";

import { useState } from "react";
import type { OrderStatus } from "@/app/lib/types/rbac";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";
import Link from "next/link";

interface Order {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  seller: string;
  amount: number; // HKD value
  depositAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  isHighValue: boolean;
}

const INITIAL_ORDERS: Order[] = [
  {
    id: "ORD-20260527-001",
    cardName: "Charizard ex SAR (噴火龍)",
    cardNo: "sv2a-182",
    grade: "PSA 10",
    seller: "渡邊道館",
    amount: 2250,
    depositAmount: 225,
    status: "grading",
    createdAt: "2026年 5月27日",
    updatedAt: "2026年 5月28日",
    isHighValue: true,
  },
  {
    id: "ORD-20260515-002",
    cardName: "Umbreon ex SAR (月亮伊布)",
    cardNo: "sv6a-109",
    grade: "BGS 9.5",
    seller: "大阪收藏家",
    amount: 1900,
    depositAmount: 190,
    status: "shipped",
    createdAt: "2026年 5月15日",
    updatedAt: "2026年 5月20日",
    isHighValue: true,
  },
  {
    id: "ORD-20260510-008",
    cardName: "Pikachu AR (皮卡丘)",
    cardNo: "sv2a-215",
    grade: "CGC 9",
    seller: "東京TCG市場",
    amount: 425,
    depositAmount: 425,
    status: "released",
    createdAt: "2026年 5月10日",
    updatedAt: "2026年 5月15日",
    isHighValue: false,
  },
];

const STATUS_STEP_INDEX: Record<OrderStatus, number> = {
  payment: 0,
  custody: 1,
  shipped: 2,
  grading: 3,
  released: 4,
};

export default function UserOrdersPage() {
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [activeTab, setActiveTab] = useState<
    "active" | "checkout" | "completed"
  >("active");

  // SF Locker Form states
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [lockerCode, setLockerCode] = useState("852-smart-locker");
  const [lockerAddress, setLockerAddress] = useState("");
  const [isCheckoutSubmitting, setIsCheckoutSubmitting] = useState(false);

  const activeOrders = orders.filter((o) => o.status !== "released");
  const completedOrders = orders.filter((o) => o.status === "released");

  // Checkout pricing variables
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
      // Create new active mockup order
      const newOrder: Order = {
        id: `ORD-20260528-${Math.floor(100 + Math.random() * 900)}`,
        cardName: "Mimikyu ex SAR (謎擬Q)",
        cardNo: "sv2a-233",
        grade: "PSA 9",
        seller: "名古屋交易商",
        amount: 1480,
        depositAmount: 148,
        status: "payment",
        createdAt: "2026年 5月28日",
        updatedAt: "2026年 5月28日",
        isHighValue: true,
      };

      setOrders((prev) => [newOrder, ...prev]);
      setIsCheckoutSubmitting(false);
      setActiveTab("active");
      alert("⚡ 結帳資料已保存！首筆 10% 交易託管定金已成功鎖定。");
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Tab select bar */}
      <div className="flex border-b border-[rgba(237,232,224,0.08)]">
        <button
          onClick={() => setActiveTab("active")}
          className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${
            activeTab === "active"
              ? "text-[#d4a574]"
              : "text-[#d4c4b7] hover:text-[#eae1da]"
          }`}
        >
          進行中訂單 ({activeOrders.length})
          {activeTab === "active" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a574]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("checkout")}
          className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${
            activeTab === "checkout"
              ? "text-[#d4a574]"
              : "text-[#d4c4b7] hover:text-[#eae1da]"
          }`}
        >
          📝 結帳明細確認
          {activeTab === "checkout" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a574]" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`pb-3 px-4 font-sans text-[14px] font-semibold transition-all relative ${
            activeTab === "completed"
              ? "text-[#d4a574]"
              : "text-[#d4c4b7] hover:text-[#eae1da]"
          }`}
        >
          歷史交易已完成 ({completedOrders.length})
          {activeTab === "completed" && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#d4a574]" />
          )}
        </button>
      </div>

      {activeTab === "active" && (
        <div className="space-y-4">
          {/* Escrow explanation banner */}
          <div className="p-4 bg-[rgba(212,165,116,0.06)] border border-[#d4a574]/20 rounded-xl space-y-1">
            <p className="font-mono text-[11px] text-[#d4a574] font-semibold">
              🔒 第三方 Escrow 託管保障
            </p>
            <p className="font-sans text-[12px] text-[#d4c4b7] leading-relaxed">
              高價值交易採用資金託管機制：付款後資金由平台保管，待第三方鑑定機構確認品相後，方才釋放款項至賣方。全程受
              RLS 規則保護。
            </p>
          </div>

          {activeOrders.length === 0 ? (
            <div className="py-12 text-center bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl">
              <p className="font-sans text-[14px] text-[#d4c4b7]">
                目前沒有進行中的交易訂單
              </p>
            </div>
          ) : (
            activeOrders.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))
          )}
        </div>
      )}

      {activeTab === "checkout" && (
        /* INTERACTIVE CHECKOUT REVIEW FORM */
        <div className="lg:grid lg:grid-cols-12 lg:gap-6 items-start">
          {/* Form input cards */}
          <form
            onSubmit={handleConfirmCheckout}
            className="lg:col-span-7 space-y-4"
          >
            <section className="bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-5 space-y-4">
              <h3 className="font-sans font-semibold text-[15px] text-[#eae1da] border-b border-[rgba(237,232,224,0.06)] pb-2">
                香港本地物流收貨人資料
              </h3>

              {/* SF phone locker validators */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="checkout-phone"
                    className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider block mb-1.5"
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
                    className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider block mb-1.5"
                  >
                    順豐智能櫃 / 網點代碼
                  </label>
                  <select
                    id="checkout-locker"
                    value={lockerCode}
                    onChange={(e) => setLockerCode(e.target.value)}
                    className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-mono text-[13px] text-[#eae1da] focus:outline-none focus:border-[#d4a574]/40"
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
                  className="font-mono text-[11px] text-[#d4c4b7] uppercase tracking-wider block mb-1.5"
                >
                  自提點詳細收件地址
                </label>
                <input
                  id="checkout-address"
                  type="text"
                  required
                  value={lockerAddress}
                  onChange={(e) => setLockerAddress(e.target.value)}
                  placeholder="例如：旺角彌敦道580號信和中心地下B4號鋪順豐站"
                  className="w-full h-11 bg-[#17130f] border border-[rgba(237,232,224,0.12)] rounded-xl px-4 font-sans text-[13px] text-[#eae1da] focus:outline-none focus:border-[#d4a574]/40"
                />
              </div>
            </section>

            <button
              type="submit"
              disabled={
                isCheckoutSubmitting || !phone || !lockerAddress || !!phoneError
              }
              className="w-full h-12 bg-[#d4a574] hover:bg-[#e8b896] text-[#1A1612] disabled:opacity-50 font-sans font-bold text-[14px] rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform min-h-[48px]"
            >
              {isCheckoutSubmitting ? (
                <div className="w-4 h-4 border-2 border-[#1A1612] border-t-transparent rounded-full animate-spin" />
              ) : (
                "⚡ 確認物流配送資料並鎖定訂單"
              )}
            </button>
          </form>

          {/* Ledger display (Desktop width: 5/12) */}
          <section className="lg:col-span-5 bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-xl p-5 space-y-4 mt-4 lg:mt-0">
            <h3 className="font-sans font-semibold text-[15px] text-[#eae1da] border-b border-[rgba(237,232,224,0.06)] pb-2">
              應付結帳明細
            </h3>

            {/* Financial ledger alignment */}
            <div className="font-mono text-[12px] space-y-2.5">
              <div className="flex justify-between items-center text-[#d4c4b7]">
                <span>商品小計 (Subtotal)</span>
                <span>HK$ {subtotal.toLocaleString("en-HK")}</span>
              </div>
              <div className="flex justify-between items-center text-[#d4c4b7]">
                <span>順豐速遞運費 (Shipping)</span>
                <span>HK$ {shippingFee.toLocaleString("en-HK")}</span>
              </div>
              <div className="flex justify-between items-center text-[#ef4444]">
                <span>平台定額優惠券補貼 (Subsidy)</span>
                <span>-HK$ {subsidyAmount.toLocaleString("en-HK")}</span>
              </div>
              <div className="border-t border-[rgba(237,232,224,0.08)] pt-2.5 flex justify-between items-center text-[#eae1da] font-bold text-[14px]">
                <span>本次實時應付總額 (Total)</span>
                <span className="text-[#d4a574]">
                  HK$ {totalDue.toLocaleString("en-HK")}
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#17130f] rounded-lg border border-[rgba(237,232,224,0.04)] font-sans text-[11px] text-[#d4c4b7] leading-relaxed">
              * 備註：此訂單金額已扣除港島/九龍免郵定額補貼。首期僅需繳付 10%
              託管押金。
            </div>
          </section>
        </div>
      )}

      {activeTab === "completed" && (
        <div className="space-y-4">
          {completedOrders.length === 0 ? (
            <div className="py-12 text-center bg-[#26211C] border border-[rgba(237,232,224,0.08)] rounded-2xl">
              <p className="font-sans text-[14px] text-[#d4c4b7]">
                目前沒有歷史交易完成訂單
              </p>
            </div>
          ) : (
            completedOrders.map((order) => (
              <OrderCard key={order.id} order={order} compact />
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EscrowStepper({ status }: { status: OrderStatus }) {
  const activeIndex = STATUS_STEP_INDEX[status];
  return (
    <div className="mt-4 overflow-x-auto scrollbar-none pb-2">
      <div className="flex items-start gap-0 min-w-max">
        {ESCROW_STEPS.map((step, i) => {
          const isDone = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center w-[88px]">
                {/* Stepper active glowing pulsing rings */}
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isDone
                      ? "bg-[#10b981] border-[#10b981]"
                      : isActive
                        ? "bg-[rgba(212,165,116,0.15)] border-[#d4a574] animate-ring-pulse"
                        : "bg-[#2e2925] border-[rgba(237,232,224,0.12)]"
                  }`}
                >
                  {isDone ? (
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#fff"
                      strokeWidth="3"
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-[#d4a574]" : "bg-[#39342f]"}`}
                    />
                  )}
                </div>
                {/* Labels */}
                <p
                  className={`font-mono text-[10px] mt-1.5 text-center leading-tight px-1 ${
                    isActive
                      ? "text-[#d4a574] font-medium"
                      : isDone
                        ? "text-[#d4c4b7]"
                        : "text-[#50453b]"
                  }`}
                >
                  {step.label}
                </p>
              </div>
              {/* Connector links */}
              {i < ESCROW_STEPS.length - 1 && (
                <div
                  className={`h-0.5 w-6 mt-3.5 shrink-0 ${i < activeIndex ? "bg-[#10b981]" : "bg-[#2e2925]"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface OrderCardProps {
  order: Order;
  compact?: boolean;
}

function OrderCard({ order, compact = false }: OrderCardProps) {
  const stepLabel = ESCROW_STEPS[STATUS_STEP_INDEX[order.status]]?.label ?? "";

  return (
    <div className="bg-[#26211C] rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 hover:border-[#d4a574]/30 transition-all group">
      {/* 1. 將卡牌主要內容區包裝成 Link，點擊直接跳轉入去 [id] 動態詳情頁 */}
      <Link
        href={`/profile/user/orders/${order.id}`}
        className="block space-y-4 cursor-pointer"
      >
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            {/* Hover 時卡牌名稱會亮起品牌金棕色，提示用戶可以點擊 */}
            <p className="font-sans text-[15px] font-semibold text-[#eae1da] group-hover:text-[#d4a574] transition-colors truncate">
              {order.cardName}
            </p>
            <p className="font-mono text-[11px] text-[#d4c4b7] mt-1">
              序號: {order.cardNo} · 等級: {order.grade} · 賣家: {order.seller}
            </p>
            <p className="font-mono text-[10px] text-[#50453b] mt-0.5">
              #{order.id}
            </p>
          </div>

          <div className="text-right shrink-0">
            <p className="font-mono font-bold text-[17px] text-[#eae1da]">
              HK$ {order.amount.toLocaleString("en-HK")}
            </p>
            <span
              className={`font-mono text-[10px] px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                order.status === "released"
                  ? "text-[#10b981] bg-[rgba(16,185,129,0.12)] border border-[#10b981]/20"
                  : "text-[#d4a574] bg-[rgba(212,165,116,0.12)] border border-[#d4a574]/20"
              }`}
            >
              {stepLabel}
            </span>
          </div>
        </div>

        {!compact && order.isHighValue && (
          <EscrowStepper status={order.status} />
        )}
      </Link>

      {/* 2. 底部控制列：左邊外顯詳情跳轉，右邊保留聯絡賣家 */}
      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-[rgba(237,232,224,0.06)]">
        <Link
          href={`/profile/user/orders/${order.id}`}
          className="font-mono text-[11px] text-[#d4c4b7] hover:text-[#d4a574] transition-colors flex items-center gap-1"
        >
          🔍 查看交易詳情
        </Link>

        {order.status !== "released" && (
          <Link
            href={`/profile/PKT-8839-44A?chat=open`}
            className="font-mono text-[11px] text-[#d4a574] hover:text-[#e8b896] transition-colors"
          >
            💬 聯絡賣家進行安全對話
          </Link>
        )}
      </div>
    </div>
  );
}
