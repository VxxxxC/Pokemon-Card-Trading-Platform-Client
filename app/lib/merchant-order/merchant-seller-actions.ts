import type { Tables } from "@/types/supabase";

type MerchantEscrowStatus = Tables<"merchant_orders">["escrow_status"];

export type MerchantSellerActionFlags = {
  canSubmitLogistics: boolean;
  canReviewBuyer: boolean;
};

export function getMerchantSellerActionFlags(input: {
  escrowStatus: MerchantEscrowStatus;
  hasReviewedByMe: boolean;
}): MerchantSellerActionFlags {
  const { escrowStatus, hasReviewedByMe } = input;

  return {
    canSubmitLogistics: escrowStatus === "payment_held",
    canReviewBuyer:
      escrowStatus === "completed_and_transferred" && !hasReviewedByMe,
  };
}
