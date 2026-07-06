"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  getCollectionEntries,
  getCollectionPortfolioSummary,
  removeFromCollection,
  updateCollectionGrade,
} from "@/app/actions/collection";
import type {
  CollectionEntriesPage,
  CollectionEntry,
  CollectionListFilter,
  CollectionPortfolioSummary,
} from "@/app/lib/collection/types";
import { COLLECTION_DEFAULT_PAGE_SIZE } from "@/lib/collection/constants";
import type { GradingOption } from "@/lib/grading/options";
import { wishlistGradeFromGradingOption } from "@/lib/wishlist/grading";

const SEARCH_DEBOUNCE_MS = 350;

export const COLLECTION_FILTER_LABELS: Record<string, CollectionListFilter> = {
  全部: "all",
  已鑑定: "graded",
  未鑑定: "raw",
  已上架: "listed",
};

type UseCollectionOptions = {
  filter?: CollectionListFilter;
  query?: string;
  page?: number;
  pageSize?: number;
};

type UseCollectionResult = {
  entries: CollectionEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: CollectionPortfolioSummary | null;
  isLoading: boolean;
  isSummaryLoading: boolean;
  error: string | null;
  refetch: () => void;
  setPage: (page: number) => void;
  removeEntry: (entry: CollectionEntry) => Promise<boolean>;
  updateGrade: (
    entry: CollectionEntry,
    option: GradingOption,
  ) => Promise<boolean>;
};

export function useCollection(options: UseCollectionOptions = {}): UseCollectionResult {
  const filter = options.filter ?? "all";
  const query = options.query ?? "";
  const pageSize = options.pageSize ?? COLLECTION_DEFAULT_PAGE_SIZE;

  const [entries, setEntries] = useState<CollectionEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [summary, setSummary] = useState<CollectionPortfolioSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [pageByListKey, setPageByListKey] = useState<Record<string, number>>({});

  const debouncedQueryRef = useRef(query);
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const listKey = `${filter}:${debouncedQuery}:${pageSize}`;
  const page = pageByListKey[listKey] ?? options.page ?? 1;

  const setPage = useCallback(
    (nextPage: number) => {
      setPageByListKey((current) => ({ ...current, [listKey]: nextPage }));
    },
    [listKey],
  );

  useEffect(() => {
    debouncedQueryRef.current = query;
    const timer = window.setTimeout(() => {
      setDebouncedQuery(debouncedQueryRef.current);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [query]);

  const refetch = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const applyPageResult = useCallback(
    (data: CollectionEntriesPage) => {
      setEntries(data.entries);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setPageByListKey((current) => {
        const existing = current[listKey] ?? 1;
        if (data.page === existing) {
          return current;
        }
        return { ...current, [listKey]: data.page };
      });
    },
    [listKey],
  );

  const refreshPage = useCallback(async (): Promise<boolean> => {
    const result = await getCollectionEntries({
      page,
      pageSize,
      filter,
      query: debouncedQuery,
    });

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return false;
    }

    applyPageResult(result.data);
    setError(null);
    return true;
  }, [page, pageSize, filter, debouncedQuery, applyPageResult]);

  const refreshSummary = useCallback(async (): Promise<boolean> => {
    const result = await getCollectionPortfolioSummary();
    if (!result.success) {
      setError(result.error);
      return false;
    }
    setSummary(result.data);
    return true;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsSummaryLoading(true);
      const result = await getCollectionPortfolioSummary();
      if (cancelled) return;

      if (!result.success) {
        setSummary(null);
        setError(result.error);
        setIsSummaryLoading(false);
        return;
      }

      setSummary(result.data);
      setIsSummaryLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      const result = await getCollectionEntries({
        page,
        pageSize,
        filter,
        query: debouncedQuery,
      });

      if (cancelled) return;

      if (!result.success) {
        setEntries([]);
        setTotal(0);
        setTotalPages(0);
        setError(result.error);
        setIsLoading(false);
        return;
      }

      applyPageResult(result.data);
      setError(null);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [page, pageSize, filter, debouncedQuery, reloadToken, applyPageResult]);

  const removeEntry = useCallback(
    async (entry: CollectionEntry) => {
      const result = await removeFromCollection({
        collectionId: entry.collectionId,
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return false;
      }

      setError(null);
      toast.success("已從資產庫移除");
      await Promise.all([refreshPage(), refreshSummary()]);
      return true;
    },
    [refreshPage, refreshSummary],
  );

  const updateGrade = useCallback(
    async (entry: CollectionEntry, option: GradingOption) => {
      const next = wishlistGradeFromGradingOption(option);
      if (
        next.gradingCompany === entry.gradingCompany &&
        next.gradingScore === entry.gradingScore
      ) {
        return true;
      }

      const result = await updateCollectionGrade({
        collectionId: entry.collectionId,
        nextGradingOptionId: option.id,
      });

      if (!result.success) {
        setError(result.error);
        toast.error(result.error);
        return false;
      }

      setError(null);
      await Promise.all([refreshPage(), refreshSummary()]);
      return true;
    },
    [refreshPage, refreshSummary],
  );

  return {
    entries,
    total,
    page,
    pageSize,
    totalPages,
    summary,
    isLoading,
    isSummaryLoading,
    error,
    refetch,
    setPage,
    removeEntry,
    updateGrade,
  };
}
