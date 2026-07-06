"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getUserInventoryGroups,
  getUserInventorySummary,
} from "@/app/actions/inventory";
import type {
  InventoryProductGroup,
  InventorySummary,
} from "@/app/lib/inventory/types";
import { INVENTORY_DEFAULT_PAGE_SIZE } from "@/lib/listings/constants";

const SEARCH_DEBOUNCE_MS = 350;

type UseInventoryOptions = {
  query?: string;
  page?: number;
  pageSize?: number;
};

type UseInventoryResult = {
  groups: InventoryProductGroup[];
  totalGroups: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: InventorySummary | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
};

export function useInventory(options: UseInventoryOptions = {}): UseInventoryResult {
  const query = options.query ?? "";
  const pageSize = options.pageSize ?? INVENTORY_DEFAULT_PAGE_SIZE;

  const [page, setPage] = useState(options.page ?? 1);
  const [groups, setGroups] = useState<InventoryProductGroup[]>([]);
  const [totalGroups, setTotalGroups] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const debouncedQueryRef = useRef(query);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  useEffect(() => {
    debouncedQueryRef.current = query;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(debouncedQueryRef.current);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    queueMicrotask(() => setPage(1));
  }, [debouncedQuery, pageSize]);

  const refetch = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      refetch();
    };

    window.addEventListener("inventory-should-refresh", handleRefresh);
    return () => {
      window.removeEventListener("inventory-should-refresh", handleRefresh);
    };
  }, [refetch]);

  useEffect(() => {
    let cancelled = false;

    const loadSummary = async () => {
      setIsSummaryLoading(true);
      const result = await getUserInventorySummary();
      if (cancelled) return;

      if (!result.success) {
        setSummary(null);
        setIsSummaryLoading(false);
        return;
      }

      setSummary(result.data);
      setIsSummaryLoading(false);
    };

    void loadSummary();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;

    const loadGroups = async () => {
      setIsLoading(true);
      setError(null);

      const result = await getUserInventoryGroups({
        page,
        pageSize,
        query: debouncedQuery,
      });

      if (cancelled) return;

      if (!result.success) {
        setError(result.error);
        setGroups([]);
        setTotalGroups(0);
        setTotalPages(0);
        setIsLoading(false);
        toast.error(result.error);
        return;
      }

      setGroups(result.data.groups);
      setTotalGroups(result.data.totalGroups);
      setTotalPages(result.data.totalPages);
      setPage(result.data.page);
      setIsLoading(false);
    };

    void loadGroups();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, debouncedQuery, reloadToken]);

  return {
    groups,
    totalGroups,
    page,
    pageSize,
    totalPages,
    summary,
    isLoading,
    isSummaryLoading,
    error,
    refetch,
    setPage,
  };
}
