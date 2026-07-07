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
| `app/lib/hooks/useInventory.ts` | Data hook (`initialData`, `isRefreshing`, `isSummaryLoading`) |
| `app/lib/inventory/perf-log-client.ts` | Client mount timing |
| `app/components/merchant/InventoryAccordion.tsx` | `inactive` → **未上架**; optional `imageUrl` on `SKUGroup` |
| `app/components/transactions/ExecutionSlideOver.tsx` | Fires `incrementListingView` on open |

Merchant inventory (`app/profile/merchant/(dashboard)/inventory/page.tsx`) still uses mock data — can reuse `useInventory` when wired. `NewListingForm` is **not** mounted on the user inventory page (removed 2026-07-07).

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
  initialData, // from SSR UserInventoryPageData
});
```

SSR path: `UserInventoryPageData` calls `getInventoryPageBootstrap` and passes `initialData` — hook skips mount fetch.

Listen for `inventory-should-refresh` to refetch when listings change elsewhere (e.g. collection flow). The user inventory page no longer includes an on-page listing form.

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
