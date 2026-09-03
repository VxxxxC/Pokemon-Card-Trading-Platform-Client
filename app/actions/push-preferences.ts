"use server";

import { revalidatePath } from "next/cache";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/supabase";

type PushPreferenceResult =
  | { success: true }
  | { success: false; error: string };

type ProfilePushPrefUpdate =
  Database["public"]["Tables"]["profiles"]["Update"];

export async function updatePushTransactionalPreference(
  enabled: boolean,
): Promise<PushPreferenceResult> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: "未登入" };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "請先登入" };
    }

    const payload: ProfilePushPrefUpdate = {
      push_transactional: enabled,
      updated_at: new Date().toISOString(),
    };

    const profilesClient = supabase.from("profiles") as unknown as {
      update: (values: ProfilePushPrefUpdate) => {
        eq: (
          column: "id",
          value: string,
        ) => Promise<{ error: { message: string } | null }>;
      };
    };

    const { error } = await profilesClient.update(payload).eq("id", user.id);

    if (error) {
      console.error("[updatePushTransactionalPreference]", error.message);
      if (error.message.includes("push_transactional")) {
        return { success: false, error: "資料庫尚未更新，請聯絡管理員" };
      }
      return { success: false, error: "無法更新通知設定" };
    }

    revalidatePath("/profile/user/settings");

    return { success: true };
  } catch (error) {
    console.error("[updatePushTransactionalPreference]", error);
    return { success: false, error: "無法更新通知設定" };
  }
}
