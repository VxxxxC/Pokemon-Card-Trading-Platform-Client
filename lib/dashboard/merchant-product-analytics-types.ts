import type { MerchantPerformanceRange } from "@/lib/dashboard/merchant-performance-types";

export type MerchantProductAnalyticsProduct = {
  id: string;
  name: string;
  skuNo: string;
  imageUrl: string;
};

export type MerchantProductAnalyticsSummary = {
  avgSoldPrice: number;
  marketLowestPrice: number;
  totalViews: number;
  totalOffers: number;
};

export type MerchantProductAnalyticsSeriesPoint = {
  label: string;
  totalSales: number;
  viewCount: number;
  txCount: number;
  offerCount: number;
};

export type MerchantProductAnalyticsHistoryItem = {
  orderId: string;
  orderNumber: string;
  buyerId: string;
  buyerName: string;
  finalPrice: number;
  eventAt: string;
};

export type MerchantProductAnalyticsHistoryMeta = {
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type MerchantProductAnalytics = {
  product: MerchantProductAnalyticsProduct;
  summary: MerchantProductAnalyticsSummary;
  series: MerchantProductAnalyticsSeriesPoint[];
  history: {
    items: MerchantProductAnalyticsHistoryItem[];
    meta: MerchantProductAnalyticsHistoryMeta;
  };
  timeRange: MerchantPerformanceRange;
};

export type MerchantProductAnalyticsRpcPayload = {
  product?: {
    id?: string;
    name?: string;
    skuNo?: string;
    imageUrl?: string;
  };
  summary?: {
    avgSoldPrice?: number | string;
    marketLowestPrice?: number | string;
    totalViews?: number | string;
    totalOffers?: number | string;
  };
  series?: Array<{
    label?: string;
    totalSales?: number | string;
    viewCount?: number | string;
    txCount?: number | string;
    offerCount?: number | string;
  }>;
  history?: {
    items?: Array<{
      orderId?: string;
      orderNumber?: string;
      buyerId?: string;
      buyerName?: string;
      finalPrice?: number | string;
      eventAt?: string;
    }>;
    meta?: {
      totalCount?: number | string;
      page?: number | string;
      pageSize?: number | string;
      totalPages?: number | string;
    };
  };
  timeRange?: string;
};
