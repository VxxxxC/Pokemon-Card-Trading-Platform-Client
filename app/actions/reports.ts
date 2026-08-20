"use server";

import { isDbChatRoomId } from "@/app/lib/chat/constants";
import { formatReportReason } from "@/app/lib/reports/formatReportReason";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Tables, TablesInsert } from "@/types/supabase";

const MAX_REPORT_DETAILS_LENGTH = 2000;

const PROFILE_ID_UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type SubmitUserReportInput = {
  reportedUserId: string;
  category: string;
  details?: string;
  chatRoomId?: string;
};

export type SubmitUserReportResult =
  | { success: true; data: { reportId: string } }
  | { success: false; error: string };

type ChatRoomPartyRow = Pick<Tables<"chat_rooms">, "buyer_id" | "seller_id">;

function isValidProfileId(value: string): boolean {
  return PROFILE_ID_UUID_RE.test(value.trim());
}

function mapReportInsertError(message: string): string {
  if (message.includes("idx_reports_pending_reporter_target")) {
    return "您已對該用戶提交過待審核的舉報，請等待處理結果";
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
  const category = input.category.trim();
  const details = input.details?.trim() ?? "";
  const chatRoomId = input.chatRoomId?.trim() ?? "";

  if (!category) {
    return { success: false, error: "請選擇舉報事項類別" };
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

    const reason = formatReportReason({
      category,
      details,
      source: chatRoomId ? "chat_room" : "profile",
      chatRoomId: chatRoomId || undefined,
    });

    const insertRow: TablesInsert<"reports"> = {
      reporter_id: user.id,
      target_type: "user",
      target_id: reportedUserId,
      reason,
      status: "pending",
    };

    const { data, error } = await supabase
      .from("reports")
      .insert([insertRow] as never)
      .select("id")
      .single<{ id: string }>();

    if (error) {
      console.error("[submitUserReport]", error.message);
      return { success: false, error: mapReportInsertError(error.message) };
    }

    if (!data?.id) {
      return { success: false, error: "提交舉報回傳資料格式異常" };
    }

    return { success: true, data: { reportId: data.id } };
  } catch (error) {
    console.error("[submitUserReport]", error);
    return { success: false, error: "提交舉報時發生錯誤" };
  }
}
