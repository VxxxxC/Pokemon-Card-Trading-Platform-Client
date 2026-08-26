"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Scale } from "lucide-react";
import { searchAdminModerationCases } from "@/app/actions/admin-moderation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  categoryBadgeClasses,
  deriveSeverityBand,
  formatCategoryLabel,
  formatModerationDateTime,
  moderationStatusBadgeClasses,
  moderationStatusLabel,
  severityBadgeClasses,
  severityLabel,
} from "@/lib/moderation/admin-case-presenters";
import type {
  AdminModerationCaseRow,
  AdminModerationSearchResult,
  AdminModerationSearchStatus,
} from "@/lib/moderation/types";

const BTN_OUTLINE_CLASS =
  "border-[rgba(237,232,224,0.12)] bg-transparent hover:border-brand/30 hover:bg-brand/10 hover:text-brand text-text-primary text-[12px] active:scale-[0.98]";

type TabValue = "all" | "pending" | "completed";

type AdminDisputesClientProps = {
  initialData: AdminModerationSearchResult;
  initialStatus: AdminModerationSearchStatus;
  loadError: string | null;
};

function tabToStatus(tab: TabValue): AdminModerationSearchStatus {
  if (tab === "pending") {
    return "pending";
  }
  if (tab === "completed") {
    return "completed";
  }
  return "all";
}

function statusParamToTab(statusParam: string | null): TabValue {
  if (statusParam === "pending") {
    return "pending";
  }
  if (statusParam === "completed" || statusParam === "resolved") {
    return "completed";
  }
  return "all";
}

function AdminDisputesContent({
  initialData,
  initialStatus,
  loadError,
  statusParam,
}: AdminDisputesClientProps & { statusParam: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabValue>(
    statusParamToTab(statusParam ?? (initialStatus === "all" ? null : initialStatus)),
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [rows, setRows] = useState<AdminModerationCaseRow[]>(initialData.rows);
  const [total, setTotal] = useState(initialData.total);
  const [pendingCount, setPendingCount] = useState(initialData.pendingCount);
  const [error, setError] = useState<string | null>(loadError);
  const [isLoading, setIsLoading] = useState(false);
  const pageSize = 10;

  const completedCount = useMemo(
    () => Math.max(total - pendingCount, 0),
    [pendingCount, total],
  );

  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  const tabChipOptions = useMemo(
    () => [
      { key: "all" as TabValue, label: "全部", count: total },
      { key: "pending" as TabValue, label: "待處理", count: pendingCount },
      { key: "completed" as TabValue, label: "已完成", count: completedCount },
    ],
    [completedCount, pendingCount, total],
  );

  const fetchCases = useCallback(
    async (params: {
      tab: TabValue;
      page: number;
      search: string;
    }) => {
      setIsLoading(true);
      setError(null);

      const result = await searchAdminModerationCases({
        status: tabToStatus(params.tab),
        page: params.page,
        pageSize,
        search: params.search || undefined,
      });

      if (!result.success) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setRows(result.data.rows);
      setTotal(result.data.total);
      setPendingCount(result.data.pendingCount);
      setIsLoading(false);
    },
    [pageSize],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchCases({ tab: activeTab, page: currentPage, search: query });
    }, query ? 300 : 0);

    return () => window.clearTimeout(timer);
  }, [activeTab, currentPage, query, fetchCases]);

  const handleRowClick = (id: string) => {
    router.push(`/admin/disputes/${id}`);
  };

  return (
    <div className="space-y-5 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-sans text-[24px] font-bold tracking-tight text-text-primary">
              舉報與爭議仲裁工作台
            </h1>
            <span className="rounded-full border border-brand/20 bg-brand/10 px-2.5 py-0.5 font-mono text-[11px] font-medium text-brand">
              MODERATION
            </span>
          </div>
          <p className="mt-1 font-sans text-[13px] text-text-secondary">
            全平台舉報、糾紛投訴、Stripe 支付爭議聯合仲裁管控面板
          </p>
        </div>
        <p className="font-mono text-[12px] text-text-secondary sm:shrink-0 sm:self-end">
          待處理{" "}
          <span className="font-medium text-warning">{pendingCount}</span>
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 font-sans text-[13px] text-error">
          {error}
        </div>
      ) : null}

      <div className="space-y-4 border-b border-white/[0.08] pb-5">
        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled"
            aria-hidden="true"
          />
          <Input
            type="text"
            placeholder="搜尋案件單號、被舉報人、舉報人、類別..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-11 w-full border-white/10 bg-transparent pl-10 text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
          />
        </div>

        <FilterChipRow
          label="狀態"
          options={tabChipOptions}
          active={activeTab}
          onSelect={(key) => {
            setActiveTab(key);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className={`overflow-x-auto ${isLoading ? "opacity-60" : ""}`}>
        <Table>
          <TableHeader className="border-b border-white/[0.08]">
            <TableRow className="border-white/[0.06] hover:bg-transparent">
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                案件單號
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                被舉報用戶
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                申訴買家/舉報人
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                舉報類別
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                嚴重程度
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                風控分數
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                詳細舉報原因
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                提交時間
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary">
                案件狀態
              </TableHead>
              <TableHead className="font-sans text-[12px] font-semibold text-text-secondary" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && !isLoading ? (
              <TableRow className="border-transparent hover:bg-transparent">
                <TableCell colSpan={10} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-3 text-text-secondary">
                    <Scale className="size-8 text-brand/60" aria-hidden="true" />
                    <p className="font-sans text-[14px] text-text-primary">
                      目前沒有符合篩選條件的爭議案件
                    </p>
                    <p className="font-sans text-[12px] text-text-disabled">
                      請嘗試清除搜尋字詞或切換其他狀態分頁
                    </p>
                    {(query || activeTab !== "all") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuery("");
                          setActiveTab("all");
                          setCurrentPage(1);
                        }}
                        className={BTN_OUTLINE_CLASS}
                      >
                        清除篩選條件
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              rows.map((c) => {
                const severity = deriveSeverityBand(c.finalScore);
                const reporterLabel =
                  c.reporterPreview.extraCount > 0
                    ? `${c.reporterPreview.displayName} (+${c.reporterPreview.extraCount})`
                    : c.reporterPreview.displayName;

                return (
                  <TableRow
                    key={c.id}
                    className="cursor-pointer border-white/[0.06] transition-colors even:bg-transparent odd:bg-bg-card/40 hover:bg-brand/10"
                    onClick={() => handleRowClick(c.id)}
                  >
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[13px] font-medium text-text-primary">
                          {c.caseNumber}
                        </span>
                        {(c.status === "open" || c.status === "reviewing") &&
                        (c.subjectPriorUpheldCount ?? 0) >= 1 ? (
                          <Badge
                            variant="outline"
                            className="w-fit border-warning/20 bg-warning/10 text-warning"
                          >
                            曾有違規
                          </Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-sans text-[13px] text-text-primary">
                          {c.subject.displayName ?? "未知用戶"}
                        </span>
                        <span className="font-sans text-[11px] text-text-disabled">
                          @{c.subject.username ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-sans text-[13px] text-text-primary">
                        {reporterLabel}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={categoryBadgeClasses(c.primaryCategory)}
                      >
                        {formatCategoryLabel(c.primaryCategory)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={severityBadgeClasses(severity)}
                      >
                        {severityLabel(severity)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <span className="font-mono text-[13px] font-semibold text-text-primary">
                              {c.finalScore ?? 0}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="border border-white/10 bg-bg-elevated text-text-primary">
                            <p className="font-sans text-[12px]">
                              自動分數 {c.autoScore} + 管理員調整{" "}
                              {c.adminAdjustment}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <p className="max-w-[240px] cursor-help truncate font-sans text-[13px] text-text-secondary">
                              {c.previewDetails ?? "—"}
                            </p>
                          </TooltipTrigger>
                          <TooltipContent
                            side="top"
                            align="start"
                            className="max-w-sm border border-white/10 bg-bg-elevated text-text-primary"
                          >
                            <p className="font-sans text-[12px] leading-relaxed">
                              {c.previewDetails ?? "—"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-[12px] text-text-secondary">
                        {formatModerationDateTime(c.createdAt)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={moderationStatusBadgeClasses(c.status)}
                      >
                        {moderationStatusLabel(c.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRowClick(c.id);
                        }}
                        className={BTN_OUTLINE_CLASS}
                      >
                        查看詳情
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {rows.length > 0 ? (
        <div className="flex items-center justify-between font-mono text-[12px] text-text-secondary">
          <span>
            顯示第 {(currentPage - 1) * pageSize + 1}–
            {Math.min(currentPage * pageSize, total)} 筆 · 共 {total} 筆
            {isLoading ? "（更新中…）" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === 1 || isLoading}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className={BTN_OUTLINE_CLASS}
            >
              上一頁
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={currentPage === totalPages || isLoading}
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              className={BTN_OUTLINE_CLASS}
            >
              下一頁
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AdminDisputesClientWithSearchParams(props: AdminDisputesClientProps) {
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");
  return (
    <AdminDisputesContent
      {...props}
      key={statusParam || "default"}
      statusParam={statusParam}
    />
  );
}

export function AdminDisputesClient(props: AdminDisputesClientProps) {
  return (
    <Suspense
      fallback={
        <div className="p-4 font-mono text-xs text-text-secondary">
          載入爭議資料中...
        </div>
      }
    >
      <AdminDisputesClientWithSearchParams {...props} />
    </Suspense>
  );
}

function FilterChipRow<K extends string>({
  label,
  options,
  active,
  onSelect,
}: {
  label: string;
  options: { key: K; label: string; count: number }[];
  active: K;
  onSelect: (key: K) => void;
}) {
  return (
    <div className="space-y-2">
      <span className="font-sans text-[11px] font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map(({ key, label: optionLabel, count }) => {
          const selected = active === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              className={`min-h-[36px] rounded-lg border px-3 py-1.5 font-sans text-[12px] transition-colors active:scale-[0.98] ${
                selected
                  ? "border-brand/40 bg-brand/15 font-semibold text-brand"
                  : "border-transparent text-text-secondary hover:border-brand/30 hover:bg-brand/10 hover:text-brand"
              }`}
            >
              {optionLabel} ({count})
            </button>
          );
        })}
      </div>
    </div>
  );
}
