export type OrderSellerPersona = "merchant" | "member";
export type OrderKind = "member" | "merchant";
export type AdminOrderStatus = "pending" | "custody" | "grading" | "shipped" | "completed" | "cancelled";
export type GradingStatus = "pending_grading" | "passed_authentic" | "failed_fake" | "not_applicable";

export interface AdminOrderRowItem {
  id: string;
  orderNumber: string;
  createdAt: string;
  status: AdminOrderStatus;
  orderKind: OrderKind;
  cardName: string;
  cardGrade: string;
  itemPrice: number;
  appraisalFee: number;
  totalPaid: number;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  sellerPersona: OrderSellerPersona;
  useAuthentication: boolean;
  gradingStatus: GradingStatus;
  inboundTrackingNo?: string | null;
  outboundTrackingNo?: string | null;
  payoutMethod: "stripe_connect" | "fps_manual";
  buyerReceivedConfirmed: boolean;
}
