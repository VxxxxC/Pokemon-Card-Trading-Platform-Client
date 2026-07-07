# Home Page — Performance Notes

**Last updated:** 2026-07-07 (follow-up: favoredKeys + client perf)

## Design

- Shell renders immediately (`HomePageShell` + `getOptionalAuthUser` only)
- Logged-in: one extra sync fetch `getWishlistFavoredKeysForUser` on page (does not block Suspense sections)
- Three independent `Suspense` boundaries (wishlist / merchant / C2C)
- Public listings: `unstable_cache` 60s + `createPublicClient()`
- Wishlist: auth-only, no cache, `.limit(9)` before joins

## Instrumentation

### Server — `lib/home/perf-log.ts`

Enable: `HOME_PERF_LOG=1` or `NODE_ENV=development`

| Log | Meaning |
|-----|---------|
| `listings.merchant=…ms count=N` | Merchant strip query |
| `listings.member=…ms count=N` | C2C strip query |
| `wishlist=…ms count=N` | Wishlist preview query |

### Client — `app/lib/home/perf-log-client.ts`

Enable: `NEXT_PUBLIC_HOME_PERF_LOG=1` or `NODE_ENV=development`

| Log | Meaning |
|-----|---------|
| `clientMount` | `HomePageShell` mounted |
| `sectionHydrated … within=…ms` | Reserved for optional section hydrate timing |

## CI

`bun run build:ci` — home route prerenders with empty Supabase env (guards in actions).

## Targets (local dev)

| Path | Target |
|------|--------|
| Merchant + member parallel (cache hit) | < 30ms |
| Merchant + member (cache miss) | < 150ms |
| Wishlist preview (≤9 rows) | < 300ms |
