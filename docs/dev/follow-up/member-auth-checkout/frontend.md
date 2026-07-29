# Member Auth Checkout — Frontend

## Payment UI

Order detail only: `/profile/user/orderDetail/[id]`

| Condition | Panel |
|-----------|--------|
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` set | `MemberAuthStripePaymentPanel` |
| Otherwise (dev) | `MemberAuthMockPaymentPanel` |

Files:

- `MemberAuthStripePaymentPanel.tsx` — Payment Element + poll `getMemberAuthPaymentStatus`
- `MemberOrderDetailView.tsx` — switches panel when `escrowStatus=payment && canPay`

OfferCard / buy-now `paymentHref` unchanged (still order detail).

## Checklist

- [ ] Auth order at `payment` shows Stripe form (not mock) when publishable key set
- [ ] `4242…` test card → webhook → `custody` + timeline「待寄平台」
- [ ] P2P order (no auth) has no payment panel
- [ ] Production: mock pay button disabled
