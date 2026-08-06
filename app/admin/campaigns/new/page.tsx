import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { RewardActivityForm } from "@/app/admin/campaigns/RewardActivityForm";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "新增獎勵活動 — HKCardVault Admin",
  description: "建立平台獎勵活動",
};

export default async function AdminNewRewardActivityPage() {
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

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <div className="font-mono text-[11px] text-text-secondary">
          <Link href="/admin/campaigns" className="hover:text-brand">
            積分與獎勵活動
          </Link>
          <span className="text-text-disabled"> / 新增活動</span>
        </div>
        <h1 className="mt-2 font-sans text-[24px] font-bold text-text-primary">
          新增獎勵活動
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          一次設定獎勵內容、發放方式與檔期（如適用）。
        </p>
      </div>

      <RewardActivityForm />
    </div>
  );
}
