# Auth Escrow v2 — Frontend

> **Status:** 🟡 Phase B wired (checkout breakdown)  
> **Backend:** [backend.md](./backend.md) · **Plan:** [plan.md](./plan.md)

## Touchpoints

| Route / component | Change |
|-------------------|--------|
| [`app/checkout/[id]/CheckoutClient.tsx`](../../../app/checkout/[id]/CheckoutClient.tsx) | Auth variants pass `inboundShippingFee` / `outboundShippingFee`; `showAuthEscrowShippingRows` |
| [`app/checkout/[id]/components/CheckoutOrderSummary.tsx`](../../../app/checkout/[id]/components/CheckoutOrderSummary.tsx) | Two SF leg rows for auth escrow |
| [`lib/checkout/compute-pricing.ts`](../../../lib/checkout/compute-pricing.ts) | `member_auth` / `merchant_auth` / direct+auth toggle |
| [`lib/checkout/map-member-session.ts`](../../../lib/checkout/map-member-session.ts) | Maps inbound/outbound from order snapshot |
| [`lib/checkout/map-merchant-session.ts`](../../../lib/checkout/map-merchant-session.ts) | Same for merchant auth |

## Acceptance checklist (Partner QA)

Use a **new** auth order after Phase B migration (`db push`).

Example: HK$100 card → total **HK$310** (auth $150 + inbound $30 + outbound $30).

- [ ] Member `/checkout/{orderId}` shows **four** amount lines: 卡價、鑑定費、運費（賣家→平台）、運費（平台→買家）
- [ ] Merchant `merchant_auth` checkout shows the same four lines
- [ ] `merchant_direct` with **鑑定開關 ON** preview matches v2 amounts before pay
- [ ] Stripe PI authorize = **buyer total** (e.g. $310)
- [ ] Admin intake capture = **$180** ($150 + $30 inbound)
- [ ] Admin pass capture = **$130** ($100 + $30 outbound)
- [ ] No single「運費 HK$0」row on auth-only checkout (replaced by two leg rows)

## Out of scope (Phase B)

- Fail/refund UI (Phase C)
- Auth checkout coupons / picker subsidy (Phase D — E2E B2b skipped)

## Verify

```bash
bun run dev
# Manual: open checkout for new member_auth or merchant_auth order
```
