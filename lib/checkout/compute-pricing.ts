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
): { shippingFee: number; authFee: number; totalAmount: number } {
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
  const totalAmount = session.pricing.itemSubtotal + shippingFee + authFee;

  return { shippingFee, authFee, totalAmount };
}

export function resolveCheckoutDisplayPricing(
  session: CheckoutSession,
  form?: MerchantDirectFormState,
): { shippingFee: number; authFee: number; totalAmount: number } {
  if (session.variant === "merchant_direct" && form) {
    return computeMerchantDirectPricing(session, form);
  }

  return {
    shippingFee: session.pricing.shippingFee,
    authFee: session.pricing.authFee,
    totalAmount: session.pricing.totalAmount,
  };
}
