import { describe, expect, test } from "bun:test";
import { resolveSellerReputationTag } from "@/lib/marketplace/load-seller-profile";

describe("resolveSellerReputationTag", () => {
  test("member persona uses profile reputation tag", () => {
    const profileTag = { memberTitle: "l2" };
    const merchantTag = { merchantTitle: "l3" };

    expect(resolveSellerReputationTag(false, profileTag, merchantTag)).toBe(
      profileTag,
    );
  });

  test("merchant persona uses merchant shop reputation tag", () => {
    const profileTag = { memberTitle: "l2" };
    const merchantTag = { merchantTitle: "l3" };

    expect(resolveSellerReputationTag(true, profileTag, merchantTag)).toBe(
      merchantTag,
    );
  });

  test("merchant persona falls back to null when shop tag missing", () => {
    expect(resolveSellerReputationTag(true, { memberTitle: "l1" }, null)).toBeNull();
  });
});
