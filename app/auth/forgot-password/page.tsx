import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormShell } from "@/app/auth/AuthFormShell";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

export const metadata: Metadata = {
  title: "忘記密碼",
  description: "透過電子郵件重設您的 HKCardVault 帳戶密碼。",
};

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({ searchParams }: PageProps) {
  const user = await getOptionalAuthUser();

  if (user) {
    redirect("/auth/reset-password");
  }

  const params = await searchParams;
  const expiredMessage = params.error === "expired";

  return (
    <AuthFormShell
      title="忘記密碼"
      description="輸入註冊時使用的電子郵件，我們將寄送重設連結。"
    >
      <ForgotPasswordForm expiredMessage={expiredMessage} />
    </AuthFormShell>
  );
}
