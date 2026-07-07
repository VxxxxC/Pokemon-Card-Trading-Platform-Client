"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getMarketplaceProductMarketPrices } from "@/app/actions/marketplace";
import type {
  MarketplaceMarketPrice,
  MarketplaceMarketPriceGradeRow,
} from "@/app/lib/marketplace/types";
import { pickDefaultMarketPriceGradeKey } from "@/lib/marketplace/market-price";

const EMPTY_MARKET_PRICE: MarketplaceMarketPrice = {
  marketAvgPrice: null,
  marketTrend30d: null,
  chartPoints: [],
};

export type MarketplaceProductMarketPriceFilters = {
  productId: string;
};

export type MarketplaceProductMarketPriceInitialData = {
  grades: MarketplaceMarketPriceGradeRow[];
};

type UseMarketplaceProductMarketPriceOptions = {
  initialData?: MarketplaceProductMarketPriceInitialData;
};

type UseMarketplaceProductMarketPriceResult = {
  availableGrades: Pick<MarketplaceMarketPriceGradeRow, "gradeKey" | "label">[];
  selectedGradeKey: string | null;
  setSelectedGradeKey: (gradeKey: string) => void;
  marketPrice: MarketplaceMarketPrice;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  refetch: () => void;
};

export function useMarketplaceProductMarketPrice(
  filters: MarketplaceProductMarketPriceFilters,
  options: UseMarketplaceProductMarketPriceOptions = {},
): UseMarketplaceProductMarketPriceResult {
  const { initialData } = options;
  const hasInitialData = initialData !== undefined;

  const [availableGrades, setAvailableGrades] = useState<
    MarketplaceMarketPriceGradeRow[]
  >(initialData?.grades ?? []);
  const [selectedGradeKey, setSelectedGradeKey] = useState<string | null>(() => {
    if (!initialData?.grades.length) return null;
    return pickDefaultMarketPriceGradeKey(
      initialData.grades.map((grade) => grade.gradeKey),
    );
  });
  const [isFetching, setIsFetching] = useState(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const requestIdRef = useRef(0);
  const productIdRef = useRef(filters.productId);
  const skipNextFetchRef = useRef(hasInitialData);
  const initialProductIdRef = useRef(
    hasInitialData ? filters.productId : null,
  );
  const productId = filters.productId;

  productIdRef.current = productId;

  const runMarketPricesFetch = useCallback(async (requestId: number) => {
    try {
      const result = await getMarketplaceProductMarketPrices(
        productIdRef.current,
      );

      if (requestId !== requestIdRef.current) return;

      if (!result.success) {
        setAvailableGrades([]);
        setSelectedGradeKey(null);
        setError(result.error);
        return;
      }

      setAvailableGrades(result.data);
      setSelectedGradeKey((current) => {
        if (current && result.data.some((grade) => grade.gradeKey === current)) {
          return current;
        }
        return pickDefaultMarketPriceGradeKey(
          result.data.map((grade) => grade.gradeKey),
        );
      });
      setError(null);
    } catch {
      if (requestId !== requestIdRef.current) return;
      setAvailableGrades([]);
      setSelectedGradeKey(null);
      setError("無法連線至大盤市場");
    } finally {
      if (requestId === requestIdRef.current) {
        setIsFetching(false);
      }
    }
  }, []);

  useEffect(() => {
    if (
      skipNextFetchRef.current &&
      initialProductIdRef.current === productId
    ) {
      skipNextFetchRef.current = false;
      return;
    }

    const requestId = ++requestIdRef.current;

    setIsFetching(true);
    setError(null);
    void runMarketPricesFetch(requestId);
  }, [productId, runMarketPricesFetch]);

  const refetch = useCallback(() => {
    const requestId = ++requestIdRef.current;

    setIsFetching(true);
    setError(null);
    void runMarketPricesFetch(requestId);
  }, [runMarketPricesFetch]);

  const isLoading = isFetching && availableGrades.length === 0;

  const selectedGrade =
    availableGrades.find((grade) => grade.gradeKey === selectedGradeKey) ?? null;

  const marketPrice: MarketplaceMarketPrice = selectedGrade
    ? {
        marketAvgPrice: selectedGrade.marketAvgPrice,
        marketTrend30d: selectedGrade.marketTrend30d,
        chartPoints: selectedGrade.chartPoints,
      }
    : EMPTY_MARKET_PRICE;

  return {
    availableGrades: availableGrades.map((grade) => ({
      gradeKey: grade.gradeKey,
      label: grade.label,
    })),
    selectedGradeKey,
    setSelectedGradeKey,
    marketPrice,
    isLoading,
    isRefreshing: isFetching && availableGrades.length > 0,
    error,
    refetch,
  };
}
