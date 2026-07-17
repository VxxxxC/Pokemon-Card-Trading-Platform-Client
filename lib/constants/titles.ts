/**
 * HKCardVault - 用戶與商戶稱號系統核心常量定義
 *
 * DB contract (split personas):
 *   profiles.reputation_tag           → { core_main_member, activity_badges }
 *   merchant_shops.reputation_tag     → { core_main_merchant, activity_badges }
 * Badge / level IDs must match SQL — update migration when changing rules here.
 */

import { badgeAssetUrl } from '@/lib/constants/badge-assets';

/** Platform go-live; founding window = first 30 days after this (sync SQL migration). */
export const PLATFORM_LAUNCH_AT = '2026-07-01T00:00:00+08:00';

export interface TitleLevel {
  level: number;
  nameZh: string;
  nameEn: string;
  threshold: number;
  minRating?: number;
  badgeUrl: string;
  styleClass: string;
}

export interface ActivityBadge {
  id: string;
  nameZh: string;
  nameEn: string;
  category: 'longevity' | 'trust' | 'collection' | 'engagement' | 'sales';
  description: string;
  badgeUrl: string;
}

export interface MemberReputationTagPayload {
  core_main_member: number | null;
  activity_badges: string[];
}

export interface MerchantReputationTagPayload {
  core_main_merchant: number | null;
  activity_badges: string[];
}

/** @deprecated Use MemberReputationTagPayload / MerchantReputationTagPayload */
export interface ReputationTagPayload {
  core_main_member: number | null;
  core_main_merchant: number | null;
  activity_badges: string[];
}

export const MEMBER_TITLES: TitleLevel[] = [
  {
    level: 1,
    nameZh: '新晉收藏家',
    nameEn: 'Registered Collector',
    threshold: 1,
    badgeUrl: badgeAssetUrl('member_l1.svg'),
    styleClass: 'border-slate-400 text-slate-300 bg-slate-900/50',
  },
  {
    level: 2,
    nameZh: '白金級藏家',
    nameEn: 'Platinum Collector',
    threshold: 50,
    badgeUrl: badgeAssetUrl('member_l2.svg'),
    styleClass: 'border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(34,211,238,0.2)] bg-slate-900/50',
  },
  {
    level: 3,
    nameZh: '鑽石級貴賓',
    nameEn: 'Diamond VVIP',
    threshold: 200,
    badgeUrl: badgeAssetUrl('member_l3.svg'),
    styleClass: 'border-indigo-400 text-indigo-200 font-bold shadow-[0_0_15px_rgba(129,140,248,0.3)] bg-slate-900/50',
  },
  {
    level: 4,
    nameZh: '殿堂級終身藏家',
    nameEn: 'Hall of Fame Curator',
    threshold: 500,
    badgeUrl: badgeAssetUrl('member_l4.svg'),
    styleClass: 'border-amber-500 text-amber-200 font-extrabold animate-pulse shadow-[0_0_20px_rgba(245,158,11,0.4)] bg-neutral-950',
  },
];

export const MERCHANT_TITLES: TitleLevel[] = [
  {
    level: 1,
    nameZh: '認證新晉商戶',
    nameEn: 'Verified Seller',
    threshold: 1,
    badgeUrl: badgeAssetUrl('merchant_l1.svg'),
    styleClass: 'border-emerald-500 text-emerald-400',
  },
  {
    level: 2,
    nameZh: '優質星級商戶',
    nameEn: 'Premium Star Merchant',
    threshold: 50,
    minRating: 4.7,
    badgeUrl: badgeAssetUrl('merchant_l2.svg'),
    styleClass: 'border-zinc-300 text-zinc-100 shadow-[0_0_10px_rgba(255,255,255,0.1)]',
  },
  {
    level: 3,
    nameZh: '金牌旗艦商戶',
    nameEn: 'Gold Flagship Merchant',
    threshold: 200,
    minRating: 4.85,
    badgeUrl: badgeAssetUrl('merchant_l3.svg'),
    styleClass: 'border-yellow-500 text-yellow-300 font-bold shadow-[0_0_15px_rgba(234,179,8,0.3)]',
  },
  {
    level: 4,
    nameZh: '殿堂級誠信商戶',
    nameEn: 'Trusted Legend Merchant',
    threshold: 500,
    minRating: 4.95,
    badgeUrl: badgeAssetUrl('merchant_l4.svg'),
    styleClass: 'border-rose-500 text-rose-300 font-extrabold shadow-[0_0_25px_rgba(244,63,94,0.5)] bg-neutral-950',
  },
];

export const MEMBER_ACTIVITY_BADGES: Record<string, ActivityBadge> = {
  FOUNDING_MEMBER: {
    id: 'FOUNDING_MEMBER',
    nameZh: '創始成員',
    nameEn: 'Founding Member',
    category: 'longevity',
    description: '帳戶建立於平台上線首 30 天內。',
    badgeUrl: badgeAssetUrl('badge_founding.svg'),
  },
  ANNUAL_VETERAN: {
    id: 'ANNUAL_VETERAN',
    nameZh: '年度見證者',
    nameEn: 'Annual Veteran',
    category: 'longevity',
    description: '帳戶建立日數大於或等於 365 天。',
    badgeUrl: badgeAssetUrl('badge_veteran.svg'),
  },
  FLAWLESS_REPUTATION: {
    id: 'FLAWLESS_REPUTATION',
    nameZh: '零負評至尊',
    nameEn: 'Flawless Reputation',
    category: 'trust',
    description: '累計收到會員身分交易好評大於或等於 50 個，且好評率為 100%。',
    badgeUrl: badgeAssetUrl('badge_flawless.svg'),
  },
  HIGHLY_RECOMMENDED: {
    id: 'HIGHLY_RECOMMENDED',
    nameZh: '信譽超卓',
    nameEn: 'Highly Recommended',
    category: 'trust',
    description: '獲取超過 100 個會員身分 5 星評價。',
    badgeUrl: badgeAssetUrl('badge_recommended.svg'),
  },
  CENTURY_CURATOR: {
    id: 'CENTURY_CURATOR',
    nameZh: '百卡持有人',
    nameEn: 'Century Curator',
    category: 'collection',
    description: '帳戶總收藏卡量大於或等於 100 張。',
    badgeUrl: badgeAssetUrl('badge_cards_100.svg'),
  },
  VOLUME_COLLECTOR: {
    id: 'VOLUME_COLLECTOR',
    nameZh: '千卡巨頭',
    nameEn: 'Volume Collector',
    category: 'collection',
    description: '帳戶總收藏卡量大於或等於 1,000 張。',
    badgeUrl: badgeAssetUrl('badge_cards_1k.svg'),
  },
  THE_VAULT_TYCOON: {
    id: 'THE_VAULT_TYCOON',
    nameZh: '萬卡大亨',
    nameEn: 'The Vault Tycoon',
    category: 'collection',
    description: '帳戶總收藏卡量大於或等於 10,000 張。',
    badgeUrl: badgeAssetUrl('badge_cards_10k.svg'),
  },
  DAILY_ACTIVE_ENTHUSIAST: {
    id: 'DAILY_ACTIVE_ENTHUSIAST',
    nameZh: '簽到達人',
    nameEn: 'Daily Active Enthusiast',
    category: 'engagement',
    description: '連續簽到日數大於或等於 30 天。',
    badgeUrl: badgeAssetUrl('badge_streak_30.svg'),
  },
  MARKET_PRICE_HUNTER: {
    id: 'MARKET_PRICE_HUNTER',
    nameZh: '出價獵人',
    nameEn: 'Market Price Hunter',
    category: 'engagement',
    description: '於股票式交易系統中，累計發起「即時出價」並成功撮合或進入隊列大於或等於 30 次。',
    badgeUrl: badgeAssetUrl('badge_hunter.svg'),
  },
};

export const MERCHANT_ACTIVITY_BADGES: Record<string, ActivityBadge> = {
  FOUNDING_MERCHANT: {
    id: 'FOUNDING_MERCHANT',
    nameZh: '創始商戶',
    nameEn: 'Founding Merchant',
    category: 'longevity',
    description: '店舖於平台上線首 30 天內完成認證。',
    badgeUrl: badgeAssetUrl('badge_merchant_founding.svg'),
  },
  SHOP_ANNUAL_VETERAN: {
    id: 'SHOP_ANNUAL_VETERAN',
    nameZh: '年度店舖',
    nameEn: 'Shop Annual Veteran',
    category: 'longevity',
    description: '店舖建立日數大於或等於 365 天。',
    badgeUrl: badgeAssetUrl('badge_merchant_veteran.svg'),
  },
  MERCHANT_FLAWLESS_REPUTATION: {
    id: 'MERCHANT_FLAWLESS_REPUTATION',
    nameZh: '零負評店舖',
    nameEn: 'Flawless Merchant',
    category: 'trust',
    description: '累計收到商戶身分交易好評大於或等於 50 個，且好評率為 100%。',
    badgeUrl: badgeAssetUrl('badge_merchant_flawless.svg'),
  },
  MERCHANT_HIGHLY_RECOMMENDED: {
    id: 'MERCHANT_HIGHLY_RECOMMENDED',
    nameZh: '信譽星級店',
    nameEn: 'Highly Recommended Shop',
    category: 'trust',
    description: '獲取超過 100 個商戶身分 5 星評價。',
    badgeUrl: badgeAssetUrl('badge_merchant_recommended.svg'),
  },
  MERCHANT_CENTURY_SELLER: {
    id: 'MERCHANT_CENTURY_SELLER',
    nameZh: '百單商戶',
    nameEn: 'Century Seller',
    category: 'sales',
    description: 'B2C 成交次數大於或等於 100 單。',
    badgeUrl: badgeAssetUrl('badge_merchant_sales_100.svg'),
  },
  MERCHANT_VOLUME_SELLER: {
    id: 'MERCHANT_VOLUME_SELLER',
    nameZh: '五百單旗艦',
    nameEn: 'Volume Seller',
    category: 'sales',
    description: 'B2C 成交次數大於或等於 500 單。',
    badgeUrl: badgeAssetUrl('badge_merchant_sales_500.svg'),
  },
  MERCHANT_ELITE_SELLER: {
    id: 'MERCHANT_ELITE_SELLER',
    nameZh: '千單傳奇店',
    nameEn: 'Elite Seller',
    category: 'sales',
    description: 'B2C 成交次數大於或等於 1,000 單。',
    badgeUrl: badgeAssetUrl('badge_merchant_sales_1k.svg'),
  },
};

/** @deprecated Use MEMBER_ACTIVITY_BADGES */
export const ACTIVITY_BADGES: Record<string, ActivityBadge> = MEMBER_ACTIVITY_BADGES;

export function getMemberTitleByLevel(level: number): TitleLevel | null {
  return MEMBER_TITLES.find((t) => t.level === level) ?? null;
}

export function getMerchantTitleByLevel(level: number): TitleLevel | null {
  return MERCHANT_TITLES.find((t) => t.level === level) ?? null;
}

export function getMemberActivityBadgeById(id: string): ActivityBadge | null {
  return MEMBER_ACTIVITY_BADGES[id] ?? null;
}

export function getMerchantActivityBadgeById(id: string): ActivityBadge | null {
  return MERCHANT_ACTIVITY_BADGES[id] ?? null;
}

export function getActivityBadgeById(id: string): ActivityBadge | null {
  return getMemberActivityBadgeById(id) ?? getMerchantActivityBadgeById(id);
}

function parseActivityBadgeIds(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((b): b is string => typeof b === 'string');
}

export function parseMemberReputationTagPayload(
  raw: unknown,
): MemberReputationTagPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const badges = parseActivityBadgeIds(o.activity_badges);
  if (!badges) return null;
  return {
    core_main_member:
      typeof o.core_main_member === 'number' ? o.core_main_member : null,
    activity_badges: badges,
  };
}

export function parseMerchantReputationTagPayload(
  raw: unknown,
): MerchantReputationTagPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const badges = parseActivityBadgeIds(o.activity_badges);
  if (!badges) return null;
  return {
    core_main_merchant:
      typeof o.core_main_merchant === 'number' ? o.core_main_merchant : null,
    activity_badges: badges,
  };
}

/** @deprecated Use parseMemberReputationTagPayload / parseMerchantReputationTagPayload */
export function parseReputationTagPayload(
  raw: unknown,
): ReputationTagPayload | null {
  const member = parseMemberReputationTagPayload(raw);
  const merchant = parseMerchantReputationTagPayload(raw);
  if (!member && !merchant) return null;
  return {
    core_main_member: member?.core_main_member ?? null,
    core_main_merchant: merchant?.core_main_merchant ?? null,
    activity_badges: member?.activity_badges ?? merchant?.activity_badges ?? [],
  };
}

export function resolveMemberReputationTagDisplay(raw: unknown): {
  memberTitle: TitleLevel | null;
  activityBadges: ActivityBadge[];
} {
  const payload = parseMemberReputationTagPayload(raw);
  if (!payload) {
    return { memberTitle: null, activityBadges: [] };
  }
  return {
    memberTitle: payload.core_main_member
      ? getMemberTitleByLevel(payload.core_main_member)
      : null,
    activityBadges: payload.activity_badges
      .map((id) => getMemberActivityBadgeById(id))
      .filter((b): b is ActivityBadge => b !== null),
  };
}

export function resolveMerchantReputationTagDisplay(raw: unknown): {
  merchantTitle: TitleLevel | null;
  activityBadges: ActivityBadge[];
} {
  const payload = parseMerchantReputationTagPayload(raw);
  if (!payload) {
    return { merchantTitle: null, activityBadges: [] };
  }
  return {
    merchantTitle: payload.core_main_merchant
      ? getMerchantTitleByLevel(payload.core_main_merchant)
      : null,
    activityBadges: payload.activity_badges
      .map((id) => getMerchantActivityBadgeById(id))
      .filter((b): b is ActivityBadge => b !== null),
  };
}

/** @deprecated Prefer resolveMemberReputationTagDisplay / resolveMerchantReputationTagDisplay */
export function resolveReputationTagDisplay(raw: unknown): {
  memberTitle: TitleLevel | null;
  merchantTitle: TitleLevel | null;
  activityBadges: ActivityBadge[];
} {
  const member = resolveMemberReputationTagDisplay(raw);
  const merchant = resolveMerchantReputationTagDisplay(raw);
  return {
    memberTitle: member.memberTitle,
    merchantTitle: merchant.merchantTitle,
    activityBadges: [
      ...member.activityBadges,
      ...merchant.activityBadges.filter(
        (badge) => !member.activityBadges.some((m) => m.id === badge.id),
      ),
    ],
  };
}

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
