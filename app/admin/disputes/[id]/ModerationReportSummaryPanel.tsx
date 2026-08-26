"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  categoryBadgeClasses,
  formatCategoryLabel,
  formatModerationDateTime,
} from "@/lib/moderation/admin-case-presenters";
import { highlightSensitiveKeywords } from "@/lib/moderation/highlight-chat-keywords";
import {
  formatParsedReportSource,
  getReportDisplayText,
  parseStructuredReportReason,
} from "@/lib/moderation/parse-report-reason";
import type { AdminModerationReportRow } from "@/lib/moderation/types";
import { BTN_OUTLINE_CLASS } from "./moderation-detail-ui";

const INITIAL_VISIBLE = 3;

type ModerationReportSummaryPanelProps = {
  reports: AdminModerationReportRow[];
};

function reportSourceLabel(report: AdminModerationReportRow): string {
  if (report.source === "profile") {
    return "公開資料";
  }
  if (report.source === "chat_room") {
    return `對話${report.contextId ? ` · ${report.contextId.slice(0, 8)}` : ""}`;
  }
  return "未知來源";
}

function ReportEntry({ report }: { report: AdminModerationReportRow }) {
  const rawText = report.details?.trim() || report.reason;
  const parsed = parseStructuredReportReason(rawText);
  const displayText = getReportDisplayText(report.details, report.reason);

  return (
    <div className="rounded-lg border border-white/[0.06] bg-bg-card/40 px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className={categoryBadgeClasses(report.category)}
        >
          {formatCategoryLabel(report.category)}
        </Badge>
        <span className="font-sans text-[12px] text-text-secondary">
          {reportSourceLabel(report)}
        </span>
        <span className="font-sans text-[12px] text-text-disabled">
          {report.reporterDisplayName ?? report.reporterUsername ?? "未知"}
          · {formatModerationDateTime(report.createdAt)}
        </span>
        <span className="font-mono text-[12px] text-brand">
          +{report.contributionScore ?? 0}
        </span>
      </div>

      {parsed.isStructured && (parsed.category || parsed.source || parsed.roomId) ? (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-sans text-[11px] text-text-disabled">
          {parsed.category ? (
            <span>
              類別{" "}
              <span className="text-text-secondary">{parsed.category}</span>
            </span>
          ) : null}
          {parsed.source ? (
            <span>
              來源{" "}
              <span className="text-text-secondary">
                {formatParsedReportSource(parsed.source)}
              </span>
            </span>
          ) : null}
          {parsed.roomId ? (
            <span>
              房間{" "}
              <span className="font-mono text-text-secondary">
                {parsed.roomId.slice(0, 8)}
              </span>
            </span>
          ) : null}
        </div>
      ) : null}

      {displayText ? (
        <p className="mt-2 font-sans text-[13px] leading-relaxed text-text-secondary">
          {highlightSensitiveKeywords(displayText)}
        </p>
      ) : (
        <p className="mt-2 font-sans text-[12px] text-text-disabled">無補充說明</p>
      )}
    </div>
  );
}

export default function ModerationReportSummaryPanel({
  reports,
}: ModerationReportSummaryPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const hiddenCount = Math.max(reports.length - INITIAL_VISIBLE, 0);
  const visibleReports =
    expanded || hiddenCount === 0
      ? reports
      : reports.slice(0, INITIAL_VISIBLE);

  return (
    <section className="space-y-4 border-b border-white/[0.08] pb-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-sans text-[15px] font-bold text-text-primary">
          舉報摘要
        </h2>
        {reports.length > 0 ? (
          <span className="font-mono text-[12px] text-text-secondary">
            共 {reports.length} 條
          </span>
        ) : null}
      </div>

      {reports.length === 0 ? (
        <p className="font-sans text-[12px] text-text-disabled">暫無舉報紀錄。</p>
      ) : (
        <div className="space-y-3">
          {visibleReports.map((report) => (
            <ReportEntry key={report.id} report={report} />
          ))}
          {hiddenCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExpanded((value) => !value)}
              className={BTN_OUTLINE_CLASS}
            >
              {expanded ? "收合" : `展開其餘 ${hiddenCount} 條`}
            </Button>
          ) : null}
        </div>
      )}
    </section>
  );
}
