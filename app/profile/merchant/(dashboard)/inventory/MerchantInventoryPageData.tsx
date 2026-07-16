import { redirect } from "next/navigation";
import { getInventoryPageBootstrap } from "@/app/actions/inventory";
import type { InventoryInitialData } from "@/app/lib/hooks/useInventory";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { INVENTORY_DEFAULT_PAGE_SIZE } from "@/lib/listings/constants";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { MerchantInventoryClient } from "./MerchantInventoryClient";

export async function MerchantInventoryPageData() {
  if (!isSupabaseConfigured()) {
    redirect("/auth?redirect=/profile/merchant/inventory");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth?redirect=/profile/merchant/inventory");
  }

  const bootstrapResult = await getInventoryPageBootstrap({
    page: 1,
    pageSize: INVENTORY_DEFAULT_PAGE_SIZE,
    query: "",
    sellerPersona: "merchant",
  });

  const initialData: InventoryInitialData = bootstrapResult.success
    ? bootstrapResult.data
    : {};

  return (
    <MerchantInventoryClient
      initialData={initialData}
      bootstrapError={bootstrapResult.success ? undefined : bootstrapResult.error}
    />
  );
}
