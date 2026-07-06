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
| `app/profile/user/(dashboard)/inventory/page.tsx` | Summary cards, search, accordion, pagination |
| `app/lib/hooks/useInventory.ts` | Data hook (summary + groups) |
| `app/components/merchant/InventoryAccordion.tsx` | `inactive` → **未上架**; optional `imageUrl` on `SKUGroup` |
| `app/components/transactions/ExecutionSlideOver.tsx` | Fires `incrementListingView` on open |
| `app/components/merchant/NewListingForm.tsx` | Dispatches `inventory-should-refresh` on mock submit |

Merchant inventory (`app/profile/merchant/(dashboard)/inventory/page.tsx`) still uses mock data — can reuse `useInventory` when wired.

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
  setPage,
  refetch,
} = useInventory({ query: searchQuery, pageSize: 6 });
```

Listen for `inventory-should-refresh` to refetch after listing create (same pattern as collection).

---

## Acceptance checklist

- [ ] Logged-in seller sees real listings grouped by product (card)
- [ ] Multiple listings for same card appear under one accordion group
- [ ] Summary: 現貨 / 上架中 / 已售出 counts match DB
- [ ] Search filters by card name or card number
- [ ] Pagination is per **product group** (6 per page)
- [ ] `inactive` listings show **未上架** badge
- [ ] `views` and `offersCount` reflect `listing_stats`
- [ ] Opening `ExecutionSlideOver` increments views (after migration)
- [ ] Empty state when no listings
