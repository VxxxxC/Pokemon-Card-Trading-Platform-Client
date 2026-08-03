import type { Tables } from "@/types/supabase";

export type OrderTimelineStep = {
  id: string;
  label: string;
  description: string;
};

export type MerchantAuthSellerEscrowStatus = NonNullable<
  Tables<"merchant_orders">["escrow_status"]
>;

export const MERCHANT_DIRECT_TIMELINE_STEPS: OrderTimelineStep[] = [
  {
    id: "payment",
    label: "已付款",
    description: "買家已完成 Stripe 託管付款",
  },
  {
    id: "fulfillment",
    label: "待發貨",
    description: "請安排發貨或面交",
  },
  {
    id: "shipped",
    label: "運送中",
    description: "等待買家確認收貨",
  },
  {
    id: "released",
    label: "已完成",
    description: "款項已撥至 Connect 帳戶",
  },
];

export const MERCHANT_AUTH_SELLER_TIMELINE_STEPS: OrderTimelineStep[] = [
  {
    id: "pending_payment",
    label: "待付款",
    description: "等待買家完成託管付款",
  },
  {
    id: "payment_held",
    label: "待入庫",
    description: "請將卡牌寄往平台倉庫",
  },
  {
    id: "authenticating",
    label: "鑑定中",
    description: "平台正在鑑定卡牌",
  },
  {
    id: "authenticated",
    label: "待買家收貨",
    description: "平台已安排寄出給買家",
  },
  {
    id: "completed",
    label: "已完成",
    description: "交易完成並撥款",
  },
];

export function getMerchantDirectTimelineSteps(
  shippingMethod?: string | null,
  payoutStatus?: string | null,
): OrderTimelineStep[] {
  const base =
    shippingMethod === "meetup"
      ? MERCHANT_DIRECT_TIMELINE_STEPS.map((step) =>
          step.id === "fulfillment"
            ? {
                ...step,
                label: "待面交",
                description: "待面交／自取，買家確認後進入保留期",
              }
            : step,
        )
      : [...MERCHANT_DIRECT_TIMELINE_STEPS];

  if (payoutStatus === "held" || payoutStatus === "processing") {
    return [
      base[0],
      base[1],
      {
        id: "buyer_confirmed",
        label: "買家已確認",
        description: "款項保留於平台",
      },
      {
        id: "hold",
        label: "款項保留中",
        description: "T+7 售後期滿後撥至 Connect",
      },
      base[3],
    ];
  }

  return base;
}

export function getMerchantDirectTimelineStepIndex(
  escrowStatus: MerchantAuthSellerEscrowStatus | null,
  payoutStatus?: string | null,
): number {
  if (escrowStatus === "completed_and_transferred") {
    return payoutStatus === "held" || payoutStatus === "processing" ? 4 : 3;
  }
  if (payoutStatus === "held" || payoutStatus === "processing") {
    return 3;
  }

  switch (escrowStatus) {
    case "pending_payment":
      return 0;
    case "payment_held":
      return 1;
    case "shipped":
      return 2;
    case "refunded":
      return -1;
    default:
      return 0;
  }
}

export function getMerchantDirectBuyerTimelineStepIndex(
  escrowStatus: MerchantAuthSellerEscrowStatus | null,
  payoutStatus?: string | null,
): number {
  if (escrowStatus === "refunded") {
    return -1;
  }
  if (escrowStatus === "completed_and_transferred") {
    return payoutStatus === "held" || payoutStatus === "processing" ? 4 : 3;
  }
  if (payoutStatus === "held" || payoutStatus === "processing") {
    return 3;
  }
  if (escrowStatus === "shipped") {
    return 2;
  }
  if (escrowStatus === "payment_held") {
    return 1;
  }
  if (escrowStatus === "authenticated") {
    return 2;
  }
  return 0;
}

export function getMerchantAuthSellerTimelineStepIndex(
  escrowStatus: MerchantAuthSellerEscrowStatus | null,
): number {
  switch (escrowStatus) {
    case "pending_payment":
      return 0;
    case "payment_held":
      return 1;
    case "authenticating":
      return 2;
    case "authenticated":
      return 3;
    case "completed_and_transferred":
      return 4;
    case "refunded":
      return -1;
    default:
      return 0;
  }
}
