/**
 * HKCardVault — Commerce / listing extension contract (V2-ready)
 *
 * Live DB today:
 *   listings.product_id → product_catalog.type
 *   Box / gift: booster_box | gift_set | booster_pack | starter_deck (via catalog)
 *
 * Lucky bag (福袋) V2: paid listing + bundle fulfillment — NOT reward_templates.
 * See docs/dev/follow-up/lucky-bag-listings-v2/backend.md
 */

import type { Database } from '@/types/supabase';

/** Current product_catalog.type values (types/supabase.ts) */
export type CatalogType = Database['public']['Enums']['catalog_type'];

export const CATALOG_TYPE_LABELS: Record<CatalogType, string> = {
  single_card: '單卡',
  booster_pack: '補充包',
  booster_box: '盒裝',
  gift_set: '禮盒裝',
  starter_deck: '預組牌組',
  accessories: '周邊配件',
};

/** UI grouping: single-card vs sealed product search (productCatalog.ts) */
export const CATALOG_TYPES_CARD: CatalogType[] = ['single_card'];
export const CATALOG_TYPES_BOX_SET: CatalogType[] = [
  'booster_box',
  'gift_set',
  'booster_pack',
  'starter_deck',
];

/**
 * V2 — add to catalog_type enum via migration:
 *   ALTER TYPE catalog_type ADD VALUE 'lucky_bag';
 */
export const CATALOG_TYPE_LUCKY_BAG_V2 = 'lucky_bag' as const;

/**
 * V2 — add to listings via migration (default 'standard' for all existing rows):
 *   listing_kind listing_kind NOT NULL DEFAULT 'standard'
 */
export const LISTING_KIND_V2 = {
  STANDARD: 'standard',
  LUCKY_BAG: 'lucky_bag',
} as const;

export type ListingKindV2 =
  (typeof LISTING_KIND_V2)[keyof typeof LISTING_KIND_V2];

/**
 * V2 optional JSON on listings.bundle_config when listing_kind = lucky_bag.
 * Contents pool lives in lucky_bag_pools table (separate migration).
 */
export interface LuckyBagBundleConfigV2 {
  poolId: string;
  revealMode: 'instant' | 'manual_open';
  guaranteedSlots?: number;
}

/** Reward templates remain platform grants only — do not model福袋 SKUs here. */
export const COMMERCE_VS_REWARDS = {
  listings: 'paid_sku_including_lucky_bag_v2',
  rewardTemplates: 'free_grants_points_coupons_tickets',
} as const;
