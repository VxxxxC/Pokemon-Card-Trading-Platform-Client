import type { MemberEscrowStatus } from "@/app/lib/member-order/auth-escrow";
import type { Tables } from "@/types/supabase";

type MerchantEscrowStatus = Tables<"merchant_orders">["escrow_status"];

export type MerchantBuyerActionFlags = {
  canCompleteMerchantPurchase: boolean;
};

/** Map merchant escrow_state to member_escrow_status for buyer auth timeline UI. */
export function mapMerchantEscrowToMemberEscrowStatus(
  escrowStatus: MerchantEscrowStatus,
  requiresAuthentication: boolean,
): MemberEscrowStatus | null {
  if (!requiresAuthentication) {
    switch (escrowStatus) {
      case "pending_payment":
        return "payment";
      case "payment_held":
        return "payment";
      case "shipped":
        return "shipped";
      case "completed_and_transferred":
        return "released";
      case "refunded":
        return "cancelled";
      default:
        return null;
    }
  }

  switch (escrowStatus) {
    case "pending_payment":
      return "payment";
    case "payment_held":
      return "custody";
    case "authenticating":
      return "grading";
    case "authenticated":
      return "shipped";
    case "completed_and_transferred":
      return "released";
    case "refunded":
      return "cancelled";
    default:
      return null;
  }
}

export function getMerchantBuyerActionFlags(input: {
  escrowStatus: MerchantEscrowStatus;
  requiresAuthentication: boolean;
  shippingMethod?: string | null;
  outboundTrackingNo?: string | null;
  authResult?: string | null;
  paymentCaptureStatus?: string | null;
}): MerchantBuyerActionFlags {
  const {
    escrowStatus,
    requiresAuthentication,
    shippingMethod,
    outboundTrackingNo,
    authResult,
    paymentCaptureStatus,
  } = input;

  if (requiresAuthentication) {
    const hasOutbound =
      typeof outboundTrackingNo === "string" &&
      outboundTrackingNo.trim().length > 0;

    return {
      canCompleteMerchantPurchase:
        escrowStatus === "authenticated" &&
        authResult === "passed" &&
        hasOutbound &&
        paymentCaptureStatus === "fully_captured",
    };
  }

  const isMeetup = shippingMethod === "meetup";

  return {
    canCompleteMerchantPurchase:
      (isMeetup && escrowStatus === "payment_held") ||
      escrowStatus === "shipped",
  };
}
