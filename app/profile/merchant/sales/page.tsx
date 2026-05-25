import type { Metadata } from "next";
import type { OrderStatus } from "@/app/lib/types/rbac";
import { ESCROW_STEPS } from "@/app/lib/types/rbac";

export const metadata: Metadata = {
  title: "銷售訂單 — PokéTrade JP",
  description: "處理買家訂單、填寫物流追蹤號碼",
};

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

const saleOrders: SaleOrder[] = [
  { id: "ORD-20250519-041", buyer: "M.佐藤",     cardName: "Charizard ex SAR", cardNo: "sv2a-182", grade: "PSA 10", amount: 49_800, depositPaid: 9_960,  status: "custody",  createdAt: "2025/5/19" },
  { id: "ORD-20250519-039", buyer: "K.田中",     cardName: "Umbreon ex SAR",   cardNo: "sv6a-109", grade: "BGS 9",  amount: 38_200, depositPaid: 7_640,  status: "payment",  createdAt: "2025/5/19" },
  { id: "ORD-20250517-035", buyer: "C.Chen",     cardName: "Pikachu ex SAR",   cardNo: "sv3a-062", grade: "PSA 10", amount: 32_500, depositPaid: 32_500, status: "grading",  createdAt: "2025/5/17", trackingNo: "SF1234567890JP" },
  { id: "ORD-20250515-030", buyer: "A.Yamamoto", cardName: "Gardevoir ex SAR", cardNo: "sv4a-237", grade: "PSA 9",  amount: 28_000, depositPaid: 5_600,  status: "shipped",  createdAt: "2025/5/15", trackingNo: "YM9876543210JP" },
  { id: "ORD-20250510-025", buyer: "R.Suzuki",   cardName: "Sylveon ex SAR",   cardNo: "s6a-210",  grade: "BGS 9.5",amount: 22_800, depositPaid: 22_800, status: "released", createdAt: "2025/5/10" },
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
    <span className={`font-mono text-[10px] font-medium px-2 py-0.5 rounded-full ${colorMap[status]}`}>
      {step?.label ?? status}
    </span>
  );
}

export default function MerchantSalesPage() {
  const needsAction = saleOrders.filter((o) => o.status === "custody" || o.status === "payment");

  return (
    <>
      {/* ── Needs Action Banner ───────────────────────────────────────── */}
      {needsAction.length > 0 && (
        <div className="mb-5 flex items-center gap-3 px-4 py-3 bg-[rgba(239,68,68,0.06)] border border-warning/25 rounded-xl">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p className="font-sans text-[13px] text-text-primary">
            <span className="font-semibold text-warning">{needsAction.length} 件訂單</span>
            {" "}需要您的處理：確認訂單或安排發貨。
          </p>
        </div>
      )}

      {/* ── Orders List ───────────────────────────────────────────────── */}
      <section aria-labelledby="sales-heading">
        <div className="flex items-center justify-between mb-4">
          <h2 id="sales-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            銷售訂單 ({saleOrders.length})
          </h2>
          <div className="flex gap-1.5">
            {["全部", "待處理", "進行中", "已完成"].map((f) => (
              <button key={f} type="button" className={`font-mono text-[11px] px-2.5 py-1 rounded-lg border transition-colors ${f === "全部" ? "text-brand border-brand/30 bg-[rgba(212,165,116,0.08)]" : "text-text-secondary border-[rgba(237,232,224,0.08)] hover:text-text-primary"}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          {saleOrders.map((order) => (
            <div
              key={order.id}
              className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-sans text-[14px] font-semibold text-text-primary truncate">{order.cardName}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="font-mono text-[11px] text-text-secondary">{order.cardNo} · {order.grade} · 買家：{order.buyer}</p>
                  <p className="font-mono text-[10px] text-text-disabled mt-0.5">#{order.id} · {order.createdAt}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-bold text-[16px] text-text-primary">
                    ¥{order.amount.toLocaleString("zh-TW")}
                  </p>
                  <p className="font-mono text-[11px] text-text-secondary">
                    訂金 ¥{order.depositPaid.toLocaleString("zh-TW")}
                  </p>
                </div>
              </div>

              {/* Action area based on status */}
              {order.status === "payment" && (
                <div className="flex gap-2">
                  <button type="button" className="flex-1 h-10 bg-brand text-[#17130f] font-sans font-semibold text-[13px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-transform">
                    確認並準備發貨
                  </button>
                  <button type="button" className="px-4 h-10 font-sans text-[13px] text-text-secondary border border-[rgba(237,232,224,0.12)] rounded-xl hover:bg-bg-elevated transition-colors">
                    聯絡買家
                  </button>
                </div>
              )}

              {order.status === "custody" && (
                <div className="space-y-2">
                  <div className="flex items-center h-10 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl overflow-hidden">
                    <input
                      type="text"
                      defaultValue={order.trackingNo ?? ""}
                      placeholder="填入順豐 / 郵便 / 宅急便 追蹤號碼"
                      className="flex-1 h-full bg-transparent px-4 font-mono text-[12px] text-text-primary placeholder-text-disabled focus:outline-none"
                    />
                    <button type="button" className="px-4 h-full font-mono text-[11px] text-brand border-l border-[rgba(237,232,224,0.08)] hover:bg-[rgba(212,165,116,0.08)] transition-colors">
                      確認發貨
                    </button>
                  </div>
                  <p className="font-mono text-[10px] text-text-disabled">
                    ⚠ 嚴禁在聊天中共享銀行帳號或個人聯絡方式，所有付款均透過平台處理。
                  </p>
                </div>
              )}

              {order.trackingNo && order.status !== "custody" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-bg-elevated rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#d4a574" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v3" />
                    <rect x="9" y="11" width="14" height="10" rx="2" ry="2" />
                    <circle cx="12" cy="18" r="1.5" />
                  </svg>
                  <span className="font-mono text-[11px] text-text-secondary">
                    追蹤號：<span className="text-brand">{order.trackingNo}</span>
                  </span>
                </div>
              )}

              {order.status === "released" && (
                <div className="flex items-center gap-2 px-3 py-2 bg-[rgba(16,185,129,0.08)] border border-success/20 rounded-lg">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span className="font-mono text-[11px] text-success">款項已釋放，交易完成</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
