export type ReportSource = "chat_room" | "profile";

export type FormatReportReasonInput = {
  category: string;
  details?: string;
  source: ReportSource;
  chatRoomId?: string;
};

export function formatReportReason({
  category,
  details,
  source,
  chatRoomId,
}: FormatReportReasonInput): string {
  const lines = [`[CATEGORY] ${category.trim()}`, `[SOURCE] ${source}`];

  if (source === "chat_room" && chatRoomId?.trim()) {
    lines.push(`[ROOM_ID] ${chatRoomId.trim()}`);
  }

  lines.push(`[DETAILS] ${details?.trim() ?? ""}`);

  return lines.join("\n");
}
