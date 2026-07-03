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
  const historyKey = filtersKey(filters);

  filtersRef.current = filters;

  const runTradeHistoryFetch = useCallback(
    async (
      requestId: number,
      activeFilters: MarketplaceProductTradeHistoryFilters,
    ) => {
      if (!activeFilters.enabled) {
        setTradeHistory([]);
        setMeta(EMPTY_META);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const result = await getMarketplaceProductTradeHistory({
          productId: activeFilters.productId,
          page: activeFilters.page,
          pageSize: activeFilters.pageSize,
        });

        if (requestId !== requestIdRef.current) return;

        if (!result.success) {
          setTradeHistory([]);
          setMeta(EMPTY_META);
          setError(result.error);
          return;
        }

        setTradeHistory(result.data);
        setMeta(result.meta);
        setError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setTradeHistory([]);
        setMeta(EMPTY_META);
        setError("無法連線至大盤市場");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    const activeFilters = filtersRef.current;

    setIsLoading(true);
    setError(null);
    void runTradeHistoryFetch(requestId, activeFilters);
  }, [historyKey, runTradeHistoryFetch]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);
    void runTradeHistoryFetch(requestId, filtersRef.current);
  }, [runTradeHistoryFetch]);

  return {
    tradeHistory,
    meta,
    isLoading,
    error,
    refetch,
  };
}
