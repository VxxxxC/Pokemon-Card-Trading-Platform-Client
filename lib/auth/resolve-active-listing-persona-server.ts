import { cookies } from "next/headers";
import type { AuthRole } from "@/app/store/useUIStore";
import { resolveCurrentAuthRole } from "@/lib/auth/session";
import {
  ACTIVE_LISTING_PERSONA_COOKIE_KEY,
  defaultListingPersonaForRole,
  listingPersonaFromPathname,
  type ListingSellerPersona,
} from "@/lib/listings/active-listing-persona";

function readListingPersonaCookie(
  value: string | undefined,
): ListingSellerPersona | null {
  if (value === "member" || value === "merchant") {
    return value;
  }
  return null;
}

export async function resolveActiveListingPersonaServer(input?: {
  pathname?: string;
}): Promise<ListingSellerPersona> {
  const role: AuthRole = await resolveCurrentAuthRole();
  if (role === "GUEST") {
    return "member";
  }

  const pathname = input?.pathname ?? "";
  const fromPath = pathname ? listingPersonaFromPathname(pathname) : null;
  if (fromPath) {
    return fromPath;
  }

  const cookieStore = await cookies();
  const fromCookie = readListingPersonaCookie(
    cookieStore.get(ACTIVE_LISTING_PERSONA_COOKIE_KEY)?.value,
  );
  if (fromCookie) {
    if (role === "USER" && fromCookie === "merchant") {
      return "member";
    }
    return fromCookie;
  }

  return defaultListingPersonaForRole(role);
}
