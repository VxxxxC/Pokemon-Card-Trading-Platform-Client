# Integration Queue

> Single dashboard for backend ↔ frontend handoffs.  
> Update a row when backend is ready or frontend is wired.

| Flow | Backend | Frontend | Backend files | UI touchpoint | Follow-up |
|------|---------|----------|---------------|---------------|-----------|
| Product catalog search | ✅ Ready | ✅ Wired (baseline) | `app/actions/productCatalog.ts`, `app/lib/hooks/useProductCatalogSearch.ts`, `lib/supabase/server.ts` | `app/components/shared/AddAssetModal.tsx` (~L375–450) | [backend](./follow-up/product-catalog-search/backend.md) · [frontend](./follow-up/product-catalog-search/frontend.md) |
| Marketplace product search | ✅ Ready (v2 RPC) | ✅ Wired (baseline) | `app/actions/marketplace.ts`, `app/lib/marketplace/types.ts`, `app/lib/marketplace/searchParsers.ts`, `app/lib/hooks/useMarketplaceSearch.ts`, `app/lib/hooks/useHeroMarketplaceSearch.ts`, `supabase/migrations/20260702120000_marketplace_search_rpc.sql`, `supabase/migrations/20260702130000_marketplace_search_rpc_v2.sql` | `app/marketplace/page.tsx`, `MarketplaceEmptyState.tsx`, `app/components/home/HeroSearch.tsx` | [backend](./follow-up/marketplace-search/backend.md) · [frontend](./follow-up/marketplace-search/frontend.md) |
| Auth login / register (member) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `lib/auth/validation.ts`, `lib/supabase/admin.ts` | `app/auth/AuthForm.tsx` | [backend](./follow-up/auth-login-register/backend.md) · [frontend](./follow-up/auth-login-register/frontend.md) |
| Role-based routing & session | ✅ Ready | ✅ Wired (baseline) | `lib/auth/roles.ts`, `lib/auth/session.ts`, `middleware.ts`, `app/actions/profile.ts`, `app/actions/auth.ts` (`logout`) | `RoleProvider`, `LogoutModal`, `mockRole` consumers | [backend](./follow-up/role-based-routing/backend.md) · [frontend](./follow-up/role-based-routing/frontend.md) |
| Marketplace product detail (nested listings) | ⏳ Planned | ⏳ Pending | `get_marketplace_product_listings` RPC (planned) | `app/marketplace/product/[id]/page.tsx` | [frontend](./follow-up/marketplace-search/frontend.md) |
| Wishlist toggle | ⏳ Planned | ✅ UI done | `app/actions/Wishlist.ts` (planned) | `WishlistButton.tsx`, `WishlistTable.tsx` | [wishlist](./follow-up/wishlist/) |
| Create listing submit | ⏳ Planned | ⏳ Pending | `app/actions/listings.ts` (planned) | `AddAssetModal.tsx` submit handler | — |

## Prerequisites (shared)

- `lib/supabase/server.ts`
- `.env` / `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; URL must **not** include `/rest/v1/`)
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

### Quick verify

```bash
bun run test:catalog-search   # DB connectivity + sample catalog search
bun run dev                   # UI: /, /marketplace, Add Asset modal, /auth, role routing
```

**Homepage hero search (manual):**

1. `/` — type `sv2a` or a card name (≥ 2 chars) → dropdown shows in-stock hits with `lowestPrice`.
2. Click a suggestion or press **搜尋** / Enter → navigates to `/marketplace?q=…` with live results.
3. No active listings for query → dropdown shows 「暫無符合的現貨標的」.
4. Quick-filter chips (`rarity=SAR`, `q=charizard`) still deep-link to `/marketplace`.

**Marketplace (manual):**

1. With **zero** active `listings` — `/marketplace` shows `MarketplaceEmptyState` (not an infinite spinner).
2. With active listings — grid shows only products with ≥ 1 active listing.
3. Search `sv2a`, `sv2a-062`, or a card name; toggle grade / seller-type filters.
4. Header should show `顯示第 X–Y 件，共 Z 件現貨` when results exist.
5. Apply a filter with no matches — `MarketplaceEmptyState` shows with 「清除所有篩選」.

**SQL smoke test:**

```sql
SELECT product_id, listing_count, lowest_price, total_count, range_start, range_end
FROM search_marketplace_products(p_page := 1, p_page_size := 10);
```
