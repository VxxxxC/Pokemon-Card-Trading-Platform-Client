# Platform Rewards v2 — backend

> **Phase 1:** ✅ Ready · **Phase 2:** ✅ Ready (merchant_direct only) · **Phase 2b:** ⏳ auth multicapture coupons

## Phase 1 — Admin templates

Migration: `supabase/migrations/20260813120000_platform_rewards_admin_templates.sql`

| Path | Purpose |
|------|---------|
| `app/actions/admin-rewards.ts` | Admin guard + list / upsert / set status |
| `lib/admin-rewards/*` | Types + RPC parsers |
| `app/admin/campaigns/wizard/*` | 3-step wizard (Step 3 campaign placeholder) |

## Phase 2 — merchant_direct checkout coupons

Migration: `supabase/migrations/20260815120000_merchant_checkout_coupon.sql`

### Schema

| Column / object | Notes |
|-----------------|-------|
| `merchant_orders.coupon_user_reward_id` | Selected wallet coupon |
| `merchant_orders.coupon_type` | Snapshot `discount_coupon` / `free_shipping` |
| `merchant_orders.platform_subsidy_amount` | Platform subsidy (default 0) |
| `merchant_orders.buyer_total_amount` | Buyer pays = gross − subsidy |
| `user_rewards.reserved_merchant_order_id` | Reserve at prepare only; `is_used` set on paid webhook |

### SQL functions / RPCs

| Name | Purpose |
|------|---------|
| `fn_compute_platform_subsidy` | Eligibility + subsidy amount |
| `fn_release_merchant_order_coupon` | Clear order coupon + release reserve |
| `rpc_list_checkout_eligible_coupons` | Checkout picker list + preview |
| `rpc_prepare_merchant_order_payment` | + `p_user_reward_id`; **rejects** `p_use_auth=true` with coupon |
| `rpc_mark_merchant_order_paid` | Ledger uses `buyer_total_amount`; marks coupon used |
| `rpc_finalize_merchant_pending_payment_expiry` | Releases coupon on expiry |
| `rpc_confirm_merchant_buyer_receipt` / `rpc_prepare_merchant_order_payout` | Payout on gross; allows payout > buyer_total |

### Server actions

| Action | Notes |
|--------|-------|
| `listCheckoutEligibleCoupons(orderId, { shippingMethod? })` | `app/actions/checkout-coupons.ts` |
| `createMerchantOrderPaymentIntent(..., { userRewardId? })` | PI `amount` = `buyer_total_amount`; metadata includes subsidy fields |

### Stripe / payout

- `lib/merchant-order/execute-connect-payout.ts`: validates against `buyer_total_amount`; if `merchant_payout > amount_received`, transfer **without** `source_transaction`
- Webhook `payment_intent.canceled` (merchant, non-manual): `fn_release_merchant_order_coupon`
- Webhook `payment_intent.succeeded`: passes `buyer_total_amount` / `platform_subsidy_amount` to `rpc_mark_merchant_order_paid`

### Hard gates (Phase 2)

- `p_use_auth=true` or auth order → coupon rejected
- `meetup` + `free_shipping` → ineligible
- One coupon per order; prepare reserves only (not `is_used`)

## Migrations / env

```bash
bunx supabase db push
bun run supabase:types
```

## Verify (Phase 2)

Partner QA: **[QA_CHECKLIST.md](./QA_CHECKLIST.md)**

1. Push migration + regen types
2. Non-auth SF: $100 item + $45 shipping, free shipping cap $30 → buyer pays $115, `platform_subsidy_amount=30`, `merchant_payout_amount` unchanged
3. Discount min-spend / switch coupon / cancel / 48h expiry release
4. T+7 payout when payout > charge → transfer succeeds (no `source_transaction`)
5. Auth toggle on → prepare with coupon rejected; picker hidden
6. `bunx tsc --noEmit`, `bun run lint`, `bun run build:ci`
