import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { searchAdminGradingOrders } from "@/app/actions/admin-grading";
import { isCurrentUserAdmin } from "@/lib/auth/require-admin";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { AdminGradingClient } from "./AdminGradingClient";

export const metadata: Metadata = {
  title: "鑑定工作台 — HKCardVault Admin",
  description: "統一處理 Member C2C 與 Merchant B2C 鑑定訂單入庫、鑑定、出庫與退款",
};

export default async function AdminGradingPage() {
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

  const result = await searchAdminGradingOrders({
    tab: "awaiting_intake",
    page: 1,
    pageSize: 20,
  });

  return (
    <AdminGradingClient
      initialRows={result.success ? result.data.rows : []}
      initialTotal={result.success ? result.data.total : 0}
      loadError={result.success ? null : result.error}
    />
  );
}
