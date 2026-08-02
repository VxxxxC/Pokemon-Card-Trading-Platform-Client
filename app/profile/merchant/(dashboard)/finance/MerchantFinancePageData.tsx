import { redirect } from "next/navigation";
import { maskStripeAccountId } from "@/lib/stripe/connect-dashboard";
import { isMerchantPayoutReady } from "@/lib/stripe/payout-ready";
import { isStripeConnectAccountId } from "@/lib/stripe/sync-kyc-connect-flags";
import { getOptionalAuthUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Tables } from "@/types/supabase";
import { getMerchantFinanceSummary } from "@/app/actions/merchant-finance";
import { MerchantFinanceClient } from "./MerchantFinanceClient";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

type KycConnectRow = Pick<
  Tables<"kyc_records">,
  | "kyc_status"
  | "stripe_account_id"
  | "stripe_charges_enabled"
  | "stripe_payouts_enabled"
>;

export async function MerchantFinancePageData() {
  if (!isSupabaseConfigured()) {
    redirect("/auth");
  }

  const user = await getOptionalAuthUser();
  if (!user) {
    redirect("/auth");
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle<ProfileRoleRow>();

  if (profile?.role !== "merchant") {
    redirect("/profile/user");
  }

  const admin = createAdminClient();
  const { data: kycRecord } = await admin
    .from("kyc_records")
    .select(
      "kyc_status, stripe_account_id, stripe_charges_enabled, stripe_payouts_enabled",
    )
    .eq("merchant_id", user.id)
    .maybeSingle<KycConnectRow>();

  const stripeAccountId = isStripeConnectAccountId(kycRecord?.stripe_account_id)
    ? kycRecord.stripe_account_id
    : null;

  const financeSummary = await getMerchantFinanceSummary();
  const monthEarned = financeSummary.success
    ? financeSummary.data.monthEarned
    : 0;
  const recentSettlements = financeSummary.success
    ? financeSummary.data.recentSettlements
    : [];

  return (
    <MerchantFinanceClient
      stripeConnected={isMerchantPayoutReady(kycRecord)}
      stripeAccountId={stripeAccountId}
      stripeAccountLabel={
        stripeAccountId ? maskStripeAccountId(stripeAccountId) : null
      }
      monthEarned={monthEarned}
      recentSettlements={recentSettlements}
    />
  );
}
