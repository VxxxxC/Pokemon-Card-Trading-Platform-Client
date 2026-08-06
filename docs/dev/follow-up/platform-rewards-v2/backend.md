# Platform Rewards v2 — backend

> **Phase 1:** ✅ Partner verified · **Phase 2:** ✅ Partner verified (merchant_direct) · **Phase 2b:** 🟡 auth multicapture coupons

## Phase 1 — Admin templates

Migration: `supabase/migrations/20260813120000_platform_rewards_admin_templates.sql`

| Path | Purpose |
|------|---------|
| `app/actions/admin-rewards.ts` | Admin guard + list / upsert / set status |
| `lib/admin-rewards/*` | Types + RPC parsers |
| `app/admin/campaigns/wizard/*` | 3-step wizard (Step 3 campaign placeholder) |

## Phase 2 — merchant_direct checkout coupons

Migrations: `20260815120000_merchant_checkout_coupon.sql`, `20260815130000_fix_fn_compute_platform_subsidy_stable.sql`

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
| `fn_compute_platform_subsidy` | Eligibility + subsidy amount (STABLE, no FOR UPDATE) |
| `fn_release_merchant_order_coupon` | Clear order coupon + release reserve |
| `rpc_list_checkout_eligible_coupons` | Checkout picker list + preview |
| `rpc_prepare_merchant_order_payment` | + `p_user_reward_id`; non-auth path |
| `rpc_mark_merchant_order_paid` | Ledger uses `buyer_total_amount`; marks coupon used |
| `rpc_finalize_merchant_pending_payment_expiry` | Releases coupon on expiry |
| `rpc_confirm_merchant_buyer_receipt` / `rpc_prepare_merchant_order_payout` | Payout on gross; allows payout > buyer_total |

### Hard gates (Phase 2 direct)

- `meetup` + `free_shipping` → ineligible
- `requires_authentication: false` coupons blocked on auth orders (Phase 2b opens auth path)
- One coupon per order; prepare reserves only (not `is_used`)

## Phase 2b — merchant_auth checkout coupons

Migration: `supabase/migrations/20260816120000_merchant_auth_checkout_coupon.sql`

### Amount semantics (auth + coupon)

| Field | Formula |
|-------|---------|
| `shipping_fee` (snapshot) | Quoted SF via `fn_merchant_checkout_shipping_fee` when free-shipping coupon; else `0` on auth path |
| `total_amount` (gross) | `item_subtotal + auth_fee + shipping_fee_snapshot` |
| `platform_subsidy_amount` | Discount on item, or `min(quoted_sf, cap)` for free-shipping |
| `buyer_total_amount` | `total_amount − platform_subsidy_amount` (PI authorize amount) |
| Goods multicapture | `goods_cents = buyer_total_amount − auth_fee` |
| Finalize goods capture | Cumulative `amount_received` must equal `buyer_total_amount` |

### New / patched RPCs

| Name | Change |
|------|--------|
| `fn_compute_platform_subsidy` | Auth path enabled; `requires_authentication` enforcement |
| `rpc_list_checkout_eligible_coupons` | + `p_use_auth`; lists auth-eligible coupons |
| `rpc_prepare_merchant_order_payment` | Coupons when `p_use_auth=true` |
| `rpc_prepare_goods_capture` | Merchant goods amount from `buyer_total − auth_fee` |
| `rpc_finalize_goods_capture` | Merchant expected cents = `buyer_total_amount` |
| `fn_restore_merchant_order_coupon_on_void` | Grading fail void restores `is_used` |
| `rpc_finalize_auth_grading_fail` | Calls restore on merchant branch |

### Server actions

| Action | Notes |
|--------|-------|
| `listCheckoutEligibleCoupons(orderId, { shippingMethod?, useAuth? })` | Pass `useAuth` for auth toggle preview |
| `createMerchantOrderPaymentIntent(..., { userRewardId?, useAuth })` | Pass coupon id when `useAuth=true` |

## Phase 3 — Flash campaigns

Migration: `supabase/migrations/20260817120000_reward_flash_campaigns.sql`

### Schema

| Table / object | Notes |
|----------------|-------|
| `reward_campaigns` | Schedule window, `max_claims`, `claimed_count`, `max_claims_per_user` |
| `reward_campaign_claims` | Per-user daily audit (`claim_day` HKT) |
| `reward_campaign_status` | `draft` / `active` / `paused` / `ended` |

### SQL functions / RPCs

| Name | Purpose |
|------|---------|
| `rpc_admin_list_reward_campaigns` | Admin paginated list + stock % |
| `rpc_admin_upsert_reward_campaign` | Create/update; validates `flash_only` active template |
| `rpc_admin_set_reward_campaign_status` | Pause / resume / end |
| `rpc_list_active_flash_campaigns` | Member list with countdown fields + `can_claim` |
| `rpc_claim_flash_reward` | Atomic stock increment + issue coupon + claim row |
| `get_reward_coupon_center` (patch) | Excludes `flash_only` from locked catalog |

### Server actions

| Action | Notes |
|--------|-------|
| `listAdminRewardCampaigns`, `upsertAdminRewardCampaign`, `setAdminRewardCampaignStatus` | `app/actions/admin-reward-campaigns.ts` |
| `listActiveFlashCampaigns`, `claimFlashReward` | `app/actions/reward-flash.ts` |

## Migrations / env

```bash
bunx supabase db push
bun run supabase:types
```

## Verify

Partner QA: **[QA_CHECKLIST.md](./QA_CHECKLIST.md)** (Parts A–B verified; Part D for 2b; Part E for Phase 3)
