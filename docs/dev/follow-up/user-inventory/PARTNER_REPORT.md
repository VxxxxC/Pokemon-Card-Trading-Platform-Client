# Partner Report — User Inventory + `listing_stats`

**Date:** 2026-07-06  
**Flow:** Seller inventory (`/profile/user/inventory`) + listing analytics  
**Backend owner:** Backend track  
**Frontend owner:** Partner (polish + merchant parity)  
**Remote DB:** Migrations **pushed** (`bunx supabase db push` ✅)  
**Types:** Regenerated (`bun run supabase:types` ✅)

---

## Executive summary

| Area | Status |
|------|--------|
| `listing_stats` schema fix | ✅ Deployed |
| `rpc_make_offer` → cumulative `offers_count` | ✅ Deployed |
| `rpc_increment_listing_view` | ✅ Deployed |
| User inventory page data wiring | ✅ Baseline shipped |
| Merchant inventory page | ⏳ Still mock — reuse `useInventory` |
| `NewListingForm` real create listing | ⏳ Still mock submit toast |

**Partner action:** Verify acceptance checklist below; polish UI. Merchant inventory wired (persona filter).

---

## What shipped

### Database (remote)

| Migration | Purpose |
|-----------|---------|
| `20260706120000_listing_stats_inventory_extend.sql` | `listing_stats`: `views` + `offers_count` only; DROP `likes` / `trade_records_count`; FK; init trigger; seller RLS |
| `20260706130000_listing_stats_rpc_sync.sql` | `rpc_make_offer` INSERT → `offers_count +1` (cumulative, never decrements on reject/accept) |
| `20260706140000_rpc_increment_listing_view.sql` | Authenticated buyer opens slide-over → `views +1` |

### `listing_stats` contract

| Column | Semantics |
|--------|-----------|
| `views` | Impressions when logged-in user opens `ExecutionSlideOver` for an **active** listing |
| `offers_count` | **Total** offer rows ever created for that listing (`+1` per `rpc_make_offer` INSERT only) |

### Server actions

| Action | File | Notes |
|--------|------|-------|
| `getUserInventorySummary()` | `app/actions/inventory.ts` | `totalListings`, `activeCount`, `soldCount`, `inactiveCount` |
| `getUserInventoryGroups({ query?, page?, pageSize? })` | `app/actions/inventory.ts` | Groups by `product_catalog.id`; default 6 groups/page |
| `incrementListingView(listingId)` | `app/actions/listings.ts` | Calls `rpc_increment_listing_view`; guest → no-op |

### UI wired (baseline)

| File | Change |
|------|--------|
| `app/profile/user/(dashboard)/inventory/page.tsx` | Mock removed; `useInventory` hook |
| `app/lib/hooks/useInventory.ts` | Summary + groups + debounced search + pagination |
| `app/components/merchant/InventoryAccordion.tsx` | `inactive` → **未上架**; `SKUGroup.imageUrl` from catalog |
| `app/components/transactions/ExecutionSlideOver.tsx` | View count on open |
| `app/lib/types/rbac.ts` | `ListingStatus` includes `'inactive'` |

### Grouping rule (confirmed)

- **One accordion group** = one `product_catalog.id` (`listings.product_id`)
- **Multiple rows** under a group = same card, different listings (price / grading / status)

### Status mapping

| DB `listings.status` | UI `ListingStatus` | Label |
|----------------------|--------------------|-------|
| `active` | `active` | 上架中 |
| `sold` | `sold` | 已售出 |
| `inactive` | `inactive` | **未上架** |

---

## Data flow (reference)

```
/profile/user/inventory
  → getUserInventorySummary()
  → getUserInventoryGroups({ page, pageSize: 6, query })
  → listings (seller_id = auth.uid())
  → product_catalog + listing_stats
  → groupListingsByProduct() → InventoryAccordion

Marketplace product detail → ExecutionSlideOver open
  → incrementListingView(listingId) → views +1

Buyer makeOffer
  → rpc_make_offer → offers_count +1
```

Refresh event: `inventory-should-refresh` (dispatched from `NewListingForm` mock submit today).

---

## Partner backlog

### P0 — Verify wired flows

- [ ] Log in as seller with listings → `/profile/user/inventory` shows real groups
- [ ] Same card, multiple listings → single accordion, multiple rows
- [ ] Summary tiles match DB counts
- [ ] Search by card name / card number
- [ ] Pagination = **product groups** (6/page)
- [ ] `inactive` badge shows **未上架**
- [ ] `views` / 叫價次數 match `listing_stats`
- [ ] As buyer, open slide-over → `views` increments
- [ ] After `makeOffer` → seller inventory shows higher `offersCount`; reject/accept does **not** decrease it

### P1 — Merchant parity

- [ ] `app/profile/merchant/(dashboard)/inventory/page.tsx` — replace mock with `useInventory` (same hook, same actions)

### P2 — Polish (partner-owned styling)

- [ ] `InventoryAccordion` row dialog: `edgeWear` is empty string from API — hide or replace with real field later
- [ ] Loading / empty states styling pass
- [ ] Catalog `image_url` in accordion (already passed via `imageUrl`; verify `next.config` host allowlist)
- [ ] Wire `NewListingForm` to real `createCardListing` / `submitCardListingWithProgress` and dispatch `inventory-should-refresh` on success

### P3 — Out of scope (this PR)

- Listing edit / delist mutations from inventory row dialog (still toast stub)
- `draft` / `pending` DB statuses (UI types exist for legacy mock only)

---

## Hook quick reference

```tsx
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

```tsx
// After real listing create:
window.dispatchEvent(new CustomEvent("inventory-should-refresh"));
```

---

## Docs index

| Doc | Audience |
|-----|----------|
| [backend.md](./backend.md) | Action contracts, table DDL, backend verify |
| [frontend.md](./frontend.md) | UI file map, acceptance checklist |
| [INTEGRATION_QUEUE.md](../../INTEGRATION_QUEUE.md) | Dashboard row |
| [api.md](../../api.md) §7.4 | API registry |

---

## Smoke test commands

```bash
bun run dev
# Seller: /profile/user/inventory
# Buyer: marketplace product → order book row → ExecutionSlideOver
```

```bash
bunx tsc --noEmit
bun run lint
```
