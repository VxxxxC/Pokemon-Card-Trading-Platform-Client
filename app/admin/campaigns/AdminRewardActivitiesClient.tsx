"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState, useTransition } from "react";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import {
  getAdminRewardActivityStatusCounts,
  listAdminRewardActivities,
  setAdminRewardActivityStatus,
  type AdminRewardActivityStatusCountKey,
} from "@/app/actions/admin-reward-activities";
import { RewardActivityCard } from "@/app/admin/campaigns/components/RewardActivityCard";
import { Pagination } from "@/app/components/ui/Pagination";
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
import {
  BTN_OUTLINE_CLASS,
  BTN_PRIMARY_CLASS,
  FILTER_CHIP_CLASS,
  FILTER_INPUT_CLASS,
} from "./campaigns-ui";

type AdminRewardActivitiesClientProps = {
  initialRows: AdminRewardActivityRow[];
  initialTotal: number;
  initialStatusCounts: Record<StatusChipKey, number> | null;
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

type StatusChipKey = AdminRewardActivityStatusCountKey;

function formatActivityCount(value: number): string {
  return value.toLocaleString("en-US");
}

export function AdminRewardActivitiesClient({
  initialRows,
  initialTotal,
  initialStatusCounts,
  loadError,
}: AdminRewardActivitiesClientProps) {
  const router = useRouter();
  const [rows, setRows] = useState(initialRows);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusCounts, setStatusCounts] = useState<Record<StatusChipKey, number>>(
    initialStatusCounts ?? {
      all: initialTotal,
      draft: 0,
      active: 0,
      paused: 0,
      ended: 0,
      archived: 0,
    },
  );
  const [isPending, startTransition] = useTransition();

  const refreshStatusCounts = useCallback(async () => {
    const result = await getAdminRewardActivityStatusCounts();
    if (!result.success) {
      return;
    }
    setStatusCounts(result.data);
  }, []);

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
        if (
          nextStatus === "all" ||
          nextStatus === "draft" ||
          nextStatus === "active" ||
          nextStatus === "paused" ||
          nextStatus === "ended" ||
          nextStatus === "archived"
        ) {
          setStatusCounts((prev) => ({
            ...prev,
            [nextStatus]: result.data.total,
          }));
        }
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
      await refreshStatusCounts();
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
    <div className="space-y-4">
      {loadError ? (
        <div className="rounded-lg border border-error/30 bg-error/10 px-4 py-3 font-sans text-[13px] text-error">
          {loadError}
        </div>
      ) : null}

      <div
        id="reward-activity-list-anchor"
        className="scroll-mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="font-sans text-[15px] font-bold text-text-primary">
            活動列表
          </h2>
          <p className="font-mono text-[11px] text-text-disabled">
            共 {total.toLocaleString("en-US")} 筆 · 每頁{" "}
            {REWARD_ACTIVITY_PAGE_SIZE}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push("/admin/campaigns/new")}
            className={BTN_PRIMARY_CLASS}
          >
            新增一般券
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/campaigns/new?flow=points_mall")}
            className={BTN_OUTLINE_CLASS}
          >
            新增積分商城商品
          </button>
        </div>
      </div>

      <div className="space-y-3 border-b border-white/[0.08] pb-4">
        <p className="rounded-lg border border-brand/20 bg-brand/5 px-3 py-2 font-sans text-[11px] leading-relaxed text-text-secondary">
          搜尋只會篩選<strong className="text-text-primary">目前已載入的本頁</strong>
          活動；換頁或切換狀態後需重新搜尋。
        </p>

        <div className="relative w-full">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-text-disabled"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="搜尋名稱、編號、類型（僅本頁）"
            className={`w-full ${FILTER_INPUT_CLASS}`}
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-disabled hover:text-text-primary"
              aria-label="清除搜尋"
            >
              <X className="size-3.5" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_CHIP_OPTIONS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              disabled={isPending}
              onClick={() => {
                setSearchQuery("");
                fetchList(chip.key, 1);
              }}
              className={FILTER_CHIP_CLASS(statusFilter === chip.key)}
            >
              {chip.label} ({formatActivityCount(statusCounts[chip.key])})
            </button>
          ))}
        </div>

        {hasSearch ? (
          <p className="font-mono text-[11px] text-warning">
            本頁篩選結果：{displayRows.length} / {rows.length} 筆（第 {page} 頁）
          </p>
        ) : null}
      </div>

      <div className={`divide-y divide-white/[0.06] ${isPending ? "opacity-60" : ""}`}>
        {displayRows.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <p className="font-sans text-[14px] text-text-primary">
              沒有符合條件的活動記錄
            </p>
            <p className="font-sans text-[12px] text-text-disabled">
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

      {!hasSearch && total > 0 ? (
        <Pagination
          currentPage={page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
          totalItems={total}
          itemsPerPage={REWARD_ACTIVITY_PAGE_SIZE}
          itemLabel="筆活動"
          scrollToViewId="reward-activity-list-anchor"
          showInfoStrip={false}
          className="w-full max-w-full"
        />
      ) : null}
    </div>
  );
}
