import type { PostgrestError } from "@supabase/supabase-js";

export function mapListingInsertError(error: PostgrestError | null): string {
  if (!error) {
    return "商品上架失敗，請稍後再試";
  }

  if (error.code === "42501") {
    return "沒有上架權限，請確認已登入且帳戶可上架商品";
  }

  if (error.code === "PGRST116") {
    return "商品已建立但無法讀取回傳資料，請重新整理後確認";
  }

  if (error.code === "23503") {
    return "所選卡牌或賣家資料無效，請重新選擇卡牌後再試";
  }

  if (error.code === "23514") {
    return "上架資料不符合平台規則，請檢查相片數量與售價";
  }

  return "商品上架失敗，請稍後再試";
}
