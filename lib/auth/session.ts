import type { DemoRole } from "@/app/store/useUIStore";
import type { Tables } from "@/types/supabase";
import { createClient } from "@/lib/supabase/server";
import { dbRoleToDemoRole } from "@/lib/auth/roles";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

export async function resolveCurrentDemoRole(): Promise<DemoRole> {
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
