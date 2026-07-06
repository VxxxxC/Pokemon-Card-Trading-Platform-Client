"use client";

import { useMemo } from "react";
import type { Json } from "@/types/supabase";
import {
  getMainTitle,
  resolveReputationTagDisplay,
  type ActivityBadge,
  type TitleLevel,
} from "@/lib/constants/titles";
import {
  buildMemberTitleStepperState,
  getMemberTitleProgress,
  type MemberTitleProgress,
  type MemberTitleStepperItem,
} from "@/lib/titles/member-title-progress";

type UseMemberTitleDisplayInput = {
  reputationTag: Json | null | undefined;
  completedTradesCount: number | null | undefined;
};

type UseMemberTitleDisplayResult = {
  mainTitle: TitleLevel | null;
  titleProgress: MemberTitleProgress;
  stepper: MemberTitleStepperItem[];
  activityBadges: ActivityBadge[];
};

export function useMemberTitleDisplay(
  input: UseMemberTitleDisplayInput,
): UseMemberTitleDisplayResult {
  const completedTrades = input.completedTradesCount ?? 0;

  return useMemo(() => {
    const resolved = resolveReputationTagDisplay(input.reputationTag);
    const mainTitle =
      resolved.memberTitle ?? getMainTitle(completedTrades);
    const titleProgress = getMemberTitleProgress(completedTrades);
    const stepper = buildMemberTitleStepperState(mainTitle?.level ?? null);

    return {
      mainTitle,
      titleProgress,
      stepper,
      activityBadges: resolved.activityBadges,
    };
  }, [input.reputationTag, completedTrades]);
}
