import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createExpressAccountForKycApplication } from "@/lib/stripe/connect-kyc";
import { getSiteUrl } from "@/lib/auth/site-url";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/supabase";

type ProfileRoleRow = Pick<Tables<"profiles">, "role">;

/**
 * Merchant Stripe Connect onboarding 入口（merchant dashboard CTA）。
 * 讀取 kyc_records.stripe_account_id（approve pipeline 建立；如 Stripe
 * 步驟當時失敗，此處以已批准申請資料重試補建）→ 產生 account link → redirect。
 * 資料已於 approve 時全量 prefill，onboarding 理想情況只需確認 + 簽 Stripe ToS。
 */
export async function GET() {
  const siteUrl = await getSiteUrl();
  const fallback = (reason: string) =>
    NextResponse.redirect(`${siteUrl}/profile/merchant?stripe=${reason}`);

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
      return NextResponse.redirect(`${siteUrl}/profile/user`);
    }

    const admin = createAdminClient();
    const { data: kycRecord } = await admin
      .from("kyc_records")
      .select("stripe_account_id")
      .eq("merchant_id", user.id)
      .maybeSingle();

    let stripeAccountId = kycRecord?.stripe_account_id ?? null;

    // Approve pipeline 的 Stripe 步驟失敗時的重試路徑
    if (!stripeAccountId) {
      const { data: application } = await admin
        .from("kyc_applications")
        .select("*")
        .eq("user_id", user.id)
        .eq("status", "approved")
        .maybeSingle();

      if (!application) {
        return fallback("no-kyc");
      }

      const account = await createExpressAccountForKycApplication(application);
      stripeAccountId = account.id;

      await admin
        .from("kyc_records")
        .update({ stripe_account_id: stripeAccountId })
        .eq("merchant_id", user.id);
    }

    const link = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: `${siteUrl}/api/stripe/connect/onboard`,
      return_url: `${siteUrl}/profile/merchant?stripe=return`,
      type: "account_onboarding",
    });

    return NextResponse.redirect(link.url);
  } catch (error) {
    console.error("[stripe/connect/onboard]", error);
    return fallback("error");
  }
}
