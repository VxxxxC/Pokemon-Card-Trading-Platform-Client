export type AdminPayoutsStripeBalance = {
  available: number;
  pending: number;
  todayIn: number;
  currency: "HKD";
  lastSyncedAt: string;
};

export type MerchantTransferPayoutStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed";

export type MerchantTransferStatusFilter =
  | "all"
  | "paid"
  | "failed"
  | "processing"
  | "pending";

export type MerchantTransferSort =
  | "transferred_at-desc"
  | "transferred_at-asc"
  | "merchantName-asc"
  | "merchantName-desc";

export type MerchantTransferStatusCounts = {
  all: number;
  paid: number;
  processing: number;
  pending: number;
  failed: number;
};

export const EMPTY_MERCHANT_TRANSFER_STATUS_COUNTS: MerchantTransferStatusCounts =
  {
    all: 0,
    paid: 0,
    processing: 0,
    pending: 0,
    failed: 0,
  };

export type MerchantTransferRow = {
  orderId: string;
  orderNumber: string;
  merchantId: string;
  stripeTransferId: string;
  merchantName: string;
  subAccountId: string;
  requiresAuthentication: boolean;
  itemSubtotal: number;
  commissionRateApplied: number | null;
  platformCommission: number;
  authFee: number;
  merchantPayoutAmount: number;
  payoutStatus: MerchantTransferPayoutStatus;
  payoutError: string | null;
  reconciliationWarning?: string;
  buyerConfirmedAt: string | null;
  buyerConfirmedAtIso: string | null;
  stripePaymentIntentId: string | null;
  transferredAt: string;
  transferredAtIso: string | null;
  /** @deprecated use transferredAt */
  createdAt: string;
};

export type MerchantTransferPage = {
  rows: MerchantTransferRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  statusCounts: MerchantTransferStatusCounts;
};

export type ListAdminMerchantTransfersInput = {
  page?: number;
  pageSize?: number;
  search?: string;
  statusFilter?: MerchantTransferStatusFilter;
  sort?: MerchantTransferSort;
  dateFrom?: string;
  dateTo?: string;
};

export type ListAdminMerchantTransfersResult =
  | { success: true; data: MerchantTransferPage }
  | { success: false; error: string };

export type AdminPayoutsPageData = {
  stripeBalance: AdminPayoutsStripeBalance | null;
  stripeBalanceError?: string;
};

export type AdminPayoutsPageResult =
  | { success: true; data: AdminPayoutsPageData }
  | { success: false; error: string };

export type FpsBatchScheduleInfo = {
  batchWeekday: number;
  batchWeekdayLabel: string;
  nextBatchDateLabel: string;
  cutoffLabel: string;
};

export const MERCHANT_TRANSFERS_PAGE_SIZE = 10;
export const MERCHANT_TRANSFERS_MAX_PAGE_SIZE = 50;
export const MERCHANT_TRANSFERS_EXPORT_CAP = 2000;
export const MERCHANT_NAME_SORT_FETCH_CAP = 5000;
