# Marketplace Product Detail — Frontend Handoff

## Status

- **Backend:** ✅ Catalog · ✅ listings RPC · ✅ trade history · ⏳ chart
- **Frontend:** ✅ **Catalog baseline wired** · ⏳ order book · ⏳ chart · ⏳ sold history
- **Your focus:** Order-book hook, chart wiring, styling polish; grid card polish (separate TODOs in search handoff)

## Changelog (2026-07-03)

| Area | What changed |
|------|----------------|
| **Route** | Server `page.tsx` + client `ProductDetailClient.tsx` |
| **Data** | `getMarketplaceProductDetail` — removed `INITIAL_LISTINGS` mock for catalog |
| **Grid navigation** | `MarketplaceCard` → `/marketplace/product/${productId}` (full card click; buy/wishlist isolated) |
| **Nav chrome** | `MarketplaceChrome` hides TopNav / MobileHeader / BottomNav on product detail |
| **Hero image** | Single image, `aspect-[4/3]`, no thumbnails |
| **Title block** | `name_ja` title; `name_zh` + `RarityBadge` subheading; set + card number meta |
| **Spec matrix** | 系列名稱, 日版原名, 卡牌屬性 (TC), 進化階段, 稀有度 — removed 弱點/撤退/畫師/招式 |
| **Element types** | `formatElementTypeZh(product.elementType)` from `lib/catalog/element-types.ts` |
| **Order book / chart / history** | Empty placeholders — mock removed; awaiting backend |

---

## File map

| File | Role |
|------|------|
| `app/marketplace/product/[id]/page.tsx` | Server: fetch catalog, `notFound()` on miss |
| `app/marketplace/product/[id]/ProductDetailClient.tsx` | Client: layout, filters UI, empty order book |
| `app/marketplace/MarketplaceChrome.tsx` | Hide nav on `/marketplace/product/[id]` |
| `app/marketplace/layout.tsx` | Wraps children in `MarketplaceChrome` |
| `app/components/marketplace/MarketplaceCard.tsx` | `productId` + click → detail route |
| `app/marketplace/page.tsx` | Passes `productId` in `toMarketplaceListing` |
| `app/components/marketplace/AskOrderBookRow.tsx` | `rarity: string \| null` (catalog-aligned) |

---

## Data wiring (current)

### Server page

```tsx
// app/marketplace/product/[id]/page.tsx
const result = await getMarketplaceProductDetail(id);
if (!result.success) notFound();
return <ProductDetailClient product={result.data} />;
```

### Client props

```ts
type ProductDetailClientProps = {
  product: MarketplaceProductDetail;
};
```

### Display mapping

| UI | Source |
|----|--------|
| `<h1>` | `product.nameJa` |
| Subheading | `product.nameZh` (if any) + `RarityBadge` |
| Meta | `product.setCode` \| `product.cardNumber` |
| Breadcrumb | `displayId` → `setCode-cardNumber` → `setCode` |
| Hero image | `product.images[0]` or `product.imageUrl` |
| 卡牌屬性 | `formatElementTypeZh(product.elementType)` |
| 進化階段 | `product.pokemonStage` or `—` |
| Market price banner | `—` until listings RPC (was mock `sellOrders`) |
| Order book | Empty — `sellOrders: []` |
| Chart | `MarketChartSkeleton` — `chartPoints: []` |
| Sold history | 「暫無成交紀錄」 |

---

## Navigation

### From grid

`MarketplaceCard` resolves:

```ts
/marketplace/product/${listing.productId ?? listing.id}
```

Wishlist / Buy use `stopPropagation()` — do not navigate.

### Nav hidden

`MarketplaceChrome` regex: `^/marketplace/product/[^/]+$`

Back control: chevron button (`router.back()`) on detail page.

---

## Partner TODO

### Backend-dependent (wire when actions land)

- [ ] **`useMarketplaceProductListings` hook** — call listings RPC/action with `subSortKey`, `onlyGraded`, `selectedGradeFilter`, pagination
- [ ] **Market price banner** — `lowestPrice` from listings meta or detail aggregate
- [ ] **Price chart** — replace skeleton with `getMarketplaceProductPriceChart` data
- [x] **Sold history** — `useMarketplaceProductTradeHistory`; guest blur overlay
- [ ] **Grade filter chips** — derive from distinct grades on active listings (not hardcoded PSA/CGC list)
- [ ] **`ExecutionSlideOver`** — pass listing images from DB row, slim `card` prop (drop `UnifiedProductSpec` dependency)

### Frontend polish (no backend block)

- [ ] Loading skeleton for server page (optional — currently instant SSR)
- [ ] 404 copy / link back to `/marketplace` (`not-found` is global today)
- [ ] Responsive pass on 4:3 hero + sticky column
- [ ] Listing count / price spread on **grid** card (`MarketplaceCard`) — see search handoff

---

## Acceptance checklist

### Catalog (done)

- [x] Grid card navigates to `/marketplace/product/<productId>`
- [x] Detail loads `product_catalog` from DB (no mock catalog)
- [x] Invalid / missing id → 404
- [x] Title / subheading / rarity layout
- [x] 卡牌屬性 in Traditional Chinese
- [x] Nav hidden on product detail
- [x] Single 4:3 hero image

### Pending

- [ ] Order book shows live listings with filter/sort/page
- [ ] Chart shows 30-day series (logged-in; guest blur)
- [ ] Sold history from DB
- [ ] Best ask price matches filtered listing set

---

## Manual test plan

1. `bun run dev` — ensure `product_catalog` has rows with listings on grid.
2. `/marketplace` — click card body (not Buy) → lands on detail with correct `name_ja` / image.
3. Confirm nav bars hidden on detail; visible on `/marketplace`.
4. Product with `name_zh` — subheading shows Chinese name + rarity badge.
5. Product with `element_type` = `Fire` or `炎` — spec shows 火.
6. Random UUID `/marketplace/product/00000000-0000-0000-0000-000000000000` → 404.
7. Order book shows empty state (expected until RPC).

---

## Do not change without backend sync

- `getMarketplaceProductDetail` / `MarketplaceProductDetail` in `app/actions/marketplace.ts` + types
- `formatElementTypeZh` in `lib/catalog/element-types.ts`
- Server/client split in `product/[id]/page.tsx`

---

## Related docs

- Grid search: [../marketplace-search/backend.md](../marketplace-search/backend.md) · [frontend](../marketplace-search/frontend.md)
- Integration queue: [../../INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md)
