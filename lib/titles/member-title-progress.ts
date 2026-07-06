import {
  getMainTitle,
  MEMBER_TITLES,
  type TitleLevel,
} from "@/lib/constants/titles";

export type MemberTitleProgress = {
  currentTitle: TitleLevel | null;
  nextTitle: TitleLevel | null;
  completedTrades: number;
  progressPercent: number;
  progressLabel: string;
  nextTitleName: string | null;
};

export type MemberTitleStepperItem = {
  tier: number;
  label: string;
  badgeUrl: string;
  isActive: boolean;
  isDone: boolean;
};

export function getMemberTitleProgress(completedTrades: number): MemberTitleProgress {
  const safeCount = Math.max(0, Math.floor(completedTrades));
  const currentTitle = getMainTitle(safeCount);
  const maxTitle = MEMBER_TITLES[MEMBER_TITLES.length - 1];

  if (currentTitle && currentTitle.level >= maxTitle.level) {
    return {
      currentTitle,
      nextTitle: null,
      completedTrades: safeCount,
      progressPercent: 100,
      progressLabel: `${safeCount.toLocaleString("en-HK")} 筆交易`,
      nextTitleName: null,
    };
  }

  const nextTitle =
    currentTitle == null
      ? MEMBER_TITLES[0]
      : (MEMBER_TITLES.find((title) => title.level === currentTitle.level + 1) ??
        null);

  const currentThreshold = currentTitle?.threshold ?? 0;
  const nextThreshold = nextTitle?.threshold ?? currentThreshold;

  const span = Math.max(1, nextThreshold - currentThreshold);
  const progressPercent = Math.min(
    100,
    Math.max(0, ((safeCount - currentThreshold) / span) * 100),
  );

  return {
    currentTitle,
    nextTitle,
    completedTrades: safeCount,
    progressPercent,
    progressLabel: `${safeCount.toLocaleString("en-HK")} / ${nextThreshold.toLocaleString("en-HK")} 筆交易`,
    nextTitleName: nextTitle?.nameZh ?? null,
  };
}

export function buildMemberTitleStepperState(
  currentLevel: number | null,
): MemberTitleStepperItem[] {
  return MEMBER_TITLES.map((title) => ({
    tier: title.level,
    label: title.nameZh,
    badgeUrl: title.badgeUrl,
    isActive: currentLevel != null && title.level === currentLevel,
    isDone: currentLevel != null && title.level < currentLevel,
  }));
}
