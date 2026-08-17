import { describe, expect, it } from "vitest";
import { isPathAllowedForRole } from "@/lib/auth/roles";

describe("isPathAllowedForRole", () => {
  it("allows guests on public profile routes that share a user prefix", () => {
    expect(
      isPathAllowedForRole("GUEST", "/profile/user_f9bc1c74c6"),
    ).toBe(true);
    expect(
      isPathAllowedForRole("GUEST", "/profile/user_f9bc1c74c6/rating"),
    ).toBe(true);
  });

  it("still protects member dashboard routes for guests", () => {
    expect(isPathAllowedForRole("GUEST", "/profile/user")).toBe(false);
    expect(isPathAllowedForRole("GUEST", "/profile/user/collection")).toBe(
      false,
    );
  });

  it("still protects merchant dashboard routes for guests", () => {
    expect(isPathAllowedForRole("GUEST", "/profile/merchant")).toBe(false);
    expect(isPathAllowedForRole("GUEST", "/profile/merchant/trading")).toBe(
      false,
    );
  });
});
