import { MEMBER_AUTH_SERVICE_FEE } from "@/app/lib/member-order/p2p";

export type MemberAuthPaymentSession = {
  sessionId: string;
  amount: number;
  currency: "hkd";
  cardPrice: number;
  authFee: number;
  isMock: true;
};

export function calculateMemberAuthPaymentTotal(cardPrice: number): number {
  return cardPrice + MEMBER_AUTH_SERVICE_FEE;
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
    authFee: MEMBER_AUTH_SERVICE_FEE,
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
