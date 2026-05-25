import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "商戶儀表板 — PokéTrade JP",
  description: "查看銷售統計、待處理訂單及商戶概覽",
};

// TODO [MOCK DATA]: Replace with Supabase query — fetch merchant's revenue stats from `orders` aggregation (sum amount WHERE seller_id = current user, grouped by period)
const revenueStats = [
  { label: "今日營收",   value: "¥28,500",   note: "▲ +18% vs 昨日",  dir: "up"   as const },
  { label: "本月營收",   value: "¥384,600",  note: "▲ +24% vs 上月",  dir: "up"   as const },
  { label: "本月訂單",   value: "23",         note: "4 件待處理",      dir: "warn" as const },
  { label: "佣金扣減",   value: "¥19,230",   note: "約 5% 成交金額",   dir: "neutral" as const },
];

// TODO [MOCK DATA]: Replace with Supabase query — fetch pending orders from `orders` table WHERE seller_id = current user AND status IN ('pending_confirmation', 'pending_shipment', 'grading'), ordered by created_at ASC
const pendingActions = [
  { id: "ORD-20250519-041", buyer: "M.佐藤",   card: "Charizard ex SAR",  grade: "PSA 10",  amount: 49_800, action: "待發貨",   actionColor: "text-warning" },
  { id: "ORD-20250519-039", buyer: "K.田中",   card: "Umbreon ex SAR",    grade: "BGS 9",   amount: 38_200, action: "待確認",   actionColor: "text-brand"   },
  { id: "ORD-20250518-035", buyer: "C.Chen",   card: "Pikachu ex SAR",    grade: "PSA 10",  amount: 32_500, action: "鑑定進行中", actionColor: "text-success" },
  { id: "ORD-20250517-030", buyer: "A.Yamamoto", card: "Gardevoir ex SAR", grade: "PSA 9",  amount: 28_000, action: "待發貨",   actionColor: "text-warning" },
];

// TODO [MOCK DATA]: Replace with Supabase query — fetch completed sales from `orders` table WHERE seller_id = current user AND status = 'completed', ordered by created_at DESC, limit 5
const recentSales = [
  { id: "s-001", card: "Mew ex SAR",         grade: "PSA 10", amount: 44_500, date: "2025/5/18" },
  { id: "s-002", card: "Espeon ex SAR",       grade: "BGS 9.5", amount: 31_200, date: "2025/5/17" },
  { id: "s-003", card: "Sylveon ex SAR",      grade: "CGC 9",   amount: 22_800, date: "2025/5/16" },
  { id: "s-004", card: "Mimikyu ex SAR",      grade: "PSA 9",   amount: 28_500, date: "2025/5/15" },
  { id: "s-005", card: "Jolteon ex SAR",      grade: "PSA 10",  amount: 29_000, date: "2025/5/14" },
];

export default function MerchantDashboardPage() {
  return (
    <>
      {/* ── Revenue Stats ──────────────────────────────────────────────── */}
      <section aria-labelledby="revenue-heading" className="mb-6">
        <h2 id="revenue-heading" className="sr-only">營收統計</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {revenueStats.map(({ label, value, note, dir }) => (
            <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
              <p className="font-mono text-[11px] text-text-secondary mb-1.5">{label}</p>
              <p className="font-mono font-semibold text-[18px] text-text-primary leading-none mb-1">{value}</p>
              <p className={`font-mono text-[11px] ${dir === "up" ? "text-success" : dir === "warn" ? "text-warning" : "text-text-disabled"}`}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-8">
        {/* ── Left: Pending Actions ─────────────────────────────────── */}
        <div className="space-y-6">
          <section aria-labelledby="pending-heading">
            <div className="flex items-center justify-between mb-3">
              <h2 id="pending-heading" className="font-sans font-semibold text-[16px] text-text-primary">
                待處理訂單
              </h2>
              <Link
                href="/profile/merchant/sales"
                className="font-mono text-[12px] text-brand hover:text-brand-hover transition-colors"
              >
                查看全部 →
              </Link>
            </div>
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
              {pendingActions.map((order, i) => (
                <div
                  key={order.id}
                  className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-sans text-[13px] font-medium text-text-primary truncate">{order.card}</p>
                      <span className="font-mono text-[10px] text-text-disabled">{order.grade}</span>
                    </div>
                    <p className="font-mono text-[11px] text-text-secondary">
                      買家：{order.buyer} · #{order.id.slice(-6)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono font-semibold text-[14px] text-text-primary">
                      ¥{order.amount.toLocaleString("zh-TW")}
                    </p>
                    <span className={`font-mono text-[11px] ${order.actionColor}`}>
                      {order.action}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Monthly Revenue Chart placeholder */}
          <section aria-labelledby="chart-heading" className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
            <h2 id="chart-heading" className="font-sans font-semibold text-[15px] text-text-primary mb-3">
              本月銷售走勢
            </h2>
            <div className="flex items-end gap-1 h-24">
              {[12, 18, 9, 24, 20, 28, 15, 32, 22, 38, 28, 36, 42, 30, 28, 35, 40, 22, 38, 28].map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm bg-[rgba(212,165,116,0.25)] hover:bg-[rgba(212,165,116,0.45)] transition-colors"
                  style={{ height: `${(v / 42) * 100}%` }}
                  aria-hidden="true"
                />
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-mono text-[10px] text-text-disabled">5月 1日</span>
              <span className="font-mono text-[10px] text-text-disabled">今日</span>
            </div>
          </section>
        </div>

        {/* ── Right: Quick Actions + Recent Sales ──────────────────── */}
        <div className="mt-6 lg:mt-0 space-y-6">
          <section aria-labelledby="quick-actions-heading">
            <h2 id="quick-actions-heading" className="font-sans font-semibold text-[15px] text-text-primary mb-3">
              快速操作
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: "/profile/merchant/inventory", icon: "➕", label: "新增商品" },
                { href: "/profile/merchant/sales",     icon: "📋", label: "訂單管理" },
                { href: "/profile/merchant/finance",   icon: "💳", label: "查看金流" },
                { href: "/search",                     icon: "🔍", label: "瀏覽市場" },
              ].map(({ href, icon, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-2 px-3 py-4 bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-xl hover:bg-bg-elevated hover:border-brand/20 active:scale-[0.98] transition-all text-center"
                >
                  <span className="text-[20px]" aria-hidden="true">{icon}</span>
                  <span className="font-sans text-[12px] font-medium text-text-secondary">{label}</span>
                </Link>
              ))}
            </div>
          </section>

          <section aria-labelledby="recent-sales-heading">
            <h2 id="recent-sales-heading" className="font-sans font-semibold text-[15px] text-text-primary mb-3">
              最近售出
            </h2>
            <div className="space-y-2">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between px-3 py-2.5 bg-bg-card border border-[rgba(237,232,224,0.08)] rounded-xl">
                  <div>
                    <p className="font-sans text-[12px] font-medium text-text-primary truncate max-w-[140px]">{sale.card}</p>
                    <p className="font-mono text-[10px] text-text-secondary">{sale.grade} · {sale.date}</p>
                  </div>
                  <p className="font-mono font-semibold text-[13px] text-text-primary shrink-0">
                    ¥{sale.amount.toLocaleString("zh-TW")}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
