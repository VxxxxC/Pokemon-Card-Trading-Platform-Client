# Marketplace Product Detail — Frontend Handoff

## Status

- **Backend:** ✅ All slices ready (incl. on-demand listing detail)
- **Frontend:** ✅ Catalog · ✅ order book · ✅ trade history · ✅ market price + chart · ✅ `ExecutionSlideOver` listing photos
- **Your focus:** Polish, grid card market price (optional), slide-over tap-to-enlarge (optional)

## Changelog (2026-07-08)

| Area | Shipped |
|------|---------|
| **Global execution slide-over** | `ProductDetailClient` order book → `useUIStore.openExecutionSlideOver`; no per-page `<ExecutionSlideOver />` |
| **`ExecutionSlideOverHost`** | Mounted in `app/layout.tsx` alongside `AddAssetModal` / `GlobalChatOverlay` |
| **Mapper** | `lib/marketplace/map-listing-to-execution.ts` — `buildOrderBookExecutionPayload(product, listingId, order)` |

## Changelog (2026-07-04)

| Area | Shipped |
|------|---------|
| **Own-listing guard** | Sellers cannot open offer slide-over on their own order-book rows; visual **我的掛單** badge + disabled interaction |
| **Session wiring** | `page.tsx` passes `currentUserId` from `getOptionalAuthUser()` → `ProductDetailClient` |

## Changelog (2026-07-03)

| Area | Shipped |
|------|---------|
| **Catalog** | SSR `getMarketplaceProductDetail`, hero, spec matrix, nav hidden |
| **Order book** | `useMarketplaceProductListings` — sort, graded-only, grade chips, pagination |
| **Trade history** | `useMarketplaceProductTradeHistory` — guest blur |
| **Market banner** | `market_avg_price` + `market_trend_30d` (green/red icons) |
| **Market chart** | Recharts 30-day series; guest blur |
| **Market grade chips** | DB-available grades only; independent from order-book filters |
| **Execution slide-over** | On-demand `useMarketplaceListingDetail`; 3×2 **3:4** thumbnail grid (4–6 seller photos) |

---

## File map

| File | Role |
|------|------|
| `app/marketplace/product/[id]/page.tsx` | Server catalog fetch + `currentUserId` from session |
| `app/marketplace/product/[id]/ProductDetailClient.tsx` | Full client layout; order book → `openExecutionSlideOver`; own-listing guard |
| `app/components/transactions/ExecutionSlideOverHost.tsx` | Global slide-over host (root layout) |
| `lib/marketplace/map-listing-to-execution.ts` | Order book + listing → execution payload |
| `app/components/marketplace/AskOrderBookRow.tsx` | Order book row; `isOwnListing` visual + click guard |
| `app/components/transactions/ExecutionSlideOver.tsx` | Negotiation slide-over; listing photo grid |
| `app/lib/hooks/useMarketplaceProductListings.ts` | Order book (slim rows — no images) |
| `app/lib/hooks/useMarketplaceListingDetail.ts` | Listing gallery + description (fetch on slide-over open) |
| `app/lib/hooks/useMarketplaceProductMarketPrice.ts` | Market prices (bulk) |
| `app/lib/hooks/useMarketplaceProductTradeHistory.ts` | Sold history |
| `app/marketplace/MarketplaceChrome.tsx` | Hide nav on detail |

---

## Data wiring

### Server page

```tsx
const [result, user] = await Promise.all([
  getMarketplaceProductDetail(id),
  getOptionalAuthUser(),
]);
if (!result.success) notFound();
return (
  <ProductDetailClient
    product={result.data}
    currentUserId={user?.id ?? null}
  />
);
```

**Ownership rule:** compare `currentUserId` with order-book `sellerId` (same as `listings.seller_id` / `profiles.id`). Guest → `currentUserId` is `null`; all rows remain clickable.

### Display mapping (current)

| UI | Source |
|----|--------|
| Title / meta / spec | `product` (catalog) |
| Market avg + trend | `useMarketplaceProductMarketPrice` → selected grade |
| Market grade chips | `availableGrades` from same hook |
| 30-day chart | `marketPrice.chartPoints` |
| Order book | `useMarketplaceProductListings` |
| 最優現貨掛牌價 | `lowestPrice` from listings meta |
| Sold history | `useMarketplaceProductTradeHistory` (logged-in) |
| Slide-over seller/price/grade | Order book row (`SellOrder`) — instant on open |
| Slide-over photo grid | `useMarketplaceListingDetail({ listingId, enabled: isOpen })` → `detail.images` |
| Slide-over photo fallback | Catalog `card.images` when listing has no photos |

### Order book → slide-over click flow

```tsx
// ProductDetailClient.tsx
const openExecutionSlideOver = useUIStore((s) => s.openExecutionSlideOver);

onOpenGate={(o) => {
  if (currentUserId != null && o.sellerId === currentUserId) return;
  openExecutionSlideOver(
    buildOrderBookExecutionPayload(product, row.listingId, o),
  );
}}
```

Slide-over UI is rendered by **`ExecutionSlideOverHost`** in root layout (not on this page).

Own rows: gold border, **我的掛單** badge, `cursor-default`, helper text below row. Slide-over never opens for own listings.

`ExecutionSlideOver` opens immediately with row data; photos load in parallel (spinner skeleton grid → 3-column **3:4** thumbnails).

### Two grade pickers (intentional)

| Picker | Location | Drives |
|--------|----------|--------|
| **Market grade chips** | Inside price banner | Avg, trend, chart — only grades in `product_grading_market_prices` |
| **Order book chips** | Order book panel | Live listings filter — full `GRADING_OPTIONS` list |

They are **not** synced. Market chips appear only when `availableGrades.length > 1`.

---

## Partner TODO

### Done

- [x] `useMarketplaceProductListings`
- [x] Market price banner from cache (not `lowestPrice`)
- [x] Price chart from `product_grading_market_prices`
- [x] `market_trend_30d` badge
- [x] Per-grade market price picker (DB availability)
- [x] Sold history + guest blur
- [x] **`ExecutionSlideOver`** — on-demand listing images; 3:4 thumbnail grid (not carousel)
- [x] **Own-listing guard** — order book + `AskOrderBookRow`; session `currentUserId` from server page
- [x] **Global slide-over host** — order book + all `BuyButton` entry points share `ExecutionSlideOverHost`

### Remaining

- [ ] **Order book RAW A/B/C/D** — blocked until listings store condition ([backend](./backend.md))
- [ ] **Grade chips from live listings** — optional UX (derive distinct grades on active listings)
- [ ] Grid `MarketplaceCard` market avg — see [market-pricing-cron frontend](../market-pricing-cron/frontend.md)
- [ ] Slide-over **tap-to-enlarge** / lightbox — optional polish

### Polish (no backend block)

- [ ] Server page loading skeleton
- [ ] 404 copy / link back to `/marketplace`
- [ ] Responsive pass on hero + sticky column
- [ ] Slim `card` prop on `ExecutionSlideOver` (name + rarity only; reduce `UnifiedProductSpec` shim)

---

## Acceptance checklist

### Catalog

- [x] Grid → detail navigation
- [x] Live catalog data, 404 on miss
- [x] Nav hidden on detail

### Order book

- [x] Live listings, filters, sort, pagination
- [x] 最優現貨掛牌價 from filtered set
- [x] Own listing rows visually distinct; not clickable; no offer slide-over

### Market price + chart

- [x] Banner avg from `market_avg_price`
- [x] Trend badge with sign + color
- [x] Chart when `chartPoints.length > 0`
- [x] Market grade chips when multiple cache rows
- [x] 裸卡 A/B/C/D labels when cron wrote separate rows

### Trade history

- [x] Guest blur; logged-in list + pagination

### Execution slide-over

- [x] Row click opens slide-over with seller + price from order book
- [x] Listing photos fetched by `listingId` (not bundled in order book RPC)
- [x] 3-column **3:4** thumbnail grid for 4–6 seller photos
- [x] Loading skeleton grid while detail fetch runs
- [x] Catalog image fallback when listing has no photos

---

## Manual test plan

1. Product with listings → order book populated.
2. Product with cron cache → banner + chart; switch market grade chips.
3. Product with RAW snapshots (`condition_type` A and B) → after cron, two market chips.
4. Guest → chart + history blurred; banner visible.
5. Product without cache → banner `—`, chart skeleton.
6. Click order book row → slide-over opens; skeleton grid → seller photos (4–6) in 3:4 grid.
7. Listing with no uploaded images → catalog fallback image in grid.
8. Switch to another listing row → new `listingId` fetch; grid updates.
9. Log in as seller with listing on product → own row shows **我的掛單**; click does nothing; other sellers' rows still open slide-over.

---

## Do not change without backend sync

- `getMarketplaceListingDetail` / `getMarketplaceProductMarketPrices` / types in `app/actions/marketplace.ts`
- `lib/marketplace/market-price.ts`
- `lib/listings/images.ts` (`parseListingImageUrls` contract)
- Server/client split in `page.tsx`

---

## Related docs

- Market pricing: [../market-pricing-cron/frontend.md](../market-pricing-cron/frontend.md)
- Grid search: [../marketplace-search/frontend.md](../marketplace-search/frontend.md)
- Integration queue: [../../INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)
