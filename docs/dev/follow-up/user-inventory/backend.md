# User Inventory — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired (user inventory page)
- **Migrations:** ✅ Pushed to remote (`20260706120000`–`20260706140000`)
- **Partner report:** [PARTNER_REPORT.md](./PARTNER_REPORT.md)

## Changelog (2026-07-07)

| Change | Detail |
|--------|--------|
| **`getInventoryPageBootstrap`** | Single listings fetch → summary + paginated groups |
| **`loadUserInventoryView`** | Shared helper in `lib/listings/load-user-inventory.ts` |
| **Perf logging** | `[inventory:perf]` via `lib/listings/perf-log.ts` |
| **Thin wrappers** | `getUserInventorySummary` / `getUserInventoryGroups` reuse helper |

## Changelog (2026-07-06)

| Change | Detail |
|--------|--------|
| **`listing_stats` slimmed** | `views`, `offers_count` only; dropped `likes`, `trade_records_count` |
| **`offers_count` semantics** | Cumulative offer records per listing; +1 on `rpc_make_offer` INSERT only |
| **`rpc_increment_listing_view`** | Authenticated view count when opening `ExecutionSlideOver` |
| **`app/actions/inventory.ts`** | `getUserInventorySummary`, `getUserInventoryGroups` |
| **Grouping** | By `product_catalog.id` (`listings.product_id`); multiple listings per product |
| **Status UI** | DB `inactive` → UI label **未上架** (`ListingStatus.inactive`) |

---

## Architecture

```
Inventory page mount / refresh
  → getInventoryPageBootstrap({ page, pageSize, query, sellerPersona })   // preferred — single fetch
  → loadUserInventoryView
  → listings WHERE seller_id = auth.uid() [AND seller_persona = $persona when set]
  → JOIN product_catalog (name, image_url, card_number)
  → JOIN listing_stats (views, offers_count)
  → summarizeInventoryListings + groupListingsByProduct() → summary + SKUGroup[]

Filter / search / page change (client)
  → getUserInventoryGroups({ page, pageSize, query, sellerPersona })

Persona split (dual identity)
  → Member inventory: sellerPersona = 'member'
  → Merchant inventory: sellerPersona = 'merchant'

Legacy / isolated callers
  → getUserInventorySummary()
  → getUserInventoryGroups({ page, pageSize, query })
```

---

## Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260706120000_listing_stats_inventory_extend.sql` | Schema, FK, init trigger, seller RLS |
| `supabase/migrations/20260706130000_listing_stats_rpc_sync.sql` | `fn_bump_listing_offers_count`, patch `rpc_make_offer` |
| `supabase/migrations/20260706140000_rpc_increment_listing_view.sql` | View counter RPC |
| `app/actions/inventory.ts` | Bootstrap + summary + paginated product groups |
| `lib/listings/load-user-inventory.ts` | Shared `loadUserInventoryView` |
| `lib/listings/perf-log.ts` | Server perf instrumentation |
| `app/actions/listings.ts` | `incrementListingView` |
| `app/lib/inventory/types.ts` | DTOs + `mapListingStatusToUi` |
| `lib/listings/build-inventory-groups.ts` | Grouping, search match, summary counts |
| `lib/listings/constants.ts` | `INVENTORY_DEFAULT_PAGE_SIZE` (6) |
| `types/supabase.ts` | Generated / patched types |

---

## Table: `listing_stats`

| Column | Type | Notes |
|--------|------|-------|
| `listing_id` | UUID PK FK → `listings` | CASCADE delete |
| `views` | INTEGER NOT NULL DEFAULT 0 | Slide-over impressions |
| `offers_count` | INTEGER NOT NULL DEFAULT 0 | **Cumulative** offers for listing |
| `updated_at` | TIMESTAMPTZ | |

**RLS:** `listing_stats_seller_read` — seller reads stats for own listings (`authenticated`).

---

## Action contracts

### `getInventoryPageBootstrap(input?)`

```ts
getInventoryPageBootstrap({
  query?: string,
  page?: number,       // default 1
  pageSize?: number,   // default 6, max 50
})

// Success
{
  success: true,
  data: {
    summary: InventorySummary,
    page: InventoryGroupsPage,
  },
}
```

### `getUserInventorySummary()`

```ts
// Success
{
  success: true,
  data: {
    totalListings: number,
    activeCount: number,
    soldCount: number,
    inactiveCount: number,
  },
}

// Failure
{ success: false, error: string }
```

### `getUserInventoryGroups(input?)`

```ts
getUserInventoryGroups({
  query?: string,      // card name / card no
  page?: number,       // default 1
  pageSize?: number,   // default 6, max 50
})

// Success
{
  success: true,
  data: {
    groups: InventoryProductGroup[], // SKUGroup + optional imageUrl
    totalGroups: number,
    page: number,
    pageSize: number,
    totalPages: number,
  },
}
```

### `incrementListingView(listingId)`

```ts
// Success: { success: true }
// Failure: { success: false, error: string }
// Requires authenticated user; no-op in RPC for guests
```

### `updateCardListing(formData)`

Edit an existing listing owned by the authenticated seller.

```ts
// FormData fields
listingId: string          // listings.id
price: string              // numeric HKD
gradingOptionId: string    // lib/grading/options id (e.g. psa:10, raw:A)
sellerDescription?: string // max 500 chars
isActive: "true" | "false" // maps to status active | inactive
uploadedImages: string     // JSON array of { url, order, objectKey?, remark? } — exactly 6 slots

// Success
{ success: true, data: { listingId: string } }

// Failure
{ success: false, error: string }
```

**Rules:**
- `seller_id` must equal `auth.uid()`; `sold` listings cannot be edited
- Exactly 6 images required (`validateListingImageCount`)
- New uploads rolled back on failure; replaced Bunny keys deleted best-effort (`listings/{userId}/` prefix)
- `revalidatePath` for marketplace + user/merchant inventory

**Client helper:** `submitCardListingWithProgress({ mode: "edit", listingId, imageSlots, ... })` in `lib/listings/submit-card-listing.ts` — uploads only changed slots, reuses existing CDN URLs for unchanged slots.

---

## Verify (backend)

1. Apply migrations `20260706120000`–`20260706140000`
2. Create listing → `listing_stats` row `{ views: 0, offers_count: 0 }`
3. `makeOffer` → `offers_count +1`; reject/accept → count unchanged
4. Open product detail slide-over as buyer → `views +1`
5. `getUserInventoryGroups` returns groups keyed by `product_id`
