"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ── Types Definitions ────────────────────────────────────────────────────────
interface WithdrawalRequest {
  id: string;
  userName: string;
  amount: number;
  fpsId: string;
  status: "pending" | "processing" | "completed" | "failed";
  submittedAt: string;
}

interface MerchantStripeAccount {
  id: string;
  subAccountId: string;
  merchantName: string;
  balance: number;
  totalPayout: number;
  platformCommission: number;
  status: "active" | "restricted";
}

// ── Initial Mock Data ────────────────────────────────────────────────────────
const initialWithdrawals: WithdrawalRequest[] = [
  {
    id: "WD-1002",
    userName: "KojiTCG_Collector",
    amount: 48500,
    fpsId: "10283472",
    status: "pending",
    submittedAt: "2025/5/21 10:30",
  },
  {
    id: "WD-1003",
    userName: "TokyoRare_HongKong",
    amount: 32400,
    fpsId: "94829374",
    status: "pending",
    submittedAt: "2025/5/20 15:45",
  },
  {
    id: "WD-1004",
    userName: "OsakaPoke_Alex",
    amount: 15600,
    fpsId: "84729110",
    status: "pending",
    submittedAt: "2025/5/20 18:22",
  },
  {
    id: "WD-1005",
    userName: "Nagoya_CardVault",
    amount: 62000,
    fpsId: "37482910",
    status: "pending",
    submittedAt: "2025/5/19 11:15",
  },
  {
    id: "WD-1001",
    userName: "JapanTCG_Trader",
    amount: 19800,
    fpsId: "19384720",
    status: "completed",
    submittedAt: "2025/5/14 09:00",
  },
  {
    id: "WD-1006",
    userName: "Pikachu_Specialist",
    amount: 8900,
    fpsId: "58291044",
    status: "pending",
    submittedAt: "2025/5/18 14:10",
  },
  {
    id: "WD-1007",
    userName: "Charizard_Vault_HK",
    amount: 105000,
    fpsId: "88291023",
    status: "pending",
    submittedAt: "2025/5/17 20:05",
  },
];

const initialMerchantAccounts: MerchantStripeAccount[] = [
  {
    id: "M-01",
    subAccountId: "acct_1NfG82H",
    merchantName: "HarutoCards Premium",
    balance: 142000,
    totalPayout: 1280000,
    platformCommission: 64000,
    status: "active",
  },
  {
    id: "M-02",
    subAccountId: "acct_1MeF83J",
    merchantName: "AikoRare Collection",
    balance: 89000,
    totalPayout: 840000,
    platformCommission: 42000,
    status: "active",
  },
  {
    id: "M-03",
    subAccountId: "acct_1KyT92K",
    merchantName: "Daichi Rare Cards",
    balance: 215000,
    totalPayout: 1950000,
    platformCommission: 97500,
    status: "active",
  },
  {
    id: "M-04",
    subAccountId: "acct_1PzX44L",
    merchantName: "KuroGamer TCG",
    balance: 12000,
    totalPayout: 310000,
    platformCommission: 15500,
    status: "restricted",
  },
];

const STATUS_BADGES = {
  pending: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
  processing: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
  completed: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
  failed: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
};

export default function AdminPayoutsPage() {
  const [activeTab, setActiveTab] = useState<"fps" | "stripe">("fps");
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRequest[]>(initialWithdrawals);
  const [merchantAccounts] = useState<MerchantStripeAccount[]>(
    initialMerchantAccounts,
  );

  // Search and Filter state
  const [fpsSearch, setFpsSearch] = useState("");
  const [stripeSearch, setStripeSearch] = useState("");

  // Checkbox multi-select state
  const [selectedFpsIds, setSelectedFpsIds] = useState<Set<string>>(new Set());
  const [selectedStripeIds, setSelectedStripeIds] = useState<Set<string>>(
    new Set(),
  );

  // ── Filtered Datasets ──────────────────────────────────────────────────────
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(
      (w) =>
        w.userName.toLowerCase().includes(fpsSearch.toLowerCase()) ||
        w.fpsId.includes(fpsSearch) ||
        w.id.toLowerCase().includes(fpsSearch.toLowerCase()),
    );
  }, [withdrawals, fpsSearch]);

  const filteredMerchants = useMemo(() => {
    return merchantAccounts.filter(
      (m) =>
        m.merchantName.toLowerCase().includes(stripeSearch.toLowerCase()) ||
        m.subAccountId.toLowerCase().includes(stripeSearch.toLowerCase()),
    );
  }, [merchantAccounts, stripeSearch]);

  // ── Multi-select Handlers ──────────────────────────────────────────────────
  const toggleSelectAllFps = () => {
    if (selectedFpsIds.size === filteredWithdrawals.length) {
      setSelectedFpsIds(new Set());
    } else {
      setSelectedFpsIds(new Set(filteredWithdrawals.map((w) => w.id)));
    }
  };

  const toggleSelectFpsRow = (id: string) => {
    const next = new Set(selectedFpsIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedFpsIds(next);
  };

  const toggleSelectAllStripe = () => {
    if (selectedStripeIds.size === filteredMerchants.length) {
      setSelectedStripeIds(new Set());
    } else {
      setSelectedStripeIds(new Set(filteredMerchants.map((m) => m.id)));
    }
  };

  const toggleSelectStripeRow = (id: string) => {
    const next = new Set(selectedStripeIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedStripeIds(next);
  };

  // ── FPS Actions ─────────────────────────────────────────────────────────────
  const handleAction = (
    id: string,
    newStatus: "completed" | "processing" | "failed",
  ) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)),
    );
    const actionLabel =
      newStatus === "completed"
        ? "手動銷帳成功"
        : newStatus === "processing"
          ? "已開始處理"
          : "已標記失敗";
    toast.success(`提現單 ${id} ${actionLabel}`);
  };

  const handleBatchComplete = () => {
    if (selectedFpsIds.size === 0) return;
    setWithdrawals((prev) =>
      prev.map((w) =>
        selectedFpsIds.has(w.id) ? { ...w, status: "completed" } : w,
      ),
    );
    toast.success(`已批量完成 ${selectedFpsIds.size} 筆提現單銷帳！`);
    setSelectedFpsIds(new Set());
  };

  const handleExportFpsCSV = (exportSelectedOnly = false) => {
    const targetList = exportSelectedOnly
      ? withdrawals.filter((w) => selectedFpsIds.has(w.id))
      : withdrawals.filter((w) => w.status === "pending");

    if (targetList.length === 0) {
      toast.warning("沒有可導出的提現紀錄！");
      return;
    }

    const headers = "提現單號,用戶名稱,提現金額(HK$),FPS ID,提交時間,狀態\n";
    const rows = targetList
      .map(
        (w) =>
          `${w.id},"${w.userName}",${w.amount},"${w.fpsId}","${w.submittedAt}",${w.status}`,
      )
      .join("\n");
    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `HKCV_FPS_Payout_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`已成功導出 ${targetList.length} 筆 FPS Payout CSV 文件！`);
  };

  // ── Merchant Stripe CSV Export ─────────────────────────────────────────────
  const handleExportMerchantCSV = (exportSelectedOnly = false) => {
    const targetList = exportSelectedOnly
      ? merchantAccounts.filter((m) => selectedStripeIds.has(m.id))
      : filteredMerchants;

    if (targetList.length === 0) {
      toast.warning("沒有可導出的商戶流水紀錄！");
      return;
    }

    const headers =
      "商戶名稱,Stripe帳戶ID,帳戶餘額(HK$),已分賬總額(HK$),平台5%佣金分成(HK$),帳戶狀態\n";
    const rows = targetList
      .map(
        (m) =>
          `"${m.merchantName}","${m.subAccountId}",${m.balance},${m.totalPayout},${m.platformCommission},${m.status === "active" ? "正常運作" : "風控限制"}`,
      )
      .join("\n");

    const csvContent =
      "data:text/csv;charset=utf-8," + encodeURIComponent(headers + rows);
    const link = document.createElement("a");
    link.setAttribute("href", csvContent);
    link.setAttribute(
      "download",
      `HKCV_Merchant_Stripe_Export_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`已成功導出 ${targetList.length} 筆商戶流水 CSV 文件！`);
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-100px)] space-y-4">
      {/* ── Page Header & Top Nav Selector ────────────────────────────── */}
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <h1 className="font-sans font-bold text-[20px] text-text-primary">
          財務與結算管控台
        </h1>
        <p className="font-sans text-[12px] text-text-secondary mt-0.5">
          人手 FPS 批處理銷帳與 Stripe Connect 商戶賬戶與 5% 佣金收益監控
        </p>
      </div>

      {/* ── Full-Width Segmented Tab Selector ───────────────────────────────── */}
      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 md:grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab("fps")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "fps"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">🏦 FPS 批次處理</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {withdrawals.filter((w) => w.status === "pending").length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("stripe")}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "stripe"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">💳 商戶流水 (Stripe)</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {merchantAccounts.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Data Table Container (Full Height Flex) ────────────────── */}
      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        {/* ── Tab 1: FPS 批次處理 View ──────────────────────────────────── */}
        {activeTab === "fps" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Toolbar: Search + Clean Toggleable Batch Action */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72 md:w-80">
                <input
                  type="text"
                  placeholder="搜尋用戶名稱、FPS ID 或單號..."
                  value={fpsSearch}
                  onChange={(e) => setFpsSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-2.5 text-text-disabled"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Action Cluster (Toggle between Selection Mode & Full Mode) */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedFpsIds.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                      已選 {selectedFpsIds.size} 筆
                    </span>
                    <button
                      onClick={() => handleExportFpsCSV(true)}
                      className="h-9 px-3 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-text-primary hover:text-brand font-sans text-xs rounded-xl hover:bg-bg-hover transition-colors whitespace-nowrap flex items-center gap-1.5"
                    >
                      📥 導出已選 ({selectedFpsIds.size})
                    </button>
                    <button
                      onClick={handleBatchComplete}
                      className="h-9 px-3.5 bg-success text-[#111] font-sans font-bold text-xs rounded-xl hover:bg-success/90 transition-transform whitespace-nowrap flex items-center gap-1 shadow-md shadow-success/10"
                    >
                      ✓ 批量銷帳
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleExportFpsCSV(false)}
                    className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    全量導出 Payout CSV
                  </button>
                )}
              </div>
            </div>

            {/* High-Density Data Table */}
            <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                  <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredWithdrawals.length > 0 &&
                          selectedFpsIds.size === filteredWithdrawals.length
                        }
                        onChange={toggleSelectAllFps}
                        className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      提現單號
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      用戶名稱
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      提現金額
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      FPS ID
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      提交時間
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                      狀態
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWithdrawals.map((w) => {
                    const isSelected = selectedFpsIds.has(w.id);
                    const isPending = w.status === "pending";
                    return (
                      <TableRow
                        key={w.id}
                        className={`border-b border-[rgba(237,232,224,0.06)] transition-colors ${
                          isSelected
                            ? "bg-[rgba(212,165,116,0.08)]"
                            : "hover:bg-bg-elevated/40"
                        }`}
                      >
                        <TableCell className="w-10 text-center py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectFpsRow(w.id)}
                            className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3">
                          #{w.id}
                        </TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {w.userName}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                          HK$ {w.amount.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono text-[12px] text-brand font-bold py-3 whitespace-nowrap">
                          {w.fpsId}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {w.submittedAt}
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${STATUS_BADGES[w.status]}`}
                          >
                            {w.status === "pending"
                              ? "待處理"
                              : w.status === "completed"
                                ? "已完成"
                                : "處理中"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3 whitespace-nowrap">
                          {isPending ? (
                            <div className="flex justify-end gap-1.5">
                              <button
                                onClick={() => handleAction(w.id, "completed")}
                                className="h-7 px-2.5 bg-success text-[#111] font-sans font-bold text-[10px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform"
                              >
                                ✓ 銷帳
                              </button>
                              <button
                                onClick={() => handleAction(w.id, "failed")}
                                className="h-7 px-2.5 bg-[rgba(239,68,68,0.10)] text-warning font-mono text-[10px] rounded-lg border border-warning/20 hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.98] transition-transform"
                              >
                                ✕ 駁回
                              </button>
                            </div>
                          ) : (
                            <span className="font-mono text-[10px] text-text-disabled">
                              —
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── Tab 2: 商戶流水 (Stripe Accounts) View ──────────────────────── */}
        {activeTab === "stripe" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Toolbar: Search + Export CSV Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72 md:w-80">
                <input
                  type="text"
                  placeholder="搜尋商戶名稱或 Stripe 帳戶 ID..."
                  value={stripeSearch}
                  onChange={(e) => setStripeSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
                />
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="absolute left-3 top-2.5 text-text-disabled"
                >
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </div>

              {/* Action Cluster (Merchant CSV Export) */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedStripeIds.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                      已選 {selectedStripeIds.size} 筆商戶
                    </span>
                    <button
                      onClick={() => handleExportMerchantCSV(true)}
                      className="h-9 px-3 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap"
                    >
                      📥 導出已選商戶 CSV ({selectedStripeIds.size})
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleExportMerchantCSV(false)}
                    className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    全量導出商戶 CSV
                  </button>
                )}
              </div>
            </div>

            {/* High-Density Data Table */}
            <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
              <Table>
                <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
                  <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                    <TableHead className="w-10 text-center">
                      <input
                        type="checkbox"
                        checked={
                          filteredMerchants.length > 0 &&
                          selectedStripeIds.size === filteredMerchants.length
                        }
                        onChange={toggleSelectAllStripe}
                        className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      商戶名稱
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      Stripe 帳戶 ID
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      帳戶餘額 (Balance)
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      已分賬總額 (Payouts)
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      平台 5% 佣金分成
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center">
                      帳戶狀態
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMerchants.map((merchant) => {
                    const isSelected = selectedStripeIds.has(merchant.id);
                    return (
                      <TableRow
                        key={merchant.id}
                        className={`border-b border-[rgba(237,232,224,0.06)] transition-colors ${
                          isSelected
                            ? "bg-[rgba(212,165,116,0.08)]"
                            : "hover:bg-bg-elevated/40"
                        }`}
                      >
                        <TableCell className="w-10 text-center py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectStripeRow(merchant.id)}
                            className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {merchant.merchantName}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {merchant.subAccountId}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                          HK$ {merchant.balance.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-success text-right py-3 whitespace-nowrap">
                          HK$ {merchant.totalPayout.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-brand text-right py-3 whitespace-nowrap">
                          HK${" "}
                          {merchant.platformCommission.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="text-center py-3 whitespace-nowrap">
                          <span
                            className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${merchant.status === "active" ? "text-success bg-[rgba(16,185,129,0.12)] border-success/20" : "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20"}`}
                          >
                            {merchant.status === "active"
                              ? "正常運作"
                              : "風控限制"}
                          </span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
