import type { Metadata } from "next";
import type { OrderStatus } from "@/app/lib/types/rbac";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";

export const metadata: Metadata = {
  title: "我的訂單 — PokéTrade JP",
  description: "追蹤買家訂單進度及 Escrow 託管狀態",
};

interface Order {
  id: string;
  cardName: string;
  cardNo: string;
  grade: string;
  seller: string;
  amount: number;
  depositAmount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  isHighValue: boolean;
}

// TODO [database]: Replace with Supabase query — fetch buyer's active orders from `orders` table WHERE buyer_id = current user AND status NOT IN ('released', 'cancelled'), ordered by updated_at DESC
const activeOrders: Order[] = [
  {
    id: "ORD-20250401-001",
    cardName:      "Charizard ex SAR",
    cardNo:        "sv2a-182",
    grade:         "PSA 10",
    seller:        "TanakaTCG",
    amount:        49_800,
    depositAmount: 4_980,
    status:        "grading",
    createdAt:     "2025年 4月 1日",
    updatedAt:     "2025年 4月 12日",
    isHighValue:   true,
  },
  {
    id: "ORD-20250415-002",
    cardName:      "Espeon ex SAR",
    cardNo:        "s6a-209",
    grade:         "BGS 9.5",
    seller:        "OsakaPokéCards",
    amount:        31_200,
    depositAmount: 3_120,
    status:        "shipped",
    createdAt:     "2025年 4月 15日",
    updatedAt:     "2025年 4月 18日",
    isHighValue:   true,
  },
];

// TODO [database]: Replace with Supabase query — fetch completed orders from `orders` table WHERE buyer_id = current user AND status = 'released', ordered by updated_at DESC, limit 20
const completedOrders: Order[] = [
  {
    id: "ORD-20250310-008",
    cardName:      "Umbreon ex SAR",
    cardNo:        "sv6a-109",
    grade:         "BGS 9.5",
    seller:        "TokyoRareCards",
    amount:        39_500,
    depositAmount: 39_500,
    status:        "released",
    createdAt:     "2025年 3月 10日",
    updatedAt:     "2025年 3月 25日",
    isHighValue:   true,
  },
  {
    id: "ORD-20250220-005",
    cardName:      "Pikachu AR",
    cardNo:        "sv2a-215",
    grade:         "CGC 9",
    seller:        "Yokohama_Collector",
    amount:        8_200,
    depositAmount: 8_200,
    status:        "released",
    createdAt:     "2025年 2月 20日",
    updatedAt:     "2025年 2月 28日",
    isHighValue:   false,
  },
];

const STATUS_STEP_INDEX: Record<OrderStatus, number> = {
  payment:  0,
  custody:  1,
  shipped:  2,
  grading:  3,
  released: 4,
};

function EscrowStepper({ status }: { status: OrderStatus }) {
  const activeIndex = STATUS_STEP_INDEX[status];
  return (
    <div className="mt-4 overflow-x-auto scrollbar-none pb-1">
      <div className="flex items-start gap-0 min-w-max">
        {ESCROW_STEPS.map((step, i) => {
          const isDone   = i < activeIndex;
          const isActive = i === activeIndex;
          return (
            <div key={step.id} className="flex items-start">
              <div className="flex flex-col items-center w-[88px]">
                {/* Node */}
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-colors ${
                  isDone   ? "bg-success border-success"
                  : isActive ? "bg-[rgba(212,165,116,0.15)] border-brand animate-[ring-pulse_2s_ease-in-out_infinite]"
                  : "bg-bg-elevated border-[rgba(237,232,224,0.12)]"
                }`}>
                  {isDone ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <span className={`w-2 h-2 rounded-full ${isActive ? "bg-brand" : "bg-bg-hover"}`} />
                  )}
                </div>
                {/* Label */}
                <p className={`font-mono text-[10px] mt-1 text-center leading-tight px-1 ${
                  isActive ? "text-brand font-medium" : isDone ? "text-text-secondary" : "text-text-disabled"
                }`}>
                  {step.label}
                </p>
              </div>
              {/* Connector */}
              {i < ESCROW_STEPS.length - 1 && (
                <div className={`h-0.5 w-6 mt-3.5 shrink-0 ${i < activeIndex ? "bg-success" : "bg-bg-elevated"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OrderCard({ order, compact = false }: { order: Order; compact?: boolean }) {
  const stepLabel = ESCROW_STEPS[STATUS_STEP_INDEX[order.status]]?.label ?? "";
  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4 mb-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[14px] font-semibold text-text-primary truncate">{order.cardName}</p>
          <p className="font-mono text-[11px] text-text-secondary mt-0.5">{order.cardNo} · {order.grade} · 賣家：{order.seller}</p>
          <p className="font-mono text-[10px] text-text-disabled mt-0.5">#{order.id}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono font-bold text-[16px] text-text-primary">¥{order.amount.toLocaleString("zh-TW")}</p>
          <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full ${
            order.status === "released"
              ? "text-success bg-[rgba(16,185,129,0.12)]"
              : "text-brand bg-[rgba(212,165,116,0.12)]"
          }`}>
            {stepLabel}
          </span>
        </div>
      </div>

      {!compact && order.isHighValue && <EscrowStepper status={order.status} />}

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[rgba(237,232,224,0.06)]">
        <p className="font-mono text-[11px] text-text-disabled">建立 {order.createdAt} · 更新 {order.updatedAt}</p>
        {order.status !== "released" && (
            // TODO [server]: "聯絡賣家" button has no handler — must navigate to in-platform chat thread or open a messaging modal for order.id
            <button type="button" className="font-mono text-[11px] text-brand hover:text-brand-hover transition-colors">
            聯絡賣家
          </button>
        )}
      </div>
    </div>
  );
}

export default function UserOrdersPage() {
  return (
    <>
      {/* Escrow explanation banner */}
      <div className="mb-5 px-4 py-3 bg-[rgba(212,165,116,0.06)] border border-brand/20 rounded-xl">
        <p className="font-mono text-[11px] text-brand font-medium mb-1">🔒 第三方 Escrow 託管保障</p>
        <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
          高價值交易採用資金託管機制：付款後資金由平台保管，待第三方鑑定機構確認品相後，
          方才釋放款項至賣方。全程受 RLS 規則保護。
        </p>
      </div>

      {/* Active Orders */}
      <section aria-labelledby="active-orders-heading" className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 id="active-orders-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            進行中 ({activeOrders.length})
          </h2>
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
            即時追蹤
          </span>
        </div>
        {activeOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </section>

      {/* Completed Orders */}
      <section aria-labelledby="completed-orders-heading">
        <h2 id="completed-orders-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          已完成 ({completedOrders.length})
        </h2>
        {completedOrders.map((order) => (
          <OrderCard key={order.id} order={order} compact />
        ))}
      </section>
    </>
  );
}
