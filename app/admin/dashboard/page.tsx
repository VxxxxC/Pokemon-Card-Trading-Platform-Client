import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "數據總覽 — HKCardVault 後台",
  description: "全平台用戶生態、交易量、營收及系統健康度實時監控",
};

// Mock data definitions
const userEcology = {
  totalUsers: "4,829",
  bannedUsers: "14",
  distribution: [
    { role: "一般會員 (USER)", count: "4,215", pct: "87.3%" },
    { role: "認證商戶 (MERCHANT)", count: "487", pct: "10.1%" },
    { role: "待審核商戶", count: "118", pct: "2.4%" },
    { role: "管理員 (ADMIN)", count: "9", pct: "0.2%" },
  ],
  activeRatio: "64.2%",
  dau: "1,204",
  mau: "3,102",
};

const marketVolume = {
  totalGmv: "HK$24,840,000",
  monthlyGmv: "HK$3,842,000",
  growthRate: "▲ +28.4% vs 上月",
  totalSettledCount: "2,842 筆",
  pendingSettledCount: "148 筆",
  sellerPool: {
    totalListings: "18,402 件",
    activeListings: "12,104 件",
    averageListingPrice: "HK$2,050",
  },
};

const revenues = {
  totalCommission: "HK$1,242,000",
  monthlyCommission: "HK$192,100",
  commissionRate: "5.0%",
  appraisalPool: "HK$482,000",
  appraisalFeePerCard: "HK$150",
  totalAppraisals: "3,213 筆",
  netPayoutPool: "HK$320,400",
};

const systemHealth = {
  snkrdunkScraper: {
    status: "online" as const,
    latency: "124ms",
    lastRun: "12分鐘前",
    healthRate: "99.98%",
  },
  unprocessedDisputes: 5,
  criticalDisputes: 2,
};

const recentTransactions = [
  { id: "TX-001", buyer: "M.佐藤", seller: "KojiTCG Premium", card: "Charizard ex SAR", grade: "PSA 10", amount: 49800, currency: "JPY", time: "2分鐘前" },
  { id: "TX-002", buyer: "C.Chen", seller: "TokyoRareCards", card: "Umbreon ex SAR", grade: "BGS 9", amount: 38200, currency: "JPY", time: "8分鐘前" },
  { id: "TX-003", buyer: "K.田中", seller: "OsakaPokéCards", card: "Mew ex SAR", grade: "PSA 10", amount: 44500, currency: "JPY", time: "15分鐘前" },
  { id: "TX-004", buyer: "R.Suzuki", seller: "KojiTCG Premium", card: "Gardevoir ex SAR", grade: "PSA 9", amount: 28000, currency: "JPY", time: "32分鐘前" },
  { id: "TX-005", buyer: "A.Yamamoto", seller: "NagoyaTCG", card: "Espeon ex SAR", grade: "BGS 9.5", amount: 31200, currency: "JPY", time: "1小時前" },
];

const systemStatusList = [
  { service: "Next.js 應用伺服器", status: "online" as const, latency: "12ms" },
  { service: "Supabase PostgreSQL", status: "online" as const, latency: "8ms" },
  { service: "Stripe Webhooks", status: "online" as const, latency: "43ms" },
  { service: "SNKRDUNK API 爬蟲", status: "online" as const, latency: "124ms" },
  { service: "TCGdex API", status: "warning" as const, latency: "820ms" },
  { service: "Supabase Storage CDN", status: "online" as const, latency: "55ms" },
];

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">數據總覽</h1>
          <p className="font-mono text-[12px] text-text-secondary mt-0.5">
            最後更新：{new Date().toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" })} 13:17 UTC+8
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 bg-bg-card px-3 py-1.5 rounded-xl border border-[rgba(237,232,224,0.08)]">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" aria-hidden="true" />
          <span className="font-mono text-[12px] text-success">全系統運作正常</span>
        </div>
      </div>

      {/* ── 4-Grid Metric Sub-panels ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* PANEL 1: 用戶生態大盤 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">👤 用戶生態大盤</h2>
              <span className="font-mono text-[11px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-full">
                活躍度 {userEcology.activeRatio}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">總註冊用戶量</span>
              <p className="font-mono font-bold text-[28px] text-text-primary leading-none mt-1">
                {userEcology.totalUsers}
              </p>
              <div className="flex gap-4 mt-2 text-text-secondary font-mono text-[11px]">
                <span>DAU: {userEcology.dau}</span>
                <span>MAU: {userEcology.mau}</span>
              </div>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">身份動態分佈</span>
            {userEcology.distribution.map((item) => (
              <div key={item.role} className="flex justify-between font-mono text-[11px]">
                <span className="text-text-secondary truncate max-w-[140px]">{item.role}</span>
                <span className="text-text-primary font-medium">{item.count} <span className="text-text-disabled text-[9px] font-normal">({item.pct})</span></span>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 2: 交易所交易量分析 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">💰 交易所交易量分析</h2>
              <span className="font-mono text-[11px] text-success">
                {marketVolume.growthRate}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">全平台 GMV (總額)</span>
              <p className="font-mono font-bold text-[28px] text-brand leading-none mt-1">
                {marketVolume.totalGmv}
              </p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">
                本月 GMV: {marketVolume.monthlyGmv}
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">現貨與交易狀態</span>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">已成交數量</span>
              <span className="text-text-primary font-medium">{marketVolume.totalSettledCount}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">賣方總現貨量</span>
              <span className="text-text-primary font-medium">{marketVolume.sellerPool.totalListings}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">活躍現貨量</span>
              <span className="text-text-primary font-medium">{marketVolume.sellerPool.activeListings}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">均價</span>
              <span className="text-text-primary font-medium">{marketVolume.sellerPool.averageListingPrice}</span>
            </div>
          </div>
        </section>

        {/* PANEL 3: 平台淨營收統計 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">📈 平台淨營收統計</h2>
              <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] px-2 py-0.5 rounded-full">
                佣金率 {revenues.commissionRate}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">累計純佣金收入</span>
              <p className="font-mono font-bold text-[28px] text-text-primary leading-none mt-1">
                {revenues.totalCommission}
              </p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">
                本月佣金: {revenues.monthlyCommission}
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">專項資金池</span>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">鑑定費資金池</span>
              <span className="text-text-success font-medium">{revenues.appraisalPool}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">已鑑定卡數</span>
              <span className="text-text-primary font-medium">{revenues.totalAppraisals} 筆</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">單件鑑定費</span>
              <span className="text-text-primary font-medium">{revenues.appraisalFeePerCard}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">流動結算池</span>
              <span className="text-text-primary font-medium">{revenues.netPayoutPool}</span>
            </div>
          </div>
        </section>

        {/* PANEL 4: 系統運作狀態 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">🤖 系統運作狀態</h2>
              <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded ${
                systemHealth.snkrdunkScraper.status === "online" ? "text-success bg-[rgba(16,185,129,0.12)]" : "text-warning"
              }`}>
                ● 爬蟲正常
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">未處理緊急舉報數</span>
              <p className={`font-mono font-bold text-[28px] leading-none mt-1 ${systemHealth.unprocessedDisputes > 0 ? "text-warning" : "text-text-primary"}`}>
                {systemHealth.unprocessedDisputes} 件
              </p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">
                包含緊急仲裁: {systemHealth.criticalDisputes} 件
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">SNKRDUNK 爬蟲指標</span>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">接口健康度</span>
              <span className="text-success font-medium">{systemHealth.snkrdunkScraper.healthRate}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">接口延遲</span>
              <span className="text-text-primary font-medium">{systemHealth.snkrdunkScraper.latency}</span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">上次同步</span>
              <span className="text-text-primary font-medium">{systemHealth.snkrdunkScraper.lastRun}</span>
            </div>
          </div>
        </section>
      </div>

      {/* ── Live Flow Lists (Migrated from app/admin/page.tsx) ─────────── */}
      <div className="lg:grid lg:grid-cols-[3fr_2fr] lg:gap-6">
        {/* Left: Live Transactions */}
        <section aria-labelledby="live-tx-heading" className="space-y-3">
          <div className="flex items-center justify-between">
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
                className={`flex items-center gap-3 px-4 py-3.5 hover:bg-bg-hover transition-colors ${i > 0 ? "border-t border-[rgba(237,232,224,0.08)]" : ""}`}
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
                    {tx.currency} {tx.amount.toLocaleString("zh-TW")}
                  </p>
                  <p className="font-mono text-[11px] text-text-disabled">{tx.time}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right: System Status */}
        <section aria-labelledby="system-status-heading" className="space-y-3 mt-6 lg:mt-0">
          <h2 id="system-status-heading" className="font-sans font-semibold text-[16px] text-text-primary">
            系統運作狀態
          </h2>
          <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
            {systemStatusList.map(({ service, status, latency }, i) => (
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
      </div>
    </div>
  );
}
