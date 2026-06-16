import { OrderStatus } from "@/app/lib/types/rbac";

export type TradeContext = "B2C" | "C2C";
export type UserPerspective = "BUYER" | "SELLER";

export interface SaleOrder {
  id: string;
  buyerName: string;
  sellerName: string; // To cleanly differentiate C2C multi-seller nodes
  cardName: string;
  cardNo: string;
  grade: string;
  amount: number;
  depositPaid: number;
  status: OrderStatus;
  createdAt: string;
  trackingNo?: string;
  tradeContext: TradeContext;         // Mapped for B2C vs C2C operational logic
  userPerspective: UserPerspective;   // Settled to 'SELLER' for merchant dashboard, open for generic users
}
