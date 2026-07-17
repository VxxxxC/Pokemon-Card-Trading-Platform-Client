"use client";

import { useMemo } from "react";
import type { Json } from "@/types/supabase";
import {
  getMainTitle,
  resolveMerchantReputationTagDisplay,
  type ActivityBadge,
  type TitleLevel,
} from "@/lib/constants/titles";
import {
  buildMerchantTitleStepperState,
  getMerchantTitleProgress,
  type MerchantTitleProgress,
  type MerchantTitleStepperItem,
} from "@/lib/titles/merchant-title-progress";

type UseMerchantTitleDisplayInput = {
  reputationTag: Json | null | undefined;
  completedTradesCount: number | null | undefined;
  ratingScore?: number | null;
};

type UseMerchantTitleDisplayResult = {
  mainTitle: TitleLevel | null;
  titleProgress: MerchantTitleProgress;
  stepper: MerchantTitleStepperItem[];
  activityBadges: ActivityBadge[];
};

export function useMerchantTitleDisplay(
  input: UseMerchantTitleDisplayInput,
): UseMerchantTitleDisplayResult {
  const completedTrades = input.completedTradesCount ?? 0;
  const ratingScore = input.ratingScore ?? undefined;

  return useMemo(() => {
    const resolved = resolveMerchantReputationTagDisplay(input.reputationTag);
    const mainTitle =
      resolved.merchantTitle ??
      getMainTitle(completedTrades, {
        isMerchant: true,
        rating: ratingScore,
        hasMerchantShop: true,
      });
    const titleProgress = getMerchantTitleProgress(completedTrades, ratingScore);
    const stepper = buildMerchantTitleStepperState(mainTitle?.level ?? null);

    return {
      mainTitle,
      titleProgress,
      stepper,
      activityBadges: resolved.activityBadges,
    };
  }, [input.reputationTag, completedTrades, ratingScore]);
}
