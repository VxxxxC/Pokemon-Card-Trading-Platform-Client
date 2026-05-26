import type { Metadata } from "next";
import type { KycStatus } from "@/app/lib/types/rbac";

export const metadata: Metadata = {
  title: "審核中心 — PokéTrade JP 後台",
  description: "審核商戶 KYC 申請，管理 PENDING_MERCHANT 狀態",
};

interface KycApplication {
  id: string;
  applicantName: string;
  handle: string;
  shopName: string;
  submittedAt: string;
  docType: string;
  totalTrades: number;
  rating: number;
  status: KycStatus;
}

// TODO [database]: Replace with Supabase query — fetch KYC applications from `kyc_applications` table where status IN ('pending', 'approved', 'rejected'), ordered by submitted_at DESC
const applications: KycApplication[] = [
  { id: "KYC-2025-041", applicantName: "鈴木 Haruto",   handle: "@haruto_tcg",    shopName: "HarutoCards Premium",   submittedAt: "2025/5/21 09:14", docType: "日本護照",     totalTrades: 42, rating: 4.8, status: "pending" },
  { id: "KYC-2025-040", applicantName: "中村 Aiko",     handle: "@aiko_collector", shopName: "AikoRare Collection",   submittedAt: "2025/5/20 16:52", docType: "政府身份證",   totalTrades: 18, rating: 4.6, status: "pending" },
  { id: "KYC-2025-039", applicantName: "渡辺 Ren",      handle: "@ren_cards",      shopName: "渡辺カード専門店",       submittedAt: "2025/5/19 11:30", docType: "駕駛執照",     totalTrades: 65, rating: 5.0, status: "pending" },
  { id: "KYC-2025-038", applicantName: "林 Wei-Chen",   handle: "@weichen_tcg",    shopName: "Taiwan x Japan TCG",    submittedAt: "2025/5/18 14:05", docType: "商業登記證",   totalTrades: 31, rating: 4.9, status: "pending" },
  { id: "KYC-2025-037", applicantName: "佐藤 Mio",      handle: "@mio_pokéshop",   shopName: "Mio PokéShop",          submittedAt: "2025/5/17 09:22", docType: "日本護照",     totalTrades: 12, rating: 4.5, status: "pending" },
  { id: "KYC-2025-036", applicantName: "高橋 Daichi",   handle: "@daichi_rare",    shopName: "Daichi Rare Cards",     submittedAt: "2025/5/15 17:48", docType: "政府身份證",   totalTrades: 89, rating: 4.95, status: "approved" },
  { id: "KYC-2025-034", applicantName: "伊藤 Nana",     handle: "@nana_tcg",       shopName: "NanaTCG 精品店",         submittedAt: "2025/5/12 10:11", docType: "駕駛執照",     totalTrades:  5, rating: 3.8, status: "rejected" },
];

const STATUS_CONFIG: Record<KycStatus, { label: string; className: string }> = {
  pending:  { label: "待審核",  className: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20"  },
  approved: { label: "已批准",  className: "text-success bg-[rgba(16,185,129,0.12)] border-success/20" },
  rejected: { label: "已拒絕",  className: "text-text-secondary bg-bg-elevated border-transparent"     },
};

export default function AdminApprovalsPage() {
  const pendingCount  = applications.filter((a) => a.status === "pending").length;
  const approvedCount = applications.filter((a) => a.status === "approved").length;
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h1 className="font-sans font-bold text-[22px] text-text-primary">審核中心</h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            處理商戶 KYC 申請，批准後用戶角色升級為 MERCHANT
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-warning bg-[rgba(239,68,68,0.10)] border border-warning/25 px-3 py-1.5 rounded-xl shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            {pendingCount} 件待審核
          </span>
        )}
      </div>

      {/* ── Stats Bar ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        {[
          { label: "待審核", value: pendingCount,  color: "text-warning" },
          { label: "已批准", value: approvedCount, color: "text-success" },
          { label: "已拒絕", value: rejectedCount, color: "text-text-secondary" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] px-4 py-3 text-center">
            <p className={`font-mono font-bold text-[24px] ${color}`}>{value}</p>
            <p className="font-mono text-[11px] text-text-secondary mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Applications List ─────────────────────────────────────────── */}
      <section aria-labelledby="applications-heading">
        <h2 id="applications-heading" className="font-sans font-semibold text-[16px] text-text-primary mb-4">
          申請列表
        </h2>
        <div className="space-y-3">
          {applications.map((app) => {
            const { label, className } = STATUS_CONFIG[app.status];
            const isPending = app.status === "pending";
            return (
              <div
                key={app.id}
                className={`bg-bg-card rounded-2xl border p-4 transition-colors ${
                  isPending ? "border-[rgba(212,165,116,0.20)]" : "border-[rgba(237,232,224,0.08)]"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-sans text-[15px] font-semibold text-text-primary">
                        {app.shopName}
                      </p>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded-full border ${className}`}>
                        {label}
                      </span>
                    </div>
                    <p className="font-sans text-[13px] text-text-secondary">
                      申請人：{app.applicantName} ({app.handle})
                    </p>
                    <div className="flex items-center gap-4 mt-1.5">
                      <span className="font-mono text-[11px] text-text-disabled">#{app.id}</span>
                      <span className="font-mono text-[11px] text-text-disabled">提交：{app.submittedAt}</span>
                      <span className="font-mono text-[11px] text-text-secondary">證件：{app.docType}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="font-mono text-[11px] text-text-secondary">
                        累計成交 {app.totalTrades} 筆
                      </span>
                      <span className="font-mono text-[11px] text-text-secondary">
                        評分 ★ {app.rating}
                      </span>
                    </div>
                  </div>

                  {/* Document + Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* TODO [server]: Fetch and display uploaded KYC document from Supabase Storage — call supabase.storage.from('kyc-docs').createSignedUrl(app.id) */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-3 py-2 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl font-mono text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                        <polyline points="14 2 14 8 20 8" />
                      </svg>
                      查看文件
                    </button>

                    {isPending && (
                      <div className="flex gap-2">
                        {/* TODO [server]: "批准" must call server action — update kyc_applications.status = 'approved' + update profiles.role = 'MERCHANT' in Supabase, then send confirmation email */}
                        <button
                          type="button"
                          className="flex-1 h-9 bg-success/90 text-[#111] font-sans font-semibold text-[12px] rounded-xl hover:bg-success active:scale-[0.98] transition-all"
                        >
                          ✓ 批准
                        </button>
                        {/* TODO [server]: "拒絕" must call server action — update kyc_applications.status = 'rejected' + send rejection email with reason */}
                        <button
                          type="button"
                          className="flex-1 h-9 bg-[rgba(239,68,68,0.10)] text-warning font-sans font-medium text-[12px] rounded-xl border border-warning/20 hover:bg-[rgba(239,68,68,0.18)] active:scale-[0.98] transition-all"
                        >
                          ✕ 拒絕
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
