"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchMerchantTradingOrders,
  type MerchantTradingFilterCounts,
  type MerchantTradingOrder,
  type TradingOrdersPaginationMeta,
} from "@/app/actions/orders";
import {
  logTradingClientReady,
  markTradingClientMount,
} from "@/app/lib/member-order/perf-log-client";
import type { MerchantTradingPageBootstrap } from "@/app/lib/merchant-order/types";
import {
  EMPTY_MERCHANT_TRADING_FILTER_COUNTS,
  EMPTY_MERCHANT_TRADING_PAGINATION_META,
} from "@/app/lib/merchant-order/types";
import {
  TRADING_DEFAULT_PAGE_SIZE,
  TRADING_MOBILE_BREAKPOINT_PX,
  TRADING_MOBILE_PAGE_SIZE,
  TRADING_SEARCH_DEBOUNCE_MS,
  type TabStatusFilter,
} from "@/lib/merchant-order/constants";

export type MerchantTradingInitialData = Partial<MerchantTradingPageBootstrap>;

type UseMerchantTradingOptions = {
  tabStatus?: TabStatusFilter;
  searchQuery?: string;
  includePaymentPending?: boolean;
  includeAuthInProgress?: boolean;
  onlyRaw?: boolean;
  initialData?: MerchantTradingInitialData;
};

type UseMerchantTradingResult = {
  orders: MerchantTradingOrder[];
  paginationMeta: TradingOrdersPaginationMeta;
  filterCounts: MerchantTradingFilterCounts;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
};

function hasMerchantTradingInitialBootstrap(
  data: MerchantTradingInitialData | undefined,
): data is MerchantTradingPageBootstrap {
  return Boolean(data?.orders && data?.meta && data?.filters);
}

function buildListKey(
  tabStatus: TabStatusFilter,
  query: string,
  pageSize: number,
  includePaymentPending: boolean,
  includeAuthInProgress: boolean,
  onlyRaw: boolean,
): string {
  return `${tabStatus}:${query}:${pageSize}:${includePaymentPending}:${includeAuthInProgress}:${onlyRaw}`;
}

export function useMerchantTrading(
  options: UseMerchantTradingOptions = {},
): UseMerchantTradingResult {
  const tabStatus = options.tabStatus ?? "all";
  const searchQuery = options.searchQuery ?? "";
  const includePaymentPending = options.includePaymentPending ?? true;
  const includeAuthInProgress = options.includeAuthInProgress ?? true;
  const onlyRaw = options.onlyRaw ?? false;
  const hasInitialBootstrap = hasMerchantTradingInitialBootstrap(
    options.initialData,
  );

  const [pageSize, setPageSize] = useState(
    options.initialData?.meta?.pageSize ?? TRADING_DEFAULT_PAGE_SIZE,
  );
  const [page, setPage] = useState(options.initialData?.meta?.page ?? 1);
  const [orders, setOrders] = useState<MerchantTradingOrder[]>(
    options.initialData?.orders ?? [],
  );
  const [paginationMeta, setPaginationMeta] =
    useState<TradingOrdersPaginationMeta>(
      options.initialData?.meta ?? EMPTY_MERCHANT_TRADING_PAGINATION_META,
    );
  const [filterCounts, setFilterCounts] =
    useState<MerchantTradingFilterCounts>(
      options.initialData?.filters ?? EMPTY_MERCHANT_TRADING_FILTER_COUNTS,
    );
  const [isLoading, setIsLoading] = useState(!hasInitialBootstrap);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const mountLoggedRef = useRef(false);
  const skippedInitialFetchRef = useRef(false);
  const [initialListKey] = useState(() =>
    buildListKey(
      tabStatus,
      "",
      options.initialData?.meta?.pageSize ?? TRADING_DEFAULT_PAGE_SIZE,
      includePaymentPending,
      includeAuthInProgress,
      false,
    ),
  );
  const initialPageRef = useRef(options.initialData?.meta?.page ?? 1);

  const debouncedQueryRef = useRef(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const listKey = buildListKey(
    tabStatus,
    debouncedQuery,
    pageSize,
    includePaymentPending,
    includeAuthInProgress,
    onlyRaw,
  );
  const isInitialListKey = listKey === initialListKey;

  useEffect(() => {
    debouncedQueryRef.current = searchQuery;
    const debounceMs = searchQuery.trim()
      ? TRADING_SEARCH_DEBOUNCE_MS
      : 0;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(debouncedQueryRef.current);
    }, debounceMs);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [
    tabStatus,
    debouncedQuery,
    pageSize,
    includePaymentPending,
    includeAuthInProgress,
    onlyRaw,
  ]);

  useEffect(() => {
    const handleResize = () => {
      const nextPageSize =
        window.innerWidth < TRADING_MOBILE_BREAKPOINT_PX
          ? TRADING_MOBILE_PAGE_SIZE
          : TRADING_DEFAULT_PAGE_SIZE;
      setPageSize((current) => (current === nextPageSize ? current : nextPageSize));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (mountLoggedRef.current) return;
    mountLoggedRef.current = true;
    markTradingClientMount(hasInitialBootstrap);
    if (hasInitialBootstrap) {
      logTradingClientReady("bootstrap");
    }
  }, [hasInitialBootstrap]);

  const refetch = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  useEffect(() => {
    if (
      hasInitialBootstrap &&
      !skippedInitialFetchRef.current &&
      isInitialListKey &&
      page === initialPageRef.current &&
      refreshKey === 0
    ) {
      skippedInitialFetchRef.current = true;
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      if (refreshKey > 0) {
        setIsRefreshing(true);
      }
      setError(null);

      const result = await searchMerchantTradingOrders({
        tabStatus,
        searchQuery: debouncedQuery.trim() || undefined,
        page,
        pageSize,
        includePaymentPending,
        includeAuthInProgress,
        onlyRaw,
      });

      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
        setOrders([]);
        setPaginationMeta({ ...EMPTY_MERCHANT_TRADING_PAGINATION_META, pageSize });
        setFilterCounts(EMPTY_MERCHANT_TRADING_FILTER_COUNTS);
      } else {
        setOrders(result.data);
        setPaginationMeta(result.meta);
        setFilterCounts(result.filters);
        setPage(result.meta.page);
        setError(null);
      }

      setIsLoading(false);
      setIsRefreshing(false);

      if (!hasInitialBootstrap && refreshKey === 0) {
        logTradingClientReady("bootstrap");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    tabStatus,
    debouncedQuery,
    page,
    pageSize,
    includePaymentPending,
    includeAuthInProgress,
    onlyRaw,
    refreshKey,
    hasInitialBootstrap,
    isInitialListKey,
  ]);

  return {
    orders,
    paginationMeta,
    filterCounts,
    page,
    pageSize,
    isLoading,
    isRefreshing,
    error,
    refetch,
    setPage,
  };
}
