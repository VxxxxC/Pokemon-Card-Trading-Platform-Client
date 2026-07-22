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
  ],
  activeRatio: "64.2%",
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

// 精簡後的 3 大核心服務監控
const systemServices = [
  {
    name: "後台服務器",
    status: "online" as const,
    latency: "28ms",
  },
  { name: "爬蟲引擎", status: "online" as const, latency: "142ms" },
  { name: "Stripe API", status: "online" as const, latency: "85ms" },
];

const systemDisputes = {
  unprocessed: 5,
  critical: 2,
};

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">
            數據總覽
          </h1>
          <p className="font-mono text-[12px] text-text-secondary mt-0.5">
            最後更新：
            {new Date().toLocaleDateString("zh-TW", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}{" "}
            13:17 UTC+8
          </p>
        </div>
      </div>

      {/* ── 3-Grid Metric Sub-panels ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* PANEL 1: 用戶生態大盤 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">
                👤 用戶生態大盤
              </h2>
              <span className="font-mono text-[11px] text-success bg-[rgba(16,185,129,0.12)] px-2 py-0.5 rounded-full">
                活躍用戶比率 {userEcology.activeRatio}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">
                總註冊用戶量
              </span>
              <p className="font-mono font-bold text-[28px] text-text-primary leading-none mt-1">
                {userEcology.totalUsers}
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">
              身份動態分佈
            </span>
            {userEcology.distribution.map((item) => (
              <div
                key={item.role}
                className="flex justify-between font-mono text-[11px]"
              >
                <span className="text-text-secondary truncate max-w-[140px]">
                  {item.role}
                </span>
                <span className="text-text-primary font-medium">
                  {item.count}{" "}
                  <span className="text-text-disabled text-[9px] font-normal">
                    ({item.pct})
                  </span>
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* PANEL 2: 交易所交易量分析 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">
                💰 交易所交易量分析
              </h2>
              <span className="font-mono text-[11px] text-success">
                {marketVolume.growthRate}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">
                全平台 GMV (總額)
              </span>
              <p className="font-mono font-bold text-[28px] text-brand leading-none mt-1">
                {marketVolume.totalGmv}
              </p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">
                本月 GMV: {marketVolume.monthlyGmv}
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">
              現貨與交易狀態
            </span>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">已成交數量</span>
              <span className="text-text-primary font-medium">
                {marketVolume.totalSettledCount}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">賣方總現貨量</span>
              <span className="text-text-primary font-medium">
                {marketVolume.sellerPool.totalListings}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">活躍現貨量</span>
              <span className="text-text-primary font-medium">
                {marketVolume.sellerPool.activeListings}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">均價</span>
              <span className="text-text-primary font-medium">
                {marketVolume.sellerPool.averageListingPrice}
              </span>
            </div>
          </div>
        </section>

        {/* PANEL 3: 平台淨營收統計 */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-sans font-semibold text-[14px] text-text-secondary">
                📈 平台淨營收統計
              </h2>
              <span className="font-mono text-[11px] text-brand bg-[rgba(212,165,116,0.12)] px-2 py-0.5 rounded-full">
                佣金率 {revenues.commissionRate}
              </span>
            </div>
            <div className="mb-4">
              <span className="font-mono text-[10px] text-text-disabled uppercase block">
                累計純佣金收入
              </span>
              <p className="font-mono font-bold text-[28px] text-text-primary leading-none mt-1">
                {revenues.totalCommission}
              </p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">
                本月佣金: {revenues.monthlyCommission}
              </p>
            </div>
          </div>
          <div className="border-t border-[rgba(237,232,224,0.06)] pt-3 space-y-1.5">
            <span className="font-mono text-[10px] text-text-disabled block">
              專項資金池
            </span>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">鑑定費資金池</span>
              <span className="text-text-success font-medium">
                {revenues.appraisalPool}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">已鑑定卡數</span>
              <span className="text-text-primary font-medium">
                {revenues.totalAppraisals} 筆
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">單件鑑定費</span>
              <span className="text-text-primary font-medium">
                {revenues.appraisalFeePerCard}
              </span>
            </div>
            <div className="flex justify-between font-mono text-[11px]">
              <span className="text-text-secondary">流動結算池</span>
              <span className="text-text-primary font-medium">
                {revenues.netPayoutPool}
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* ── 系統運作狀態：精簡 3 大服務橫向 Status Bar ────────────────── */}
      <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h2 className="font-sans font-semibold text-[14px] text-text-secondary">
            🤖 系統運作狀態
          </h2>
          <span
            className={`font-mono text-[11px] px-2.5 py-1 rounded-full w-fit ${
              systemDisputes.unprocessed > 0
                ? "text-warning bg-[rgba(239,68,68,0.10)] border border-warning/20"
                : "text-success bg-[rgba(16,185,129,0.12)]"
            }`}
          >
            未處理舉報 {systemDisputes.unprocessed} 件（緊急{" "}
            {systemDisputes.critical} 件）
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {systemServices.map((service) => (
            <div
              key={service.name}
              className="bg-bg-page rounded-xl border border-[rgba(237,232,224,0.06)] px-4 py-3 flex items-center justify-between"
            >
              <span className="font-sans text-[13px] font-medium text-text-primary">
                {service.name}
              </span>
              <span className="font-mono text-[12px] text-success font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                正常 {service.latency}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
