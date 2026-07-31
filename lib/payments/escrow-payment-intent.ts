import type Stripe from "stripe";

/** Manual PI opts for staged auth_fee + goods capture (Stripe multicapture). */
export const AUTH_ESCROW_PAYMENT_METHOD_OPTIONS = {
  card: { request_multicapture: "if_available" },
} as const satisfies Stripe.PaymentIntentCreateParams["payment_method_options"];
