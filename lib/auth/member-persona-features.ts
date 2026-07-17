import type { ListingSellerPersona } from "@/lib/listings/active-listing-persona";

export const MEMBER_PERSONA_FEATURES_BLOCKED_ERROR =
  "請先切換至會員身份以使用此功能";

export function isMemberPersona(
  persona: ListingSellerPersona | null | undefined,
): boolean {
  return persona !== "merchant";
}

export function assertMemberPersonaForPersonalFeatures(
  persona: ListingSellerPersona,
): { ok: true } | { ok: false; error: string } {
  if (!isMemberPersona(persona)) {
    return { ok: false, error: MEMBER_PERSONA_FEATURES_BLOCKED_ERROR };
  }
  return { ok: true };
}
