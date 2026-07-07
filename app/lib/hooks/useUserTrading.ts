"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchUserTradingOrders,
  type TradingOrdersFilterCounts,
  type TradingOrdersPaginationMeta,
  type UserTradingOrder,
} from "@/app/actions/orders";
import {
  logTradingClientReady,
  markTradingClientMount,
} from "@/app/lib/member-order/perf-log-client";
import type { TradingPageBootstrap } from "@/app/lib/member-order/types";
import {
  EMPTY_TRADING_FILTER_COUNTS,
  EMPTY_TRADING_PAGINATION_META,
} from "@/app/lib/member-order/types";
import {
  TRADING_DEFAULT_PAGE_SIZE,
  TRADING_MOBILE_BREAKPOINT_PX,
  TRADING_MOBILE_PAGE_SIZE,
  TRADING_SEARCH_DEBOUNCE_MS,
  type PersonaFilter,
  type TabStatusFilter,
} from "@/lib/member-order/constants";

export type TradingInitialData = Partial<TradingPageBootstrap>;

type UseUserTradingOptions = {
  persona?: PersonaFilter;
  tabStatus?: TabStatusFilter;
  searchQuery?: string;
  initialData?: TradingInitialData;
};

type UseUserTradingResult = {
  orders: UserTradingOrder[];
  paginationMeta: TradingOrdersPaginationMeta;
  filterCounts: TradingOrdersFilterCounts;
  page: number;
  pageSize: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
};

function hasTradingInitialBootstrap(
  data: TradingInitialData | undefined,
): data is TradingPageBootstrap {
  return Boolean(data?.orders && data?.meta && data?.filters);
}

function buildListKey(
  persona: PersonaFilter,
  tabStatus: TabStatusFilter,
  query: string,
  pageSize: number,
): string {
  return `${persona}:${tabStatus}:${query}:${pageSize}`;
}

export function useUserTrading(
  options: UseUserTradingOptions = {},
): UseUserTradingResult {
  const persona = options.persona ?? "all";
  const tabStatus = options.tabStatus ?? "all";
  const searchQuery = options.searchQuery ?? "";
  const hasInitialBootstrap = hasTradingInitialBootstrap(options.initialData);

  const [pageSize, setPageSize] = useState(
    options.initialData?.meta?.pageSize ?? TRADING_DEFAULT_PAGE_SIZE,
  );
  const [page, setPage] = useState(options.initialData?.meta?.page ?? 1);
  const [orders, setOrders] = useState<UserTradingOrder[]>(
    options.initialData?.orders ?? [],
  );
  const [paginationMeta, setPaginationMeta] =
    useState<TradingOrdersPaginationMeta>(
      options.initialData?.meta ?? EMPTY_TRADING_PAGINATION_META,
    );
  const [filterCounts, setFilterCounts] = useState<TradingOrdersFilterCounts>(
    options.initialData?.filters ?? EMPTY_TRADING_FILTER_COUNTS,
  );
  const [isLoading, setIsLoading] = useState(!hasInitialBootstrap);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const mountLoggedRef = useRef(false);
  const skippedInitialFetchRef = useRef(false);
  const initialListKeyRef = useRef(
    buildListKey(persona, tabStatus, "", TRADING_DEFAULT_PAGE_SIZE),
  );
  const initialPageRef = useRef(options.initialData?.meta?.page ?? 1);

  const debouncedQueryRef = useRef(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);
  const listKey = buildListKey(persona, tabStatus, debouncedQuery, pageSize);
  const isInitialListKey = listKey === initialListKeyRef.current;

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
  }, [persona, tabStatus, debouncedQuery, pageSize]);

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

      const result = await searchUserTradingOrders({
        persona,
        tabStatus,
        searchQuery: debouncedQuery.trim() || undefined,
        page,
        pageSize,
      });

      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
        setOrders([]);
        setPaginationMeta({ ...EMPTY_TRADING_PAGINATION_META, pageSize });
        setFilterCounts(EMPTY_TRADING_FILTER_COUNTS);
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
    persona,
    tabStatus,
    debouncedQuery,
    page,
    pageSize,
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
