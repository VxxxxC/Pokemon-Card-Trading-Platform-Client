"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import MerchantConnectLedgerTab from "./components/MerchantConnectLedgerTab";
import BlockingLoadingOverlay from "./components/BlockingLoadingOverlay";
import PlatformBalanceSection from "./components/PlatformBalanceSection";
import StripeLogPanel from "./components/StripeLogPanel";
import { FilterChips, SortSelect } from "./components/payouts-shared";
import {
  FPS_SORT_OPTIONS,
  STATUS_BADGES,
  STATUS_LABELS,
  initialWithdrawals,
  parseLocalDate,
  type FpsFilter,
  type FpsSortValue,
  type SortDirection,
  type WithdrawalRequest,
} from "./mock-data";
import type {
  AdminPayoutsPageData,
  FpsBatchScheduleInfo,
  MerchantTransferPage,
} from "@/lib/admin-payouts/types";

type AdminPayoutsClientProps = {
  data: AdminPayoutsPageData | null;
  loadError: string | null;
  fpsBatchSchedule: FpsBatchScheduleInfo;
  initialMerchantPage: MerchantTransferPage;
  merchantLoadError?: string | null;
};

export default function AdminPayoutsClient({
  data,
  loadError,
  fpsBatchSchedule,
  initialMerchantPage,
  merchantLoadError,
}: AdminPayoutsClientProps) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"fps" | "stripe">("fps");
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRequest[]>(initialWithdrawals);
  const [merchantTotal, setMerchantTotal] = useState(initialMerchantPage.total);

  const [fpsSearch, setFpsSearch] = useState("");
  const [fpsFilter, setFpsFilter] = useState<FpsFilter>("incomplete");
  const [fpsSort, setFpsSort] = useState<FpsSortValue>("none");

  const [fpsPage, setFpsPage] = useState(1);
  const pageSize = 10;

  const [selectedFpsIds, setSelectedFpsIds] = useState<Set<string>>(new Set());
  const [isExportingFpsCsv, setIsExportingFpsCsv] = useState(false);

  const fpsCounts = useMemo(() => {
    return {
      all: withdrawals.length,
      incomplete: withdrawals.filter(
        (w) => w.status === "pending" || w.status === "processing",
      ).length,
      completed: withdrawals.filter((w) => w.status === "completed").length,
      failed: withdrawals.filter((w) => w.status === "failed").length,
    };
  }, [withdrawals]);

  const filteredWithdrawals = useMemo(() => {
    let list = withdrawals;

    if (fpsFilter === "incomplete") {
      list = list.filter(
        (w) => w.status === "pending" || w.status === "processing",
      );
    } else if (fpsFilter !== "all") {
      list = list.filter((w) => w.status === fpsFilter);
    }

    const q = fpsSearch.toLowerCase().trim();
    if (!q) return list;

    return list.filter(
      (w) =>
        w.userName.toLowerCase().includes(q) ||
        w.fpsId.includes(q) ||
        w.id.toLowerCase().includes(q) ||
        w.orderNumber.toLowerCase().includes(q),
    );
  }, [withdrawals, fpsFilter, fpsSearch]);

  const sortedWithdrawals = useMemo(() => {
    if (fpsSort === "none") return filteredWithdrawals;
    const [key, direction] = fpsSort.split("-") as [
      "userName" | "submittedAt",
      SortDirection,
    ];
    return [...filteredWithdrawals].sort((a, b) => {
      if (key === "userName") {
        return direction === "asc"
          ? a.userName.localeCompare(b.userName, "zh-HK")
          : b.userName.localeCompare(a.userName, "zh-HK");
      }
      if (key === "submittedAt") {
        return direction === "asc"
          ? parseLocalDate(a.submittedAt) - parseLocalDate(b.submittedAt)
          : parseLocalDate(b.submittedAt) - parseLocalDate(a.submittedAt);
      }
      return 0;
    });
  }, [filteredWithdrawals, fpsSort]);

  const totalFpsPages = Math.ceil(sortedWithdrawals.length / pageSize) || 1;
  const paginatedWithdrawals = useMemo(() => {
    const start = (fpsPage - 1) * pageSize;
    return sortedWithdrawals.slice(start, start + pageSize);
  }, [sortedWithdrawals, fpsPage]);

  const handleFpsSort = (value: FpsSortValue) => {
    setFpsSort(value);
    setFpsPage(1);
    setSelectedFpsIds(new Set());
  };

  const handleFpsFilterChange = (filter: FpsFilter) => {
    setFpsFilter(filter);
    setFpsPage(1);
    setSelectedFpsIds(new Set());
  };

  const handleFpsSearchChange = (value: string) => {
    setFpsSearch(value);
    setFpsPage(1);
    setSelectedFpsIds(new Set());
  };

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

  const handleAction = (
    id: string,
    newStatus: "completed" | "processing" | "failed",
  ) => {
    setWithdrawals((prev) =>
      prev.map((w) => (w.id === id ? { ...w, status: newStatus } : w)),
    );
    setSelectedFpsIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
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
      : sortedWithdrawals;

    if (targetList.length === 0) {
      toast.warning("沒有可導出的提現紀錄！");
      return;
    }

    setIsExportingFpsCsv(true);
    try {
      const headers =
        "提現單號,訂單號,用戶名稱,提現金額(HK$),FPS ID,提交時間,狀態\n";
      const rows = targetList
        .map(
          (w) =>
            `${w.id},"${w.orderNumber}","${w.userName}",${w.amount},"${w.fpsId}","${w.submittedAt}",${STATUS_LABELS[w.status]}`,
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
    } finally {
      setIsExportingFpsCsv(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[calc(100dvh-100px)] space-y-4">
      <BlockingLoadingOverlay
        open={isExportingFpsCsv}
        message="正在導出 FPS Payout CSV…"
      />
      <div className="bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <h1 className="font-sans font-bold text-[20px] text-text-primary">
          財務與結算管控台
        </h1>
        <p className="font-sans text-[12px] text-text-secondary mt-0.5">
          人手 FPS 批處理銷帳與 Stripe Connect 商戶賬戶與佣金收益監控
        </p>
      </div>

      {loadError ? (
        <div className="bg-bg-card rounded-2xl border border-warning/30 p-4 font-sans text-sm text-warning">
          {loadError}
        </div>
      ) : null}

      <PlatformBalanceSection
        balance={data?.stripeBalance ?? null}
        error={data?.stripeBalanceError}
      />

      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setActiveTab("fps")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
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
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "stripe"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">💳 商戶流水 (Stripe)</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {merchantTotal}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        {activeTab === "fps" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div className="rounded-xl border border-brand/20 bg-brand/5 px-4 py-3 font-sans text-[12px] text-text-secondary">
              Member FPS 週批 — 後端 schema Phase B 就緒後接入。下一批處理日：
              <span className="text-brand font-semibold">
                {" "}
                {fpsBatchSchedule.nextBatchDateLabel}（{fpsBatchSchedule.batchWeekdayLabel}）
              </span>
              ；截止：
              <span className="text-text-primary font-medium">
                {" "}
                {fpsBatchSchedule.cutoffLabel}
              </span>
              前 ready 的提現單。
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72 md:w-80">
                <input
                  type="text"
                  placeholder="搜尋用戶名稱、FPS ID 或單號..."
                  value={fpsSearch}
                  onChange={(e) => handleFpsSearchChange(e.target.value)}
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

              <div className="flex flex-wrap items-center gap-2">
                {selectedFpsIds.size > 0 ? (
                  <div className="flex flex-wrap items-center gap-2 animate-fade-in">
                    <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                      已選 {selectedFpsIds.size} 筆
                    </span>
                    <button
                      type="button"
                      onClick={() => handleExportFpsCSV(true)}
                      disabled={isExportingFpsCsv}
                      className="h-9 px-3 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-text-primary hover:text-brand font-sans text-xs rounded-xl hover:bg-bg-hover transition-colors whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    type="button"
                    onClick={() => handleExportFpsCSV(false)}
                    disabled={isExportingFpsCsv}
                    className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="flex flex-wrap items-center gap-3">
              <FilterChips
                options={[
                  { key: "all", label: "全部", count: fpsCounts.all },
                  {
                    key: "incomplete",
                    label: "未完成",
                    count: fpsCounts.incomplete,
                  },
                  {
                    key: "completed",
                    label: "已完成",
                    count: fpsCounts.completed,
                  },
                  { key: "failed", label: "已駁回", count: fpsCounts.failed },
                ]}
                active={fpsFilter}
                onSelect={handleFpsFilterChange}
              />

              <SortSelect
                value={fpsSort}
                options={FPS_SORT_OPTIONS}
                onChange={handleFpsSort}
              />
            </div>

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
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      訂單號
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
                  {paginatedWithdrawals.map((w) => {
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
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          #{w.id}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {w.orderNumber}
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
                            {STATUS_LABELS[w.status]}
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-3 whitespace-nowrap">
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                router.push(
                                  `/profile/user/orderDetail/${w.orderNumber}`,
                                )
                              }
                              className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap"
                            >
                              查看訂單
                            </button>
                            {isPending && (
                              <>
                                <button
                                  onClick={() =>
                                    handleAction(w.id, "completed")
                                  }
                                  className="min-h-[44px] h-9 px-2.5 bg-success text-[#111] font-sans font-bold text-[10px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform"
                                >
                                  ✓ 銷帳
                                </button>
                                <button
                                  onClick={() => handleAction(w.id, "failed")}
                                  className="min-h-[44px] h-9 px-2.5 bg-[rgba(239,68,68,0.10)] text-warning font-mono text-[10px] rounded-lg border border-warning/20 hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.98] transition-transform"
                                >
                                  ✕ 駁回
                                </button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {sortedWithdrawals.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
                <div className="font-mono text-[12px] text-text-secondary">
                  顯示第{" "}
                  <span className="font-bold text-text-primary">
                    {(fpsPage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-text-primary">
                    {Math.min(fpsPage * pageSize, sortedWithdrawals.length)}
                  </span>{" "}
                  筆，共{" "}
                  <span className="font-bold text-brand">
                    {sortedWithdrawals.length}
                  </span>{" "}
                  筆資料
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={fpsPage === 1}
                    onClick={() => setFpsPage((prev) => Math.max(prev - 1, 1))}
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上一頁
                  </button>
                  {Array.from({ length: totalFpsPages }, (_, i) => i + 1).map(
                    (p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFpsPage(p)}
                        className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all ${
                          fpsPage === p
                            ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                            : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                        }`}
                      >
                        {p}
                      </button>
                    ),
                  )}
                  <button
                    type="button"
                    disabled={fpsPage === totalFpsPages}
                    onClick={() =>
                      setFpsPage((prev) => Math.min(prev + 1, totalFpsPages))
                    }
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    下一頁
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "fps" && <StripeLogPanel variant="payout" />}

        {activeTab === "stripe" && (
          <MerchantConnectLedgerTab
            initialPage={initialMerchantPage}
            loadError={merchantLoadError ?? undefined}
            onTotalChange={setMerchantTotal}
          />
        )}
      </div>
    </div>
  );
}
