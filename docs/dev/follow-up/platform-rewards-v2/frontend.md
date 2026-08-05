# Platform Rewards v2 — frontend

> **Phase 1:** ✅ Wizard wired · **Phase 2:** ✅ Checkout baseline wired · **Phase 2b:** ⏳ auth path

## Phase 1 — Admin wizard

| Path | Purpose |
|------|---------|
| `app/admin/campaigns/page.tsx` | SSR bootstrap |
| `app/admin/campaigns/AdminRewardTemplatesClient.tsx` | List + filter + open wizard |
| `app/admin/campaigns/wizard/RewardTemplateWizard.tsx` | Stepper dialog |
| `app/admin/campaigns/wizard/RewardTemplateDefinitionStep.tsx` | Step 1 — template fields |
| `app/admin/campaigns/wizard/RewardDistributionStep.tsx` | Step 2 — `auto_grant` / `flash_only` |
| `app/admin/campaigns/wizard/RewardCampaignScheduleStep.tsx` | Step 3 — Phase 3 placeholder (disabled) |
| `lib/admin-rewards/template-form.ts` | Shared form defaults + labels |

**UX:** 新增 → wizard Step 1→2→3→publish；列表編輯 → wizard Step 1 with `id`。`flash_only` 可 publish；搶券 UI 待 Phase 3。

## Phase 2 — Checkout coupons (merchant_direct only)

| Path | Purpose |
|------|---------|
| `app/checkout/[id]/components/CheckoutCouponPicker.tsx` | Loads eligible coupons; select one |
| `app/checkout/[id]/components/steps/MerchantDirectReview.tsx` | Embeds picker when auth off |
| `app/checkout/[id]/components/CheckoutOrderSummary.tsx` | 「平台優惠」行 + 折後總計 |
| `app/checkout/[id]/CheckoutClient.tsx` | `selectedCouponId`, preview subsidy, prepare wiring |
| `lib/checkout/prepare-payment.ts` | Passes `userRewardId` (non-auth only) |
| `lib/checkout/compute-pricing.ts` | Client preview subsidy (non-authoritative) |

**Rules:**

- Picker only when `variant === merchant_direct` and `authServiceEnabled === false`
- Enabling auth toggle clears coupon selection
- Shipping method change clears coupon + refreshes eligible list
- Authoritative amounts from `rpc_prepare_merchant_order_payment` / PI

**Out of scope:** `merchant_auth` / `member_auth` checkout pickers (Phase 2b / Phase 5).

## Acceptance checklist

Partner QA: **[QA_CHECKLIST.md](./QA_CHECKLIST.md)**

### Phase 1

- [ ] Admin → `/admin/campaigns` → create template via wizard → publish
- [ ] Edit published template from list
- [ ] `flash_only` template saves with Step 3 skipped

### Phase 2

- [ ] Non-auth SF checkout shows coupon picker
- [ ] Free shipping cap reduces buyer total; summary shows 平台優惠
- [ ] Auth toggle hides picker and blocks coupon on prepare
- [ ] Meetup + free shipping shows ineligible
- [ ] `bun run build:ci` passes
