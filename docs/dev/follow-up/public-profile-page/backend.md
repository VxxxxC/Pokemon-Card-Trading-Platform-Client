# Public Profile Page (`/profile/[id]`) — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired — SSR bootstrap + client shell

## Server action

`app/actions/profile.ts` → **`getPublicProfilePageBootstrap(profileKey)`**

| Field | Source |
|-------|--------|
| Profile header | `loadMarketplaceSellerProfile` (UUID or `profiles.username`) |
| `avatarUrl` | `resolveAvatarUrl(profiles.avatar_path)` |
| `rating` / `reviewCount` | `getPublicProfileReviews` → `aggregateRating` / `publicReviewCount` |
| `reviewPersona` | `merchant` if `profiles.role === 'merchant'`, else `member` |
| Listings preview (5) | `searchMarketplaceSellerListings` → `toMarketplaceCardListing` |
| `totalListingCount` | listings RPC pagination `meta.total` |
| Recent reviews (3) | `getPublicProfileReviews` (`date-desc`, `pageSize: 3`) |

## Contract

```ts
type PublicProfilePageBootstrapResult =
  | { success: true; data: PublicProfilePageBootstrap }
  | { success: false; error: string; notFound?: boolean };
```

## CI guard

`isSupabaseConfigured()` — returns `{ success: false, error }` without throwing.

## Dependencies (no new migration)

- `lib/marketplace/load-seller-profile.ts` (avatar + role)
- `app/actions/marketplace.ts` (`searchMarketplaceSellerListings`)
- `app/actions/reviews.ts` (`getPublicProfileReviews`)
- Migrations `20260706150000`, `20260707160000`

## Verify

1. `bun run build:ci`
2. Guest: `/profile/<uuid>` — profile + listings + reviews from DB
3. `/profile/<username>` — resolves via `profiles.username`
4. Unknown key → `notFound: true`
