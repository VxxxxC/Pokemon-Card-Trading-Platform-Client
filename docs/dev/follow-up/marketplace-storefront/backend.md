# Merchant Storefront (`/marketplace/[id]`) — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired — storefront grid + seller profile header + private listing detail
- **Partner report:** [PARTNER_REPORT.md](./PARTNER_REPORT.md)

## Migration

Apply **`supabase/migrations/20260707160000_marketplace_seller_storefront.sql`**:

| Object | Purpose |
|--------|---------|
| `idx_listings_active_seller_id` | Fast seller-scoped active listing scans |
| `search_marketplace_seller_listings` | Filtered/paginated listing rows for one seller |

## RPC: `search_marketplace_seller_listings`

**Args:**

| Param | Type | Notes |
|-------|------|-------|
| `p_seller_id` | `uuid` | Required — resolved profile id |
| `p_name_query` | `text` | Name / card number / display_id ILIKE |
| `p_rarities` | `text[]` | Catalog rarity filter |
| `p_grade_filters` | `jsonb` | Same shape as marketplace search |
| `p_price_min` / `p_price_max` | `numeric` | Listing price bounds |
| `p_sort` | `text` | `latest` \| `price_asc` \| `price_desc` |
| `p_page` / `p_page_size` | `int` | Pagination meta on each row |

**Returns (per listing row):** catalog fields + listing grade/price + `seller_min_price` / `seller_max_price` (unfiltered seller inventory bounds) + pagination meta.

**Security:** `SECURITY DEFINER`; `GRANT EXECUTE` to `anon`, `authenticated`.

## Server actions (`app/actions/marketplace.ts`)

| Action | Contract |
|--------|----------|
| `getMarketplaceSellerProfile(sellerKey)` | `{ success, data: MarketplaceSellerProfile }` \| `{ success: false, error }` |
| `searchMarketplaceSellerListings(input)` | `{ success, data: { listings, meta, priceBounds } }` \| `{ success: false, error }` |
| `getMarketplaceSellerListingDetail(sellerKey, listingKey)` | `{ success, data: MarketplaceSellerListingDetailView }` \| `{ success: false, error }` |

Both guard with `isSupabaseConfigured()` for CI / prerender.

## Lib helpers

| File | Purpose |
|------|---------|
| `lib/marketplace/load-seller-profile.ts` | Resolve UUID or `username` → `MarketplaceSellerProfile` |
| `lib/marketplace/load-seller-listing-detail.ts` | Seller listing lookup by UUID / `display_id` / `product_id` |
| `lib/marketplace/map-seller-listing.ts` | RPC row → `MarketplaceSellerListingRow` + `toMarketplaceCardListing()` |
| `lib/marketplace/seller-profile.ts` | Join date format, UUID check, badge emoji |
| `lib/marketplace/constants.ts` | `MARKETPLACE_STOREFRONT_PAGE_SIZE` (50) |

## Profile mapping

| UI field | DB source |
|----------|-----------|
| `username` | `profiles.display_name` |
| `handle` | `@profiles.username` |
| `joinDate` | `profiles.created_at` (formatted) |
| `bio` | `merchant_shops.shop_description` or `profiles.short_description` |
| `level` | `reputation_tag` via `resolveReputationTagDisplay` / `getMainTitle` |
| `badges` | `reputation_tag.activity_badges` → `ACTIVITY_BADGES` |
| `completedTrades` | `merchant_shops.completed_trades_count` or `profiles.completed_trades_count` |
| `verifiedBuyer` | `profiles.role === 'merchant'` |

## Verify (SQL)

```sql
SELECT *
FROM search_marketplace_seller_listings(
  p_seller_id := '<seller-uuid>'::uuid,
  p_page := 1,
  p_page_size := 12,
  p_sort := 'latest'
);
```

## Verify (app)

1. `bunx supabase db push` (or team migration workflow)
2. Guest: `/marketplace/<seller-uuid>` — profile header + listing grid
3. Filter by rarity / grade / price — RPC refetch
4. Unknown id → 404
5. `bun run build:ci` — no Supabase env throw
