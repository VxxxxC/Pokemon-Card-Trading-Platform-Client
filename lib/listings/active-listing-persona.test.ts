import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import {
  defaultListingPersonaForRole,
  listingPersonaFromPathname,
  persistActiveListingPersona,
  readPersistedListingPersona,
  resolveActiveListingPersona,
  resolveAddAssetSellerPersona,
} from "@/lib/listings/active-listing-persona";

function installSessionStorageMock() {
  const store = new Map<string, string>();

  const sessionStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: { sessionStorage },
  });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { cookie: "" },
  });

  return store;
}

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

  test("merchant role on homepage uses merchant default without persistence", () => {
    expect(
      resolveActiveListingPersona({
        userAuthRole: "MERCHANT",
        pathname: "/",
      }),
    ).toBe("merchant");
  });
});

describe("resolveActiveListingPersona with persisted session", () => {
  beforeEach(() => {
    installSessionStorageMock();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
    delete (globalThis as { document?: unknown }).document;
  });

  test("merchant role on homepage respects persisted merchant persona", () => {
    persistActiveListingPersona("merchant");

    expect(
      resolveActiveListingPersona({
        userAuthRole: "MERCHANT",
        pathname: "/",
      }),
    ).toBe("merchant");
    expect(readPersistedListingPersona()).toBe("merchant");
  });

  test("merchant role on homepage respects persisted member persona", () => {
    persistActiveListingPersona("member");

    expect(
      resolveActiveListingPersona({
        userAuthRole: "MERCHANT",
        pathname: "/",
      }),
    ).toBe("member");
  });

  test("user role cannot keep persisted merchant persona on neutral routes", () => {
    persistActiveListingPersona("merchant");

    expect(
      resolveActiveListingPersona({
        userAuthRole: "USER",
        pathname: "/",
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
