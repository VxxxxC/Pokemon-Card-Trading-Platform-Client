# Merchant Performance — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired

## UI touchpoints

| File | Role |
|------|------|
| `app/profile/merchant/performance/page.tsx` | Suspense shell |
| `MerchantPerformancePageData.tsx` | Auth + SSR bootstrap (`7d` default) |
| `MerchantPerformanceClient.tsx` | KPI cards, chart, leaderboards |
| `MerchantPerformanceSkeleton.tsx` | Loading state |

## Data wiring

| UI block | Source |
|----------|--------|
| 歷史累計 KPI ×3 | `analytics.allTime` (SSR, stable on range change) |
| Chart + 區間 KPI | `analytics.series` + `analytics.interval` |
| 暢銷商品排行榜 | `analytics.topProducts` (all-time, SSR) |
| 高價值客戶 | `analytics.topSpenders` (all-time, SSR) |
| Range select | `getMerchantPerformanceAnalytics(range)` → updates interval + series only |

## Acceptance checklist

- [ ] `/profile/merchant/performance` loads for merchant role
- [ ] Non-merchant redirects to `/profile/user`
- [ ] All-time KPIs match completed `merchant_orders`
- [ ] Chart refetches on range change with spinner
- [ ] Empty states when no completed orders
- [x] SKU link → `/profile/merchant/analytics?productId=...`
- [ ] Spender link → `/profile/{buyerId}`
- [ ] `ProfilePersonaSwitch` when dual persona

## Notes

- Per-SKU analytics page (`/profile/merchant/analytics`) remains mock.
- Finance page remains out of scope.
