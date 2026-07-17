# Public Profile Page (`/profile/[id]`) — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired

## UI touchpoints

| File | Role |
|------|------|
| `app/profile/[id]/page.tsx` | Thin server page + Suspense |
| `app/profile/[id]/PublicProfilePageData.tsx` | SSR bootstrap |
| `app/profile/[id]/PublicProfileClient.tsx` | Persona-aware header, listings strip, reviews preview |
| `app/profile/[id]/not-found.tsx` | 404 UI |
| `app/components/profile/PublicPersonaProfileHeader.tsx` | Shared member/merchant title + badge header |
| `app/components/profile/ProfileHeaderWithChat.tsx` | Legacy header (superseded on public profile) |

## Data flow

1. `PublicProfilePageData` calls `getPublicProfilePageBootstrap(id)`
2. `notFound()` when `notFound: true`
3. `PublicProfileClient` renders three sections from `initialData`

## Links

| CTA | Target |
|-----|--------|
| 查看全部 (listings) | `/marketplace/{profile.id}` |
| Listing card | `/marketplace/{profile.id}/product/{listingId}` |
| 查看更多評價 | `/profile/{profile.id}/rating?persona={reviewPersona}` |

## Acceptance checklist

- [x] No mock imports on `/profile/[id]`
- [x] SSR bootstrap with CI-safe guard
- [x] Real avatar via `avatarUrl` (picsum fallback retained)
- [x] Listings from seller storefront RPC
- [x] Reviews preview from `getPublicProfileReviews`
- [x] Persona-aware rating link (merchant vs member)
- [x] Empty states for listings and reviews

## Manual test

1. Open `/profile/{seller_uuid}` as guest — header, up to 5 listings, up to 3 reviews.
2. Click listing card — private storefront product detail loads.
3. Click 「查看更多評價」 — rating page scores match header.
4. Invalid id — not-found page.
