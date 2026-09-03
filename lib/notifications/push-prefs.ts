import { createAdminClient } from "@/lib/supabase/admin";
import type { Tables } from "@/types/supabase";

type ProfilePushPrefRow = Pick<Tables<"profiles">, "push_transactional">;

const TRANSACTIONAL_PUSH_EVENT_PREFIXES = ["P-OFF-", "P-ORD-"] as const;

export function isTransactionalPushEvent(eventId: string): boolean {
  return TRANSACTIONAL_PUSH_EVENT_PREFIXES.some((prefix) =>
    eventId.startsWith(prefix),
  );
}

export async function isUserPushTransactionalEnabled(
  userId: string,
): Promise<boolean> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .select("push_transactional")
    .eq("id", userId)
    .maybeSingle<ProfilePushPrefRow>();

  if (error) {
    console.warn("[push-prefs] profile lookup failed", userId, error.message);
    return true;
  }

  return data?.push_transactional !== false;
}
