import type {
  TradingOrdersFilterCounts,
  TradingOrdersPaginationMeta,
  UserTradingOrder,
} from "@/app/actions/orders";
import { TRADING_DEFAULT_PAGE_SIZE } from "@/lib/member-order/constants";

export type TradingPageBootstrap = {
  orders: UserTradingOrder[];
  meta: TradingOrdersPaginationMeta;
  filters: TradingOrdersFilterCounts;
};

export const EMPTY_TRADING_PAGINATION_META: TradingOrdersPaginationMeta = {
  total: 0,
  page: 1,
  pageSize: TRADING_DEFAULT_PAGE_SIZE,
  totalPages: 0,
  rangeStart: 0,
  rangeEnd: 0,
};

export const EMPTY_TRADING_FILTER_COUNTS: TradingOrdersFilterCounts = {
  persona: { all: 0, buy: 0, sell: 0 },
  status: { all: 0, pending: 0, completed: 0, cancelled: 0 },
  needsAction: 0,
};
