"use client";

import { useMemo, useState } from "react";
import { subDays, format, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Search, X, Calendar as CalendarIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  MOCK_PAYOUT_LOGS,
  MOCK_TRANSFER_LOGS,
  STRIPE_LOG_PAGE_SIZE,
  STRIPE_LOG_STATUS_CLASSES,
  STRIPE_LOG_STATUS_LABELS,
  parseLocalDate,
  type StripeLogRow,
  type StripeLogVariant,
  type StripePayoutLog,
  type StripeTransferLog,
} from "../mock-data";

type StripeLogPanelProps = {
  variant: StripeLogVariant;
  transferRows?: StripeTransferLog[];
};

export default function StripeLogPanel({ variant, transferRows }: StripeLogPanelProps) {
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const rawRows: StripeLogRow[] = useMemo(() => {
    if (variant === "payout") return MOCK_PAYOUT_LOGS;
    if (transferRows && transferRows.length > 0) return transferRows;
    return MOCK_TRANSFER_LOGS;
  }, [variant, transferRows]);

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
