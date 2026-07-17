# User Inventory — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired (`/profile/user/inventory`)
- **Migrations:** ✅ Pushed to remote (`20260706120000`–`20260706140000`)
- **Partner report:** [PARTNER_REPORT.md](./PARTNER_REPORT.md)

---

## UI touchpoints

| File | Role |
|------|------|
| `app/profile/user/(dashboard)/inventory/page.tsx` | `Suspense` shell |
| `app/profile/user/(dashboard)/inventory/UserInventoryPageData.tsx` | SSR bootstrap |
| `app/profile/user/(dashboard)/inventory/UserInventoryClient.tsx` | Summary, search, accordion, pagination |
| `app/profile/user/(dashboard)/inventory/UserInventorySkeleton.tsx` | Streaming fallback |
| `app/profile/user/(dashboard)/inventory/` | Member — `sellerPersona: member` |
| `app/profile/merchant/(dashboard)/inventory/` | Merchant — `sellerPersona: merchant`; analytics links on accordion |
| `app/lib/hooks/useInventory.ts` | Data hook (`initialData`, `sellerPersona`, `isRefreshing`, `isSummaryLoading`) |
| `app/lib/inventory/perf-log-client.ts` | Client mount timing |
| `app/components/merchant/InventoryAccordion.tsx` | `inactive` → **未上架**; optional `imageUrl` on `SKUGroup` |
| `app/components/merchant/ListingEditDialog.tsx` | Edit modal — price, grading, description, 6-slot photos, `isActive`; `ImageViewer` preview |
| `app/components/transactions/ExecutionSlideOver.tsx` | Fires `incrementListingView` on open |

Merchant inventory (`app/profile/merchant/(dashboard)/inventory/`) is **wired** — same hook/actions as user; filters `seller_persona = merchant`; no on-page `NewListingForm`.

---

## Hook usage

```ts
import { useInventory } from "@/app/lib/hooks/useInventory";

const {
  groups,
  totalGroups,
  page,
  totalPages,
  summary,
  isLoading,
  isSummaryLoading,
  isRefreshing,
  setPage,
  refetch,
} = useInventory({
  query: searchQuery,
  pageSize: 6,
  initialData,
  sellerPersona: "member", // or "merchant" on merchant inventory page
});
```

SSR path: `UserInventoryPageData` calls `getInventoryPageBootstrap` and passes `initialData` — hook skips mount fetch.

Listen for `inventory-should-refresh` to refetch when listings change elsewhere (e.g. `AddAssetModal` merch submit, collection sell flow). The user inventory page no longer includes an on-page listing form.

**Add listing:** Global `AddAssetModal` (TopNav/BottomNav `+`) — same modal for member and merchant. `seller_persona` on create follows **`activeListingPersona`** in `useUIStore` (synced by `ActiveListingPersonaSync` + `ProfilePersonaSwitch`, persisted in `sessionStorage`). Merchant identity → `merchant` listings on any page; member identity → `member`. Collection sell (`sellPrefill`) always forces `member`. Success dispatches `inventory-should-refresh`.

**Edit listing:** Shared `ListingEditDialog` (opened from `InventoryAccordion` row **編輯** on member + merchant inventory). Submits via `submitCardListingWithProgress({ mode: "edit" })` → `updateCardListing`. Fields: price, grading (`gradingOptionId`), 品相描述, 商品上架 (`isActive`), 6 photo slots with per-slot remarks. Thumbnail click opens `ImageViewer`; **更換** uploads a new file for that slot. Global `ListingSubmitOverlay` shows upload/save progress. Success dispatches `inventory-should-refresh`. Removed: carousel, 品相備註, 邊角磨損屬性.

**Perf report:** [PERF_REPORT.md](./PERF_REPORT.md)

---

## Acceptance checklist

- [ ] Summary cards show `—` while `isSummaryLoading`; SSR shows values immediately
- [ ] Hydrate 後首屏唔再雙 fetch（有 `initialData`）
- [ ] Multiple listings for same card appear under one accordion group
- [ ] Summary: 現貨 / 上架中 / 已售出 counts match DB
- [ ] Search filters by card name or card number
- [ ] Pagination is per **product group** (6 per page)
- [ ] `inactive` listings show **未上架** badge
- [ ] `views` and `offersCount` reflect `listing_stats`
- [ ] Opening `ExecutionSlideOver` increments views (after migration)
- [ ] Empty state when no listings
- [ ] 頁面無「新增商品」accordion / `NewListingForm`
- [ ] Edit modal: change price / grading / description / replace 1 photo → save → list refreshes (`inventory-should-refresh`)
- [ ] Edit modal: thumbnail opens `ImageViewer`; no carousel; no 品相備註 field
