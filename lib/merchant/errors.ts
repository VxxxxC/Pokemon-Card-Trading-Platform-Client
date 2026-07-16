import type { MerchantShopFormErrors } from "@/lib/merchant/validation";

type SupabaseErrorLike = {
  code?: string;
  message?: string;
};

export function mapMerchantShopFetchError(error: SupabaseErrorLike): string {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code === "42703" || message.includes("column")) {
    return "資料庫尚未更新，請執行 bunx supabase db push";
  }

  if (
    error.code === "42501" ||
    message.includes("row-level security") ||
    message.includes("permission denied")
  ) {
    return "沒有權限讀取店舖資料，請確認 merchant_shops SELECT migration 已套用";
  }

  if (error.code === "PGRST116" || message.includes("multiple")) {
    return "店舖資料重複，請聯絡管理員清理 merchant_shops 重複列";
  }

  return "無法取得店舖資料";
}

export function mapMerchantShopUpdateError(
  error: SupabaseErrorLike,
): MerchantShopFormErrors {
  const message = error.message?.toLowerCase() ?? "";

  if (
    error.code === "23505" &&
    (message.includes("shop_handle") ||
      message.includes("merchant_shops_shop_handle"))
  ) {
    return { shopHandle: "此店舖帳號已被使用" };
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
