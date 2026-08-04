import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import {
  getAdminModerationCase,
  getAdminSubjectModerationHistory,
} from "@/app/actions/admin-moderation";
import DisputeDetailClient from "@/app/admin/disputes/[id]/DisputeDetailClient";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "案件詳情 — HKCardVault Admin",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DisputeDetailPage({ params }: PageProps) {
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

  const { id } = await params;
  const caseResult = await getAdminModerationCase(id);

  if (!caseResult.success) {
    notFound();
  }

  const historyResult = await getAdminSubjectModerationHistory({
    subjectUserId: caseResult.data.case.subject.id,
    excludeCaseId: caseResult.data.case.id,
  });

  return (
    <DisputeDetailClient
      bundle={caseResult.data}
      subjectHistory={historyResult.success ? historyResult.data : null}
      subjectHistoryError={historyResult.success ? null : historyResult.error}
    />
  );
}
