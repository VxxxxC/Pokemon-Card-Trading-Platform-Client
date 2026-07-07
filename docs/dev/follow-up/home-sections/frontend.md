# Home Page Sections — Frontend Handoff

## Status

- **Backend:** ✅ Ready (see [backend.md](./backend.md))
- **Frontend:** ✅ Wired

## Architecture

- `app/page.tsx` — server; auth + `favoredKeys` + Suspense per section
- `app/HomePageShell.tsx` — static chrome (nav, hero, trust, footer); client perf mount
- `app/home/HomeWishlistSectionData.tsx` — auth-only stream
- `app/home/HomeMerchantSectionData.tsx` — cached merchant listings + `favoredKeys`
- `app/home/HomeC2cSectionData.tsx` — cached member listings + `favoredKeys`
- `app/home/HomeSectionSkeletons.tsx` — section-level fallbacks

## UI touchpoints

| Component | Data |
|-----------|------|
| `HeroSearch` | `showCheckIn={!!currentUserId}`; `CheckInCard deferStatsLoad` |
| `WishlistTicker` | `entries` from `getHomeWishlistPreview`; 3-step price; SNKRDUNK trend; ± 自追蹤 when platform source |
| `PremiumMarket` | `listings` merchant; `favoredKeys` + `initialIsFavored`; links `/marketplace/product/[id]` |
| `NewArrivals` | `listings` member C2C; `favoredKeys` + `initialIsFavored`; links `/marketplace/product/[id]` |

## Guest vs logged-in

- Guest: no wishlist section, no check-in card, no `favoredKeys` fetch
- Logged-in: wishlist strip (if entries exist) + check-in + pre-hydrated stars on listing cards

## Acceptance

- [x] Section skeletons (not full-page spinner)
- [x] Merchant / C2C empty states
- [x] Wishlist price fallback SNKRDUNK → platform → tracked
- [x] Wishlist ± 自追蹤 subtitle (platform source)
- [x] `favoredKeys` SSR on merchant / C2C `WishlistButton`
- [x] Client perf mount hook (`perf-log-client.ts`)
- [x] `bun run build:ci`

See [PARTNER_REPORT.md](./PARTNER_REPORT.md) for full smoke-test checklist and partner backlog.
