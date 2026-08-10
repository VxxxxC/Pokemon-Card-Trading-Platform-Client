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
    <div className="rounded-2xl border border-white/10 bg-[#26211C] p-5 shadow-[0_2px_12px_rgba(0,0,0,0.50)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-sans text-[15px] font-bold text-[#eae1da]">
            被舉報人歷史檔案
          </h2>
          <p className="mt-1 font-sans text-[12px] text-[#8A8680]">
            歷史參考 — 不影響本案風控分數
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="font-sans text-[12px] text-[#d4a574] hover:text-[#eae1da]"
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
        <div className="mt-3 rounded-xl border border-[#f59e0b]/30 bg-[rgba(245,158,11,0.08)] px-4 py-3 font-sans text-[12px] text-[#f59e0b]">
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
            <h3 className="font-sans text-[13px] font-semibold text-[#eae1da]">
              歷史案件
            </h3>
            {priorCases.length === 0 ? (
              <p className="mt-2 font-sans text-[12px] text-[#8A8680]">
                無其他歷史案件。
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full font-sans text-[12px] text-[#d4c4b7]">
                  <thead>
                    <tr className="text-left text-[#8A8680]">
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
                            className="font-mono text-[#d4a574] hover:underline"
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
            <h3 className="font-sans text-[13px] font-semibold text-[#eae1da]">
              制裁紀錄
            </h3>
            {sanctionHistory.length === 0 ? (
              <p className="mt-2 font-sans text-[12px] text-[#8A8680]">
                無制裁紀錄。
              </p>
            ) : (
              <div className="mt-2 overflow-x-auto">
                <table className="min-w-full font-sans text-[12px] text-[#d4c4b7]">
                  <thead>
                    <tr className="text-left text-[#8A8680]">
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
                              className="font-mono text-[#d4a574] hover:underline"
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
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#17130f] px-3 py-2">
      <p className="font-sans text-[11px] text-[#8A8680]">{label}</p>
      <p className="mt-1 font-mono text-[16px] font-semibold text-[#eae1da]">
        {value}
      </p>
    </div>
  );
}
