export {
  TRADING_DEFAULT_PAGE_SIZE,
  TRADING_MOBILE_BREAKPOINT_PX,
  TRADING_MOBILE_PAGE_SIZE,
  TRADING_SEARCH_DEBOUNCE_MS,
  TAB_STATUS_FROM_PARAM,
  TAB_STATUS_TO_PARAM,
  type TabStatusFilter,
} from "@/lib/member-order/constants";

export const MERCHANT_STATUS_OPTIONS: {
  value: import("@/lib/member-order/constants").TabStatusFilter;
  label: string;
}[] = [
  { value: "all", label: "全部" },
  { value: "pending", label: "待處理" },
  { value: "completed", label: "已完成" },
  { value: "cancelled", label: "已取消" },
];
