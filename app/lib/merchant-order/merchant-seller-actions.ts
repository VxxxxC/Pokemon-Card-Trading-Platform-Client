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
  shippingMethod?: string | null;
  buyerConfirmedAt?: string | null;
}): MerchantSellerActionFlags {
  const {
    escrowStatus,
    hasReviewedByMe,
    requiresAuthentication,
    shippingMethod,
    buyerConfirmedAt,
  } = input;
  const isAuth = Boolean(requiresAuthentication);
  const canReview =
    Boolean(buyerConfirmedAt) || escrowStatus === "completed_and_transferred";

  return {
    canSubmitLogistics:
      isAuth && escrowStatus === "payment_held",
    canSubmitDirectFulfillment:
      !isAuth &&
      escrowStatus === "payment_held" &&
      shippingMethod !== "meetup",
    canReviewBuyer: canReview && !hasReviewedByMe,
  };
}
