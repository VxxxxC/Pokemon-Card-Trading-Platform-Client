# User Collection — Backend Handoff

## Status

- **Backend:** ✅ Ready · migration **pushed to remote** (2026-07-06)
- **Frontend:** ✅ Wired (see [frontend.md](./frontend.md))
- **Migration:** ✅ `20260706110000_user_collections_portfolio_extend.sql`

## Changelog (2026-07-09) — Collection × listing × sale sync

| Change | Detail |
|--------|--------|
| **`user_collections.sold_*`** | `sold_at`, `sold_listing_id`, `sold_price` — archive on trade complete; excluded from `computePortfolioTotals` |
| **`listings.source_collection_id`** | Optional FK when selling from collection (`sellPrefill`) |
| **`fn_archive_seller_collection_for_listing`** | Called from `rpc_complete_member_order` + `rpc_confirm_buyer_received` (escrow) |
| **FIFO fallback** | When no `source_collection_id`, archive oldest active row matching `product_id + grade` |
| **Merch post-listing prompt** | `CollectionAddAfterListingDialog` — optional `addToCollection` after merch-only listing |
| **Sold history filter** | `filter: 'sold'` on collection page |

## Changelog (2026-07-06)

| Change | Detail |
|--------|--------|
| **`user_collections` extended** | `id` (UUID PK), `grading_company`, `grading_score`, `purchase_price` |
| **`quantity` dropped** | One row per physical card; reputation badge uses `COUNT(*)` |
| **No `photos`** | Thumbnails from `product_catalog.image_url` at read time |
| **`app/actions/collection.ts`** | `getCollectionPortfolioSummary`, paginated `getCollectionEntries`, mutations |
| **`lib/collection/build-entries.ts`** | Pricing context, filter/search, `computePortfolioTotals` |
| **`resolveCollectionMarketValue`** | Exact-grade SNKRDUNK → platform same-grade MIN → `purchase_price`; **no cross-grade** |
| **`valuationSource`** | `snkrdunk` \| `platform` \| `purchase_price` on `CollectionEntry` |
| **`listedCount`** | Summary header stat (active listing + grade match) |
| **Sell flow** | `openAddAssetModal({ mode: "merch", sellPrefill })` → `submitCardListingWithProgress` |
| **Reputation** | `fn_recalculate_reputation_tags` collection count: `SUM(quantity)` → `COUNT(*)` |

---

## Architecture

```
GET /profile/user/collection
  → page.tsx (Suspense + UserCollectionSkeleton)
  → UserCollectionPageData (Server Component)
      getCollectionPageBootstrap({ page: 1, filter: 'all' })
        loadUserCollectionView — single fetchAllCollectionRows + single loadCollectionPricingContext
        → summary + page 1 entries
  → UserCollectionClient — initialData; skip mount bootstrap when SSR succeeded

Client interactions:
  → filter / search / pagination → getCollectionEntries (reuses loadUserCollectionView internally)
  → collection-should-refresh / mutations → getCollectionPageBootstrap (summary + current page)
  → wishlist section → getWishlistEntries (deferred via requestIdleCallback)

AddAssetModal (hobby submit)
  → addToCollection({ productId, gradingOptionId, purchasePrice })
  → INSERT user_collections
```

### Price domains (collection vs wishlist)

| Purpose | Source | Field |
|---------|--------|-------|
| **Portfolio / 現市價格** | SNKRDUNK exact grade | `product_grading_market_prices`（同 `product_id + grading_company + grading_score`） |
| **Fallback 1** | Platform same-grade MIN | `MIN(listings.price)` grade match |
| **Fallback 2** | Cost basis proxy | `user_collections.purchase_price`（UI：`入手價估計`） |
| **Cost basis** | User input on add | `user_collections.purchase_price` |
| **30D trend** | SNKRDUNK exact grade only | `market_trend_30d` |
| **Listed status** | Derived (not stored) | User `listings.status = 'active'` + grade match |

> Wishlist uses **platform price only** for buy decisions; collection uses **SNKRDUNK-first valuation** for net-worth display. Do not swap semantics between the two tables.

---

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260709130000_user_collections_sold_archive.sql` | Sold archive columns, `source_collection_id`, `fn_archive_seller_collection_for_listing`, RPC updates |
| `app/actions/collection.ts` | `getCollectionPageBootstrap`, summary, paginated list, mutations |
| `lib/collection/load-user-collection.ts` | Shared single-pass view loader |
| `lib/collection/perf-log.ts` | `[collection:perf]` server diagnostics |
| `app/profile/user/(dashboard)/collection/UserCollectionPageData.tsx` | SSR bootstrap |
| `app/lib/collection/types.ts` | `CollectionEntry`, `CollectionPortfolioSummary`, `CollectionPageBootstrap` |
| `lib/collection/build-entries.ts` | Shared pricing context, filter/search, portfolio totals |
| `lib/collection/constants.ts` | `COLLECTION_DEFAULT_PAGE_SIZE` (20), `COLLECTION_MAX_PAGE_SIZE` (50) |
| `lib/marketplace/portfolio-pricing.ts` | `resolveCollectionMarketValue`, `findExactMarketPriceRow`, grade listing match |
| `lib/wishlist/grading.ts` | Reused: `listingMatchesWishlistGrade`, `gradingOptionIdFromWishlistRow` |
| `types/supabase.ts` | Generated (`bun run supabase:types`) |
| `docs/dev/database.md` §2.8 | SSOT: `user_collections` |
| `docs/dev/api.md` §7.3 | Action contract registry |

---

## Table: `user_collections`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | One row per card instance |
| `user_id` | UUID FK → `profiles` | |
| `product_id` | UUID FK → `product_catalog` | |
| `grading_company` | TEXT | Default `RAW` |
| `grading_score` | TEXT | Default `A` |
| `purchase_price` | NUMERIC(12,2) | User-entered 入手價 |
| `sold_at` | TIMESTAMPTZ NULL | Non-null = archived sold; excluded from portfolio valuation |
| `sold_listing_id` | UUID FK → `listings` ON DELETE SET NULL | Source listing on trade complete |
| `sold_price` | NUMERIC(12,2) NULL | `member_orders.final_price` at archive time |
| `created_at` / `updated_at` | TIMESTAMPTZ | Sort DESC on `created_at` |

**RLS:** `collections_owner` — `auth.uid() = user_id` for all operations (`authenticated`).

**No UNIQUE** on `(user_id, product_id, grade)` — user may own multiple copies of same card/grade.

---

## Server actions (`app/actions/collection.ts`)

All return `{ success: true, data }` or `{ success: false, error: string }`.

| Action | Input | Output |
|--------|-------|--------|
| `getCollectionPageBootstrap` | `{ page?, pageSize?, filter?, query? }` | `{ summary, page }` |
| `getCollectionPortfolioSummary` | — | `CollectionPortfolioSummary` |
| `getCollectionEntries` | `{ page?, pageSize?, filter?, query? }` | `CollectionEntriesPage` |
| `addToCollection` | `{ productId, gradingOptionId, purchasePrice }` | `{ collectionId }` |
| `removeFromCollection` | `{ collectionId }` | `{ ok: true }` |
| `updateCollectionGrade` | `{ collectionId, nextGradingOptionId }` | `{ ok: true }` |
| `updateCollectionPurchasePrice` | `{ collectionId, purchasePrice }` | `{ ok: true }` |

### `CollectionPortfolioSummary`

```ts
{
  totalMarketValue: number;   // Σ resolveCollectionMarketValue
  totalPurchasePrice: number;
  unrealizedPnl: number;      // totalMarketValue - totalPurchasePrice
  pnlPercent: number;
  cardCount: number;
  gradedCount: number;
  rawCount: number;
  listedCount: number;        // isListedCollectionRow via user active listings
}
```

**PnL pricing:** `resolveCollectionMarketValue` — exact grade SNKRDUNK → platform same-grade MIN → purchase_price (`lib/marketplace/portfolio-pricing.ts`). No cross-grade fallback.

### `CollectionEntriesPage`

```ts
{
  entries: CollectionEntry[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

### `CollectionEntry` (list row)

```ts
{
  collectionId: string;
  productId: string;
  name: string;
  cardCode: string;
  setCode: string;
  rarity: string | null;
  imageUrl: string | null;          // product_catalog.image_url
  gradingCompany: string;
  gradingScore: string;
  gradeLabel: string;
  gradingOptionId: string;          // for sell prefill → AddAssetModal
  purchasePrice: number;
  currentMarketValue: number | null;
  valuationSource: "snkrdunk" | "platform" | "purchase_price" | null;
  trend30d: number | null;          // exact grade SNKRDUNK only
  status: "holding" | "listed";
  activeListingId: string | null;
}
```

**Valuation:** `resolveCollectionMarketValue` — exact grade SNKRDUNK → platform same-grade MIN → `purchase_price`. No cross-grade fallback.

**Pagination:** default `pageSize` 20, max 50. Filters: `all` | `graded` | `raw` | `listed`. Search matches name, card code, set code.

### Guest guard

All mutations + `getCollectionPortfolioSummary` + `getCollectionEntries` → `{ success: false, error: "請先登入" }` when no session.

`isSupabaseConfigured()` guard on auth helper (CI-safe).

`revalidatePath`: `/profile/user/collection` after mutations.

---

## Verify (backend)

```bash
bunx supabase db push   # ✅ applied 20260706110000
bun run supabase:types
bunx tsc --noEmit
bun run build:ci
```

**SQL smoke test (logged-in user):**

1. Hobby add → `SELECT * FROM user_collections WHERE user_id = auth.uid()`
2. Row has `grading_company`, `grading_score`, `purchase_price`
3. Grade update → columns change; valuation repriced on next fetch (`valuationSource` may change)
4. Card with no SNKRDUNK / platform price for **same grade** → `valuationSource: purchase_price`; still in `totalMarketValue`
5. Card with PSA 10 SNKRDUNK but collection row is PSA 9 → **does not** use PSA 10 price
6. After listing same product+grade → entry still exists; frontend shows `status: listed`; `listedCount` +1
7. Delete → row gone; `fn_recalculate_reputation_tags` badge count updates

---

## Partner follow-ups (optional)

| Item | Owner | Notes |
|------|-------|-------|
| Inline edit `purchase_price` in table | Frontend | Action `updateCollectionPurchasePrice` ready; UI not wired |
| Home `PortfolioRewards` live net worth | Frontend | Still mock; call `getCollectionPortfolioSummary` |
| Box/Set hobby collection | Backend + Frontend | Card-only for Phase 1 |
| RPC summary at 1000+ cards | Backend | Phase 2; current TS aggregate OK for ~500 |
| Wishlist server pagination | Backend + Frontend | Collection done; wishlist still full fetch |
