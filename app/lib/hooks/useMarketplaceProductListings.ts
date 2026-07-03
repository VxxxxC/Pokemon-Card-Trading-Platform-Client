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

type UseMarketplaceProductListingsResult = {
  listings: MarketplaceProductListingRow[];
  meta: MarketplacePaginationMeta;
  lowestPrice: number | null;
  isLoading: boolean;
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
): UseMarketplaceProductListingsResult {
  const [listings, setListings] = useState<MarketplaceProductListingRow[]>([]);
  const [meta, setMeta] = useState<MarketplacePaginationMeta>(EMPTY_META);
  const [lowestPrice, setLowestPrice] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchListings = useCallback(async () => {
    const current = filtersRef.current;
    const requestId = ++requestIdRef.current;

    setIsLoading(true);
    setError(null);

    const gradeFilters = buildProductListingGradeFilters(
      current.selectedGradeFilterId,
    );
    const onlyGraded =
      current.selectedGradeFilterId === "ALL" ? current.onlyGraded : false;

    const result = await getMarketplaceProductListings({
      productId: current.productId,
      sort: current.sort,
      onlyGraded,
      gradeFilters,
      page: current.page,
      pageSize: current.pageSize,
    });

    if (requestId !== requestIdRef.current) return;

    if (!result.success) {
      setListings([]);
      setMeta(EMPTY_META);
      setLowestPrice(null);
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setListings(result.data);
    setMeta(result.meta);
    setLowestPrice(result.lowestPrice);
    setError(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchListings();
  }, [fetchListings, filtersKey(filters)]);

  return {
    listings,
    meta,
    lowestPrice,
    isLoading,
    error,
    refetch: fetchListings,
  };
}
