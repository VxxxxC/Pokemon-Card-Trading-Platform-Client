import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormShell } from "@/app/auth/AuthFormShell";
import { createClient } from "@/lib/supabase/server";
import { CompleteForgotPasswordForm } from "./CompleteForgotPasswordForm";

export const metadata: Metadata = {
  title: "設定新密碼",
  description: "完成忘記密碼流程，為您的帳戶設定新密碼。",
};

export default async function CompleteForgotPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/forgot-password?error=expired");
  }

  return (
    <AuthFormShell
      title="設定新密碼"
      description="請輸入新密碼以完成重設。完成後將自動登入。"
      backHref="/auth/forgot-password"
      backLabel="重新申請郵件"
    >
      <CompleteForgotPasswordForm />
    </AuthFormShell>
  );
}
