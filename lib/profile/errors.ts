import type { UserProfileFormErrors } from "@/lib/profile/validation";

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

export function mapProfileUpdateError(
  error: SupabaseErrorLike,
): UserProfileFormErrors {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "23505") {
    if (message.includes("display_name") || message.includes("profiles_display_name")) {
      return { displayName: "此顯示名稱已被使用" };
    }
    if (message.includes("username") || message.includes("profiles_username")) {
      return { username: "此用戶名稱已被使用" };
    }
  }

  if (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return { form: "沒有權限更新資料，請重新登入後再試" };
  }

  if (error.code === "42703" || message.includes("column")) {
    return { form: "資料庫尚未更新，請執行最新 migration 後再試" };
  }

  return { form: "儲存失敗，請稍後再試" };
}
