# Merchant Profile Dashboard — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired (see [frontend.md](./frontend.md))

## Architecture

```
GET /profile/merchant
  → page.tsx (Suspense + MerchantOverviewSkeleton)
  → MerchantOverviewPageData (Server Component)
      getOptionalAuthUser() once
      Promise.all:
        getMerchantDashboardOverview()
          merchant_shops (SSOT: shop name, handle, trades, rating, shop_avatar_path, reputation_tag)
          profiles (role guard only)
          kyc_records (kyc_status, stripe_account_id)
          listings count (seller_persona = merchant, status = active)
          merchant_orders monthly stats (order count + completed revenue)
        searchMerchantTradingOrders({ tabStatus: 'pending', pageSize: 4 })
        getPublicProfileReviews({ persona: 'merchant', pageSize: 3 })
        getDualPersonaContext()
  → MerchantOverviewClient — initialData from SSR
```

## Storefront SSOT

| Layer | Merchant overview usage |
|-------|-------------------------|
| `merchant_shops` | Shop name, handle, join date, `completed_trades_count`, `rating_score`, **`shop_avatar_path`**, **`reputation_tag`** (merchant titles + merchant activity badges) |
| `profiles` | `role` guard only (no titles/badges/avatar for merchant persona) |
| `kyc_records` | KYC verified chip, Stripe connected chip |

`profiles.username` is **not** used for storefront handle.

## Files

| File | Purpose |
|------|---------|
| `app/actions/merchant-dashboard.ts` | `getMerchantDashboardOverview` |
| `app/lib/dashboard/merchant-types.ts` | `MerchantDashboardOverview` DTO |
| `app/profile/merchant/(dashboard)/MerchantOverviewPageData.tsx` | SSR bootstrap |
| `app/profile/merchant/(dashboard)/MerchantOverviewClient.tsx` | Client UI |
| `app/profile/merchant/(dashboard)/MerchantOverviewSkeleton.tsx` | Streaming fallback |
| `lib/dashboard/constants.ts` | `MERCHANT_DASHBOARD_PENDING_PREVIEW_LIMIT`, `MERCHANT_DASHBOARD_REVIEWS_PREVIEW_LIMIT` |
| `lib/titles/merchant-title-progress.ts` | Merchant 4-tier stepper + trade progress |
| `app/lib/hooks/useMerchantTitleDisplay.ts` | Title / badges display hook |

Reuses: `searchMerchantTradingOrders`, `getPublicProfileReviews`, `mapMerchantTradingOrderToSaleOrder`, `lib/constants/titles.ts`.

## Action contract

### `getMerchantDashboardOverview()`

```ts
import { getMerchantDashboardOverview } from "@/app/actions/merchant-dashboard";

// Success:
{
  success: true,
  data: {
    shop: {
      merchantId, shopName, shopHandle, joinDateLabel, avatarUrl,
      ratingScore, reputationTag, completedTradesCount, activeListingCount,
      kycVerified, stripeConnected,
    },
    performance: {
      monthlyOrderCount,  // merchant_orders created this calendar month
      monthlyRevenue,     // SUM(final_price) where escrow_status = completed_and_transferred this month
    },
  },
}
```

Errors: `請先登入`, `無商戶權限`, `店舖尚未初始化，請完成商戶認證`, `無法載入商戶總覽`.

## Performance panel semantics

| Metric | Source |
|--------|--------|
| 本月訂單 | `merchant_orders` count for `merchant_id`, `created_at` in current calendar month |
| 本月營收 | `SUM(final_price)` where `escrow_status = completed_and_transferred`, same month window |
| 待處理件數 | From `searchMerchantTradingOrders` filter `status.pending` (PageData, not overview action) |

**Deferred:** Stripe Connect balance / `merchant_ledgers` payout history (finance page milestone).

## Titles

- SSOT: `merchant_shops.reputation_tag` — `{ core_main_merchant, activity_badges }`
- Main title: `reputation_tag.core_main_merchant` → `MERCHANT_TITLES`
- Fallback: `getMainTitle(trades, { isMerchant: true, rating, hasMerchantShop: true })`
- Activity badges: `MERCHANT_ACTIVITY_BADGES` only (independent from member badges)
- Trade count for merchant titles: `merchant_shops.completed_trades_count` (not `profiles.completed_trades_count`)
- Recalc: `fn_recalculate_merchant_reputation_tags` (via `fn_recalculate_reputation_tags` wrapper)

## Verify

1. Log in as merchant with `merchant_shops` row.
2. Apply migration `20260717180000_merchant_orders_authenticated_select.sql` (`bunx supabase db push`).
3. Badge icons served from `public/assets/badges/` via `badgeAssetUrl()` in `lib/constants/titles.ts`.
4. `/profile/merchant` — hero shows shop name, handle, KYC/Stripe chips, 4-tier stepper, real pending orders + reviews.
5. Non-merchant role → redirect `/profile/user`.
6. `bunx tsc --noEmit` && `bun run build:ci`.
