import type { UserTradingOrder } from "@/app/actions/orders";
import type { SaleOrder, OrderStatus } from "@/app/lib/types/trading";
import type { MemberEscrowStatus } from "@/app/lib/member-order/auth-escrow";

function mapAuthOrderStatus(
  dbStatus: UserTradingOrder["status"],
  escrowStatus: MemberEscrowStatus | null,
): OrderStatus {
  if (dbStatus === "cancelled") {
    return "cancelled";
  }

  if (dbStatus === "completed") {
    return "released";
  }

  if (
    escrowStatus === "payment" ||
    escrowStatus === "custody" ||
    escrowStatus === "grading" ||
    escrowStatus === "shipped" ||
    escrowStatus === "released"
  ) {
    return escrowStatus;
  }

  return "payment";
}

function formatListingGrade(order: UserTradingOrder): string {
  const { gradingCompany, gradingScore } = order.listing;
  if (gradingScore) {
    return `${gradingCompany} ${gradingScore}`;
  }
  if (gradingCompany && gradingCompany.toLowerCase() !== "raw") {
    return gradingCompany;
  }
  return "Raw 裸卡";
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

export function mapTradingOrderToSaleOrder(order: UserTradingOrder): SaleOrder {
  const isBuyer = order.persona === "buy";
  const counterpartyName = order.counterparty.displayName;
  const p2pStatus: OrderStatus =
    order.status === "cancelled"
      ? "cancelled"
      : order.status === "completed"
        ? "released"
        : "payment";

  return {
    id: order.id,
    buyerId: order.buyerId,
    buyerName: isBuyer ? "" : counterpartyName,
    sellerId: order.sellerId,
    sellerName: isBuyer ? counterpartyName : "",
    cardName: order.product.cardName,
    cardNo: order.product.cardNumber ?? order.product.displayId ?? "",
    grade: formatListingGrade(order),
    amount: order.finalPrice,
    status: order.useAuthentication
      ? mapAuthOrderStatus(order.status, order.escrowStatus)
      : p2pStatus,
    createdAt: formatOrderDateTime(order.createdAt),
    orderType: "C2C",
    userContext: isBuyer ? "BUYER" : "SELLER",
    productListingId: order.id,
    hasAuthenticationToggle: order.useAuthentication,
  };
}
