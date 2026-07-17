import {
  getMainTitle,
  MERCHANT_TITLES,
  type TitleLevel,
} from "@/lib/constants/titles";

export type MerchantTitleProgress = {
  currentTitle: TitleLevel | null;
  nextTitle: TitleLevel | null;
  completedTrades: number;
  progressPercent: number;
  progressLabel: string;
  nextTitleName: string | null;
};

export type MerchantTitleStepperItem = {
  tier: number;
  label: string;
  badgeUrl: string;
  isActive: boolean;
  isDone: boolean;
};

function resolveMerchantMainTitle(
  completedTrades: number,
  ratingScore?: number | null,
): TitleLevel | null {
  return getMainTitle(completedTrades, {
    isMerchant: true,
    rating: ratingScore ?? undefined,
    hasMerchantShop: true,
  });
}

export function getMerchantTitleProgress(
  completedTrades: number,
  ratingScore?: number | null,
): MerchantTitleProgress {
  const safeCount = Math.max(0, Math.floor(completedTrades));
  const currentTitle = resolveMerchantMainTitle(safeCount, ratingScore);
  const maxTitle = MERCHANT_TITLES[MERCHANT_TITLES.length - 1];

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
      ? MERCHANT_TITLES[0]
      : (MERCHANT_TITLES.find((title) => title.level === currentTitle.level + 1) ??
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

export function buildMerchantTitleStepperState(
  currentLevel: number | null,
): MerchantTitleStepperItem[] {
  return MERCHANT_TITLES.map((title) => ({
    tier: title.level,
    label: title.nameZh,
    badgeUrl: title.badgeUrl,
    isActive: currentLevel != null && title.level === currentLevel,
    isDone: currentLevel != null && title.level < currentLevel,
  }));
}
