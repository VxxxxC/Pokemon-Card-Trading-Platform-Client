# Marketplace Product Search — Backend Handoff

## Status

- **Backend:** ✅ Ready (v2 RPC + unified `p_keyword`)
- **Frontend:** ✅ Wired — `/marketplace` filters + grid card baseline
- **Partner:** Card polish (listing count, price spread) + product detail — see [frontend.md](./frontend.md)

## Changelog (2026-07-04) — SSR bootstrap + load performance

| Change | Detail |
|--------|--------|
| **`getMarketplaceBootstrap()`** | New server action — `Promise.all` of `getMarketplacePriceBounds`, `getMarketplaceRarities`, `searchMarketplaceProducts` in **one** middleware round-trip |
| **`MarketplaceBootstrapData` / `MarketplaceBootstrapResult`** | Types in `app/lib/marketplace/types.ts` — products, meta, priceBounds, rarities |
| **`app/marketplace/page.tsx`** | Server Component — parallel `getOptionalAuthUser()` + `getMarketplaceBootstrap()` on render; passes `initialData` + `currentUserId` to client |
| **Client fallback** | When Supabase unset (CI) or bootstrap fails, `useMarketplaceSearch` calls `getMarketplaceBootstrap` once (not 3 separate actions) |
| **Filter changes only** | After bootstrap, client calls `searchMarketplaceProducts` only (not bounds/rarities again) |

Default SSR search args: `page: 1`, `pageSize: 9` (mobile-first grid), `sortKey: "最新"`.

## Changelog (2026-07-17) — flexible card identifier search

| Change | Detail |
|--------|--------|
| **Migration `20260717100000`** | `compact_alphanumeric`, `canonical_card_search_key`, `catalog_card_identifier_matches` — ignore `-`/spaces; support reordered tokens (`M-P-133` ↔ `MP133` ↔ `133 MP`) |
| **`search_marketplace_products`** | `p_keyword` / structured set+card branches also call `catalog_card_identifier_matches` |
| **`search_marketplace_seller_listings`** | `p_name_query` flexible id match |
| **`search_user_trading_orders`** | order search flexible id match on `set_code` / `card_number` / `display_id` |
| **`lib/search/card-identifier.ts`** | Shared TS helpers for inventory/collection client filters |
| **`parseCatalogSearchQuery`** | Structured `set+card` only when left segment has letters and right is numeric (`sv2a-062`); promo ids stay on `p_keyword` |

## Changelog (2026-07-04) — unified keyword search

| Change | Detail |
|--------|--------|
| **Migration `20260704220000`** | Adds `p_keyword` to `search_marketplace_products` — single term OR-matches `name_ja`, `name_en`, `name_zh`, `set_code`, `card_number`, `display_id` |
| **`parseCatalogSearchQuery`** | Combo `set-card` (`sv2a-062`) → structured `p_set_code` + `p_card_number` (AND); all other input → `p_keyword` (no more short-alphanumeric → set-only heuristic) |
| **`searchMarketplaceProducts`** | Passes `p_keyword` from parsed query; `p_name_query` no longer set from UI `query` |
| **`types/supabase.ts`** | `p_keyword?: string` on RPC Args |
| **Frontend** | No UI changes — `useMarketplaceSearch` / `useHeroMarketplaceSearch` unchanged; benefits apply automatically after migration |

## Changelog (2026-07-04) — prior

| Change | Detail |
|--------|--------|
| **Own-listing UI (frontend)** | `MarketplaceProductRow.sellerId` (lowest listing's `seller_id`) used for grid card ownership — no backend change |
| **Session** | `getOptionalAuthUser()` on server page for grid `currentUserId`; client `useCurrentUserId` only when card parent does not pass prop |

## Changelog (2026-07-03)

| Change | Detail |
|--------|--------|
| **`getMarketplaceRarities()`** | New server action — `SELECT rarity` from `product_catalog`, dedupe + sort for filter UI |
| **Grade filter ids** | `parseGradeFilters()` accepts `lib/grading/options` option ids (`psa:10`, `bgs:10 (Black Label)`, `raw:A`, …) |
| **Seller source** | `mapSellerModes()` now maps UI `MEMBER` \| `MERCHANT` only; legacy `C2C` → `MEMBER` |
| **Shared grading helpers** | `normalizeGradingCompany`, `matchesGradeFilter`, `matchesAnyGradeFilter` in `lib/grading/options.ts` |
| **Filter constants** | `lib/marketplace/filter-options.ts` — `MARKETPLACE_SELLER_SOURCE_OPTIONS` |
| **`getMarketplaceProductDetail()`** | Catalog row for product detail — see [marketplace-product-detail/backend.md](../marketplace-product-detail/backend.md) |

No new DB migrations required for that slice (superseded by `20260704220000` for keyword search).

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260702120000_marketplace_search_rpc.sql` | RLS (`listings` active read, `profiles` public read), indexes, v1 RPC |
| `supabase/migrations/20260702130000_marketplace_search_rpc_v2.sql` | v2 RPC — grading, `seller_persona`, structured catalog filters, pagination meta |
| `supabase/migrations/20260704220000_marketplace_search_keyword.sql` | **`p_keyword`** unified text search (OR across catalog fields) |
| `app/actions/marketplace.ts` | `searchMarketplaceProducts`, `getMarketplacePriceBounds`, `getMarketplaceRarities`, **`getMarketplaceBootstrap`** |
| `app/marketplace/page.tsx` | Server page — SSR bootstrap + auth user |
| `app/lib/marketplace/types.ts` | `MarketplaceProductRow`, `MarketplacePaginationMeta`, `MarketplaceSearchInput`, `GradeFilter`, **`MarketplaceBootstrapData`**, **`MarketplaceBootstrapResult`** |
| `app/lib/marketplace/searchParsers.ts` | `parseCatalogSearchQuery`, **`parseGradeFilters`** (grading option ids), **`mapSellerModes`** |
| `lib/marketplace/filter-options.ts` | Seller source chip keys (`MEMBER`, `MERCHANT`) |
| `lib/grading/options.ts` | Canonical grading options + **`matchesGradeFilter`** / **`matchesAnyGradeFilter`** |
| `app/lib/hooks/useMarketplaceSearch.ts` | Debounced client hook; accepts **`initialData`** from SSR; filter changes → `searchMarketplaceProducts` only |
| `types/supabase.ts` | RPC function typings |

> **Note:** `"use server"` files may only export **async** functions. Parsers and types live in `app/lib/marketplace/` and `lib/` so client components can import them without bundling server code.

## Architecture

Grid is **product-centric**: one card per `product_catalog` row that has ≥ 1 matching `active` listing. Each product may have many listings; the grid shows the **lowest-price** matching listing.

```
product_catalog ──< listings (status = active)
                      ├── grading_company, grading_score
                      ├── seller_persona (member | merchant)
                      └── use_authentication (P2P escrow — not exposed in current filter UI)
```

## RPC: `search_marketplace_products`

### Args

| Param | Type | Purpose |
|-------|------|---------|
| **`p_keyword`** | `text` | **Primary UI path.** OR partial match on `name_ja`, `name_en`, `name_zh`, `set_code`, `card_number`, `display_id` |
| `p_set_code` | `text` | Structured set code match (used with `p_card_number` for combo queries) |
| `p_card_number` | `text` | Structured card number or `display_id` match (AND with `p_set_code` when combo) |
| `p_name_query` | `text` | Legacy structured name-only match (optional API use; UI uses `p_keyword` instead) |
| `p_rarities` | `text[]` | **Exact** `product_catalog.rarity` values (dynamic list from `getMarketplaceRarities`) |
| `p_seller_modes` | `text[]` | `MERCHANT`, `MEMBER` (P2P still supported by RPC if passed) |
| `p_grade_filters` | `jsonb` | `[{"company":"PSA","score":"10"},{"company":"RAW","score":null}]` |
| `p_price_min` / `p_price_max` | `numeric` | Listing price range |
| `p_sort` | `text` | `latest` \| `price_asc` \| `price_desc` |
| `p_page` / `p_page_size` | `int` | Pagination |

### Seller mode mapping (current UI)

| UI chip key | RPC value | SQL |
|-------------|-----------|-----|
| `MERCHANT` | `MERCHANT` | `seller_persona = 'merchant'` |
| `MEMBER` | `MEMBER` | `seller_persona = 'member' AND NOT use_authentication` |
| *(legacy)* `C2C` | `MEMBER` | Same as `MEMBER` |

`P2P` is **not** shown in filter UI; RPC still accepts `P2P` → `use_authentication = true` if needed later.

### Grade filter (`p_grade_filters`)

Built from grading option ids via `parseGradeFilters(activeGrades)`:

| UI selection (option id) | JSON sent to RPC |
|--------------------------|------------------|
| `psa:10` | `{"company":"PSA","score":"10"}` |
| `bgs:10 (Black Label)` | `{"company":"BGS","score":"10 (Black Label)"}` |
| `cgc:10 (Gem Mint)` | `{"company":"CGC","score":"10 (Gem Mint)"}` |
| `raw:A` | `{"company":"RAW","score":null}` |

**Note:** Raw condition (A/B/C/D) is **not** stored on `listings` today — all `raw:*` filters match `grading_company = RAW` regardless of condition letter.

### Sort behaviour

| `p_sort` | Orders products by |
|----------|-------------------|
| `latest` | `latest_listing_at` DESC |
| `price_asc` | `lowest_price` ASC |
| `price_desc` | `lowest_price` DESC |

## Server action contracts

### `searchMarketplaceProducts`

```ts
import { searchMarketplaceProducts } from "@/app/actions/marketplace";
import { parseGradeFilters, mapSellerModes } from "@/app/lib/marketplace/searchParsers";

const result = await searchMarketplaceProducts({
  query: "sv2a-062",
  rarities: ["SAR", "CSR"],           // exact catalog values
  gradeFilters: parseGradeFilters(["psa:10", "raw:A"]),
  sellerModes: mapSellerModes(["MERCHANT", "MEMBER"]),
  priceMin: 100,
  priceMax: 5000,
  sortKey: "價格：由低到高",
  page: 1,
  pageSize: 11,
});
```

### `getMarketplaceRarities()` *(new)*

```ts
import { getMarketplaceRarities } from "@/app/actions/marketplace";

// Success: { success: true, data: string[] }  — distinct non-null rarities, sorted
// Failure: { success: false, error: string }
```

Used by `AccordionFilters` when parent does not pass `rarities` + `disableRarityFetch`. On `/marketplace`, rarities come from **`getMarketplaceBootstrap`** (SSR or hook).

### `getMarketplaceBootstrap()` *(new)*

```ts
import { getMarketplaceBootstrap } from "@/app/actions/marketplace";

// Success:
// {
//   success: true,
//   data: {
//     products: MarketplaceProductRow[],
//     meta: MarketplacePaginationMeta,
//     priceBounds: { minPrice, maxPrice },
//     rarities: string[],
//   },
// }
// Failure: { success: false, error: string }
```

Runs bounds + rarities + search in parallel inside one server action. Used by:

- `app/marketplace/page.tsx` (SSR initial load)
- `useMarketplaceSearch` (client-only / CI fallback when `initialData` absent)

### `getMarketplacePriceBounds()`

```ts
// Success: { success: true, data: { minPrice, maxPrice } }
```

### `parseCatalogSearchQuery(query)`

| Input | Parsed as | RPC params |
|-------|-----------|------------|
| `sv2a-062` / `sv2a 062` | `setCode=sv2a`, `cardNumber=062` | `p_set_code` + `p_card_number` (AND) |
| `sv2a` | `keyword=sv2a` | `p_keyword` (matches set, names, card no, display_id) |
| `062` | `keyword=062` | `p_keyword` |
| `ピカチュウ` / `Pikachu` | `keyword=…` | `p_keyword` |
| `display_id` fragment | `keyword=…` | `p_keyword` |

### `MarketplaceProductRow`

| Field | RPC column | Notes |
|-------|------------|-------|
| `rarity` | `rarity` | Raw `product_catalog.rarity` (`string \| null`) |
| `gradingCompany` / `gradingScore` | `grading_*` | From cheapest matching listing — **not shown on grid card** |
| … | … | See prior table in git history for full field list |

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## How to verify

```bash
bunx supabase db push
bun run dev
```

SQL:

```sql
-- Rarities in catalog
SELECT DISTINCT rarity FROM product_catalog WHERE rarity IS NOT NULL ORDER BY rarity;

-- Unified keyword (name / set / card / display_id)
SELECT product_id, product_name, set_code, card_number, display_id
FROM search_marketplace_products(
  p_keyword := 'sv2a',
  p_page := 1,
  p_page_size := 10
);

-- Combo set + card (structured AND)
SELECT product_id, product_name, set_code, card_number
FROM search_marketplace_products(
  p_set_code := 'sv2a',
  p_card_number := '062',
  p_page := 1,
  p_page_size := 10
);

-- Filtered search
SELECT product_id, product_name, rarity, grading_company, grading_score, seller_persona
FROM search_marketplace_products(
  p_keyword := 'ピカチュウ',
  p_rarities := ARRAY['SAR'],
  p_grade_filters := '[{"company":"PSA","score":"10"}]'::jsonb,
  p_seller_modes := ARRAY['MERCHANT','MEMBER'],
  p_page := 1,
  p_page_size := 10
);
```

## Errors returned to UI

| Condition | `error` message |
|-----------|-----------------|
| Supabase RPC error | `搜尋大盤市場時發生錯誤` |
| Client / env failure | `無法連線至大盤市場` |
| Price bounds failure | `無法取得價格區間` |
| Rarities fetch failure | `無法載入稀有度選項` / `無法連線至商品目錄` |
| Bootstrap search failure | Same as `searchMarketplaceProducts` (`搜尋大盤市場時發生錯誤` / `無法連線至大盤市場`) |

## Blocked / not in scope

| Feature | Reason |
|---------|--------|
| Raw card condition filter (A/B/C/D) as separate facet | Removed from UI; condition not on `listings` — use `raw:*` grading options |
| Per-condition RAW RPC match | Needs `listings.condition` column or score encoding |
| Product detail nested listings | Separate RPC — see [marketplace-product-detail/backend.md](../marketplace-product-detail/backend.md) |

## Do not change without backend sync

- `MarketplaceProductRow` / `GradeFilter` shapes
- `parseGradeFilters` / `mapSellerModes` / grading option id format
- RPC param names and `p_sort` enum values
- `getMarketplaceRarities` query source (`product_catalog.rarity`)
- `getMarketplaceBootstrap` composition (parallel trio) — extend here if adding more bootstrap fields
- `success` / `error` envelope on server actions
