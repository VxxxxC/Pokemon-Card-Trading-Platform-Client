import { describe, expect, it } from "vitest";
import {
  computeBuyerTotal,
  computeSubsidy,
} from "@/lib/rewards/checkout-subsidy-math";
import {
  COUPON_INELIGIBLE_REASONS,
  evaluateCouponEligibility,
} from "@/lib/rewards/coupon-eligibility";

describe("rewards checkout matrix — free shipping subsidy", () => {
  it("B1: shipping=45, cap=30 -> subsidy=30, buyer-paid shipping=15", () => {
    const subsidy = computeSubsidy({
      kind: "free_shipping",
      itemSubtotal: 100,
      shippingFee: 45,
      amountHkd: 0,
      maxSubsidyHkd: 30,
    });

    expect(subsidy).toBe(30);

    const buyerPaidShipping = 45 - subsidy;
    expect(buyerPaidShipping).toBe(15);
  });

  it("shipping=20, cap=30 -> subsidy=20, buyer-paid shipping=0 (no over-deduction)", () => {
    const subsidy = computeSubsidy({
      kind: "free_shipping",
      itemSubtotal: 100,
      shippingFee: 20,
      amountHkd: 0,
      maxSubsidyHkd: 30,
    });

    expect(subsidy).toBe(20);

    const buyerPaidShipping = Math.max(20 - subsidy, 0);
    expect(buyerPaidShipping).toBe(0);
  });
});

describe("rewards checkout matrix — discount coupon", () => {
  it("B2.1: subtotal=100, minSpend=50, amount=10 -> eligible, subsidy=10, buyerTotal=90", () => {
    const eligibility = evaluateCouponEligibility({
      couponType: "discount_coupon",
      requiresAuthentication: "any",
      itemSubtotal: 100,
      shippingFee: 0,
      shippingMethod: "sf",
      useAuth: false,
      minSpendHkd: 50,
      amountHkd: 10,
    });
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.reason).toBeNull();

    const subsidy = computeSubsidy({
      kind: "discount_coupon",
      itemSubtotal: 100,
      shippingFee: 0,
      amountHkd: 10,
      maxSubsidyHkd: 0,
    });
    expect(subsidy).toBe(10);

    const { total, buyerTotal } = computeBuyerTotal({
      itemSubtotal: 100,
      shippingFee: 0,
      authFee: 0,
      subsidy,
    });
    expect(total).toBe(100);
    expect(buyerTotal).toBe(90);
  });

  it("B2.2: subtotal=40, minSpend=50, amount=10 -> ineligible, 未達優惠券最低消費門檻", () => {
    const eligibility = evaluateCouponEligibility({
      couponType: "discount_coupon",
      requiresAuthentication: "any",
      itemSubtotal: 40,
      shippingFee: 0,
      shippingMethod: "sf",
      useAuth: false,
      minSpendHkd: 50,
      amountHkd: 10,
    });

    expect(eligibility.eligible).toBe(false);
    if (!eligibility.eligible) {
      expect(eligibility.reason).toBe(
        COUPON_INELIGIBLE_REASONS.MIN_SPEND_DISCOUNT,
      );
      expect(eligibility.reason).toBe("未達優惠券最低消費門檻");
    }
  });
});

describe("rewards checkout matrix — auth restriction vs order auth flag", () => {
  it("B3.2 / D3.1: requires_authentication=false + auth order=true -> ineligible", () => {
    const eligibility = evaluateCouponEligibility({
      couponType: "discount_coupon",
      requiresAuthentication: "false",
      itemSubtotal: 100,
      shippingFee: 0,
      shippingMethod: "sf",
      useAuth: true,
      minSpendHkd: 0,
      amountHkd: 10,
    });

    expect(eligibility.eligible).toBe(false);
    if (!eligibility.eligible) {
      expect(eligibility.reason).toBe(
        COUPON_INELIGIBLE_REASONS.AUTH_NOT_APPLICABLE,
      );
      expect(eligibility.reason).toBe("此優惠券不適用於鑑定訂單");
    }
  });

  it("D1.2: requires_authentication=true + auth order=true -> eligible, buyer_total_amount correct", () => {
    const eligibility = evaluateCouponEligibility({
      couponType: "discount_coupon",
      requiresAuthentication: "true",
      itemSubtotal: 100,
      shippingFee: 0,
      shippingMethod: "sf",
      useAuth: true,
      minSpendHkd: 0,
      amountHkd: 10,
    });
    expect(eligibility.eligible).toBe(true);
    expect(eligibility.reason).toBeNull();

    const subsidy = computeSubsidy({
      kind: "discount_coupon",
      itemSubtotal: 100,
      shippingFee: 0,
      amountHkd: 10,
      maxSubsidyHkd: 0,
    });
    expect(subsidy).toBe(10);

    // shipping=0 for auth checkout per fixture (auth flows quote shipping=0
    // unless free_shipping coupon triggers SF quote — not the case here).
    const { total, buyerTotal } = computeBuyerTotal({
      itemSubtotal: 100,
      shippingFee: 0,
      authFee: 150,
      subsidy,
    });
    expect(total).toBe(250);
    expect(buyerTotal).toBe(240);
  });

  it("auth restriction = 'any' -> eligible for both auth and non-auth orders", () => {
    const authOrder = evaluateCouponEligibility({
      couponType: "discount_coupon",
      requiresAuthentication: "any",
      itemSubtotal: 100,
      shippingFee: 0,
      shippingMethod: "sf",
      useAuth: true,
      minSpendHkd: 0,
      amountHkd: 10,
    });
    expect(authOrder.eligible).toBe(true);

    const nonAuthOrder = evaluateCouponEligibility({
      couponType: "discount_coupon",
      requiresAuthentication: "any",
      itemSubtotal: 100,
      shippingFee: 0,
      shippingMethod: "sf",
      useAuth: false,
      minSpendHkd: 0,
      amountHkd: 10,
    });
    expect(nonAuthOrder.eligible).toBe(true);
  });
});

describe("rewards checkout matrix — free shipping method restriction (QA B3.3)", () => {
  it("free shipping coupon eligible for sf shipping method", () => {
    const eligibility = evaluateCouponEligibility({
      couponType: "free_shipping",
      requiresAuthentication: "any",
      itemSubtotal: 100,
      shippingFee: 45,
      shippingMethod: "sf",
      useAuth: false,
      shippingMethods: ["sf"],
      maxSubsidyHkd: 30,
      minSpendHkd: 0,
    });

    expect(eligibility.eligible).toBe(true);
    expect(eligibility.reason).toBeNull();
  });

  it("B3.3: meetup shipping method -> ineligible, 此免運券僅適用順豐配送", () => {
    const eligibility = evaluateCouponEligibility({
      couponType: "free_shipping",
      requiresAuthentication: "any",
      itemSubtotal: 100,
      shippingFee: 0,
      shippingMethod: "meetup",
      useAuth: false,
      shippingMethods: ["sf"],
      maxSubsidyHkd: 30,
      minSpendHkd: 0,
    });

    expect(eligibility.eligible).toBe(false);
    if (!eligibility.eligible) {
      expect(eligibility.reason).toBe(COUPON_INELIGIBLE_REASONS.SF_ONLY);
      expect(eligibility.reason).toBe("此免運券僅適用順豐配送");
    }
  });
});
