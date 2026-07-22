"use client";

import { useState } from "react";

// Types for components
interface WithdrawalRequest {
  id: string;
  merchantName: string;
  amount: number;
  bankName: string;
  bankAccount: string;
  fpsId: string;
  status: "pending" | "processing" | "completed" | "failed";
  submittedAt: string;
}

interface StripePayoutFlow {
  id: string;
  subAccountId: string;
  merchantName: string;
  amount: number;
  status: "succeeded" | "pending" | "failed";
  time: string;
}

// Initial mock data
const initialWithdrawals: WithdrawalRequest[] = [
  { id: "WD-1002", merchantName: "KojiTCG Premium", amount: 48500, bankName: "恒生銀行 (024)", bankAccount: "382-849-***-001", fpsId: "10283472", status: "pending", submittedAt: "2025/5/21 10:30" },
  { id: "WD-1003", merchantName: "TokyoRareCards", amount: 32400, bankName: "匯豐銀行 (004)", bankAccount: "848-204-***-882", fpsId: "94829374", status: "pending", submittedAt: "2025/5/20 15:45" },
  { id: "WD-1004", merchantName: "OsakaPokéCards", amount: 15600, bankName: "渣打銀行 (003)", bankAccount: "294-118-***-002", fpsId: "84729110", status: "pending", submittedAt: "2025/5/20 18:22" },
  { id: "WD-1005", merchantName: "NagoyaTCG", amount: 62000, bankName: "中國銀行 (012)", bankAccount: "937-228-***-119", fpsId: "37482910", status: "pending", submittedAt: "2025/5/19 11:15" },
  { id: "WD-1001", merchantName: "Taiwan x Japan TCG", amount: 19800, bankName: "匯豐銀行 (004)", bankAccount: "582-938-***-203", fpsId: "19384720", status: "completed", submittedAt: "2025/5/14 09:00" },
];

const initialStripeFlows: StripePayoutFlow[] = [
  { id: "ST-8812", subAccountId: "acct_1NfG82H", merchantName: "HarutoCards Premium", amount: 12400, status: "succeeded", time: "5分鐘前" },
  { id: "ST-8813", subAccountId: "acct_1MeF83J", merchantName: "AikoRare Collection", amount: 8200, status: "succeeded", time: "18分鐘前" },
  { id: "ST-8814", subAccountId: "acct_1KyT92K", merchantName: "Daichi Rare Cards", amount: 24500, status: "pending", time: "1小時前" },
  { id: "ST-8815", subAccountId: "acct_1NfG82H", merchantName: "HarutoCards Premium", amount: 5600, status: "succeeded", time: "3小時前" },
];

const STATUS_BADGES = {
  pending: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
  processing: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  completed: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
  failed: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
};

export default function AdminPayoutsPage() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>(initialWithdrawals);
  const [stripeFlows] = useState<StripePayoutFlow[]>(initialStripeFlows);
  const [notif, setNotif] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 4000);
  };

  const handleAction = (id: string, newStatus: "completed" | "processing" | "failed") => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w))
    );
    const actionLabel = newStatus === "completed" ? "手動銷帳成功" : newStatus === "processing" ? "已開始處理" : "已標記失敗";
    showNotification(`提現單 ${id} ${actionLabel}`);
  };

  const handleExportCSV = () => {
    // Generate simple mock CSV export file
    const headers = "提現單號,商戶名稱,提現金額(HK$),銀行名稱,銀行賬號,FPS ID,提交時間,狀態\n";
    const rows = withdrawals
      .filter((w) => w.status === "pending")
      .map(
        (w) =>
          `${w.id},"${w.merchantName}",${w.amount},"${w.bankName}","${w.bankAccount}","${w.fpsId}","${w.submittedAt}",${w.status}`
      )
      .join("\n");
    const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute("download", `HKCV_Payout_Export_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification("已成功導出待處理 FPS Payout CSV 文件！");
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ───────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-sans font-bold text-[24px] text-text-primary">財務與結算管控台</h1>
          <p className="font-sans text-[13px] text-text-secondary mt-0.5">
            人手 FPS 結算批處理、Stripe Connect 自動撥款流水及商戶總賬戶餘額監控
          </p>
        </div>
      </div>

      {/* ── Notification Toast ────────────────────────────────────────── */}
      {notif && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#2e2925] border-l-4 border-success px-4 py-3 rounded shadow-xl animate-fade-in">
          <span className="text-success font-sans text-sm">✓</span>
          <span className="font-sans text-xs text-text-primary">{notif}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left Section: 每週五人手 FPS 批處理 ────────────────────── */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="font-sans font-bold text-[16px] text-text-primary">
                  每週五人手 FPS 批處理
                </h2>
                <p className="font-sans text-[12px] text-text-secondary mt-0.5">
                  處理商戶申請的本地銀行 FPS 提現請求（免手續費）
                </p>
              </div>
              <button
                onClick={handleExportCSV}
                className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-[12px] rounded-xl hover:bg-brand-hover active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                導出 Payout CSV
              </button>
            </div>

            <div className="space-y-3">
              {withdrawals.map((w) => {
                const isPending = w.status === "pending";
                return (
                  <div
                    key={w.id}
                    className={`bg-bg-page rounded-xl border p-4 transition-colors ${
                      isPending ? "border-[rgba(212,165,116,0.15)]" : "border-[rgba(237,232,224,0.06)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-mono text-[10px] text-text-disabled">#{w.id}</span>
                          <span className="font-sans font-semibold text-[14px] text-text-primary">
                            {w.merchantName}
                          </span>
                          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded border ${STATUS_BADGES[w.status]}`}>
                            {w.status === "pending" ? "待處理" : w.status === "completed" ? "已完成" : "處理中"}
                          </span>
                        </div>
                        <div className="font-mono text-[11px] text-text-secondary space-y-0.5">
                          <p>銀行：{w.bankName}</p>
                          <p>賬號：{w.bankAccount}</p>
                          <p>FPS ID: <span className="text-brand font-bold">{w.fpsId}</span></p>
                          <p className="text-[10px] text-text-disabled">提交時間：{w.submittedAt}</p>
                        </div>
                      </div>

                      <div className="text-right shrink-0 flex flex-col items-end gap-2">
                        <div>
                          <span className="font-mono text-[10px] text-text-disabled block uppercase">提現金額</span>
                          <span className="font-mono font-bold text-[16px] text-text-primary">
                            HK$ {w.amount.toLocaleString("zh-TW")}
                          </span>
                        </div>

                        {isPending && (
                          <div className="flex gap-1.5 mt-1">
                            <button
                              onClick={() => handleAction(w.id, "completed")}
                              className="h-8 px-3 bg-success text-[#111] font-sans font-bold text-[11px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform"
                            >
                              ✓ 銷帳
                            </button>
                            <button
                              onClick={() => handleAction(w.id, "failed")}
                              className="h-8 px-3 bg-[rgba(239,68,68,0.10)] text-warning font-mono text-[11px] rounded-lg border border-warning/20 hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.98] transition-transform"
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
          </div>
        </section>

        {/* ── Right Section: Stripe Connect 流水監控 ─────────────────── */}
        <section className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between">
          <div>
            <h2 className="font-sans font-bold text-[16px] text-text-primary mb-1">
              Stripe Connect 流水監控
            </h2>
            <p className="font-sans text-[12px] text-text-secondary mb-4">
              即時統計 Stripe Connect 商戶子賬戶（自動拆賬）與平台的結算資金
            </p>

            {/* Merchant Balances Metric card */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-bg-page rounded-xl border border-[rgba(237,232,224,0.06)] p-3">
                <span className="font-mono text-[10px] text-text-disabled block uppercase">Stripe 子帳戶總餘額</span>
                <p className="font-mono font-bold text-[18px] text-text-primary mt-0.5">
                  HK$ 1,482,900
                </p>
                <p className="font-mono text-[10px] text-text-disabled mt-0.5">
                  ● 382 個聯網帳戶
                </p>
              </div>
              <div className="bg-bg-page rounded-xl border border-[rgba(237,232,224,0.06)] p-3">
                <span className="font-mono text-[10px] text-text-disabled block uppercase">自動待結算資金</span>
                <p className="font-mono font-bold text-[18px] text-brand mt-0.5">
                  HK$ 392,100
                </p>
                <p className="font-mono text-[10px] text-text-disabled mt-0.5">
                  ● 48 小時內自動發放
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="font-sans font-semibold text-[13px] text-text-secondary mb-2">
                自動拆賬流水 (Stripe Transfers)
              </h3>
              <div className="bg-bg-page rounded-xl border border-[rgba(237,232,224,0.06)] overflow-hidden">
                {stripeFlows.map((flow, i) => (
                  <div
                    key={flow.id}
                    className={`flex items-center justify-between gap-4 px-4 py-3 ${
                      i > 0 ? "border-t border-[rgba(237,232,224,0.06)]" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="font-sans font-semibold text-[13px] text-text-primary">
                          {flow.merchantName}
                        </span>
                        <span className="font-mono text-[9px] text-text-disabled">({flow.subAccountId})</span>
                      </div>
                      <p className="font-mono text-[10px] text-text-disabled">流水號：{flow.id} · {flow.time}</p>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-3">
                      <div>
                        <p className="font-mono font-semibold text-[13px] text-text-primary">
                          +HK$ {flow.amount.toLocaleString("zh-TW")}
                        </p>
                        <p className="font-mono text-[9px] text-success text-right">自動劃撥</p>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${flow.status === "succeeded" ? "bg-success" : "bg-warning animate-pulse"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
