"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketplaceProductListings } from "@/app/actions/marketplace";
import type {
  MarketplacePaginationMeta,
  MarketplaceProductListingRow,
  ProductListingSortKey,
} from "@/app/lib/marketplace/types";
import { buildProductListingGradeFilters } from "@/lib/marketplace/product-listing-filters";

const EMPTY_META: MarketplacePaginationMeta = {
  total: 0,
  page: 1,
  pageSize: 5,
  totalPages: 0,
  rangeStart: 0,
  rangeEnd: 0,
};

export type MarketplaceProductListingsFilters = {
  productId: string;
  sort: ProductListingSortKey;
  onlyGraded: boolean;
  selectedGradeFilterId: string;
  page: number;
  pageSize: number;
};

export type MarketplaceProductListingsInitialData = {
  listings: MarketplaceProductListingRow[];
  meta: MarketplacePaginationMeta;
  lowestPrice: number | null;
};

type UseMarketplaceProductListingsOptions = {
  initialData?: MarketplaceProductListingsInitialData;
};

type UseMarketplaceProductListingsResult = {
  listings: MarketplaceProductListingRow[];
  meta: MarketplacePaginationMeta;
  lowestPrice: number | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
};

function filtersKey(filters: MarketplaceProductListingsFilters): string {
  return [
    filters.productId,
    filters.sort,
    filters.onlyGraded,
    filters.selectedGradeFilterId,
    filters.page,
    filters.pageSize,
  ].join("|");
}

export function useMarketplaceProductListings(
  filters: MarketplaceProductListingsFilters,
  options: UseMarketplaceProductListingsOptions = {},
): UseMarketplaceProductListingsResult {
  const { initialData } = options;
  const hasInitialData = Boolean(initialData);

  const [listings, setListings] = useState<MarketplaceProductListingRow[]>(
    initialData?.listings ?? [],
  );
  const [meta, setMeta] = useState<MarketplacePaginationMeta>(
    initialData?.meta ?? EMPTY_META,
  );
  const [lowestPrice, setLowestPrice] = useState<number | null>(
    initialData?.lowestPrice ?? null,
  );
  const [isFetching, setIsFetching] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  const skipNextFetchRef = useRef(hasInitialData);
  const initialFiltersKeyRef = useRef(
    hasInitialData ? filtersKey(filters) : null,
  );
  const listingsKey = filtersKey(filters);

  filtersRef.current = filters;

  const runListingsFetch = useCallback(
    async (
      requestId: number,
      activeFilters: MarketplaceProductListingsFilters,
    ) => {
      try {
        const gradeFilters = buildProductListingGradeFilters(
          activeFilters.selectedGradeFilterId,
        );
        const gradedOnly =
          activeFilters.selectedGradeFilterId === "ALL"
            ? activeFilters.onlyGraded
            : false;

        const result = await getMarketplaceProductListings({
          productId: activeFilters.productId,
          sort: activeFilters.sort,
          onlyGraded: gradedOnly,
          gradeFilters,
          page: activeFilters.page,
          pageSize: activeFilters.pageSize,
        });

        if (requestId !== requestIdRef.current) return;

        if (!result.success) {
          setListings([]);
          setMeta(EMPTY_META);
          setLowestPrice(null);
          setError(result.error);
          return;
        }

        setListings(result.data);
        setMeta(result.meta);
        setLowestPrice(result.lowestPrice);
        setError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setListings([]);
        setMeta(EMPTY_META);
        setLowestPrice(null);
        setError("無法連線至大盤市場");
      } finally {
        if (requestId === requestIdRef.current) {
          setIsFetching(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    if (
      skipNextFetchRef.current &&
      initialFiltersKeyRef.current === listingsKey
    ) {
      skipNextFetchRef.current = false;
      return;
    }

    const requestId = ++requestIdRef.current;
    const activeFilters = filtersRef.current;

    setIsFetching(true);
    setError(null);
    void runListingsFetch(requestId, activeFilters);
  }, [listingsKey, runListingsFetch]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;

    setIsFetching(true);
    setError(null);
    void runListingsFetch(requestId, filtersRef.current);
  }, [runListingsFetch]);

  const isLoading = isFetching && listings.length === 0;

  return {
    listings,
    meta,
    lowestPrice,
    isLoading,
    isRefreshing: isFetching && listings.length > 0,
    error,
    refetch,
  };
}
