# Product Catalog Search + Create Listing — Backend Handoff

## Status

- **Catalog search:** ✅ Ready
- **Create listing (single card, merch mode):** ✅ Ready
- **Frontend:** ✅ Wired (functional baseline in `AddAssetModal.tsx`)
- **Partner:** Polish UI only — see [frontend.md](./frontend.md)

## Files created / modified (backend track)

### Catalog search

| File | Purpose |
|------|---------|
| `lib/supabase/server.ts` | Server-side Supabase client |
| `app/actions/productCatalog.ts` | `searchProductCatalog` server action |
| `app/lib/hooks/useProductCatalogSearch.ts` | Debounced client hook + cache |
| `supabase/migrations/20260702100000_product_catalog_public_read.sql` | Anon `SELECT` on `product_catalog` |
| `scripts/test-product-catalog-search.ts` | CLI smoke test (`bun run test:catalog-search`) |
| `next.config.ts` | `www.pokemon-card.com` image host allowlist |

### Create listing (single card)

| File | Purpose |
|------|---------|
| `app/actions/listings.ts` | `createCardListing` server action (DB insert after auth verify) |
| `app/api/listings/upload-image/route.ts` | Authenticated per-image upload proxy → Bunny (client progress) |
| `lib/storage/bunny.ts` | Bunny.net Storage upload + rollback delete |
| `lib/listings/images.ts` | `ListingImage` type (`{ url, order }`), min/max counts |
| `lib/listings/image-files.ts` | FormData blob parsing, MIME/extension resolution (incl. HEIC) |
| `lib/listings/validation.ts` | Field + image file validation |
| `lib/listings/errors.ts` | Maps Postgres errors to user-facing messages |
| `lib/listings/client-upload.ts` | Client XHR upload helper with `onprogress` |
| `lib/listings/submit-card-listing.ts` | Client orchestration: upload images → `createCardListing` |
| `lib/grading/options.ts` | Grading companies, scores, raw conditions, unified dropdown options |
| `lib/supabase/admin.ts` | `service_role` client for trusted listing insert |
| `middleware.ts` | Session refresh on **all** routes (server actions from any page) |
| `supabase/migrations/20260703130000_listings_owner_insert.sql` | `INSERT`/`UPDATE`/`SELECT own` RLS on `listings` |
| `supabase/migrations/20260703140000_listings_owner_insert_simplify.sql` | Insert policy: `seller_id = auth.uid()` only |
| `supabase/migrations/20260703150000_listings_service_role_grants.sql` | `GRANT` on `listings` to `service_role` |
| `supabase/migrations/20260703160000_listing_stats_service_role_grants.sql` | `GRANT` on `listing_stats` to `service_role` (post-insert trigger) |

## Action contracts

### `searchProductCatalog`

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

### `createCardListing`

```ts
import { createCardListing } from "@/app/actions/listings";

// Preferred path (wired in UI): client uploads images first, then finalize DB row
formData.append("productId", selectedCatalogId);
formData.append("gradingOptionId", gradingOptionId);
formData.append("price", String(priceHkd));
formData.append("sellerDescription", description); // optional, max 500 chars
formData.append(
  "uploadedImages",
  JSON.stringify([
    { url: cdnUrl, order: 1, objectKey: bunnyObjectKey },
    // … 4–6 items
  ]),
);

// Legacy path (still supported): raw files in FormData
for (const file of imageFiles) {
  formData.append("images", file);
}

const result = await createCardListing(formData);

// Success
{ success: true, data: { listingId: string, images: ListingImage[] } }

// Failure
{ success: false, error: string }
```

### `POST /api/listings/upload-image`

Authenticated route handler. One image per request (`FormData` field `image`).

```ts
// Success
{ success: true, data: { objectKey: string, cdnUrl: string } }

// Failure
{ success: false, error: string }  // 401 / 400 / 500
```

Used by `lib/listings/client-upload.ts` (`uploadListingImageWithProgress`) for real upload progress in the browser.

**Server flow (`createCardListing`, order matters):**

1. Validate fields + image count (files **or** `uploadedImages` JSON)
2. Auth user + profile + catalog `product_id` exists (`createClient` + `getUser`)
3. Fail fast if Bunny env missing (when uploading files server-side)
4. If `uploadedImages` present → use CDN URLs; else upload files to Bunny on server
5. `INSERT` into `listings` via **`createAdminClient()`** with `seller_id = user.id` (never from client)
6. DB trigger `trigger_init_listing_stats` inserts `listing_stats` row
7. On DB failure or thrown error → **delete uploaded Bunny objects** (best-effort rollback)
8. `revalidatePath("/marketplace")`

### `ProductCatalogSuggestion`

| Field | Source column | Notes |
|-------|---------------|-------|
| `id` | `product_catalog.id` | **`product_id` FK on `listings`** |
| `name` | `name_zh ?? name_ja` | Display name in dropdown + selected card panel |
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

### `listings` row written on submit

| Form / lib field | DB column | Notes |
|------------------|-----------|-------|
| `productId` | `product_id` | FK → `product_catalog.id` |
| `gradingOptionId` → `gradingOptionToFields()` | `grading_company`, `grading_score` | e.g. `PSA` + `10`; `RAW` + `null` |
| `price` | `price` | HKD numeric |
| `sellerDescription` | `seller_description` | Optional, ≤ 500 chars |
| uploaded CDN URLs | `images` | JSONB `[{ "url": "…", "order": 1 }, …]` |
| auth user id | `seller_id` | |
| profile role | `seller_persona` | `merchant` or `member` |
| — | `status` | Always `active` on create |
| — | `use_authentication` | `false` |

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

### Listing images

- Min: **4**, max: **6**
- Types: `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`
- Max size per file: **10 MB**
- Upload path: `listings/{sellerId}/{uuid}.{ext}` on Bunny Storage → CDN URL on pull zone
- Client upload: `POST /api/listings/upload-image` (one file per request, progress via XHR)

## Env required

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>   # listing insert via admin client

# Server-only (Bunny image storage)
BUNNY_STORAGE_ZONE_NAME=<zone>
BUNNY_STORAGE_ACCESS_KEY=<access-key>
BUNNY_CDN_HOSTNAME=<pull-zone>.b-cdn.net
BUNNY_STORAGE_REGION=sg   # optional
```

Do **not** prefix the Supabase URL with `/rest/v1/`.  
Do **not** expose `SUPABASE_SERVICE_ROLE_KEY` or `BUNNY_STORAGE_ACCESS_KEY` as `NEXT_PUBLIC_*`.

## Migrations required

```bash
bunx supabase db push
```

Includes at minimum:

- `20260702100000_product_catalog_public_read.sql`
- `20260702120000_marketplace_search_rpc.sql` — public read active listings
- `20260703130000_listings_owner_insert.sql` — seller RLS on `listings`
- `20260703140000_listings_owner_insert_simplify.sql`
- `20260703150000_listings_service_role_grants.sql` — **required** for admin insert
- `20260703160000_listing_stats_service_role_grants.sql` — **required** (`trigger_init_listing_stats`)

## How to verify

### Catalog search

```bash
bun install
bun run test:catalog-search
```

```ts
await searchProductCatalog("sv2a", "card");
// { success: true, data: [...], total: 400+, hasMore: true }
```

### Create listing (manual)

1. Log in as `member` or `merchant`
2. Open **新增商品** → pick a catalog card → set grading + price
3. Add 4–6 photos → submit (progress overlay shows per-image upload)
4. Confirm row in `listings` with `status = 'active'` and `images` JSONB
5. Confirm `listing_stats` row for same `listing_id` (DB trigger)
6. Confirm images on Bunny CDN + visible on `/marketplace` after revalidate

### Permission / RLS notes (resolved)

- Listing insert uses `service_role` after `getUser()` — avoids stale JWT on server actions from non-`/profile` pages
- `middleware.ts` refreshes Supabase session on all page navigations (not only `/profile` / `/admin`)
- Missing grants on `listings` or `listing_stats` for `service_role` → Postgres `42501` (see migrations above)

### RLS note

- `listings_public_read_active` — `anon` + `authenticated` see `status = 'active'` (marketplace)
- `listings_owner_read_own` — **additive**; sellers also see their own non-active rows
- Public marketplace browse is **not** restricted by the owner-read policy

## Errors returned to UI

| Condition | `error` message |
|-----------|-----------------|
| Query &lt; 2 chars | `請輸入至少 2 個字元` |
| Not logged in | `請先登入後再上架商品` |
| No catalog pick | `請從搜尋結果中選擇一張卡牌` |
| &lt; 4 images | `必須上載至少 4 張卡牌相片（正面與背面）` |
| Bunny not configured | `圖片儲存服務尚未設定，請稍後再試` |
| RLS / permission (`42501`) | `沒有上架權限，請確認已登入且帳戶可上架商品` |
| Supabase query error (search) | `搜尋商品目錄時發生錯誤` |
| Generic insert failure | `商品上架失敗，請稍後再試` |

Raw database errors are **not** leaked to the client (logged server-side).

## Do not change without backend sync

- `ProductCatalogSuggestion` shape
- Search column list / `itemType` → `type` mapping
- `createCardListing` FormData field names (`productId`, `gradingOptionId`, `price`, `sellerDescription`, `uploadedImages` | `images`)
- `ListingImage` JSON shape (`url` + `order`)
- `lib/grading/options.ts` option `id` format
- `success` / `error` envelope

UI styling in `AddAssetModal.tsx` is partner-owned.

## Out of scope (not built yet)

- Box/set listing submit (still mock event in modal)
- Hobby / `user_collections` write
- Edit listing (`mode: "edit"` overlay + action planned; helper accepts `mode` already)
- Presigned direct browser → Bunny upload (current flow uses authenticated API proxy)
