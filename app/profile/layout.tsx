import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import {
  buildConfirmEmailPath,
  isUserEmailConfirmed,
} from "@/lib/auth/email-confirmation";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function ProfileRootLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  if (!isUserEmailConfirmed(user)) {
    redirect(buildConfirmEmailPath(user.email));
  }

  return children;
}
