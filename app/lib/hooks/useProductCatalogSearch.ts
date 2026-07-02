"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  searchProductCatalog,
  type ProductCatalogSuggestion,
} from "@/app/actions/productCatalog";

const DEFAULT_DEBOUNCE_MS = 350;
const DEFAULT_MIN_LENGTH = 2;
const CACHE_TTL_MS = 60_000;

type CacheEntry = {
  data: ProductCatalogSuggestion[];
  total: number;
  hasMore: boolean;
  expiresAt: number;
};

type UseProductCatalogSearchOptions = {
  debounceMs?: number;
  minLength?: number;
  enabled?: boolean;
};

export function useProductCatalogSearch(
  itemType: "card" | "box_set",
  options: UseProductCatalogSearchOptions = {},
) {
  const {
    debounceMs = DEFAULT_DEBOUNCE_MS,
    minLength = DEFAULT_MIN_LENGTH,
    enabled = true,
  } = options;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductCatalogSuggestion[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProductCatalogSuggestion | null>(
    null,
  );

  const requestIdRef = useRef(0);
  const cacheRef = useRef(new Map<string, CacheEntry>());
  const skipNextSearchRef = useRef(false);

  const runSearch = useCallback(
    async (rawQuery: string) => {
      const trimmed = rawQuery.trim();

      if (!enabled) return;
      if (trimmed.length < minLength) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setError(null);
        setIsSearching(false);
        return;
      }

      const cacheKey = `${itemType}:${trimmed.toLowerCase()}`;
      const cached = cacheRef.current.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        setResults(cached.data);
        setTotal(cached.total);
        setHasMore(cached.hasMore);
        setError(null);
        setIsSearching(false);
        return;
      }

      const requestId = ++requestIdRef.current;
      setIsSearching(true);
      setError(null);

      const result = await searchProductCatalog(trimmed, itemType);

      if (requestId !== requestIdRef.current) return;

      if (!result.success) {
        setResults([]);
        setTotal(0);
        setHasMore(false);
        setError(result.error);
        setIsSearching(false);
        return;
      }

      cacheRef.current.set(cacheKey, {
        data: result.data,
        total: result.total,
        hasMore: result.hasMore,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      setResults(result.data);
      setTotal(result.total);
      setHasMore(result.hasMore);
      setIsSearching(false);
    },
    [enabled, itemType, minLength],
  );

  const searchNow = useCallback(() => {
    void runSearch(query);
  }, [query, runSearch]);

  const updateQuery = useCallback((value: string) => {
    setSelected(null);
    setQuery(value);
  }, []);

  const clearSearch = useCallback(() => {
    requestIdRef.current += 1;
    setQuery("");
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setError(null);
    setSelected(null);
    setIsSearching(false);
  }, []);

  const selectSuggestion = useCallback(
    (suggestion: ProductCatalogSuggestion) => {
      skipNextSearchRef.current = true;
      setSelected(suggestion);
      setQuery(suggestion.displayId ?? suggestion.cardNumber ?? suggestion.name);
      setResults([]);
      setError(null);
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;

    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < minLength) {
      setResults([]);
      setTotal(0);
      setHasMore(false);
      setError(null);
      setIsSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(trimmed);
    }, debounceMs);

    return () => window.clearTimeout(timer);
  }, [query, enabled, debounceMs, minLength, runSearch]);

  useEffect(() => {
    requestIdRef.current += 1;
    setResults([]);
    setTotal(0);
    setHasMore(false);
    setError(null);
    setSelected(null);
  }, [itemType]);

  return {
    query,
    setQuery: updateQuery,
    results,
    total,
    hasMore,
    isSearching,
    error,
    selected,
    selectSuggestion,
    searchNow,
    clearSearch,
  };
}
