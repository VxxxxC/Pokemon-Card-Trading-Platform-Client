import { redirect } from "next/navigation";
import { getInventoryPageBootstrap } from "@/app/actions/inventory";
import type { InventoryInitialData } from "@/app/lib/hooks/useInventory";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { INVENTORY_DEFAULT_PAGE_SIZE } from "@/lib/listings/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { UserInventoryClient } from "./UserInventoryClient";

export async function UserInventoryPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const bootstrapResult = await getInventoryPageBootstrap({
    page: 1,
    pageSize: INVENTORY_DEFAULT_PAGE_SIZE,
    query: "",
  });

  const initialData: InventoryInitialData = bootstrapResult.success
    ? bootstrapResult.data
    : {};

  return (
    <UserInventoryClient
      initialData={initialData}
      bootstrapError={bootstrapResult.success ? undefined : bootstrapResult.error}
    />
  );
}
