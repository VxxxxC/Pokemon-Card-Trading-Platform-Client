# Playwright E2E

End-to-end tests for:

1. **Merchant product detail** — `/marketplace/[id]/product/[productId]`
2. **Global Chat realtime** — dual-browser buyer/seller state machine (`GlobalChatConsole`)
3. **Marketplace search + make offer** — `/marketplace` keyword search → public product page → order book → `makeOffer`
4. **Member flows** — P2P trading closure, dashboard/rewards, collection/wishlist, auth redirect + settings, inventory smoke
5. **Public profile page** — `/profile/[id]` bootstrap, listings strip, reviews preview, rating navigation

Aligned with [`project-structure.md`](../project-structure.md) and Supabase types in [`types/supabase.md`](../../types/supabase.md).

## Prerequisites

1. Linked Supabase project with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env`
2. Chromium (installed once):

```bash
bunx playwright install chromium
```

3. Fixture seller + listing IDs (see below)
4. A **member** buyer account that does **not** own the fixture listing

## Environment variables

Add these to **`.env`** (`playwright.config.ts` loads `.env` / `.env.local` for the test runner; `bun run dev` uses the same files):

| Variable | Required for | Description |
|----------|--------------|-------------|
| `E2E_SELLER_ID` | Core happy-path tests | Seller `profiles.id` (UUID) |
| `E2E_SELLER_USERNAME` | Username route test (A2) | Same seller's `profiles.username` |
| `E2E_LISTING_ID` | Core happy-path tests | Active `listings.id` owned by seller |
| `E2E_LISTING_DISPLAY_ID` | Display ID route test (A3) | `product_catalog.display_id` for that listing (not used for marketplace search keyword) |
| `E2E_LISTING_PRODUCT_ID` | Product ID route test (A4) | `product_catalog.id` / `listings.product_id` |
| `E2E_BUYER_EMAIL` | Buyer auth setup | Member account email |
| `E2E_BUYER_PASSWORD` | Buyer auth setup | Member account password |
| `E2E_SELLER_EMAIL` | Seller auth setup (chat-realtime) | Same seller account as `E2E_SELLER_ID` |
| `E2E_SELLER_PASSWORD` | Seller auth setup (chat-realtime) | Seller login password |
| `SUPABASE_SERVICE_ROLE_KEY` | DB asserts + cleanup | Service role key for `e2e/fixtures/supabase-admin.ts` |
| `BUNNY_STORAGE_ZONE_NAME` | Merch listing E2E | `AddAssetModal` card photo upload |
| `BUNNY_STORAGE_ACCESS_KEY` | Merch listing E2E | Bunny storage API key |
| `BUNNY_CDN_HOSTNAME` | Merch listing E2E | CDN hostname for uploaded listing images |
| `E2E_INVALID_SELLER_ID` | Negative tests (B1) | Optional; defaults to `00000000-0000-0000-0000-000000000000` |
| `E2E_WRONG_SELLER_ID` | Cross-seller test (B3) | Another valid seller UUID who does **not** own `E2E_LISTING_ID` |

When required variables are missing, tests call `test.skip()` with a reason instead of failing the suite.

## How to collect fixture IDs

### From the UI

1. Start dev server: `bun run dev`
2. Open `/marketplace/{sellerUuid}` (storefront)
3. Click a grid card → URL becomes `/marketplace/{sellerId}/product/{listingId}`
4. Copy `sellerId` → `E2E_SELLER_ID`, `listingId` → `E2E_LISTING_ID`
5. Copy seller username from profile header → `E2E_SELLER_USERNAME`

### From Supabase

```sql
-- Active listing with catalog metadata
select
  l.id as listing_id,
  l.seller_id,
  p.username as seller_username,
  pc.id as product_id,
  pc.display_id
from listings l
join profiles p on p.id = l.seller_id
join product_catalog pc on pc.id = l.product_id
where l.status = 'active'
limit 5;
```

For `E2E_WRONG_SELLER_ID`, pick a different `profiles.id` that is not the listing owner.

## Route resolution (backend contract)

`[id]` resolves to `profiles.id` first, then `profiles.username` (case-insensitive `ilike`).

`[productId]` accepts:

1. `listings.id` (UUID) — must belong to the resolved seller
2. `product_catalog.display_id`
3. `product_catalog.id` — if multiple active listings exist for the same product, the **lowest price** listing is returned

See `lib/marketplace/load-seller-listing-detail.ts` and `getMarketplaceSellerListingDetail` in `app/actions/marketplace.ts`.

## Commands

```bash
# Run all E2E projects (setup → guest + buyer)
bun run test:e2e

# Interactive UI
bun run test:e2e:ui

# Headed browser
bun run test:e2e:headed

# Single project
bun run test:e2e -- --project=guest
bun run test:e2e -- --project=buyer
bun run test:e2e -- --project=seller
bun run test:e2e -- --project=chat-realtime
bun run test:e2e -- --project=member-trading
bun run test:e2e -- e2e/marketplace-search-offer.spec.ts --project=buyer
bun run test:e2e -- e2e/marketplace-search-offer.spec.ts --project=guest
bun run test:e2e -- e2e/member-trading-p2p.spec.ts --project=member-trading
bun run test:e2e -- e2e/member-dashboard.spec.ts --project=buyer
bun run test:e2e -- e2e/member-collection-wishlist.spec.ts --project=buyer
bun run test:e2e -- e2e/member-auth-settings.spec.ts --project=guest
bun run test:e2e -- e2e/member-auth-settings.spec.ts --project=buyer
bun run test:e2e -- e2e/member-inventory.spec.ts --project=seller
bun run test:e2e -- e2e/public-profile-page.spec.ts --project=guest
bun run test:e2e -- e2e/public-profile-page.spec.ts --project=buyer
```

`playwright.config.ts` starts `bun run dev` automatically unless a server is already running on `http://localhost:3000`.

**Important:** Use `http://localhost:3000` (not `127.0.0.1`) for Playwright `baseURL`. Next.js dev blocks HMR/client hydration from `127.0.0.1` by default, which breaks `BuyButton` click handlers in E2E.

## Projects

| Project | Auth | Purpose |
|---------|------|---------|
| `setup` | — | Runs `e2e/fixtures/auth.setup.ts`; writes `e2e/.auth/buyer.json` + `seller.json` |
| `guest` | None | Public marketplace flows + guest auth redirect |
| `buyer` | `e2e/.auth/buyer.json` | Logged-in buyer flows (depends on `setup`) |
| `seller` | `e2e/.auth/seller.json` | Seller inventory smoke (depends on `setup`) |
| `chat-realtime` | Dual context in spec | Buyer + seller realtime chat journey (depends on `setup`) |
| `member-trading` | P2P accept → trading → complete → review; auth escrow mock pay; order detail; filters; cancel; negotiation (depends on `setup`) |

`e2e/.auth/` is gitignored.

## CI note

GitHub Actions CI runs `build:ci` **without** Supabase env. E2E is **local-only** for now. To run in CI later, add staging secrets and a separate workflow job.

## Test file map

| File | Coverage |
|------|----------|
| `e2e/fixtures/test-data.ts` | Merchant detail env fixture readers + `test.skip()` helpers |
| `e2e/fixtures/chat-test-data.ts` | Global Chat env fixtures + `hasChatRealtimeFixtures()` |
| `e2e/fixtures/supabase-admin.ts` | Service-role DB audit helpers (test-only) |
| `e2e/helpers/collection-asset.ts` | Collection page + `AddAssetModal` UI steps (catalog search, photo upload) |
| `e2e/fixtures/listing-photo.png` | Minimal PNG for merch listing photo slots |
| `e2e/merchant-product-detail.spec.ts` | Route resolution, negatives, UI, BuyButton |
| `e2e/global-chat-realtime.spec.ts` | AML filter, OfferCard realtime, accept-offer sync |
| `e2e/marketplace-search-offer.spec.ts` | Marketplace keyword search, grid price, product page navigation, slide-over offer |
| `e2e/member-trading-p2p.spec.ts` | P2P offer accept → `member_orders` → trading list → complete → review |
| `e2e/member-auth-escrow.spec.ts` | Auth offer → accept → mock pay → dev one-click complete (`member-trading`) |
| `e2e/member-order-detail-p2p.spec.ts` | P2P order detail handover CTA + 返回交易管理 |
| `e2e/member-order-detail-auth.spec.ts` | Auth mock pay panel + seller inbound form (when DB grant allows) |
| `e2e/member-trading-filters.spec.ts` | Trading status/persona tabs + search (`buyer` shell / `member-trading` data) |
| `e2e/member-dashboard.spec.ts` | Overview, daily check-in, rewards coupon tabs |
| `e2e/member-collection-wishlist.spec.ts` | Wishlist star/remove/sort + hobby 收錄 + merch 上架 + post-listing collection prompt |
| `e2e/member-collection-operations.spec.ts` | Collection filter chips + grade update + remove + sell prefill + sold filter (seed) |
| `e2e/member-trading-smoke.spec.ts` | Trading list smoke (buyer/seller) + cancel pending P2P order (`member-trading`) |
| `e2e/member-offer-negotiation.spec.ts` | Seller reject offer + buyer modify offer (`member-trading`) |
| `e2e/helpers/member-trading.ts` | Shared chat/trading steps (offer submit, accept, trading page) |
| `e2e/member-auth-settings.spec.ts` | Guest auth redirect + profile settings save |
| `e2e/member-inventory.spec.ts` | Seller inventory accordion smoke |
| `e2e/public-profile-page.spec.ts` | Public profile bootstrap, listings/reviews CTAs, rating navigation, 404 |

## Marketplace search + make offer (`guest` / `buyer`)

Keyword search on `/marketplace` → verify grid `lowestPrice` → click card link to `/marketplace/product/[productId]` → order book seller row → `ExecutionSlideOver` → `發送叫價至聊天室` → assert `offers.status = pending`.

### Required env

| Variable | Notes |
|----------|-------|
| `E2E_SELLER_ID` / `E2E_LISTING_ID` | Active listing owned by seller |
| `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` | Buyer project only (`setup` auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | `getListingMarketplaceFixture` + offer DB assert |

`getListingMarketplaceFixture` picks `searchKeyword` from catalog **name_zh → name_ja → name_en → display_id → card_number** (names before codes, because codes like `DP4-42` can match unrelated products).

Offer amount is hard-coded to **HK$299** to satisfy AML caps for accounts younger than 14 days.

### Projects

| Project | Coverage |
|---------|----------|
| `guest` | Search → grid price → public product page (no offer / no guest lock) |
| `buyer` | Full 9-step serial funnel ending in pending `offers` row |

### DB helper

| Function | Purpose |
|----------|---------|
| `getListingMarketplaceFixture(listingId)` | Join listing + catalog + seller; returns `searchKeyword`, `lowestPrice`, `listingPrice`, etc. |
| `resolveE2eMarketplaceFixture()` | Uses `E2E_LISTING_ID`; if that listing is `sold`, falls back to any **active** listing for `E2E_SELLER_ID` |

### Known limitations (documented, not auto-fixed in E2E)

- Grid `BuyButton` maps `listing.id` to `productId` in `MarketplacePageClient.toMarketplaceListing` — spec clicks the **card link**, not grid `BuyButton`.
- `/checkout/[id]` is **not** wired from slide-over; terminal step is `makeOffer` only.

## Global Chat realtime (`chat-realtime` project)

Dual-browser Playwright journey: buyer and seller each get an isolated `BrowserContext` (`e2e/.auth/buyer.json` / `seller.json`). Tests use `SUPABASE_SERVICE_ROLE_KEY` to assert `chat_messages.is_system_warning` and `offers.status` without modifying app source.

### Required env (in addition to merchant fixtures)

| Variable | Notes |
|----------|-------|
| `E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD` | Must match `E2E_SELLER_ID` (listing owner) |
| `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` | Must **not** own `E2E_LISTING_ID` |
| `SUPABASE_SERVICE_ROLE_KEY` | Local `.env` only — never commit |

### Journey overview

1. **AML** — buyer sends sensitive text; assert `is_system_warning` + realtime UI on both sides
2. **Offer** — buyer submits HK$4,500 via execution slide-over; seller sees `OfferCard` without reload
3. **Accept** — seller accepts; assert `offers.status = accepted` + buyer UI shows accepted/Hold state

### DB helpers (`e2e/fixtures/supabase-admin.ts`)

| Function | Purpose |
|----------|---------|
| `ensureDbChatRoom(buyerId, sellerId)` | Find or insert user-centric `chat_rooms` row |
| `getLatestChatMessage(roomId, contentContains?)` | Poll `chat_messages` for AML audit |
| `getOfferStatus(offerId)` | Assert offer state machine |
| `getProfileIdByEmail(email)` | Resolve buyer UUID from `E2E_BUYER_EMAIL` |
| `getListingMarketplaceFixture(listingId)` | Marketplace search/order-book fixture metadata |

When `hasChatRealtimeFixtures()` is false, the spec calls `test.skip()`.

## Member flows (`buyer` / `seller` / `member-trading`)

Member E2E covers dashboard, rewards, collection/wishlist, auth redirect, settings, inventory smoke, **P2P trading closure**, and **auth escrow mock payment** (dev one-click completion).

### P2P vs auth escrow

| Path | `use_authentication` | Payment | Completion |
|------|---------------------|---------|------------|
| P2P | `false` | None (面交) | Buyer「確認完成交易」 |
| Auth escrow | `true` | Mock pay panel (dev) | Dev「一鍵跑完 Mock 全流程」 |

P2P specs call `guardP2pMemberOrder()` and skip when an auth order is detected. Auth specs call `guardAuthMemberOrder()` and require listing `use_authentication = true`.

### Auth escrow closure (`member-trading` project)

Dual-browser serial journey (`e2e/member-auth-escrow.spec.ts`):

1. Buyer submits offer with **鑑定加購** ON
2. Seller accepts in Global Chat
3. Buyer trading list → **待付款** + **前往付款**
4. Order detail → mock pay panel → **確認模擬付款** (trigger fixed in `20260709210000_member_orders_e2e_grants_auth_trigger.sql`)
5. Dev panel → **一鍵跑完 Mock 全流程** → completed

```bash
bun run test:e2e -- e2e/member-auth-escrow.spec.ts --project=member-trading
```

### P2P trading closure (`member-trading` project)

Dual-browser serial journey (`e2e/member-trading-p2p.spec.ts`):

1. Buyer submits offer with authentication **off** (dynamic amount from `E2E_LISTING_ID` price)
2. Seller accepts in Global Chat
3. DB assert `member_orders` row (`use_authentication = false`)
4. Buyer `/profile/user/trading` → order detail (no「前往付款」)
5. Buyer completes handover (3 checkboxes) → `ReviewModal` → `transaction_reviews`

```bash
bun run test:e2e -- e2e/member-trading-p2p.spec.ts --project=member-trading
```

Uses `hasMemberTradingFixtures()` (alias of `hasChatRealtimeFixtures()`).

### Member DB helpers (`e2e/fixtures/supabase-admin.ts`)

| Function | Purpose |
|----------|---------|
| `getLatestMemberOrderForListing({ listingId, buyerId })` | Poll newest `member_orders` row (returns `null` if service role lacks table grant) |
| `getMemberOrderById(orderId)` | Read order status / escrow fields |
| `guardP2pMemberOrder(order)` | Skip auth escrow (`use_authentication`) orders |
| `guardAuthMemberOrder(order)` | Skip non-auth orders in escrow specs |
| `getListingAcceptsAuthentication(listingId)` | Skip auth specs when listing disallows add-on |
| `getReviewForMemberOrder({ memberOrderId, reviewerId })` | Assert `transaction_reviews` when grants exist |
| `getGamificationStatsForProfile(profileId)` | Optional check-in poll (requires table grant) |
| `countProductWatchlistsForUser(userId, productId)` | Optional wishlist DB assert |
| `getBuyerProfileIdFromEnv()` | Resolve buyer `profiles.id` from `E2E_BUYER_EMAIL` |
| `deleteProductWatchlistsForUser` / `deleteUserCollectionsForUserProduct` | E2E cleanup |
| `countUserCollectionsForUserProduct` / `countActiveListingsForSellerProduct` | Holdings / inventory DB asserts |
| `getLatestUserCollectionId` / `getListingSourceCollectionId` / `getListingStatus` | Collection sell + trading fixture guards |
| `deactivateActiveListingsForSellerProduct` | Cleanup buyer orphan listings before sell-prefill test |
| `resetE2eListingTradingFixture({ listingId, buyerId, sellerId })` | Cancel pending `member_orders` + non-terminal `offers` on fixture listing; re-activate listing (`rpc_e2e_reset_listing_trading_fixture` with RPC fallback) |
| `markUserCollectionAsSold` | Seed **已售出** filter (skips when service role lacks grant) |
| `getLatestActiveListingForSellerProduct` / `setListingStatusInactive` | Merch listing cleanup |

When `member_orders` / `transaction_reviews` return permission denied for the service role, `member-trading-p2p` falls back to **UI assertions** (trading list, handover dialog, review toast).

### Dashboard + rewards (`buyer`)

`e2e/member-dashboard.spec.ts` — overview shell, `CheckInCard` (skips repeat check-in if already signed today), rewards coupon tab navigation.

### Collection + wishlist + AddAsset (`buyer`)

`e2e/member-collection-wishlist.spec.ts` — `/profile/user/collection` + [`AddAssetModal`](../app/components/shared/AddAssetModal.tsx):

| Test | Coverage |
|------|----------|
| Star → collection wishlist | Marketplace grid star → wishlist table row |
| Page smoke | Holdings + wishlist sections + **收錄新卡** |
| Wishlist sort chips | **卡名 A→Z** / **最新加入** toggle smoke |
| Wishlist remove | `⋯` → **從願望清單移除** + DB `product_watchlists` count |
| Hobby 收錄 | **收錄新卡** → catalog search → **★ 收錄至私藏愛好** → holdings row |
| Merch 上架 (serial) | TopNav **新增商品** → 4 photos → listing toast → **是否一併加入收藏庫？** |
| Merch skip prompt | **略過** → collection count unchanged; active listing created |
| Merch accept prompt | **加入收藏庫** → holdings row + listing cleanup |

**Merch tests** require Bunny env (`hasBunnyStorageFixtures()`); otherwise skipped. Uses `e2e/fixtures/listing-photo.png` for 4-slot upload.

**Manual verify:**

1. Wishlist: star on marketplace → collection **追蹤願望清單** → remove via `⋯`
2. Hobby: **收錄新卡** → search → 入手成本 → row in **我的持有卡牌庫**
3. Merch: TopNav **新增商品** → photos + price → post-listing dialog **略過** or **加入收藏庫**

```bash
bun run test:e2e -- e2e/member-collection-wishlist.spec.ts --project=buyer
```

### Collection operations (`buyer`)

`e2e/member-collection-operations.spec.ts` — extends collection coverage:

| Test | Coverage |
|------|----------|
| Filter chips | 全部 / 已鑑定 / 未鑑定 / 已上架 / 已售出 smoke |
| Grade update | Dropdown → 裸卡 A + **未鑑定** filter |
| Remove holding | `⋯` → **移除出資產庫** |
| Sell prefill | `⋯` → **出售收藏品** → Bunny upload → **已上架** filter + optional `source_collection_id` |
| Sold filter | Service-role `sold_at` seed (skips if `user_collections` grant missing) |

Uses unique purchase prices per run to target the correct holdings row when duplicate products exist.

```bash
bun run test:e2e -- e2e/member-collection-operations.spec.ts --project=buyer
```

### Trading smoke + cancel (`buyer` / `seller` / `member-trading`)

`e2e/member-trading-smoke.spec.ts`:

| Project | Test |
|---------|------|
| `buyer` | `/profile/user/trading` shell |
| `seller` | Trading shell + **賣單** tab |
| `member-trading` | Seller cancels pending P2P order from trading list |

Requires **`E2E_LISTING_ID` → `active`** seller listing (skips when listing is `sold` / `hold` / etc.). Dual-browser trading specs call `resetE2eListingTradingFixture()` before each offer flow so auth/P2P runs do not collide on the same listing.

### Fixture cleanup (`member-trading`)

Before each offer accept / negotiation / cancel flow, helpers call `resetE2eListingTradingFixture()` which:

1. Cancels pending `member_orders` for `E2E_LISTING_ID` + buyer
2. Marks non-terminal `offers` (`pending` / `accepted`) as `cancelled`
3. Sets listing back to `active`

Requires migration `20260709200000_rpc_e2e_reset_listing_trading_fixture.sql` (`bunx supabase db push`). Falls back to `rpc_reject_offer` + `rpc_cancel_member_order` when RPC is not deployed.

### Offer negotiation (`member-trading`)

`e2e/member-offer-negotiation.spec.ts` (serial):

1. Seller **拒絕出價** → `offers.status = rejected` + buyer sees **● 已拒絕**
2. Buyer **修改出價** HK$299 → HK$288 → seller sees updated `OfferCard`

```bash
bun run test:e2e -- e2e/member-offer-negotiation.spec.ts --project=member-trading
```

### Order detail CTAs (`member-trading`)

`e2e/member-order-detail-p2p.spec.ts` — P2P handover CTA, no mock pay; **返回交易管理** link.

`e2e/member-order-detail-auth.spec.ts` — auth order at payment → mock pay panel visible; seller inbound form when service role can seed custody.

### Trading filters (`buyer` / `member-trading`)

`e2e/member-trading-filters.spec.ts`:

| Project | Test |
|---------|------|
| `buyer` | Status tabs (全部/待處理/已完成/已取消), persona tabs (買單/賣單), `#user-order-search` |
| `member-trading` | Pending P2P order under 待處理 + 買單; search by order number |

### Auth + settings (`guest` / `buyer`)

`e2e/member-auth-settings.spec.ts` — guest BuyButton lock → `/auth?redirect=` → manual login → return; buyer settings `displayName` / `shortDescription` save.

### Inventory smoke (`seller`)

`e2e/member-inventory.spec.ts` — `/profile/user/inventory` accordion loads (`#listings-heading`).

### Public profile page (`guest` / `buyer`)

`e2e/public-profile-page.spec.ts` — `/profile/[id]` SSR bootstrap shell (header metrics, listings strip, reviews preview), username route, invalid profile `not-found`, listing card → merchant product detail, 「查看更多評價」→ rating page with `?persona=`.

Uses `E2E_SELLER_ID` / `E2E_SELLER_USERNAME` / `E2E_LISTING_ID` (same fixtures as merchant detail).

## Troubleshooting

| Symptom | Likely cause |
|---------|----------------|
| All tests skipped | `E2E_SELLER_ID` / `E2E_LISTING_ID` not set in `.env` |
| Setup skipped, buyer tests fail auth | `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` missing or wrong |
| Chat-realtime skipped | Missing seller creds, `SUPABASE_SERVICE_ROLE_KEY`, or core listing fixtures |
| Login timeout in setup | Supabase env unset or invalid credentials |
| 404 on happy path | Listing inactive, wrong seller, or ID mismatch |
