import {
  isMerchantPerformanceRange,
  MERCHANT_PERF_DEFAULT_RANGE,
} from "@/lib/dashboard/merchant-performance-ranges";
import type { MerchantPerformanceRange } from "@/lib/dashboard/merchant-performance-types";
import type {
  MerchantProductAnalytics,
  MerchantProductAnalyticsRpcPayload,
} from "@/lib/dashboard/merchant-product-analytics-types";

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function mapMerchantProductAnalyticsRpcPayload(
  payload: MerchantProductAnalyticsRpcPayload | null,
  fallbackRange: MerchantPerformanceRange,
  fallbackProductId: string,
): MerchantProductAnalytics {
  const timeRange: MerchantPerformanceRange = isMerchantPerformanceRange(
    payload?.timeRange ?? "",
  )
    ? (payload!.timeRange as MerchantPerformanceRange)
    : fallbackRange;

  const meta = payload?.history?.meta;

  return {
    product: {
      id: payload?.product?.id ?? fallbackProductId,
      name: payload?.product?.name?.trim() || "未知商品",
      skuNo: payload?.product?.skuNo?.trim() || "—",
      imageUrl: payload?.product?.imageUrl?.trim() || "",
    },
    summary: {
      avgSoldPrice: toNumber(payload?.summary?.avgSoldPrice),
      marketLowestPrice: toNumber(payload?.summary?.marketLowestPrice),
      totalViews: toNumber(payload?.summary?.totalViews),
      totalOffers: toNumber(payload?.summary?.totalOffers),
    },
    series: (payload?.series ?? []).map((point) => ({
      label: point.label?.trim() || "—",
      totalSales: toNumber(point.totalSales),
      viewCount: toNumber(point.viewCount),
      txCount: toNumber(point.txCount),
      offerCount: toNumber(point.offerCount),
    })),
    history: {
      items: (payload?.history?.items ?? []).map((item) => ({
        orderId: item.orderId ?? "",
        orderNumber: item.orderNumber?.trim() || item.orderId || "—",
        buyerId: item.buyerId ?? "",
        buyerName: item.buyerName?.trim() || "用戶",
        finalPrice: toNumber(item.finalPrice),
        eventAt: item.eventAt ?? "",
      })),
      meta: {
        totalCount: toNumber(meta?.totalCount),
        page: toNumber(meta?.page) || 1,
        pageSize: toNumber(meta?.pageSize) || 6,
        totalPages: toNumber(meta?.totalPages) || 1,
      },
    },
    timeRange,
  };
}

export function emptyMerchantProductAnalytics(
  productId: string,
  timeRange: MerchantPerformanceRange = MERCHANT_PERF_DEFAULT_RANGE,
): MerchantProductAnalytics {
  return {
    product: {
      id: productId,
      name: "未知商品",
      skuNo: "—",
      imageUrl: "",
    },
    summary: {
      avgSoldPrice: 0,
      marketLowestPrice: 0,
      totalViews: 0,
      totalOffers: 0,
    },
    series: [],
    history: {
      items: [],
      meta: {
        totalCount: 0,
        page: 1,
        pageSize: 6,
        totalPages: 1,
      },
    },
    timeRange,
  };
}
