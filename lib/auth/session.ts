import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import type { AuthRole } from "@/app/store/useUIStore";
import type { Tables } from "@/types/supabase";
import { dbRoleToAuthRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

/** Per-request cached auth lookup — dedupes layout + page `getUser()` calls. */
const getCachedAuthUser = cache(async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
});

/** Returns null when Supabase is unset (CI build) or the visitor is anonymous. */
export async function getOptionalAuthUser(): Promise<User | null> {
  return getCachedAuthUser();
}

export async function resolveCurrentAuthRole(): Promise<AuthRole> {
  if (!isSupabaseConfigured()) {
    return "GUEST";
  }

  const user = await getCachedAuthUser();

  if (!user) {
    return "GUEST";
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<ProfileRoleRow>();

  return dbRoleToAuthRole(profile?.role);
}
