import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "平台監控 — PokéTrade JP 後台",
  description: "實時監控平台整體交易量、營收及系統狀態",
};

// TODO [MOCK DATA]: Replace with Supabase aggregation — query `orders`, `stripe_payouts` and `sessions` tables for live platform metrics
const platformMetrics = [
  { label: "全平台 GMV",      value: "¥12,840,000",  note: "▲ +38% vs 上月",    dir: "up"    as const },
  { label: "Stripe 佣金收入", value: "¥642,000",      note: "本月累計",           dir: "brand" as const },
  { label: "在線用戶",        value: "284",            note: "▲ +12 過去 1 小時",  dir: "up"    as const },
  { label: "今日成交筆數",    value: "63",             note: "▲ +8 vs 昨日",      dir: "up"    as const },
];

// TODO [MOCK DATA]: Replace with Supabase Realtime subscription on `orders` table JOIN `users` and `listings`, limit 5, order by created_at DESC
const recentTransactions = [
  { id: "TX-001", buyer: "M.佐藤",   seller: "KojiTCG Premium",   card: "Charizard ex SAR",  grade: "PSA 10", amount: 49_800, time: "2分鐘前" },
  { id: "TX-002", buyer: "C.Chen",   seller: "TokyoRareCards",    card: "Umbreon ex SAR",    grade: "BGS 9",  amount: 38_200, time: "8分鐘前" },
  { id: "TX-003", buyer: "K.田中",   seller: "OsakaPokéCards",    card: "Mew ex SAR",        grade: "PSA 10", amount: 44_500, time: "15分鐘前" },
  { id: "TX-004", buyer: "R.Suzuki", seller: "KojiTCG Premium",   card: "Gardevoir ex SAR",  grade: "PSA 9",  amount: 28_000, time: "32分鐘前" },
  { id: "TX-005", buyer: "A.Yamamoto",seller:"NagoyaTCG",         card: "Espeon ex SAR",     grade: "BGS 9.5",amount: 31_200, time: "1小時前"  },
];

// TODO [MOCK DATA]: Replace with live health checks — ping each service endpoint and measure latency; update status in real-time
const systemStatus = [
  { service: "Next.js 應用伺服器",     status: "online"  as const, latency: "12ms"  },
  { service: "Supabase PostgreSQL",    status: "online"  as const, latency: "8ms"   },
  { service: "Stripe Webhooks",        status: "online"  as const, latency: "43ms"  },
  { service: "Mercari JP 爬蟲",        status: "online"  as const, latency: "—"     },
  { service: "TCGdex API",             status: "warning" as const, latency: "820ms" },
  { service: "Supabase Storage CDN",   status: "online"  as const, latency: "55ms"  },
];

export default function AdminOverviewPage() {
  return (
    <>
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex-1 min-w-0">
            <h1 className="font-sans font-bold text-[22px] text-text-primary">平台監控</h1>
            <p className="font-mono text-[12px] text-text-secondary mt-0.5">
              {/* TODO [MOCK DATA]: Replace hardcoded timestamp with real server time — use new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' }) or server-side Date */}
              最後更新：2025年 5月 21日 13:17 UTC+8
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
            <span className="font-mono text-[12px] text-success">系統運作正常</span>
          </div>
        </div>
        <div className="sm:hidden flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
          <span className="font-mono text-[11px] text-success">系統運作正常</span>
        </div>
      </div>

      {/* ── Platform Metrics ─────────────────────────────────────────── */}
      <section aria-labelledby="metrics-heading" className="mb-6">
        <h2 id="metrics-heading" className="sr-only">平台指標</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {platformMetrics.map(({ label, value, note, dir }) => (
            <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
              <p className="font-mono text-[11px] text-text-secondary mb-1.5">{label}</p>
              <p className={`font-mono font-bold text-[20px] leading-none mb-1 ${dir === "brand" ? "text-brand" : "text-text-primary"}`}>
                {value}
              </p>
              <p className={`font-mono text-[11px] ${dir === "up" ? "text-success" : "text-text-disabled"}`}>
                {note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6">
        {/* ── Left: Live Transactions ──────────────────────────────── */}
        <section aria-labelledby="live-tx-heading">
          <div className="flex items-center justify-between mb-3">
            <h2 id="live-tx-heading" className="font-sans font-semibold text-[16px] text-text-primary">
              即時成交流水
            </h2>
            <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" aria-hidden="true" />
              即時
            </span>
          </div>
          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
            {recentTransactions.map((tx, i) => (
              <div
                key={tx.id}
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-elevated transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-sans text-[13px] font-medium text-text-primary truncate">
                    {tx.card} <span className="font-mono text-[10px] text-text-secondary">{tx.grade}</span>
                  </p>
                  <p className="font-mono text-[11px] text-text-secondary">
                    {tx.buyer} → {tx.seller}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-[14px] text-text-primary">
                    ¥{tx.amount.toLocaleString("zh-TW")}
                  </p>
                  <p className="font-mono text-[11px] text-text-disabled">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Right: System Status ───────────────────────────────── */}
        <div className="mt-6 lg:mt-0 space-y-6">
          <section aria-labelledby="system-status-heading">
            <h2 id="system-status-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-3">
              系統狀態
            </h2>
            <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
              {systemStatus.map(({ service, status, latency }, i) => (
                <div
                  key={service}
                  className={`flex items-center justify-between px-4 py-3 ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${status === "online" ? "bg-success" : "bg-warning animate-pulse"}`}
                      aria-hidden="true"
                    />
                    <span className="font-sans text-[12px] text-text-secondary">{service}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[11px] text-text-disabled">{latency}</span>
                    <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                      status === "online" ? "text-success bg-[rgba(16,185,129,0.12)]" : "text-warning bg-[rgba(239,68,68,0.10)]"
                    }`}>
                      {status === "online" ? "正常" : "警告"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Quick stats */}
          <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-4">
            <h2 className="font-sans font-semibold text-[15px] text-text-primary mb-3">平台用戶統計</h2>
            {[
              { label: "總用戶數",         value: "3,842" },
              { label: "已驗證商戶",       value: "127" },
              { label: "待審核 KYC",       value: "8",  highlight: true },
              { label: "本月新增用戶",     value: "284" },
              { label: "活躍買家 (30天)",  value: "1,204" },
            ].map(({ label, value, highlight }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-[rgba(237,232,224,0.06)] last:border-0">
                <span className="font-sans text-[13px] text-text-secondary">{label}</span>
                <span className={`font-mono font-semibold text-[14px] ${highlight ? "text-warning" : "text-text-primary"}`}>
                  {value}
                </span>
              </div>
            ))}
          </section>
        </div>
      </div>
    </>
  );
}
