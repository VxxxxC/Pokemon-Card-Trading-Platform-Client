import { createServiceRoleClient } from "../../shared/supabase-admin";
import { MATRIX_PREFIX } from "./fixtures";

export async function deleteAccountSanctionsForUser(userId: string): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin.from("account_sanctions").delete().eq("user_id", userId);
  if (error) {
    throw new Error(`[deleteAccountSanctionsForUser] ${error.message}`);
  }
}

export async function deleteReportAttachmentsForReporter(
  reporterId: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("report_attachments")
    .delete()
    .eq("reporter_id", reporterId);
  if (error) {
    throw new Error(`[deleteReportAttachmentsForReporter] ${error.message}`);
  }
}

export async function deleteReportsForPair(params: {
  reporterId: string;
  subjectId: string;
}): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("reports")
    .delete()
    .eq("reporter_id", params.reporterId)
    .eq("target_id", params.subjectId);
  if (error) {
    throw new Error(`[deleteReportsForPair] ${error.message}`);
  }
}

export async function deleteModerationCasesForSubject(
  subjectId: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("moderation_cases")
    .delete()
    .eq("subject_user_id", subjectId);
  if (error) {
    throw new Error(`[deleteModerationCasesForSubject] ${error.message}`);
  }
}

export async function deleteMatrixProbeChatMessages(
  roomId: string,
): Promise<void> {
  const admin = createServiceRoleClient();
  const { error } = await admin
    .from("chat_messages")
    .delete()
    .eq("room_id", roomId)
    .like("content", `${MATRIX_PREFIX}%`);

  if (error?.message.includes("permission denied")) {
    return;
  }

  if (error) {
    throw new Error(`[deleteMatrixProbeChatMessages] ${error.message}`);
  }
}

export async function wipeModerationMatrixPair(params: {
  reporterId: string;
  subjectId: string;
  chatRoomId?: string;
}): Promise<void> {
  await deleteAccountSanctionsForUser(params.subjectId);
  await deleteReportAttachmentsForReporter(params.reporterId);
  await deleteReportsForPair({
    reporterId: params.reporterId,
    subjectId: params.subjectId,
  });
  await deleteModerationCasesForSubject(params.subjectId);
  if (params.chatRoomId) {
    await deleteMatrixProbeChatMessages(params.chatRoomId);
  }
}
