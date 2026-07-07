"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getWishlistEntries,
  removeFromWishlist,
  updateWishlistGrade,
  updateWishlistTarget,
} from "@/app/actions/wishlist";
import type { WishlistEntry } from "@/app/lib/wishlist/types";
import type { GradingOption } from "@/lib/grading/options";
import { wishlistGradeFromGradingOption } from "@/lib/wishlist/grading";

type UseWishlistOptions = {
  deferLoad?: boolean;
  initialEntries?: WishlistEntry[];
};

type UseWishlistResult = {
  entries: WishlistEntry[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  removeEntry: (entry: WishlistEntry) => Promise<boolean>;
  updateTargetPrice: (
    entry: WishlistEntry,
    targetPrice: number | null,
  ) => Promise<boolean>;
  updateGrade: (
    entry: WishlistEntry,
    option: GradingOption,
  ) => Promise<boolean>;
};

export function useWishlist(options: UseWishlistOptions = {}): UseWishlistResult {
  const { deferLoad = false, initialEntries } = options;
  const hasInitialEntries = initialEntries !== undefined;

  const [entries, setEntries] = useState<WishlistEntry[]>(initialEntries ?? []);
  const [isLoading, setIsLoading] = useState(!hasInitialEntries && !deferLoad);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const refetch = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const refreshEntries = useCallback(async (): Promise<boolean> => {
    const result = await getWishlistEntries();
    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return false;
    }
    setEntries(result.data);
    setError(null);
    return true;
  }, []);

  useEffect(() => {
    if (hasInitialEntries && reloadToken === 0) {
      return;
    }

    let cancelled = false;

    const runLoad = async () => {
      setIsLoading(true);
      const result = await getWishlistEntries();

      if (cancelled) return;

      if (!result.success) {
        setEntries([]);
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setEntries(result.data);
      setError(null);
      setIsLoading(false);
    };

    if (deferLoad && reloadToken === 0) {
      if (typeof window.requestIdleCallback === "function") {
        const id = window.requestIdleCallback(() => void runLoad(), {
          timeout: 2000,
        });
        return () => {
          cancelled = true;
          window.cancelIdleCallback(id);
        };
      }

      const timer = window.setTimeout(() => void runLoad(), 1500);
      return () => {
        cancelled = true;
        window.clearTimeout(timer);
      };
    }

    void runLoad();

    return () => {
      cancelled = true;
    };
  }, [reloadToken, deferLoad, hasInitialEntries]);

  const removeEntry = useCallback(async (entry: WishlistEntry) => {
    const result = await removeFromWishlist({
      productId: entry.productId,
      gradingCompany: entry.gradingCompany,
      gradingScore: entry.gradingScore,
    });

    if (!result.success) {
      setError(result.error);
      toast.error(result.error);
      return false;
    }

    setEntries((current) =>
      current.filter(
        (row) =>
          !(
            row.productId === entry.productId &&
            row.gradingCompany === entry.gradingCompany &&
            row.gradingScore === entry.gradingScore
          ),
      ),
    );
    setError(null);
    toast.success("已從願望清單移除");
    return true;
  }, []);

  const updateTargetPrice = useCallback(
    async (entry: WishlistEntry, targetPrice: number | null) => {
      const result = await updateWishlistTarget({
        productId: entry.productId,
        gradingCompany: entry.gradingCompany,
        gradingScore: entry.gradingScore,
        targetPrice,
      });

      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      toast.success(
        targetPrice == null ? "已清除目標價" : "目標價已更新",
      );
      await refreshEntries();
      return true;
    },
    [refreshEntries],
  );

  const updateGrade = useCallback(
    async (entry: WishlistEntry, option: GradingOption) => {
      const next = wishlistGradeFromGradingOption(option);
      const result = await updateWishlistGrade({
        productId: entry.productId,
        gradingCompany: entry.gradingCompany,
        gradingScore: entry.gradingScore,
        nextGradingCompany: next.gradingCompany,
        nextGradingScore: next.gradingScore,
      });

      if (!result.success) {
        toast.error(result.error);
        return false;
      }

      const refreshed = await refreshEntries();
      if (refreshed) {
        toast.success("追蹤規格已更新");
      }
      return refreshed;
    },
    [refreshEntries],
  );

  return {
    entries,
    isLoading,
    error,
    refetch,
    removeEntry,
    updateTargetPrice,
    updateGrade,
  };
}
