# Product Catalog Search — Backend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** ✅ Wired (functional baseline in `AddAssetModal.tsx`)
- **Partner:** Polish UI only — see [frontend.md](./frontend.md)

## Files created / modified (backend track)

| File | Purpose |
|------|---------|
| `lib/supabase/server.ts` | Server-side Supabase client |
| `app/actions/productCatalog.ts` | `searchProductCatalog` server action |
| `app/lib/hooks/useProductCatalogSearch.ts` | Debounced client hook + cache |
| `supabase/migrations/20260702100000_product_catalog_public_read.sql` | Anon `SELECT` on `product_catalog` |
| `scripts/test-product-catalog-search.ts` | CLI smoke test (`bun run test:catalog-search`) |
| `next.config.ts` | `www.pokemon-card.com` image host allowlist |

## Action contract

```ts
import { searchProductCatalog } from "@/app/actions/productCatalog";

const result = await searchProductCatalog(query, itemType);
// itemType: "card" | "box_set"

// Success
{
  success: true,
  data: ProductCatalogSuggestion[],
  total: number,      // total DB matches for this query
  hasMore: boolean,   // true when total > 12
}

// Failure
{ success: false, error: string }
```

### `ProductCatalogSuggestion`

| Field | Source column | Notes |
|-------|---------------|-------|
| `id` | `product_catalog.id` | Use as `productId` on listing submit (future) |
| `name` | `name_zh ?? name_ja` | Display name in dropdown |
| `nameJa` | `name_ja` | |
| `nameEn` | `name_en` | Search only |
| `nameZh` | `name_zh` | |
| `setCode` | `set_code` | Auto-fills 擴充包系列 on select |
| `cardNumber` | `card_number` | Shown in metadata line |
| `displayId` | `display_id` | Shown in metadata line |
| `imageUrl` | `image_url` | `https://www.pokemon-card.com/...` |
| `type` | `type` | `single_card`, `booster_box`, etc. |
| `rarity` | `rarity` | **Raw DB value** (e.g. `Common`) — no locale conversion |
| `pokemonStage` | `pokemon_stage` | e.g. `たね`, `1 進化` |

## Search behaviour

### Columns searched (OR match, case-insensitive)

- `set_code`
- `name_ja`
- `name_en`
- `name_zh`
- `card_number`
- `display_id`

### Type filter (AND)

| `itemType` | `product_catalog.type` |
|------------|------------------------|
| `card` | `single_card` |
| `box_set` | `booster_box`, `gift_set`, `booster_pack`, `starter_deck` |

### Limits

- Min query length: **2** characters
- Max query length: **100** characters
- DB fetch: **50** rows → relevance-ranked → return top **12**
- Response includes `total` + `hasMore` when results are truncated

### Performance strategy

1. **One server action call per debounced keystroke** (not per character)
2. **350ms debounce** in `useProductCatalogSearch` (configurable)
3. **60s in-memory cache** per `(itemType, query)` on the client
4. **Stale request guard** — older responses are dropped if the user keeps typing
5. **Server-side relevance ranking** — exact `card_number` / `display_id` matches rank highest

### Future DB optimisation (not required for MVP)

If catalog grows large and search slows:

- `pg_trgm` GIN index on a generated `search_text` column, or
- Postgres `tsvector` full-text search column

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
```

Do **not** prefix the URL with `/rest/v1/`.  
Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` as `NEXT_PUBLIC_*`.

## How to verify

```bash
bun install
bun run test:catalog-search
```

Expected: row count > 0, sample searches return card rows.

Programmatic:

```ts
await searchProductCatalog("sv2a", "card");
// { success: true, data: [...], total: 400+, hasMore: true }
```

## Errors returned to UI

| Condition | `error` message |
|-----------|-----------------|
| Query &lt; 2 chars | `請輸入至少 2 個字元` |
| Supabase query error | `搜尋商品目錄時發生錯誤` |
| Client / env failure | `無法連線至商品目錄` |

Raw database errors are **not** leaked to the client.

## Do not change without backend sync

- `ProductCatalogSuggestion` shape
- Search column list / `itemType` → `type` mapping
- `success` / `error` envelope

UI styling in `AddAssetModal.tsx` is partner-owned.
