import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { listAdminRewardTemplates } from "@/app/actions/admin-rewards";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { CampaignsPageShell } from "./CampaignsPageShell";

export const metadata: Metadata = {
  title: "積分與獎勵活動 — HKCardVault Admin",
  description: "管理獎勵模板、限時活動與積分任務",
};

export default async function AdminCampaignsPage() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const isAdmin = await isCurrentUserAdmin(supabase, user.id);
  if (!isAdmin) {
    redirect("/");
  }

  const templatesResult = await listAdminRewardTemplates({
    status: "all",
    page: 1,
    pageSize: 50,
  });

  return (
    <CampaignsPageShell
      initialTemplates={templatesResult.success ? templatesResult.data.rows : []}
      initialTotal={templatesResult.success ? templatesResult.data.total : 0}
      templatesLoadError={templatesResult.success ? null : templatesResult.error}
    />
  );
}
