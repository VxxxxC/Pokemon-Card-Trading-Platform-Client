# Merchant Trading Orders — Frontend Handoff

## Status

- **List page:** ✅ Wired (`/profile/merchant/trading`)
- **Order detail:** ✅ Wired (`/profile/merchant/orderDetail/[id]`)

## Files wired

| File | Role |
|------|------|
| `MerchantOrderDetailView.tsx` | Auth inbound form; non-auth read-only at `payment_held`; auth grading states read-only |
| `MerchantOrderRow.tsx` | List row + `pending_payment` label override |

## Acceptance checklist

- [x] Trading list loads from DB
- [x] Auth `payment_held` — inbound tracking form calls `submitMerchantLogistics`
- [x] Non-auth `payment_held` — no fake「移交保管」button; wait-for-buyer copy
- [x] `authenticating` / `authenticated` — read-only (no mock grading buttons)
- [x] `completed_and_transferred` — review CTA when eligible
- [x] Receipt uses DB `item_subtotal` / `shipping_fee` / `total_amount`

## Out of scope

- Non-auth seller outbound tracking RPC (buyer confirms at `payment_held`)
- Merchant dashboard overview mock strip

See [backend.md](./backend.md).
