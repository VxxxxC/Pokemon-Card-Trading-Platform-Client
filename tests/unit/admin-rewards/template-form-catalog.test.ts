import { describe, expect, it } from "vitest";
import {
  applyFormFlow,
  buildDefaultActivityForm,
  buildDefaultPointsMallActivityForm,
  deriveFormFlow,
  isCatalogEligibleRewardType,
  resolveActivityTriggerConditions,
  sanitizeRedemptionCatalogForType,
  shouldShowAutoGrantTriggers,
  shouldShowRedemptionCatalog,
} from "@/lib/admin-rewards/template-form";

describe("admin reward catalog form helpers", () => {
  it("hides redemption catalog for points type (G1.3)", () => {
    expect(isCatalogEligibleRewardType("points")).toBe(false);
    expect(shouldShowRedemptionCatalog("points", "auto_grant")).toBe(false);
    expect(shouldShowRedemptionCatalog("discount_coupon", "auto_grant")).toBe(
      true,
    );
    expect(shouldShowRedemptionCatalog("discount_coupon", "flash_only")).toBe(
      false,
    );
  });

  it("strips catalog payload for non-coupon types", () => {
    const catalog = {
      enabled: true,
      points_cost: 100,
      stock: 5,
      is_active: true,
    };
    expect(sanitizeRedemptionCatalogForType("points", catalog)).toBeUndefined();
    expect(sanitizeRedemptionCatalogForType("discount_coupon", catalog)).toEqual(
      catalog,
    );
  });

  it("forces trigger none when catalog is enabled", () => {
    const base = buildDefaultActivityForm();
    expect(
      resolveActivityTriggerConditions({
        ...base,
        redemption_catalog: {
          enabled: true,
          points_cost: 100,
          stock: 5,
          is_active: true,
        },
      }),
    ).toEqual({ kind: "none" });
    expect(
      resolveActivityTriggerConditions({
        ...base,
        trigger_conditions: {
          kind: "trade_count",
          role: "buyer",
          count: 1,
        },
      }).kind,
    ).toBe("trade_count");
  });

  it("hides auto-grant triggers when catalog is enabled", () => {
    expect(
      shouldShowAutoGrantTriggers("auto_grant", {
        enabled: true,
        points_cost: 100,
        stock: 5,
        is_active: true,
      }),
    ).toBe(false);
    expect(shouldShowAutoGrantTriggers("auto_grant", undefined)).toBe(true);
    expect(shouldShowAutoGrantTriggers("flash_only", undefined)).toBe(false);
    expect(
      shouldShowAutoGrantTriggers("auto_grant", undefined, "points_mall"),
    ).toBe(false);
  });

  it("derives and applies form flow for points mall", () => {
    const general = buildDefaultActivityForm();
    expect(deriveFormFlow(general)).toBe("general");

    const pointsMall = buildDefaultPointsMallActivityForm();
    expect(deriveFormFlow(pointsMall)).toBe("points_mall");
    expect(pointsMall.trigger_conditions).toEqual({ kind: "none" });
    expect(pointsMall.redemption_catalog?.enabled).toBe(true);

    const switched = applyFormFlow(general, "points_mall");
    expect(deriveFormFlow(switched)).toBe("points_mall");
    expect(switched.type).toBe("discount_coupon");
    expect(switched.trigger_conditions).toEqual({ kind: "none" });

    const restored = applyFormFlow(switched, "general");
    expect(deriveFormFlow(restored)).toBe("general");
    expect(restored.redemption_catalog).toBeUndefined();
    expect(restored.trigger_conditions.kind).toBe("event_once");
  });
});
