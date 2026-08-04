import {
  REPORT_CATEGORY_CONFIG,
  type ReportCategorySlug,
} from "@/lib/moderation/category-config";
import type { ModerationCaseStatus } from "@/lib/moderation/types";

export type ModerationSeverityBand = "critical" | "medium" | "low";

export function deriveSeverityBand(finalScore: number | null): ModerationSeverityBand {
  const score = finalScore ?? 0;
  if (score >= 60) {
    return "critical";
  }
  if (score >= 30) {
    return "medium";
  }
  return "low";
}

export function formatCategoryLabel(
  slug: ReportCategorySlug | null | undefined,
): string {
  if (!slug) {
    return "未分類";
  }
  return REPORT_CATEGORY_CONFIG[slug]?.label ?? slug;
}

export function moderationStatusLabel(status: ModerationCaseStatus): string {
  switch (status) {
    case "open":
      return "待處理";
    case "reviewing":
      return "審核中";
    case "resolved":
      return "已裁定";
    case "dismissed":
      return "已駁回";
    default:
      return status;
  }
}

export function mapModerationStatusToUiTab(
  status: ModerationCaseStatus,
): "pending" | "completed" {
  if (status === "open" || status === "reviewing") {
    return "pending";
  }
  return "completed";
}

export function severityLabel(band: ModerationSeverityBand): string {
  switch (band) {
    case "critical":
      return "嚴重";
    case "medium":
      return "中等";
    default:
      return "輕微";
  }
}

export function severityBadgeClasses(band: ModerationSeverityBand): string {
  switch (band) {
    case "critical":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "medium":
      return "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[#f59e0b]/20";
    default:
      return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
  }
}

export function moderationStatusBadgeClasses(
  status: ModerationCaseStatus,
): string {
  if (status === "open" || status === "reviewing") {
    return "bg-[rgba(245,158,11,0.12)] text-[#f59e0b] border-[#f59e0b]/20";
  }
  if (status === "resolved") {
    return "bg-[rgba(16,185,129,0.12)] text-[#10b981] border-[#10b981]/20";
  }
  return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
}

export function categoryBadgeClasses(
  slug: ReportCategorySlug | null | undefined,
): string {
  switch (slug) {
    case "fraud":
      return "bg-[rgba(239,68,68,0.12)] text-[#ef4444] border-[#ef4444]/20";
    case "offline_trade":
      return "bg-[rgba(16,185,129,0.10)] text-[#10b981] border-[#10b981]/20";
    case "harassment":
      return "bg-[rgba(212,165,116,0.15)] text-[#d4a574] border-[#d4a574]/20";
    default:
      return "bg-[#2e2925] text-[#d4c4b7] border-white/10";
  }
}

export function formatModerationDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-HK", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function moderationAuditActionLabel(action: string): string {
  switch (action) {
    case "view_chat":
      return "調閱聊天紀錄";
    case "adjust_score":
      return "調整風控分數";
    case "apply_sanction":
      return "套用帳戶制裁";
    case "resolve":
      return "裁定結案";
    default:
      return action;
  }
}

export function moderationResolutionLabel(
  resolution: string | null | undefined,
): string {
  switch (resolution) {
    case "upheld":
      return "裁定成立";
    case "dismissed":
      return "駁回舉報";
    case "insufficient_evidence":
      return "證據不足";
    default:
      return resolution ?? "—";
  }
}

export function sanctionTypeLabel(type: string | null | undefined): string {
  switch (type) {
    case "warn":
      return "警告";
    case "restrict_listing":
      return "限制上架";
    case "restrict_chat":
      return "限制聊天";
    case "freeze_payout":
      return "凍結出款";
    case "suspend":
      return "帳戶暫停";
    case "ban":
      return "永久封禁";
    default:
      return type ?? "—";
  }
}

export function sanctionScopeLabel(scope: string | null | undefined): string {
  switch (scope) {
    case "account":
      return "全帳戶";
    case "member_persona":
      return "Member 身分";
    case "merchant_persona":
      return "Merchant 身分";
    default:
      return scope ?? "—";
  }
}

export function moderationOrderPersonaLabel(
  persona: "member" | "merchant",
): string {
  return persona === "merchant" ? "Merchant 訂單" : "Member 訂單";
}

export function moderationOrderSourceLabel(
  source: string | null | undefined,
): string {
  switch (source) {
    case "report_context":
      return "舉報上下文";
    case "chat_message":
      return "聊天紀錄";
    case "party_match":
      return "雙方訂單";
    default:
      return source ?? "—";
  }
}
