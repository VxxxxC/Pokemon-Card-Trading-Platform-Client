import type { MerchantPerformanceRange } from "@/lib/dashboard/merchant-performance-types";

export const MERCHANT_PERF_RANGES: MerchantPerformanceRange[] = [
  "12h",
  "7d",
  "1m",
  "3m",
  "6m",
  "12m",
];

export const MERCHANT_PERF_DEFAULT_RANGE: MerchantPerformanceRange = "7d";

export const MERCHANT_PERF_TOP_LIMIT = 9;

export const RANGE_LABEL_MAP: Record<MerchantPerformanceRange, string> = {
  "12h": "12小時內",
  "7d": "7日內",
  "1m": "1個月內",
  "3m": "3個月內",
  "6m": "6個月內",
  "12m": "12個月內",
};

export const SELECT_DISPLAY_MAP: Record<MerchantPerformanceRange, string> = {
  "12h": "12 小時",
  "7d": "7 日",
  "1m": "1 個月",
  "3m": "3 個月",
  "6m": "6 個月",
  "12m": "12 個月",
};

export function isMerchantPerformanceRange(
  value: string,
): value is MerchantPerformanceRange {
  return (MERCHANT_PERF_RANGES as string[]).includes(value);
}
