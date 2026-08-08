import {
  AUTH_ESCROW_AUTH_FEE_HKD,
  AUTH_ESCROW_SF_LEG_FEE_HKD,
  estimateAuthEscrowCheckoutTotal,
} from "@/lib/auth-escrow/defaults";

export type MemberAuthPaymentSession = {
  sessionId: string;
  amount: number;
  currency: "hkd";
  cardPrice: number;
  authFee: number;
  isMock: true;
};

export function calculateMemberAuthPaymentTotal(cardPrice: number): number {
  return estimateAuthEscrowCheckoutTotal(cardPrice);
}

export function createMemberAuthPaymentSession(input: {
  orderId: string;
  cardPrice: number;
}): MemberAuthPaymentSession {
  const sessionId = `MOCK-${input.orderId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  return {
    sessionId,
    amount: calculateMemberAuthPaymentTotal(input.cardPrice),
    currency: "hkd",
    cardPrice: input.cardPrice,
    authFee: AUTH_ESCROW_AUTH_FEE_HKD,
    isMock: true,
  };
}

export function confirmMemberAuthPayment(sessionId: string): {
  sessionId: string;
  confirmedAt: string;
} {
  return {
    sessionId,
    confirmedAt: new Date().toISOString(),
  };
}

export { AUTH_ESCROW_AUTH_FEE_HKD, AUTH_ESCROW_SF_LEG_FEE_HKD };
