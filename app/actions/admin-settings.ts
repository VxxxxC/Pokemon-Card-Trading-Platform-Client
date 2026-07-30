"use server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { redirect } from "next/navigation";
import type { Tables } from "@/types/supabase";

export type AdminSettingsData = {
  id: string;
  email: string;
  role: Tables<"profiles">["role"];
};

export async function requireAdminRole(): Promise<AdminSettingsData> {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<Pick<Tables<"profiles">, "role">>();

  if (!profile || profile.role !== "admin") {
    redirect("/auth");
  }

  return {
    id: user.id,
    email: user.email ?? "",
    role: profile.role,
  };
}
