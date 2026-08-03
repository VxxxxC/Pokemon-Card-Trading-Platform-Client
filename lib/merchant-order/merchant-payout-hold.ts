import { formatMemberOrderDateTime } from "@/app/lib/member-order/p2p";

export function formatMerchantPayoutStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case "pending":
      return "尚未開始";
    case "held":
      return "款項保留中（T+7）";
    case "processing":
      return "撥款處理中";
    case "paid":
      return "已撥至 Connect";
    case "frozen":
      return "撥款凍結";
    case "failed":
      return "撥款失敗";
    default:
      return status ?? "";
  }
}

export function formatMerchantPayoutHoldUntilLabel(
  payoutHoldUntil: string | null | undefined,
): string | null {
  if (!payoutHoldUntil) {
    return null;
  }
  return formatMemberOrderDateTime(payoutHoldUntil);
}
