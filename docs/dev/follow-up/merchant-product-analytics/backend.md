# Merchant Product Analytics — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired — see [frontend.md](./frontend.md)

## Architecture

```
GET /profile/merchant/analytics?productId={uuid}
  → page.tsx (Suspense)
  → MerchantAnalyticsPageData
      getOptionalAuthUser()
      getMerchantProductAnalytics({ productId | sku, timeRange: '7d' })
  → MerchantAnalyticsClient
```

Range / history pagination refetch via `getMerchantProductAnalytics` client-side.

## URL contract

| Param | Priority | Resolution |
|-------|----------|------------|
| `productId` | Primary | `product_catalog.id` (TEXT, e.g. `OFFICIAL-50301`) |
| `sku` | Fallback | `display_id`, `id`, `id_canonical`, `id_compact` |

Entry links (performance top SKU, inventory CTA) use `?productId=`.

## SSOT

| Metric | Source |
|--------|--------|
| Sales / tx buckets | `merchant_orders` completed (`escrow_status = 'completed_and_transferred'`) |
| View / offer buckets | `listing_engagement_events` (`event_type` = `view` \| `offer`) |
| KPI total views / offers | `listing_stats` SUM for merchant listings of product |
| Avg sold price | AVG `final_price` on completed orders (all-time) |
| Market lowest | `marketplace_product_summaries.lowest_price` |
| Event time (orders) | `COALESCE(updated_at, created_at)` |

## Dual-write (engagement)

| Trigger | Stats | Events |
|---------|-------|--------|
| `rpc_increment_listing_view` | `listing_stats.views + 1` | INSERT `view` |
| `fn_bump_listing_offers_count` | `listing_stats.offers_count + 1` | INSERT `offer` |

Pre-migration cumulative stats appear in KPIs only; chart buckets start after deploy.

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260717200000_listing_engagement_events.sql` | Events table + dual-write RPCs |
| `supabase/migrations/20260717201000_merchant_product_analytics.sql` | `get_merchant_product_analytics` RPC (initial) |
| `supabase/migrations/20260717210000_merchant_product_analytics_product_id_text.sql` | RPC `p_product_id` → TEXT (align `product_catalog.id`) |
| `app/actions/merchant-product-analytics.ts` | `resolveMerchantProductId`, `getMerchantProductAnalytics` |
| `lib/dashboard/merchant-product-analytics-types.ts` | DTO types |
| `lib/dashboard/map-merchant-product-analytics.ts` | RPC → typed payload |

## Action contract

```ts
getMerchantProductAnalytics({
  productId?: string;
  sku?: string;
  timeRange?: MerchantPerformanceRange; // default "7d"
  historyPage?: number;                 // default 1
}): Promise<
  | { success: true; data: MerchantProductAnalytics }
  | { success: false; error: string; notFound?: boolean }
>
```

## Verify (backend)

1. `bunx supabase db push`
2. Open listing (ExecutionSlideOver) → `listing_engagement_events` row `view` + `listing_stats.views++`
3. Submit offer → row `offer` + `listing_stats.offers_count++`
4. SQL: `SELECT get_merchant_product_analytics('<product_id>'::uuid, '7d', 1, 6);` as merchant
