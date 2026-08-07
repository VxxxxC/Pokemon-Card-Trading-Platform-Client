import { createServiceRoleClient } from "../../shared/supabase-admin";

export type ReportAuditRow = {
  id: string;
  reporter_id: string;
  target_id: string;
  target_type: string;
  reason: string;
  status: string | null;
  category: string | null;
  case_id: string | null;
  contribution_score: number | null;
};

export async function getLatestReport(params: {
  reporterId: string;
  targetId: string;
}): Promise<ReportAuditRow | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("reports")
    .select(
      "id, reporter_id, target_id, target_type, reason, status, category, case_id, contribution_score",
    )
    .eq("reporter_id", params.reporterId)
    .eq("target_id", params.targetId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`[getLatestReport] ${error.message}`);
  }

  return (data as ReportAuditRow | null) ?? null;
}

export async function countPendingReports(params: {
  reporterId: string;
  targetId: string;
}): Promise<number> {
  const admin = createServiceRoleClient();
  const { count, error } = await admin
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("reporter_id", params.reporterId)
    .eq("target_id", params.targetId)
    .eq("status", "pending");

  if (error) {
    throw new Error(`[countPendingReports] ${error.message}`);
  }

  return count ?? 0;
}

export async function getModerationCaseStatus(
  caseId: string,
): Promise<{ status: string; resolution: string | null } | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("moderation_cases")
    .select("status, resolution")
    .eq("id", caseId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getModerationCaseStatus] ${error.message}`);
  }

  return (data as { status: string; resolution: string | null } | null) ?? null;
}

export async function getModerationCaseScores(caseId: string): Promise<{
  autoScore: number;
  adminAdjustment: number;
  finalScore: number;
} | null> {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("moderation_cases")
    .select("auto_score, admin_adjustment, final_score")
    .eq("id", caseId)
    .maybeSingle();

  if (error) {
    throw new Error(`[getModerationCaseScores] ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    autoScore: Number(data.auto_score ?? 0),
    adminAdjustment: Number(data.admin_adjustment ?? 0),
    finalScore: Number(data.final_score ?? 0),
  };
}

export async function countModerationAuditLogsForCase(
  caseId: string,
  action?: string,
): Promise<number> {
  const admin = createServiceRoleClient();
  let query = admin
    .from("moderation_audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("case_id", caseId);

  if (action) {
    query = query.eq("action", action);
  }

  const { count, error } = await query;
  if (error) {
    throw new Error(`[countModerationAuditLogsForCase] ${error.message}`);
  }

  return count ?? 0;
}

export async function getActiveAccountSanctionsForUser(userId: string) {
  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from("account_sanctions")
    .select("id, user_id, scope, type, ends_at, reason, case_id")
    .eq("user_id", userId);

  if (error) {
    throw new Error(`[getActiveAccountSanctionsForUser] ${error.message}`);
  }

  return data ?? [];
}
