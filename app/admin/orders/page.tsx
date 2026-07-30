"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, startOfDay, endOfDay } from "date-fns";
import type { DateRange } from "react-day-picker";
import {
  Search,
  Calendar as CalendarIcon,
  X,
  CheckCircle,
  XCircle,
  Package,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

import type {
  AdminOrderRowItem,
  AdminOrderStatus,
  GradingStatus,
} from "./types";
import {
  MOCK_ADMIN_ORDERS,
  ORDER_STATUS_LABELS,
  GRADING_STATUS_LABELS,
  PERSONA_LABELS,
  parseLocalDate,
} from "./mockOrders";
import {
  formatCurrency,
  orderStatusBadgeClasses,
  gradingStatusBadgeClasses,
  personaBadgeClasses,
} from "./utils";

// ── Constants & Options ─────────────────────────────────────────────────────
const PAGE_SIZE = 15;

type MainTab = "platform" | "grading";
type PlatformStatusFilter = "all" | AdminOrderStatus;
type GradingStatusFilter = "all" | GradingStatus;
type SortValue =
  | "createdAt-desc"
  | "createdAt-asc"
  | "amount-desc"
  | "amount-asc";

const SORT_OPTIONS: { value: SortValue; label: string }[] = [
  { value: "createdAt-desc", label: "建立時間：最新 → 最舊" },
  { value: "createdAt-asc", label: "建立時間：最舊 → 最新" },
  { value: "amount-desc", label: "金額：高至低" },
  { value: "amount-asc", label: "金額：低至高" },
];

const PLATFORM_STATUS_OPTIONS: {
  key: PlatformStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "全部" },
  { key: "pending", label: "待處理" },
  { key: "custody", label: "倉庫託管" },
  { key: "grading", label: "鑑定中" },
  { key: "shipped", label: "運送中" },
  { key: "completed", label: "已完成" },
  { key: "cancelled", label: "已取消" },
];

const GRADING_STATUS_OPTIONS: {
  key: GradingStatusFilter;
  label: string;
}[] = [
  { key: "all", label: "全部" },
  { key: "pending_grading", label: "待鑑定" },
  { key: "passed_authentic", label: "已鑑定-真品" },
  { key: "failed_fake", label: "已鑑定-偽品" },
];

// ── Filter Chips ─────────────────────────────────────────────────────────────
function FilterChips<K extends string>({
  options,
  active,
  onSelect,
}: {
  options: { key: K; label: string }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {options.map(({ key, label }) => {
        const selected = active === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={cn(
              "min-h-[44px] px-3 py-1.5 rounded-lg font-sans text-[12px] transition-[color,background-color,border-color,transform] duration-150 border active:scale-[0.98]",
              selected
                ? "bg-brand/10 text-brand font-semibold border-brand/40"
                : "text-text-secondary border-white/10 hover:text-text-primary hover:border-white/20",
            )}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}

// ── Date Range Picker ────────────────────────────────────────────────────────
function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger className="min-h-[44px] h-10 px-3 bg-bg-page border border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-xs text-text-primary hover:bg-bg-elevated hover:border-brand/40 transition-[color,background-color,border-color] duration-150 flex items-center gap-2">
        <CalendarIcon className="w-3.5 h-3.5 text-brand" />
        <span>
          {value?.from ? (
            value.to ? (
              `${format(value.from, "yyyy/MM/dd")} - ${format(value.to, "yyyy/MM/dd")}`
            ) : (
              `${format(value.from, "yyyy/MM/dd")} - 選擇`
            )
          ) : (
            "選擇日期範圍"
          )}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-bg-card border border-white/10 rounded-xl text-text-primary shadow-2xl z-50"
        align="end"
      >
        <div className="p-3 border-b border-white/10 flex items-center justify-between gap-4">
          <span className="font-sans text-xs font-semibold text-text-primary">
            訂單日期範圍篩選
          </span>
          <button
            type="button"
            onClick={() =>
              onChange({
                from: new Date(2026, 0, 1),
                to: new Date(2026, 6, 31),
              })
            }
            className="font-mono text-[11px] text-brand hover:underline"
          >
            2026 全期
          </button>
        </div>
        <Calendar
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={1}
          className="p-3 bg-transparent text-text-primary"
        />
      </PopoverContent>
    </Popover>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminOrdersPage() {
  const router = useRouter();

  // TODO: [Supabase Wiring] Replace MOCK_ADMIN_ORDERS with real Supabase query
  const [orders, setOrders] = useState<AdminOrderRowItem[]>(MOCK_ADMIN_ORDERS);
  const [activeTab, setActiveTab] = useState<MainTab>("platform");

  // Platform tab state
  const [platformSearch, setPlatformSearch] = useState("");
  const [platformStatus, setPlatformStatus] = useState<PlatformStatusFilter>("all");
  const [platformSort, setPlatformSort] = useState<SortValue>("createdAt-desc");
  const [platformDateRange, setPlatformDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [platformPage, setPlatformPage] = useState(1);

  // Grading tab state
  const [gradingSearch, setGradingSearch] = useState("");
  const [gradingStatusFilter, setGradingStatusFilter] = useState<GradingStatusFilter>("all");
  const [gradingSort, setGradingSort] = useState<SortValue>("createdAt-desc");
  const [gradingDateRange, setGradingDateRange] = useState<DateRange | undefined>(
    undefined,
  );
  const [gradingPage, setGradingPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const totalOrders = orders.length;
    const pendingGrading = orders.filter(
      (o) => o.gradingStatus === "pending_grading",
    ).length;
    const escrowHeld = orders
      .filter(
        (o) =>
          o.useAuthentication === true &&
          o.gradingStatus === "passed_authentic" &&
          o.status !== "completed",
      )
      .reduce((sum, o) => sum + o.totalPaid, 0);
    return { totalOrders, pendingGrading, escrowHeld };
  }, [orders]);

  // ── Platform Data Pipeline: filter → search → sort → paginate ─────────────
  const filteredPlatformOrders = useMemo(() => {
    let list = [...orders];

    // Status chip filter
    if (platformStatus !== "all") {
      list = list.filter((o) => o.status === platformStatus);
    }

    // Date range filter
    if (platformDateRange?.from || platformDateRange?.to) {
      const fromMs = platformDateRange.from
        ? startOfDay(platformDateRange.from).getTime()
        : 0;
      const toMs = platformDateRange.to
        ? endOfDay(platformDateRange.to).getTime()
        : Infinity;
      list = list.filter((o) => {
        const ts = parseLocalDate(o.createdAt);
        return ts >= fromMs && ts <= toMs;
      });
    }

    // Search
    const q = platformSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.cardName.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.sellerName.toLowerCase().includes(q),
      );
    }

    return list;
  }, [orders, platformStatus, platformDateRange, platformSearch]);

  const sortedPlatformOrders = useMemo(() => {
    const list = [...filteredPlatformOrders];
    switch (platformSort) {
      case "createdAt-desc":
        return list.sort((a, b) => parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt));
      case "createdAt-asc":
        return list.sort((a, b) => parseLocalDate(a.createdAt) - parseLocalDate(b.createdAt));
      case "amount-desc":
        return list.sort((a, b) => b.totalPaid - a.totalPaid);
      case "amount-asc":
        return list.sort((a, b) => a.totalPaid - b.totalPaid);
      default:
        return list;
    }
  }, [filteredPlatformOrders, platformSort]);

  const totalPlatformPages = Math.ceil(sortedPlatformOrders.length / PAGE_SIZE) || 1;
  const paginatedPlatformOrders = useMemo(() => {
    const start = (platformPage - 1) * PAGE_SIZE;
    return sortedPlatformOrders.slice(start, start + PAGE_SIZE);
  }, [sortedPlatformOrders, platformPage]);

  // ── Grading Data Pipeline: filter → search → sort → paginate ──────────────
  const filteredGradingOrders = useMemo(() => {
    let list = orders.filter((o) => o.useAuthentication === true);

    // Grading status chip filter
    if (gradingStatusFilter !== "all") {
      list = list.filter((o) => o.gradingStatus === gradingStatusFilter);
    }

    // Date range filter
    if (gradingDateRange?.from || gradingDateRange?.to) {
      const fromMs = gradingDateRange.from
        ? startOfDay(gradingDateRange.from).getTime()
        : 0;
      const toMs = gradingDateRange.to
        ? endOfDay(gradingDateRange.to).getTime()
        : Infinity;
      list = list.filter((o) => {
        const ts = parseLocalDate(o.createdAt);
        return ts >= fromMs && ts <= toMs;
      });
    }

    // Search
    const q = gradingSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.cardName.toLowerCase().includes(q) ||
          o.buyerName.toLowerCase().includes(q) ||
          o.sellerName.toLowerCase().includes(q),
      );
    }

    return list;
  }, [orders, gradingStatusFilter, gradingDateRange, gradingSearch]);

  const sortedGradingOrders = useMemo(() => {
    const list = [...filteredGradingOrders];
    switch (gradingSort) {
      case "createdAt-desc":
        return list.sort((a, b) => parseLocalDate(b.createdAt) - parseLocalDate(a.createdAt));
      case "createdAt-asc":
        return list.sort((a, b) => parseLocalDate(a.createdAt) - parseLocalDate(b.createdAt));
      case "amount-desc":
        return list.sort((a, b) => b.totalPaid - a.totalPaid);
      case "amount-asc":
        return list.sort((a, b) => a.totalPaid - b.totalPaid);
      default:
        return list;
    }
  }, [filteredGradingOrders, gradingSort]);

  const totalGradingPages = Math.ceil(sortedGradingOrders.length / PAGE_SIZE) || 1;
  const paginatedGradingOrders = useMemo(() => {
    const start = (gradingPage - 1) * PAGE_SIZE;
    return sortedGradingOrders.slice(start, start + PAGE_SIZE);
  }, [sortedGradingOrders, gradingPage]);

  // ── Handlers (reset page + selection on filter change) ────────────────────
  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab);
    setPlatformPage(1);
    setGradingPage(1);
    setSelectedIds(new Set());
  };

  const handlePlatformStatusChange = (filter: PlatformStatusFilter) => {
    setPlatformStatus(filter);
    setPlatformPage(1);
    setSelectedIds(new Set());
  };

  const handlePlatformSearchChange = (value: string) => {
    setPlatformSearch(value);
    setPlatformPage(1);
    setSelectedIds(new Set());
  };

  const handlePlatformSortChange = (value: SortValue) => {
    setPlatformSort(value);
    setPlatformPage(1);
    setSelectedIds(new Set());
  };

  const handlePlatformDateRangeChange = (range: DateRange | undefined) => {
    setPlatformDateRange(range);
    setPlatformPage(1);
    setSelectedIds(new Set());
  };

  const handleGradingStatusChange = (filter: GradingStatusFilter) => {
    setGradingStatusFilter(filter);
    setGradingPage(1);
    setSelectedIds(new Set());
  };

  const handleGradingSearchChange = (value: string) => {
    setGradingSearch(value);
    setGradingPage(1);
    setSelectedIds(new Set());
  };

  const handleGradingSortChange = (value: SortValue) => {
    setGradingSort(value);
    setGradingPage(1);
    setSelectedIds(new Set());
  };

  const handleGradingDateRangeChange = (range: DateRange | undefined) => {
    setGradingDateRange(range);
    setGradingPage(1);
    setSelectedIds(new Set());
  };

  // ── Row Click Navigation ──────────────────────────────────────────────────
  const handleRowClick = (id: string) => {
    router.push(`/admin/orders/${id}`);
  };

  // ── Batch Selection ───────────────────────────────────────────────────────
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredGradingOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredGradingOrders.map((o) => o.id)));
    }
  };

  const toggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // ── Grading Actions ───────────────────────────────────────────────────────
  const applyGradingStatus = (targetStatus: GradingStatus, ids?: Set<string>) => {
    const targetIds = ids ? Array.from(ids) : [];
    if (targetIds.length === 0) return;

    setOrders((prev) =>
      prev.map((o) =>
        targetIds.includes(o.id) ? { ...o, gradingStatus: targetStatus } : o,
      ),
    );

    const label = GRADING_STATUS_LABELS[targetStatus];
    toast.success(`已將 ${targetIds.length} 筆訂單標記為「${label}」`);
    setSelectedIds(new Set());
  };

  const handleBatchPass = () => applyGradingStatus("passed_authentic", selectedIds);
  const handleBatchFail = () => applyGradingStatus("failed_fake", selectedIds);

  // ── Render: KPI Cards ─────────────────────────────────────────────────────
  const renderKpis = () => (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <span className="font-sans text-[12px] text-text-secondary block">
          全站總訂單數
        </span>
        <span className="font-mono font-bold text-[28px] text-brand block mt-1">
          {kpis.totalOrders.toLocaleString("zh-HK")}
        </span>
      </div>
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[12px] text-text-secondary block">
            待鑑定實物卡牌
          </span>
          <span className="inline-flex items-center rounded border border-warning/20 bg-warning/10 px-1.5 py-0.5 font-mono text-[10px] text-warning">
            待處理
          </span>
        </div>
        <span className="font-mono font-bold text-[28px] text-warning block mt-1">
          {kpis.pendingGrading.toLocaleString("zh-HK")}
        </span>
      </div>
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <span className="font-sans text-[12px] text-text-secondary block">
          待釋放 Escrow 總額
        </span>
        <span className="font-mono font-bold text-[28px] text-success block mt-1">
          {formatCurrency(kpis.escrowHeld)}
        </span>
      </div>
    </div>
  );

  // ── Render: Segmented Tabs ────────────────────────────────────────────────
  const renderSegmentedTabs = () => (
    <div className="w-full bg-bg-page p-1.5 rounded-2xl border border-[rgba(237,232,224,0.08)]">
      <div className="grid grid-cols-2 gap-1.5">
        <button
          type="button"
          onClick={() => handleTabChange("platform")}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-[color,background-color,transform] duration-150 min-w-0 min-h-[44px] active:scale-[0.98]",
            activeTab === "platform"
              ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
          )}
        >
          <span className="truncate">平台訂單</span>
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("grading")}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-sans text-xs font-semibold transition-[color,background-color,transform] duration-150 min-w-0 min-h-[44px] active:scale-[0.98]",
            activeTab === "grading"
              ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
              : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
          )}
        >
          <span className="truncate">鑑定認證</span>
          <span className="font-mono text-[10px] bg-[#17130f]/20 px-1.5 py-0.5 rounded-full shrink-0">
            {kpis.pendingGrading}
          </span>
        </button>
      </div>
    </div>
  );

  // ── Render: Platform Order Row Card ───────────────────────────────────────
  const renderPlatformRow = (order: AdminOrderRowItem) => (
    <div
      key={order.id}
      onClick={() => handleRowClick(order.id)}
      className="group flex flex-col gap-3 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-page p-4 transition-[color,background-color,border-color,transform] duration-150 hover:bg-bg-elevated hover:border-white/10 cursor-pointer active:scale-[0.98]"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col min-w-[140px]">
          <span className="font-mono text-[13px] font-semibold text-brand">
            {order.orderNumber}
          </span>
          <span className="font-sans text-[11px] text-text-secondary">
            {order.createdAt}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-sans text-[14px] font-medium text-text-primary">
              {order.cardName}
            </span>
            <span className="font-mono text-[11px] text-text-secondary">
              {order.cardGrade}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[12px] text-text-secondary">
            <span>
              買家：<span className="text-text-primary">{order.buyerName}</span>
            </span>
            <span className="flex items-center gap-1.5">
              賣家：
              <span className="text-text-primary">{order.sellerName}</span>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-sans px-1.5 py-0 rounded",
                  personaBadgeClasses(order.sellerPersona),
                )}
              >
                {PERSONA_LABELS[order.sellerPersona]}
              </Badge>
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end sm:flex-col sm:items-end">
          <span className="font-mono text-[15px] font-semibold text-text-primary">
            {formatCurrency(order.totalPaid)}
          </span>
          <Badge
            variant="outline"
            className={cn(
              "font-sans text-[11px] px-2 py-0.5 rounded border",
              orderStatusBadgeClasses(order.status),
            )}
          >
            {ORDER_STATUS_LABELS[order.status]}
          </Badge>
        </div>
      </div>
    </div>
  );

  // ── Render: Platform Tab ──────────────────────────────────────────────────
  const renderPlatformTab = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled" />
            <Input
              type="text"
              placeholder="搜尋訂單編號、卡牌名稱、買家或賣家..."
              value={platformSearch}
              onChange={(e) => handlePlatformSearchChange(e.target.value)}
              className="h-10 border-white/10 bg-bg-page pl-9 text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
            />
            {platformSearch && (
              <button
                type="button"
                onClick={() => handlePlatformSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={platformSort}
              onValueChange={(v) => handlePlatformSortChange(v as SortValue)}
            >
              <SelectTrigger className="min-h-[44px] h-10 w-52 bg-bg-card border border-white/10 rounded-lg text-text-primary font-sans text-[12px] focus:ring-0 focus:border-brand/40">
                <SelectValue placeholder="排序方式">
                  {SORT_OPTIONS.find((opt) => opt.value === platformSort)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-bg-card border border-white/10 rounded-lg text-text-primary font-sans text-[12.5px]">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="min-h-[44px] focus:bg-bg-hover focus:text-brand cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              value={platformDateRange}
              onChange={handlePlatformDateRangeChange}
            />
          </div>
        </div>

        <FilterChips
          options={PLATFORM_STATUS_OPTIONS}
          active={platformStatus}
          onSelect={handlePlatformStatusChange}
        />
      </div>

      {/* Order List */}
      <div className="space-y-3">
        {sortedPlatformOrders.length === 0 ? (
          <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-10 text-center">
            <Package className="h-6 w-6 text-text-secondary mx-auto" />
            <p className="mt-3 font-sans text-[14px] text-text-secondary">
              目前沒有符合篩選條件的訂單。
            </p>
            <p className="font-sans text-[12px] text-text-disabled">
              請嘗試清除搜尋字詞、日期範圍或切換其他狀態分頁。
            </p>
            {(platformSearch || platformStatus !== "all" || platformDateRange) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handlePlatformSearchChange("");
                  handlePlatformStatusChange("all");
                  handlePlatformDateRangeChange(undefined);
                }}
                className="mt-4 border-brand/30 text-brand hover:bg-brand/10 active:scale-[0.98] transition-[color,background-color,transform] duration-150"
              >
                清除篩選條件
              </Button>
            )}
          </div>
        ) : (
          paginatedPlatformOrders.map(renderPlatformRow)
        )}
      </div>

      {/* Pagination */}
      {sortedPlatformOrders.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border border-[rgba(237,232,224,0.08)] rounded-xl">
          <div className="font-mono text-[12px] text-text-secondary">
            顯示第{" "}
            <span className="font-bold text-text-primary">
              {(platformPage - 1) * PAGE_SIZE + 1}
            </span>{" "}
            -{" "}
            <span className="font-bold text-text-primary">
              {Math.min(platformPage * PAGE_SIZE, sortedPlatformOrders.length)}
            </span>{" "}
            筆，共{" "}
            <span className="font-bold text-brand">
              {sortedPlatformOrders.length}
            </span>{" "}
            筆資料
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={platformPage === 1}
              onClick={() => setPlatformPage((prev) => Math.max(prev - 1, 1))}
              className="min-h-[44px] h-10 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform] duration-150 active:scale-[0.98] disabled:active:scale-100"
            >
              上一頁
            </button>
            {Array.from({ length: totalPlatformPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatformPage(p)}
                className={cn(
                  "min-h-[44px] h-10 w-10 rounded-lg font-mono text-xs font-semibold transition-[color,background-color,transform] duration-150 active:scale-[0.98]",
                  platformPage === p
                    ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                    : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
                )}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={platformPage === totalPlatformPages}
              onClick={() =>
                setPlatformPage((prev) => Math.min(prev + 1, totalPlatformPages))
              }
              className="min-h-[44px] h-10 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform] duration-150 active:scale-[0.98] disabled:active:scale-100"
            >
              下一頁
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // ── Render: Grading Tab ───────────────────────────────────────────────────
  const renderGradingTab = () => (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled" />
            <Input
              type="text"
              placeholder="搜尋訂單編號、卡牌名稱、買家或賣家..."
              value={gradingSearch}
              onChange={(e) => handleGradingSearchChange(e.target.value)}
              className="h-10 border-white/10 bg-bg-page pl-9 text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
            />
            {gradingSearch && (
              <button
                type="button"
                onClick={() => handleGradingSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={gradingSort}
              onValueChange={(v) => handleGradingSortChange(v as SortValue)}
            >
              <SelectTrigger className="min-h-[44px] h-10 w-52 bg-bg-card border border-white/10 rounded-lg text-text-primary font-sans text-[12px] focus:ring-0 focus:border-brand/40">
                <SelectValue placeholder="排序方式">
                  {SORT_OPTIONS.find((opt) => opt.value === gradingSort)?.label}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-bg-card border border-white/10 rounded-lg text-text-primary font-sans text-[12.5px]">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="min-h-[44px] focus:bg-bg-hover focus:text-brand cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <DateRangePicker
              value={gradingDateRange}
              onChange={handleGradingDateRangeChange}
            />
          </div>
        </div>

        <FilterChips
          options={GRADING_STATUS_OPTIONS}
          active={gradingStatusFilter}
          onSelect={handleGradingStatusChange}
        />
      </div>

      {/* Batch Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-3">
          <Badge
            variant="outline"
            className="bg-brand/10 text-brand border-brand/30 font-sans text-[12px] px-2 py-1"
          >
            已選擇 ({selectedIds.size}) 筆項目
          </Badge>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={handleBatchPass}
              className="min-h-[44px] h-10 px-3 rounded-lg bg-success text-[#17130f] hover:bg-success/90 text-xs font-bold gap-1.5 active:scale-[0.98] transition-[color,background-color,transform] duration-150"
            >
              <CheckCircle className="size-3.5" />
              批量鑑定通過-真品
            </Button>
            <Button
              type="button"
              onClick={handleBatchFail}
              className="min-h-[44px] h-10 px-3 rounded-lg bg-error text-[#17130f] hover:bg-error/90 text-xs font-bold gap-1.5 active:scale-[0.98] transition-[color,background-color,transform] duration-150"
            >
              <XCircle className="size-3.5" />
              批量鑑定不通過-偽品
            </Button>
          </div>
        </div>
      )}

      {/* High-Density Table */}
      <div className="rounded-2xl border border-[rgba(237,232,224,0.08)] bg-bg-card p-1 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="overflow-x-auto rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[rgba(237,232,224,0.08)] hover:bg-transparent">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={
                      filteredGradingOrders.length > 0 &&
                      selectedIds.size === filteredGradingOrders.length
                    }
                    onCheckedChange={toggleSelectAll}
                    aria-label="全選"
                  />
                </TableHead>
                <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  訂單編號
                </TableHead>
                <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  訂單狀態
                </TableHead>
                <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap text-right">
                  商品金額
                </TableHead>
                <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap text-right">
                  鑑定服務費
                </TableHead>
                <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  買方姓名
                </TableHead>
                <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  賣方姓名
                </TableHead>
                <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  賣家速遞單號
                </TableHead>
                <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  鑑定狀態
                </TableHead>
                <TableHead className="font-mono text-[11px] text-text-secondary h-10 whitespace-nowrap">
                  平台速遞單號
                </TableHead>
                <TableHead className="font-sans text-[11px] text-text-secondary h-10 whitespace-nowrap text-right">
                  操作
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedGradingOrders.length === 0 ? (
                <TableRow className="border-transparent hover:bg-transparent">
                  <TableCell
                    colSpan={11}
                    className="py-16 text-center text-text-secondary font-sans text-[14px]"
                  >
                    目前沒有符合篩選條件的鑑定訂單。
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGradingOrders.map((order) => {
                  const isSelected = selectedIds.has(order.id);
                  return (
                    <TableRow
                      key={order.id}
                      className={cn(
                        "border-b border-[rgba(237,232,224,0.06)] transition-colors cursor-pointer",
                        isSelected
                          ? "bg-[rgba(212,165,116,0.08)]"
                          : "hover:bg-bg-elevated/40",
                      )}
                      onClick={() => handleRowClick(order.id)}
                    >
                      <TableCell
                        className="w-10 text-center py-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(order.id)}
                          aria-label={`選擇 ${order.orderNumber}`}
                        />
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-brand">
                          {order.orderNumber}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-sans text-[10px] px-1.5 py-0.5 rounded border",
                            orderStatusBadgeClasses(order.status),
                          )}
                        >
                          {ORDER_STATUS_LABELS[order.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap text-right">
                        <span className="font-mono text-[13px] text-text-primary">
                          {formatCurrency(order.itemPrice)}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap text-right">
                        <span className="font-mono text-[13px] text-text-secondary">
                          {order.appraisalFee > 0
                            ? formatCurrency(order.appraisalFee)
                            : "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span className="font-sans text-[13px] text-text-primary">
                          {order.buyerName}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-sans text-[13px] text-text-primary">
                            {order.sellerName}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[9px] font-sans px-1 py-0 rounded",
                              personaBadgeClasses(order.sellerPersona),
                            )}
                          >
                            {PERSONA_LABELS[order.sellerPersona]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-text-secondary">
                          {order.inboundTrackingNo ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={cn(
                            "font-sans text-[10px] px-1.5 py-0.5 rounded border",
                            gradingStatusBadgeClasses(order.gradingStatus),
                          )}
                        >
                          {GRADING_STATUS_LABELS[order.gradingStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">
                        <span className="font-mono text-[11px] text-text-secondary">
                          {order.outboundTrackingNo ?? "—"}
                        </span>
                      </TableCell>
                      <TableCell
                        className="py-3 whitespace-nowrap text-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {order.gradingStatus === "pending_grading" ? (
                          <div className="flex justify-end items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                applyGradingStatus("passed_authentic", new Set([order.id]))
                              }
                              className="min-h-[44px] h-9 px-2.5 bg-success text-[#17130f] font-sans font-bold text-[10px] rounded-lg hover:bg-success/90 active:scale-[0.98] transition-transform duration-150"
                            >
                              鑑定通過
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                applyGradingStatus("failed_fake", new Set([order.id]))
                              }
                              className="min-h-[44px] h-9 px-2.5 bg-error text-[#17130f] font-sans font-bold text-[10px] rounded-lg hover:bg-error/90 active:scale-[0.98] transition-transform duration-150"
                            >
                              鑑定不通過
                            </button>
                          </div>
                        ) : (
                          <span className="font-sans text-[11px] text-text-disabled">
                            —
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {sortedGradingOrders.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-bg-page border-t border-[rgba(237,232,224,0.08)] rounded-b-xl">
            <div className="font-mono text-[12px] text-text-secondary">
              顯示第{" "}
              <span className="font-bold text-text-primary">
                {(gradingPage - 1) * PAGE_SIZE + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-text-primary">
                {Math.min(gradingPage * PAGE_SIZE, sortedGradingOrders.length)}
              </span>{" "}
              筆，共{" "}
              <span className="font-bold text-brand">
                {sortedGradingOrders.length}
              </span>{" "}
              筆資料
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={gradingPage === 1}
                onClick={() => setGradingPage((prev) => Math.max(prev - 1, 1))}
              className="min-h-[44px] h-10 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform] duration-150 active:scale-[0.98] disabled:active:scale-100"
            >
              上一頁
              </button>
                {Array.from({ length: totalGradingPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setGradingPage(p)}
                  className={cn(
                    "min-h-[44px] h-10 w-10 rounded-lg font-mono text-xs font-semibold transition-[color,background-color,transform] duration-150 active:scale-[0.98]",
                    gradingPage === p
                      ? "bg-brand text-[#17130f] font-bold shadow-sm shadow-brand/20"
                      : "border border-[rgba(237,232,224,0.12)] bg-bg-card text-text-secondary hover:text-text-primary hover:bg-bg-elevated",
                  )}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={gradingPage === totalGradingPages}
                onClick={() =>
                  setGradingPage((prev) => Math.min(prev + 1, totalGradingPages))
                }
                className="min-h-[44px] h-10 px-3 rounded-lg border border-[rgba(237,232,224,0.12)] bg-bg-card font-sans text-xs text-text-secondary hover:text-text-primary hover:bg-bg-elevated disabled:opacity-40 disabled:cursor-not-allowed transition-[color,background-color,transform] duration-150 active:scale-[0.98] disabled:active:scale-100"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ─────────────────────────────────────────────────────── */}
      <div>
        <h1 className="font-sans text-[24px] font-bold text-text-primary">
          訂單與鑑定管理
        </h1>
        <p className="mt-0.5 font-sans text-[13px] text-text-secondary">
          管理全站訂單、鑑定流程與 Escrow 資金釋放
        </p>
      </div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      {renderKpis()}

      {/* ── Segmented Tabs ──────────────────────────────────────────────────── */}
      {renderSegmentedTabs()}

      {/* ── Tab Content ─────────────────────────────────────────────────────── */}
      {activeTab === "platform" ? renderPlatformTab() : renderGradingTab()}
    </div>
  );
}
