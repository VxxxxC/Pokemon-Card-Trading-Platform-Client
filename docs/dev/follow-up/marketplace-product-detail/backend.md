# Marketplace Product Detail — Backend Handoff

## Status

- **Backend:** ✅ Catalog · ✅ listings RPC · ✅ trade history · ✅ market price read · ✅ on-demand listing detail
- **Frontend:** ✅ Catalog · ✅ order book · ✅ sold history · ✅ chart + banner · ✅ slide-over listing photos
- **Partner:** Optional follow-ups — grid market price, order-book RAW condition filter, slide-over lightbox

## Changelog (2026-07-03)

| Change | Detail |
|--------|--------|
| **`getMarketplaceProductDetail()`** | `product_catalog` by `id` or `display_id` |
| **`get_marketplace_product_listings` RPC** | Order book filter/sort/pagination (**slim rows — no `images`**) |
| **`getMarketplaceListingDetail(listingId)`** | On-demand single listing read (`listings` table, `status = 'active'`) |
| **`getMarketplaceProductTradeHistory`** | Auth-gated completed orders |
| **`getMarketplaceProductMarketPrices`** | Bulk read `product_grading_market_prices` per product |
| **`lib/marketplace/market-price.ts`** | Grade key + RAW `condition_type` mapping |
| **`lib/listings/images.ts`** | `parseListingImageUrls` — ordered URL[] from `listings.images` JSONB |
| **Migrations** | `20260703170000`, `20260703180000`, `20260703210000`, `20260703220000` |

---

## Architecture

```
SSR:
  getMarketplaceProductDetail(productId)          ← page.tsx

Client (parallel on mount):
  useMarketplaceProductListings({ filters })      ← order book refetch on filter change (slim)
  useMarketplaceProductMarketPrices({ productId })  ← one bulk fetch; grade switch client-side
  useMarketplaceProductTradeHistory({ … })        ← auth-gated

Client (on slide-over open only):
  useMarketplaceListingDetail({ listingId, enabled })  ← images + seller_description
```

**Why on-demand listing detail:** Products may have 200+ active listings. Order book RPC stays paginated and lightweight; full `listings.images` (4–6 URLs) loads only when user opens `ExecutionSlideOver`.

---

## Files (backend track)

| File | Purpose |
|------|---------|
| `app/actions/marketplace.ts` | Detail, listings, **listing detail**, trade history, market prices |
| `app/lib/marketplace/types.ts` | All marketplace DTOs incl. `MarketplaceListingDetail` |
| `lib/listings/images.ts` | `ListingImage` JSONB contract + `parseListingImageUrls` |
| `lib/marketplace/market-price.ts` | Cache grade resolution (shared with cron) |
| `lib/catalog/element-types.ts` | `formatElementTypeZh` |
| `supabase/migrations/20260703170000_get_marketplace_product_listings.sql` | Order book RPC |
| `supabase/migrations/20260703180000_member_orders_trade_history_read.sql` | Trade history RLS |
| `supabase/migrations/20260703220000_product_grading_market_prices_public_read.sql` | Market price public read |

---

## Server action: `getMarketplaceProductDetail`

Unchanged — see prior field map. Lookup: `id` then `display_id`.

---

## RPC: `get_marketplace_product_listings`

Wired via `getMarketplaceProductListings`. Args: `p_product_id`, `p_grade_filters`, `p_only_graded`, `p_sort`, `p_page`, `p_page_size`.

Returns listing rows + `filtered_lowest_price` + pagination meta.

**Does not return** `images` — intentional for scale (200+ listings per product). Use `getMarketplaceListingDetail` for gallery.

**Limitation:** RAW listings share `grading_score = null` — `raw:A` / `raw:B` chips cannot filter by condition until listings store condition.

---

## Server action: `getMarketplaceListingDetail`

```ts
type MarketplaceListingDetailResult =
  | { success: true; data: MarketplaceListingDetail }
  | { success: false; error: string };

type MarketplaceListingDetail = {
  listingId: string;
  productId: string;
  price: number;
  gradingCompany: string;
  gradingScore: string | null;
  sellerId: string;
  sellerDescription: string | null;
  images: string[];           // parseListingImageUrls(listings.images)
  useAuthentication: boolean;
};
```

- **Query:** `listings` `.eq("id", listingId).eq("status", "active").maybeSingle()`
- **RLS:** Existing `listings_public_read_active` — anon + authenticated can read active rows
- **No new migration** required

### How to verify

```bash
# In app: click order book row → slide-over shows seller photos
# Or call from a server component / script with listing UUID
```

```sql
SELECT id, images, seller_description
FROM listings
WHERE status = 'active'
LIMIT 1;
```

---

## Market price actions

Read from **`product_grading_market_prices`** ([market-pricing-cron](../market-pricing-cron/backend.md)).

### `getMarketplaceProductMarketPrices(productId)` — primary

```ts
type MarketplaceProductMarketPricesResult =
  | { success: true; data: MarketplaceMarketPriceGradeRow[] }
  | { success: false; error: string };
```

One row per cached grade. Sorted by `GRADING_OPTIONS` order. Rows without avg or chart are omitted.

### `getMarketplaceProductMarketPrice(input)` — single grade

For ad-hoc single-grade lookup; product detail uses bulk action.

### Grade key rules

| Cache row | `gradeKey` | `label` |
|-----------|------------|---------|
| PSA + `10` | `psa:10` | PSA 10 |
| RAW + `A` | `raw:A` | 裸卡 A |
| RAW + `-` (legacy) | `raw:A` (first raw option) | 裸卡 |

RAW `A`–`D` requires cron grouping by snapshot `condition_type` — re-run cron after ingest fix.

---

## Trade history

`getMarketplaceProductTradeHistory` — auth required; guest UI blurs section.

---

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=…
NEXT_PUBLIC_SUPABASE_ANON_KEY=…
CRON_SECRET=…                    # manual cron trigger only
SUPABASE_SERVICE_ROLE_KEY=…      # cron route only
```

---

## How to verify

```bash
bun run dev
bun run build:ci   # pages guard Supabase env
```

See [INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md) — product detail manual tests for listings, trade history, market price/chart.

---

## Blocked / not in scope

| Feature | Note |
|---------|------|
| Order book RAW A/B/C/D | Listings schema — all raw share `grading_score = null` |
| Grid card market price | Optional batch read |
| 24h price delta | Only `market_trend_30d` in cache |
| Catalog multi-image gallery | Catalog single `image_url`; listing photos via `getMarketplaceListingDetail` |
| Images in order book RPC | Rejected — use on-demand listing detail for 200+ listings scale |

---

## Related docs

- Market pricing cron: [../market-pricing-cron/backend.md](../market-pricing-cron/backend.md) · [frontend](../market-pricing-cron/frontend.md)
- Integration queue: [../../INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)

---

## Do not change without sync

- `MarketplaceProductDetail` shape
- `getMarketplaceProductDetail` lookup order
- `lib/marketplace/market-price.ts` RAW score semantics
- `success` / `error` envelopes
