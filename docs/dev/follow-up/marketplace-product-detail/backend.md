# Marketplace Product Detail — Backend Handoff

## Status

- **Backend:** ✅ Catalog · ✅ listings RPC · ✅ trade history · ⏳ price chart
- **Frontend:** ✅ Catalog · ✅ order book · ✅ sold history · ⏳ chart
- **Partner:** Backend owns listings RPC + price/trade actions; frontend owns order-book hook + chart wiring

## Changelog (2026-07-03)

| Change | Detail |
|--------|--------|
| **`getMarketplaceProductDetail()`** | Server action — `product_catalog` by `id` (UUID) or fallback `display_id` |
| **`MarketplaceProductDetail` type** | Mapped row in `app/lib/marketplace/types.ts` |
| **`formatElementTypeZh()`** | `lib/catalog/element-types.ts` — JP/EN `element_type` → 繁體中文 |
| **Planned RPC** | `get_marketplace_product_listings` — filter/sort/paginate active listings for one product |
| **Planned action** | `getMarketplaceProductPriceChart` — `product_price_snapshots` (30-day series) |
| **Planned action** | Trade history from completed `member_orders` (auth-gated UI) |

No new DB migrations for the **catalog slice**. Listings RPC may reuse v2 search filter JSON (`p_grade_filters`).

---

## Architecture (target)

```
Initial SSR (parallel):
  getMarketplaceProductDetail(productId)     ← ✅ done
  getMarketplaceProductListings({ ... })     ← RPC TBD
  getMarketplaceProductPriceChart(productId) ← action TBD

Client refetch on order-book interaction:
  getMarketplaceProductListings only        ← avoid re-fetching catalog + chart
```

---

## Files (backend track)

| File | Purpose |
|------|---------|
| `app/actions/marketplace.ts` | **`getMarketplaceProductDetail`**, existing search actions |
| `app/lib/marketplace/types.ts` | **`MarketplaceProductDetail`**, **`MarketplaceProductDetailResult`** |
| `lib/catalog/element-types.ts` | **`formatElementTypeZh`** — display helper (safe for client import) |
| `supabase/migrations/…` *(planned)* | `get_marketplace_product_listings` RPC |

---

## Server action: `getMarketplaceProductDetail`

### Signature

```ts
import { getMarketplaceProductDetail } from "@/app/actions/marketplace";

const result = await getMarketplaceProductDetail(productKey: string);
```

### Lookup order

1. `product_catalog.id` = `productKey` (UUID from grid — **primary**)
2. `product_catalog.display_id` = `productKey` (legacy / human-readable slug)

### Response envelope

```ts
type MarketplaceProductDetailResult =
  | { success: true; data: MarketplaceProductDetail }
  | { success: false; error: string };
```

### `MarketplaceProductDetail` field map

| Field | Source column | Notes |
|-------|---------------|-------|
| `productId` | `id` | Route param from `/marketplace/product/[id]` |
| `productName` | `name_zh ?? name_ja` | Display fallback (detail page title uses `nameJa` + optional `nameZh`) |
| `nameJa` | `name_ja` | Page `<h1>` |
| `nameEn` / `nameZh` | `name_en`, `name_zh` | Subheading when `nameZh` present |
| `setCode` | `set_code` | Spec matrix + meta line |
| `cardNumber` | `card_number` | Meta line |
| `displayId` | `display_id` | Breadcrumb label fallback |
| `rarity` | `rarity` | Raw string; passed to `RarityBadge` |
| `imageUrl` | `image_url` | Hero image |
| `images` | `[image_url]` | Single official image today |
| `catalogType` | `type` | `catalog_type` enum |
| `elementType` | `element_type` | Use **`formatElementTypeZh()`** in UI |
| `pokemonStage` | `pokemon_stage` | Spec matrix |
| `hp` | `hp` | Reserved |
| `subTypeJa` | `sub_type_ja` | Reserved |

### Errors

| Condition | `error` |
|-----------|---------|
| Empty key | `缺少商品識別碼` |
| Not found | `找不到此商品` |
| Supabase error | `無法載入商品資料` |
| Env / network | `無法連線至商品目錄` |

---

## Planned RPC: `get_marketplace_product_listings`

Scope to **one** `p_product_id` with same filter semantics as grid search.

### Suggested args

| Param | Type | Purpose |
|-------|------|---------|
| `p_product_id` | `uuid` / `text` | Required |
| `p_grade_filters` | `jsonb` | Same shape as `search_marketplace_products` |
| `p_only_graded` | `boolean` | Exclude `grading_company = 'RAW'` |
| `p_sort` | `text` | `price_asc` \| `grade_desc` \| `rating_desc` |
| `p_page` / `p_page_size` | `int` | Order-book pagination |

### Suggested return row (per listing)

| Column | Maps to UI |
|--------|------------|
| `listing_id` | Row key / buy flow |
| `price` | Ask price |
| `grading_company`, `grading_score` | `GradeBadge` / filter chips |
| `seller_id`, `seller_name` | Seller column |
| `rating_score`, `total_trades` | Sort by `rating_desc` |
| `seller_persona`, `use_authentication` | Future badges |
| `images` | Slide-over carousel (listing photos) |
| `total_count`, `page`, … | Pagination meta |

---

## Planned: price chart action

Query `product_price_snapshots` for `product_id`, last 30 days, default condition (e.g. PSA 10 or catalog default).

```ts
// Target shape
type MarketplacePriceChartPoint = { date: string; price: number };
```

Table: `product_price_snapshots` (`snapshot_date`, `price_jpy`, `condition_type`, `product_id`).

---

## Env required

Same as marketplace search:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

`product_catalog` anon `SELECT` — migration `20260702100000_product_catalog_public_read.sql`.

---

## How to verify (catalog slice)

```bash
bun run dev
```

SQL:

```sql
-- Pick a catalog row
SELECT id, display_id, name_ja, name_zh, set_code, element_type, rarity
FROM product_catalog
LIMIT 5;

-- By UUID (replace)
SELECT * FROM product_catalog WHERE id = '<uuid>';
```

Browser:

1. `/marketplace` → click a grid card → `/marketplace/product/<productId>`
2. Title = `name_ja`; subheading = `name_zh` + rarity badge when present
3. Spec matrix shows `setCode`, `nameJa`, translated 卡牌屬性, `pokemonStage`
4. Unknown product UUID → 404 (`notFound()`)

---

## Blocked / not in scope (this slice)

| Feature | Owner / note |
|-------|----------------|
| Order book data | Listings RPC |
| 30-day chart | `product_price_snapshots` action + condition picker TBD |
| Sold history | ✅ `getMarketplaceProductTradeHistory` + migration `20260703180000` |
| 24h price delta | No snapshot delta column yet |
| `weakness` spec row | Not on `product_catalog` — removed from UI |
| Multi-image gallery | Catalog has single `image_url` |

---

## Do not change without sync

- `MarketplaceProductDetail` shape
- `getMarketplaceProductDetail` lookup order (`id` then `display_id`)
- `success` / `error` envelope
- `formatElementTypeZh` keys in `lib/catalog/element-types.ts` (extend, don’t rename exported fn)
