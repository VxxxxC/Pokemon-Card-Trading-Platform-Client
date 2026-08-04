"use client";

import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-sans text-[24px] font-bold text-[#eae1da]">
            舉報與爭議仲裁工作台
          </h1>
          <p className="mt-0.5 font-sans text-[13px] text-[#d4c4b7]">
            全平台舉報、糾紛投訴、Stripe 支付爭議聯合仲裁管控面板
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/10 bg-[#26211C] px-4 py-2">
            <span className="block font-mono text-[18px] font-semibold text-[#f59e0b]">
              {pendingCount.toString().padStart(2, "0")}
            </span>
            <span className="block font-sans text-[11px] text-[#d4c4b7]">
              待處理
            </span>
          </div>
          <div className="rounded-xl border border-white/10 bg-[#26211C] px-4 py-2">
            <span className="block font-mono text-[18px] font-semibold text-[#10b981]">
              {completedCount.toString().padStart(2, "0")}
            </span>
            <span className="block font-sans text-[11px] text-[#d4c4b7]">
              已完成
            </span>
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 font-sans text-[13px] text-[#ef4444]">
          {error}
        </div>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-[#8A8680]" />
          <Input
            type="text"
            placeholder="搜尋案件單號、被舉報人、舉報人、類別..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-10 border-white/10 bg-[#17130f] pl-9 text-[#eae1da] placeholder:text-[#50453b] focus-visible:border-[#d4a574]/40 focus-visible:ring-[#d4a574]/40"
          />
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => {
            setActiveTab(v as TabValue);
            setCurrentPage(1);
          }}
          className="w-full lg:w-auto"
        >
          <TabsList className="h-10 w-full border border-white/10 bg-[#26211C] p-1 lg:w-auto">
            <TabsTrigger
              value="all"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              全部 ({total})
            </TabsTrigger>
            <TabsTrigger
              value="pending"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              待處理 ({pendingCount})
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex-1 text-[13px] text-[#d4c4b7] data-active:bg-[#d4a574]/15 data-active:text-[#d4a574]"
            >
              已完成 ({completedCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#26211C] p-1 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
        <div className="overflow-x-auto rounded-xl">
          <Table>
            <TableHeader>
              <TableRow className="border-white/[0.06] hover:bg-transparent">
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  案件單號
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  被舉報用戶
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  申訴買家/舉報人
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  舉報類別
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  嚴重程度
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  風控分數
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  詳細舉報原因
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  提交時間
                </TableHead>
                <TableHead className="font-sans text-[12px] font-semibold text-[#d4c4b7]">
                  案件狀態
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && !isLoading ? (
                <TableRow className="border-transparent hover:bg-transparent">
                  <TableCell colSpan={10} className="py-16 text-center">
                    <div className="flex flex-col items-center gap-3 text-[#d4c4b7]">
                      <span className="font-mono text-[28px]">⚖️</span>
                      <p className="font-sans text-[14px]">
                        目前沒有符合篩選條件的爭議案件。
                      </p>
                      <p className="font-sans text-[12px] text-[#8A8680]">
                        請嘗試清除搜尋字詞或切換其他狀態分頁。
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
                          className="mt-2 border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10"
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
                  const showPriorViolationBadge =
                    (c.status === "open" || c.status === "reviewing") &&
                    c.subjectPriorUpheldCount >= 1;

                  return (
                    <TableRow
                      key={c.id}
                      className="cursor-pointer border-white/[0.06] transition-all duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] hover:bg-[#39342f]"
                      onClick={() => handleRowClick(c.id)}
                    >
                      <TableCell>
                        <span className="font-mono text-[13px] font-medium text-[#eae1da]">
                          {c.caseNumber}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-sans text-[13px] text-[#eae1da]">
                              {c.subject.displayName ?? "未知用戶"}
                            </span>
                            {showPriorViolationBadge ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge
                                      variant="outline"
                                      className="border-[#d4a574]/40 bg-[#d4a574]/10 text-[10px] text-[#d4a574]"
                                      onClick={(event) => event.stopPropagation()}
                                    >
                                      曾有違規
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent className="border border-white/10 bg-[#2e2925] text-[#eae1da]">
                                    <p className="font-sans text-[12px]">
                                      此用戶曾有 {c.subjectPriorUpheldCount}{" "}
                                      宗成立裁定
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : null}
                          </div>
                          <span className="font-sans text-[11px] text-[#8A8680]">
                            @{c.subject.username ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-sans text-[13px] text-[#eae1da]">
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
                              <span className="font-mono text-[13px] font-semibold text-[#eae1da]">
                                {c.finalScore ?? 0}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent className="border border-white/10 bg-[#2e2925] text-[#eae1da]">
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
                              <p className="max-w-[240px] cursor-help truncate font-sans text-[13px] text-[#d4c4b7]">
                                {c.previewDetails ?? "—"}
                              </p>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              align="start"
                              className="max-w-sm border border-white/10 bg-[#2e2925] text-[#eae1da]"
                            >
                              <p className="font-sans text-[12px] leading-relaxed">
                                {c.previewDetails ?? "—"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <span className="font-sans text-[12px] text-[#8A8680]">
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
                          className="border-[#d4a574]/30 text-[#d4a574] hover:bg-[#d4a574]/10 active:scale-[0.98]"
                        >
                          <span className="mr-1">🔍</span>
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

        {rows.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-[#17130f] border-t border-white/10 rounded-b-xl">
            <div className="font-mono text-[12px] text-[#d4c4b7]">
              顯示第{" "}
              <span className="font-bold text-[#eae1da]">
                {(currentPage - 1) * pageSize + 1}
              </span>{" "}
              -{" "}
              <span className="font-bold text-[#eae1da]">
                {Math.min(currentPage * pageSize, total)}
              </span>{" "}
              筆，共{" "}
              <span className="font-bold text-[#d4a574]">{total}</span> 筆資料
              {isLoading ? "（更新中…）" : ""}
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="h-8 px-2.5 rounded-lg border border-white/10 bg-[#26211C] font-sans text-xs text-[#d4c4b7] hover:text-[#eae1da] hover:bg-[#2e2925] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                上一頁
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  disabled={isLoading}
                  onClick={() => setCurrentPage(p)}
                  className={`h-8 w-8 rounded-lg font-mono text-xs font-semibold transition-all ${
                    currentPage === p
                      ? "bg-[#d4a574] text-[#17130f] font-bold shadow-sm shadow-[#d4a574]/20"
                      : "border border-white/10 bg-[#26211C] text-[#d4c4b7] hover:text-[#eae1da] hover:bg-[#2e2925]"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages || isLoading}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="h-8 px-2.5 rounded-lg border border-white/10 bg-[#26211C] font-sans text-xs text-[#d4c4b7] hover:text-[#eae1da] hover:bg-[#2e2925] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                下一頁
              </button>
            </div>
          </div>
        )}
      </div>
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
        <div className="p-4 text-[#d4c4b7] font-mono text-xs">
          載入爭議資料中...
        </div>
      }
    >
      <AdminDisputesClientWithSearchParams {...props} />
    </Suspense>
  );
}
