# Merchant Storefront (`/marketplace/[id]`) — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired
- **Partner report:** [PARTNER_REPORT.md](./PARTNER_REPORT.md)

## Module layout

```
app/marketplace/[id]/
  page.tsx                          # Server + Suspense
  MerchantStorefrontPageData.tsx    # SSR profile + first listings page
  MerchantStorefrontPageClient.tsx  # Filters + grid
  MerchantStorefrontPageSkeleton.tsx

app/marketplace/[id]/product/[productId]/
  page.tsx
  MerchantProductDetailPageData.tsx
  MerchantProductDetailPageClient.tsx
  MerchantProductDetailPageSkeleton.tsx

app/lib/hooks/useMarketplaceSellerSearch.ts
```

## SSR props → storefront client

| Prop | Source |
|------|--------|
| `seller` | `getMarketplaceSellerProfile(id)` |
| `initialListings` | `searchMarketplaceSellerListings({ sellerId, page: 1, pageSize: 50, sortKey: "最新" })` |
| `currentUserId` | `getOptionalAuthUser()` |
| `bootstrapError` | Supabase unset or listings fetch failure |

## Hook (storefront grid)

```ts
const { listings, meta, error, priceBounds, isRefreshing } =
  useMarketplaceSellerSearch(
    {
      sellerId: seller.id,
      query,
      rarities: activeRarities,
      grades: activeGrades,
      priceMin: priceRange[0],
      priceMax: priceRange[1],
      sortKey,
      page: 1,
      pageSize: MARKETPLACE_STOREFRONT_PAGE_SIZE,
    },
    { initialData: initialListings, absolutePriceBounds: initialListings?.priceBounds },
  );
```

- Skips first client fetch when `initialData` provided (same pattern as `useMarketplaceSearch`)
- Debounced query (350ms)
- Maps rows with `toMarketplaceCardListing()` → `MarketplaceCard`

## Private listing detail

| Prop | Source |
|------|--------|
| `detail` | `getMarketplaceSellerListingDetail(id, productId)` |
| `routeProductId` | Raw URL segment (shown as fallback batch label) |

`[productId]` accepts listing UUID, catalog `display_id`, or `product_id` — see [PARTNER_REPORT.md](./PARTNER_REPORT.md).

## UI notes

| Item | Detail |
|------|--------|
| `hideTypeSection={true}` | No seller-source filter on storefront |
| `MarketplaceCard` | Pass `currentUserId` from SSR |
| `BuyButton` | Storefront + grid — opens global `ExecutionSlideOver` via `storefrontListing` prop |
| `detailHref` | `/marketplace/{sellerId}/product/{listingId}` |
| `delta` | Fixed at `0` for now |
| Pagination | Not in UI yet — page size 50 |

## Acceptance checklist

- [ ] Seller header shows live display name, handle, join date, trades count, bio, level, badges
- [ ] Grid lists active listings for that seller only
- [ ] Search / rarity / grade / price / sort refetch via RPC
- [ ] Reset clears filters and restores full seller price range
- [ ] Chat button uses seller UUID for room id
- [ ] Grid card → private detail page loads with buy CTA → opens global offer slide-over
- [ ] `ExecutionSlideOver` storefront link resolves (catalog id in URL)
- [ ] Invalid seller or missing listing → 404
- [ ] CI build passes without `.env`

## Future polish

- Grid pagination if sellers exceed page size
- Market price `delta` on cards
- Richer canonical spec rows when catalog fields expand
