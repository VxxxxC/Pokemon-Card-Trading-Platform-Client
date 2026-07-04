# Marketplace Product Search — Frontend Handoff

## Status

- **Backend:** ✅ Ready (v2 RPC + unified `p_keyword`)
- **Frontend:** ✅ **Wired** — live search, updated filters, grid card baseline
- **Your focus:** Grid card polish (listing count, price spread, seller chip), filter styling pass. Product detail **catalog** done — see [marketplace-product-detail/frontend.md](../marketplace-product-detail/frontend.md)

## Changelog (2026-07-04) — SSR bootstrap + load performance

| Area | What changed |
|------|----------------|
| **Server page** | `app/marketplace/page.tsx` — Server Component; fetches `getMarketplaceBootstrap` + `getOptionalAuthUser` in parallel; no client POSTs on first paint |
| **`MarketplacePageClient.tsx`** | Client UI extracted from former monolithic `page.tsx`; receives `initialData` + `currentUserId` props |
| **`useMarketplaceSearch`** | Optional `initialData` — grid renders immediately from SSR; returns **`rarities`**; filter/page changes call `searchMarketplaceProducts` only |
| **Own-listing session** | `currentUserId` fetched **once** on page (SSR); passed to every `MarketplaceCard` via prop — avoids N× `getCurrentUserProfile` |
| **`MarketplaceCard.currentUserId`** | Optional prop; when set, skips per-card `useCurrentUserId()` hook |
| **Rarity fetch** | Single bootstrap/SSR load; both `AccordionFilters` instances get `rarities` + `disableRarityFetch` |
| **Viewport** | `useSyncExternalStore` + `matchMedia` — correct `pageSize` on first paint (no mobile→desktop refetch flash) |
| **Desktop note** | SSR uses `pageSize: 9`; desktop (`11`) may trigger **one** extra search POST after hydration |
| **`MarketplaceCard` subtitle** | Set code before card number — `{SET} · {cardNo}` (e.g. `SV2A · 062`) from `listing.set` |

## Changelog (2026-07-04) — unified keyword search

| Area | What changed |
|------|----------------|
| **Keyword behaviour** | One search box term now matches **name (ja/en/zh), set code, card number, and display_id** via backend `p_keyword` — no frontend wiring change |
| **`parseCatalogSearchQuery`** | Only `sv2a-062`-style combos use structured set+card; everything else is a unified keyword |
| **Hero + marketplace search** | `useHeroMarketplaceSearch` and `useMarketplaceSearch` benefit automatically after migration `20260704220000` |

## Changelog (2026-07-04) — own-listing UI

| Area | What changed |
|------|----------------|
| **`MarketplaceCard` own-listing guard** | Compares `listing.sellerId` with `currentUserId` (from page SSR prop or optional per-card hook fallback); gold ring + **我的掛單** badge + seller **(你)** + disabled buy button |
| **`useCurrentUserId`** | Hook — `getCurrentUserProfile()` on mount; used by grid card **only when parent omits `currentUserId` prop** (e.g. mock storefront pages) |

## Changelog (2026-07-03)

| Area | What changed |
|------|----------------|
| **`MarketplaceCard`** | Rarity badge on image (top-left) from `product_catalog.rarity`; **no** `GradeBadge` on card |
| **`MarketplaceListing.rarity`** | `Tables<"product_catalog">["rarity"]` (`string \| null`) — no SAR/UR/SR/AR normalization |
| **`RarityBadge`** | Accepts `string \| null`; renders nothing when empty |
| **`AccordionFilters`** | Dynamic rarities from DB; seller source = 會員 + 認證商戶 only; grading groups match create-listing dropdown; **removed** separate 裸卡品相分級 section |
| **`useMarketStore`** | Removed `activeConditions` / `toggleCondition` |
| **Grade filter state** | Stores grading **option ids** (`psa:10`, `raw:B`, …) not display strings |

## What is already done

| Feature | Location |
|---------|----------|
| **SSR initial load** | `app/marketplace/page.tsx` → `getMarketplaceBootstrap` → `MarketplacePageClient` |
| Server-side search + pagination | `useMarketplaceSearch` → `searchMarketplaceProducts` (or bootstrap on first load) |
| Debounced keyword (350ms) | `app/lib/hooks/useMarketplaceSearch.ts` |
| Unified keyword (name / set / card / display_id) | `query` → `parseCatalogSearchQuery` → `p_keyword` (or structured set+card for combos) |
| Rarity facet (all catalog values) | Bootstrap / `getMarketplaceRarities` → `AccordionFilters` (`rarities` prop + `disableRarityFetch`) → `p_rarities` |
| Grade facet (create-listing options) | `GRADING_OPTION_GROUPS` / `GRADING_OPTIONS` → option ids → `parseGradeFilters()` |
| Seller source (會員 / 認證商戶) | `MARKETPLACE_SELLER_SOURCE_OPTIONS` → `mapSellerModes()` |
| Price range slider | `priceRange` → `p_price_min` / `p_price_max` |
| Sort (最新 / 價格) | `sortKey` in `useMarketStore` |
| Pagination + results summary | `Pagination` + `meta.rangeStart` / `rangeEnd` / `total` |
| Grid card rarity | `RarityBadge` on image when `listing.rarity` present |
| Loading / empty / error states | `MarketplacePageClient.tsx`, `MarketplaceEmptyState.tsx` |
| URL sync (`?q=`, `?rarity=`) | Case-insensitive rarity match; preserves catalog value |
| Homepage hero typeahead | `useHeroMarketplaceSearch` (unchanged) |

## UI touchpoints

### Grid card: `app/components/marketplace/MarketplaceCard.tsx`

| Element | Behaviour |
|---------|-----------|
| Image overlay top-left | `RarityBadge` when `listing.rarity` is non-null |
| Image overlay bottom-left | **我的掛單** badge when `listing.sellerId === currentUserId` |
| Image overlay top-right | `WishlistButton` |
| Card wrapper | Gold ring when own listing |
| Body | Name; **set code · card no** (`listing.set` + `listing.cardNo`); price, delta, seller — **no grade row**; seller shows **(你)** when own listing |
| Footer CTA | `BuyButton` for others; disabled **我的掛單 · 無法出價** for own listing |
| `MarketplaceListing.set` | `product.setCode` from `toMarketplaceListing` — displayed uppercase before card number |
| `MarketplaceListing.grade` | Still on type for `BuyButton` / mocks; not rendered |

### Filters: `app/components/marketplace/filters/AccordionFilters.tsx`

| Section | Source | State key |
|---------|--------|-----------|
| 刊登來源 | `MARKETPLACE_SELLER_SOURCE_OPTIONS` | `activeTypes` (`MEMBER`, `MERCHANT`) |
| 稀有度 | `rarities` prop from page bootstrap (or internal fetch if prop omitted) | `activeRarities` |
| 鑑定／品相 | `GRADING_OPTION_GROUPS` + `getGradingOptionsByGroup` | `activeGrades` (option **ids**) |

**Removed:** 裸卡品相分級 / `activeConditions` — raw conditions live under 鑑定／品相 → 裸卡 group.

**Props:** `rarities` + `disableRarityFetch` — marketplace page passes both so filters never self-fetch.

### Primary page: `app/marketplace/page.tsx` + `app/marketplace/MarketplacePageClient.tsx`

| Area | Notes |
|------|-------|
| Server `page.tsx` | `getMarketplaceBootstrap({ page: 1, pageSize: 9, sortKey: "最新" })` + `getOptionalAuthUser()` |
| `MarketplacePageClient` | All interactive UI; `toMarketplaceListing` maps `set: product.setCode`, `cardNo` from catalog |
| `useMarketplaceSearch` wiring | `{ initialData }` from SSR; `rarities`, `grades` (ids), `sellerTypes`, `priceRange`, `sortKey`, `page` |
| `currentUserId` | SSR prop → every `MarketplaceCard` |
| `hasActiveFilters` | query, rarities, grades, seller types, price range — **no** conditions |
| Desktop + mobile `AccordionFilters` | Same props; `rarities` + `disableRarityFetch`; type section visible on main marketplace |

### Store: `app/store/useMarketStore.ts`

| State | Used for |
|-------|----------|
| `query` | Keyword search |
| `activeRarities` | Rarity chips (catalog strings) |
| `activeGrades` | Grading option ids |
| `activeTypes` | `MEMBER` \| `MERCHANT` |
| `sortKey` | `最新` \| `價格：由低到高` \| `價格：由高到低` |
| `resetAll()` | Clears all above |

### Merchant storefront (mock): `app/marketplace/[id]/page.tsx`

| Note | Detail |
|------|--------|
| Filters | `hideTypeSection={true}` — no seller source section |
| Grade match | `matchesAnyGradeFilter()` from `lib/grading/options.ts` |
| Rarities | Loaded via same `AccordionFilters` DB fetch |

```ts
// MarketplacePageClient — preferred (SSR):
<MarketplaceCard listing={item} currentUserId={currentUserId} />

// Fallback when parent does not pass currentUserId (e.g. mock storefront):
import { useCurrentUserId } from "@/app/lib/hooks/useCurrentUserId";

const currentUserId = useCurrentUserId();
const isOwnListing =
  currentUserId != null &&
  listing.sellerId != null &&
  listing.sellerId === currentUserId;
```

**Note:** Grid search RPC returns `seller_id` for the **lowest-price** listing per product. Own-listing UI appears only when that lowest listing belongs to the logged-in user.

## Module layout

```ts
import {
  searchMarketplaceProducts,
  getMarketplaceBootstrap,
  getMarketplaceRarities,
} from "@/app/actions/marketplace";
import { parseGradeFilters, mapSellerModes } from "@/app/lib/marketplace/searchParsers";
import { MARKETPLACE_SELLER_SOURCE_OPTIONS } from "@/lib/marketplace/filter-options";
import {
  GRADING_OPTION_GROUPS,
  getGradingOptionsByGroup,
  matchesAnyGradeFilter,
} from "@/lib/grading/options";
import type { MarketplaceProductRow } from "@/app/lib/marketplace/types";
```

## Hook API

```ts
const { products, meta, isLoading, error, priceBounds, rarities, refetch } =
  useMarketplaceSearch(
    {
      query,
      rarities: activeRarities,
      grades: activeGrades,        // grading option ids
      sellerTypes: activeTypes,      // MEMBER | MERCHANT
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      sortKey,
      page: currentPage,
      pageSize: itemsPerPage,
    },
    {
      initialData, // optional — from SSR getMarketplaceBootstrap
    },
  );
```

- **`initialData` present:** `isLoading` starts `false`; products/meta/bounds/rarities hydrated from server.
- **`initialData` absent:** hook calls `getMarketplaceBootstrap` once on mount, then searches on filter changes only.

**If you add filter fields:** update `MarketplaceSearchFilters`, `filtersKey()`, hook RPC call, page wiring, and `AccordionFilters`.

## Partner TODO (polish & next screen)

- [ ] **Listing count badge** on `MarketplaceCard` when `listingCount > 1`
- [ ] **Price spread** when `lowestPrice !== highestPrice`
- [ ] **Seller persona chip** (merchant vs member) on card
- [ ] **Filter UX** — collapsible grading groups, search within long rarity list
- [ ] **Product detail** order book + chart + history — [marketplace-product-detail/frontend.md](../marketplace-product-detail/frontend.md)
- [ ] **SmartSearch** — server suggestions vs current-page filter only
- [ ] **URL params** — `?set=sv2a&card=062` structured deep links
- [ ] **HeroSearch** — keyboard nav, style pass
- [ ] **Styling pass** on `AccordionFilters` scroll areas and mobile slide-over

## Acceptance checklist

- [x] Grid only shows products with ≥ 1 active listing
- [x] Card price = lowest matching listing price
- [x] Card shows **rarity** from `product_catalog.rarity` (not normalized enum)
- [x] Card does **not** show grading badge
- [x] Rarity filter loads all distinct catalog rarities
- [x] Seller filter: 會員 + 認證商戶 only
- [x] Grade filter options match `AddAssetModal` grading dropdown
- [x] Grade filter sends correct company + score to RPC
- [x] Keyword matches name (ja/en/zh), set code, card number, display_id (`p_keyword`, migration `20260704220000`)
- [x] Search, price range, sort, pagination
- [x] Empty state + reset filters
- [x] Homepage hero → `/marketplace?q=…`
- [x] Own listing on grid card — badge, ring, disabled buy (when lowest listing is seller's)
- [x] SSR bootstrap — grid + filters hydrate without initial client POST storm
- [x] Set code · card number on grid card subtitle
- [ ] Listing count / price spread on card
- [ ] Product detail order book / chart / history ([detail handoff](../marketplace-product-detail/frontend.md))
- [ ] Raw condition-specific filter (blocked — no `listings.condition` column)

## Do not change without backend sync

- `app/actions/marketplace.ts` — server actions + envelopes
- `parseGradeFilters` / `mapSellerModes` / grading option id format
- `getMarketplaceBootstrap` / SSR page wiring
- `useMarketplaceSearch` filter → RPC param mapping and `initialData` contract

## Manual test plan

1. Apply migrations (`INTEGRATION_QUEUE.md`) — include **`20260704220000_marketplace_search_keyword.sql`** for unified keyword.
2. `/marketplace` — first paint shows product grid without long spinner (SSR bootstrap).
3. Network tab on cold load — **0** marketplace POSTs before interaction (desktop may POST once for `pageSize` 11).
4. Rarity section shows DB values (not only SAR/UR/SR/AR).
5. Toggle **認證商戶** — only `seller_persona = merchant` listings match.
6. Toggle **PSA 10** under 鑑定／品相 — only PSA 10 listings match.
7. Toggle **裸卡 A** — matches all RAW listings (condition not in DB yet).
8. Grid card — rarity chip on image; subtitle shows **SET · cardNo**; no PSA/CGC badge.
9. `?rarity=SAR` (or any catalog value) — pre-selects matching chip.
10. Reset filters — clears rarities, grades, seller types, query, price slider.
11. Merchant storefront `/marketplace/[id]` — grade filter still works on mock data.
12. Log in as seller with lowest-price listing on a product — grid card shows **我的掛單**; buy button disabled.
13. Search `062` or a `display_id` fragment — unified keyword returns matching in-stock products.
14. Search `sv2a-062` — structured combo still narrows to set + card (AND).
