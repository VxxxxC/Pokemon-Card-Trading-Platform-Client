import type { User } from "@supabase/supabase-js";
import type { DemoRole } from "@/app/store/useUIStore";
import type { Tables } from "@/types/supabase";
import { dbRoleToDemoRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

/** Returns null when Supabase is unset (CI build) or the visitor is anonymous. */
export async function getOptionalAuthUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function resolveCurrentDemoRole(): Promise<DemoRole> {
  if (!isSupabaseConfigured()) {
    return "GUEST";
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "GUEST";
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<ProfileRoleRow>();

  return dbRoleToDemoRole(profile?.role);
}
