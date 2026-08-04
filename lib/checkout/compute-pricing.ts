import {
  AUTHENTICATION_FEE,
  computeCourierShippingFee,
} from "@/lib/merchant-checkout/pricing";
import type {
  CheckoutSession,
  MerchantDirectCheckoutSession,
  MerchantDirectFormState,
} from "@/lib/checkout/types";

export function computeMerchantDirectPricing(
  session: MerchantDirectCheckoutSession,
  form: MerchantDirectFormState,
  options?: { platformSubsidy?: number },
): {
  shippingFee: number;
  authFee: number;
  grossTotalAmount: number;
  platformSubsidy: number;
  totalAmount: number;
} {
  const showDirectDelivery = !form.authServiceEnabled;
  const shippingFee =
    !showDirectDelivery || form.shippingType !== "sf"
      ? 0
      : computeCourierShippingFee({
          shippingMethod: "sf",
          baseFee: session.baseCourierShippingFee,
          extraFee: session.listingExtraShippingFee,
        });
  const authFee = form.authServiceEnabled ? AUTHENTICATION_FEE : 0;
  const grossTotalAmount = session.pricing.itemSubtotal + shippingFee + authFee;
  const platformSubsidy = Math.max(0, Number(options?.platformSubsidy ?? 0));
  const totalAmount = Math.max(0, grossTotalAmount - platformSubsidy);

  return {
    shippingFee,
    authFee,
    grossTotalAmount,
    platformSubsidy,
    totalAmount,
  };
}

export function resolveCheckoutDisplayPricing(
  session: CheckoutSession,
  form?: MerchantDirectFormState,
  options?: { platformSubsidy?: number },
): {
  shippingFee: number;
  authFee: number;
  grossTotalAmount: number;
  platformSubsidy: number;
  totalAmount: number;
} {
  if (session.variant === "merchant_direct" && form) {
    return computeMerchantDirectPricing(session, form, options);
  }

  return {
    shippingFee: session.pricing.shippingFee,
    authFee: session.pricing.authFee,
    grossTotalAmount: session.pricing.totalAmount,
    platformSubsidy: 0,
    totalAmount: session.pricing.totalAmount,
  };
}
