import type { Tables } from "@/types/supabase";

type MerchantEscrowStatus = Tables<"merchant_orders">["escrow_status"];

export type MerchantSellerActionFlags = {
  canSubmitLogistics: boolean;
  canReviewBuyer: boolean;
};

export function getMerchantSellerActionFlags(input: {
  escrowStatus: MerchantEscrowStatus;
  hasReviewedByMe: boolean;
  requiresAuthentication?: boolean | null;
}): MerchantSellerActionFlags {
  const { escrowStatus, hasReviewedByMe, requiresAuthentication } = input;

  return {
    canSubmitLogistics:
      escrowStatus === "payment_held" && Boolean(requiresAuthentication),
    canReviewBuyer:
      escrowStatus === "completed_and_transferred" && !hasReviewedByMe,
  };
}
