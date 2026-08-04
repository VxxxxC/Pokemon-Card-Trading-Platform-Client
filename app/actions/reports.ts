"use server";

import { isDbChatRoomId } from "@/app/lib/chat/constants";
import {
  isChatEvidenceRequiredForCategory,
  resolveReportCategoryInput,
} from "@/lib/moderation/category-config";
import { REPORT_EVIDENCE_MAX_COUNT } from "@/lib/moderation/report-evidence-files";
import type { SubmitUserReportRpcResult } from "@/lib/moderation/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database, Tables } from "@/types/supabase";

const MAX_REPORT_DETAILS_LENGTH = 2000;

const PROFILE_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubmitUserReportInput = {
  reportedUserId: string;
  category: string;
  details?: string;
  chatRoomId?: string;
  attachmentIds?: string[];
};

export type SubmitUserReportResult =
  | {
      success: true;
      data: { reportId: string; caseId: string; caseNumber: string };
    }
  | { success: false; error: string };

type SubmitReportRpcArgs =
  Database["public"]["Functions"]["rpc_submit_user_report_v2"]["Args"];

type SubmitReportRpcClient = {
  rpc(
    fn: "rpc_submit_user_report_v2",
    args: SubmitReportRpcArgs,
  ): Promise<{ data: unknown; error: { message: string } | null }>;
};

function asSubmitReportRpcClient(
  supabase: Awaited<ReturnType<typeof createClient>>,
): SubmitReportRpcClient {
  return supabase as unknown as SubmitReportRpcClient;
}

type ChatRoomPartyRow = Pick<Tables<"chat_rooms">, "buyer_id" | "seller_id">;

function isValidProfileId(value: string): boolean {
  return PROFILE_ID_UUID_RE.test(value.trim());
}

function mapReportRpcError(message: string): string {
  if (message.includes("idx_reports_pending_reporter_target")) {
    return "您已對該用戶提交過待審核的舉報，請等待處理結果";
  }

  if (message.includes("請在對話內使用舉報功能")) {
    return "請在對話內使用舉報功能";
  }

  if (message.includes("請先登入")) {
    return "請先登入";
  }

  if (message.includes("無效的舉報對象")) {
    return "無效的舉報對象";
  }

  if (message.includes("無法舉報此對話中的用戶")) {
    return "無法舉報此對話中的用戶";
  }

  if (message.includes("無法驗證聊天室")) {
    return "無法驗證聊天室，請稍後再試";
  }

  if (message.includes("找不到被舉報的用戶")) {
    return "找不到被舉報的用戶";
  }

  if (message.includes("您已對該用戶提交過待審核的舉報")) {
    return "您已對該用戶提交過待審核的舉報，請等待處理結果";
  }

  if (
    message.includes("無效的證據附件") ||
    message.includes("證據圖片不可超過")
  ) {
    return message.includes("證據圖片不可超過")
      ? "證據圖片不可超過 3 張"
      : "無效的證據附件";
  }

  if (message.includes("violates row-level security")) {
    return "無法提交舉報，請確認登入狀態後再試";
  }

  return "提交舉報時發生錯誤，請稍後再試";
}

export async function submitUserReport(
  input: SubmitUserReportInput,
): Promise<SubmitUserReportResult> {
  const reportedUserId = input.reportedUserId.trim();
  const categoryInput = input.category.trim();
  const details = input.details?.trim() ?? "";
  const chatRoomId = input.chatRoomId?.trim() ?? "";
  const attachmentIds = input.attachmentIds ?? [];

  if (!categoryInput) {
    return { success: false, error: "請選擇舉報事項類別" };
  }

  const categorySlug = resolveReportCategoryInput(categoryInput);
  if (!categorySlug) {
    return { success: false, error: "無效的舉報類別" };
  }

  if (!isValidProfileId(reportedUserId)) {
    return { success: false, error: "無效的舉報對象" };
  }

  if (details.length > MAX_REPORT_DETAILS_LENGTH) {
    return {
      success: false,
      error: `詳細說明不可超過 ${MAX_REPORT_DETAILS_LENGTH} 字`,
    };
  }

  if (attachmentIds.length > REPORT_EVIDENCE_MAX_COUNT) {
    return {
      success: false,
      error: `證據圖片不可超過 ${REPORT_EVIDENCE_MAX_COUNT} 張`,
    };
  }

  const uniqueAttachmentIds = [...new Set(attachmentIds.map((id) => id.trim()))];
  if (uniqueAttachmentIds.length !== attachmentIds.length) {
    return { success: false, error: "無效的證據附件" };
  }

  for (const attachmentId of uniqueAttachmentIds) {
    if (!isValidProfileId(attachmentId)) {
      return { success: false, error: "無效的證據附件" };
    }
  }

  if (isChatEvidenceRequiredForCategory(categorySlug) && !chatRoomId) {
    return { success: false, error: "請在對話內使用舉報功能" };
  }

  if (!isSupabaseConfigured()) {
    return { success: false, error: "服務尚未設定" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入" };
    }

    if (reportedUserId === user.id) {
      return { success: false, error: "無法舉報自己" };
    }

    if (chatRoomId) {
      if (!isDbChatRoomId(chatRoomId)) {
        return { success: false, error: "對話尚未建立，無法舉報" };
      }

      const { data: room, error: roomError } = await supabase
        .from("chat_rooms")
        .select("buyer_id, seller_id")
        .eq("id", chatRoomId)
        .maybeSingle<ChatRoomPartyRow>();

      if (roomError || !room) {
        return { success: false, error: "無法驗證聊天室，請稍後再試" };
      }

      const isParty =
        room.buyer_id === user.id || room.seller_id === user.id;
      const counterpartyId =
        room.buyer_id === user.id ? room.seller_id : room.buyer_id;

      if (!isParty || counterpartyId !== reportedUserId) {
        return { success: false, error: "無法舉報此對話中的用戶" };
      }
    } else {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", reportedUserId)
        .maybeSingle<{ id: string }>();

      if (profileError || !profile) {
        return { success: false, error: "找不到被舉報的用戶" };
      }
    }

    const rpcArgs: SubmitReportRpcArgs = {
      p_target_id: reportedUserId,
      p_category: categorySlug,
      p_details: details,
    };

    if (chatRoomId) {
      rpcArgs.p_chat_room_id = chatRoomId;
    }

    if (uniqueAttachmentIds.length > 0) {
      rpcArgs.p_attachment_ids = uniqueAttachmentIds;
    }

    const { data, error } = await asSubmitReportRpcClient(supabase).rpc(
      "rpc_submit_user_report_v2",
      rpcArgs,
    );

    if (error) {
      console.error("[submitUserReport]", error.message);
      return { success: false, error: mapReportRpcError(error.message) };
    }

    const payload = data as SubmitUserReportRpcResult | null;
    if (
      !payload?.report_id ||
      !payload.case_id ||
      !payload.case_number
    ) {
      return { success: false, error: "提交舉報回傳資料格式異常" };
    }

    return {
      success: true,
      data: {
        reportId: payload.report_id,
        caseId: payload.case_id,
        caseNumber: payload.case_number,
      },
    };
  } catch (error) {
    console.error("[submitUserReport]", error);
    return { success: false, error: "提交舉報時發生錯誤" };
  }
}
