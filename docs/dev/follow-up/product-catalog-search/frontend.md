# Product Catalog Search + Create Listing — Frontend Handoff

## Status

- **Backend:** ✅ Ready (catalog search + single-card `createCardListing`)
- **Frontend:** ✅ **Baseline wired** — search + submit work in `AddAssetModal.tsx` (merch / single card) + global progress overlay
- **Your focus:** Visual polish & UX refinements (not backend wiring)

## What is already done

### Catalog search

| Feature | Location |
|---------|----------|
| Debounced typeahead (350ms, min 2 chars) | `useProductCatalogSearch` hook |
| 搜尋 button (immediate search) | `AddAssetModal.tsx` |
| Suggestions dropdown | Search input section |
| Select → auto-fill query + `set` (擴充包系列) | `handleSelectCatalogSuggestion` |
| Truncation footer (`顯示最相關的 N 筆，共 X 筆符合`) | When `hasMore` is true |
| Card thumbnails in dropdown | Native `<img>` 56×72px from `imageUrl` |

### Selected card (after pick)

| Feature | Location |
|---------|----------|
| Summary panel: thumbnail, name, card number, rarity | Below search when `catalogSearch.selected` |
| Submit requires catalog selection (`productId`) | `handleSubmit` → `submitCardListingWithProgress` |

### Grading (single card)

| Feature | Location |
|---------|----------|
| One unified dropdown (`PSA 10`, `BGS 10 黑`, `裸卡 A`, …) | `lib/grading/options.ts` + `Select` |
| Default: PSA 10 | `DEFAULT_GRADING_OPTION_ID` |

### Photos (merch mode)

| Feature | Location |
|---------|----------|
| 6 slots, min 4 required (single card) | `photoSlots` state |
| Local preview only until submit | `URL.createObjectURL` |
| Multi-file picker (`multiple` on input) | Fills slots from clicked index onward |
| Click filled slot to replace | `openPhotoPicker(i)` |
| Per-image client upload with progress | `POST /api/listings/upload-image` via `uploadListingImageWithProgress` |
| DB finalize after uploads | `createCardListing` with `uploadedImages` JSON |
| Rollback Bunny files if DB insert fails | Server-side (no UI change needed) |

### Global submit overlay (create / edit listing)

| Feature | Location |
|---------|----------|
| Full-screen overlay during submit | `components/listings/ListingSubmitOverlay.tsx` (mounted in `app/layout.tsx`) |
| Progress bar + status message | `useListingSubmitStore` |
| Per-photo progress (`上載相片 (n/N)`) | `lib/listings/submit-card-listing.ts` |
| Saving phase (`寫入商品資料…`) | Store phase `saving` |
| Error state + dismiss | Overlay; no duplicate error toast on submit failure |
| Blocks closing Add Asset modal while submitting | `isSubmitting` derived from store |
| `mode: "create" \| "edit"` | Store supports edit labels; edit flow not wired yet |

### Listing form (merch / single card)

| Feature | Location |
|---------|----------|
| Selling price (HK$) | Merch fields section |
| Description optional, max 500 chars + counter | `LISTING_DESCRIPTION_MAX` |
| 商品上架 checkbox | **Removed** — always `active` on create |
| Submit blocked while overlay open | Store-driven; submit button disabled during upload |
| Client validation before upload | `validateCreateCardListing` |

## UI touchpoints

| File | Role |
|------|------|
| `app/components/shared/AddAssetModal.tsx` | Form, catalog search, photo slots, submit trigger |
| `components/listings/ListingSubmitOverlay.tsx` | Global progress modal (`z-[400]`) |
| `app/store/useListingSubmitStore.ts` | Overlay state |

### Polish backlog (`AddAssetModal` + overlay)

| Area | What to polish |
|------|----------------|
| Catalog search + dropdown | Typeahead UX |
| Selected card panel | Layout / typography |
| Unified grading `Select` | Group labels, mobile scroll |
| Photo grid (3×2) | Slot states, 更換 affordance |
| Description + price | Spacing, error states |
| Submit / cancel buttons | Disabled state while overlay active |
| **ListingSubmitOverlay** | Typography, overlay opacity, success animation |

## Dropdown layout (search results)

```
[thumbnail 56×72]  {name}           ← name_zh ?? name_ja
                 {display_id · rarity · pokemon_stage · card_number}
```

- **Rarity:** raw DB English (e.g. `Common`) — do not localize unless product asks
- **Images:** `www.pokemon-card.com` — allowed in `next.config.ts`

## Selected card panel layout

```
[thumbnail]  {name}
             {displayId | cardNumber}
             {rarity}
```

## Hook API (catalog search)

```ts
const catalogSearch = useProductCatalogSearch(
  itemType === "box_set" ? "box_set" : "card",
  { enabled: isOpen },
);

const {
  query,
  setQuery,
  results,
  total,
  hasMore,
  isSearching,
  error,
  selected,        // set after pick — required for listing submit
  selectSuggestion,
  searchNow,
  clearSearch,
} = catalogSearch;
```

## Submit integration (merch + single card)

```ts
import { submitCardListingWithProgress } from "@/lib/listings/submit-card-listing";

const result = await submitCardListingWithProgress({
  mode: "create", // or "edit" when edit listing is wired
  productId: catalogSearch.selected!.id,
  gradingOptionId: selectedGradingId,
  price: Number(sellingPrice),
  sellerDescription: conditionDesc || undefined,
  imageFiles,
});
```

Internally: opens overlay → uploads each file with XHR progress → `createCardListing` with `uploadedImages` JSON.

On success: overlay success state → auto-close → success toast + `global-asset-successfully-added` event + Add Asset modal close.

On failure: overlay shows error; user taps **關閉** to dismiss.

## Optional polish (partner backlog)

- [ ] Close dropdown on click outside
- [ ] Keyboard navigation (↑↓ Enter to select)
- [ ] Highlight matched substring in results
- [ ] Empty state copy when `total === 0`
- [ ] Style pass: spacing, hover, mobile scroll
- [ ] Inline field errors (currently toast-only for pre-submit validation)
- [ ] Box/set merch submit (still local mock path)
- [ ] Edit listing screen — reuse `submitCardListingWithProgress({ mode: "edit", … })`

## Acceptance test

### Catalog search

1. `bun run dev` — ensure `.env` includes Supabase + Bunny vars
2. Open **新增商品** modal (merch mode)
3. Type `sv2a` → after ~350ms, dropdown with card images + metadata
4. Pick a row → input + 擴充包系列 auto-fill; **selected card panel** appears
5. Toggle **卡牌** / **密封盒組** → results clear, filter changes

### Create listing (single card)

1. Logged-in `member` or `merchant`
2. Select catalog card → choose grading (e.g. `PSA 10`)
3. Add **4–6** photos (multi-select OK) → previews show, no upload yet
4. Enter price → submit
5. **Progress overlay** — per-photo % then「寫入商品資料…」→ success → auto-close
6. Success toast; row in Supabase `listings` + `listing_stats`; images on Bunny CDN
7. `/marketplace` shows product after refresh (if other listings exist for search)

### Validation

- Submit without catalog pick → error toast
- Submit with &lt; 4 photos → error toast
- Description &gt; 500 chars → blocked by `maxLength`
- Submit while logged out → overlay error / `請先登入後再上架商品`
- Failed upload or DB insert → overlay error (no second toast)

## Do not edit (backend track)

- `app/actions/productCatalog.ts`
- `app/actions/listings.ts`
- `app/api/listings/upload-image/route.ts`
- `lib/storage/bunny.ts`
- `lib/listings/*` (except overlay styling in `ListingSubmitOverlay.tsx`)
- `lib/grading/options.ts`
- `lib/supabase/server.ts`, `lib/supabase/admin.ts`
- `supabase/migrations/*` (coordinate with backend dev)

## Related flows

- Marketplace browse of new listings → [marketplace-search](../marketplace-search/frontend.md)
- Box/set listing + hobby collection → not wired yet
