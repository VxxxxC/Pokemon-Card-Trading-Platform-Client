# Marketplace Product Search — Frontend Handoff

## Status

- **Backend:** ✅ Ready (v2 RPC)
- **Frontend:** ✅ **Baseline wired** — live data on `/marketplace` and homepage hero search
- **Your focus:** Card polish (listing count, price spread), product detail page, condition filters when schema lands

## What is already done

| Feature | Location |
|---------|----------|
| Server-side search + pagination | `useMarketplaceSearch` → `searchMarketplaceProducts` |
| Debounced keyword (350ms) | `app/lib/hooks/useMarketplaceSearch.ts` |
| Set code / set+card / name parsing | `app/lib/marketplace/searchParsers.ts` → `parseCatalogSearchQuery` |
| Rarity facet | `activeRarities` → `p_rarities` |
| Grade facet (PSA 10, RAW, …) | `activeGrades` → `parseGradeFilters()` |
| Seller mode (MERCHANT / C2C / P2P) | `activeTypes` → `mapSellerModes()` |
| Price range slider | `priceRange` → `p_price_min` / `p_price_max` |
| Sort (最新 / 價格) | `sortKey` in `useMarketStore` |
| Pagination | `Pagination` + server `meta.totalPages` |
| Results summary | `顯示第 X–Y 件，共 Z 件現貨` |
| Grading on grid card | `formatGrade()` in `toMarketplaceListing` |
| Loading spinner | `app/marketplace/page.tsx` — only while `isLoading` |
| Empty state (no results) | `MarketplaceEmptyState.tsx` when `!isLoading && meta.total === 0` |
| Stable search refetch | `useMarketplaceSearch` — `searchKey` string dedupes requests |
| Error banner | `app/marketplace/page.tsx` |
| URL sync (`?q=`, `?rarity=`) | `useEffect` on search params |
| Homepage hero typeahead | `useHeroMarketplaceSearch` → `searchMarketplaceProducts` (query only) |
| Homepage 搜尋 → marketplace | `HeroSearch.tsx` — `router.push('/marketplace?q=…')` on submit / suggestion pick |
| Hero dropdown: price + grade | `HeroSearch.tsx` — `lowestPrice`, `listingCount`, `gradingCompany` |

## UI touchpoints

### Primary: `app/marketplace/page.tsx`

| Area | ~Lines | Notes |
|------|--------|-------|
| Hook wiring | L136–148 | Passes all filter state + `page` / `pageSize` |
| `toMarketplaceListing` mapper | L34–62 | Maps `gradingCompany` / `gradingScore` to card grade |
| Results summary header | subtitle under 「大盤市場」 | Uses `meta.rangeStart` / `rangeEnd` / `total` |
| Empty state | L509–515 | `MarketplaceEmptyState` when `!isLoading && (meta.total === 0)` |
| Price bounds init | `useEffect` on `priceBounds` | Sets slider once; skips `setState` if min/max unchanged |
| Product grid | `#product-cards` | `MarketplaceCard` per product |
| Pagination | bottom of grid | `totalItems={meta.total}` |

### Empty state: `app/components/marketplace/MarketplaceEmptyState.tsx`

| Prop | Purpose |
|------|---------|
| `hasActiveFilters` | Switches copy: filtered-empty vs market-empty |
| `query` | Highlights search term in empty message |
| `onResetFilters` | Wired to `handleResetAllFilters` — shows 「清除所有篩選」 |

**Two modes:**
- **Filters active, no matches** — 「找不到符合條件的現貨」 + reset button
- **No filters, empty market** — 「大盤暫無現貨標的」

### Store: `app/store/useMarketStore.ts`

| State | Used for |
|-------|----------|
| `query` | Keyword search |
| `activeRarities` | Rarity checkboxes |
| `activeGrades` | Grade checkboxes |
| `activeTypes` | MERCHANT / C2C / P2P |
| `activeConditions` | **UI only** — not sent to API yet |
| `sortKey` | `最新` \| `價格：由低到高` \| `價格：由高到低` |

### Homepage hero: `app/components/home/HeroSearch.tsx`

| Area | Notes |
|------|-------|
| Hook | `useHeroMarketplaceSearch()` — debounced 350ms, min 2 chars, `pageSize: 8` |
| RPC params | **Query only** — `searchMarketplaceProducts({ query, page: 1, pageSize: 8, sortKey: '最新' })`; `parseCatalogSearchQuery` splits set / card / name |
| Dropdown | Thumbnail, name, set·rarity·grade, `lowestPrice`, optional `listingCount` |
| Submit | **搜尋** / Enter → `searchNow()` then `/marketplace?q=…` |
| Suggestion pick | Fills input with `displayId` or `setCode-cardNumber`, navigates with `?q=` |
| Click outside | Closes dropdown |
| Quick filters | Unchanged — `Link` to `/marketplace?rarity=…` / `?q=charizard` |

**Why marketplace RPC (not product catalog):** hero copy promises lowest in-stock price; catalog search has no listing/price data.

### Filters UI

| Component | Path |
|-----------|------|
| Sidebar + mobile slide-over filters | `app/components/marketplace/filters/AccordionFilters.tsx` |
| Search autocomplete | `app/components/marketplace/filters/SmartSearch.tsx` (client-side on current page results) |
| Grid card | `app/components/marketplace/MarketplaceCard.tsx` |
| Empty state | `app/components/marketplace/MarketplaceEmptyState.tsx` |

## Module layout (import guide)

```ts
// Server actions — call from client hooks only
import { searchMarketplaceProducts, getMarketplacePriceBounds } from "@/app/actions/marketplace";

// Shared types — safe for client components
import type { MarketplaceProductRow, MarketplacePaginationMeta } from "@/app/lib/marketplace/types";

// Parsers — client-safe, used by hook before calling server action
import { parseGradeFilters, mapSellerModes } from "@/app/lib/marketplace/searchParsers";

// Homepage hero — lightweight typeahead (no filters / pagination)
import { useHeroMarketplaceSearch } from "@/app/lib/hooks/useHeroMarketplaceSearch";
```

## Hook API

```ts
import { useMarketplaceSearch } from "@/app/lib/hooks/useMarketplaceSearch";

const { products, meta, isLoading, error, priceBounds, refetch } =
  useMarketplaceSearch({
    query,
    rarities: activeRarities,
    grades: activeGrades,
    sellerTypes: activeTypes,
    priceMin: priceRange[0],
    priceMax: priceRange[1],
    sortKey,
    page: currentPage,
    pageSize: itemsPerPage, // 9 mobile / 11 desktop
  });
```

### `meta` shape

```ts
{
  total: 234,
  page: 2,
  pageSize: 11,
  totalPages: 22,
  rangeStart: 12,
  rangeEnd: 22,
}
```

### `useHeroMarketplaceSearch` (homepage)

```ts
const {
  query,
  setQuery,
  results,       // MarketplaceProductRow[]
  total,
  hasMore,
  isSearching,
  error,
  isDropdownOpen,
  closeDropdown,
  searchNow,
} = useHeroMarketplaceSearch();
```

| Pattern | Why |
|---------|-----|
| 60s in-memory cache per query | Avoid duplicate RPC while user reopens dropdown |
| `searchNow()` on button | Immediate RPC before navigation |
| No `priceBounds` fetch | Hero only needs suggestion rows |

## Hook implementation notes (do not break)

`useMarketplaceSearch` intentionally avoids depending on the inline `filters` object identity from the page (a new object every render).

| Pattern | Why |
|---------|-----|
| `searchKey` string (`filtersKey(...)`) | Effect only re-runs when filter **values** change |
| `filtersRef.current` | Reads latest filters inside the effect without unstable deps |
| `finally { setIsLoading(false) }` | Latest request always clears spinner — stale requests bail early |
| Debounced `query` merged into `searchKey` | Keyword search waits 350ms before RPC |

**If you add new filter fields:** update `MarketplaceSearchFilters`, `filtersKey()`, the `searchMarketplaceProducts` call in the hook, and the page wiring.

**Common pitfall:** putting `runSearch` or the whole `filters` object in a `useEffect` dependency array causes infinite re-fetch and a stuck loading spinner.

## `MarketplaceProductRow` — fields available for polish

| Field | Suggested UI |
|-------|--------------|
| `listingCount` | Badge: 「3 件現貨」 when > 1 |
| `highestPrice` | Show spread: `HK$ 1,200 – 2,400` when `listingCount > 1` |
| `gradingCompany` / `gradingScore` | ✅ Already on card via `GradeBadge` |
| `sellerPersona` | Chip: 🏪 商戶 vs 🏛️ 玩家 |
| `useAuthentication` | P2P escrow indicator |
| `latestListingAt` | 「最新上架」 relative time |
| `catalogType` | Box set vs single card label |
| `lowestListingId` | Wishlist / buy button target (listing-level) |

## Partner TODO (polish & next screen)

- [ ] **Listing count badge** on `MarketplaceCard` when `listingCount > 1`
- [ ] **Price spread** when `lowestPrice !== highestPrice`
- [ ] **Seller persona chip** (merchant vs member)
- [ ] **Product detail page** `app/marketplace/product/[id]/page.tsx` — list all nested listings (backend RPC TBD)
- [ ] **SmartSearch** — optionally call server for suggestions instead of filtering current page only
- [ ] **URL params** — `?set=sv2a&card=062` structured deep links (optional)
- [ ] **Condition filters** — wire when `listings.condition` column exists; until then consider hiding `activeConditions` UI or show disabled state
- [ ] **Empty state** — optional illustration / CTA to list a card (styling pass)
- [ ] **HeroSearch** — keyboard navigation (↑↓ Enter), highlight matched substring, style pass

## Acceptance checklist

- [x] Grid only shows products with ≥ 1 active listing
- [x] Card price = lowest matching listing price
- [x] Card grade = cheapest listing's `grading_company` + `grading_score`
- [x] Search: set code (`sv2a`)
- [x] Search: set + number (`sv2a-062`)
- [x] Search: card name
- [x] Price range filter
- [x] Merchant / member / P2P seller modes
- [x] Grading company + score filters
- [x] Sort: latest, price asc, price desc
- [x] Server pagination with total + range display
- [x] Empty state with filter-aware copy + reset CTA
- [x] Zero listings / zero matches — spinner stops, empty component shows
- [x] Homepage hero: typeahead hits DB (in-stock products only)
- [x] Homepage hero: 搜尋 / Enter → `/marketplace?q=…`
- [x] Homepage hero: suggestion pick → marketplace with resolved query
- [ ] Condition filters (blocked on schema)
- [ ] Product detail nested listings
- [ ] Listing count / price spread on card

## Do not change without backend sync

- `app/actions/marketplace.ts` — async server actions + response envelope
- `app/lib/marketplace/types.ts` — shared type shapes
- `app/lib/marketplace/searchParsers.ts` — filter/query mapping logic
- `useMarketplaceSearch` filter → action param mapping
- RPC param names / sort values

## Manual test plan

1. Apply migrations (`INTEGRATION_QUEUE.md`).
2. **Zero listings DB** — `/marketplace` shows empty state within one load cycle (no infinite spinner).
3. Seed ≥ 2 active listings on the same `product_id` with different prices/grades.
4. `/marketplace` — product appears once; price = lowest.
5. Filter PSA 10 — only products with a PSA 10 listing match.
6. Toggle MERCHANT only — only `seller_persona = merchant` listings match.
7. Change sort to 價格：由低到高 — order updates.
8. Paginate — header shows correct `X–Y of Z`.
9. Search nonsense or over-restrict filters — `MarketplaceEmptyState` appears; reset clears filters.
10. **Homepage** — type `sv2a` or card name → hero dropdown shows prices; submit lands on `/marketplace` with same query.
