# Merchant Trading Orders — Backend Handoff

## Status

- **Backend:** ✅ Ready (list RPC + `getMerchantOrderDetail` + auth inbound + **non-auth direct fulfillment**)
- **Frontend:** ✅ Wired — type-aware timelines (auth vs direct) + SF/meetup fulfillment UI
- **Stripe:** ✅ Payment + payout via [merchant-checkout](../merchant-checkout/backend.md); auth grading via [admin-grading](../admin-grading/backend.md)

## Seller actions

| Action | Scope | RPC / action |
|--------|-------|----------------|
| Submit inbound tracking | Auth orders at `payment_held` | `submitMerchantLogistics` → `rpc_submit_merchant_auth_inbound_tracking` |
| Submit direct fulfillment | Non-auth at `payment_held` | `submitMerchantDirectFulfillment` → `rpc_submit_merchant_direct_fulfillment` |
| Wait for buyer confirm | Non-auth at `shipped` | Read-only — buyer `completeMerchantOrder` |
| Wait for admin grading | `authenticating` / `authenticated` | Read-only; outbound by admin |
| Review buyer | `completed_and_transferred` | `ReviewModal` |

`getMerchantSellerActionFlags()`:

- `canSubmitLogistics` = `payment_held` **and** `requires_authentication` (auth inbound only)
- `canSubmitDirectFulfillment` = `payment_held` **and** `!requires_authentication`

`fn_merchant_order_needs_seller_action` (migration `20260803120100`):

- Auth: `payment_held` + no `inbound_tracking_no`
- Non-auth: `payment_held` (awaiting merchant ship/meetup confirm)

## `escrow_state` → seller UX

| Status | Auth order | Non-auth order |
|--------|------------|----------------|
| `pending_payment` | Wait for buyer checkout | Same |
| `payment_held` | Submit inbound tracking | **Submit SF tracking or meetup confirm** |
| `shipped` | N/A | Read-only — show outbound tracking or「已面交」; wait for buyer |
| `authenticating` | Read-only — grading | N/A |
| `authenticated` | Read-only — show `outbound_tracking_no` if set | N/A |
| `completed_and_transferred` | Review buyer | Same |

## Direct fulfillment RPC

`rpc_submit_merchant_direct_fulfillment(p_order_id, p_merchant_id, p_tracking_no?)`

- Guards: `auth.uid() = merchant_id`, `requires_authentication = false`, `escrow_status = payment_held`, `stripe_payment_intent_id IS NOT NULL`
- `shipping_method = 'sf'`: `p_tracking_no` required → writes `outbound_tracking_no`
- `shipping_method = 'meetup'`: `p_tracking_no` optional → `outbound_tracking_no` stays null
- Sets `escrow_status = shipped`

`rpc_prepare_merchant_order_payout` non-auth branch now requires `shipped` (auth branch unchanged).

## Migrations

| File | Content |
|------|---------|
| `20260803120000_escrow_state_shipped.sql` | `ALTER TYPE escrow_state ADD VALUE 'shipped'` |
| `20260803120100_merchant_direct_shipped.sql` | `rpc_submit_merchant_direct_fulfillment`; patch payout + `fn_merchant_order_is_open` / `fn_merchant_order_needs_seller_action`; rebuild `search_merchant_trading_orders` |

## Server action: `getMerchantOrderDetail`

Returns `outboundTrackingNo`, `itemSubtotal`, `shippingFee`, `shippingMethod`, `totalAmount`, `canSubmitDirectFulfillment` for receipt + fulfillment UI.

## Dev note — existing `payment_held` non-auth orders

Orders created before this migration (e.g. `ORD-2026-CAD236`) remain at `payment_held`. Merchant must call `submitMerchantDirectFulfillment` (or run the RPC manually) to reach `shipped` before buyer confirm works.

## Pending payment expiry

48h unpaid merchant orders: `rpc_finalize_merchant_pending_payment_expiry` + cron `/api/cron/expire-merchant-pending-payment` (see merchant-checkout backend §10).

## How to verify

```bash
bunx supabase db push
bun run supabase:types
bunx tsc --noEmit && bun run lint && bun run build:ci
```

1. Non-auth SF: buyer pays → seller submits tracking → `shipped` → buyer confirms → `completed_and_transferred`
2. Non-auth meetup: buyer pays → seller「確認已面交」→ `shipped` → buyer confirms
3. Auth: seller submits inbound → read-only until admin intake
4. `count_needs_action` counts auth missing inbound **and** non-auth at `payment_held`
