"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { searchMarketplaceProducts } from "@/app/actions/marketplace";
import type { MarketplaceProductRow } from "@/app/lib/marketplace/types";

const DEFAULT_DEBOUNCE_MS = 350;
const DEFAULT_MIN_LENGTH = 2;
const RESULT_LIMIT = 8;
const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  data: MarketplaceProductRow[];
  total: number;
  expiresAt: number;
};

type UseHeroMarketplaceSearchOptions = {
  debounceMs?: number;
  minLength?: number;
  enabled?: boolean;
};

export function useHeroMarketplaceSearch(
  options: UseHeroMarketplaceSearchOptions = {},
) {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minLength = DEFAULT_MIN_LENGTH,
    enabled = true,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MarketplaceProductRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map<string, CacheEntry>());

  const runSearch = useCallback(
    async (rawQuery: string) => {
      const trimmed = rawQuery.trim();

      if (!enabled) return;
      if (trimmed.length < minLength) {
        setResults([]);
        setTotal(0);
        setError(null);
        setIsSearching(false);
        return;
      }

      const cacheKey = trimmed.toLowerCase();
      const cached = cacheRef.current.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setResults(cached.data);
        setTotal(cached.total);
        setError(null);
        setIsSearching(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsSearching(true);
      setError(null);

      const result = await searchMarketplaceProducts({
        query: trimmed,
        page: 1,
        pageSize: RESULT_LIMIT,
        sortKey: "最新",
      });

      if (requestId !== requestIdRef.current) return;

      if (!result.success) {
        setResults([]);
        setTotal(0);
        setError(result.error);
        setIsSearching(false);
        return;
      }

      cacheRef.current.set(cacheKey, {
        data: result.data,
        total: result.meta.total,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      setResults(result.data);
      setTotal(result.meta.total);
      setIsSearching(false);
    },
    [enabled, minLength],
  );

  const searchNow = useCallback(() => {
    void runSearch(query);
  }, [query, runSearch]);

  const updateQuery = useCallback((value: string) => {
    setQuery(value);
    setIsDropdownOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const trimmed = query.trim();
    if (trimmed.length < minLength) {
      setResults([]);
      setTotal(0);
      setError(null);
      setIsSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [query, enabled, debounceMs, minLength, runSearch]);

  return {
    query,
    setQuery: updateQuery,
    results,
    total,
    isSearching,
    error,
    isDropdownOpen,
    closeDropdown,
    searchNow,
    hasMore: total > RESULT_LIMIT,
  };
}
