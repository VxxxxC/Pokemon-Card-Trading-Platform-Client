# Product Catalog Search — Frontend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ **Baseline wired** — search works in `AddAssetModal.tsx`
- **Your focus:** Visual polish & UX refinements (not backend wiring)

## What is already done

| Feature | Location |
|---------|----------|
| Debounced typeahead (350ms, min 2 chars) | `useProductCatalogSearch` hook |
| 搜尋 button (immediate search) | `AddAssetModal.tsx` |
| Suggestions dropdown | `AddAssetModal.tsx` ~L395–450 |
| Select → auto-fill name + `set` (擴充包系列) | `handleSelectCatalogSuggestion` |
| Submit payload uses `selected.id`, `displayId`, `cardNumber` | `handleSubmit` |
| Truncation footer (`顯示最相關的 N 筆，共 X 筆符合`) | When `hasMore` is true |
| Card thumbnails | Native `<img>` 56×72px from `imageUrl` |

## UI touchpoint

`app/components/shared/AddAssetModal.tsx`

- Search input + dropdown: ~**L375–450**
- Hook init: ~**L50–54**
- Select handler: ~**L228–233**

## Dropdown layout (current)

```
[thumbnail 56×72]  {name}           ← name_zh ?? name_ja
                 {display_id · rarity · pokemon_stage · card_number}
```

- **Rarity:** raw DB English (e.g. `Common`) — do not localize unless product asks
- **Images:** `www.pokemon-card.com` — allowed in `next.config.ts`

## Hook API (already integrated)

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
  selected,
  selectSuggestion,
  searchNow,
  clearSearch,
} = catalogSearch;
```

## Optional polish (partner backlog)

- [ ] Close dropdown on click outside
- [ ] Keyboard navigation (↑↓ Enter to select)
- [ ] Highlight matched substring in results
- [ ] Empty state copy when `total === 0`
- [x] ~~Reuse same search pattern in `HeroSearch.tsx`~~ — **done via marketplace RPC** (`useHeroMarketplaceSearch`); see [marketplace-search frontend](./marketplace-search/frontend.md#homepage-hero-appcomponentshomeherosearchtsx)
- [ ] Style pass: spacing, hover, mobile scroll

## Acceptance test

1. `bun run dev` — ensure `.env` is set and migration applied
2. Open **新增商品** modal (logged-in, merch mode)
3. Type `sv2a` → after ~350ms, dropdown with card images + metadata
4. Metadata shows: `SV2A-3 · Common · 2 進化 · 003/165` (example)
5. Pick a row → input + 擴充包系列 auto-fill, dropdown closes
6. Broad query (e.g. `ピカ`) → footer shows total count + refine hint
7. Toggle **卡牌** / **密封盒組** → results clear, filter changes

## Do not edit (backend track)

- `app/actions/productCatalog.ts`
- `lib/supabase/server.ts`
- `supabase/migrations/*` (coordinate with backend dev)

## Related next flow

**Create listing submit** — wire `handleSubmit` to a `createListing` server action (not started).  
Selected catalog `id` should become `product_id` FK on `listings` when that flow is built.
