# Merchant Performance — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired — see [frontend.md](./frontend.md)

## Architecture

```
GET /profile/merchant/performance
  → page.tsx (Suspense)
  → MerchantPerformancePageData
      getOptionalAuthUser()
      getMerchantPerformanceAnalytics('7d')
      getDualPersonaContext()
  → MerchantPerformanceClient
```

Range changes call `getMerchantPerformanceAnalytics(range)` client-side (chart + interval only).

## SSOT

| Metric | Source |
|--------|--------|
| Revenue / turnover | `merchant_orders.final_price` |
| Eligible orders | `escrow_status = 'completed_and_transferred'` only |
| Event time | `COALESCE(updated_at, created_at)` |
| SKU | `listings.product_id` → `product_catalog.display_id` (fallback `set_code-card_number`) |
| Top spender | `merchant_orders.buyer_id` → `profiles` |

Excluded: `payment_held`, `authenticating`, `authenticated`, `refunded`.

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260717190000_merchant_performance_analytics.sql` | Index + `get_merchant_performance_analytics` RPC |
| `app/actions/merchant-performance.ts` | Server action |
| `lib/dashboard/merchant-performance-types.ts` | DTO types |
| `lib/dashboard/merchant-performance-ranges.ts` | Range constants |
| `lib/dashboard/map-merchant-performance.ts` | RPC → client mapper |

## RPC: `get_merchant_performance_analytics(p_time_range, p_top_limit)`

- `SECURITY INVOKER` — scoped to `auth.uid()` as `merchant_id`
- `p_time_range`: `12h` \| `7d` \| `1m` \| `3m` \| `6m` \| `12m`
- Returns `jsonb`:

```ts
{
  allTime: { turnover, txCount, avgPrice },
  interval: { turnover, txCount, avgPrice },  // selected range
  series: [{ label, turnover, txCount, avgPrice }],
  topProducts: [{ rank, productId, name, skuNo, volume, revenue }],  // all-time
  topSpenders: [{ rank, buyerId, name, avatarPath, spending }],       // all-time
  timeRange: string
}
```

## Migrations

```bash
bunx supabase db push
```

- `20260717190000_merchant_performance_analytics.sql`

## Verify

```sql
SELECT public.get_merchant_performance_analytics('7d', 9);
```

1. Merchant with completed B2C orders sees non-zero all-time KPIs.
2. Refunded / in-flight orders excluded.
3. Range switch updates `series` + `interval` buckets.
4. Top products grouped by `product_id`; spenders by `buyer_id`.
