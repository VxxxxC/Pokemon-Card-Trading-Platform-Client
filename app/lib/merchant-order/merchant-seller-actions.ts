import type { Tables } from "@/types/supabase";

type MerchantEscrowStatus = Tables<"merchant_orders">["escrow_status"];

export type MerchantSellerActionFlags = {
  /** Auth orders: submit inbound tracking at payment_held. */
  canSubmitLogistics: boolean;
  /** Non-auth orders: mark shipped / meetup done at payment_held. */
  canSubmitDirectFulfillment: boolean;
  canReviewBuyer: boolean;
};

export function getMerchantSellerActionFlags(input: {
  escrowStatus: MerchantEscrowStatus;
  hasReviewedByMe: boolean;
  requiresAuthentication?: boolean | null;
}): MerchantSellerActionFlags {
  const { escrowStatus, hasReviewedByMe, requiresAuthentication } = input;
  const isAuth = Boolean(requiresAuthentication);

  return {
    canSubmitLogistics:
      isAuth && escrowStatus === "payment_held",
    canSubmitDirectFulfillment:
      !isAuth && escrowStatus === "payment_held",
    canReviewBuyer:
      escrowStatus === "completed_and_transferred" && !hasReviewedByMe,
  };
}
