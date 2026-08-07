"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import type { AdminRewardActivityRow, AdminRewardActivityStatus } from "@/lib/admin-rewards/types";
import {
  DISPLAY_STATUS_LABELS,
  DISTRIBUTION_MODE_LABELS,
  formatActivityIdShort,
  formatActivityStock,
  formatActivityValidityPeriod,
  formatRewardActivityValue,
  formatTriggerConditionLabel,
  TYPE_LABELS,
} from "@/lib/admin-rewards/template-form";

type RewardActivityCardProps = {
  row: AdminRewardActivityRow;
  disabled?: boolean;
  onStatusChange: (
    row: AdminRewardActivityRow,
    status: AdminRewardActivityStatus,
  ) => void;
};

function statusBadge(displayStatus: string) {
  switch (displayStatus) {
    case "active":
      return <Badge variant="success">進行中</Badge>;
    case "paused":
      return (
        <Badge
          variant="outline"
          className="border-amber-500/40 text-amber-500 bg-amber-500/10 font-mono text-[10px]"
        >
          已暫停
        </Badge>
      );
    case "ended":
      return (
        <Badge variant="default" className="text-text-disabled">
          已結束
        </Badge>
      );
    case "draft":
      return (
        <Badge variant="outline" className="font-mono text-[10px]">
          草稿
        </Badge>
      );
    case "archived":
      return (
        <Badge variant="default" className="text-text-disabled">
          已封存
        </Badge>
      );
    default:
      return (
        <Badge variant="ghost">
          {DISPLAY_STATUS_LABELS[displayStatus] ?? displayStatus}
        </Badge>
      );
  }
}

function showFlashSwitch(row: AdminRewardActivityRow): boolean {
  return (
    row.distribution_mode === "flash_only" &&
    row.display_status !== "ended" &&
    row.display_status !== "archived" &&
    row.display_status !== "draft"
  );
}

export function RewardActivityCard({
  row,
  disabled = false,
  onStatusChange,
}: RewardActivityCardProps) {
  const shortId = formatActivityIdShort(row.activity_id);
  const rewardLabel = formatRewardActivityValue(row);
  const stockLabel = formatActivityStock(row);

  return (
    <Card className="bg-transparent border-0 border-b border-[rgba(237,232,224,0.06)] rounded-none last:border-b-0 hover:bg-bg-hover/50 transition-colors">
      <CardContent className="p-4 sm:p-5 flex flex-col gap-3.5">
        <div className="flex items-start justify-between gap-3 w-full flex-wrap">
          <div className="min-w-0 flex-1" title={row.activity_id}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-[11px] text-text-disabled">
                #{shortId}
              </span>
              <h3 className="font-sans font-bold text-[15px] text-text-primary">
                {row.title}
              </h3>
              <Badge
                variant="outline"
                className="border-brand/30 text-brand bg-brand/10 font-mono text-[10px]"
              >
                {TYPE_LABELS[row.type]}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {statusBadge(row.display_status)}

            {showFlashSwitch(row) ? (
              <div
                className="flex items-center gap-1.5"
                title="切換 進行中 / 已暫停"
              >
                <span className="font-mono text-[10px] text-text-secondary">
                  {row.display_status === "active" ? "開啟" : "關閉"}
                </span>
                <Switch
                  checked={row.display_status === "active"}
                  disabled={disabled}
                  onCheckedChange={(checked) => {
                    onStatusChange(row, checked ? "active" : "paused");
                  }}
                  className="data-[state=checked]:bg-success data-[state=unchecked]:bg-bg-elevated"
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-bg-page/70 border border-[rgba(237,232,224,0.06)] rounded-xl p-3 text-[11px]">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">📦</span>
              <span className="text-text-disabled font-mono text-[10px]">
                發放方式：
              </span>
              <span className="font-medium text-text-primary">
                {DISTRIBUTION_MODE_LABELS[row.distribution_mode]}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">⚡</span>
              <span className="text-text-disabled font-mono text-[10px]">
                觸發條件：
              </span>
              <span className="font-medium text-text-primary">
                {formatTriggerConditionLabel(
                  row.trigger_conditions,
                  row.distribution_mode,
                )}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">📅</span>
              <span className="text-text-disabled font-mono text-[10px]">
                有效期：
              </span>
              <span className="font-mono text-text-primary">
                {formatActivityValidityPeriod(row)}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-text-secondary font-sans">
              <span className="text-brand text-[12px]">🎁</span>
              <span className="text-text-disabled font-mono text-[10px]">
                獎勵內容：
              </span>
              <span className="font-bold text-brand font-mono">{rewardLabel}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 bg-bg-page border border-[rgba(237,232,224,0.05)] rounded-xl p-2.5 text-center font-mono text-[11px]">
          <div>
            <span className="text-text-disabled text-[9px] block uppercase">
              庫存
            </span>
            <span className="text-brand font-semibold block mt-0.5">
              {stockLabel}
            </span>
          </div>
          <div>
            <span className="text-text-disabled text-[9px] block uppercase">
              已領取
            </span>
            <span className="text-text-primary font-bold block mt-0.5">
              {row.claimed_count.toLocaleString("zh-TW")}
            </span>
          </div>
          {row.distribution_mode === "flash_only" ? (
            <div>
              <span className="text-text-disabled text-[9px] block uppercase">
                每人上限
              </span>
              <span className="text-success font-bold block mt-0.5">
                {row.max_claims_per_user ?? 1}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/admin/campaigns/${row.activity_id}`}
              className="inline-flex h-8 items-center justify-center rounded-md border border-[rgba(237,232,224,0.12)] px-3 text-xs text-text-secondary hover:text-text-primary"
            >
              編輯
            </Link>
            {row.display_status === "draft" ? (
              <Button
                type="button"
                size="sm"
                disabled={disabled}
                onClick={() => onStatusChange(row, "active")}
              >
                發布
              </Button>
            ) : null}
            {row.status !== "archived" ? (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={disabled}
                onClick={() => onStatusChange(row, "archived")}
              >
                封存
              </Button>
            ) : null}
          </div>

          {row.created_at ? (
            <span className="font-mono text-[10px] text-text-disabled">
              建立：
              {new Date(row.created_at).toLocaleDateString("zh-HK")}
            </span>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
