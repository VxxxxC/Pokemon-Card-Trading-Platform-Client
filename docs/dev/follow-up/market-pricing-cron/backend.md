# Market Pricing Cron — Backend Handoff

## Status

- **Backend:** ✅ Ready (cron + cache read actions + RAW condition grouping)
- **Frontend:** ✅ Wired on product detail
- **Partner:** Re-run cron after deploy when snapshot `condition_type` data changes; grid card market price still optional

## Changelog (2026-07-03)

| Change | Detail |
|--------|--------|
| **Cron Job 2** | Daily aggregation from `product_price_snapshots` → `product_grading_market_prices` |
| **Route** | `app/api/cron/aggregate-prices/route.ts` — `GET` / `POST` |
| **Auth** | `Authorization: Bearer ${CRON_SECRET}` |
| **RAW conditions** | Groups 裸卡 by `condition_type` (`A`–`D`) → cache `grading_score` = `A`/`B`/`C`/`D` (not `-`) |
| **Shared helpers** | `lib/marketplace/market-price.ts` — used by cron + read actions |
| **Read actions** | `getMarketplaceProductMarketPrices`, `getMarketplaceProductMarketPrice` in `app/actions/marketplace.ts` |
| **Migrations** | `20260703210000` (service_role grants), `20260703220000` (anon public read) |

**Not in this slice:** snapshot ingest pipeline (Cron Job 1), `vercel.json` cron schedule, grid batch market price.

---

## Architecture

```
product_price_snapshots (ledger, 30-day window)
        │
        │  Vercel Cron (daily, HKT 03:00) or manual curl
        ▼
GET /api/cron/aggregate-prices
        │
        │  group by product_id + grading_company + resolved grading_score
        │  (RAW uses condition_type A/B/C/D)
        │  compute market_avg_price, market_trend_30d, market_chart_data
        ▼
product_grading_market_prices (cache, upsert)
        │
        │  getMarketplaceProductMarketPrices (bulk, no RPC)
        ▼
Product detail banner + chart + per-grade chips
```

---

## Files (backend track)

| File | Purpose |
|------|---------|
| `app/api/cron/aggregate-prices/route.ts` | Cron handler — fetch, aggregate, batch upsert |
| `lib/marketplace/market-price.ts` | Grade key resolution, RAW `condition_type` → cache score |
| `lib/supabase/admin.ts` | Service-role client (`createAdminClient`) |
| `lib/grading/options.ts` | `normalizeGradingCompany` — align keys with listings |
| `app/actions/marketplace.ts` | Read cache: `getMarketplaceProductMarketPrices`, `getMarketplaceProductMarketPrice` |
| `types/supabase.ts` | `product_price_snapshots`, `product_grading_market_prices` |
| `supabase/migrations/20260703210000_market_prices_service_role_grants.sql` | Cron upsert grants |
| `supabase/migrations/20260703220000_product_grading_market_prices_public_read.sql` | Guest-visible banner/chart |

---

## API: `GET` / `POST` `/api/cron/aggregate-prices`

### Auth

```http
Authorization: Bearer <CRON_SECRET>
```

### Success response

```jsonc
{
  "success": true,
  "data": {
    "lookbackDate": "2026-06-03",
    "productsProcessed": 42,
    "rowsUpserted": 168
  }
}
```

### Route config

```ts
export const dynamic = "force-dynamic";
export const maxDuration = 300;
```

---

## Data contract

### Source: `product_price_snapshots`

| Column | Used by cron |
|--------|----------------|
| `product_id` | Group key, upsert FK |
| `price_hkd` | **Required** — `null` / `≤ 0` skipped |
| `snapshot_date` | 30-day filter, chart x-axis |
| `grading_company` | Group key — `normalizeGradingCompany` |
| `grading_score` | Group key for graded cards; for RAW, may hold `A`–`D` |
| `condition_type` | **RAW group key** — `A` / `B` / `C` / `D` when `grading_score` empty |
| `created_at` | Tie-breaker for same-day snapshots |
| `source`, `price_jpy` | Not used |

### Target: `product_grading_market_prices`

| Column | Computed as |
|--------|-------------|
| `product_id` | From snapshot group |
| `grading_company` | Normalized (`RAW`, `PSA`, `BGS`, `CGC`, `ARS`) |
| `grading_score` | Graded: trimmed score. RAW: `A`/`B`/`C`/`D` from `condition_type`, else legacy `-` |
| `market_avg_price` | Mean of **latest 5** valid `price_hkd` |
| `market_trend_30d` | `((latest − oldest) / oldest) × 100`, 2 dp |
| `market_chart_data` | `[{ date: "MM-DD", price: number }]` |
| `updated_at` | ISO timestamp at upsert |

### Upsert conflict

```ts
.upsert(batch, { onConflict: "product_id,grading_company,grading_score" })
```

---

## Server actions (read cache — no RPC)

### `getMarketplaceProductMarketPrices(productId)` — **primary**

Returns all grade rows for one product (sorted per `GRADING_OPTIONS` order).

```ts
type MarketplaceMarketPriceGradeRow = {
  gradeKey: string;       // e.g. "psa:10", "raw:A"
  label: string;          // e.g. "PSA 10", "裸卡 A"
  gradingCompany: string;
  gradingScore: string | null;
  marketAvgPrice: number | null;
  marketTrend30d: number | null;
  chartPoints: { date: string; price: number }[];
};

type MarketplaceProductMarketPricesResult =
  | { success: true; data: MarketplaceMarketPriceGradeRow[] }
  | { success: false; error: string };
```

### `getMarketplaceProductMarketPrice(input)` — single grade

```ts
getMarketplaceProductMarketPrice({
  productId: string;
  gradingCompany: string;
  gradingScore: string | null;  // RAW: pass condition A/B/C/D
}): Promise<MarketplaceMarketPriceResult>
```

Uses `resolveMarketPriceDbScore()` for DB lookup key.

---

## Env required

```bash
CRON_SECRET=<random-secret>
NEXT_PUBLIC_SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>   # read actions
```

---

## How to verify

```bash
bun run dev
curl -s -X GET "http://localhost:3000/api/cron/aggregate-prices" \
  -H "Authorization: Bearer $CRON_SECRET" | jq
```

```sql
-- Per-grade cache (expect separate RAW rows when condition_type differs)
SELECT product_id, grading_company, grading_score,
       market_avg_price, market_trend_30d,
       jsonb_array_length(market_chart_data::jsonb) AS chart_points
FROM product_grading_market_prices
WHERE product_id = '<uuid>'
ORDER BY grading_company, grading_score;

-- RAW snapshot source
SELECT grading_company, grading_score, condition_type, COUNT(*)
FROM product_price_snapshots
WHERE upper(grading_company) IN ('RAW', 'RAW CARD')
  AND snapshot_date >= (CURRENT_DATE - INTERVAL '30 days')
GROUP BY 1, 2, 3;
```

---

## Blocked / not in scope

| Item | Owner / note |
|------|----------------|
| Snapshot ingest (Cron Job 1) | Must populate `price_hkd` + `condition_type` for raw |
| Order book RAW A/B/C/D filter | `listings` has no condition column — separate RPC/schema |
| Grid card `market_avg_price` | Optional batch read |
| `vercel.json` cron schedule | Infra / deploy |

---

## Do not change without sync

- `market_chart_data` shape: `[{ date: "MM-DD", price: number }]`
- `lib/marketplace/market-price.ts` — cron + read actions share RAW score rules
- `onConflict` columns: `(product_id, grading_company, grading_score)`
- `CRON_SECRET` header contract

---

## Related docs

- Product detail: [../marketplace-product-detail/backend.md](../marketplace-product-detail/backend.md) · [frontend](../marketplace-product-detail/frontend.md)
- Integration queue: [../../INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)
