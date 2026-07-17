export type MerchantPerformanceRange =
  | "12h"
  | "7d"
  | "1m"
  | "3m"
  | "6m"
  | "12m";

export type MerchantPerformanceMetricBlock = {
  turnover: number;
  txCount: number;
  avgPrice: number;
};

export type MerchantPerformanceSeriesPoint = {
  label: string;
  turnover: number;
  avgPrice: number;
  txCount: number;
};

export type MerchantPerformanceTopProduct = {
  rank: number;
  productId: string;
  name: string;
  skuNo: string;
  volume: number;
  revenue: number;
};

export type MerchantPerformanceTopSpender = {
  rank: number;
  buyerId: string;
  name: string;
  avatarUrl: string;
  spending: number;
};

export type MerchantPerformanceAnalytics = {
  allTime: MerchantPerformanceMetricBlock;
  interval: MerchantPerformanceMetricBlock;
  series: MerchantPerformanceSeriesPoint[];
  topProducts: MerchantPerformanceTopProduct[];
  topSpenders: MerchantPerformanceTopSpender[];
  timeRange: MerchantPerformanceRange;
};

export type MerchantPerformanceRpcPayload = {
  allTime?: {
    turnover?: number | string;
    txCount?: number | string;
    avgPrice?: number | string;
  };
  interval?: {
    turnover?: number | string;
    txCount?: number | string;
    avgPrice?: number | string;
  };
  series?: Array<{
    label?: string;
    turnover?: number | string;
    txCount?: number | string;
    avgPrice?: number | string;
  }>;
  topProducts?: Array<{
    rank?: number | string;
    productId?: string;
    name?: string;
    skuNo?: string;
    volume?: number | string;
    revenue?: number | string;
  }>;
  topSpenders?: Array<{
    rank?: number | string;
    buyerId?: string;
    name?: string;
    avatarPath?: string | null;
    spending?: number | string;
  }>;
  timeRange?: string;
};
