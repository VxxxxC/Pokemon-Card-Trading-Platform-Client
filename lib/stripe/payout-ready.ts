import type { Tables } from "@/types/supabase";

export type MerchantKycPayoutFlags = Pick<
  Tables<"kyc_records">,
  | "kyc_status"
  | "stripe_account_id"
  | "stripe_charges_enabled"
  | "stripe_payouts_enabled"
>;

/** Fail-closed: merchant can receive escrow payouts only when KYC verified + Stripe ready. */
export function isMerchantPayoutReady(
  kyc: MerchantKycPayoutFlags | null | undefined,
): boolean {
  if (!kyc) {
    return false;
  }

  return (
    kyc.kyc_status === "verified" &&
    kyc.stripe_charges_enabled === true &&
    kyc.stripe_payouts_enabled === true
  );
}
