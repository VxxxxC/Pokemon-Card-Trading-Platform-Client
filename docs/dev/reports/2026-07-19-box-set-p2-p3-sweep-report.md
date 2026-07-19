# Box/Set P2 & P3 Sweep — Implementation Report

**Date:** 2026-07-19  
**Scope:** Marketplace sealed box/set filters, wishlist grade guards, legacy data normalize, product-detail wishlist, WishlistTable box-aware UI, `/search` redirect, quick category pills, CardItem wishlist stub  
**Status:** Code complete — apply migrations with `bunx supabase db push`

---

## Executive summary

Third-pass Box/Set audit items (P2 + P3) are shipped in a single sweep. Sealed products now use consistent grade semantics (`OTHER` + `SEALED`/`UNSEALED`), marketplace filters no longer OR-match incompatible card vs seal grades, wishlist mutations guard against catalog-type mismatches, and remaining UI surfaces (product detail, wishlist table, home CardGrid, `/search`) are wired to the live marketplace.

---

## Database migrations

Apply on target environment:

| Migration | Purpose |
|-----------|---------|
| `20260719120000_marketplace_catalog_type_filter.sql` | `search_marketplace_products` accepts `p_catalog_types` (`single_card` / sealed types) |
| `20260719130000_marketplace_sealed_grade_filters.sql` | Grade facet supports `sealed:SEALED` / `sealed:UNSEALED` in marketplace RPC |
| `20260719140000_wishlist_legacy_grade_cleanup.sql` | Optional one-time cleanup: legacy `grading_company = '密封'` / `SEALED` → `OTHER` + `SEALED` |

```bash
bunx supabase db push
bun run supabase:types
```

---

## P2 — Backend & filters

### Grade filter mutex (card ↔ seal)

| File | Change |
|------|--------|
| `lib/marketplace/grade-filter-compat.ts` | `pruneIncompatibleGradeKeys`, `pruneGradesForProductKinds` |
| `app/store/useMarketStore.ts` | `toggleGrade` / `toggleProductKind` prune before set |
| `lib/marketplace/filter-options.ts` | Seal-state keys + product-kind facet wiring |

When user toggles PSA then「密封」, the prior card grade keys are removed (and vice versa). When only `sealed_product` is selected, card grade keys are stripped from `activeGrades`.

### Legacy wishlist normalize

| File | Change |
|------|--------|
| `lib/wishlist/grading.ts` | `coerceLegacyWishlistGrading` — `密封` → `OTHER`+`SEALED`, `已開封` → `OTHER`+`UNSEALED`, legacy `company=SEALED` normalized |
| `app/actions/wishlist.ts` | Entries + favored keys use coerced grades; `toggleWishlist` / `updateWishlistGrade` catalog-type guards |

### `toggleWishlist` catalog guard

After `normalizeWishlistGrading`:

- Sealed catalog + card grade → `{ success: false, error: "盒組商品請選擇密封狀態" }`
- Single-card catalog + seal grade → `{ success: false, error: "單卡商品無法使用盒組狀態" }`

Aligned with existing `updateWishlistGrade` sealed guard.

---

## P3 — UX surfaces

### Product detail wishlist

| File | Change |
|------|--------|
| `lib/wishlist/product-detail-grade.ts` | `resolveProductDetailWishlistGrade(product, selectedGradeFilterId, lowestListing?)` |
| `app/marketplace/product/[id]/ProductDetailPageData.tsx` | SSR `getWishlistFavoredKeysForUser` → `initialFavoredKeys` |
| `app/marketplace/product/[id]/ProductDetailClient.tsx` | Hero `WishlistButton` with resolved grade + `trackedPrice` |

### WishlistTable box-aware

| File | Change |
|------|--------|
| `app/components/market/WishlistTable.tsx` | Header「商品資料」; sealed subtitle /「盒組」badge; empty trend →「暫無參考市價」 |

### `/search` + quick category pills

| File | Change |
|------|--------|
| `app/search/page.tsx` | `redirect("/marketplace")` (metadata retained) |
| `lib/marketplace/quick-categories.ts` | Category definitions (`sealed` → `kind=sealed_product`, rarity chips) |
| `app/components/marketplace/MarketplaceQuickCategoryPills.tsx` | Client pill row |
| `app/marketplace/MarketplacePageClient.tsx` | `?kind=` URL sync; pills below search |
| `app/components/marketplace/MarketplaceHeader.tsx` | Pills link to `/marketplace?...` |

### CardItem wishlist stub

| File | Change |
|------|--------|
| `app/components/cards/CardItem.tsx` | `CardData.gradingCompany?` / `gradingScore?`; `WishlistButton` uses `productId` + raw grade |
| `app/components/cards/CardGrid.tsx` | Mock maps `grade.authority` / `grade.score` into wishlist props |

---

## Related P1/P2 fixes (same branch)

Included in this commit for Box/Set end-to-end:

- `MarketplaceCard` / `NewArrivals` wishlist raw grades from listing row
- `lib/marketplace/market-price.ts` sealed keys in `matchGradeOptionIdFromMarketPriceRow`
- `AccordionFilters` partial mutex (show card grades vs seal state by product kind)
- `ExecutionSlideOver` hides auth block for sealed listings
- `MerchantProductDetailPageClient` box-aware specs + grade label
- Sealed listing + collection flows (`createSealedListing`, `lib/catalog/item-kind.ts`, etc.)

---

## Verification checklist

```bash
bunx tsc --noEmit
bun run lint
bun run build:ci
```

Manual:

- [ ] Marketplace: select single_card + sealed_product, toggle PSA then「密封」→ earlier grade cleared
- [ ] Legacy wishlist row with `密封` displays correctly; star state matches after refresh
- [ ] API: `toggleWishlist` on box_set with PSA grade → rejected
- [ ] Product detail: star works; state persists after refresh
- [ ] Wishlist table: sealed rows show「盒組」; trend shows「暫無參考市價」 when no SNKRDUNK data
- [ ] `/search` → `/marketplace`; `/marketplace?kind=sealed_product` shows sealed only
- [ ] Home CardGrid star uses correct PSA grade (not default RAW)

---

## Out of scope (deferred)

- SNKRDUNK sealed market price ingest
- `NewListingForm` single-card mock listing (Phase 1.5)
- Storefront `activeProductKinds` (seller RPC limitation)
- Wishlist Phase 3 OneSignal alerts

---

## Handoff links

- [INTEGRATION_QUEUE.md](../INTEGRATION_QUEUE.md)
- [wishlist backend](../follow-up/wishlist/backend.md) · [frontend](../follow-up/wishlist/frontend.md)
- [marketplace-search backend](../follow-up/marketplace-search/backend.md)
- [product-catalog-search backend](../follow-up/product-catalog-search/backend.md)
- [user-collection backend](../follow-up/user-collection/backend.md)
