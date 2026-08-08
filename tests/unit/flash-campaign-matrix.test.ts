import { describe, expect, it } from "vitest";
import {
  computeRemainingClaims,
  evaluateFlashCampaignClaim,
  FLASH_CLAIM_REASONS,
  type RewardCampaignStatus,
} from "@/lib/rewards/flash-campaign-eligibility";

const BASE_NOW = new Date("2026-08-15T12:00:00+08:00");
const STARTS_AT = new Date("2026-08-15T10:00:00+08:00");
const ENDS_AT = new Date("2026-08-15T18:00:00+08:00");

function baseInput(overrides: Partial<Parameters<typeof evaluateFlashCampaignClaim>[0]> = {}) {
  return {
    status: "active" as RewardCampaignStatus,
    startsAt: STARTS_AT,
    endsAt: ENDS_AT,
    maxClaims: 100,
    claimedCount: 0,
    maxClaimsPerUser: 1,
    userClaimsToday: 0,
    now: BASE_NOW,
    ...overrides,
  };
}

describe("flash campaign matrix — daily per-user limit (QA E2.5)", () => {
  it("claimedToday >= maxClaimsPerUser -> rejected, 你已達今日搶券上限", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ userClaimsToday: 1, maxClaimsPerUser: 1 }),
    );

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toBe(FLASH_CLAIM_REASONS.DAILY_LIMIT);
      expect(result.reason).toBe("你已達今日搶券上限");
    }
  });
});

describe("flash campaign matrix — stock exhaustion (QA E2.4)", () => {
  it("claimed_count >= max_claims -> rejected, 優惠券已被搶光", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ claimedCount: 100, maxClaims: 100 }),
    );

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toBe(FLASH_CLAIM_REASONS.SOLD_OUT);
      expect(result.reason).toBe("優惠券已被搶光");
    }
  });

  it("remaining_claims derived is 0 when sold out, never negative", () => {
    expect(computeRemainingClaims(100, 100)).toBe(0);
    expect(computeRemainingClaims(100, 150)).toBe(0);
    expect(computeRemainingClaims(100, 40)).toBe(60);
  });
});

describe("flash campaign matrix — time window (QA E2.2)", () => {
  it("now < starts_at -> rejected, 活動尚未開始", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ now: new Date("2026-08-15T09:59:59+08:00") }),
    );

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toBe(FLASH_CLAIM_REASONS.NOT_STARTED);
      expect(result.reason).toBe("活動尚未開始");
    }
  });

  it("now > ends_at -> rejected, 活動已結束", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ now: new Date("2026-08-15T18:00:01+08:00") }),
    );

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toBe(FLASH_CLAIM_REASONS.ENDED);
      expect(result.reason).toBe("活動已結束");
    }
  });
});

describe("flash campaign matrix — happy path (QA E2.3)", () => {
  it("active + within window + stock + under user limit -> accepted", () => {
    const result = evaluateFlashCampaignClaim(baseInput());

    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });
});

describe("flash campaign matrix — real status enum (draft|active|paused|ended)", () => {
  const statuses: RewardCampaignStatus[] = ["draft", "active", "paused", "ended"];

  it.each(statuses)("status=%s decision rule", (status) => {
    const result = evaluateFlashCampaignClaim(baseInput({ status }));

    if (status === "active") {
      expect(result.eligible).toBe(true);
    } else {
      expect(result.eligible).toBe(false);
      if (!result.eligible) {
        expect(result.reason).toBe(FLASH_CLAIM_REASONS.NOT_ACTIVE);
        expect(result.reason).toBe("活動尚未開放或已暫停");
      }
    }
  });
});

describe("flash campaign matrix — boundary semantics (SQL: now >= starts_at AND now < ends_at)", () => {
  it("now === starts_at -> eligible (SQL uses >=)", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ now: new Date(STARTS_AT.getTime()) }),
    );

    expect(result.eligible).toBe(true);
    expect(result.reason).toBeNull();
  });

  it("now === ends_at -> rejected (SQL uses now >= ends_at as the rejection check)", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ now: new Date(ENDS_AT.getTime()) }),
    );

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toBe(FLASH_CLAIM_REASONS.ENDED);
    }
  });
});

describe("flash campaign matrix — max_claims_per_user > 1 decision rule (schema caveat)", () => {
  it("decision rule allows a 2nd same-day claim when max_claims_per_user=2, given userClaimsToday=1", () => {
    // NOTE: reward_campaign_claims has a UNIQUE (campaign_id, user_id, claim_day)
    // constraint (see 20260817120000_reward_flash_campaigns.sql), meaning in
    // the real DB a user can only ever have ONE claim row per campaign per
    // HKT day — so max_claims_per_user > 1 is effectively unreachable via the
    // per-day dedup key today. This test verifies ONLY the pure decision rule
    // in isolation; it does NOT claim to validate real DB behavior with the
    // UNIQUE constraint, which would require an integration test.
    const result = evaluateFlashCampaignClaim(
      baseInput({ maxClaimsPerUser: 2, userClaimsToday: 1 }),
    );

    expect(result.eligible).toBe(true);
  });

  it("decision rule rejects when userClaimsToday reaches max_claims_per_user=2", () => {
    const result = evaluateFlashCampaignClaim(
      baseInput({ maxClaimsPerUser: 2, userClaimsToday: 2 }),
    );

    expect(result.eligible).toBe(false);
    if (!result.eligible) {
      expect(result.reason).toBe(FLASH_CLAIM_REASONS.DAILY_LIMIT);
    }
  });
});
