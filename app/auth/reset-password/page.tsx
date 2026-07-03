import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormShell } from "@/app/auth/AuthFormShell";
import { getRoleSettingsPath } from "@/lib/auth/roles";
import { resolveCurrentDemoRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "更改密碼",
  description: "為您的 HKCardVault 帳戶設定新密碼。",
};

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/forgot-password");
  }

  const role = await resolveCurrentDemoRole();
  const settingsPath =
    role === "GUEST" ? "/profile/user/settings" : getRoleSettingsPath(role);

  return (
    <AuthFormShell
      title="更改密碼"
      description="輸入目前密碼及新密碼以更新帳戶安全設定。"
      backHref={settingsPath}
      backLabel="返回帳戶設定"
    >
      <ResetPasswordForm />
    </AuthFormShell>
  );
}
