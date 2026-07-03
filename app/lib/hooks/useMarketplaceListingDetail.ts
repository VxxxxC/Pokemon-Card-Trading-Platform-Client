"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketplaceListingDetail } from "@/app/actions/marketplace";
import type { MarketplaceListingDetail } from "@/app/lib/marketplace/types";

export type MarketplaceListingDetailFilters = {
  listingId: string | null;
  enabled: boolean;
};

type UseMarketplaceListingDetailResult = {
  detail: MarketplaceListingDetail | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
};

function filtersKey(filters: MarketplaceListingDetailFilters): string {
  return [filters.listingId ?? "", String(filters.enabled)].join("|");
}

export function useMarketplaceListingDetail(
  filters: MarketplaceListingDetailFilters,
): UseMarketplaceListingDetailResult {
  const [detail, setDetail] = useState<MarketplaceListingDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  const detailKey = filtersKey(filters);

  filtersRef.current = filters;

  const runDetailFetch = useCallback(
    async (requestId: number, activeFilters: MarketplaceListingDetailFilters) => {
      const listingId = activeFilters.listingId?.trim();
      if (!activeFilters.enabled || !listingId) {
        setDetail(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const result = await getMarketplaceListingDetail(listingId);

        if (requestId !== requestIdRef.current) return;

        if (!result.success) {
          setDetail(null);
          setError(result.error);
          return;
        }

        setDetail(result.data);
        setError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setDetail(null);
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
    setDetail(null);
    void runDetailFetch(requestId, activeFilters);
  }, [detailKey, runDetailFetch]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);
    void runDetailFetch(requestId, filtersRef.current);
  }, [runDetailFetch]);

  return {
    detail,
    isLoading,
    error,
    refetch,
  };
}
