"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  getMarketplaceBootstrap,
  getMarketplaceFilterMetadata,
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
import {
  isMarketplaceClientPerfLogEnabled,
  logMarketplaceClientSearchSummary,
  markMarketplaceClientMount,
  marketplaceClientPerfLog,
  recordMarketplaceClientSearch,
} from "@/app/lib/marketplace/perf-log-client";
import { MARKETPLACE_GRID_PAGE_SIZE } from "@/lib/marketplace/constants";

const QUERY_DEBOUNCE_MS = 350;

const EMPTY_META: MarketplacePaginationMeta = {
  total: 0,
  page: 1,
  pageSize: MARKETPLACE_GRID_PAGE_SIZE,
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
  priceBounds?: { minPrice: number; maxPrice: number };
  rarities?: string[];
};

function hasMarketplaceSearchInitialData(
  data: MarketplaceSearchInitialData | undefined,
): data is MarketplaceSearchInitialData {
  return Boolean(data?.products);
}

type UseMarketplaceSearchResult = {
  products: MarketplaceProductRow[];
  meta: MarketplacePaginationMeta;
  isLoading: boolean;
  isRefreshing: boolean;
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
  /** When set, price filters equal to full bounds are omitted from search RPC. */
  absolutePriceBounds?: { minPrice: number; maxPrice: number } | null;
};

function resolveSearchPriceFilters(
  filters: MarketplaceSearchFilters,
  absolutePriceBounds?: { minPrice: number; maxPrice: number } | null,
): { priceMin?: number; priceMax?: number } {
  if (!absolutePriceBounds) {
    if (filters.priceMin <= 0 && filters.priceMax >= 100_000) {
      return {};
    }
    return {
      priceMin: filters.priceMin > 0 ? filters.priceMin : undefined,
      priceMax: filters.priceMax < 100_000 ? filters.priceMax : undefined,
    };
  }

  const priceMin =
    filters.priceMin > absolutePriceBounds.minPrice
      ? filters.priceMin
      : undefined;
  const priceMax =
    filters.priceMax < absolutePriceBounds.maxPrice
      ? filters.priceMax
      : undefined;

  return { priceMin, priceMax };
}

function toSearchInput(
  filters: MarketplaceSearchFilters,
  absolutePriceBounds?: { minPrice: number; maxPrice: number } | null,
) {
  const { priceMin, priceMax } = resolveSearchPriceFilters(
    filters,
    absolutePriceBounds,
  );

  return {
    query: filters.query,
    rarities: filters.rarities,
    gradeFilters: parseGradeFilters(filters.grades),
    sellerModes: mapSellerModes(filters.sellerTypes),
    priceMin,
    priceMax,
    sortKey: filters.sortKey,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export function useMarketplaceSearch(
  filters: MarketplaceSearchFilters,
  options: UseMarketplaceSearchOptions = {},
): UseMarketplaceSearchResult {
  const { initialData, absolutePriceBounds } = options;
  const hasInitialProducts = hasMarketplaceSearchInitialData(initialData);
  const [products, setProducts] = useState<MarketplaceProductRow[]>(
    initialData?.products ?? [],
  );
  const [meta, setMeta] = useState<MarketplacePaginationMeta>(
    initialData?.meta ?? EMPTY_META,
  );
  const [isFetching, setIsFetching] = useState(!hasInitialProducts);
  const [error, setError] = useState<string | null>(null);
  const [priceBounds, setPriceBounds] = useState<{
    minPrice: number;
    maxPrice: number;
  } | null>(initialData?.priceBounds ?? null);
  const [rarities, setRarities] = useState<string[]>(
    initialData?.rarities ?? [],
  );
  const [isReady, setIsReady] = useState(hasInitialProducts);

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  const bootstrapStartedRef = useRef(hasInitialProducts);
  const skipNextSearchRef = useRef(hasInitialProducts);
  const [debouncedQuery, setDebouncedQuery] = useState(filters.query);

  filtersRef.current = filters;

  useEffect(() => {
    markMarketplaceClientMount();
    const summaryTimer = window.setTimeout(() => {
      logMarketplaceClientSearchSummary();
    }, 2000);

    return () => window.clearTimeout(summaryTimer);
  }, []);

  useEffect(() => {
    if (!hasInitialProducts) return;
    if (initialData?.priceBounds && initialData.rarities) return;

    let cancelled = false;

    void (async () => {
      const result = await getMarketplaceFilterMetadata();
      if (cancelled || !result.success) return;

      setPriceBounds(result.data.priceBounds);
      setRarities(result.data.rarities);
    })();

    return () => {
      cancelled = true;
    };
  }, [hasInitialProducts, initialData?.priceBounds, initialData?.rarities]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(filters.query);
    }, QUERY_DEBOUNCE_MS);

    return () => window.clearTimeout(timer);
  }, [filters.query]);

  const searchKey = filtersKey({ ...filters, query: debouncedQuery });

  const runSearch = useCallback(
    async (
      requestId: number,
      activeFilters: MarketplaceSearchFilters,
      perfDetails?: string,
    ) => {
      if (perfDetails) {
        recordMarketplaceClientSearch(perfDetails);
      }

      try {
        const result = await searchMarketplaceProducts(
          toSearchInput(activeFilters, absolutePriceBounds),
        );

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
          setIsFetching(false);
        }
      }
    },
    [absolutePriceBounds],
  );

  useEffect(() => {
    if (hasInitialProducts || bootstrapStartedRef.current) return;
    bootstrapStartedRef.current = true;

    let cancelled = false;

    void (async () => {
      setIsFetching(true);
      setError(null);

      const activeFilters = { ...filtersRef.current, query: filtersRef.current.query };
      const result = await getMarketplaceBootstrap(
        toSearchInput(activeFilters, absolutePriceBounds),
      );

      if (cancelled) return;

      if (!result.success) {
        setProducts([]);
        setMeta(EMPTY_META);
        setError(result.error);
        setIsFetching(false);
        setIsReady(true);
        return;
      }

      setProducts(result.data.products);
      setMeta(result.data.meta);
      setPriceBounds(result.data.priceBounds);
      setRarities(result.data.rarities);
      setError(null);
      setIsFetching(false);
      setIsReady(true);
      skipNextSearchRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
  }, [hasInitialProducts, absolutePriceBounds]);

  useEffect(() => {
    if (!isReady) return;

    if (skipNextSearchRef.current) {
      if (isMarketplaceClientPerfLogEnabled()) {
        marketplaceClientPerfLog(
          `skipSearch searchKey=${searchKey} reason=initialData`,
        );
      }
      skipNextSearchRef.current = false;
      return;
    }

    const requestId = ++requestIdRef.current;
    const activeFilters = { ...filtersRef.current, query: debouncedQuery };

    setIsFetching(true);
    setError(null);
    void runSearch(
      requestId,
      activeFilters,
      `searchKey=${searchKey} page=${activeFilters.page} pageSize=${activeFilters.pageSize} source=filterChange`,
    );
  }, [searchKey, runSearch, debouncedQuery, isReady]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;
    const activeFilters = { ...filtersRef.current, query: debouncedQuery };

    setIsFetching(true);
    setError(null);
    void runSearch(
      requestId,
      activeFilters,
      `searchKey=${filtersKey({ ...activeFilters, query: debouncedQuery })} page=${activeFilters.page} pageSize=${activeFilters.pageSize} source=refetch`,
    );
  }, [debouncedQuery, runSearch]);

  const isLoading = isFetching && products.length === 0;
  const isRefreshing = isFetching && products.length > 0;

  return {
    products,
    meta,
    isLoading,
    isRefreshing,
    error,
    priceBounds,
    rarities,
    refetch,
  };
}
