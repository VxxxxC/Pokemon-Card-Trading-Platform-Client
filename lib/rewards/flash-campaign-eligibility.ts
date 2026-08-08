/**
 * Pure TS mirror of the flash-campaign claim decision rules implemented in
 * `public.rpc_claim_flash_reward` (see
 * supabase/migrations/20260817120000_reward_flash_campaigns.sql).
 *
 * Only deterministic decision rules are mirrored here (status, time window,
 * stock, per-user daily limit). Row-level locking (`FOR UPDATE`) and true
 * concurrent-claim races are NOT covered by this module or its unit tests —
 * those require the DB integration suite.
 */

export type RewardCampaignStatus = "draft" | "active" | "paused" | "ended";

export type FlashCampaignClaimInput = {
  status: RewardCampaignStatus;
  startsAt: Date;
  endsAt: Date;
  maxClaims: number;
  claimedCount: number;
  maxClaimsPerUser: number;
  /** Number of claims this user already made today (HKT day bucket). */
  userClaimsToday: number;
  now: Date;
};

export type FlashCampaignClaimResult =
  | { eligible: true; reason: null }
  | { eligible: false; reason: string };

/** Mirrors SQL RAISE EXCEPTION text exactly. Do not paraphrase. */
export const FLASH_CLAIM_REASONS = {
  NOT_ACTIVE: "活動尚未開放或已暫停",
  NOT_STARTED: "活動尚未開始",
  ENDED: "活動已結束",
  SOLD_OUT: "優惠券已被搶光",
  DAILY_LIMIT: "你已達今日搶券上限",
} as const;

/**
 * Mirrors the exact check ordering in rpc_claim_flash_reward:
 * 1. status must be 'active'
 * 2. now must be >= starts_at (now < starts_at rejected)
 * 3. now must be < ends_at (now >= ends_at rejected)
 * 4. claimed_count must be < max_claims
 * 5. user_claims_today must be < max_claims_per_user
 */
export function evaluateFlashCampaignClaim(
  input: FlashCampaignClaimInput,
): FlashCampaignClaimResult {
  if (input.status !== "active") {
    return { eligible: false, reason: FLASH_CLAIM_REASONS.NOT_ACTIVE };
  }

  if (input.now.getTime() < input.startsAt.getTime()) {
    return { eligible: false, reason: FLASH_CLAIM_REASONS.NOT_STARTED };
  }

  if (input.now.getTime() >= input.endsAt.getTime()) {
    return { eligible: false, reason: FLASH_CLAIM_REASONS.ENDED };
  }

  if (input.claimedCount >= input.maxClaims) {
    return { eligible: false, reason: FLASH_CLAIM_REASONS.SOLD_OUT };
  }

  if (input.userClaimsToday >= input.maxClaimsPerUser) {
    return { eligible: false, reason: FLASH_CLAIM_REASONS.DAILY_LIMIT };
  }

  return { eligible: true, reason: null };
}

/** Mirrors `GREATEST(rc.max_claims - rc.claimed_count, 0)` from rpc_list_active_flash_campaigns. */
export function computeRemainingClaims(maxClaims: number, claimedCount: number): number {
  return Math.max(maxClaims - claimedCount, 0);
}
