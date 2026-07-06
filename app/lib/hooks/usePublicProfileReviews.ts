"use client";

import { useCallback, useEffect, useState } from "react";
import { getPublicProfileReviews } from "@/app/actions/reviews";
import type {
  PublicProfileReviewItem,
  ReviewPersona,
  ReviewSortKey,
} from "@/app/lib/reviews/types";

type UsePublicProfileReviewsOptions = {
  profileId: string;
  persona?: ReviewPersona;
  sort?: ReviewSortKey;
  page?: number;
  pageSize?: number;
};

type UsePublicProfileReviewsResult = {
  reviews: PublicProfileReviewItem[];
  aggregateRating: number;
  publicReviewCount: number;
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  isLoading: boolean;
  error: string | null;
  notFound: boolean;
  setPage: (page: number) => void;
  refetch: () => void;
};

export function usePublicProfileReviews(
  options: UsePublicProfileReviewsOptions,
): UsePublicProfileReviewsResult {
  const persona = options.persona ?? "member";
  const sort = options.sort ?? "date-desc";
  const pageSize = options.pageSize ?? 10;
  const listKey = `${options.profileId}:${persona}:${sort}:${pageSize}`;

  const [pageByListKey, setPageByListKey] = useState<Record<string, number>>({});
  const page = pageByListKey[listKey] ?? 1;

  const setPage = useCallback(
    (nextPage: number) => {
      setPageByListKey((current) => ({ ...current, [listKey]: nextPage }));
    },
    [listKey],
  );

  const [reviews, setReviews] = useState<PublicProfileReviewItem[]>([]);
  const [aggregateRating, setAggregateRating] = useState(0);
  const [publicReviewCount, setPublicReviewCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      setNotFound(false);

      const result = await getPublicProfileReviews({
        profileId: options.profileId,
        persona,
        sort,
        page,
        pageSize,
      });

      if (cancelled) {
        return;
      }

      if (!result.success) {
        setReviews([]);
        setAggregateRating(0);
        setPublicReviewCount(0);
        setTotalCount(0);
        setTotalPages(0);
        setError(result.error);
        setNotFound(result.notFound === true);
        setIsLoading(false);
        return;
      }

      setReviews(result.data.reviews);
      setAggregateRating(result.data.aggregateRating);
      setPublicReviewCount(result.data.publicReviewCount);
      setTotalCount(result.data.totalCount);
      setTotalPages(result.data.totalPages);
      setIsLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [
    options.profileId,
    persona,
    sort,
    page,
    pageSize,
    reloadToken,
  ]);

  const refetch = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  return {
    reviews,
    aggregateRating,
    publicReviewCount,
    totalCount,
    page,
    pageSize,
    totalPages,
    isLoading,
    error,
    notFound,
    setPage,
    refetch,
  };
}
