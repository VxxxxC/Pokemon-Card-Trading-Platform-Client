"use client";

import {
  listAdminMerchantTransfers,
  listAdminMerchantTransfersForExport,
} from "@/app/actions/admin-payouts";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  formatAdminHkd,
  formatCommissionRate,
  formatOrderAuthType,
  formatPayoutStatusLabel,
  getPayoutStatusBadgeClass,
} from "@/lib/admin-payouts/format";
import type {
  MerchantTransferPage,
  MerchantTransferSort,
  MerchantTransferStatusFilter,
} from "@/lib/admin-payouts/types";
import { MERCHANT_TRANSFERS_PAGE_SIZE } from "@/lib/admin-payouts/types";
import {
  getStripeConnectDashboardUrl,
  getStripeTransferDashboardUrl,
} from "@/lib/stripe/dashboard-urls";
import { truncateStripeId } from "@/lib/stripe/display";
import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { DateRange } from "react-day-picker";
import { toast } from "sonner";
import BlockingLoadingOverlay from "./BlockingLoadingOverlay";
import { FilterChips, SortSelect } from "./payouts-shared";

const MERCHANT_SORT_OPTIONS: { value: MerchantTransferSort; label: string }[] =
  [
    { value: "transferred_at-desc", label: "撥款時間：最新優先" },
    { value: "transferred_at-asc", label: "撥款時間：最舊優先" },
    { value: "merchantName-asc", label: "商戶名稱：A → Z" },
    { value: "merchantName-desc", label: "商戶名稱：Z → A" },
  ];

const STATUS_FILTER_OPTIONS: {
  key: MerchantTransferStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "全部" },
  { key: "paid", label: "已成功" },
  { key: "held", label: "保留中（T+7）" },
  { key: "processing", label: "處理中" },
  { key: "pending", label: "待撥款" },
  { key: "failed", label: "已失敗" },
  { key: "frozen", label: "已凍結" },
];

type MerchantConnectLedgerTabProps = {
  initialPage: MerchantTransferPage;
  loadError?: string;
  onTotalChange?: (total: number) => void;
};

function toIsoDateRange(range: DateRange | undefined): {
  dateFrom?: string;
  dateTo?: string;
} {
  if (!range?.from && !range?.to) {
    return {};
  }

  return {
    dateFrom: range.from ? startOfDay(range.from).toISOString() : undefined,
    dateTo: range.to ? endOfDay(range.to).toISOString() : undefined,
  };
}

export default function MerchantConnectLedgerTab({
  initialPage,
  loadError,
  onTotalChange,
}: MerchantConnectLedgerTabProps) {
  const [isPending, startTransition] = useTransition();
  const [isExportingCsv, setIsExportingCsv] = useState(false);

  const [pageData, setPageData] = useState<MerchantTransferPage>(initialPage);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<MerchantTransferStatusFilter>("all");
  const [sort, setSort] = useState<MerchantTransferSort>("transferred_at-desc");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
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
      statusFilter?: MerchantTransferStatusFilter;
      sort?: MerchantTransferSort;
      dateRange?: DateRange | undefined;
    }) => {
      const nextPage = overrides.page ?? pageData.page;
      const nextSearch =
        overrides.search !== undefined ? overrides.search : debouncedSearch;
      const nextStatus =
        overrides.statusFilter !== undefined
          ? overrides.statusFilter
          : statusFilter;
      const nextSort = overrides.sort ?? sort;
      const nextRange =
        overrides.dateRange !== undefined ? overrides.dateRange : dateRange;
      const { dateFrom, dateTo } = toIsoDateRange(nextRange);

      startTransition(async () => {
        const result = await listAdminMerchantTransfers({
          page: nextPage,
          pageSize: MERCHANT_TRANSFERS_PAGE_SIZE,
          search: nextSearch || undefined,
          statusFilter: nextStatus,
          sort: nextSort,
          dateFrom,
          dateTo,
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
    [
      pageData.page,
      debouncedSearch,
      statusFilter,
      sort,
      dateRange,
      onTotalChange,
    ],
  );

  useEffect(() => {
    if (skipFilterFetchRef.current) {
      skipFilterFetchRef.current = false;
      return;
    }
    fetchPage({ page: 1 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refetch when filters change
  }, [debouncedSearch, statusFilter, sort, dateRange]);

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

  const handleStatusFilterChange = (filter: MerchantTransferStatusFilter) => {
    setStatusFilter(filter);
    setSelectedIds(new Set());
  };

  const handleSortChange = (value: MerchantTransferSort) => {
    setSort(value);
    setSelectedIds(new Set());
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
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
      setSelectedIds(
        new Set(pageData.rows.map((row) => row.stripeTransferId)),
      );
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExportCsv = async (exportSelectedOnly = false) => {
    const { dateFrom, dateTo } = toIsoDateRange(dateRange);

    setIsExportingCsv(true);
    try {
      const result = await listAdminMerchantTransfersForExport({
        search: debouncedSearch || undefined,
        statusFilter,
        sort,
        dateFrom,
        dateTo,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      let targetRows = result.data.rows;
      if (exportSelectedOnly) {
        targetRows = targetRows.filter((row) =>
          selectedIds.has(row.stripeTransferId),
        );
      }

      if (targetRows.length === 0) {
        toast.warning("沒有可導出的商戶流水紀錄！");
        return;
      }

      const headers =
        "Stripe流水號,訂單號,商戶名稱,Stripe帳戶ID,訂單類型,卡價小計(HK$),佣金率,平台分成(HK$),鑑定費(HK$),商戶實收(HK$),撥款狀態,撥款錯誤,買家確認時間,PaymentIntent,撥款時間\n";
      const rows = targetRows
        .map((row) =>
          [
            `"${row.stripeTransferId}"`,
            `"${row.orderNumber}"`,
            `"${row.merchantName}"`,
            `"${row.subAccountId}"`,
            formatOrderAuthType(row.requiresAuthentication),
            row.itemSubtotal,
            formatCommissionRate(row.commissionRateApplied),
            row.platformCommission,
            row.authFee,
            row.merchantPayoutAmount,
            formatPayoutStatusLabel(row.payoutStatus),
            `"${(row.payoutError ?? "").replace(/"/g, '""')}"`,
            `"${row.buyerConfirmedAt ?? "—"}"`,
            `"${row.stripePaymentIntentId ?? "—"}"`,
            `"${row.transferredAt}"`,
          ].join(","),
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

      toast.success(`已成功導出 ${targetRows.length} 筆商戶流水 CSV 文件！`);
    } catch {
      toast.error("導出商戶流水 CSV 失敗，請稍後再試");
    } finally {
      setIsExportingCsv(false);
    }
  };

  const displayError = loadError ?? fetchError;
  const pageSize = pageData.pageSize;
  const totalPages = pageData.totalPages || 1;
  const startRow =
    pageData.total === 0 ? 0 : (pageData.page - 1) * pageSize + 1;
  const endRow = Math.min(pageData.page * pageSize, pageData.total);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    for (let p = 1; p <= totalPages; p += 1) {
      pages.push(p);
    }
    return pages;
  }, [totalPages]);

  return (
    <div className="flex-1 flex flex-col justify-between space-y-4">
      <BlockingLoadingOverlay
        open={isExportingCsv}
        message="正在導出商戶流水 CSV…"
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
            placeholder="搜尋商戶名稱、Stripe 流水號或訂單號..."
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
                onClick={() => void handleExportCsv(true)}
                disabled={isPending || isExportingCsv}
                className="h-9 px-3 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap disabled:opacity-50"
              >
                📥 導出已選流水 CSV ({selectedIds.size})
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => void handleExportCsv(false)}
              disabled={isPending || isExportingCsv}
              className="h-9 px-4 bg-brand text-[#17130f] font-sans font-semibold text-xs rounded-xl hover:bg-brand-hover transition-all flex items-center gap-1.5 shrink-0 shadow-lg shadow-brand/10 whitespace-nowrap disabled:opacity-50"
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

      <div className="flex flex-wrap items-center gap-3">
        <FilterChips
          options={statusChipOptions}
          active={statusFilter}
          onSelect={handleStatusFilterChange}
        />

        <SortSelect
          value={sort}
          options={MERCHANT_SORT_OPTIONS}
          onChange={handleSortChange}
        />

        <Popover>
          <PopoverTrigger className="min-h-[44px] h-10 px-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary hover:bg-bg-elevated hover:border-brand/40 transition-colors flex items-center gap-2">
            <CalendarIcon className="w-3.5 h-3.5 text-brand" />
            <span>
              {dateRange?.from ? (
                dateRange.to ? (
                  `${format(dateRange.from, "yyyy/MM/dd")} - ${format(dateRange.to, "yyyy/MM/dd")}`
                ) : (
                  `${format(dateRange.from, "yyyy/MM/dd")} - 選擇`
                )
              ) : (
                "撥款日期範圍"
              )}
            </span>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-[#26211C] border border-white/10 rounded-xl text-[#eae1da] shadow-2xl z-50"
            align="end"
          >
            <div className="p-3 border-b border-white/10 flex items-center justify-between gap-4">
              <span className="font-sans text-xs font-semibold text-text-primary">
                撥款日期範圍篩選
              </span>
              <button
                type="button"
                onClick={() =>
                  handleDateRangeChange({
                    from: subDays(new Date(), 30),
                    to: new Date(),
                  })
                }
                className="font-mono text-[11px] text-brand hover:underline"
              >
                近 30 天
              </button>
            </div>
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={handleDateRangeChange}
              numberOfMonths={1}
              className="p-3"
            />
            {dateRange?.from ? (
              <div className="p-3 border-t border-white/10 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleDateRangeChange(undefined)}
                  className="font-mono text-[11px] text-text-secondary hover:text-brand"
                >
                  清除日期
                </button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
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
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                Stripe 流水號
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                訂單號
              </TableHead>
              <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap">
                商戶名稱
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                Stripe 帳戶 ID
              </TableHead>
              <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap">
                訂單類型
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right whitespace-nowrap">
                卡價小計
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right whitespace-nowrap">
                佣金率
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right whitespace-nowrap">
                平台分成
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right whitespace-nowrap">
                鑑定費
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right whitespace-nowrap">
                商戶實收 (Transfer)
              </TableHead>
              <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center whitespace-nowrap">
                撥款狀態
              </TableHead>
              <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-center whitespace-nowrap">
                對賬
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                買家確認時間
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                PaymentIntent
              </TableHead>
              <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                撥款時間
              </TableHead>
              <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right whitespace-nowrap">
                操作
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pageData.rows.map((row) => {
              const isSelected = selectedIds.has(row.stripeTransferId);
              const statusBadge = (
                <span
                  className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${getPayoutStatusBadgeClass(row.payoutStatus)}`}
                >
                  {formatPayoutStatusLabel(row.payoutStatus)}
                </span>
              );

              return (
                <TableRow
                  key={row.stripeTransferId}
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
                      onChange={() => toggleSelectRow(row.stripeTransferId)}
                      className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                    />
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-brand font-bold py-3 whitespace-nowrap">
                    {row.stripeTransferId.startsWith("tr_") ? (
                      <a
                        href={getStripeTransferDashboardUrl(
                          row.stripeTransferId,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                      >
                        {row.stripeTransferId}
                      </a>
                    ) : (
                      row.stripeTransferId
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    <Link
                      href={`/profile/merchant/orderDetail/${row.orderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {row.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                    <Link
                      href={`/marketplace/${row.merchantId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-brand hover:underline"
                    >
                      {row.merchantName}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    {row.subAccountId.startsWith("acct_") ? (
                      <a
                        href={getStripeConnectDashboardUrl(row.subAccountId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand hover:underline"
                      >
                        {row.subAccountId}
                      </a>
                    ) : (
                      row.subAccountId
                    )}
                  </TableCell>
                  <TableCell className="font-sans text-[12px] text-text-primary py-3 whitespace-nowrap">
                    {formatOrderAuthType(row.requiresAuthentication)}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                    {formatAdminHkd(row.itemSubtotal)}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-text-secondary text-right py-3 whitespace-nowrap">
                    {formatCommissionRate(row.commissionRateApplied)}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-[13px] text-brand text-right py-3 whitespace-nowrap">
                    {formatAdminHkd(row.platformCommission)}
                  </TableCell>
                  <TableCell className="font-mono text-[12px] text-text-secondary text-right py-3 whitespace-nowrap">
                    {formatAdminHkd(row.authFee)}
                  </TableCell>
                  <TableCell className="font-mono font-bold text-[13px] text-success text-right py-3 whitespace-nowrap">
                    {formatAdminHkd(row.merchantPayoutAmount)}
                  </TableCell>
                  <TableCell className="text-center py-3 whitespace-nowrap">
                    {row.payoutStatus === "failed" ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="cursor-help inline-block">
                              {statusBadge}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-sm border border-white/10 bg-[#2e2925] text-[#eae1da]"
                          >
                            {row.payoutError ?? "未知錯誤"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      statusBadge
                    )}
                  </TableCell>
                  <TableCell className="text-center py-3 whitespace-nowrap">
                    {row.reconciliationWarning ? (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="cursor-help text-warning text-sm inline-block">
                              ⚠
                            </span>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            className="max-w-sm border border-white/10 bg-[#2e2925] text-[#eae1da]"
                          >
                            {row.reconciliationWarning}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                      <span className="text-text-disabled">—</span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    {row.buyerConfirmedAt ?? "—"}
                  </TableCell>
                  <TableCell
                    className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap"
                    title={row.stripePaymentIntentId ?? undefined}
                  >
                    {truncateStripeId(row.stripePaymentIntentId)}
                  </TableCell>
                  <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                    {row.payoutStatus === "held" &&
                    (!row.transferredAtIso || row.transferredAt === "—") &&
                    row.payoutHoldUntil ? (
                      <span title={`保留至 ${row.payoutHoldUntil}`}>
                        保留至 {row.payoutHoldUntil}
                      </span>
                    ) : (
                      row.transferredAt
                    )}
                  </TableCell>
                  <TableCell className="text-right py-3 whitespace-nowrap">
                    <a
                      href={`/profile/merchant/orderDetail/${row.orderId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap inline-flex items-center"
                    >
                      查看訂單
                    </a>
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
