# Marketplace Product Search — Backend Handoff

## Status

- **Backend:** ✅ Ready (v2 RPC)
- **Frontend:** ✅ Wired — `/marketplace` + homepage `HeroSearch` (query-only via same action)
- **Partner:** Polish UI + product detail nested listings — see [frontend.md](./frontend.md)

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `supabase/migrations/20260702120000_marketplace_search_rpc.sql` | RLS (`listings` active read, `profiles` public read), indexes, v1 RPC |
| `supabase/migrations/20260702130000_marketplace_search_rpc_v2.sql` | v2 RPC — grading, `seller_persona`, structured catalog filters, pagination meta |
| `app/actions/marketplace.ts` | Async server actions only: `searchMarketplaceProducts`, `getMarketplacePriceBounds` |
| `app/lib/marketplace/types.ts` | Shared types: `MarketplaceProductRow`, `MarketplacePaginationMeta`, `MarketplaceSearchInput`, … |
| `app/lib/marketplace/searchParsers.ts` | Client-safe parsers: `parseCatalogSearchQuery`, `parseGradeFilters`, `mapSellerModes` |
| `app/lib/hooks/useMarketplaceSearch.ts` | Debounced client hook |
| `types/supabase.ts` | RPC function typings (`search_marketplace_products`, `get_marketplace_price_bounds`) |

> **Note:** `"use server"` files may only export **async** functions. Parsers and types live in `app/lib/marketplace/` so the client hook can import them without bundling server code.

## Architecture

Grid is **product-centric**: one card per `product_catalog` row that has ≥ 1 matching `active` listing. Each product may have many listings; the grid shows the **lowest-price** matching listing. Detail page (planned) will show all nested listings.

```
product_catalog ──< listings (status = active)
                      ├── grading_company, grading_score
                      ├── seller_persona (member | merchant)
                      └── use_authentication (P2P escrow)
```

## RPC: `search_marketplace_products`

### Args

| Param | Type | Purpose |
|-------|------|---------|
| `p_set_code` | `text` | Set code partial match (`product_catalog.set_code`) |
| `p_card_number` | `text` | Card number or `display_id` |
| `p_name_query` | `text` | Card name (`name_ja`, `name_en`, `name_zh`) |
| `p_rarities` | `text[]` | Rarity facet |
| `p_seller_modes` | `text[]` | `MERCHANT`, `MEMBER`, `P2P` |
| `p_grade_filters` | `jsonb` | `[{"company":"PSA","score":"10"},{"company":"RAW","score":null}]` |
| `p_price_min` / `p_price_max` | `numeric` | Listing price range |
| `p_sort` | `text` | `latest` \| `price_asc` \| `price_desc` |
| `p_page` / `p_page_size` | `int` | Pagination |

### Seller mode mapping

| UI chip | RPC value | SQL |
|---------|-----------|-----|
| MERCHANT | `MERCHANT` | `seller_persona = 'merchant'` |
| C2C | `MEMBER` | `seller_persona = 'member' AND NOT use_authentication` |
| P2P | `P2P` | `use_authentication = true` |

### Grade filter (`p_grade_filters`)

| JSON | Matches |
|------|---------|
| `{"company":"PSA","score":"10"}` | `grading_company = PSA` AND `grading_score = 10` |
| `{"company":"RAW","score":null}` | Raw cards |
| `{"company":"OTHER"}` | Not PSA / CGC / BGS / RAW |

### Sort behaviour

| `p_sort` | Orders products by |
|----------|-------------------|
| `latest` | `latest_listing_at` DESC (newest active listing per product) |
| `price_asc` | `lowest_price` ASC |
| `price_desc` | `lowest_price` DESC |

## Server action contract

```ts
import { searchMarketplaceProducts, getMarketplacePriceBounds } from "@/app/actions/marketplace";
import {
  parseCatalogSearchQuery,
  parseGradeFilters,
  mapSellerModes,
} from "@/app/lib/marketplace/searchParsers";
import type { MarketplaceProductRow, MarketplacePaginationMeta } from "@/app/lib/marketplace/types";

const result = await searchMarketplaceProducts({
  query: "sv2a-062",              // auto-parsed (see below)
  setCode: "sv2a",                // optional explicit override
  cardNumber: "062",
  rarities: ["SAR"],
  gradeFilters: parseGradeFilters(["PSA 10", "RAW"]),
  sellerModes: mapSellerModes(["MERCHANT", "C2C"]),
  priceMin: 100,
  priceMax: 5000,
  sortKey: "價格：由低到高",       // maps to price_asc
  page: 1,
  pageSize: 11,
});

// Homepage hero (`useHeroMarketplaceSearch`) — same action, query-only:
// searchMarketplaceProducts({ query: "charizard", page: 1, pageSize: 8, sortKey: "最新" })

// Success
{
  success: true,
  data: MarketplaceProductRow[],
  meta: {
    total: 234,
    page: 1,
    pageSize: 11,
    totalPages: 22,
    rangeStart: 1,
    rangeEnd: 11,
  },
}

// Failure
{ success: false, error: string }
```

### `parseCatalogSearchQuery(query)` — `app/lib/marketplace/searchParsers.ts`

| Input | Parsed as |
|-------|-----------|
| `sv2a-062` / `sv2a 062` | `setCode=sv2a`, `cardNumber=062` |
| `sv2a` (short alphanumeric) | `setCode=sv2a` |
| `ピカチュウ` | `nameQuery=ピカチュウ` |

### `MarketplaceProductRow` (camelCase in action)

| Field | RPC column | Notes |
|-------|------------|-------|
| `productId` | `product_id` | Grid id + detail route |
| `productName` | `product_name` | `name_zh ?? name_ja` |
| `nameJa` / `nameEn` / `nameZh` | `name_*` | Full catalog names |
| `setCode` | `set_code` | |
| `cardNumber` | `card_number` | |
| `displayId` | `display_id` | |
| `rarity` | `rarity` | Raw DB value |
| `imageUrl` | `image_url` | |
| `catalogType` | `catalog_type` | `single_card`, `booster_box`, … |
| `listingCount` | `listing_count` | Matching active listings |
| `lowestPrice` | `lowest_price` | Grid price |
| `highestPrice` | `highest_price` | Price spread hint |
| `lowestListingId` | `lowest_listing_id` | Cheapest listing |
| `lowestListingCreatedAt` | `lowest_listing_created_at` | |
| `latestListingAt` | `latest_listing_at` | Newest listing on product |
| `gradingCompany` | `grading_company` | From cheapest listing |
| `gradingScore` | `grading_score` | From cheapest listing |
| `sellerId` / `sellerName` | `seller_*` | From cheapest listing |
| `sellerPersona` | `seller_persona` | `member` \| `merchant` |
| `useAuthentication` | `use_authentication` | P2P flag |

Pagination meta is taken from the first RPC row (`total_count`, `range_start`, `range_end`, etc.).

### `getMarketplacePriceBounds()`

```ts
// Success: { success: true, data: { minPrice, maxPrice } }
// Uses RPC get_marketplace_price_bounds (or falls back if unavailable)
```

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

## How to verify

```bash
supabase db push   # applies v1 + v2 migrations
bun run dev        # /marketplace
```

SQL:

```sql
SELECT product_id, product_name, listing_count, lowest_price,
       grading_company, grading_score, seller_persona,
       total_count, range_start, range_end
FROM search_marketplace_products(
  p_set_code := 'sv2a',
  p_grade_filters := '[{"company":"PSA","score":"10"}]'::jsonb,
  p_seller_modes := ARRAY['MERCHANT'],
  p_sort := 'price_asc',
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

Raw database errors are **not** leaked to the client.

## Blocked / not in v2

| Feature | Reason |
|---------|--------|
| Condition filters (A/B/C/D) | No `condition` column on `listings` yet |
| Product detail nested listings | Separate RPC planned — see queue |

## Do not change without backend sync

- `MarketplaceProductRow` / `MarketplacePaginationMeta` shapes in `app/lib/marketplace/types.ts`
- `parseCatalogSearchQuery` / `parseGradeFilters` / `mapSellerModes` in `app/lib/marketplace/searchParsers.ts`
- RPC param names and `p_sort` enum values
- `success` / `error` envelope on server actions

UI styling in `app/marketplace/page.tsx` is partner-owned.
