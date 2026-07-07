# Partner Report — Merchant Storefront (`/marketplace/[id]`)

**Date:** 2026-07-07  
**Flow:** Seller private storefront grid + private listing detail  
**Backend owner:** Backend track  
**Frontend owner:** Partner (polish + smoke-test)  
**Remote DB:** Migration **`20260707160000_marketplace_seller_storefront.sql`** — pushed (`bunx supabase db push` ✅)

---

## Executive summary

| Area | Status |
|------|--------|
| Storefront grid `/marketplace/[id]` | ✅ Shipped (SSR + DB) |
| Seller profile header (display name, badges, trades) | ✅ Shipped |
| Seller-scoped listing search RPC | ✅ Shipped |
| Filter / sort client refetch (`useMarketplaceSellerSearch`) | ✅ Shipped |
| Private listing detail `/marketplace/[id]/product/[productId]` | ✅ Shipped (follow-up) |
| Listing key resolution (UUID · `display_id` · `product_id`) | ✅ Shipped |
| `ExecutionSlideOver` deep link (`productId` in URL) | ✅ Compatible |
| Grid `detailHref` (listing UUID in URL) | ✅ Compatible |
| Card `delta` / 24h reference line | ⏳ Fixed at `0` (same as home `NewArrivals`) |
| Storefront grid pagination UI | ⏳ Page size 50; no pager component |
| `/profile/[id]` public profile page | ⏳ Still mock — links to storefront OK |
| `conditionLabel` on cards | ⏳ Not in DB — omitted |

**Partner action:** Smoke-test both routes as guest and logged-in buyer; verify filters, buy CTA, chat button, and deep links from order slide-over.

---

## Routes

| Route | Pattern | Data source |
|-------|---------|-------------|
| Storefront grid | `/marketplace/[id]` | `getMarketplaceSellerProfile` + `searchMarketplaceSellerListings` |
| Private listing detail | `/marketplace/[id]/product/[productId]` | `getMarketplaceSellerListingDetail` |

`[id]` resolves as **profile UUID** first; falls back to **`profiles.username`** (case-insensitive).

---

## Architecture

```
GET /marketplace/[id]
  └─ Suspense → MerchantStorefrontPageSkeleton
       └─ MerchantStorefrontPageData
            ├─ getMarketplaceSellerProfile(id)
            ├─ searchMarketplaceSellerListings({ sellerId, page: 1, pageSize: 50 })
            ├─ getOptionalAuthUser()
            └─ MerchantStorefrontPageClient
                 └─ useMarketplaceSellerSearch (skip first fetch when initialData)

GET /marketplace/[id]/product/[productId]
  └─ Suspense → MerchantProductDetailPageSkeleton
       └─ MerchantProductDetailPageData
            ├─ getMarketplaceSellerListingDetail(id, productId)
            └─ MerchantProductDetailPageClient
```

**Design intent:** Mirror main marketplace SSR pattern — thin `page.tsx`, streaming skeleton, parallel server fetch, client hook only for filter changes on the grid.

---

## Database

| Object | Migration | Purpose |
|--------|-----------|---------|
| `idx_listings_active_seller_id` | `20260707160000` | `(seller_id, created_at DESC)` partial index on `status = 'active'` |
| `search_marketplace_seller_listings` | `20260707160000` | Seller-scoped filtered listing search; `SECURITY DEFINER` |

### RPC quick reference

```sql
SELECT listing_id, product_id, product_name, price, seller_min_price, seller_max_price, total_count
FROM search_marketplace_seller_listings(
  p_seller_id := '<seller-uuid>'::uuid,
  p_page := 1,
  p_page_size := 50,
  p_sort := 'latest'
);
```

---

## Server actions

| Action | File | Contract |
|--------|------|----------|
| `getMarketplaceSellerProfile(sellerKey)` | `app/actions/marketplace.ts` | `{ success, data: MarketplaceSellerProfile }` |
| `searchMarketplaceSellerListings(input)` | `app/actions/marketplace.ts` | `{ success, data: { listings, meta, priceBounds } }` |
| `getMarketplaceSellerListingDetail(sellerKey, listingKey)` | `app/actions/marketplace.ts` | `{ success, data: MarketplaceSellerListingDetailView }` |

All guard with `isSupabaseConfigured()` for CI / `build:ci`.

---

## Private listing detail — URL key resolution

`[productId]` in the URL is a **flexible key**, not always a catalog id:

| Key type | Example | Resolution |
|----------|---------|------------|
| Listing UUID | `a1b2c3d4-…` | Active listing for seller with matching `listings.id` |
| Catalog `display_id` | `OFFICIAL-48516` | Resolve product → seller's **lowest-price** active listing |
| Catalog `product_id` | internal id | Same as above |

**Inbound links today:**

| Source | URL shape |
|--------|-----------|
| Storefront `MarketplaceCard` | `/marketplace/{sellerId}/product/{listingId}` |
| `ExecutionSlideOver` | `/marketplace/{sellerId}/product/{productId}` (catalog id) |

Both resolve correctly after the detail-page wiring.

---

## Lib helpers

| File | Purpose |
|------|---------|
| `lib/marketplace/load-seller-profile.ts` | Profile + optional `merchant_shops` join |
| `lib/marketplace/load-seller-listing-detail.ts` | Seller listing lookup + photo gallery |
| `lib/marketplace/map-seller-listing.ts` | RPC row → `MarketplaceListing` card shape |
| `lib/marketplace/seller-profile.ts` | UUID check, join date, badge emoji |
| `lib/marketplace/constants.ts` | `MARKETPLACE_STOREFRONT_PAGE_SIZE = 50` |

---

## Profile UI mapping

| UI field | DB source |
|----------|-----------|
| `username` | `profiles.display_name` |
| `handle` | `@profiles.username` |
| `joinDate` | `profiles.created_at` |
| `bio` | `merchant_shops.shop_description` or `profiles.short_description` |
| `level` | `reputation_tag` → `resolveReputationTagDisplay` / `getMainTitle` |
| `badges` | `reputation_tag.activity_badges` → `ACTIVITY_BADGES` |
| `completedTrades` | `merchant_shops.completed_trades_count` or `profiles.completed_trades_count` |
| `verifiedBuyer` | `profiles.role === 'merchant'` |

---

## Files touched

### Backend / lib

- `supabase/migrations/20260707160000_marketplace_seller_storefront.sql`
- `app/actions/marketplace.ts`
- `app/lib/marketplace/types.ts`
- `lib/marketplace/load-seller-profile.ts`
- `lib/marketplace/load-seller-listing-detail.ts`
- `lib/marketplace/map-seller-listing.ts`
- `lib/marketplace/seller-profile.ts`
- `lib/marketplace/constants.ts`

### Frontend — storefront grid

- `app/marketplace/[id]/page.tsx`
- `app/marketplace/[id]/MerchantStorefrontPageData.tsx`
- `app/marketplace/[id]/MerchantStorefrontPageClient.tsx`
- `app/marketplace/[id]/MerchantStorefrontPageSkeleton.tsx`
- `app/lib/hooks/useMarketplaceSellerSearch.ts`

### Frontend — private listing detail

- `app/marketplace/[id]/product/[productId]/page.tsx`
- `app/marketplace/[id]/product/[productId]/MerchantProductDetailPageData.tsx`
- `app/marketplace/[id]/product/[productId]/MerchantProductDetailPageClient.tsx`
- `app/marketplace/[id]/product/[productId]/MerchantProductDetailPageSkeleton.tsx`

### Docs

- `docs/dev/INTEGRATION_QUEUE.md`
- `docs/dev/follow-up/marketplace-storefront/backend.md`
- `docs/dev/follow-up/marketplace-storefront/frontend.md`

---

## Partner acceptance checklist

### Storefront grid `/marketplace/[id]`

- [ ] Guest can open a valid seller UUID — profile header + listing grid render
- [ ] Search, rarity, grade, price slider, and sort trigger refetch (watch network / “更新中…” on desktop sort row)
- [ ] Reset restores full seller price range and clears filters
- [ ] Unknown seller → 404
- [ ] `MarketplaceCard` buy / own-listing guard works when logged in (`currentUserId` from SSR)
- [ ] Chat button opens overlay with seller UUID as room id

### Private detail `/marketplace/[id]/product/[productId]`

- [ ] Open from grid card (listing UUID in URL) — photos, price, buy CTA
- [ ] Open from `ExecutionSlideOver` link (catalog `productId` / `display_id`) — same seller's listing resolves
- [ ] “進入公開大盤商品市場” → `/marketplace/product/{displayId|productId}`
- [ ] Seller with **no** active listing for that product → 404
- [ ] Listing photos from `listings.images`; fallback to catalog `image_url`

### CI / build

- [ ] `bunx tsc --noEmit`
- [ ] `bun run build:ci` (no `.env`)

---

## Known gaps (future)

| Item | Notes |
|------|-------|
| Grid pagination | Sellers with >50 active listings need pager or infinite scroll |
| Card `delta` | Join `product_grading_market_prices` for 24h reference |
| Canonical spec table | Only catalog fields available (`element_type`, `pokemon_stage`, `hp`); no weakness / artist in DB |
| `/profile/[id]` | Still mock; “查看全部” from profile should eventually use live seller UUID |

---

## Related docs

- [backend.md](./backend.md) — RPC + action contracts
- [frontend.md](./frontend.md) — component map + hook API
- [marketplace-search/frontend.md](../marketplace-search/frontend.md) — shared filter components (`AccordionFilters`, `SmartSearch`, `MarketplaceCard`)
