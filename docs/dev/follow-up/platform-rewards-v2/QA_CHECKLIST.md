# Platform Rewards v2 — Partner QA Checklist

> **Branch:** `aaron-backend-wired`  
> **Migrations (remote applied):** `20260813120000_platform_rewards_admin_templates.sql`, `20260815120000_merchant_checkout_coupon.sql`  
> **Owner:** Frontend / full-stack partner  
> **Backend contact:** Aaron (server actions, RPCs, payout)

## Prerequisites

- [ ] Remote DB has both migrations applied (`bunx supabase db push` on latest branch)
- [ ] Admin account with access to `/admin/campaigns`
- [ ] Member test account with wallet coupons (or ability to publish templates + trigger auto-grant)
- [ ] Merchant listing: **non-auth** B2C, SF shipping enabled, price e.g. **HK$100**
- [ ] Merchant shop base courier fee + listing extra fee → total shipping e.g. **HK$45** (for free-shipping scenario)
- [ ] Stripe test mode for payment + (optional) T+7 payout cron

## Part A — Admin wizard (Phase 1)

| # | Step | Expected | Pass |
|---|------|----------|------|
| A1 | `/admin/campaigns` → **獎勵模板** tab loads | Table or empty state; no crash | ☐ |
| A2 | **新增模板** → Step 1: create `free_shipping`, `max_subsidy_hkd=30`, restrictions `order_kinds=merchant`, `shipping_methods=sf` | Saves draft | ☐ |
| A3 | Step 2: `auto_grant` → Step 3: Skip → **發布** | Status `active`; appears in list | ☐ |
| A4 | Create `discount_coupon` HK$10, `min_spend_hkd=50` → publish | Second template active | ☐ |
| A5 | List **編輯** opens wizard at Step 1 with existing `id` | Form pre-filled | ☐ |
| A6 | `flash_only` template can publish | Step 3 still placeholder; no campaign RPC yet | ☐ |
| A7 | **活動管理** tab | Phase 3 mock only; no duplicate page title | ☐ |

## Part B — Checkout coupons (Phase 2, merchant_direct only)

### B1 — Happy path: free shipping subsidy

| # | Step | Expected | Pass |
|---|------|----------|------|
| B1.1 | Member has active `free_shipping` coupon (wallet or auto-grant after publish) | Visible in `/profile/user/rewards` | ☐ |
| B1.2 | Buy merchant listing **without** auth add-on; checkout shipping = **SF** | `CheckoutCouponPicker` visible | ☐ |
| B1.3 | Select free-shipping coupon; summary shows **平台優惠 -HK$30** (cap) | Client preview matches | ☐ |
| B1.4 | Complete Stripe payment | PI amount = gross − subsidy (e.g. $145 → **$115**) | ☐ |
| B1.5 | DB `merchant_orders` | `total_amount`=gross, `platform_subsidy_amount`=30, `buyer_total_amount`=115, `merchant_payout_amount` **unchanged** (gross item+shipping − commission) | ☐ |
| B1.6 | `user_rewards` for coupon | `is_used=true`, `used_at` set; `reserved_merchant_order_id` cleared | ☐ |

**SQL (replace order id):**
```sql
SELECT total_amount, buyer_total_amount, platform_subsidy_amount,
       coupon_user_reward_id, coupon_type, merchant_payout_amount
FROM merchant_orders WHERE id = '<order_id>';
```

### B2 — Discount coupon

| # | Step | Expected | Pass |
|---|------|----------|------|
| B2.1 | Item subtotal ≥ min spend | Coupon **eligible**; subsidy = min(amount, subtotal) | ☐ |
| B2.2 | Item subtotal < min spend | **ineligible** with reason | ☐ |

### B3 — Gates & edge cases

| # | Step | Expected | Pass |
|---|------|----------|------|
| B3.1 | Toggle **鑑定加購** ON | Picker hidden; selection cleared | ☐ |
| B3.2 | Prepare/checkout with auth ON + coupon id (if forced via API) | RPC error: 鑑定訂單暫不支援優惠券 | ☐ |
| B3.3 | Shipping = **面交** + free_shipping coupon | Ineligible (運費 0) | ☐ |
| B3.4 | Switch coupon A → B before pay | Old reserve released; new reserve on B | ☐ |
| B3.5 | Select coupon → clear selection → pay | No subsidy; `platform_subsidy_amount=0` | ☐ |
| B3.6 | `payment_intent.canceled` or 48h expiry cron | `fn_release_merchant_order_coupon`; wallet not `is_used` until paid | ☐ |
| B3.7 | Trading / order detail UI | Buyer paid shows `buyer_total_amount ?? total_amount` | ☐ |

### B4 — Payout (optional, Stripe test)

| # | Step | Expected | Pass |
|---|------|----------|------|
| B4.1 | Order with subsidy completes T+7 hold | `executeMerchantConnectPayout` succeeds | ☐ |
| B4.2 | When `merchant_payout > amount_received` | Single transfer **without** `source_transaction` (platform balance covers gap) | ☐ |

## Part C — Out of scope (do not file as bugs)

- `merchant_auth` / multicapture checkout coupons → **Phase 2b**
- Member C2C checkout coupons → **Phase 5**
- `flash_only` member claim UI → **Phase 3**
- `percent_off`, points redemption shop

## Sign-off

| Role | Name | Date | Notes |
|------|------|------|-------|
| QA | | | |
| Frontend | | | |
| Backend | | | |

## Issues log

| ID | Area | Steps | Expected | Actual | Severity |
|----|------|-------|----------|--------|----------|
| | | | | | |
