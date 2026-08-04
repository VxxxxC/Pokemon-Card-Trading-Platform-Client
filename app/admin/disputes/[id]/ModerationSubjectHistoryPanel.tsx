"use client";

import Link from "next/link";
import {
  formatCategoryLabel,
  formatModerationDateTime,
  moderationResolutionLabel,
  moderationStatusLabel,
  sanctionScopeLabel,
  sanctionTypeLabel,
} from "@/lib/moderation/admin-case-presenters";
import type { AdminSubjectModerationHistory } from "@/lib/moderation/types";

type ModerationSubjectHistoryPanelProps = {
  subjectHistory: AdminSubjectModerationHistory | null;
  subjectHistoryError?: string | null;
  currentFinalScore: number | null;
};

function sanctionStatusLabel(status: "active" | "expired" | "revoked"): string {
  switch (status) {
    case "active":
      return "有效";
    case "expired":
      return "已過期";
    case "revoked":
      return "已撤銷";
    default:
      return status;
  }
}

export default function ModerationSubjectHistoryPanel({
  subjectHistory,
  subjectHistoryError,
  currentFinalScore,
}: ModerationSubjectHistoryPanelProps) {
  if (subjectHistoryError) {
    return (
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#17130f] p-4">
        <p className="font-sans text-[13px] font-medium text-[#eae1da]">
          被舉報人歷史檔案
        </p>
        <p className="mt-2 font-sans text-[12px] text-[#8A8680]">
          暫未能載入歷史：{subjectHistoryError}
        </p>
      </div>
    );
  }

  if (!subjectHistory) {
    return (
      <div className="mt-4 rounded-xl border border-white/[0.06] bg-[#17130f] p-4">
        <p className="font-sans text-[13px] font-medium text-[#eae1da]">
          被舉報人歷史檔案
        </p>
        <p className="mt-2 font-sans text-[12px] text-[#8A8680]">
          暫未能載入歷史。
        </p>
      </div>
    );
  }

  const { stats, priorCases, sanctionHistory } = subjectHistory;
  const showRepeatHint =
    (currentFinalScore ?? 0) >= 30 && stats.upheldCount >= 1;
  const defaultExpanded =
    stats.upheldCount > 0 || stats.priorCaseCount > 0;

  return (
    <details
      className="mt-4 rounded-xl border border-white/[0.06] bg-[#17130f] p-4"
      open={defaultExpanded}
    >
      <summary className="cursor-pointer font-sans text-[13px] font-medium text-[#eae1da]">
        被舉報人歷史檔案
        <span className="ml-2 font-normal text-[#8A8680]">（歷史參考）</span>
      </summary>

      {stats.upheldCount >= 2 || sanctionHistory.length > 0 ? (
        <p className="mt-3 font-sans text-[12px] text-[#d4a574]">
          曾有違規紀錄
        </p>
      ) : null}

      {showRepeatHint ? (
        <p className="mt-3 rounded-lg border border-[#d4a574]/30 bg-[#d4a574]/10 px-3 py-2 font-sans text-[12px] leading-relaxed text-[#d4c4b7]">
          建議：被舉報人曾有成立裁定，可考慮加重制裁（仍須 Admin 手動選擇）。
        </p>
      ) : null}

      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-sans text-[11px] text-[#8A8680]">歷史案件數</p>
          <p className="font-sans text-[14px] text-[#d4c4b7]">
            {stats.priorCaseCount}
          </p>
        </div>
        <div>
          <p className="font-sans text-[11px] text-[#8A8680]">裁定成立</p>
          <p className="font-sans text-[14px] text-[#d4c4b7]">
            {stats.upheldCount}
          </p>
        </div>
        <div>
          <p className="font-sans text-[11px] text-[#8A8680]">近 90 日舉報</p>
          <p className="font-sans text-[14px] text-[#d4c4b7]">
            {stats.reportsLast90Days}
          </p>
        </div>
        <div>
          <p className="font-sans text-[11px] text-[#8A8680]">曾受制裁類型</p>
          <p className="font-sans text-[12px] text-[#d4c4b7]">
            {stats.distinctSanctionTypes.length > 0
              ? stats.distinctSanctionTypes.join("、")
              : "—"}
          </p>
        </div>
      </div>

      {priorCases.length > 0 ? (
        <div className="mt-5">
          <p className="font-sans text-[12px] font-medium text-[#d4c4b7]">
            歷史案件
          </p>
          <div className="mt-2 space-y-2">
            {priorCases.map((priorCase) => (
              <div
                key={priorCase.id}
                className="flex flex-wrap items-center gap-x-4 gap-y-1 font-sans text-[12px] text-[#8A8680]"
              >
                <Link
                  href={`/admin/disputes/${priorCase.id}`}
                  className="text-[#d4c4b7] underline-offset-2 hover:underline"
                >
                  {priorCase.caseNumber}
                </Link>
                <span>{moderationStatusLabel(priorCase.status)}</span>
                <span>
                  {priorCase.primaryCategory
                    ? formatCategoryLabel(priorCase.primaryCategory)
                    : "—"}
                </span>
                <span>分數 {priorCase.finalScore ?? "—"}</span>
                <span>
                  {priorCase.resolution
                    ? moderationResolutionLabel(priorCase.resolution)
                    : "—"}
                </span>
                {priorCase.resolvedAt ? (
                  <span>{formatModerationDateTime(priorCase.resolvedAt)}</span>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="mt-4 font-sans text-[12px] text-[#8A8680]">
          無其他歷史案件。
        </p>
      )}

      {sanctionHistory.length > 0 ? (
        <div className="mt-5">
          <p className="font-sans text-[12px] font-medium text-[#d4c4b7]">
            制裁歷史
          </p>
          <div className="mt-2 space-y-2">
            {sanctionHistory.map((sanction) => (
              <div
                key={sanction.id}
                className="font-sans text-[12px] text-[#8A8680]"
              >
                {sanctionScopeLabel(sanction.scope)} ·{" "}
                {sanctionTypeLabel(sanction.type)} ·{" "}
                {sanctionStatusLabel(sanction.status)}
                {sanction.caseNumber && sanction.caseId ? (
                  <>
                    {" "}
                    ·{" "}
                    <Link
                      href={`/admin/disputes/${sanction.caseId}`}
                      className="text-[#d4c4b7] underline-offset-2 hover:underline"
                    >
                      {sanction.caseNumber}
                    </Link>
                  </>
                ) : null}
                {sanction.endsAt
                  ? ` · 至 ${formatModerationDateTime(sanction.endsAt)}`
                  : sanction.type === "ban" || sanction.type === "suspend"
                    ? " · 永久"
                    : ""}
                {sanction.reason ? ` · ${sanction.reason}` : ""}
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </details>
  );
}
