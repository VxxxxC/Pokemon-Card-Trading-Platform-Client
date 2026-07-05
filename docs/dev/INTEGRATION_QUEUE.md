# Integration Queue

> Single dashboard for backend ↔ frontend handoffs.  
> Update a row when backend is ready or frontend is wired.

| Flow | Backend | Frontend | Backend files | UI touchpoint | Follow-up |
|------|---------|----------|---------------|---------------|-----------|
| Product catalog search + create listing (single card) | ✅ Ready | ✅ Wired (baseline) | `app/actions/productCatalog.ts`, `app/actions/listings.ts`, `app/api/listings/upload-image/route.ts`, `app/lib/hooks/useProductCatalogSearch.ts`, `app/store/useListingSubmitStore.ts`, `components/listings/ListingSubmitOverlay.tsx`, `lib/listings/*`, `lib/grading/options.ts`, `lib/storage/bunny.ts`, `middleware.ts`, migrations `20260702100000`, `20260703130000`–`20260703160000` | `AddAssetModal.tsx`, `ListingSubmitOverlay` (root layout) | [backend](./follow-up/product-catalog-search/backend.md) · [frontend](./follow-up/product-catalog-search/frontend.md) |
| Marketplace product search | ✅ Ready (v2 + keyword RPC + SSR bootstrap) | ✅ Wired (filters + grid + perf) | `app/actions/marketplace.ts` (`searchMarketplaceProducts`, `getMarketplacePriceBounds`, `getMarketplaceRarities`, **`getMarketplaceBootstrap`**), `lib/auth/session.ts` (`getOptionalAuthUser`), `app/lib/hooks/useCurrentUserId.ts`, `app/lib/marketplace/types.ts`, `app/lib/marketplace/searchParsers.ts`, `lib/marketplace/filter-options.ts`, `lib/grading/options.ts`, `app/lib/hooks/useMarketplaceSearch.ts`, migrations `20260702120000`, `20260702130000`, **`20260704220000`** | `app/marketplace/page.tsx` (SSR), **`MarketplacePageClient.tsx`**, `AccordionFilters.tsx`, `MarketplaceCard.tsx` (own-listing + set·cardNo), `RarityBadge.tsx`, `MarketplaceEmptyState.tsx`, `HeroSearch.tsx` | [backend](./follow-up/marketplace-search/backend.md) · [frontend](./follow-up/marketplace-search/frontend.md) |
| Auth login / register (member) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `lib/auth/validation.ts`, `lib/auth/username.ts`, `lib/supabase/admin.ts`, migration `20260704140000` | `app/auth/AuthForm.tsx` | [backend](./follow-up/auth-login-register/backend.md) · [frontend](./follow-up/auth-login-register/frontend.md) |
| Auth password (forgot + reset) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `app/auth/callback/route.ts`, `lib/auth/password-errors.ts`, `lib/auth/site-url.ts` | `app/auth/forgot-password/`, `app/auth/reset-password/`, `AuthForm.tsx`, `PasswordUpdatedToast` | [backend](./follow-up/auth-password-recovery/backend.md) · [frontend](./follow-up/auth-password-recovery/frontend.md) |
| User profile settings (member) | ✅ Ready | ✅ Wired (baseline) | `app/actions/profile.ts`, `lib/profile/avatar.ts`, `lib/profile/validation.ts`, `lib/profile/errors.ts`, migrations `20260703100000`–`20260703120000` | `app/profile/user/settings/` | [backend](./follow-up/user-profile-settings/backend.md) · [frontend](./follow-up/user-profile-settings/frontend.md) |
| Role-based routing & session | ✅ Ready | ✅ Wired (baseline) | `lib/auth/roles.ts`, `lib/auth/session.ts`, `middleware.ts` (session refresh all routes; role guard `/profile` + `/admin`), `app/actions/profile.ts`, `app/actions/auth.ts` (`logout`) | `RoleProvider`, `LogoutModal`, `mockRole` consumers | [backend](./follow-up/role-based-routing/backend.md) · [frontend](./follow-up/role-based-routing/frontend.md) |
| Marketplace product detail (catalog) | ✅ Ready | ✅ Wired (baseline) | `app/actions/marketplace.ts` (`getMarketplaceProductDetail`), `app/lib/marketplace/types.ts` (`MarketplaceProductDetail`), `lib/catalog/element-types.ts`, `app/marketplace/product/[id]/page.tsx`, `ProductDetailClient.tsx`, `app/marketplace/MarketplaceChrome.tsx` | `app/marketplace/product/[id]/`, `MarketplaceCard.tsx` | [backend](./follow-up/marketplace-product-detail/backend.md) · [frontend](./follow-up/marketplace-product-detail/frontend.md) |
| Marketplace product detail (listings / chart / history) | ✅ Ready | ✅ Wired | `get_marketplace_product_listings` RPC, `getMarketplaceProductListings`, **`getMarketplaceListingDetail`**, `getMarketplaceProductTradeHistory`, **`getMarketplaceProductMarketPrices`**, **`getMarketplaceProductMarketPrice`**, `lib/marketplace/market-price.ts`, `lib/listings/images.ts`, `useMarketplaceProductMarketPrice`, `useMarketplaceListingDetail`, `getOptionalAuthUser` (`page.tsx`), migrations `20260703170000`, `20260703180000`, `20260703210000`, `20260703220000` | `ProductDetailClient.tsx` (banner, chart, market grade chips, order book, trade history, **own-listing guard**), `AskOrderBookRow.tsx`, `ExecutionSlideOver.tsx` (on-demand listing photo grid) | [marketplace-product-detail](./follow-up/marketplace-product-detail/backend.md) · [frontend](./follow-up/marketplace-product-detail/frontend.md) |
| Market pricing aggregation (Cron Job 2) | ✅ Ready | ✅ Wired | `app/api/cron/aggregate-prices/route.ts`, `lib/marketplace/market-price.ts`, `lib/supabase/admin.ts`, `product_price_snapshots`, `product_grading_market_prices`, migrations `20260703210000`, `20260703220000` | Product detail chart + market price banner (`ProductDetailClient.tsx`) | [backend](./follow-up/market-pricing-cron/backend.md) · [frontend](./follow-up/market-pricing-cron/frontend.md) |
| Offers & negotiation (make / modify / accept / reject) | ✅ Ready | 🟡 Partial | `app/actions/offers.ts` (`makeOffer` + **`p_use_authentication`**), migrations `20260704130000`–`20260704250000`, **`20260705130000`**, **`20260705140000`**, `rpc_make_offer`, `rpc_modify_offer`, **`rpc_accept_offer`** (inherits offer auth → `member_orders`), `rpc_reject_offer` | `ExecutionSlideOver.tsx` (**鑑定加購** toggle), `OfferCard.tsx` (auth badge), `SpecialTransactionMessage.tsx` | [backend](./follow-up/offers-negotiation/backend.md) · [frontend](./follow-up/offers-negotiation/frontend.md) |
| Chat inbox + OfferCard (DB + mock + Realtime) | ✅ Ready | 🟡 Partial | `app/actions/chat.ts` (inbox offers join **`use_authentication`**), `app/actions/offers.ts`, `app/actions/reviews.ts` (`resolveChatCompletionOrderId`), `app/lib/chat/*`, `app/lib/hooks/useChatRoomRealtime.ts`, `app/lib/hooks/useRoomReviewedOrderIds.ts`, `lib/supabase/client.ts`, migrations through **`20260705140000`** | `GlobalChatOverlay.tsx`, `GlobalChatConsole.tsx`, `OfferCard.tsx`, `SystemOrderCompletedMessage.tsx`, `ReviewModal.tsx` | [backend](./follow-up/chat-offers-inbox/backend.md) · [frontend](./follow-up/chat-offers-inbox/frontend.md) |
| User trading orders (list + detail + actions) | ✅ Ready | 🟡 Partial | `app/actions/orders.ts` (`searchUserTradingOrders` RPC, `getUserTradingOrders` wrapper, **`getMemberOrderDetail`**, **`cancelMemberOrder`**, **`completeMemberOrder`**), migrations `20260704250000`, **`20260704210000_order_actions_rpc`**, `20260704260000`, `20260704300000`, **`20260705120000`**, **`20260705130000`** | `app/profile/user/(dashboard)/trading/page.tsx`, `app/profile/user/orderDetail/[id]/page.tsx`, `MemberOrderDetailView.tsx`, **`MemberAuthOrderTimeline`**, **`MemberAuthOrderInvoice`**, `MemberP2pOrderTimeline.tsx`, `MemberP2pOrderInvoice.tsx`, `UserOrderRow.tsx`, `components/ui/badge.tsx`, `components/ui/tabs.tsx`, chat `SystemOrderCompletedMessage` | [backend](./follow-up/user-trading-orders/backend.md) · [frontend](./follow-up/user-trading-orders/frontend.md) |
| Transaction reviews (submit + modal + **double-blind**) | ✅ Ready | ✅ Wired (trading + chat) | `app/actions/reviews.ts` (`getUserReviewedMemberOrderIds`), migrations **`20260704270000`**–**`20260704290000`**, `rpc_submit_transaction_review` (`revealed`), `fn_try_reveal_order_reviews`, `rpc_get_user_reviewed_member_order_ids` | `ReviewModal.tsx`, trading page + `GlobalChatConsole` / `SystemOrderCompletedMessage` review CTA | [backend](./follow-up/transaction-reviews/backend.md) · [frontend](./follow-up/transaction-reviews/frontend.md) |
| Member rewards & gamification (check-in, coupons, auto-grant) | ✅ Ready | 🟡 Partial | `app/actions/rewards.ts`, `lib/constants/rewards.ts`, `lib/rewards/mapUserRewardCoupon.ts`, migrations **`20260705180000`**–**`20260705188000`**, RPCs `execute_daily_check_in`, `get_gamification_stats_for_me`, **`get_reward_coupon_center`**, `get_unacknowledged_reward_grants` | `CheckInCard.tsx`, `RewardUnlockedModal.tsx`, `RewardNotificationHost.tsx`, `UserProfileDashboardShell`, `/profile/user` hero PTS, `/profile/user/rewards` **4-tab coupon center** (wallet + **可解鎖** locked catalog) | [backend](./follow-up/member-rewards-gamification/backend.md) · [frontend](./follow-up/member-rewards-gamification/frontend.md) |
| Wishlist toggle | ⏳ Planned | ✅ UI done | `app/actions/Wishlist.ts` (planned) | `WishlistButton.tsx`, `WishlistTable.tsx` | [wishlist](./follow-up/wishlist/) |
| Create listing submit (box/set + hobby) | ⏳ Planned | ⏳ Pending | — | `AddAssetModal.tsx` non-card paths | — |

## Prerequisites (shared)

- `lib/supabase/server.ts`
- `.env` / `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; URL must **not** include `/rest/v1/`)
- Bunny (create listing images): `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_CDN_HOSTNAME`, optional `BUNNY_STORAGE_REGION`
- `product_catalog` table populated + anon `SELECT` (see migration below)
- `listings` rows with `status = 'active'`, valid `product_id`, `grading_company`, `grading_score`, `seller_persona`
- `next.config.ts`: `www.pokemon-card.com` in `images.remotePatterns` (catalog thumbnails)
- **Package manager:** use **Bun** (`bun install`, `bun run dev`). Commit `bun.lock`.

### DB migrations required (one-time)

Run in Supabase SQL Editor or via `bunx supabase db push`:

- `supabase/migrations/20260702100000_product_catalog_public_read.sql`
- `supabase/migrations/20260702110000_auth_profiles_registration.sql`
- `supabase/migrations/20260702120000_marketplace_search_rpc.sql` — RLS on `listings` + `profiles`
- `supabase/migrations/20260702130000_marketplace_search_rpc_v2.sql` — **required** for current RPC signature
- `supabase/migrations/20260704220000_marketplace_search_keyword.sql` — **`p_keyword`** unified OR-match (`name_ja` / `name_en` / `name_zh` / `set_code` / `card_number` / `display_id`)
- `supabase/migrations/20260703100000_profiles_default_avatar.sql` — default `avatar_path`
- `supabase/migrations/20260703110000_profiles_owner_update.sql` — profiles owner `UPDATE` RLS
- `supabase/migrations/20260703120000_profiles_settings_columns.sql` — `username`, `short_description`
- `supabase/migrations/20260704140000_profiles_username_on_signup.sql` — auto-assign unique `profiles.username` on signup trigger
- `supabase/migrations/20260703130000_listings_owner_insert.sql` — listings seller `INSERT`/`UPDATE` RLS
- `supabase/migrations/20260703140000_listings_owner_insert_simplify.sql` — simplified insert policy (`seller_id = auth.uid()`)
- `supabase/migrations/20260703150000_listings_service_role_grants.sql` — `service_role` grants on `listings` (trusted server insert)
- `supabase/migrations/20260703170000_get_marketplace_product_listings.sql` — product detail order book RPC
- `supabase/migrations/20260703180000_member_orders_trade_history_read.sql` — completed `member_orders` read for authenticated users
- `supabase/migrations/20260703210000_market_prices_service_role_grants.sql` — `service_role` grants on `product_grading_market_prices`
- `supabase/migrations/20260703220000_product_grading_market_prices_public_read.sql` — anon/authenticated `SELECT` on market price cache (product detail chart/banner)
- `supabase/migrations/20260704130000_rpc_make_offer.sql` — atomic buyer offer + chat room + message
- `supabase/migrations/20260704150000_rpc_accept_offer.sql` — seller accept → hold listing + `member_orders`
- `supabase/migrations/20260704160000_rpc_make_offer_single_pending.sql` — one active offer per buyer per listing (re-offer after `rejected` / `cancelled`)
- `supabase/migrations/20260704170000_rpc_modify_offer.sql` — buyer modify offer + `modified_count`
- `supabase/migrations/20260704180000_offers_listing_id_user_centric_rooms.sql` — Scheme B: `offers.listing_id`, user-centric `chat_rooms`
- `supabase/migrations/20260704190000_chat_rooms_messages_rls.sql` — chat/offers RLS + grants
- `supabase/migrations/20260704200000_get_user_chat_inbox_rpc.sql` — `get_user_chat_inbox()` RPC (fixes permission denied)
- `supabase/migrations/20260704250000_member_orders_order_number.sql` — **`order_number`** on `member_orders` / `merchant_orders`; participant RLS; **`rpc_accept_offer`** auto-generates `ORD-2026-*`
- `supabase/migrations/20260704210000_order_actions_rpc.sql` — **`rpc_cancel_member_order`**, **`rpc_complete_member_order`**, seller-complete trigger guard
- `supabase/migrations/20260704260000_merchant_order_reputation_stats.sql` — reputation stats on `member_orders` + `merchant_orders` status change
- `supabase/migrations/20260704270000_transaction_reviews_rls.sql` — `transaction_reviews` RLS + rating refresh trigger
- `supabase/migrations/20260704280000_rpc_submit_transaction_review.sql` — **`rpc_submit_transaction_review`**, **`rpc_get_user_reviewed_member_order_ids`**
- `supabase/migrations/20260704290000_transaction_reviews_double_blind.sql` — **double-blind** (`is_public = false` until both rate); `fn_try_reveal_order_reviews`; rating trigger only on public reviews
- `supabase/migrations/20260705120000_search_user_trading_orders.sql` — paginated **`search_user_trading_orders`** RPC + facet counts
- `supabase/migrations/20260705130000_member_orders_offers_use_authentication.sql` — **`offers.use_authentication`**, **`member_orders.use_authentication`**; **`rpc_accept_offer`** copies buyer opt-in from offer → order; list RPC uses order-level flag
- `supabase/migrations/20260705140000_rpc_make_offer_use_authentication.sql` — **`rpc_make_offer(p_use_authentication)`** persists buyer auth choice on offer row
- `supabase/migrations/20260705180000_reward_type_points_enum.sql` — **`reward_type`** adds `'points'` (must run before points templates)
- `supabase/migrations/20260705181000_points_ledger_and_check_in.sql` — **`gamification_stats.points_balance`**, **`point_ledger`**, **`execute_daily_check_in`**
- `supabase/migrations/20260705182000_auto_grant_rewards.sql` — auto-grant engine, **`user_rewards.acknowledged_at`**, notification RPCs
- `supabase/migrations/20260705183000_reward_template_claim_limits.sql` — template stock + seed coupons
- `supabase/migrations/20260705184000_archive_lucky_draw_add_hk2_coupon.sql` — archive lucky draw; seed **HK$2 profile coupon**
- `supabase/migrations/20260705186000_rpc_get_user_reward_coupons.sql` — **`get_user_reward_coupons()`** (coupon inventory)
- `supabase/migrations/20260705187000_rpc_get_gamification_stats.sql` — **`get_gamification_stats_for_me()`**
- `supabase/migrations/20260705188000_rpc_get_reward_coupon_center.sql` — **`get_reward_coupon_center()`** wallet + locked catalog; **`fn_reward_template_progress_detail`**

### Quick verify

```bash
bun run test:catalog-search   # DB connectivity + sample catalog search
bun run dev                   # UI: /, /marketplace, Add Asset modal, /auth, role routing
```

**Add Asset — create listing (manual, single card):**

1. Log in → open **新增商品** (merch mode).
2. Search + pick catalog card → selected card panel shows name / number / rarity.
3. Choose grading, add 4–6 photos, set price → submit.
4. **Global progress overlay** shows per-photo upload % then「寫入商品資料…」; success toast; modal closes.
5. Verify `listings` row + Bunny CDN URLs; `listing_stats` row created by DB trigger.

**Homepage hero search (manual):**

1. `/` — type `sv2a` or a card name (≥ 2 chars) → dropdown shows in-stock hits with `lowestPrice`.
2. Click a suggestion or press **搜尋** / Enter → navigates to `/marketplace?q=…` with live results.
3. No active listings for query → dropdown shows 「暫無符合的現貨標的」.
4. Quick-filter chips (`rarity=SAR`, `q=charizard`) still deep-link to `/marketplace`.

**Marketplace (manual):**

1. With **zero** active `listings` — `/marketplace` shows `MarketplaceEmptyState` (not an infinite spinner).
2. With active listings — grid shows only products with ≥ 1 active listing.
3. Search `sv2a`, `sv2a-062`, card number (`062`), `display_id`, or a card name (`皮卡丘` / `Pikachu`); toggle grade / seller-source filters.
4. Header should show `顯示第 X–Y 件，共 Z 件現貨` when results exist.
5. Apply a filter with no matches — `MarketplaceEmptyState` shows with 「清除所有篩選」.
6. **Rarity facet** — sidebar loads all distinct `product_catalog.rarity` values (not hardcoded SAR/UR/SR/AR).
7. **Seller source** — only **會員** (`MEMBER`) and **認證商戶** (`MERCHANT`); no C2C/P2P chips.
8. **Grade facet** — options match create-listing dropdown (`lib/grading/options.ts`); filter state uses grading option ids (e.g. `psa:10`, `raw:A`).
9. **Grid card** — rarity badge on image (top-left) from `product_catalog.rarity`; grading badge **not** shown on card.
10. **Grid → detail** — card click opens `/marketplace/product/<productId>` with live catalog data.
11. **Own listing (grid)** — log in as seller whose listing is the lowest price for a product → card shows **我的掛單** badge, gold ring, seller **(你)**, disabled **我的掛單 · 無法出價** button (no buy flow).

**Product detail — catalog (manual):**

1. From grid, open a product → title is `name_ja`; `name_zh` + rarity badge when present.
2. Nav bars hidden on detail; back chevron returns to previous page.
3. Spec matrix: set, 日版原名, 卡牌屬性 (繁中), 進化階段.
4. Invalid product id → 404.

**Product detail — listings (manual):**

1. Apply migration `20260703170000_get_marketplace_product_listings.sql`.
2. Open product with active listings → order book shows seller rows from DB.
3. Toggle **只顯示已鑑定** — RAW listings hidden.
4. Select a grading chip (e.g. **PSA 10**, **裸卡 A**) — only matching listings shown.
5. Change sort (價格 / 鑑定等級 / 賣家評級) — order updates server-side.
6. Pagination works when > 5 listings match filters.
7. **Own listing (order book)** — log in as a seller with an active listing on the product → row shows **我的掛單** badge + gold highlight; row is not clickable; helper text **無法對自己的商品出價**; `ExecutionSlideOver` does not open.

**Product detail — execution slide-over (manual):**

1. Open product with a listing that has 4–6 uploaded images.
2. Click an order book row → `ExecutionSlideOver` opens immediately (seller, price from row).
3. Photo area shows skeleton grid, then **3-column 3:4 thumbnails** from `getMarketplaceListingDetail`.
4. Click a different row → new fetch by `listingId`; grid updates.
5. Listing with empty `images` → catalog fallback thumbnail(s).

**Product detail — trade history (manual):**

1. Apply migration `20260703180000_member_orders_trade_history_read.sql`.
2. As **guest** — sold history section blurred; no fetch.
3. Log in → completed orders for product show with date, grade, price.
4. Pagination when > 5 completed orders.

**Product detail — market price + chart (manual):**

1. Apply migrations `20260703210000`, `20260703220000`.
2. Seed `product_price_snapshots` with `price_hkd`, `grading_company`, `grading_score`, and for **裸卡** rows set `condition_type` to `A` / `B` / `C` / `D`.
3. Trigger cron: `curl -s -H "Authorization: Bearer $CRON_SECRET" http://localhost:3000/api/cron/aggregate-prices`
4. Open product detail → banner shows `market_avg_price` + green/red `market_trend_30d` badge.
5. When multiple grades exist in cache, market grade chips appear in banner (PSA 10, 裸卡 A, …) — **independent** of order-book filter chips.
6. Switching a market grade chip updates avg + chart instantly (client-side; one bulk fetch on mount).
7. Chart shows 30-day Recharts series from `market_chart_data`; guest blur overlay on chart.
8. Grade with avg but no chart points → 「此規格暫無走勢圖資料」.
9. No cache rows → skeleton / `—` in banner.

**Product detail — known limitation (order book vs market price):**

- **Market price** distinguishes 裸卡 A/B/C/D via `product_grading_market_prices.grading_score` (`A`–`D`) after cron groups snapshots by `condition_type`.
- **Order book** still matches all RAW listings when any `raw:*` chip is selected (`listings.grading_score` is `null` for all raw conditions). Separate listings schema/RPC work if per-condition order-book filter is required.

**Product detail — SQL smoke test:**

```sql
SELECT product_id, listing_count, lowest_price, total_count, range_start, range_end
FROM search_marketplace_products(p_page := 1, p_page_size := 10);
```

**Offers & negotiation (manual):**

1. Apply migrations `20260704130000` through **`20260705140000`** (`bunx supabase db push`).
2. Log in as **buyer** → product detail → order book row → `ExecutionSlideOver` → optional **平台鑑定加購** toggle → **發送叫價至聊天室**.
3. Global chat opens; `OfferCard` shows **待確認** with listing thumbnail; when auth toggled on → badge **含平台鑑定加購 (HK$ 150)** + pending alert for both parties.
4. **修改出價** once → price updates; second attempt blocked. Auth flag unchanged on modify (offer row only).
5. Send a plain text message → **發送** → persists in DB room; survives chat reopen.
6. Log in as **seller** → open chat (DB room in lobby + mock rooms) → **接受出價** on `OfferCard` (accept dialog notes auth add-on when applicable).
7. Listing `inactive` on marketplace; `member_orders` row `pending` with 14-day `expires_at`; `use_authentication` matches offer.
8. Order detail: auth orders → `MemberAuthOrderTimeline` + `MemberAuthOrderInvoice`; meetup-only → P2P timeline + simplified invoice.

See [offers-negotiation](./follow-up/offers-negotiation/backend.md) · [chat-offers-inbox backend](./follow-up/chat-offers-inbox/backend.md) · [chat-offers-inbox frontend](./follow-up/chat-offers-inbox/frontend.md).

**User trading orders (manual):**

1. Apply migrations through **`20260705130000`** (`bunx supabase db push`); regen `types/supabase.ts`.
2. Log in → accept an offer (seller) → `member_orders` row with `order_number` like `ORD-2026-XXXXXX`.
3. Open **`/profile/user/trading`** — live orders (RPC only; no mock on list).
4. Toggle persona / status tabs; search by order number or card name.
5. Click row → **`/profile/user/orderDetail/<uuid>`** — branches on `order.useAuthentication`: P2P meetup vs auth escrow timeline + invoice. See [user-trading-orders frontend](./follow-up/user-trading-orders/frontend.md).

See [user-trading-orders backend](./follow-up/user-trading-orders/backend.md) · [user-trading-orders frontend](./follow-up/user-trading-orders/frontend.md).

**User trading orders — cancel / complete / review (manual):**

1. Apply migrations through **`20260704290000`** (use `db query --linked -f` if `db push` blocked by duplicate `20260704210000` timestamp).
2. Pending order on **`/profile/user/trading`** or **order detail** → **確認完成交易** → `ReviewModal` → submit review.
3. Seller pending order → **取消交易** → confirm dialog → **確認取消** → listing `active` on marketplace.
4. **已完成** tab or completed detail → **✍️ 給予對手評價** when `hasReviewedByMe === false`.

**Transaction reviews — double-blind (manual):**

1. Party A submits review → toast `待對方評價後將互相公開`; SQL shows `is_public = false`.
2. Party B cannot see A's rating/comment via app (RLS: only own row or `is_public`).
3. Party B submits review → toast `雙方評價已公開`; both rows `is_public = true`; `profiles.rating_score` updates for both reviewees.

See [transaction-reviews backend](./follow-up/transaction-reviews/backend.md) · [transaction-reviews frontend](./follow-up/transaction-reviews/frontend.md).

**Member rewards & gamification (manual):**

1. Apply migrations through **`20260705188000`** (`bunx supabase db push`); `bun run supabase:types`.
2. Log in → **`/profile/user`** — check-in card shows DB PTS; hero **帳戶總積分餘額** matches after load.
3. Click **立即簽到打卡** — toast with PTS; second attempt same day blocked.
4. Profile **incomplete** → **`/profile/user/rewards`** → **可解鎖** tab shows HK$2 / HK$10 coupons with requirement + progress + **去完成 →**.
5. Complete profile (username + avatar) in settings → coupon moves to **可領取 / 可使用**; `RewardUnlockedModal` may appear on dashboard.
6. Wallet tabs (redeemable / redeemed / expired) from `get_reward_coupon_center().wallet`.

See [member-rewards-gamification backend](./follow-up/member-rewards-gamification/backend.md) · [member-rewards-gamification frontend](./follow-up/member-rewards-gamification/frontend.md).
