"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketplaceProductTradeHistory } from "@/app/actions/marketplace";
import type {
  MarketplacePaginationMeta,
  MarketplaceProductTradeHistoryRow,
} from "@/app/lib/marketplace/types";

const EMPTY_META: MarketplacePaginationMeta = {
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 0,
  rangeStart: 0,
  rangeEnd: 0,
};

export type MarketplaceProductTradeHistoryFilters = {
  productId: string;
  page: number;
  pageSize: number;
  enabled: boolean;
};

type UseMarketplaceProductTradeHistoryResult = {
  tradeHistory: MarketplaceProductTradeHistoryRow[];
  meta: MarketplacePaginationMeta;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

function filtersKey(filters: MarketplaceProductTradeHistoryFilters): string {
  return [
    filters.productId,
    filters.page,
    filters.pageSize,
    String(filters.enabled),
  ].join("|");
}

export function useMarketplaceProductTradeHistory(
  filters: MarketplaceProductTradeHistoryFilters,
): UseMarketplaceProductTradeHistoryResult {
  const [tradeHistory, setTradeHistory] = useState<
    MarketplaceProductTradeHistoryRow[]
  >([]);
  const [meta, setMeta] = useState<MarketplacePaginationMeta>(EMPTY_META);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchTradeHistory = useCallback(async () => {
    const current = filtersRef.current;

    if (!current.enabled) {
      setTradeHistory([]);
      setMeta(EMPTY_META);
      setError(null);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);
    setError(null);

    const result = await getMarketplaceProductTradeHistory({
      productId: current.productId,
      page: current.page,
      pageSize: current.pageSize,
    });

    if (requestId !== requestIdRef.current) return;

    if (!result.success) {
      setTradeHistory([]);
      setMeta(EMPTY_META);
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setTradeHistory(result.data);
    setMeta(result.meta);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchTradeHistory();
  }, [fetchTradeHistory, filtersKey(filters)]);

  return {
    tradeHistory,
    meta,
    isLoading,
    error,
    refetch: fetchTradeHistory,
  };
}
