# Merchant Product Analytics — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired

## UI touchpoints

| File | Role |
|------|------|
| `app/profile/merchant/analytics/page.tsx` | Thin server shell + Suspense |
| `MerchantAnalyticsPageData.tsx` | Auth, `productId`/`sku` resolve, SSR fetch |
| `MerchantAnalyticsClient.tsx` | Chart, KPIs, history table, refetch |
| `MerchantAnalyticsSkeleton.tsx` | Loading state |
| `MerchantPerformanceClient.tsx` | Top SKU link → `?productId=` |
| `InventoryAccordion.tsx` | CTA → `?productId=${sku.id}` |

## Client behavior

- **SSR:** default range `7d`, history page 1
- **Range change:** refetch `series` + `history` (reset page 1)
- **History pagination:** server refetch with `historyPage`
- **Chart toggles:** 總銷售額 / 成交次數 / 瀏覽 / **叫價次數** (`offerCount`)

## Acceptance checklist

- [ ] `/profile/merchant/analytics?productId={uuid}` loads live KPIs + chart
- [ ] `?sku=` fallback resolves catalog match
- [ ] Missing `productId` and `sku` → 404
- [ ] Non-merchant → redirect `/profile/user`
- [ ] Performance top SKU → correct product analytics
- [ ] Inventory「前往本卡牌進階商品分析」→ same product
- [ ] Range selector updates chart buckets
- [ ] History paginates within selected range
- [ ] `bun run build:ci` passes
