"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  listAdminRewardActivities,
  setAdminRewardActivityStatus,
} from "@/app/actions/admin-reward-activities";
import { RewardActivityCard } from "@/app/admin/campaigns/components/RewardActivityCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type {
  AdminRewardActivityRow,
  AdminRewardActivityStatus,
} from "@/lib/admin-rewards/types";
import {
  activityMatchesSearch,
  DISPLAY_STATUS_LABELS,
  REWARD_ACTIVITY_PAGE_SIZE,
} from "@/lib/admin-rewards/template-form";

type AdminRewardActivitiesClientProps = {
  initialRows: AdminRewardActivityRow[];
  initialTotal: number;
  loadError: string | null;
};

const STATUS_CHIP_OPTIONS = [
  { key: "all", label: "全部" },
  { key: "draft", label: "草稿" },
  { key: "active", label: "進行中" },
  { key: "paused", label: "已暫停" },
  { key: "ended", label: "已結束" },
  { key: "archived", label: "已封存" },
] as const;

export function AdminRewardActivitiesClient({
  initialRows,
  initialTotal,
  loadError,
}: AdminRewardActivitiesClientProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  const fetchList = useCallback(
    (nextStatus: string, nextPage: number) => {
      startTransition(async () => {
        const result = await listAdminRewardActivities({
          status: nextStatus,
          page: nextPage,
          pageSize: REWARD_ACTIVITY_PAGE_SIZE,
        });
        if (!result.success) {
          toast.error(result.error);
          return;
        }
        setRows(result.data.rows);
        setTotal(result.data.total);
        setPage(result.data.page);
        setStatusFilter(nextStatus);
      });
    },
    [],
  );

  const handleStatus = (
    row: AdminRewardActivityRow,
    status: AdminRewardActivityStatus,
  ) => {
    startTransition(async () => {
      const result = await setAdminRewardActivityStatus(row.activity_id, status);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("活動狀態已更新");
      fetchList(statusFilter, page);
    });
  };

  const displayRows = useMemo(() => {
    if (!searchQuery.trim()) {
      return rows;
    }
    return rows.filter((row) => activityMatchesSearch(row, searchQuery));
  }, [rows, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(total / REWARD_ACTIVITY_PAGE_SIZE));
  const hasSearch = Boolean(searchQuery.trim());
  const rangeStart =
    total === 0 ? 0 : (page - 1) * REWARD_ACTIVITY_PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * REWARD_ACTIVITY_PAGE_SIZE, total);

  const handlePageChange = (nextPage: number) => {
    if (hasSearch) {
      return;
    }
    const clamped = Math.max(1, Math.min(totalPages, nextPage));
    fetchList(statusFilter, clamped);
    document
      .getElementById("reward-activity-list-anchor")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="space-y-6">
      {loadError ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      ) : null}

      <p className="text-sm text-text-secondary">
        管理自動發放與限時搶領獎勵，模板與檔期已合併為單一活動。
      </p>

      <section aria-labelledby="reward-activity-list-heading" className="space-y-3">
        <div
          id="reward-activity-list-anchor"
          className="scroll-mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h2
              id="reward-activity-list-heading"
              className="font-sans font-bold text-[15px] text-text-secondary"
            >
              活動列表
            </h2>
            <span className="font-mono text-[11px] font-normal text-text-disabled">
              共 {total} 個活動 (每頁 {REWARD_ACTIVITY_PAGE_SIZE} 筆)
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => router.push("/admin/campaigns/new")}>
              新增一般券
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/campaigns/new?flow=points_mall")}
            >
              新增積分商城商品
            </Button>
          </div>
        </div>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] p-3.5 space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            {STATUS_CHIP_OPTIONS.map((chip) => (
              <button
                key={chip.key}
                type="button"
                disabled={isPending}
                onClick={() => {
                  setSearchQuery("");
                  fetchList(chip.key, 1);
                }}
                className={`px-3 py-1.5 rounded-xl font-sans text-xs transition-all ${
                  statusFilter === chip.key
                    ? "bg-brand text-[#17130f] font-bold shadow-md shadow-brand/10"
                    : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="relative w-full">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-disabled text-xs">
              🔍
            </span>
            <Input
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜尋活動名稱、編號、類型或獎勵內容（僅篩選本頁）..."
              className="w-full h-9 pl-8 pr-8 bg-bg-page border-[rgba(237,232,224,0.12)] rounded-xl font-sans text-[12px] text-text-primary placeholder:text-text-disabled focus-visible:border-brand/40 focus-visible:ring-brand/40"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary font-bold text-xs"
              >
                ✕
              </button>
            ) : null}
          </div>

          {hasSearch ? (
            <p className="font-mono text-[10px] text-text-disabled">
              搜尋僅套用於目前第 {page} 頁的 {rows.length} 筆資料
            </p>
          ) : null}
        </div>

        <div className="bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)] overflow-hidden">
          {displayRows.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <p className="font-sans text-sm text-text-secondary font-medium">
                沒有符合條件的活動記錄
              </p>
              <p className="font-sans text-xs text-text-disabled">
                {hasSearch
                  ? "請調整搜尋關鍵字或切換狀態篩選"
                  : DISPLAY_STATUS_LABELS[statusFilter]
                    ? `目前沒有「${DISPLAY_STATUS_LABELS[statusFilter]}」狀態的活動`
                    : "請建立新活動或切換其他狀態篩選"}
              </p>
            </div>
          ) : (
            displayRows.map((row) => (
              <RewardActivityCard
                key={row.activity_id}
                row={row}
                disabled={isPending}
                onStatusChange={handleStatus}
              />
            ))
          )}
        </div>

        {!hasSearch ? (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-bg-card rounded-2xl border border-[rgba(237,232,224,0.08)]">
            <p className="font-mono text-xs text-text-secondary">
              顯示第{" "}
              <span className="text-text-primary font-bold">{rangeStart}</span> -{" "}
              <span className="text-text-primary font-bold">{rangeEnd}</span> 筆，共{" "}
              <span className="text-brand font-bold">{total}</span> 筆活動
            </p>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                disabled={isPending || page <= 1}
                onClick={() => handlePageChange(page - 1)}
                className="h-8 px-3 text-xs bg-bg-page border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary disabled:opacity-40"
              >
                ← 上一頁
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map(
                  (pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      disabled={isPending}
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 min-w-[32px] px-2 rounded-lg font-mono text-xs transition-colors ${
                        page === pageNum
                          ? "bg-brand text-[#17130f] font-bold"
                          : "bg-bg-page border border-[rgba(237,232,224,0.08)] text-text-secondary hover:text-text-primary hover:bg-bg-hover"
                      }`}
                    >
                      {pageNum}
                    </button>
                  ),
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                disabled={isPending || page >= totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="h-8 px-3 text-xs bg-bg-page border-[rgba(237,232,224,0.12)] text-text-secondary hover:text-text-primary disabled:opacity-40"
              >
                下一頁 →
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
