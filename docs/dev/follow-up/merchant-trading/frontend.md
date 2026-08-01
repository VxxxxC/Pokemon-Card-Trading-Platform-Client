# Merchant Trading Orders — Frontend Handoff

## Status

- **List page:** ✅ Wired (`/profile/merchant/trading`)
- **Order detail:** ✅ Wired (`/profile/merchant/orderDetail/[id]`)
- **Buyer confirm (B2C):** ✅ Gated on `shipped` for non-auth; auth rules unchanged
- **Timelines:** ✅ Type-aware (`merchant_auth_seller` / `merchant_direct`)
- **Photo gallery:** ✅ `OrderListingPhotoGrid` — 2-col mobile / 3-col desktop

## Files wired

| File | Role |
|------|------|
| `MerchantOrderDetailView.tsx` | Auth inbound form; **non-auth SF tracking + meetup confirm**; type-aware timelines; real Stripe fields |
| `MerchantB2cDirectTimeline.tsx` | Non-auth B2C 3–4 step timeline |
| `MerchantAuthSellerTimeline.tsx` | Auth B2C seller timeline |
| `MerchantOrderRow.tsx` | List row + `statusLabelOverride` (待發貨 / 運送中 / 鑑定中) |
| `MemberOrderDetailView.tsx` | Merchant B2C buyer timeline + confirm via `canCompleteMerchantPurchase` |
| `UserTradingClient.tsx` | Merchant non-auth buyer badges (待發貨 / 運送中) |
| `UserOrderRow.tsx` | List-row confirm gated by `canCompleteMerchantPurchase` |
| `OrderListingPhotoGrid.tsx` | Shared 2/3-col listing photo grid + `ImageViewer` zoom |
| `lib/merchant-order/order-timeline-steps.ts` | Shared step definitions + index helpers |

## Buyer confirm gates (`canCompleteMerchantPurchase`)

| Order type | When buyer can confirm |
|------------|------------------------|
| Merchant B2C non-auth | `escrow_status = shipped` |
| Merchant B2C auth | `authenticated` + `auth_result = passed` + outbound tracking + `payment_capture_status = fully_captured` |
| Member P2P meetup | Unchanged — `status = pending`, non-auth |
| Member P2P auth | Unchanged — detail page `canConfirmReceipt` at `shipped` + fully captured |

## Seller fulfillment UI (non-auth)

| `shipping_method` | At `payment_held` + `canSubmitDirectFulfillment` |
|-------------------|--------------------------------------------------|
| `sf` | Tracking input +「提交物流單號」→ `submitMerchantDirectFulfillment` |
| `meetup` |「確認已面交」button (no tracking) |

At `shipped`: show outbound tracking (SF) or「已面交」(meetup); wait for buyer confirm.

## Acceptance checklist

- [x] Trading list loads from DB with label overrides
- [x] Auth `payment_held` — inbound tracking form calls `submitMerchantLogistics`
- [x] Non-auth `payment_held` — SF/meetup fulfillment CTA (no fake custody/grading steps)
- [x] Non-auth `shipped` — read-only seller view; buyer can confirm
- [x] `authenticating` / `authenticated` — read-only (no mock grading buttons)
- [x] `completed_and_transferred` — review CTA when eligible
- [x] Receipt uses DB `item_subtotal` / `shipping_fee` / `total_amount`
- [x] Stripe block shows real `stripe_payment_intent_id`, `stripe_transfer_id`, `commission_amount`
- [x] Buyer list/detail: merchant auth orders do **not** show confirm until outbound + authenticated
- [x] Buyer list/detail: merchant non-auth shows「待發貨」at `payment_held`,「運送中」at `shipped`
- [x] Order detail photo grid: 2 columns mobile, 3 columns desktop; click opens `ImageViewer`

## Manual E2E

1. **Non-auth B2C (SF):** buyer pays → merchant submits tracking → buyer confirms at `shipped` → seller page shows transfer ID + commission
2. **Non-auth B2C (meetup):** buyer pays → merchant「確認已面交」→ buyer confirms
3. **Auth B2C:** buyer list/detail no confirm until `authenticated` + outbound; auth timeline visible
4. **Member P2P auth:** unchanged confirm on detail page
5. **Regression:** P2P meetup / member auth timelines unchanged

## Out of scope

- Merchant dashboard overview mock strip
- Admin grading workbench (auth outbound)

See [backend.md](./backend.md).
