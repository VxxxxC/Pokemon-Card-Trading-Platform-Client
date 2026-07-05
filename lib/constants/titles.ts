/**
 * HKCardVault - 用戶與商戶稱號系統核心常量定義
 * 適用於前端 UI 渲染、Stitch AI 組件適配及 Edge Functions 晉升校驗
 *
 * DB contract: profiles.reputation_tag JSON (fn_recalculate_reputation_tags)
 *   { core_main_member: 1-4 | null, core_main_merchant: 1-4 | null, activity_badges: string[] }
 * Badge / level IDs must match SQL — update migration when changing rules here.
 */

/** Platform go-live; founding-member window = first 30 days after this (sync SQL migration). */
export const PLATFORM_LAUNCH_AT = '2026-07-01T00:00:00+08:00';

export interface TitleLevel {
  level: number;
  nameZh: string;
  nameEn: string;
  threshold: number;
  minRating?: number; // 僅賣家需要評分防禦
  badgeUrl: string;   // 託管於 bunny.net 的資產路徑
  styleClass: string; // Tailwind CSS 4 動態樣式
}

export interface ActivityBadge {
  id: string;
  nameZh: string;
  nameEn: string;
  category: 'longevity' | 'trust' | 'collection' | 'engagement';
  description: string;
  badgeUrl: string;
}

/** Cached payload written by fn_recalculate_reputation_tags */
export interface ReputationTagPayload {
  core_main_member: number | null;
  core_main_merchant: number | null;
  activity_badges: string[];
}

// 1. 買家／成員核心主稱號級別 (Member Main Titles)
export const MEMBER_TITLES: TitleLevel[] = [
  {
    level: 1,
    nameZh: '新晉收藏家',
    nameEn: 'Registered Collector',
    threshold: 1,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/member_l1.svg',
    styleClass: 'border-slate-400 text-slate-300 bg-slate-900/50'
  },
  {
    level: 2,
    nameZh: '白金級藏家',
    nameEn: 'Platinum Collector',
    threshold: 50,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/member_l2.svg',
    styleClass: 'border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.2)] bg-slate-900/50'
  },
  {
    level: 3,
    nameZh: '鑽石級貴賓',
    nameEn: 'Diamond VVIP',
    threshold: 200,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/member_l3.svg',
    styleClass: 'border-indigo-400 text-indigo-200 font-bold shadow-[0_0_15px_rgba(129,140,248,0.3)] bg-slate-900/50'
  },
  {
    level: 4,
    nameZh: '殿堂級終身藏家',
    nameEn: 'Hall of Fame Curator',
    threshold: 500,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/member_l4.svg',
    styleClass: 'border-amber-500 text-amber-200 font-extrabold animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-neutral-950'
  }
];

// 2. 賣家／商戶核心主稱號級別 (Merchant Main Titles)
export const MERCHANT_TITLES: TitleLevel[] = [
  {
    level: 1,
    nameZh: '認證新晉商戶',
    nameEn: 'Verified Seller',
    threshold: 1,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/merchant_l1.svg',
    styleClass: 'border-emerald-500 text-emerald-400'
  },
  {
    level: 2,
    nameZh: '優質星級商戶',
    nameEn: 'Premium Star Merchant',
    threshold: 50,
    minRating: 4.7,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/merchant_l2.svg',
    styleClass: 'border-zinc-300 text-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
  },
  {
    level: 3,
    nameZh: '金牌旗艦商戶',
    nameEn: 'Gold Flagship Merchant',
    threshold: 200,
    minRating: 4.85,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/merchant_l3.svg',
    styleClass: 'border-yellow-500 text-yellow-300 font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]'
  },
  {
    level: 4,
    nameZh: '殿堂級誠信商戶',
    nameEn: 'Trusted Legend Merchant',
    threshold: 500,
    minRating: 4.95,
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/merchant_l4.svg',
    styleClass: 'border-rose-500 text-rose-300 font-extrabold shadow-[0_0_25px_rgba(244,63,94,0.5)] bg-neutral-950'
  }
];

// 3. 通用次要活動徽章 (Universal Activity Badges)
export const ACTIVITY_BADGES: Record<string, ActivityBadge> = {
  FOUNDING_MEMBER: {
    id: 'FOUNDING_MEMBER',
    nameZh: '創始成員',
    nameEn: 'Founding Member',
    category: 'longevity',
    description: '帳戶建立於平台上線首 30 天內。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_founding.svg'
  },
  ANNUAL_VETERAN: {
    id: 'ANNUAL_VETERAN',
    nameZh: '年度見證者',
    nameEn: 'Annual Veteran',
    category: 'longevity',
    description: '帳戶建立日數大於或等於 365 天。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_veteran.svg'
  },
  FLAWLESS_REPUTATION: {
    id: 'FLAWLESS_REPUTATION',
    nameZh: '零負評至尊',
    nameEn: 'Flawless Reputation',
    category: 'trust',
    description: '累計收到交易好評大於或等於 50 個，且好評率為 100%。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_flawless.svg'
  },
  HIGHLY_RECOMMENDED: {
    id: 'HIGHLY_RECOMMENDED',
    nameZh: '信譽超卓',
    nameEn: 'Highly Recommended',
    category: 'trust',
    description: '獲取超過 100 個 5 星評價。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_recommended.svg'
  },
  CENTURY_CURATOR: {
    id: 'CENTURY_CURATOR',
    nameZh: '百卡持有人',
    nameEn: 'Century Curator',
    category: 'collection',
    description: '帳戶總收藏卡量大於或等於 100 張。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_cards_100.svg'
  },
  VOLUME_COLLECTOR: {
    id: 'VOLUME_COLLECTOR',
    nameZh: '千卡巨頭',
    nameEn: 'Volume Collector',
    category: 'collection',
    description: '帳戶總收藏卡量大於或等於 1,000 張。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_cards_1k.svg'
  },
  THE_VAULT_TYCOON: {
    id: 'THE_VAULT_TYCOON',
    nameZh: '萬卡大亨',
    nameEn: 'The Vault Tycoon',
    category: 'collection',
    description: '帳戶總收藏卡量大於或等於 10,000 張。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_cards_10k.svg'
  },
  DAILY_ACTIVE_ENTHUSIAST: {
    id: 'DAILY_ACTIVE_ENTHUSIAST',
    nameZh: '簽到達人',
    nameEn: 'Daily Active Enthusiast',
    category: 'engagement',
    description: '連續簽到日數大於或等於 30 天。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_streak_30.svg'
  },
  MARKET_PRICE_HUNTER: {
    id: 'MARKET_PRICE_HUNTER',
    nameZh: '出價獵人',
    nameEn: 'Market Price Hunter',
    category: 'engagement',
    description: '於股票式交易系統中，累計發起「即時出價」並成功撮合或進入隊列大於或等於 30 次。',
    badgeUrl: 'https://hkcardvault.b-cdn.net/assets/badges/badge_hunter.svg'
  }
};

export function getMemberTitleByLevel(level: number): TitleLevel | null {
  return MEMBER_TITLES.find((t) => t.level === level) ?? null;
}

export function getMerchantTitleByLevel(level: number): TitleLevel | null {
  return MERCHANT_TITLES.find((t) => t.level === level) ?? null;
}

export function getActivityBadgeById(id: string): ActivityBadge | null {
  return ACTIVITY_BADGES[id] ?? null;
}

export function parseReputationTagPayload(
  raw: unknown,
): ReputationTagPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const badges = o.activity_badges;
  if (!Array.isArray(badges)) return null;
  return {
    core_main_member:
      typeof o.core_main_member === 'number' ? o.core_main_member : null,
    core_main_merchant:
      typeof o.core_main_merchant === 'number' ? o.core_main_merchant : null,
    activity_badges: badges.filter((b): b is string => typeof b === 'string'),
  };
}

/** Resolve cached DB payload to display-ready title / badge objects */
export function resolveReputationTagDisplay(raw: unknown): {
  memberTitle: TitleLevel | null;
  merchantTitle: TitleLevel | null;
  activityBadges: ActivityBadge[];
} {
  const payload = parseReputationTagPayload(raw);
  if (!payload) {
    return { memberTitle: null, merchantTitle: null, activityBadges: [] };
  }
  return {
    memberTitle: payload.core_main_member
      ? getMemberTitleByLevel(payload.core_main_member)
      : null,
    merchantTitle: payload.core_main_merchant
      ? getMerchantTitleByLevel(payload.core_main_merchant)
      : null,
    activityBadges: payload.activity_badges
      .map((id) => getActivityBadgeById(id))
      .filter((b): b is ActivityBadge => b !== null),
  };
}

/**
 * Client-side preview: trade count + optional merchant rating gate.
 * Verified merchant with shop but 0 sales → pass hasMerchantShop for L1 baseline.
 */
export function getMainTitle(
  completedTrades: number,
  options: {
    isMerchant?: boolean;
    rating?: number;
    hasMerchantShop?: boolean;
  } = {},
): TitleLevel | null {
  const { isMerchant = false, rating, hasMerchantShop = false } = options;
  const titles = isMerchant ? MERCHANT_TITLES : MEMBER_TITLES;

  if (isMerchant && hasMerchantShop && completedTrades < 1) {
    return MERCHANT_TITLES[0];
  }

  for (let i = titles.length - 1; i >= 0; i--) {
    const t = titles[i];
    if (completedTrades >= t.threshold) {
      if (isMerchant && t.minRating != null && (rating ?? 0) < t.minRating) {
        continue;
      }
      return t;
    }
  }
  return null;
}
