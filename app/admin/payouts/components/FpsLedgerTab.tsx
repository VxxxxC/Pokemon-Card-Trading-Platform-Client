"use client";

import {
  batchCompleteAdminPayoutRequests,
  listAdminPayoutRequests,
  listAdminPayoutRequestsForExport,
  updateAdminPayoutRequestStatus,
} from "@/app/actions/admin-payouts";
import {
  BTN_OUTLINE_SM_CLASS,
  BTN_PRIMARY_CLASS,
  BTN_PRIMARY_SM_CLASS,
  FILTER_INPUT_CLASS,
} from "@/app/admin/campaigns/campaigns-ui";
import { Pagination } from "@/app/components/ui/Pagination";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { isFpsPayoutBlockedForComplete } from "@/lib/admin-payouts/fps-payout-guards";
import {
  formatAdminHkd,
  formatFpsPayoutStatusLabel,
  getFpsPayoutStatusBadgeClass,
  isFpsPayoutIncomplete,
} from "@/lib/admin-payouts/format";
import type {
  FpsPayoutPage,
  FpsPayoutRow,
  FpsPayoutSort,
  FpsPayoutStatusFilter,
} from "@/lib/admin-payouts/types";
import { FPS_PAYOUT_REQUESTS_PAGE_SIZE } from "@/lib/admin-payouts/types";
import { Search } from "lucide-react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";
import BlockingLoadingOverlay from "./BlockingLoadingOverlay";
import { FilterChips, SortSelect } from "./payouts-shared";

const FPS_SORT_OPTIONS: { value: FpsPayoutSort; label: string }[] = [
  { value: "submittedAt-desc", label: "提交時間：最新優先" },
  { value: "submittedAt-asc", label: "提交時間：最舊優先" },
  { value: "userName-asc", label: "用戶名稱：A → Z" },
  { value: "userName-desc", label: "用戶名稱：Z → A" },
];

const STATUS_FILTER_OPTIONS: {
  key: FpsPayoutStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "全部" },
  { key: "incomplete", label: "未完成" },
  { key: "completed", label: "已完成" },
  { key: "failed", label: "已駁回" },
];

type FpsLedgerTabProps = {
  initialPage: FpsPayoutPage;
  loadError?: string;
  onTotalChange?: (total: number) => void;
};

function formatRequestId(requestId: string): string {
  if (requestId.length <= 12) {
    return `#${requestId}`;
  }
  return `#${requestId.slice(0, 8)}`;
}

function FpsPayoutMobileCard({
  row,
  isSelected,
  canSelect,
  isMutating,
  blockedForComplete,
  onToggleSelect,
  onComplete,
  onReject,
}: {
  row: FpsPayoutRow;
  isSelected: boolean;
  canSelect: boolean;
  isMutating: boolean;
  blockedForComplete: boolean;
  onToggleSelect: () => void;
  onComplete: () => void;
  onReject: () => void;
}) {
  const canAct = isFpsPayoutIncomplete(row.status);

  return (
    <article className="space-y-2 px-1 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-start gap-2">
          {canSelect ? (
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelect}
              className="mt-0.5 rounded border-white/20 accent-brand"
            />
          ) : null}
          <div className="min-w-0">
            <p className="font-mono text-[11px] text-text-disabled">
              {formatRequestId(row.requestId)}
            </p>
            <Link
              href={`/profile/${row.sellerId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-sans text-[13px] font-semibold text-brand hover:underline"
            >
              {row.sellerName}
            </Link>
          </div>
        </div>
        <span
          className={`shrink-0 rounded border px-2 py-0.5 font-mono text-[9px] ${getFpsPayoutStatusBadgeClass(row.status)}`}
        >
          {formatFpsPayoutStatusLabel(row.status)}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 font-mono text-[11px]">
        <span className="text-text-disabled">訂單</span>
        <Link
          href={`/profile/user/orderDetail/${row.orderNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand hover:underline"
        >
          {row.orderNumber}
        </Link>
        <span className="text-text-disabled">金額</span>
        <span className="font-bold text-text-primary">
          {formatAdminHkd(row.amount)}
        </span>
        <span className="text-text-disabled">FPS ID</span>
        <span className="font-bold text-brand">{row.fpsId}</span>
        <span className="text-text-disabled">提交</span>
        <span className="text-text-secondary">{row.submittedAt}</span>
      </div>
      {blockedForComplete ? (
        <p className="font-sans text-[10px] text-text-disabled">待賣家補 FPS</p>
      ) : null}
      {canAct ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {!blockedForComplete ? (
            <button
              type="button"
              onClick={onComplete}
              disabled={isMutating}
              className={BTN_PRIMARY_SM_CLASS}
            >
              銷帳
            </button>
          ) : null}
          <button
            type="button"
            onClick={onReject}
            disabled={isMutating}
            className={`${BTN_OUTLINE_SM_CLASS} border-warning/30 text-warning hover:border-warning/40 hover:bg-warning/10 hover:text-warning`}
          >
            駁回
          </button>
        </div>
      ) : null}
    </article>
  );
}

export default function FpsLedgerTab({
  initialPage,
  loadError,
  onTotalChange,
}: FpsLedgerTabProps) {
  const [isPending, startTransition] = useTransition();
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isMutating, setIsMutating] = useState(false);

  const [pageData, setPageData] = useState<FpsPayoutPage>(initialPage);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<FpsPayoutStatusFilter>("incomplete");
  const [sort, setSort] = useState<FpsPayoutSort>("submittedAt-desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [completeDialogRequestId, setCompleteDialogRequestId] = useState<
    string | null
  >(null);
  const [adminFpsReference, setAdminFpsReference] = useState("");
  const skipFilterFetchRef = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [search]);

  const fetchPage = useCallback(
    (overrides: {
      page?: number;
      search?: string;
      statusFilter?: FpsPayoutStatusFilter;
      sort?: FpsPayoutSort;
    }) => {
      const nextPage = overrides.page ?? pageData.page;
      const nextSearch =
        overrides.search !== undefined ? overrides.search : debouncedSearch;
      const nextStatus =
        overrides.statusFilter !== undefined
          ? overrides.statusFilter
          : statusFilter;
      const nextSort = overrides.sort ?? sort;

      startTransition(async () => {
        const result = await listAdminPayoutRequests({
          page: nextPage,
          pageSize: FPS_PAYOUT_REQUESTS_PAGE_SIZE,
          search: nextSearch || undefined,
          statusFilter: nextStatus,
          sort: nextSort,
        });

        if (!result.success) {
          setFetchError(result.error);
          return;
        }

        setFetchError(null);
        setPageData(result.data);
        onTotalChange?.(result.data.total);
      });
    },
    [pageData.page, debouncedSearch, statusFilter, sort, onTotalChange],
  );

  useEffect(() => {
    if (skipFilterFetchRef.current) {
      skipFilterFetchRef.current = false;
      return;
    }
    fetchPage({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filters change
  }, [debouncedSearch, statusFilter, sort]);

  const statusChipOptions = useMemo(
    () =>
      STATUS_FILTER_OPTIONS.map((option) => ({
        ...option,
        count: pageData.statusCounts[option.key],
      })),
    [pageData.statusCounts],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setSelectedIds(new Set());
  };

  const handleStatusFilterChange = (filter: FpsPayoutStatusFilter) => {
    setStatusFilter(filter);
    setSelectedIds(new Set());
  };

  const handleSortChange = (value: FpsPayoutSort) => {
    setSort(value);
    setSelectedIds(new Set());
  };

  const handlePageChange = (page: number) => {
    setSelectedIds(new Set());
    fetchPage({ page });
  };

  const toggleSelectAll = () => {
    const selectableIds = pageData.rows
      .filter(
        (row) =>
          isFpsPayoutIncomplete(row.status) &&
          !isFpsPayoutBlockedForComplete({
            status: row.status,
            fpsId: row.fpsId,
            fpsName: row.fpsName,
          }),
      )
      .map((row) => row.requestId);

    if (
      selectableIds.length > 0 &&
      selectableIds.every((id) => selectedIds.has(id))
    ) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(selectableIds));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExportCsv = async (exportSelectedOnly = false) => {
    setIsExportingCsv(true);
    try {
      const result = await listAdminPayoutRequestsForExport({
        search: debouncedSearch || undefined,
        statusFilter,
        sort,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      let targetRows = result.data.rows;
      if (exportSelectedOnly) {
        targetRows = targetRows.filter((row) =>
          selectedIds.has(row.requestId),
        );
      }

      if (targetRows.length === 0) {
        toast.warning("沒有可導出的提現紀錄！");
        return;
      }

      const headers =
        "提現單號,訂單號,用戶名稱,提現金額(HK$),FPS收款人,FPS ID,提交時間,狀態,管理員FPS參考,銷帳時間\n";
      const rows = targetRows
        .map((row) =>
          [
            `"${row.requestId}"`,
            `"${row.orderNumber}"`,
            `"${row.sellerName}"`,
            row.amount,
            `"${row.fpsName ?? ""}"`,
            `"${row.fpsId}"`,
            `"${row.submittedAt}"`,
            formatFpsPayoutStatusLabel(row.status),
            `"${row.adminFpsReference ?? ""}"`,
            `"${row.paidAt ?? ""}"`,
          ].join(","),
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

      toast.success(`已成功導出 ${targetRows.length} 筆 FPS Payout CSV 文件！`);
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleCompleteSubmit = async () => {
    if (!completeDialogRequestId) return;

    const reference = adminFpsReference.trim();
    if (!reference) {
      toast.error("請填寫 FPS 轉帳參考號");
      return;
    }

    setIsMutating(true);
    try {
      const result = await updateAdminPayoutRequestStatus({
        requestId: completeDialogRequestId,
        status: "completed",
        adminFpsReference: reference,
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(
        `${formatRequestId(completeDialogRequestId)} 手動銷帳成功`,
      );
      setCompleteDialogRequestId(null);
      setAdminFpsReference("");
      setSelectedIds((prev) => {
        if (!prev.has(completeDialogRequestId)) return prev;
        const next = new Set(prev);
        next.delete(completeDialogRequestId);
        return next;
      });
      fetchPage({});
    } finally {
      setIsMutating(false);
    }
  };

  const handleStatusUpdate = async (
    requestId: string,
    status: "failed",
  ) => {
    setIsMutating(true);
    try {
      const result = await updateAdminPayoutRequestStatus({ requestId, status });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const actionLabel = "已標記失敗";
      toast.success(`${formatRequestId(requestId)} ${actionLabel}`);
      setSelectedIds((prev) => {
        if (!prev.has(requestId)) return prev;
        const next = new Set(prev);
        next.delete(requestId);
        return next;
      });
      fetchPage({});
    } finally {
      setIsMutating(false);
    }
  };

  const handleBatchComplete = async () => {
    if (selectedIds.size === 0) return;

    const confirmed = window.confirm(
      "批量銷帳不記錄 FPS 參考號，確認繼續？",
    );
    if (!confirmed) return;

    setIsMutating(true);
    try {
      const result = await batchCompleteAdminPayoutRequests({
        requestIds: [...selectedIds],
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success(`已批量完成 ${result.completedCount} 筆提現單銷帳！`);
      setSelectedIds(new Set());
      fetchPage({});
    } finally {
      setIsMutating(false);
    }
  };

  const totalPages = pageData.totalPages;

  const selectableRowIds = useMemo(
    () =>
      pageData.rows
        .filter(
          (row) =>
            isFpsPayoutIncomplete(row.status) &&
            !isFpsPayoutBlockedForComplete({
              status: row.status,
              fpsId: row.fpsId,
              fpsName: row.fpsName,
            }),
        )
        .map((row) => row.requestId),
    [pageData.rows],
  );

  const displayError = loadError ?? fetchError;

  return (
    <div className="space-y-4">
      <BlockingLoadingOverlay
        open={isExportingCsv || isMutating}
        message={
          isExportingCsv ? "正在導出 FPS Payout CSV…" : "正在更新提現單狀態…"
        }
      />

      <Dialog
        open={completeDialogRequestId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCompleteDialogRequestId(null);
            setAdminFpsReference("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>FPS 銷帳確認</DialogTitle>
            <DialogDescription>
              請輸入銀行／轉數快轉帳參考號以完成銷帳。
            </DialogDescription>
          </DialogHeader>
          <input
            name="adminFpsReference"
            value={adminFpsReference}
            onChange={(event) => setAdminFpsReference(event.target.value)}
            placeholder="FPS 轉帳參考號"
          />
          <DialogFooter>
            <button
              type="button"
              onClick={() => {
                setCompleteDialogRequestId(null);
                setAdminFpsReference("");
              }}
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleCompleteSubmit}
              disabled={isMutating || !adminFpsReference.trim()}
            >
              確認銷帳
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {displayError ? (
        <div className="rounded-lg border border-warning/30 bg-warning/10 px-3 py-2.5 font-sans text-[13px] text-warning">
          {displayError}
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled"
            aria-hidden="true"
          />
          <Input
            type="search"
            placeholder="搜尋提現單號、訂單號、用戶名稱或 FPS ID…"
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className={FILTER_INPUT_CLASS}
          />
        </div>

        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-1.5">
            <FilterChips
              options={statusChipOptions}
              active={statusFilter}
              onSelect={handleStatusFilterChange}
            />
          </div>
          <SortSelect
            value={sort}
            options={FPS_SORT_OPTIONS}
            onChange={handleSortChange}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <span className="rounded-lg border border-brand/20 bg-brand/10 px-2.5 py-1 font-mono text-[11px] text-brand">
                已選 {selectedIds.size} 筆
              </span>
              <button
                type="button"
                onClick={() => handleExportCsv(true)}
                disabled={isExportingCsv || isMutating}
                className={BTN_OUTLINE_SM_CLASS}
              >
                導出已選 ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={handleBatchComplete}
                disabled={isExportingCsv || isMutating}
                className={BTN_PRIMARY_SM_CLASS}
              >
                批量銷帳
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => handleExportCsv(false)}
              disabled={isExportingCsv || isMutating}
              className={BTN_PRIMARY_CLASS}
            >
              全量導出 Payout CSV
            </button>
          )}
        </div>
      </div>

      {pageData.rows.length === 0 ? (
        <p className="py-10 text-center font-sans text-[13px] text-text-secondary">
          沒有符合篩選條件的提現記錄。
        </p>
      ) : (
        <>
          <div
            className={`md:hidden divide-y divide-white/[0.06] ${isPending ? "opacity-60" : ""}`}
          >
            {pageData.rows.map((row) => {
              const isSelected = selectedIds.has(row.requestId);
              const blockedForComplete = isFpsPayoutBlockedForComplete({
                status: row.status,
                fpsId: row.fpsId,
                fpsName: row.fpsName,
              });
              const canSelect =
                isFpsPayoutIncomplete(row.status) && !blockedForComplete;

              return (
                <FpsPayoutMobileCard
                  key={row.requestId}
                  row={row}
                  isSelected={isSelected}
                  canSelect={canSelect}
                  isMutating={isMutating}
                  blockedForComplete={blockedForComplete}
                  onToggleSelect={() => toggleSelectRow(row.requestId)}
                  onComplete={() => {
                    setCompleteDialogRequestId(row.requestId);
                    setAdminFpsReference("");
                  }}
                  onReject={() => handleStatusUpdate(row.requestId, "failed")}
                />
              );
            })}
          </div>

          <div
            className={`hidden overflow-x-auto rounded-lg border border-white/[0.08] md:block ${isPending ? "opacity-60" : ""}`}
          >
        <Table>
          <TableHeader className="border-b border-white/[0.08] bg-bg-card/30">
            <TableRow className="border-transparent hover:bg-transparent">
              <TableHead className="h-9 w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    selectableRowIds.length > 0 &&
                    selectableRowIds.every((id) => selectedIds.has(id))
                  }
                  onChange={toggleSelectAll}
                  disabled={selectableRowIds.length === 0}
                  className="rounded border-white/20 accent-brand cursor-pointer disabled:opacity-40"
                />
              </TableHead>
              <TableHead className="h-9 font-mono text-[11px] text-text-disabled">
                提現單號
              </TableHead>
              <TableHead className="h-9 font-mono text-[11px] text-text-disabled">
                訂單號
              </TableHead>
              <TableHead className="h-9 font-sans text-[11px] text-text-disabled">
                用戶名稱
              </TableHead>
              <TableHead className="h-9 text-right font-mono text-[11px] text-text-disabled">
                提現金額
              </TableHead>
              <TableHead className="h-9 font-mono text-[11px] text-text-disabled">
                FPS 收款人
              </TableHead>
              <TableHead className="h-9 font-mono text-[11px] text-text-disabled">
                FPS ID
              </TableHead>
              <TableHead className="h-9 font-mono text-[11px] text-text-disabled">
                提交時間
              </TableHead>
              <TableHead className="h-9 text-center font-sans text-[11px] text-text-disabled">
                狀態
              </TableHead>
              <TableHead className="h-9 font-mono text-[11px] text-text-disabled">
                FPS 參考
              </TableHead>
              <TableHead className="h-9 min-w-[5.5rem] text-right font-sans text-[11px] text-text-disabled">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.rows.map((row, rowIndex) => {
              const isSelected = selectedIds.has(row.requestId);
              const canAct = isFpsPayoutIncomplete(row.status);
              const blockedForComplete = isFpsPayoutBlockedForComplete({
                status: row.status,
                fpsId: row.fpsId,
                fpsName: row.fpsName,
              });
              const canSelect = canAct && !blockedForComplete;

              return (
                <TableRow
                  key={row.requestId}
                  className={`border-white/[0.06] transition-colors hover:bg-brand/10 ${
                    rowIndex % 2 === 0 ? "bg-bg-card/25" : "bg-white/[0.02]"
                  } ${isSelected ? "bg-brand/10" : ""}`}
                >
                  <TableCell className="w-10 py-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={!canSelect}
                      onChange={() => toggleSelectRow(row.requestId)}
                      className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer disabled:opacity-40"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    {formatRequestId(row.requestId)}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    <Link
                      href={`/profile/user/orderDetail/${row.orderNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {row.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                    <Link
                      href={`/profile/${row.sellerId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {row.sellerName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                    <div>{formatAdminHkd(row.amount)}</div>
                    {row.fpsTransferFeeHkd > 0 ? (
                      <div className="font-mono text-[10px] font-normal text-text-disabled">
                        毛額 {formatAdminHkd(row.grossPayoutHkd)} · 手續費{" "}
                        {formatAdminHkd(row.fpsTransferFeeHkd)}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-sans text-[12px] text-text-primary py-3 whitespace-nowrap">
                    {row.fpsName ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-brand font-bold py-3 whitespace-nowrap">
                    {row.fpsId}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    {row.submittedAt}
                  </TableCell>
                  <TableCell className="text-center py-3 whitespace-nowrap">
                    <span
                      className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${getFpsPayoutStatusBadgeClass(row.status)}`}
                    >
                      {formatFpsPayoutStatusLabel(row.status)}
                    </span>
                    {blockedForComplete ? (
                      <div className="mt-1 font-sans text-[10px] text-text-disabled">
                        待賣家補 FPS
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    {row.adminFpsReference ?? "—"}
                  </TableCell>
                  <TableCell className="text-right py-2.5 whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      <a
                        href={`/profile/user/orderDetail/${row.orderNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${BTN_OUTLINE_SM_CLASS} inline-flex h-8 items-center px-2.5 text-brand`}
                      >
                        查看訂單
                      </a>
                      {canAct ? (
                        <>
                          {!blockedForComplete ? (
                            <button
                              type="button"
                              onClick={() => {
                                setCompleteDialogRequestId(row.requestId);
                                setAdminFpsReference("");
                              }}
                              disabled={isMutating}
                              className={BTN_PRIMARY_SM_CLASS}
                            >
                              銷帳
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(row.requestId, "failed")
                            }
                            disabled={isMutating}
                            className={`${BTN_OUTLINE_SM_CLASS} border-warning/30 text-warning hover:border-warning/40 hover:bg-warning/10 hover:text-warning`}
                          >
                            駁回
                          </button>
                        </>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
          </div>

          {pageData.total > 0 && totalPages <= 1 ? (
            <p className="font-mono text-[12px] text-text-secondary">
              共 {pageData.total} 筆資料{isPending ? "（更新中…）" : ""}
            </p>
          ) : null}
          {pageData.total > 0 && totalPages > 1 ? (
            <Pagination
              currentPage={pageData.page}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              totalItems={pageData.total}
              itemsPerPage={pageData.pageSize}
              itemLabel="筆資料"
              enableScroll={false}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
