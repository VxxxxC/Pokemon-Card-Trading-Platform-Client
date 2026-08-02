import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { getSiteUrl } from "@/lib/auth/site-url";
import { stripe } from "@/lib/stripe";
import {
  isStripeConnectAccountId,
  syncKycConnectFlagsFromStripeAccount,
} from "@/lib/stripe/sync-kyc-connect-flags";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;
type KycStripeRow = Pick<Tables<"kyc_records">, "stripe_account_id">;

/**
 * Stripe Connect onboarding return URL。
 * Merchant 完成 hosted onboarding 後主動 sync flags 入 kyc_records（webhook 備援）。
 */
export async function GET() {
  const siteUrl = await getSiteUrl();
  const redirect = (status: string) =>
    NextResponse.redirect(`${siteUrl}/profile/merchant?stripe=${status}`);

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${siteUrl}/auth`);
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle<ProfileRoleRow>();

    if (profile?.role !== "merchant") {
      return redirect("sync-error");
    }

    const admin = createAdminClient();
    const { data: kycRecord, error: loadError } = await admin
      .from("kyc_records")
      .select("stripe_account_id")
      .eq("merchant_id", user.id)
      .maybeSingle<KycStripeRow>();

    if (loadError || !isStripeConnectAccountId(kycRecord?.stripe_account_id)) {
      return redirect("sync-error");
    }

    const account = await stripe.accounts.retrieve(kycRecord.stripe_account_id);
    const sync = await syncKycConnectFlagsFromStripeAccount(admin, account);

    if (!sync.ok) {
      console.error("[stripe/connect/return] sync failed", sync.error);
      return redirect("sync-error");
    }

    revalidatePath("/profile/merchant");
    return redirect("synced");
  } catch (error) {
    console.error("[stripe/connect/return]", error);
    return redirect("sync-error");
  }
}
