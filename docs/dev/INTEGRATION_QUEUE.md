# Integration Queue

> Single dashboard for backend ↔ frontend handoffs.  
> Update a row when backend is ready or frontend is wired.

| Flow | Backend | Frontend | Backend files | UI touchpoint | Follow-up |
|------|---------|----------|---------------|---------------|-----------|
| Product catalog search + create listing (single card) | ✅ Ready | ✅ Wired (baseline) | `app/actions/productCatalog.ts`, `app/actions/listings.ts`, `app/api/listings/upload-image/route.ts`, `app/lib/hooks/useProductCatalogSearch.ts`, `app/store/useListingSubmitStore.ts`, `components/listings/ListingSubmitOverlay.tsx`, `lib/listings/*`, `lib/grading/options.ts`, `lib/storage/bunny.ts`, `middleware.ts`, migrations `20260702100000`, `20260703130000`–`20260703160000` | `AddAssetModal.tsx`, `ListingSubmitOverlay` (root layout) | [backend](./follow-up/product-catalog-search/backend.md) · [frontend](./follow-up/product-catalog-search/frontend.md) |
| Marketplace product search | ✅ Ready (v2 RPC) | ✅ Wired (filters + card baseline) | `app/actions/marketplace.ts` (`searchMarketplaceProducts`, `getMarketplacePriceBounds`, **`getMarketplaceRarities`**), `app/lib/marketplace/types.ts`, `app/lib/marketplace/searchParsers.ts`, `lib/marketplace/filter-options.ts`, `lib/grading/options.ts` (`matchesGradeFilter`, `matchesAnyGradeFilter`), `app/lib/hooks/useMarketplaceSearch.ts`, migrations `20260702120000`, `20260702130000` | `app/marketplace/page.tsx`, `AccordionFilters.tsx`, `MarketplaceCard.tsx`, `RarityBadge.tsx`, `MarketplaceEmptyState.tsx`, `app/components/home/HeroSearch.tsx` | [backend](./follow-up/marketplace-search/backend.md) · [frontend](./follow-up/marketplace-search/frontend.md) |
| Auth login / register (member) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `lib/auth/validation.ts`, `lib/supabase/admin.ts` | `app/auth/AuthForm.tsx` | [backend](./follow-up/auth-login-register/backend.md) · [frontend](./follow-up/auth-login-register/frontend.md) |
| Auth password (forgot + reset) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `app/auth/callback/route.ts`, `lib/auth/password-errors.ts`, `lib/auth/site-url.ts` | `app/auth/forgot-password/`, `app/auth/reset-password/`, `AuthForm.tsx`, `PasswordUpdatedToast` | [backend](./follow-up/auth-password-recovery/backend.md) · [frontend](./follow-up/auth-password-recovery/frontend.md) |
| User profile settings (member) | ✅ Ready | ✅ Wired (baseline) | `app/actions/profile.ts`, `lib/profile/avatar.ts`, `lib/profile/validation.ts`, `lib/profile/errors.ts`, migrations `20260703100000`–`20260703120000` | `app/profile/user/settings/` | [backend](./follow-up/user-profile-settings/backend.md) · [frontend](./follow-up/user-profile-settings/frontend.md) |
| Role-based routing & session | ✅ Ready | ✅ Wired (baseline) | `lib/auth/roles.ts`, `lib/auth/session.ts`, `middleware.ts` (session refresh all routes; role guard `/profile` + `/admin`), `app/actions/profile.ts`, `app/actions/auth.ts` (`logout`) | `RoleProvider`, `LogoutModal`, `mockRole` consumers | [backend](./follow-up/role-based-routing/backend.md) · [frontend](./follow-up/role-based-routing/frontend.md) |
| Marketplace product detail (catalog) | ✅ Ready | ✅ Wired (baseline) | `app/actions/marketplace.ts` (`getMarketplaceProductDetail`), `app/lib/marketplace/types.ts` (`MarketplaceProductDetail`), `lib/catalog/element-types.ts`, `app/marketplace/product/[id]/page.tsx`, `ProductDetailClient.tsx`, `app/marketplace/MarketplaceChrome.tsx` | `app/marketplace/product/[id]/`, `MarketplaceCard.tsx` | [backend](./follow-up/marketplace-product-detail/backend.md) · [frontend](./follow-up/marketplace-product-detail/frontend.md) |
| Marketplace product detail (listings / chart / history) | ✅ Ready | ✅ Wired | `get_marketplace_product_listings` RPC, `getMarketplaceProductListings`, **`getMarketplaceListingDetail`**, `getMarketplaceProductTradeHistory`, **`getMarketplaceProductMarketPrices`**, **`getMarketplaceProductMarketPrice`**, `lib/marketplace/market-price.ts`, `lib/listings/images.ts`, `useMarketplaceProductMarketPrice`, `useMarketplaceListingDetail`, migrations `20260703170000`, `20260703180000`, `20260703210000`, `20260703220000` | `ProductDetailClient.tsx` (banner, chart, market grade chips, order book, trade history), `ExecutionSlideOver.tsx` (on-demand listing photo grid) | [marketplace-product-detail](./follow-up/marketplace-product-detail/backend.md) · [frontend](./follow-up/marketplace-product-detail/frontend.md) |
| Market pricing aggregation (Cron Job 2) | ✅ Ready | ✅ Wired | `app/api/cron/aggregate-prices/route.ts`, `lib/marketplace/market-price.ts`, `lib/supabase/admin.ts`, `product_price_snapshots`, `product_grading_market_prices`, migrations `20260703210000`, `20260703220000` | Product detail chart + market price banner (`ProductDetailClient.tsx`) | [backend](./follow-up/market-pricing-cron/backend.md) · [frontend](./follow-up/market-pricing-cron/frontend.md) |
| Wishlist toggle | ⏳ Planned | ✅ UI done | `app/actions/Wishlist.ts` (planned) | `WishlistButton.tsx`, `WishlistTable.tsx` | [wishlist](./follow-up/wishlist/) |
| Create listing submit (box/set + hobby) | ⏳ Planned | ⏳ Pending | — | `AddAssetModal.tsx` non-card paths | — |

## Prerequisites (shared)

- `lib/supabase/server.ts`
- `.env` / `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; URL must **not** include `/rest/v1/`)
- Bunny (create listing images): `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_CDN_HOSTNAME`, optional `BUNNY_STORAGE_REGION`
- `product_catalog` table populated + anon `SELECT` (see migration below)
- `listings` rows with `status = 'active'`, valid `product_id`, `grading_company`, `grading_score`, `seller_persona`
- `next.config.ts`: `www.pokemon-card.com` in `images.remotePatterns` (catalog thumbnails)
- **Package manager:** use **Bun** (`bun install`, `bun run dev`). Commit `bun.lock`.

### DB migrations required (one-time)

Run in Supabase SQL Editor or via `bunx supabase db push`:

- `supabase/migrations/20260702100000_product_catalog_public_read.sql`
- `supabase/migrations/20260702110000_auth_profiles_registration.sql`
- `supabase/migrations/20260702120000_marketplace_search_rpc.sql` — RLS on `listings` + `profiles`
- `supabase/migrations/20260702130000_marketplace_search_rpc_v2.sql` — **required** for current RPC signature
- `supabase/migrations/20260703100000_profiles_default_avatar.sql` — default `avatar_path`
- `supabase/migrations/20260703110000_profiles_owner_update.sql` — profiles owner `UPDATE` RLS
- `supabase/migrations/20260703120000_profiles_settings_columns.sql` — `username`, `short_description`
- `supabase/migrations/20260703130000_listings_owner_insert.sql` — listings seller `INSERT`/`UPDATE` RLS
- `supabase/migrations/20260703140000_listings_owner_insert_simplify.sql` — simplified insert policy (`seller_id = auth.uid()`)
- `supabase/migrations/20260703150000_listings_service_role_grants.sql` — `service_role` grants on `listings` (trusted server insert)
- `supabase/migrations/20260703170000_get_marketplace_product_listings.sql` — product detail order book RPC
- `supabase/migrations/20260703180000_member_orders_trade_history_read.sql` — completed `member_orders` read for authenticated users
- `supabase/migrations/20260703210000_market_prices_service_role_grants.sql` — `service_role` grants on `product_grading_market_prices`
- `supabase/migrations/20260703220000_product_grading_market_prices_public_read.sql` — anon/authenticated `SELECT` on market price cache (product detail chart/banner)

### Quick verify

```bash
bun run test:catalog-search   # DB connectivity + sample catalog search
bun run dev                   # UI: /, /marketplace, Add Asset modal, /auth, role routing
```

**Add Asset — create listing (manual, single card):**

1. Log in → open **新增商品** (merch mode).
2. Search + pick catalog card → selected card panel shows name / number / rarity.
3. Choose grading, add 4–6 photos, set price → submit.
4. **Global progress overlay** shows per-photo upload % then「寫入商品資料…」; success toast; modal closes.
5. Verify `listings` row + Bunny CDN URLs; `listing_stats` row created by DB trigger.

**Homepage hero search (manual):**

1. `/` — type `sv2a` or a card name (≥ 2 chars) → dropdown shows in-stock hits with `lowestPrice`.
2. Click a suggestion or press **搜尋** / Enter → navigates to `/marketplace?q=…` with live results.
3. No active listings for query → dropdown shows 「暫無符合的現貨標的」.
4. Quick-filter chips (`rarity=SAR`, `q=charizard`) still deep-link to `/marketplace`.

**Marketplace (manual):**

1. With **zero** active `listings` — `/marketplace` shows `MarketplaceEmptyState` (not an infinite spinner).
2. With active listings — grid shows only products with ≥ 1 active listing.
3. Search `sv2a`, `sv2a-062`, or a card name; toggle grade / seller-source filters.
4. Header should show `顯示第 X–Y 件，共 Z 件現貨` when results exist.
5. Apply a filter with no matches — `MarketplaceEmptyState` shows with 「清除所有篩選」.
6. **Rarity facet** — sidebar loads all distinct `product_catalog.rarity` values (not hardcoded SAR/UR/SR/AR).
7. **Seller source** — only **會員** (`MEMBER`) and **認證商戶** (`MERCHANT`); no C2C/P2P chips.
8. **Grade facet** — options match create-listing dropdown (`lib/grading/options.ts`); filter state uses grading option ids (e.g. `psa:10`, `raw:A`).
9. **Grid card** — rarity badge on image (top-left) from `product_catalog.rarity`; grading badge **not** shown on card.
10. **Grid → detail** — card click opens `/marketplace/product/<productId>` with live catalog data.

**Product detail — catalog (manual):**

1. From grid, open a product → title is `name_ja`; `name_zh` + rarity badge when present.
2. Nav bars hidden on detail; back chevron returns to previous page.
3. Spec matrix: set, 日版原名, 卡牌屬性 (繁中), 進化階段.
4. Invalid product id → 404.

**Product detail — listings (manual):**

1. Apply migration `20260703170000_get_marketplace_product_listings.sql`.
2. Open product with active listings → order book shows seller rows from DB.
3. Toggle **只顯示已鑑定** — RAW listings hidden.
4. Select a grading chip (e.g. **PSA 10**, **裸卡 A**) — only matching listings shown.
5. Change sort (價格 / 鑑定等級 / 賣家評級) — order updates server-side.
6. Pagination works when > 5 listings match filters.

**Product detail — execution slide-over (manual):**

1. Open product with a listing that has 4–6 uploaded images.
2. Click an order book row → `ExecutionSlideOver` opens immediately (seller, price from row).
3. Photo area shows skeleton grid, then **3-column 3:4 thumbnails** from `getMarketplaceListingDetail`.
4. Click a different row → new fetch by `listingId`; grid updates.
5. Listing with empty `images` → catalog fallback thumbnail(s).

**Product detail — trade history (manual):**

1. Apply migration `20260703180000_member_orders_trade_history_read.sql`.
2. As **guest** — sold history section blurred; no fetch.
3. Log in → completed orders for product show with date, grade, price.
4. Pagination when > 5 completed orders.

**Product detail — market price + chart (manual):**

1. Apply migrations `20260703210000`, `20260703220000`.
2. Seed `product_price_snapshots` with `price_hkd`, `grading_company`, `grading_score`, and for **裸卡** rows set `condition_type` to `A` / `B` / `C` / `D`.
3. Trigger cron: `curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/aggregate-prices`
4. Open product detail → banner shows `market_avg_price` + green/red `market_trend_30d` badge.
5. When multiple grades exist in cache, market grade chips appear in banner (PSA 10, 裸卡 A, …) — **independent** of order-book filter chips.
6. Switching a market grade chip updates avg + chart instantly (client-side; one bulk fetch on mount).
7. Chart shows 30-day Recharts series from `market_chart_data`; guest blur overlay on chart.
8. Grade with avg but no chart points → 「此規格暫無走勢圖資料」.
9. No cache rows → skeleton / `—` in banner.

**Product detail — known limitation (order book vs market price):**

- **Market price** distinguishes 裸卡 A/B/C/D via `product_grading_market_prices.grading_score` (`A`–`D`) after cron groups snapshots by `condition_type`.
- **Order book** still matches all RAW listings when any `raw:*` chip is selected (`listings.grading_score` is `null` for all raw conditions). Separate listings schema/RPC work if per-condition order-book filter is required.

**Product detail — SQL smoke test:**

```sql
SELECT product_id, listing_count, lowest_price, total_count, range_start, range_end
FROM search_marketplace_products(p_page := 1, p_page_size := 10);
```
