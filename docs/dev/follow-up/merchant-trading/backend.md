# Merchant Trading Orders — Backend Handoff

## Status

- **Backend:** ✅ Ready (list RPC + `getMerchantOrderDetail` + `submitMerchantLogistics` auth inbound)
- **Frontend:** ✅ Wired — seller detail aligned with auth vs non-auth escrow states
- **Stripe:** ✅ Payment + payout via [merchant-checkout](../merchant-checkout/backend.md); auth grading via [admin-grading](../admin-grading/backend.md)

## Seller actions

| Action | Scope | RPC / action |
|--------|-------|----------------|
| Submit inbound tracking | Auth orders at `payment_held` | `submitMerchantLogistics` → `rpc_submit_merchant_auth_inbound_tracking` |
| Wait for buyer confirm | Non-auth at `payment_held` | No seller mutation — buyer `completeMerchantOrder` |
| Wait for admin grading | `authenticating` / `authenticated` | Read-only; outbound by admin |
| Review buyer | `completed_and_transferred` | `ReviewModal` |

`getMerchantSellerActionFlags().canSubmitLogistics` = `payment_held` **and** `requires_authentication`.

`fn_merchant_order_needs_seller_action` = auth + `payment_held` + no `inbound_tracking_no` (migration `20260731120000`).

## `escrow_state` → seller UX

| Status | Auth order | Non-auth order |
|--------|------------|----------------|
| `pending_payment` | Wait for buyer checkout | Same |
| `payment_held` | Submit inbound tracking | Read-only — wait for buyer confirm |
| `authenticating` | Read-only — grading | N/A |
| `authenticated` | Read-only — show `outbound_tracking_no` if set | N/A |
| `completed_and_transferred` | Review buyer | Same |

## Server action: `getMerchantOrderDetail`

Returns `outboundTrackingNo`, `itemSubtotal`, `shippingFee`, `shippingMethod`, `totalAmount` for receipt display.

## Pending payment expiry

48h unpaid merchant orders: `rpc_finalize_merchant_pending_payment_expiry` + cron `/api/cron/expire-merchant-pending-payment` (see merchant-checkout backend §9).

## How to verify

```bash
bunx supabase db push
bun run supabase:types
bunx tsc --noEmit && bun run build:ci
```

1. Non-auth: buyer pays → seller detail shows wait message (no fake CTA)
2. Auth: seller submits inbound → read-only until admin intake
3. `count_needs_action` only counts auth orders missing inbound tracking
