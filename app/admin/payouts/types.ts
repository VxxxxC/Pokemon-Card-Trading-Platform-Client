export interface WithdrawalRequest {
  id: string;
  userName: string;
  amount: number;
  fpsId: string;
  status: "pending" | "processing" | "completed" | "failed";
  submittedAt: string;
  orderId: string;
  orderNumber: string;
}

export interface MerchantStripeFlow {
  stripeTransferId: string;
  orderId: string;
  orderNumber: string;
  createdAt: string;
  merchantName: string;
  subAccountId: string;
  balance: number;
  totalPayout: number;
  platformCommission: number;
}

export type SortDirection = "asc" | "desc";

export type FpsFilter = "all" | "incomplete" | "completed" | "failed";

export type FpsSortValue =
  | "none"
  | "userName-asc"
  | "userName-desc"
  | "submittedAt-desc"
  | "submittedAt-asc";

export type StripeSortValue =
  | "none"
  | "merchantName-asc"
  | "merchantName-desc"
  | "createdAt-desc"
  | "createdAt-asc";

export type StripeLogStatus = "paid" | "pending" | "in_transit" | "failed";

export type StripeLogVariant = "payout" | "transfer";

export interface StripePayoutLog {
  id: string;
  recipient: string;
  amount: number;
  status: StripeLogStatus;
  createdAt: string;
}

export interface StripeTransferLog {
  id: string;
  merchantName: string;
  splitAmount: number;
  platformCommission: number;
  status: StripeLogStatus;
  createdAt: string;
}

export type StripeLogRow = StripePayoutLog | StripeTransferLog;
