import type {
  MerchantPerformanceAnalytics,
  MerchantPerformanceMetricBlock,
  MerchantPerformanceRange,
  MerchantPerformanceRpcPayload,
} from "@/lib/dashboard/merchant-performance-types";
import {
  isMerchantPerformanceRange,
  MERCHANT_PERF_DEFAULT_RANGE,
} from "@/lib/dashboard/merchant-performance-ranges";
import { resolveAvatarUrl } from "@/lib/profile/avatar";

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function mapMetricBlock(
  block: MerchantPerformanceRpcPayload["allTime"] | undefined,
): MerchantPerformanceMetricBlock {
  return {
    turnover: toNumber(block?.turnover),
    txCount: toNumber(block?.txCount),
    avgPrice: toNumber(block?.avgPrice),
  };
}

export function mapMerchantPerformanceRpcPayload(
  payload: MerchantPerformanceRpcPayload | null,
  fallbackRange: MerchantPerformanceRange,
): MerchantPerformanceAnalytics {
  const timeRange: MerchantPerformanceRange = isMerchantPerformanceRange(
    payload?.timeRange ?? "",
  )
    ? (payload!.timeRange as MerchantPerformanceRange)
    : fallbackRange;

  return {
    allTime: mapMetricBlock(payload?.allTime),
    interval: mapMetricBlock(payload?.interval),
    series: (payload?.series ?? []).map((point) => ({
      label: point.label?.trim() || "—",
      turnover: toNumber(point.turnover),
      txCount: toNumber(point.txCount),
      avgPrice: toNumber(point.avgPrice),
    })),
    topProducts: (payload?.topProducts ?? []).map((row, index) => ({
      rank: toNumber(row.rank) || index + 1,
      productId: row.productId ?? "",
      name: row.name?.trim() || "未知商品",
      skuNo: row.skuNo?.trim() || "—",
      volume: toNumber(row.volume),
      revenue: toNumber(row.revenue),
    })),
    topSpenders: (payload?.topSpenders ?? []).map((row, index) => ({
      rank: toNumber(row.rank) || index + 1,
      buyerId: row.buyerId ?? "",
      name: row.name?.trim() || "用戶",
      avatarUrl: resolveAvatarUrl(row.avatarPath),
      spending: toNumber(row.spending),
    })),
    timeRange,
  };
}

export function emptyMerchantPerformanceAnalytics(
  timeRange: MerchantPerformanceRange = MERCHANT_PERF_DEFAULT_RANGE,
): MerchantPerformanceAnalytics {
  const zeroBlock: MerchantPerformanceMetricBlock = {
    turnover: 0,
    txCount: 0,
    avgPrice: 0,
  };

  return {
    allTime: zeroBlock,
    interval: zeroBlock,
    series: [],
    topProducts: [],
    topSpenders: [],
    timeRange,
  };
}
