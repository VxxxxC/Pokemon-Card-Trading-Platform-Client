/**
 * B2C 商戶託管結帳計價（Payment Milestone 1）。
 *
 * 全額付訖：商品成交價 + 運費 + 鑑定費一次性鎖定平台託管。
 * 優惠券未接後端，暫不計入（Milestone 2）。
 */

export const SF_SHIPPING_FEE = 30;
export const MEETUP_SHIPPING_FEE = 0;
export const AUTHENTICATION_FEE = 150;

export const MERCHANT_SHIPPING_METHODS = ["sf", "meetup"] as const;
export type MerchantShippingMethod = (typeof MERCHANT_SHIPPING_METHODS)[number];

export function isMerchantShippingMethod(
  value: unknown,
): value is MerchantShippingMethod {
  return (
    typeof value === "string" &&
    (MERCHANT_SHIPPING_METHODS as readonly string[]).includes(value)
  );
}

export function resolveShippingFee(method: MerchantShippingMethod): number {
  return method === "sf" ? SF_SHIPPING_FEE : MEETUP_SHIPPING_FEE;
}

export type MerchantCheckoutAmounts = {
  itemSubtotal: number;
  shippingFee: number;
  authFee: number;
  totalAmount: number;
};

export function computeMerchantCheckoutAmounts(input: {
  itemSubtotal: number;
  shippingMethod: MerchantShippingMethod;
  useAuth: boolean;
}): MerchantCheckoutAmounts {
  const itemSubtotal = Math.max(Math.round(input.itemSubtotal), 0);
  const shippingFee = resolveShippingFee(input.shippingMethod);
  const authFee = input.useAuth ? AUTHENTICATION_FEE : 0;

  return {
    itemSubtotal,
    shippingFee,
    authFee,
    totalAmount: itemSubtotal + shippingFee + authFee,
  };
}

/** Stripe 以最小貨幣單位（仙）收費。 */
export function toStripeCents(amountHkd: number): number {
  return Math.round(amountHkd * 100);
}
