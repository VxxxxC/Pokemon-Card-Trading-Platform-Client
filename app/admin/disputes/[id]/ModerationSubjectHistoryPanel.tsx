"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  formatCategoryLabel,
  formatModerationDateTime,
  moderationResolutionLabel,
  moderationStatusLabel,
  sanctionHistoryStatusLabel,
  sanctionScopeLabel,
  sanctionTypeLabel,
} from "@/lib/moderation/admin-case-presenters";
import type { AdminSubjectModerationHistory } from "@/lib/moderation/types";

type ModerationSubjectHistoryPanelProps = {
  history: AdminSubjectModerationHistory;
  currentFinalScore: number | null;
};

export default function ModerationSubjectHistoryPanel({
  history,
  currentFinalScore,
}: ModerationSubjectHistoryPanelProps) {
  const { stats, priorCases, sanctionHistory } = history;
  const defaultOpen =
    stats.upheldCount > 0 || stats.priorCaseCount > 0;
  const [open, setOpen] = useState(defaultOpen);
  const showRepeatHint =
    (currentFinalScore ?? 0) >= 30 && stats.upheldCount >= 1;

  return (
    <section className="space-y-3 border-b border-white/[0.08] pb-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-sans text-[15px] font-bold text-text-primary">
            被舉報人歷史檔案
          </h2>
          <p className="mt-1 font-sans text-[12px] text-text-disabled">
            歷史參考 — 不影響本案風控分數
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="font-sans text-[12px] text-brand hover:text-text-primary"
        >
          {open ? "收合" : "展開"}
        </button>
      </div>

      {stats.upheldCount >= 1 || stats.priorCaseCount >= 1 ? (
        <div className="mt-3">
          <Badge
            variant="outline"
            className="bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[#f59e0b]/20"
          >
            曾有違規紀錄
          </Badge>
        </div>
      ) : null}

      {showRepeatHint ? (
        <div className="mt-3 rounded-lg border border-warning/30 bg-warning/10 px-4 py-3 font-sans text-[12px] text-warning">
          建議：被舉報人曾有成立裁定，可考慮加重制裁（仍須 Admin 手動選擇）。
        </div>
      ) : null}

      {open ? (
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label="歷史案件" value={stats.priorCaseCount} />
            <Stat label="裁定成立" value={stats.upheldCount} />
            <Stat label="近 90 日舉報" value={stats.reportsLast90Days} />
            <Stat label="曾受制裁類型" value={stats.distinctSanctionTypes.length} />
          </div>

          <div>
            <h3 className="font-sans text-[13px] font-semibold text-text-primary">
              歷史案件
            </h3>
            {priorCases.length === 0 ? (
              <p className="mt-2 font-sans text-[12px] text-text-disabled">
                無其他歷史案件。
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full font-sans text-[12px] text-text-secondary">
                  <thead>
                    <tr className="text-left text-text-disabled">
                      <th className="py-2 pr-3">案件編號</th>
                      <th className="py-2 pr-3">狀態</th>
                      <th className="py-2 pr-3">類別</th>
                      <th className="py-2 pr-3">分數</th>
                      <th className="py-2 pr-3">裁定</th>
                      <th className="py-2">結案時間</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priorCases.map((priorCase) => (
                      <tr key={priorCase.id} className="border-t border-white/[0.06]">
                        <td className="py-2 pr-3">
                          <Link
                            href={`/admin/disputes/${priorCase.id}`}
                            className="font-mono text-brand hover:underline"
                          >
                            {priorCase.caseNumber}
                          </Link>
                        </td>
                        <td className="py-2 pr-3">
                          {moderationStatusLabel(priorCase.status)}
                        </td>
                        <td className="py-2 pr-3">
                          {formatCategoryLabel(priorCase.primaryCategory)}
                        </td>
                        <td className="py-2 pr-3">{priorCase.finalScore ?? "—"}</td>
                        <td className="py-2 pr-3">
                          {moderationResolutionLabel(priorCase.resolution)}
                        </td>
                        <td className="py-2">
                          {priorCase.resolvedAt
                            ? formatModerationDateTime(priorCase.resolvedAt)
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-sans text-[13px] font-semibold text-text-primary">
              制裁紀錄
            </h3>
            {sanctionHistory.length === 0 ? (
              <p className="mt-2 font-sans text-[12px] text-text-disabled">
                無制裁紀錄。
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full font-sans text-[12px] text-text-secondary">
                  <thead>
                    <tr className="text-left text-text-disabled">
                      <th className="py-2 pr-3">類型</th>
                      <th className="py-2 pr-3">來源案件</th>
                      <th className="py-2 pr-3">開始</th>
                      <th className="py-2 pr-3">結束</th>
                      <th className="py-2 pr-3">狀態</th>
                      <th className="py-2">原因</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sanctionHistory.map((sanction) => (
                      <tr key={sanction.id} className="border-t border-white/[0.06]">
                        <td className="py-2 pr-3">
                          {sanctionScopeLabel(sanction.scope)} ·{" "}
                          {sanctionTypeLabel(sanction.type)}
                        </td>
                        <td className="py-2 pr-3">
                          {sanction.caseId && sanction.caseNumber ? (
                            <Link
                              href={`/admin/disputes/${sanction.caseId}`}
                              className="font-mono text-brand hover:underline"
                            >
                              {sanction.caseNumber}
                            </Link>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {formatModerationDateTime(sanction.startsAt)}
                        </td>
                        <td className="py-2 pr-3">
                          {sanction.endsAt
                            ? formatModerationDateTime(sanction.endsAt)
                            : "永久"}
                        </td>
                        <td className="py-2 pr-3">
                          {sanctionHistoryStatusLabel(sanction.status)}
                        </td>
                        <td className="py-2">{sanction.reason ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-bg-card/40 px-3 py-2">
      <p className="font-sans text-[11px] text-text-disabled">{label}</p>
      <p className="mt-1 font-mono text-[16px] font-semibold text-text-primary">
        {value}
      </p>
    </div>
  );
}
