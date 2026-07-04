"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMarketplaceBootstrap,
  searchMarketplaceProducts,
} from "@/app/actions/marketplace";
import {
  mapSellerModes,
  parseGradeFilters,
} from "@/app/lib/marketplace/searchParsers";
import type {
  MarketplacePaginationMeta,
  MarketplaceProductRow,
} from "@/app/lib/marketplace/types";
import type { SortKey } from "@/app/store/useMarketStore";

const QUERY_DEBOUNCE_MS = 350;

const EMPTY_META: MarketplacePaginationMeta = {
  total: 0,
  page: 1,
  pageSize: 12,
  totalPages: 0,
  rangeStart: 0,
  rangeEnd: 0,
};

export type MarketplaceSearchFilters = {
  query: string;
  rarities: string[];
  grades: string[];
  sellerTypes: string[];
  priceMin: number;
  priceMax: number;
  sortKey: SortKey;
  page: number;
  pageSize: number;
};

export type MarketplaceSearchInitialData = {
  products: MarketplaceProductRow[];
  meta: MarketplacePaginationMeta;
  priceBounds: { minPrice: number; maxPrice: number };
  rarities: string[];
};

type UseMarketplaceSearchResult = {
  products: MarketplaceProductRow[];
  meta: MarketplacePaginationMeta;
  isLoading: boolean;
  error: string | null;
  priceBounds: { minPrice: number; maxPrice: number } | null;
  rarities: string[];
  refetch: () => void;
};

function filtersKey(filters: MarketplaceSearchFilters): string {
  return [
    filters.query,
    filters.sortKey,
    filters.rarities.join(","),
    filters.grades.join(","),
    filters.sellerTypes.join(","),
    filters.priceMin,
    filters.priceMax,
    filters.page,
    filters.pageSize,
  ].join("|");
}

type UseMarketplaceSearchOptions = {
  initialData?: MarketplaceSearchInitialData;
};

export function useMarketplaceSearch(
  filters: MarketplaceSearchFilters,
  options: UseMarketplaceSearchOptions = {},
): UseMarketplaceSearchResult {
  const { initialData } = options;
  const [products, setProducts] = useState<MarketplaceProductRow[]>(
    initialData?.products ?? [],
  );
  const [meta, setMeta] = useState<MarketplacePaginationMeta>(
    initialData?.meta ?? EMPTY_META,
  );
  const [isLoading, setIsLoading] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);
  const [priceBounds, setPriceBounds] = useState<{
    minPrice: number;
    maxPrice: number;
  } | null>(initialData?.priceBounds ?? null);
  const [rarities, setRarities] = useState<string[]>(
    initialData?.rarities ?? [],
  );
  const [isReady, setIsReady] = useState(Boolean(initialData));

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  const bootstrapStartedRef = useRef(Boolean(initialData));
  const skipNextSearchRef = useRef(Boolean(initialData));
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);

  filtersRef.current = filters;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, QUERY_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [filters.query]);

  const searchKey = filtersKey({ ...filters, query: debouncedQuery });

  const runSearch = useCallback(
    async (requestId: number, activeFilters: MarketplaceSearchFilters) => {
      try {
        const result = await searchMarketplaceProducts({
          query: activeFilters.query,
          rarities: activeFilters.rarities,
          gradeFilters: parseGradeFilters(activeFilters.grades),
          sellerModes: mapSellerModes(activeFilters.sellerTypes),
          priceMin: activeFilters.priceMin,
          priceMax: activeFilters.priceMax,
          sortKey: activeFilters.sortKey,
          page: activeFilters.page,
          pageSize: activeFilters.pageSize,
        });

        if (requestId !== requestIdRef.current) return;

        if (!result.success) {
          setProducts([]);
          setMeta(EMPTY_META);
          setError(result.error);
          return;
        }

        setProducts(result.data);
        setMeta(result.meta);
        setError(null);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setProducts([]);
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
    if (initialData || bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    let cancelled = false;

    void (async () => {
      setIsLoading(true);
      setError(null);

      const activeFilters = { ...filtersRef.current, query: filtersRef.current.query };
      const result = await getMarketplaceBootstrap({
        query: activeFilters.query,
        rarities: activeFilters.rarities,
        gradeFilters: parseGradeFilters(activeFilters.grades),
        sellerModes: mapSellerModes(activeFilters.sellerTypes),
        priceMin: activeFilters.priceMin,
        priceMax: activeFilters.priceMax,
        sortKey: activeFilters.sortKey,
        page: activeFilters.page,
        pageSize: activeFilters.pageSize,
      });

      if (cancelled) return;

      if (!result.success) {
        setProducts([]);
        setMeta(EMPTY_META);
        setError(result.error);
        setIsLoading(false);
        setIsReady(true);
        return;
      }

      setProducts(result.data.products);
      setMeta(result.data.meta);
      setPriceBounds(result.data.priceBounds);
      setRarities(result.data.rarities);
      setError(null);
      setIsLoading(false);
      setIsReady(true);
      skipNextSearchRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [initialData]);

  useEffect(() => {
    if (!isReady) return;

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const requestId = ++requestIdRef.current;
    const activeFilters = { ...filtersRef.current, query: debouncedQuery };

    setIsLoading(true);
    setError(null);
    void runSearch(requestId, activeFilters);
  }, [searchKey, runSearch, debouncedQuery, isReady]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    const activeFilters = { ...filtersRef.current, query: debouncedQuery };

    setIsLoading(true);
    setError(null);
    void runSearch(requestId, activeFilters);
  }, [debouncedQuery, runSearch]);

  return {
    products,
    meta,
    isLoading,
    error,
    priceBounds,
    rarities,
    refetch,
  };
}
