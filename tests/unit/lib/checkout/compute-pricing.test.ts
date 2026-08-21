import { describe, expect, it } from "vitest";
import { AUTH_ESCROW_SF_LEG_FEE_HKD } from "@/lib/auth-escrow/defaults";
import { resolveCheckoutDisplayPricing } from "@/lib/checkout/compute-pricing";
import type { MemberAuthCheckoutSession } from "@/lib/checkout/types";

function buildMemberAuthSession(
  pricing: MemberAuthCheckoutSession["pricing"],
): MemberAuthCheckoutSession {
  return {
    variant: "member_auth",
    orderKind: "member",
    orderId: "order-1",
    orderNumber: "ORD-1",
    isPayable: true,
    paymentExpiresAt: null,
    product: {
      cardName: "Test Card",
      cardNumber: "001",
      setCode: "SV1",
      displayId: "001",
      gradeLabel: "PSA 10",
      imageUrl: "/placeholder.png",
    },
    counterparty: { name: "Seller", handle: "seller" },
    pricing,
    platformAuthFeeHkd: 150,
  };
}

describe("resolveCheckoutDisplayPricing", () => {
  it("fills auth escrow SF legs when DB snapshot is still 0 before prepare", () => {
    const session = buildMemberAuthSession({
      itemSubtotal: 100,
      shippingFee: 0,
      inboundShippingFee: 0,
      outboundShippingFee: 0,
      authFee: 0,
      totalAmount: 0,
    });

    const pricing = resolveCheckoutDisplayPricing(session);

    expect(pricing.inboundShippingFee).toBe(AUTH_ESCROW_SF_LEG_FEE_HKD);
    expect(pricing.outboundShippingFee).toBe(AUTH_ESCROW_SF_LEG_FEE_HKD);
    expect(pricing.authFee).toBe(150);
    expect(pricing.totalAmount).toBe(100 + 150 + AUTH_ESCROW_SF_LEG_FEE_HKD * 2);
  });

  it("keeps persisted auth escrow leg fees after prepare", () => {
    const session = buildMemberAuthSession({
      itemSubtotal: 100,
      shippingFee: 0,
      inboundShippingFee: 30,
      outboundShippingFee: 25,
      authFee: 150,
      totalAmount: 305,
    });

    const pricing = resolveCheckoutDisplayPricing(session);

    expect(pricing.inboundShippingFee).toBe(30);
    expect(pricing.outboundShippingFee).toBe(25);
    expect(pricing.totalAmount).toBe(305);
  });
});
