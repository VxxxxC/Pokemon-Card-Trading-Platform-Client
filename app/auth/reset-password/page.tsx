import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormShell } from "@/app/auth/AuthFormShell";
import { getRoleSettingsPath } from "@/lib/auth/roles";
import { getOptionalAuthUser, resolveCurrentAuthRole } from "@/lib/auth/session";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "更改密碼",
  description: "為您的 HKCardVault 帳戶設定新密碼。",
};

export default async function ResetPasswordPage() {
  const user = await getOptionalAuthUser();

  if (!user) {
    redirect("/auth/forgot-password");
  }

  const role = await resolveCurrentAuthRole();
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
