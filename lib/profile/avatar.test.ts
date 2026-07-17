import { describe, expect, test } from "bun:test";
import { resolveOptionalMediaUrl } from "@/lib/profile/avatar";

describe("resolveOptionalMediaUrl", () => {
  test("returns null for empty values", () => {
    expect(resolveOptionalMediaUrl(null)).toBeNull();
    expect(resolveOptionalMediaUrl("")).toBeNull();
    expect(resolveOptionalMediaUrl("   ")).toBeNull();
  });

  test("returns absolute and http URLs as-is", () => {
    expect(resolveOptionalMediaUrl("/banners/shop.jpg")).toBe("/banners/shop.jpg");
    expect(resolveOptionalMediaUrl("https://hkcardvault.b-cdn.net/banner.jpg")).toBe(
      "https://hkcardvault.b-cdn.net/banner.jpg",
    );
  });
});
