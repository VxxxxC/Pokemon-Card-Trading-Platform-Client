export type ListingSellerPersona = "member" | "merchant";

type ActiveListingAuthRole = "GUEST" | "USER" | "MERCHANT" | "ADMIN";

export const ACTIVE_LISTING_PERSONA_STORAGE_KEY = "hkcv:activeListingPersona";

export function listingPersonaFromPathname(
  pathname: string,
): ListingSellerPersona | null {
  if (pathname.startsWith("/profile/merchant")) {
    return "merchant";
  }
  if (pathname === "/profile" || pathname.startsWith("/profile/user")) {
    return "member";
  }
  return null;
}

export function defaultListingPersonaForRole(
  role: ActiveListingAuthRole,
): ListingSellerPersona {
  if (role === "MERCHANT" || role === "ADMIN") {
    return "merchant";
  }
  return "member";
}

export function readPersistedListingPersona(): ListingSellerPersona | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.sessionStorage.getItem(ACTIVE_LISTING_PERSONA_STORAGE_KEY);
  if (raw === "member" || raw === "merchant") {
    return raw;
  }
  return null;
}

export function persistActiveListingPersona(persona: ListingSellerPersona): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(ACTIVE_LISTING_PERSONA_STORAGE_KEY, persona);
}

export function clearPersistedListingPersona(): void {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(ACTIVE_LISTING_PERSONA_STORAGE_KEY);
}

export function resolveActiveListingPersona(input: {
  userAuthRole: ActiveListingAuthRole;
  pathname: string;
}): ListingSellerPersona {
  if (input.userAuthRole === "GUEST") {
    return "member";
  }

  const fromPath = listingPersonaFromPathname(input.pathname);
  if (fromPath) {
    return fromPath;
  }

  const persisted = readPersistedListingPersona();
  if (persisted) {
    if (input.userAuthRole === "USER" && persisted === "merchant") {
      return "member";
    }
    return persisted;
  }

  return defaultListingPersonaForRole(input.userAuthRole);
}

export function resolveAddAssetSellerPersona(input: {
  sellPrefill?: { collectionId: string } | null;
  activeListingPersona?: ListingSellerPersona;
  sellerPersona?: ListingSellerPersona;
}): ListingSellerPersona {
  if (input.sellPrefill) {
    return "member";
  }
  if (input.sellerPersona) {
    return input.sellerPersona;
  }
  return input.activeListingPersona ?? "member";
}
