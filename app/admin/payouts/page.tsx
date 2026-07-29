"use client";

import { useRouter } from "next/navigation";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { RefreshCw, Search, X, Calendar as CalendarIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import type {
  WithdrawalRequest,
  MerchantStripeFlow,
  SortDirection,
  FpsFilter,
  FpsSortValue,
  StripeSortValue,
  StripeLogStatus,
  StripeLogVariant,
  StripeLogRow,
  StripePayoutLog,
  StripeTransferLog,
} from "./types";

import {
  MOCK_WITHDRAWALS,
  MOCK_MERCHANT_FLOWS,
  MOCK_PAYOUT_LOGS,
  MOCK_TRANSFER_LOGS,
  stripePlatformBalance,
  parseLocalDate,
} from "./mockPayouts";

// ── Sort Options ─────────────────────────────────────────────────────────────
const FPS_SORT_OPTIONS: { value: FpsSortValue; label: string }[] = [
  { value: "none", label: "預設排序" },
  { value: "userName-asc", label: "用戶名稱：A → Z" },
  { value: "userName-desc", label: "用戶名稱：Z → A" },
  { value: "submittedAt-desc", label: "提交時間：最新優先" },
  { value: "submittedAt-asc", label: "提交時間：最舊優先" },
];

const STRIPE_SORT_OPTIONS: { value: StripeSortValue; label: string }[] = [
  { value: "none", label: "預設排序" },
  { value: "merchantName-asc", label: "商戶名稱：A → Z" },
  { value: "merchantName-desc", label: "商戶名稱：Z → A" },
  { value: "createdAt-desc", label: "建立日期：最新優先" },
  { value: "createdAt-asc", label: "建立日期：最舊優先" },
];

// ── Status Helpers ───────────────────────────────────────────────────────────
const STATUS_LABELS: Record<WithdrawalRequest["status"], string> = {
  pending: "待處理",
  processing: "處理中",
  completed: "已完成",
  failed: "已駁回",
};

const STATUS_BADGES = {
  pending: "text-warning bg-warning/10 border-warning/20",
  processing: "text-brand bg-brand/10 border-brand/20",
  completed: "text-success bg-success/10 border-success/20",
  failed: "text-error bg-error/10 border-error/20",
};


// ── Reusable In-File Components ──────────────────────────────────────────────
/** 排序下拉選單（擺於搜尋列下方，取代舊有的表頭點擊排序）。 */
function SortSelect<V extends string>({
  value,
  options,
  onChange,
}: {
  value: V;
  options: { value: V; label: string }[];
  onChange: (value: V) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-sans text-[11px] text-text-secondary whitespace-nowrap">
        排序
      </span>
      <Select value={value} onValueChange={(next) => onChange(next as V)}>
        <SelectTrigger
          aria-label="排序方式"
          className="w-44 min-w-44 min-h-[44px] h-11 bg-[#26211C] border border-white/5 rounded-[8px] text-[#eae1da] font-sans text-[12px] hover:bg-[#322a24] hover:border-white/10 transition-colors focus-visible:ring-0 focus-visible:border-brand/40"
        >
          <SelectValue placeholder="預設排序">
            {options.find((opt) => opt.value === value)?.label ?? "預設排序"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-[#26211C] border border-white/10 rounded-lg text-[#eae1da] font-sans text-[12.5px] shadow-2xl">
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className="min-h-[44px] focus:bg-[#322a24] focus:text-brand cursor-pointer transition-colors"
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const STRIPE_LOG_PAGE_SIZE = 15;

const STRIPE_LOG_STATUS_LABELS: Record<StripeLogStatus, string> = {
  paid: "已到賬",
  pending: "處理中",
  in_transit: "轉賬中",
  failed: "失敗",
};

const STRIPE_LOG_STATUS_CLASSES: Record<StripeLogStatus, string> = {
  paid: "text-success bg-success/10 border-success/20",
  pending: "text-brand bg-brand/10 border-brand/20",
  in_transit: "text-brand bg-brand/10 border-brand/20",
  failed: "text-error bg-error/10 border-error/20",
};

function FilterChips<K extends string>({
  options,
  active,
  onSelect,
}: {
  options: { key: K; label: string; count: number }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 bg-[#17130f] p-1 rounded-xl border border-[rgba(237,232,224,0.08)]">
      {options.map(({ key, label, count }) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`min-h-[44px] px-3 py-1 rounded-lg font-sans text-[11px] transition-colors border ${
              selected
                ? "bg-brand/10 text-brand font-semibold border-brand/40"
                : "text-text-secondary border-white/10 hover:text-text-primary hover:border-white/20"
            }`}
          >
            {label} ({count})
          </button>
        );
      })}
    </div>
  );
}

function StripeLogPanel({ variant }: { variant: StripeLogVariant }) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const rawRows: StripeLogRow[] =
    variant === "payout" ? MOCK_PAYOUT_LOGS : MOCK_TRANSFER_LOGS;

  const filteredRows = useMemo(() => {
    let result = rawRows;

    // Search query filter
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      if (variant === "payout") {
        result = result.filter((row) => {
          const payout = row as StripePayoutLog;
          const statusLabel = STRIPE_LOG_STATUS_LABELS[payout.status] || "";
          return (
            payout.id.toLowerCase().includes(q) ||
            payout.recipient.toLowerCase().includes(q) ||
            payout.status.toLowerCase().includes(q) ||
            statusLabel.includes(q)
          );
        });
      } else {
        result = result.filter((row) => {
          const transfer = row as StripeTransferLog;
          const statusLabel = STRIPE_LOG_STATUS_LABELS[transfer.status] || "";
          return (
            transfer.id.toLowerCase().includes(q) ||
            transfer.merchantName.toLowerCase().includes(q) ||
            transfer.status.toLowerCase().includes(q) ||
            statusLabel.includes(q)
          );
        });
      }
    }

    // Date range filter according to createdAt timestamp
    if (dateRange?.from || dateRange?.to) {
      const fromMs = dateRange.from ? startOfDay(dateRange.from).getTime() : 0;
      const toMs = dateRange.to ? endOfDay(dateRange.to).getTime() : Infinity;

      result = result.filter((row) => {
        const timestamp = parseLocalDate(row.createdAt);
        return timestamp >= fromMs && timestamp <= toMs;
      });
    }

    return result;
  }, [rawRows, variant, searchQuery, dateRange]);

  const totalPages =
    Math.ceil(filteredRows.length / STRIPE_LOG_PAGE_SIZE) || 1;

  const paginatedRows = useMemo(() => {
    const start = (page - 1) * STRIPE_LOG_PAGE_SIZE;
    return filteredRows.slice(start, start + STRIPE_LOG_PAGE_SIZE);
  }, [filteredRows, page]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setPage(1);
  };

  const title =
    variant === "payout"
      ? "Stripe Log — 平台放款紀錄"
      : "Stripe Log — 商戶交易紀錄";
  const subtitle =
    variant === "payout"
      ? "平台 Stripe 帳戶撥款至會員收款帳戶之交易日誌"
      : "商戶 Stripe Connect 子帳戶分賬與交易日誌";

  const headers =
    variant === "payout"
      ? ["Payout ID", "收款會員", "金額", "狀態", "建立時間"]
      : ["Transfer ID", "商戶名稱", "分賬金額", "平台分成", "狀態", "建立時間"];

  return (
    <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[420px]">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-1">
          <h3 className="font-sans font-bold text-[16px] text-text-primary">
            {title}
          </h3>
          <p className="font-sans text-[12px] text-text-secondary">{subtitle}</p>
        </div>

        {/* Filter Toolbar: Searchbar + Date Range Picker */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder={
                variant === "payout"
                  ? "搜尋 Payout ID、收款人或狀態..."
                  : "搜尋 Transfer ID、商戶或狀態..."
              }
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full h-10 pl-9 pr-8 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary placeholder:text-text-disabled focus:outline-none focus:border-brand/40"
            />
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-text-disabled" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => handleSearchChange("")}
                className="absolute right-2.5 top-2.5 text-text-disabled hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Date Range Picker */}
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
                  "選擇日期範圍"
                )}
              </span>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#26211C] border border-white/10 rounded-xl text-[#eae1da] shadow-2xl z-50"
              align="end"
            >
              <div className="p-3 border-b border-white/10 flex items-center justify-between gap-4">
                <span className="font-sans text-xs font-semibold text-text-primary">
                  日誌日期範圍篩選
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
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={handleDateRangeChange}
                numberOfMonths={1}
                className="p-3 bg-transparent text-[#eae1da]"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page overflow-x-auto">
        <Table>
          <TableHeader className="bg-bg-elevated/50 sticky top-0 z-10">
            <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
              {headers.map((header) => (
                <TableHead
                  key={header}
                  className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap"
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={headers.length}
                  className="text-center py-8 font-sans text-xs text-text-secondary"
                >
                  沒有符合條件的 Stripe 日誌紀錄
                </TableCell>
              </TableRow>
            ) : (
              paginatedRows.map((row) => {
                if (variant === "payout") {
                  const payout = row as StripePayoutLog;
                  return (
                    <TableRow
                      key={payout.id}
                      className="border-b border-[rgba(237,232,224,0.06)] hover:bg-bg-elevated/40 transition-colors"
                    >
                      <TableCell className="py-3 whitespace-nowrap">
                        <span
                          className="font-mono text-[11px] text-text-disabled truncate max-w-[140px] block"
                          title={payout.id}
                        >
                          {payout.id}
                        </span>
                      </TableCell>
                      <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                        {payout.recipient}
                      </TableCell>
                      <TableCell className="font-mono font-bold text-[13px] text-text-primary py-3 whitespace-nowrap">
                        HK$ {payout.amount.toLocaleString("zh-TW")}
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span
                          className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${STRIPE_LOG_STATUS_CLASSES[payout.status]}`}
                        >
                          {STRIPE_LOG_STATUS_LABELS[payout.status]}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                        {payout.createdAt}
                      </TableCell>
                    </TableRow>
                  );
                }
                const transfer = row as StripeTransferLog;
                return (
                  <TableRow
                    key={transfer.id}
                    className="border-b border-[rgba(237,232,224,0.06)] hover:bg-bg-elevated/40 transition-colors"
                  >
                    <TableCell className="py-3 whitespace-nowrap">
                      <span
                        className="font-mono text-[11px] text-text-disabled truncate max-w-[140px] block"
                        title={transfer.id}
                      >
                        {transfer.id}
                      </span>
                    </TableCell>
                    <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                      {transfer.merchantName}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[13px] text-text-primary py-3 whitespace-nowrap">
                      HK$ {transfer.splitAmount.toLocaleString("zh-TW")}
                    </TableCell>
                    <TableCell className="font-mono font-bold text-[13px] text-brand text-right py-3 whitespace-nowrap">
                      HK$ {transfer.platformCommission.toLocaleString("zh-TW")}
                    </TableCell>
                    <TableCell className="py-3 whitespace-nowrap">
                      <span
                        className={`inline-block font-mono text-[9px] px-2 py-0.5 rounded border ${STRIPE_LOG_STATUS_CLASSES[transfer.status]}`}
                      >
                        {STRIPE_LOG_STATUS_LABELS[transfer.status]}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                      {transfer.createdAt}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {filteredRows.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
          <div className="font-mono text-[12px] text-text-secondary">
            顯示第{" "}
            <span className="font-bold text-text-primary">
              {(page - 1) * STRIPE_LOG_PAGE_SIZE + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-text-primary">
              {Math.min(page * STRIPE_LOG_PAGE_SIZE, filteredRows.length)}
            </span>{" "}
            筆，共{" "}
            <span className="font-bold text-brand">{filteredRows.length}</span>{" "}
            筆資料
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100"
            >
              上一頁
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all active:scale-[0.98] ${
                  page === p
                    ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                    : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={page === totalPages}
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] disabled:active:scale-100"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminPayoutsPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"fps" | "stripe">("fps");
  const [withdrawals, setWithdrawals] =
    useState<WithdrawalRequest[]>(MOCK_WITHDRAWALS);
  const [merchantFlows] = useState<MerchantStripeFlow[]>(MOCK_MERCHANT_FLOWS);

  // Search and Filter state
  const [fpsSearch, setFpsSearch] = useState("");
  const [fpsFilter, setFpsFilter] = useState<FpsFilter>("incomplete");
  const [fpsSort, setFpsSort] = useState<FpsSortValue>("none");

  const [stripeSearch, setStripeSearch] = useState("");
  const [stripeSort, setStripeSort] = useState<StripeSortValue>("none");

  // Pagination State
  const [fpsPage, setFpsPage] = useState(1);
  const [stripePage, setStripePage] = useState(1);
  const pageSize = 10;

  // Checkbox multi-select state
  const [selectedFpsIds, setSelectedFpsIds] = useState<Set<string>>(new Set());
  const [selectedStripeIds, setSelectedStripeIds] = useState<Set<string>>(
    new Set(),
  );

  // ── FPS Counts (from unfiltered source) ────────────────────────────────────
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

  // ── FPS Pending Total Amount (pending + processing) ────────────────────────
  const fpsPendingTotalAmount = useMemo(() => {
    return withdrawals
      .filter((w) => w.status === "pending" || w.status === "processing")
      .reduce((sum, w) => sum + w.amount, 0);
  }, [withdrawals]);

  // ── FPS Data Pipeline: filter chip → search → sort → paginate ──────────────
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

  // ── Stripe Data Pipeline: search → sort → paginate ─────────────────────────
  const filteredMerchantFlows = useMemo(() => {
    const q = stripeSearch.toLowerCase().trim();
    if (!q) return merchantFlows;

    return merchantFlows.filter(
      (m) =>
        m.merchantName.toLowerCase().includes(q) ||
        m.stripeTransferId.toLowerCase().includes(q) ||
        m.orderNumber.toLowerCase().includes(q) ||
        m.subAccountId.toLowerCase().includes(q),
    );
  }, [merchantFlows, stripeSearch]);

  const sortedMerchantFlows = useMemo(() => {
    if (stripeSort === "none") return filteredMerchantFlows;
    const [key, direction] = stripeSort.split("-") as [
      "merchantName" | "createdAt",
      SortDirection,
    ];
    return [...filteredMerchantFlows].sort((a, b) => {
      if (key === "merchantName") {
        return direction === "asc"
          ? a.merchantName.localeCompare(b.merchantName, "zh-HK")
          : b.merchantName.localeCompare(a.merchantName, "zh-HK");
      }
      if (key === "createdAt") {
        return direction === "asc"
          ? parseLocalDate(a.createdAt) - parseLocalDate(b.createdAt)
          : parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt);
      }
      return 0;
    });
  }, [filteredMerchantFlows, stripeSort]);

  const totalStripePages =
    Math.ceil(sortedMerchantFlows.length / pageSize) || 1;
  const paginatedMerchantFlows = useMemo(() => {
    const start = (stripePage - 1) * pageSize;
    return sortedMerchantFlows.slice(start, start + pageSize);
  }, [sortedMerchantFlows, stripePage]);

  // ── Sort / Filter / Search Handlers (always reset page + selection) ────────
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

  const handleStripeSort = (value: StripeSortValue) => {
    setStripeSort(value);
    setStripePage(1);
    setSelectedStripeIds(new Set());
  };

  const handleStripeSearchChange = (value: string) => {
    setStripeSearch(value);
    setStripePage(1);
    setSelectedStripeIds(new Set());
  };

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
    if (selectedStripeIds.size === filteredMerchantFlows.length) {
      setSelectedStripeIds(new Set());
    } else {
      setSelectedStripeIds(
        new Set(filteredMerchantFlows.map((m) => m.stripeTransferId)),
      );
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
    // 該筆狀態一改就可能被當前 filter 濾走，必須同步取消選取，避免批次操作／導出到看不見的紀錄。
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

  const handleExportFpsCSV = () => {
    const selectedList = withdrawals.filter((w) => selectedFpsIds.has(w.id));
    const targetList = selectedList.length > 0 ? selectedList : sortedWithdrawals; // 全量導出＝跟隨當前 filter / search / sort 結果，避免與畫面不一致

    if (targetList.length === 0) {
      toast.warning("沒有可導出的提現紀錄！");
      return;
    }

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
  };

  // ── Merchant Stripe CSV Export ─────────────────────────────────────────────
  const handleExportMerchantCSV = () => {
    const selectedList = merchantFlows.filter((m) =>
      selectedStripeIds.has(m.stripeTransferId),
    );
    const targetList = selectedList.length > 0 ? selectedList : sortedMerchantFlows;

    if (targetList.length === 0) {
      toast.warning("沒有可導出的商戶流水紀錄！");
      return;
    }

    const headers =
      "Stripe流水號,訂單號,商戶名稱,Stripe帳戶ID,帳戶餘額(HK$),分賬總額(HK$),平台分成(HK$),建立日期\n";
    const rows = targetList
      .map(
        (m) =>
          `"${m.stripeTransferId}","${m.orderNumber}","${m.merchantName}","${m.subAccountId}",${m.balance},${m.totalPayout},${m.platformCommission},"${m.createdAt}"`,
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
    <div className="flex flex-col min-h-[calc(100dvh-100px)] space-y-4">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div className="bg-bg-card p-4 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <h1 className="font-sans font-bold text-[20px] text-text-primary">
          財務與結算管控台
        </h1>
        <p className="font-sans text-[12px] text-text-secondary mt-0.5">
          人手 FPS 批處理銷帳與 Stripe Connect 商戶賬戶與佣金收益監控
        </p>
      </div>

      {/* ── 頂部餘額 / FPS 提現總覽卡片 ────────────────────────────────────────── */}
      <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 relative overflow-hidden">
        <div className="flex items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-sans font-bold text-[16px] text-text-primary">
              {activeTab === "fps" ? "FPS 提現總覽" : "Stripe 平台帳戶餘額"}
            </h2>
            <p className="font-sans text-[12px] text-text-secondary mt-0.5">
              {activeTab === "fps"
                ? "待處理與處理中提現之總額"
                : "平台 Stripe Connect 主帳戶即時資金狀況"}
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              toast.success(
                activeTab === "fps"
                  ? "已重新整理 FPS 提現資料"
                  : "已重新整理 Stripe 帳戶餘額",
              )
            }
            className="min-h-[44px] h-9 px-3 border border-brand/30 text-brand font-sans text-[12px] rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-all flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            重新整理
          </button>
        </div>

        {activeTab === "fps" ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                待處理筆數
              </span>
              <span className="font-mono font-bold text-[24px] text-warning tracking-tight leading-none block mt-1">
                {withdrawals.filter((w) => w.status === "pending").length}
              </span>
            </div>
            <div>
              <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                待處理/處理中提現總額 (Pending FPS Payouts)
              </span>
              <span className="font-mono font-bold text-[24px] text-brand tracking-tight leading-none block mt-1">
                HK$ {fpsPendingTotalAmount.toLocaleString("zh-TW")}
              </span>
            </div>
            <div>
              <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                處理中筆數
              </span>
              <span className="font-mono font-bold text-[24px] text-warning tracking-tight leading-none block mt-1">
                {withdrawals.filter((w) => w.status === "processing").length}
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                可用餘額 (Available)
              </span>
              <span className="font-mono font-bold text-[24px] text-brand tracking-tight leading-none block mt-1">
                HK$ {stripePlatformBalance.available.toLocaleString("zh-TW")}
              </span>
            </div>
            <div>
              <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                待結算 (Pending)
              </span>
              <span className="font-mono font-bold text-[24px] text-text-primary tracking-tight leading-none block mt-1">
                HK$ {stripePlatformBalance.pending.toLocaleString("zh-TW")}
              </span>
            </div>
            <div>
              <span className="font-mono text-[11px] text-text-disabled uppercase block tracking-wider">
                今日入賬 (Today In)
              </span>
              <span className="font-mono font-bold text-[24px] text-success tracking-tight leading-none block mt-1">
                HK$ {stripePlatformBalance.todayIn.toLocaleString("zh-TW")}
              </span>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-[rgba(237,232,224,0.08)] font-mono text-[11px] text-text-secondary">
          {activeTab === "fps"
            ? "即時運算"
            : `最後同步：${stripePlatformBalance.lastSyncedAt}`}
        </div>
      </div>

      {/* ── Full-Width Segmented Tab Selector ───────────────────────────────── */}
      <div className="w-full bg-[#17130f] p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("fps")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "fps"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">FPS 批次處理</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {withdrawals.filter((w) => w.status === "pending").length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("stripe")}
            className={`flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-all min-w-0 ${
              activeTab === "stripe"
                ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
            }`}
          >
            <span className="truncate">商戶流水 (Stripe)</span>
            <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
              {merchantFlows.length}
            </span>
          </button>
        </div>
      </div>

      {/* ── Main Data Table Container (Full Height Flex) ────────────────── */}
      <div className="flex-1 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-5 flex flex-col justify-between space-y-4 min-h-[500px]">
        {/* ── Tab 1: FPS 批次處理 View ──────────────────────────────────── */}
        {activeTab === "fps" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Row 1: Search */}
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
            </div>

            {/* Row 2: Filter + Sort + Batch + Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
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

              <div className="flex items-center gap-2 shrink-0">
                {selectedFpsIds.size > 0 && (
                  <Button
                    type="button"
                    onClick={handleBatchComplete}
                    className="h-9 px-3 rounded-lg bg-success text-[#111] hover:bg-success/90 text-xs font-bold gap-1.5"
                  >
                    ✓ 批量銷帳
                  </Button>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportFpsCSV}
                  className={cn(
                    "h-9 px-3 rounded-lg text-xs font-medium transition-all gap-1.5",
                    selectedFpsIds.size > 0
                      ? "border-brand bg-bg-card text-brand hover:bg-brand/10 hover:text-brand"
                      : "border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>
                    {selectedFpsIds.size > 0
                      ? `導出已選 (${selectedFpsIds.size})`
                      : "導出全部 CSV"}
                  </span>
                </Button>
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

            {/* ── FPS Table Pagination ─────────────────────────────────── */}
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

        {/* Stripe payout log (outside main table container, sibling) */}
        {activeTab === "fps" && <StripeLogPanel variant="payout" />}

        {/* ── Tab 2: 商戶流水 (Stripe) View ──────────────────────── */}
        {activeTab === "stripe" && (
          <div className="flex-1 flex flex-col justify-between space-y-4">
            {/* Row 1: Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative w-full sm:w-72 md:w-80">
                <input
                  type="text"
                  placeholder="搜尋商戶名稱、Stripe 流水號或訂單號..."
                  value={stripeSearch}
                  onChange={(e) => handleStripeSearchChange(e.target.value)}
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
            </div>

            {/* Row 2: Sort + Export */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SortSelect
                value={stripeSort}
                options={STRIPE_SORT_OPTIONS}
                onChange={handleStripeSort}
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleExportMerchantCSV}
                className={cn(
                  "h-9 px-3 rounded-lg text-xs font-medium transition-all gap-1.5",
                  selectedStripeIds.size > 0
                    ? "border-brand bg-bg-card text-brand hover:bg-brand/10 hover:text-brand"
                    : "border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                )}
              >
                <Download className="h-3.5 w-3.5" />
                <span>
                  {selectedStripeIds.size > 0
                    ? `導出已選 (${selectedStripeIds.size})`
                    : "導出全部 CSV"}
                </span>
              </Button>
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
                          filteredMerchantFlows.length > 0 &&
                          selectedStripeIds.size ===
                            filteredMerchantFlows.length
                        }
                        onChange={toggleSelectAllStripe}
                        className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                      />
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      Stripe 流水號
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      訂單號
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10">
                      商戶名稱
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      Stripe 帳戶 ID
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      帳戶餘額
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      分賬總額
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10 text-right">
                      平台分成
                    </TableHead>
                    <TableHead className="font-mono text-[11px] text-text-secondary h-10">
                      建立日期
                    </TableHead>
                    <TableHead className="font-sans text-[11px] text-text-secondary h-10 text-right">
                      操作
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedMerchantFlows.map((flow) => {
                    const isSelected = selectedStripeIds.has(
                      flow.stripeTransferId,
                    );
                    return (
                      <TableRow
                        key={flow.stripeTransferId}
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
                            onChange={() =>
                              toggleSelectStripeRow(flow.stripeTransferId)
                            }
                            className="rounded border-[rgba(237,232,224,0.2)] bg-bg-card accent-brand cursor-pointer"
                          />
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-brand font-bold py-3 whitespace-nowrap">
                          {flow.stripeTransferId}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {flow.orderNumber}
                        </TableCell>
                        <TableCell className="font-sans font-semibold text-[13px] text-text-primary py-3 whitespace-nowrap">
                          {flow.merchantName}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {flow.subAccountId}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-text-primary text-right py-3 whitespace-nowrap">
                          HK$ {flow.balance.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-success text-right py-3 whitespace-nowrap">
                          HK$ {flow.totalPayout.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-[13px] text-brand text-right py-3 whitespace-nowrap">
                          HK$ {flow.platformCommission.toLocaleString("zh-TW")}
                        </TableCell>
                        <TableCell className="font-mono text-[11px] text-text-disabled py-3 whitespace-nowrap">
                          {flow.createdAt}
                        </TableCell>
                        <TableCell className="text-right py-3 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              router.push(
                                `/profile/merchant/orderDetail/${flow.orderNumber}`,
                              )
                            }
                            className="min-h-[44px] h-9 px-2.5 text-brand font-sans text-[11px] font-medium rounded-lg hover:bg-brand/10 active:scale-[0.98] transition-transform whitespace-nowrap"
                          >
                            查看訂單
                          </button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* ── Stripe Table Pagination ─────────────────────────────────── */}
            {sortedMerchantFlows.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
                <div className="font-mono text-[12px] text-text-secondary">
                  顯示第{" "}
                  <span className="font-bold text-text-primary">
                    {(stripePage - 1) * pageSize + 1}
                  </span>{" "}
                  -{" "}
                  <span className="font-bold text-text-primary">
                    {Math.min(
                      stripePage * pageSize,
                      sortedMerchantFlows.length,
                    )}
                  </span>{" "}
                  筆，共{" "}
                  <span className="font-bold text-brand">
                    {sortedMerchantFlows.length}
                  </span>{" "}
                  筆資料
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={stripePage === 1}
                    onClick={() =>
                      setStripePage((prev) => Math.max(prev - 1, 1))
                    }
                    className="min-h-[44px] h-11 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    上一頁
                  </button>
                  {Array.from(
                    { length: totalStripePages },
                    (_, i) => i + 1,
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setStripePage(p)}
                      className={`min-h-[44px] h-11 w-11 rounded-lg font-mono text-xs font-semibold transition-all ${
                        stripePage === p
                          ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                          : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={stripePage === totalStripePages}
                    onClick={() =>
                      setStripePage((prev) =>
                        Math.min(prev + 1, totalStripePages),
                      )
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

        {/* Stripe transfer log (outside main table container, sibling) */}
        {activeTab === "stripe" && <StripeLogPanel variant="transfer" />}
      </div>
    </div>
  );
}
