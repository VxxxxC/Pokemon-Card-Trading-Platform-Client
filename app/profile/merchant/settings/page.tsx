import { redirect } from "next/navigation";
import { getMerchantSettings } from "@/app/actions/merchant-settings";
import { MerchantSettingsClient } from "./MerchantSettingsClient";
import { MerchantSettingsError } from "./MerchantSettingsError";

export default async function MerchantSettingsPage() {
  const result = await getMerchantSettings();

  if (!result.success) {
    if (result.error === "未登入") {
      redirect("/auth?redirect=/profile/merchant/settings");
    }

    return <MerchantSettingsError message={result.error} />;
  }

  return <MerchantSettingsClient initialData={result.data} />;
}
