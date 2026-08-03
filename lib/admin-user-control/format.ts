import type { PlatformUserKycStatus } from "@/lib/admin-user-control/types";

const HKT_TIME_ZONE = "Asia/Hong_Kong";

export function formatPlatformUserDateTime(
  iso: string | null | undefined,
): string {
  if (!iso) {
    return "—";
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const formatter = new Intl.DateTimeFormat("zh-HK", {
    timeZone: HKT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return formatter.format(date).replace(",", "");
}

export function formatPlatformUserHandle(
  username: string | null,
  shopHandle: string | null,
): string {
  const handle = shopHandle?.trim() || username?.trim();
  if (!handle) {
    return "—";
  }

  return handle.startsWith("@") ? handle : `@${handle}`;
}

export function formatPlatformUserKycLabel(
  status: PlatformUserKycStatus,
): string {
  if (status === "verified") {
    return "已認證";
  }
  if (status === "pending") {
    return "待審核";
  }
  if (status === "rejected") {
    return "已拒絕";
  }
  return "未申請";
}
