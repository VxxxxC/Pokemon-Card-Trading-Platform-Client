import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthFormShell } from "@/app/auth/AuthFormShell";
import { getRoleDefaultLandingPath } from "@/lib/auth/roles";
import {
  buildConfirmEmailPath,
  isUserEmailConfirmed,
} from "@/lib/auth/email-confirmation";
import { getOptionalAuthUser, resolveCurrentAuthRole } from "@/lib/auth/session";
import { enqueueAccountEmailVerifiedEmail } from "@/lib/notifications/account-emails";
import { EmailConfirmedClient } from "./EmailConfirmedClient";

export const metadata: Metadata = {
  title: "電郵已確認 · HKCardVault",
  description: "你的 Cardvault HK 帳戶電郵已成功確認。",
};

const DEFAULT_NEXT = "/profile/user";

function sanitizeNextPath(next: string | undefined): string {
  if (!next?.startsWith("/")) {
    return DEFAULT_NEXT;
  }

  return next;
}

export default async function EmailConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next: nextParam } = await searchParams;
  const nextPath = sanitizeNextPath(nextParam);
  const user = await getOptionalAuthUser();

  if (!user) {
    redirect(`/auth?redirect=${encodeURIComponent(nextPath)}`);
  }

  if (!isUserEmailConfirmed(user)) {
    redirect(buildConfirmEmailPath(user.email));
  }

  const role = await resolveCurrentAuthRole();
  const resolvedNext =
    nextPath === DEFAULT_NEXT ? getRoleDefaultLandingPath(role) : nextPath;

  await enqueueAccountEmailVerifiedEmail(user.id);

  return (
    <AuthFormShell
      title="電郵已確認"
      description="歡迎加入 Cardvault HK，你的帳戶已可正常使用。"
      backHref={resolvedNext}
      backLabel="進入會員中心"
    >
      <EmailConfirmedClient nextPath={resolvedNext} />
    </AuthFormShell>
  );
}
