/**
 * Pure TS mirror of the checkout coupon eligibility decision rules implemented
 * in `public.fn_compute_platform_subsidy` (see
 * supabase/migrations/20260816120000_merchant_auth_checkout_coupon.sql, the
 * latest live definition after 20260815130000).
 *
 * This module intentionally mirrors SQL error text verbatim so unit tests can
 * assert against the real user-facing reasons. It does NOT perform any DB
 * I/O, row locking, or concurrency handling — those remain SQL/RPC-only
 * concerns and must be verified via integration tests
 * (tests/integration/rewards/*.integration.test.ts).
 */

export type CouponType = "discount_coupon" | "free_shipping";

export type AuthRestriction = "any" | "true" | "false";

export type CouponEligibilityInput = {
  couponType: CouponType;
  /** Restriction JSON stored on the reward_template row. */
  requiresAuthentication: AuthRestriction;
  /** restrictions.shipping_methods, defaults to ["sf"] per SQL COALESCE. */
  shippingMethods?: ("sf" | "meetup")[];
  /** restrictions.min_item_subtotal_hkd, defaults to 0. */
  minItemSubtotalHkd?: number;
  /** reward_value.min_spend_hkd, defaults to 0. */
  minSpendHkd?: number;
  /** reward_value.amount_hkd (discount_coupon only). */
  amountHkd?: number;
  /** reward_value.max_subsidy_hkd (free_shipping only). */
  maxSubsidyHkd?: number;

  itemSubtotal: number;
  shippingFee: number;
  shippingMethod: "sf" | "meetup";
  useAuth: boolean;
};

export type CouponEligibilityResult =
  | { eligible: true; reason: null }
  | { eligible: false; reason: string };

/** Mirrors SQL error text exactly. Do not paraphrase. */
export const COUPON_INELIGIBLE_REASONS = {
  AUTH_ONLY: "此優惠券僅適用於鑑定訂單",
  AUTH_NOT_APPLICABLE: "此優惠券不適用於鑑定訂單",
  MIN_ITEM_SUBTOTAL: "未達優惠券最低消費門檻",
  MIN_SPEND_DISCOUNT: "未達優惠券最低消費門檻",
  MIN_SPEND_FREE_SHIP: "未達免運券最低消費門檻",
  SF_ONLY: "此免運券僅適用順豐配送",
  NO_SHIPPING_FEE: "此訂單結帳無運費可抵扣",
  INVALID_AMOUNT: "優惠券面額無效",
  INVALID_MAX_SUBSIDY: "免運補貼上限無效",
} as const;

/**
 * Evaluates eligibility using the same ordering as
 * `fn_compute_platform_subsidy` (post order_kinds check, which is assumed
 * true for all merchant_direct/merchant_auth checkout flows tested here).
 */
export function evaluateCouponEligibility(
  input: CouponEligibilityInput,
): CouponEligibilityResult {
  const shippingMethods = input.shippingMethods ?? ["sf"];
  const minItemSubtotalHkd = input.minItemSubtotalHkd ?? 0;
  const minSpendHkd = input.minSpendHkd ?? 0;

  if (input.requiresAuthentication === "false" && input.useAuth) {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.AUTH_NOT_APPLICABLE };
  }

  if (input.requiresAuthentication === "true" && !input.useAuth) {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.AUTH_ONLY };
  }

  if (input.itemSubtotal < minItemSubtotalHkd) {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.MIN_ITEM_SUBTOTAL };
  }

  if (input.couponType === "discount_coupon") {
    const amountHkd = input.amountHkd ?? 0;
    if (amountHkd <= 0) {
      return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.INVALID_AMOUNT };
    }
    if (input.itemSubtotal < minSpendHkd) {
      return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.MIN_SPEND_DISCOUNT };
    }
    return { eligible: true, reason: null };
  }

  // free_shipping
  if (!shippingMethods.includes("sf") || input.shippingMethod !== "sf") {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.SF_ONLY };
  }
  if (input.shippingFee <= 0) {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.NO_SHIPPING_FEE };
  }
  const maxSubsidyHkd = input.maxSubsidyHkd ?? 0;
  if (maxSubsidyHkd <= 0) {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.INVALID_MAX_SUBSIDY };
  }
  if (input.itemSubtotal < minSpendHkd) {
    return { eligible: false, reason: COUPON_INELIGIBLE_REASONS.MIN_SPEND_FREE_SHIP };
  }
  return { eligible: true, reason: null };
}
