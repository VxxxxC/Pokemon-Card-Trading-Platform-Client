import type { MerchantTransferPayoutStatus } from "@/lib/admin-payouts/types";

const HKT_TIME_ZONE = "Asia/Hong_Kong";

export function formatAdminHkd(amount: number | null | undefined): string {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value)) {
    return "HK$ 0";
  }
  return `HK$ ${value.toLocaleString("zh-TW", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatAdminDateTime(iso: string | null | undefined): string {
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

  const parts = formatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "";
  const month = parts.find((part) => part.type === "month")?.value ?? "";
  const day = parts.find((part) => part.type === "day")?.value ?? "";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "";

  return `${year}/${month}/${day} ${hour}:${minute}`;
}

export function formatStripeSyncLabel(iso: string): string {
  return formatAdminDateTime(iso).replace(" ", " ");
}

export function formatCommissionRate(
  rate: number | null | undefined,
): string {
  if (rate === null || rate === undefined || !Number.isFinite(rate)) {
    return "—";
  }
  return `${(rate * 100).toFixed(1).replace(/\.0$/, "")}%`;
}

export function formatOrderAuthType(requiresAuthentication: boolean): string {
  return requiresAuthentication ? "鑑定" : "非鑑定";
}

const PAYOUT_STATUS_LABELS: Record<MerchantTransferPayoutStatus, string> = {
  pending: "待撥款",
  processing: "處理中",
  paid: "已成功",
  failed: "已失敗",
};

const PAYOUT_STATUS_BADGE_CLASSES: Record<MerchantTransferPayoutStatus, string> =
  {
    pending: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
    processing: "text-brand bg-[rgba(212,165,116,0.12)] border-brand/20",
    paid: "text-success bg-[rgba(16,185,129,0.12)] border-success/20",
    failed: "text-warning bg-[rgba(239,68,68,0.10)] border-warning/20",
  };

export function formatPayoutStatusLabel(
  status: MerchantTransferPayoutStatus,
): string {
  return PAYOUT_STATUS_LABELS[status] ?? status;
}

export function getPayoutStatusBadgeClass(
  status: MerchantTransferPayoutStatus,
): string {
  return PAYOUT_STATUS_BADGE_CLASSES[status] ?? PAYOUT_STATUS_BADGE_CLASSES.pending;
}
