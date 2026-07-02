import type { DemoRole } from "@/app/store/useUIStore";
import type { Tables } from "@/types/supabase";
import { dbRoleToDemoRole } from "@/lib/auth/roles";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

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
