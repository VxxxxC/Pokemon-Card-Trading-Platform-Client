"use client";

import {
  batchCompleteAdminPayoutRequests,
  listAdminPayoutRequests,
  listAdminPayoutRequestsForExport,
  updateAdminPayoutRequestStatus,
} from "@/app/actions/admin-payouts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  formatAdminHkd,
  formatFpsPayoutStatusLabel,
  getFpsPayoutStatusBadgeClass,
  isFpsPayoutIncomplete,
} from "@/lib/admin-payouts/format";
import type {
  FpsPayoutPage,
  FpsPayoutSort,
  FpsPayoutStatusFilter,
} from "@/lib/admin-payouts/types";
import { FPS_PAYOUT_REQUESTS_PAGE_SIZE } from "@/lib/admin-payouts/types";
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
    if (selectedIds.size === pageData.rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageData.rows.map((row) => row.requestId)));
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

  const handleStatusUpdate = async (
    requestId: string,
    status: "completed" | "failed",
  ) => {
    setIsMutating(true);
    try {
      const result = await updateAdminPayoutRequestStatus({ requestId, status });
      if (!result.success) {
        toast.error(result.error);
        return;
      }

      const actionLabel = status === "completed" ? "手動銷帳成功" : "已標記失敗";
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
  const startRow =
    pageData.total === 0 ? 0 : (pageData.page - 1) * pageData.pageSize + 1;
  const endRow = Math.min(pageData.page * pageData.pageSize, pageData.total);

  const pageNumbers = useMemo(() => {
    if (totalPages <= 0) return [];
    const maxButtons = 5;
    let start = Math.max(1, pageData.page - Math.floor(maxButtons / 2));
    const end = Math.min(totalPages, start + maxButtons - 1);
    start = Math.max(1, end - maxButtons + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pageData.page, totalPages]);

  const displayError = loadError ?? fetchError;

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4">
      <BlockingLoadingOverlay
        open={isExportingCsv || isMutating}
        message={
          isExportingCsv ? "正在導出 FPS Payout CSV…" : "正在更新提現單狀態…"
        }
      />

      {displayError ? (
        <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 font-sans text-[12px] text-warning">
          {displayError}
        </div>
      ) : null}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72 md:w-80">
          <input
            type="text"
            placeholder="搜尋提現單號、訂單號、用戶名稱或 FPS ID..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
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
          {selectedIds.size > 0 ? (
            <div className="flex flex-wrap items-center gap-2 animate-fade-in">
              <span className="font-mono text-xs text-brand bg-brand/10 border border-brand/20 px-2.5 py-1.5 rounded-xl whitespace-nowrap">
                已選 {selectedIds.size} 筆
              </span>
              <button
                type="button"
                onClick={() => handleExportCsv(true)}
                disabled={isExportingCsv || isMutating}
                className="h-9 px-3 bg-bg-elevated border border-[rgba(237,232,224,0.12)] text-text-primary hover:text-brand font-sans text-xs rounded-xl hover:bg-bg-hover transition-colors whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📥 導出已選 ({selectedIds.size})
              </button>
              <button
                type="button"
                onClick={handleBatchComplete}
                disabled={isExportingCsv || isMutating}
                className="h-9 px-3.5 bg-success text-[#111] font-sans font-bold text-xs rounded-xl hover:bg-success/90 transition-transform whitespace-nowrap flex items-center gap-1 shadow-md shadow-success/10 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ✓ 批量銷帳
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => handleExportCsv(false)}
              disabled={isExportingCsv || isMutating}
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
          options={statusChipOptions}
          active={statusFilter}
          onSelect={handleStatusFilterChange}
        />

        <SortSelect
          value={sort}
          options={FPS_SORT_OPTIONS}
          onChange={handleSortChange}
        />
      </div>

      <div
        className={`flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto ${isPending ? "opacity-60" : ""}`}
      >
        <Table>
          <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
            <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
              <TableHead className="w-10 text-center">
                <input
                  type="checkbox"
                  checked={
                    pageData.rows.length > 0 &&
                    selectedIds.size === pageData.rows.length
                  }
                  onChange={toggleSelectAll}
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
                FPS 收款人
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
            {pageData.rows.map((row) => {
              const isSelected = selectedIds.has(row.requestId);
              const canAct = isFpsPayoutIncomplete(row.status);

              return (
                <TableRow
                  key={row.requestId}
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
                      onChange={() => toggleSelectRow(row.requestId)}
                      className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
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
                  </TableCell>
                  <TableCell className="text-right py-3 whitespace-nowrap">
                    <div className="flex justify-end items-center gap-1.5">
                      <a
                        href={`/profile/user/orderDetail/${row.orderNumber}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap inline-flex items-center"
                      >
                        查看訂單
                      </a>
                      {canAct ? (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(row.requestId, "completed")
                            }
                            disabled={isMutating}
                            className="min-h-[44px] h-9 px-2.5 bg-success text-[#111] font-sans font-bold text-[10px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform disabled:opacity-50"
                          >
                            ✓ 銷帳
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleStatusUpdate(row.requestId, "failed")
                            }
                            disabled={isMutating}
                            className="min-h-[44px] h-9 px-2.5 bg-[rgba(239,68,68,0.10)] text-warning font-mono text-[10px] rounded-lg border border-warning/20 hover:bg-[rgba(239,68,68,0.15)] active:scale-[0.98] transition-transform disabled:opacity-50"
                          >
                            ✕ 駁回
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

      {pageData.total > 0 ? (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
          <div className="font-mono text-[12px] text-text-secondary">
            顯示第{" "}
            <span className="font-bold text-text-primary">{startRow}</span> -{" "}
            <span className="font-bold text-text-primary">{endRow}</span> 筆，共{" "}
            <span className="font-bold text-brand">{pageData.total}</span> 筆資料
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={pageData.page === 1 || isPending}
              onClick={() => handlePageChange(Math.max(pageData.page - 1, 1))}
              className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              上一頁
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                type="button"
                disabled={isPending}
                onClick={() => handlePageChange(p)}
                className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all ${
                  pageData.page === p
                    ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                    : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={pageData.page === totalPages || isPending}
              onClick={() =>
                handlePageChange(Math.min(pageData.page + 1, totalPages))
              }
              className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              下一頁
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
