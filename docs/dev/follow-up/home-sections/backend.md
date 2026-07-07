# Home Page Sections — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired

## Actions

| Function | File | Notes |
|----------|------|-------|
| `getHomeMerchantListings()` | `app/actions/home.ts` | `seller_persona=merchant`, `status=active`, `created_at DESC`, limit 9 |
| `getHomeMemberListings()` | `app/actions/home.ts` | `seller_persona=member`, same filters |
| `getHomeWishlistPreview(9)` | `app/actions/wishlist.ts` | Auth-only; early `.limit(9)` on watchlist |
| `getWishlistFavoredKeysForUser(userId)` | `app/actions/wishlist.ts` | Called from `app/page.tsx` when logged in (star SSR) |

## Loaders

- `lib/home/load-home-listings.ts` — `fetchHomeListingsByPersona` via `createPublicClient()`
- `lib/home/constants.ts` — `HOME_LISTING_LIMIT`, `HOME_WISHLIST_LIMIT`, cache TTL
- `lib/wishlist/pricing.ts` — `resolveWishlistDisplayValue` (SNKRDUNK → platform → tracked)
- `lib/wishlist/sparkline.ts` — `getSparklinePoints`, `hasWishlistTrendData`
- `lib/home/perf-log.ts` — `[home:perf]` server diagnostics

## Cache

Public listing strips use `unstable_cache` (60s), keys `["home-listings", persona, "9"]`.

Wishlist preview and favored keys are **not** cached (user-specific).

## Verify

```bash
bunx tsc --noEmit
bun run build:ci
```

Logged-in: `getHomeWishlistPreview` returns ≤9 `WishlistEntry` rows; `getWishlistFavoredKeysForUser` returns favored key strings.  
Guest: wishlist action returns `{ success: true, data: [] }` without throwing when env unset; no favored-keys fetch on page.
