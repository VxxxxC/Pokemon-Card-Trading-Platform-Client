import { describe, expect, test } from "bun:test";
import { getProfileHomePath, getTradingHomePath } from "@/lib/auth/roles";

describe("getProfileHomePath", () => {
  test("merchant role with member persona lands on member dashboard", () => {
    expect(getProfileHomePath("MERCHANT", "member")).toBe("/profile/user");
  });

  test("merchant role with merchant persona lands on merchant dashboard", () => {
    expect(getProfileHomePath("MERCHANT", "merchant")).toBe(
      "/profile/merchant",
    );
  });

  test("member-only user always lands on member dashboard", () => {
    expect(getProfileHomePath("USER", "merchant")).toBe("/profile/user");
  });
});

describe("getTradingHomePath", () => {
  test("merchant role with member persona uses member trading", () => {
    expect(getTradingHomePath("MERCHANT", "member")).toBe(
      "/profile/user/trading",
    );
  });

  test("merchant role with merchant persona uses merchant trading", () => {
    expect(getTradingHomePath("MERCHANT", "merchant")).toBe(
      "/profile/merchant/trading",
    );
  });
});
