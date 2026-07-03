# Market Pricing Cron — Frontend Handoff

## Status

- **Backend:** ✅ Cron + read actions + public RLS
- **Frontend:** ✅ Wired on product detail
- **Your focus:** Grid card market price (optional), polish; order-book RAW condition filter (blocked on listings schema)

## Changelog (2026-07-03)

| Area | Shipped |
|------|---------|
| **Bulk read** | `getMarketplaceProductMarketPrices` — one fetch, all grades for product |
| **Hook** | `useMarketplaceProductMarketPrice` — client-side grade switch (no refetch) |
| **Banner** | `market_avg_price` HKD + green/red `market_trend_30d` with trend icons |
| **Chart** | Recharts from `market_chart_data`; guest blur overlay |
| **Market grade chips** | Only grades with DB cache data; separate from order-book filters |
| **裸卡 A–D** | Labels `裸卡 A` … `裸卡 D` when cron wrote separate cache rows |

---

## What the cache gives you

| DB column | UI |
|-----------|-----|
| `market_avg_price` | Banner「交易所現貨參考均價」 |
| `market_trend_30d` | `+X.X%` green up / red down badge |
| `market_chart_data` | 30-day area chart (`date`, `price`) |
| `grading_company` + `grading_score` | Drives `gradeKey` / label via `lib/marketplace/market-price.ts` |

**No RPC** — server action `SELECT` on `product_grading_market_prices` with public read policy.

---

## File map

| File | Role |
|------|------|
| `app/actions/marketplace.ts` | `getMarketplaceProductMarketPrices`, `getMarketplaceProductMarketPrice` |
| `app/lib/marketplace/types.ts` | `MarketplaceMarketPrice`, `MarketplaceMarketPriceGradeRow`, result types |
| `lib/marketplace/market-price.ts` | Grade keys, RAW condition mapping, sort order |
| `app/lib/hooks/useMarketplaceProductMarketPrice.ts` | Fetch all grades; `setSelectedGradeKey` |
| `app/marketplace/product/[id]/ProductDetailClient.tsx` | Banner, trend, chart, market grade chips |

---

## Hook contract

```ts
const {
  availableGrades,      // { gradeKey, label }[] — only DB rows with data
  selectedGradeKey,
  setSelectedGradeKey,
  marketPrice,          // { marketAvgPrice, marketTrend30d, chartPoints }
  isLoading,
  error,
} = useMarketplaceProductMarketPrice({ productId });
```

- Default selection: PSA 10 if in `availableGrades`, else first available.
- Market grade chips render when `availableGrades.length > 1`.
- **Not** tied to order-book `selectedGradeFilterId`.

---

## UI checklist

### Done

- [x] Banner `market_avg_price` (HK$ formatted)
- [x] `market_trend_30d` trend icon + color
- [x] 30-day chart from `chartPoints`
- [x] Guest blur on chart
- [x] Market grade chips (DB-available grades only)
- [x] Instant grade switch (client-side)
- [x] Empty states: skeleton loading, no chart for grade, no cache at all

### Optional / later

- [ ] Grid `MarketplaceCard` — show `market_avg_price` (needs batch read or RPC)
- [ ] Sync market grade picker with order-book chip (product decision — currently independent)
- [ ] Order book filter 裸卡 A vs B (needs listings backend — see limitation below)

---

## Known limitation: order book vs market price

| Surface | 裸卡 A/B/C/D |
|---------|----------------|
| **Market price / chart** | ✅ Separate rows when snapshots have `condition_type` A–D and cron has re-run |
| **Order book chips** | ⚠️ All `raw:*` chips still match every RAW listing (`listings.grading_score` is `null`) |

Do not expect order-book chip `裸卡 B` to filter listings until listings schema/RPC is extended.

---

## Acceptance checklist

- [x] Cron + migrations applied; cache rows exist
- [x] Banner + chart populate for PSA 10 (or first available grade)
- [x] Market grade chips switch avg + chart without page reload
- [x] `market_trend_30d` matches DB for selected grade
- [x] No cache → graceful empty (not infinite spinner)
- [x] No direct `product_price_snapshots` query from UI

---

## Manual test plan

1. Apply migrations `20260703210000`, `20260703220000`.
2. Seed snapshots with `price_hkd`; for raw, set `condition_type` = `A`/`B`/`C`/`D`.
3. Run cron (`curl` with `CRON_SECRET`).
4. Open `/marketplace/product/<productId>`.
5. Verify banner price + trend; switch market grade chips.
6. Confirm 裸卡 A and 裸卡 B show different data when both exist in cache.
7. Guest: chart blurred; banner still visible.

---

## Do not change without backend sync

- `app/api/cron/aggregate-prices/route.ts`
- `lib/marketplace/market-price.ts` (RAW score rules)
- `market_chart_data` JSON shape
- Upsert unique key `(product_id, grading_company, grading_score)`

---

## Related docs

- Cron backend: [backend.md](./backend.md)
- Product detail: [../marketplace-product-detail/frontend.md](../marketplace-product-detail/frontend.md)
- Integration queue: [../../INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)
