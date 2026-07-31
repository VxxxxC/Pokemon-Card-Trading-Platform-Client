import type { Tables } from "@/types/supabase";
import { formatMemberOrderDateTime } from "@/app/lib/member-order/p2p";

export type MemberSellerPayoutStatus =
  Tables<"member_orders">["seller_payout_status"];

export function formatSellerPayoutStatusLabel(
  status: MemberSellerPayoutStatus,
): string {
  switch (status) {
    case "none":
      return "尚未開始";
    case "held":
      return "款項保留中（T+3）";
    case "ready":
      return "待平台撥款";
    case "processing":
      return "撥款處理中";
    case "paid":
      return "已撥款";
    case "frozen":
      return "撥款凍結";
    case "failed":
      return "撥款失敗";
    default:
      return status;
  }
}

export function formatSellerPayoutHoldUntilLabel(
  payoutHoldUntil: string | null | undefined,
): string | null {
  if (!payoutHoldUntil) {
    return null;
  }
  return formatMemberOrderDateTime(payoutHoldUntil);
}
