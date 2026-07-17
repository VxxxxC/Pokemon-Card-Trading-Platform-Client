import type {
  MerchantTradingFilterCounts,
  MerchantTradingOrder,
  TradingOrdersPaginationMeta,
} from "@/app/actions/orders";
import { TRADING_DEFAULT_PAGE_SIZE } from "@/lib/merchant-order/constants";

export type MerchantTradingPageBootstrap = {
  orders: MerchantTradingOrder[];
  meta: TradingOrdersPaginationMeta;
  filters: MerchantTradingFilterCounts;
};

export const EMPTY_MERCHANT_TRADING_PAGINATION_META: TradingOrdersPaginationMeta =
  {
    total: 0,
    page: 1,
    pageSize: TRADING_DEFAULT_PAGE_SIZE,
    totalPages: 0,
    rangeStart: 0,
    rangeEnd: 0,
  };

export const EMPTY_MERCHANT_TRADING_FILTER_COUNTS: MerchantTradingFilterCounts = {
  status: { all: 0, pending: 0, completed: 0, cancelled: 0 },
  needsAction: 0,
  pendingSub: { payment: 0, authInProgress: 0 },
};
