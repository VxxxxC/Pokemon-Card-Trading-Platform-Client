# Merchant Profile Dashboard — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired

## UI touchpoints

| Section | File | Data |
|---------|------|------|
| SSR bootstrap | `MerchantOverviewPageData.tsx` | `Promise.all` overview + pending orders + reviews + dual persona |
| Profile hero | `MerchantOverviewClient.tsx` | `initialData.overview.shop` + `useMerchantTitleDisplay` |
| Main title / stepper / progress | same | `MERCHANT_TITLES` + `merchant_shops` trades/rating |
| Activity badges | same | `TitleBadgeIcon` + `reputation_tag.activity_badges` |
| Revenue panel | same | `performance.monthlyRevenue` / `monthlyOrderCount` + pending count from orders bootstrap |
| Pending orders (max 4) | same | SSR `initialData.pendingOrders` → `MerchantOrderRow` |
| Recent reviews (max 3) | same | SSR `initialData.reviews` → `PublicReviewPreviewCard` |

| Hook / util | Purpose |
|-------------|---------|
| `app/lib/hooks/useMerchantTitleDisplay.ts` | Merchant main title, 4-tier stepper, trade progress, activity badges |
| `lib/titles/merchant-title-progress.ts` | `getMerchantTitleProgress`, `buildMerchantTitleStepperState` |
| `app/lib/merchant-order/map-sale-order.ts` | `MerchantTradingOrder` → `SaleOrder` |
| `lib/dashboard/constants.ts` | Preview limits (4 pending / 3 reviews) |

## Acceptance checklist

- [x] Hero uses `merchant_shops` shop name + handle (not `profiles.display_name`)
- [x] Avatar from `merchant_shops.shop_avatar_path` (not `profiles.avatar_path`)
- [x] KYC / Stripe chips from `kyc_records`
- [x] 4-tier `MERCHANT_TITLES` stepper (not mock 5-tier)
- [x] Progress bar: trade count toward next title (not fake XP)
- [x] Activity badges from `reputation_tag` with CDN icons
- [x] Pending orders from `searchMerchantTradingOrders` (max 4)
- [x] Reviews from `getPublicProfileReviews({ persona: 'merchant' })` (max 3)
- [x]「查看更多評價」→ `/profile/{id}/rating?persona=merchant`
- [x]「查看全部」訂單 → `/profile/merchant/trading?filter=待處理`
- [x] `ProfilePersonaSwitch` when dual persona
- [x] Overview SSR via Suspense + skeleton

## Notes

- No `useMerchantStore` on overview — trading list/detail remain separate wired flows.
- Monthly revenue is DB aggregate until Stripe / `merchant_ledgers` milestone.
- `performance` page remains mock; link preserved.
