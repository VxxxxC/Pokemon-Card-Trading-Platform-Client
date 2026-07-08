# User Collection — Frontend Handoff

## Status

- **Backend:** ✅ Ready (see [backend.md](./backend.md)) · migration pushed
- **Frontend:** ✅ Wired — collection table, hobby add, sell prefill
- **Your focus:** Polish `CollectionTable` styling, optional inline purchase-price edit, home portfolio widget

## Changelog (2026-07-06)

| Area | Shipped |
|------|---------|
| **Mock → DB** | `collection/page.tsx` uses `useCollection()`; removed `useMockDbStore` + inline sell Dialog |
| **`CollectionTable`** | Catalog thumbnails, grade dropdown, valuation + 30D % (no sparkline) |
| **Server pagination** | `getCollectionEntries({ page, filter, query })` + `Pagination` controls |
| **Portfolio summary** | `getCollectionPortfolioSummary` → odometer + 4 stat tiles (含 **已上架**) |
| **Valuation ladder** | Exact-grade SNKRDUNK → platform same-grade → **入手價**; table shows **入手價估計** when fallback |
| **Hobby add** | `openAddAssetModal({ mode: "hobby" })` → `addToCollection` (no photos) |
| **Sell prefill** | `openAddAssetModal({ mode: "merch", sellPrefill })` — same `AddAssetModal`, no separate sell dialog |
| **Store API** | Unified `openAddAssetModal({ mode, sellPrefill? })`; removed `openAddAssetModalFromCollection` |
| **Portfolio header** | Odometer from `summary`; PnL footnote documents valuation order |
| **Filters** | 全部 / 已鑑定 / 未鑑定 / 已上架 (`status === 'listed'`) |
| **Refresh** | `collection-should-refresh` window event after add / sell |

---

## File map

| File | Role |
|------|------|
| `app/profile/user/(dashboard)/collection/page.tsx` | Suspense shell |
| `app/profile/user/(dashboard)/collection/UserCollectionPageData.tsx` | SSR `getCollectionPageBootstrap` |
| `app/profile/user/(dashboard)/collection/UserCollectionClient.tsx` | Summary odometer, search, filters, tables |
| `app/profile/user/(dashboard)/collection/UserCollectionSkeleton.tsx` | Streaming fallback |
| `app/components/market/CollectionTable.tsx` | Holdings table UI |
| `app/lib/hooks/useCollection.ts` | `initialData`, filter/page fetch, `isRefreshing` |
| `app/components/shared/AddAssetModal.tsx` | Hobby submit + sell-prefill merch mode |
| `app/store/useUIStore.ts` | `SellFromCollectionPrefill`, `OpenAddAssetModalInput`, `openAddAssetModal` |
| `app/components/market/WishlistTable.tsx` | Unchanged wishlist section on same page |

---

## Data wiring

### Collection page

```tsx
const [activeFilter, setActiveFilter] = useState("全部");
const [query, setQuery] = useState("");
const listFilter = COLLECTION_FILTER_LABELS[activeFilter] ?? "all";

const {
  entries,
  total,
  page,
  pageSize,
  totalPages,
  summary,
  isLoading,
  isSummaryLoading,
  setPage,
  removeEntry,
  updateGrade,
  refetch,
} = useCollection({ filter: listFilter, query, initialData });

<CollectionTable
  entries={entries}
  isLoading={isLoading}
  currentPage={page}
  totalPages={totalPages}
  totalItems={total}
  itemsPerPage={pageSize}
  onPageChange={setPage}
  onRemove={(e) => removeEntry(e)}
  onUpdateGrade={updateGrade}
/>
```

Portfolio header reads `summary` (not client-side sum of `entries`).

Listen for sell/add refresh:

```tsx
useEffect(() => {
  const handler = () => refetch();
  window.addEventListener("collection-should-refresh", handler);
  return () => window.removeEventListener("collection-should-refresh", handler);
}, [refetch]);
```

### Hobby 收錄新卡

```tsx
openAddAssetModal({ mode: "hobby" });
// User: catalog search → grade → 入手成本 → submit
// → addToCollection → toast → collection-should-refresh
```

No photo upload in hobby mode.

### 出售收藏品

```tsx
openAddAssetModal({
  mode: "merch",
  sellPrefill: {
    collectionId: entry.collectionId,
    productId: entry.productId,
    catalog: {
      name: entry.name,
      displayId: entry.cardCode,
      cardNumber: entry.cardCode,
      setCode: entry.setCode,
      imageUrl: entry.imageUrl,
      rarity: entry.rarity,
    },
    gradingOptionId: entry.gradingOptionId,
    sellingPrice: entry.purchasePrice,
  },
});
```

Modal behaviour when `addAssetSellPrefill` is set:

- Title: **上架出售收藏**
- Catalog search + grade picker **hidden** (read-only selected card banner)
- Item-type switch **hidden**
- Selling price **prefilled** with入手價 (editable)
- Photo slots **required** (4–6, same as merch card listing)
- Submit → `submitCardListingWithProgress` with `sourceCollectionId: sellPrefill.collectionId` → `collection-should-refresh`
- Collection row **not deleted**; filter「已上架」shows it; on trade complete row moves to **已售出**

### Merch 直接上架 → 加入收藏庫？

After merch card listing succeeds **without** `sellPrefill`:

1. Listing toast + slide-over closes
2. `CollectionAddAfterListingDialog` asks「是否一併加入收藏庫？」
3. Confirm → `addToCollection` + `collection-should-refresh`
4. Skip → orphan listing only (dashboard `findOrphanActiveListings` still counts it)

### 已售出歷史

Filter chip **已售出** (`filter: 'sold'`):

- Rows with `sold_at IS NOT NULL`
- Table shows **成交價** + date; sell CTA hidden
- Portfolio odometer **always** uses active rows only (`sold_at IS NULL`)

### Table columns

| Column | Source |
|--------|--------|
| 卡牌資料 | `name`, `cardCode`, `imageUrl`, link → `/marketplace/product/{productId}` |
| 鑑定規格 / 狀態 | Editable grade badge; `status` pill (持有中 / 已上架 / 已售出) |
| 收錄價格 | `purchasePrice` |
| 現市價格 | `currentMarketValue` + `valuationSource`; PnL vs purchase. Fallback 時顯示 **入手價估計** |
| 30D 走勢 | `trend30d` % — exact-grade SNKRDUNK only (no sparkline on list rows) |
| 操作 | `⋯` → 查看市場 / 出售 / 移除 |

---

## UX decisions (product)

1. **No collection photos** — catalog image is enough for portfolio view.
2. **Sell reuses Add Asset merch flow** — ensures listing photo requirements (4–6) without a separate sell dialog.
3. **Prefill reduces friction** — user only uploads photos and confirms price.
4. **Listed ≠ removed** — collection tracks cost basis even when card is on marketplace.
5. **Same-grade valuation only** — no PSA 10 price for a PSA 9 row; purchase_price is last resort, not cross-grade proxy.

---

## Not wired (partner backlog)

| Surface | Status |
|---------|--------|
| Inline edit 入手價 in table | Backend action ready; UI not built |
| Home `PortfolioRewards.tsx` | Mock net worth |
| Box/Set hobby collection | Card-only Phase 1 |
| `grading` / 鑑定中 filter | Removed (no workflow) |

---

## Acceptance checklist

- [x] Logged-in: hobby add creates `user_collections` row
- [x] Table thumbnail from `product_catalog.image_url`
- [x] Portfolio odometer from `getCollectionPortfolioSummary` (not table page sum)
- [x] Server pagination + filter/search via `getCollectionEntries`
- [x] Grade dropdown reprices + refreshes 30D trend
- [x] Sell opens prefilled Add Asset modal; photos required
- [x] Header shows 持有 / 已鑑定 / Raw / **已上架** counts from summary
- [x] Purchase-price fallback: row shows **入手價估計**; portfolio total still includes card
- [x] After listing,「已上架」filter shows row; sell action hidden when listed
- [x] Merch-only listing → post-listing「加入收藏庫？」dialog
- [x] Trade complete → row archived; **已售出** filter shows sold price/date; odometer excludes sold
- [x] Remove deletes row
- [x] SSR: portfolio header + table page 1 in HTML before hydrate
- [x] Mount server actions: 1 bootstrap; wishlist deferred below fold
- [x] `bun run build:ci` passes
- [ ] Home portfolio widget live
- [ ] Inline purchase price edit

---

## Verify (frontend)

1. Log in → `/profile/user/collection` → **收錄新卡** → pick catalog + grade + cost → row appears with thumbnail
2. Check **AI 總身家估值** updates (SNKRDUNK / platform same-grade, or **入手價估計** fallback)
3. Add a card with no market data but valid 入手價 → row shows purchase value + **入手價估計**; header total includes it
4. `⋯` → **出售收藏品** → modal prefilled → upload 4–6 photos → confirm price → listing created
5. Filter **已上架** → row shows **已上架** pill; sell option gone; header **已上架** count matches filter total
6. `⋯` → **移除出資產庫** → row removed
7. Wishlist section on same page still works independently
