# Wishlist — Frontend Handoff

## Status

- **Backend:** ✅ Ready (see [backend.md](./backend.md))
- **Frontend:** ✅ Marketplace star · ✅ Collection wishlist table · ✅ Home `WishlistTicker` + merchant/C2C strips
- **Your focus:** Polish `WishlistTable` styling, home surfaces, optional target-gap indicator

## Changelog (2026-07-06)

| Area | Shipped |
|------|---------|
| **Star toggle** | `WishlistButton` → `toggleWishlist`; optimistic UI + rollback |
| **Auth toasts** | Guest → error toast with **登入 / 註冊** action → `/auth` |
| **Success toast** | Add → success + **查看清單** → `/profile/user/collection` |
| **Marketplace hydration** | `getUserWishlistFavoredKeys` on `MarketplacePageClient` |
| **Collection table** | Live data via `useWishlist()` |
| **Thumbnails** | `product_catalog.image_url` via `WishlistEntry.imageUrl` |
| **Platform price only** | Single **平台現價** column (`lowestListingPrice`); no SNKRDUNK buy price |
| **30D trend** | SNKRDUNK sparkline; header labeled **SNKRDUNK 參考** |
| **Grade edit** | Click grade badge → dropdown (`GRADING_OPTIONS`) → `updateWishlistGrade` + silent refresh |
| **Target price edit** | Pencil icon → inline input → `updateWishlistTarget` |
| **Actions menu** | `⋯` → 查看商品頁 / 從願望清單移除 |
| **Empty listing** | **暫無放售** when no active listing for grade |

---

## File map

| File | Role |
|------|------|
| `app/components/market/WishlistButton.tsx` | Star; `currentUserId` short-circuit for guests |
| `app/components/marketplace/MarketplaceCard.tsx` | Passes `productId`, grade, `favoredKeys`, `currentUserId` |
| `app/marketplace/MarketplacePageClient.tsx` | Loads favored keys when logged in |
| `app/components/market/WishlistTable.tsx` | Collection table UI |
| `app/lib/hooks/useWishlist.ts` | Fetch, remove, update grade/target, `refreshEntries` |
| `app/profile/user/(dashboard)/collection/page.tsx` | Wires `WishlistTable` props |

---

## Data wiring

### Marketplace star

```tsx
<WishlistButton
  productId={listing.productId ?? listing.id}
  gradingCompany={listing.grade.authority}
  gradingScore={listing.grade.score}
  trackedPrice={listing.price > 0 ? listing.price : null}
  initialIsFavored={isWishlistFavored(favoredKeys, productId, ...)}
  currentUserId={currentUserId}
/>
```

- Default grade from card context (not a modal picker).
- `tracked_price` stored server-side from `listing.price` at add time.

### Collection page

```tsx
const {
  entries,
  isLoading,
  removeEntry,
  updateTargetPrice,
  updateGrade,
} = useWishlist();

<WishlistTable
  entries={entries}
  isLoading={isLoading}
  onRemove={(e) => removeWishlistEntry(e)}
  onUpdateTarget={updateTargetPrice}
  onUpdateGrade={updateGrade}
/>
```

After grade change, `refreshEntries()` reloads **平台現價** + **30D 走勢** for the new grade without full-page loading flash.

### Table columns (current)

| Column | Source |
|--------|--------|
| 卡牧資料 | `name`, `cardCode`, `imageUrl`, link → `/marketplace/product/{productId}` |
| 規格 | Editable grade badge → dropdown |
| 稀有度 | `rarity` |
| 平台現價 | `lowestListingPrice` or **暫無放售**; optional ± vs `trackedPrice` |
| 目標價 | Inline edit → `targetPrice` |
| 30D 走勢 | `chartPoints` / `trend30d` (SNKRDUNK reference) |
| 操作 | `⋯` menu |

---

## UX decisions (product)

1. **Only platform listing price** for purchase decisions — SNKRDUNK not shown as buy price.
2. **30D trend** kept as external market reference (labeled).
3. **Inline edit** for high-frequency fields (grade, target); **⋯ menu** for navigation + destructive remove.
4. **No grade picker on star click** — uses listing context; change later in table.

---

## Not wired (partner backlog)

| Surface | Status |
|---------|--------|
| `WishlistTicker.tsx` (home) | ✅ Live — `getHomeWishlistPreview(9)`, 3-step price (`lib/wishlist/pricing.ts`), SNKRDUNK trend |
| `NewArrivals.tsx`, `PremiumMarket.tsx` | ✅ Live listings from `getHomeMemberListings` / `getHomeMerchantListings` |
| Target vs platform gap label | e.g. 「距離目標 HK$xxx」— not built |
| OneSignal alert UI | Phase 3 |

---

## Acceptance checklist

- [x] Logged-in: marketplace star adds/removes `product_watchlists` row
- [x] Guest: toast with login/register button; no DB write (when `currentUserId={null}`)
- [x] Success toast on add with link to collection
- [x] Collection table loads from `getWishlistEntries`
- [x] Card thumbnail from `image_url`
- [x] Grade dropdown updates row + platform price + trend
- [x] Target price inline save
- [x] No platform listing → **暫無放售**
- [x] SNKRDUNK trend only in 30D column (top ~100 cards)
- [x] `⋯` remove works
- [x] Home wishlist ticker live
- [ ] OneSignal push (Phase 3)

---

## Verify (frontend)

1. Log in → `/marketplace` → star a card → toast → collection table shows row
2. Change grade to one with no listings → **暫無放售**; trend updates if SNKRDUNK has grade
3. Set target price → persists after refresh
4. Log out → star → login toast with button
5. `bun run build:ci`
