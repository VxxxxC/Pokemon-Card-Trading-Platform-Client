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

const listingDetailCache = new Map<string, MarketplaceListingDetail>();
const inflightDetailRequests = new Map<
  string,
  Promise<MarketplaceListingDetail | null>
>();

function filtersKey(filters: MarketplaceListingDetailFilters): string {
  return [filters.listingId ?? "", String(filters.enabled)].join("|");
}

export function prefetchMarketplaceListingDetail(
  listingId: string,
): void {
  const id = listingId.trim();
  if (!id || listingDetailCache.has(id)) {
    return;
  }

  if (inflightDetailRequests.has(id)) {
    return;
  }

  const request = getMarketplaceListingDetail(id)
    .then((result) => {
      if (!result.success) {
        return null;
      }
      listingDetailCache.set(id, result.data);
      return result.data;
    })
    .finally(() => {
      inflightDetailRequests.delete(id);
    });

  inflightDetailRequests.set(id, request);
}

export function useMarketplaceListingDetail(
  filters: MarketplaceListingDetailFilters,
): UseMarketplaceListingDetailResult {
  const listingId = filters.listingId?.trim() ?? "";
  const cachedDetail =
    filters.enabled && listingId
      ? (listingDetailCache.get(listingId) ?? null)
      : null;

  const [detail, setDetail] = useState<MarketplaceListingDetail | null>(
    cachedDetail,
  );
  const [isLoading, setIsLoading] = useState(
    filters.enabled && listingId.length > 0 && cachedDetail == null,
  );
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  const detailKey = filtersKey(filters);

  filtersRef.current = filters;

  const runDetailFetch = useCallback(
    async (requestId: number, activeFilters: MarketplaceListingDetailFilters) => {
      const activeListingId = activeFilters.listingId?.trim();
      if (!activeFilters.enabled || !activeListingId) {
        setDetail(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      const cached = listingDetailCache.get(activeListingId);
      if (cached) {
        if (requestId !== requestIdRef.current) return;
        setDetail(cached);
        setError(null);
        setIsLoading(false);
        return;
      }

      try {
        const inflight = inflightDetailRequests.get(activeListingId);
        const result = inflight
          ? { success: true as const, data: await inflight }
          : await getMarketplaceListingDetail(activeListingId);

        if (requestId !== requestIdRef.current) return;

        if (!result.success || !result.data) {
          setDetail(null);
          setError(
            result.success ? "找不到此掛單" : result.error,
          );
          return;
        }

        listingDetailCache.set(activeListingId, result.data);
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
    const activeListingId = activeFilters.listingId?.trim() ?? "";
    const cached =
      activeFilters.enabled && activeListingId
        ? (listingDetailCache.get(activeListingId) ?? null)
        : null;

    if (cached) {
      setDetail(cached);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(activeFilters.enabled && activeListingId.length > 0);
    setError(null);
    setDetail(null);
    void runDetailFetch(requestId, activeFilters);
  }, [detailKey, runDetailFetch]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    const activeListingId = filtersRef.current.listingId?.trim();
    if (activeListingId) {
      listingDetailCache.delete(activeListingId);
    }

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
