import {
  assertMemberPersonaForPersonalFeatures,
  MEMBER_PERSONA_FEATURES_BLOCKED_ERROR,
} from "@/lib/auth/member-persona-features";
import { resolveActiveListingPersonaServer } from "@/lib/auth/resolve-active-listing-persona-server";

export async function guardMemberPersonaPersonalFeatures(pathname?: string): Promise<
  | { allowed: true }
  | { allowed: false; error: string }
> {
  const persona = await resolveActiveListingPersonaServer({ pathname });
  const result = assertMemberPersonaForPersonalFeatures(persona);
  if (!result.ok) {
    return { allowed: false, error: result.error };
  }
  return { allowed: true };
}

export { MEMBER_PERSONA_FEATURES_BLOCKED_ERROR };
