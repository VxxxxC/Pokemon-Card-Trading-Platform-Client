"use client";

import { useState } from "react";

interface KycApplication {
  id: string;
  applicantName: string;
  handle: string;
  shopName: string;
  submittedAt: string;
  docType: string;
  totalTrades: number;
  rating: number;
  status: "pending" | "approved" | "rejected";
}

const initialApplications: KycApplication[] = [
  { id: "KYC-2025-041", applicantName: "鈴木 Haruto", handle: "@haruto_tcg", shopName: "HarutoCards Premium", submittedAt: "2025/5/21 09:14", docType: "日本護照", totalTrades: 42, rating: 4.8, status: "pending" },
  { id: "KYC-2025-040", applicantName: "中村 Aiko", handle: "@aiko_collector", shopName: "AikoRare Collection", submittedAt: "2025/5/20 16:52", docType: "政府身份證", totalTrades: 18, rating: 4.6, status: "pending" },
  { id: "KYC-2025-039", applicantName: "渡辺 Ren", handle: "@ren_cards", shopName: "渡辺カード専門店", submittedAt: "2025/5/19 11:30", docType: "駕駛執照", totalTrades: 65, rating: 5.0, status: "pending" },
  { id: "KYC-2025-038", applicantName: "林 Wei-Chen", handle: "@weichen_tcg", shopName: "Taiwan x Japan TCG", submittedAt: "2025/5/18 14:05", docType: "商業登記證", totalTrades: 31, rating: 4.9, status: "pending" },
  { id: "KYC-2025-037", applicantName: "佐藤 Mio", handle: "@mio_pokéshop", shopName: "Mio PokéShop", submittedAt: "2025/5/17 09:22", docType: "日本護照", totalTrades: 12, rating: 4.5, status: "pending" },
  { id: "KYC-2025-036", applicantName: "高橋 Daichi", handle: "@daichi_rare", shopName: "Daichi Rare Cards", submittedAt: "2025/5/15 17:48", docType: "政府身份證", totalTrades: 89, rating: 4.95, status: "approved" },
  { id: "KYC-2025-034", applicantName: "伊藤 Nana", handle: "@nana_tcg", shopName: "NanaTCG 精品店", submittedAt: "2025/5/12 10:11", docType: "駕駛執照", totalTrades: 5, rating: 3.8, status: "rejected" },
];

const STATUS_CONFIG = {
  pending: { label: "待審核", className: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20" },
  approved: { label: "已批准", className: "text-success bg-[rgba(16,185,129,0.12)] border-success/20" },
  rejected: { label: "已拒絕", className: "text-text-secondary bg-bg-elevated border-transparent" },
};

export default function AdminMerchantsPage() {
  const [apps, setApps] = useState<KycApplication[]>(initialApplications);
  const [isOverrideLocked, setIsOverrideLocked] = useState(true);
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  const handleApprove = (id: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "approved" as const } : a))
    );
    showNotification(`已批准申請 ${id}，用戶已正式升級為商戶 (MERCHANT)。`);
  };

  const handleReject = (id: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: "rejected" as const } : a))
    );
    showNotification(`已駁回申請 ${id}，將通知用戶重新上載證照。`);
  };

  const handleToggleLock = () => {
    setIsOverrideLocked(!isOverrideLocked);
    showNotification(isOverrideLocked ? "⚠️ 管理員人工覆寫權限鎖已解除！" : "🔒 管理員人工覆寫權限鎖已重新啟用。");
  };

  const pendingCount = apps.filter((a) => a.status === "pending").length;
  const approvedCount = apps.filter((a) => a.status === "approved").length;
  const rejectedCount = apps.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">商戶與 KYC 審查</h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            管理 Stripe KYC 狀態、商戶提現證照人工複審、以及特殊權限變更覆寫控制
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[12px] text-warning bg-[rgba(239,68,68,0.10)] border border-warning/25 px-3 py-1.5 rounded-xl shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" aria-hidden="true" />
            {pendingCount} 件待處理
          </span>
        )}
      </div>

      {/* ── Notification Toast ────────────────────────────────────────── */}
      {notif && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#2e2925] border-l-4 border-brand px-4 py-3 rounded shadow-xl animate-fade-in">
          <span className="text-brand font-sans text-sm">✦</span>
          <span className="font-sans text-xs text-text-primary">{notif}</span>
        </div>
      )}

      {/* ── Stripe KYC 狀態牆 ───────────────────────────────────────── */}
      <section aria-labelledby="status-wall-heading">
        <h2 id="status-wall-heading" className="font-sans font-semibold text-[15px] text-text-secondary mb-3">
          Stripe KYC 全局狀態牆
        </h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "待審核 (PENDING)", value: pendingCount, color: "text-warning", bg: "bg-[rgba(239,68,68,0.02)] border-warning/15" },
            { label: "已驗證商戶 (VERIFIED)", value: approvedCount, color: "text-success", bg: "bg-[rgba(16,185,129,0.02)] border-success/15" },
            { label: "被拒絕/失效 (REJECTED)", value: rejectedCount, color: "text-text-secondary", bg: "bg-bg-card border-[rgba(237,232,224,0.08)]" },
          ].map(({ label, value, color, bg }) => (
            <div key={label} className={`rounded-2xl border p-4 text-center transition-all ${bg}`}>
              <p className={`font-mono font-bold text-[26px] ${color}`}>{value}</p>
              <p className="font-mono text-[11px] text-text-secondary mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
        {/* ── Left Column: 商戶證照人工複審面板 ──────────────────────── */}
        <section aria-labelledby="applications-heading" className="space-y-4">
          <h2 id="applications-heading" className="font-sans font-bold text-[16px] text-text-primary">
            商戶證照人工複審面板
          </h2>
          <div className="space-y-3">
            {apps.map((app) => {
              const { label, className } = STATUS_CONFIG[app.status];
              const isPending = app.status === "pending";
              return (
                <div
                  key={app.id}
                  className={`bg-bg-card rounded-2xl border p-4 transition-colors ${
                    isPending ? "border-[rgba(212,165,116,0.18)]" : "border-[rgba(237,232,224,0.08)]"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
                      <div className="flex items-center gap-4 mt-1.5 flex-wrap">
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

                    {/* Review Actions */}
                    <div className="flex flex-col gap-2 shrink-0 self-end sm:self-start">
                      <button
                        type="button"
                        onClick={() => showNotification(`正在下載並展示 ${app.id} 的 ${app.docType} 證照文件...`)}
                        className="flex items-center justify-center gap-1.5 h-9 px-3 bg-bg-elevated border border-[rgba(237,232,224,0.12)] rounded-xl font-mono text-[11px] text-text-secondary hover:text-text-primary transition-colors"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                        </svg>
                        查看複審文件
                      </button>

                      {isPending && (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => handleApprove(app.id)}
                            className="flex-1 h-9 px-3 bg-success text-[#111] font-sans font-semibold text-[12px] rounded-xl hover:bg-success/90 active:scale-[0.98] transition-all"
                          >
                            ✓ 批准
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(app.id)}
                            className="flex-1 h-9 px-3 bg-[rgba(239,68,68,0.10)] text-warning font-sans font-medium text-[12px] rounded-xl border border-warning/20 hover:bg-[rgba(239,68,68,0.18)] active:scale-[0.98] transition-all"
                          >
                            ✕ 駁回
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

        {/* ── Right Column: 管理員人工覆寫權限鎖 ──────────────────────── */}
        <section aria-labelledby="override-heading" className="space-y-4">
          <h2 id="override-heading" className="font-sans font-bold text-[16px] text-text-primary">
            特權與安全設定
          </h2>

          <div className="bg-[rgba(239,68,68,0.04)] rounded-2xl border border-warning/20 p-5 space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-warning text-[18px]">⚠️</span>
                <h3 className="font-sans font-semibold text-[14px] text-warning">
                  管理員人工覆寫權限鎖
                </h3>
              </div>
              <p className="font-sans text-[12px] text-text-secondary leading-relaxed">
                解鎖後，可對個別商戶進行權限手動升級、封禁、或免去 KYC 檢查直接開啟提現。此特權操作將留下審計日誌 (Audit Logs)。
              </p>
            </div>

            <div className="bg-bg-card rounded-xl border border-[rgba(239,68,68,0.15)] p-4 flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-text-disabled uppercase block">覆寫安全狀態</span>
                <span className={`font-sans font-bold text-[13px] ${isOverrideLocked ? "text-success" : "text-warning"}`}>
                  {isOverrideLocked ? "🔒 安全鎖定中" : "🔓 已解除安全鎖"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleLock}
                className={`h-9 px-4 font-sans font-semibold text-[11px] rounded-xl border transition-all active:scale-[0.98] ${
                  isOverrideLocked
                    ? "bg-[rgba(239,68,68,0.10)] text-warning border-warning/20 hover:bg-[rgba(239,68,68,0.15)]"
                    : "bg-success text-[#111] border-transparent hover:bg-success/90"
                }`}
              >
                {isOverrideLocked ? "解除安全鎖" : "重啟安全鎖"}
              </button>
            </div>

            {!isOverrideLocked && (
              <div className="bg-bg-card rounded-xl border border-[rgba(237,232,224,0.08)] p-4 space-y-3 animate-fade-in">
                <span className="font-sans font-semibold text-[12px] text-text-primary block">
                  特權指令執行
                </span>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="輸入商戶 ID (例: USR-0002)..."
                    className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-lg px-3 font-mono text-[11px] text-text-primary placeholder-text-disabled focus:outline-none"
                  />
                  <select className="w-full h-9 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-lg px-2 font-sans text-[11px] text-text-secondary focus:outline-none appearance-none">
                    <option>升級為 MERCHANT (商戶)</option>
                    <option>降級為 USER (一般會員)</option>
                    <option>強制免 KYC 提現</option>
                    <option>強制封禁其 Stripe Connect 帳戶</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => showNotification("特權指令已執行！")}
                    className="w-full h-9 bg-warning text-[#17130f] font-sans font-bold text-[11px] rounded-lg active:scale-[0.98] hover:bg-warning/90 transition-all"
                  >
                    🚀 執行特權覆寫
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
