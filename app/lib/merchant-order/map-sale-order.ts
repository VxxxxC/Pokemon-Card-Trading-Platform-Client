import type {
  MerchantOrderDetail,
  MerchantTradingOrder,
} from "@/app/actions/orders";
import type { OrderStatus, SaleOrder } from "@/app/lib/types/trading";
import type { Tables } from "@/types/supabase";
import { formatTradeGradeLabel } from "@/lib/marketplace/listing-display";

type MerchantEscrowStatus = NonNullable<
  Tables<"merchant_orders">["escrow_status"]
>;

export function mapMerchantEscrowToOrderStatus(
  escrowStatus: MerchantEscrowStatus | null,
): OrderStatus {
  switch (escrowStatus) {
    case "refunded":
      return "cancelled";
    case "completed_and_transferred":
      return "released";
    case "authenticating":
      return "grading";
    case "authenticated":
      return "shipped";
    case "payment_held":
      return "payment";
    case "pending_payment":
      return "payment";
    default:
      return "payment";
  }
}

/** pending_payment 訂單雖仍在 payment 階段，但商戶未收到款項，不可出貨。 */
export function resolveMerchantStatusLabelOverride(
  escrowStatus: MerchantEscrowStatus | null,
): string | undefined {
  return escrowStatus === "pending_payment" ? "待買家付款" : undefined;
}

function formatListingGrade(order: MerchantTradingOrder): string {
  const { gradingCompany, gradingScore } = order.listing;
  return formatTradeGradeLabel(gradingCompany, gradingScore);
}

function formatOrderDateTime(createdAt: string | null): string {
  if (!createdAt) {
    return "";
  }
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }
  return date.toLocaleString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function mapMerchantTradingOrderToSaleOrder(
  order: MerchantTradingOrder,
): SaleOrder {
  return {
    id: order.id,
    orderNumber: order.orderNumber ?? undefined,
    buyerId: order.buyerId,
    buyerName: order.buyer.displayName,
    sellerId: order.merchantId,
    sellerName: "",
    cardName: order.product.cardName,
    cardNo: order.product.cardNumber ?? order.product.displayId ?? "",
    grade: formatListingGrade(order),
    amount: order.finalPrice,
    status: mapMerchantEscrowToOrderStatus(order.escrowStatus),
    statusLabelOverride: resolveMerchantStatusLabelOverride(order.escrowStatus),
    createdAt: formatOrderDateTime(order.createdAt),
    orderType: "B2C",
    userContext: "SELLER",
    productListingId: order.id,
    hasAuthenticationToggle: Boolean(order.requiresAuthentication),
  };
}

export function mapMerchantOrderDetailToSaleOrder(
  detail: MerchantOrderDetail,
): SaleOrder {
  const base = mapMerchantTradingOrderToSaleOrder(detail);

  return {
    ...base,
    orderNumber: detail.orderNumber ?? undefined,
    productListingId: detail.listingId,
    trackingNo: detail.logisticsProofPath ?? undefined,
    avatarSeed: detail.buyer.id,
  };
}
