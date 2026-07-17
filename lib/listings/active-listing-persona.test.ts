import { describe, expect, test } from "bun:test";
import {
  defaultListingPersonaForRole,
  listingPersonaFromPathname,
  resolveActiveListingPersona,
  resolveAddAssetSellerPersona,
} from "@/lib/listings/active-listing-persona";

describe("listingPersonaFromPathname", () => {
  test("merchant profile routes resolve to merchant", () => {
    expect(listingPersonaFromPathname("/profile/merchant")).toBe("merchant");
    expect(listingPersonaFromPathname("/profile/merchant/inventory")).toBe(
      "merchant",
    );
  });

  test("member profile routes resolve to member", () => {
    expect(listingPersonaFromPathname("/profile")).toBe("member");
    expect(listingPersonaFromPathname("/profile/user")).toBe("member");
    expect(listingPersonaFromPathname("/profile/user/inventory")).toBe(
      "member",
    );
  });

  test("non-profile routes return null", () => {
    expect(listingPersonaFromPathname("/")).toBeNull();
    expect(listingPersonaFromPathname("/marketplace")).toBeNull();
  });
});

describe("resolveActiveListingPersona", () => {
  test("guest always resolves to member", () => {
    expect(
      resolveActiveListingPersona({
        userAuthRole: "GUEST",
        pathname: "/profile/merchant",
      }),
    ).toBe("member");
  });

  test("merchant role on marketplace uses merchant default", () => {
    expect(
      resolveActiveListingPersona({
        userAuthRole: "MERCHANT",
        pathname: "/marketplace",
      }),
    ).toBe("merchant");
  });

  test("member role on marketplace uses member default", () => {
    expect(
      resolveActiveListingPersona({
        userAuthRole: "USER",
        pathname: "/marketplace",
      }),
    ).toBe("member");
  });

  test("profile routes override role defaults", () => {
    expect(
      resolveActiveListingPersona({
        userAuthRole: "MERCHANT",
        pathname: "/profile/user",
      }),
    ).toBe("member");
  });
});

describe("resolveAddAssetSellerPersona", () => {
  test("collection sell prefill always forces member", () => {
    expect(
      resolveAddAssetSellerPersona({
        sellPrefill: {
          collectionId: "c1",
          productId: "p1",
          catalog: { name: "Card", setCode: "SV1" },
          gradingOptionId: "raw",
          sellingPrice: 100,
        },
        activeListingPersona: "merchant",
      }),
    ).toBe("member");
  });

  test("uses active listing persona when no prefill", () => {
    expect(
      resolveAddAssetSellerPersona({
        activeListingPersona: "merchant",
      }),
    ).toBe("merchant");

    expect(
      resolveAddAssetSellerPersona({
        activeListingPersona: "member",
      }),
    ).toBe("member");
  });

  test("explicit sellerPersona override wins", () => {
    expect(
      resolveAddAssetSellerPersona({
        activeListingPersona: "member",
        sellerPersona: "merchant",
      }),
    ).toBe("merchant");
  });
});

describe("defaultListingPersonaForRole", () => {
  test("maps auth roles to listing personas", () => {
    expect(defaultListingPersonaForRole("USER")).toBe("member");
    expect(defaultListingPersonaForRole("MERCHANT")).toBe("merchant");
    expect(defaultListingPersonaForRole("ADMIN")).toBe("merchant");
    expect(defaultListingPersonaForRole("GUEST")).toBe("member");
  });
});
