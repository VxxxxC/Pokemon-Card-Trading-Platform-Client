import type { Enums } from "@/types/supabase";
import type { MemberOrderDbStatus } from "@/app/lib/member-order/p2p";

export type MemberEscrowStatus = Enums<"member_escrow_status">;

export type MemberAuthOrderActions = {
  canPay: boolean;
  canSubmitInbound: boolean;
  canConfirmReceipt: boolean;
  canCancel: boolean;
};

export function getAuthEscrowStepIndexFromStatus(
  escrowStatus: MemberEscrowStatus | null | undefined,
  orderStatus: MemberOrderDbStatus | null | undefined,
): number {
  if (orderStatus === "cancelled" || escrowStatus === "cancelled") {
    return -1;
  }

  if (orderStatus === "completed" || escrowStatus === "released") {
    return 4;
  }

  switch (escrowStatus) {
    case "payment":
      return 0;
    case "custody":
      return 1;
    case "grading":
      return 2;
    case "shipped":
      return 3;
    default:
      return 0;
  }
}

export function getMemberAuthOrderActions(input: {
  persona: "buy" | "sell";
  useAuthentication: boolean;
  escrowStatus: MemberEscrowStatus | null | undefined;
  status: MemberOrderDbStatus | null | undefined;
}): MemberAuthOrderActions {
  const { persona, useAuthentication, escrowStatus, status } = input;

  if (!useAuthentication || status !== "pending") {
    return {
      canPay: false,
      canSubmitInbound: false,
      canConfirmReceipt: false,
      canCancel: false,
    };
  }

  return {
    canPay: persona === "buy" && escrowStatus === "payment",
    canSubmitInbound: persona === "sell" && escrowStatus === "custody",
    canConfirmReceipt: persona === "buy" && escrowStatus === "shipped",
    canCancel:
      persona === "sell" &&
      (escrowStatus === "payment" || escrowStatus === "custody"),
  };
}

export function getAuthEscrowStatusLabel(
  escrowStatus: MemberEscrowStatus | null | undefined,
): string {
  switch (escrowStatus) {
    case "payment":
      return "待付款";
    case "custody":
      return "待寄平台";
    case "grading":
      return "鑑定中";
    case "shipped":
      return "運送中";
    case "released":
      return "已釋放";
    case "cancelled":
      return "已取消";
    default:
      return "進行中";
  }
}
