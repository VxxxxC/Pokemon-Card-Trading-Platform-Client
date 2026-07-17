# Integration Queue

> Single dashboard for backend ↔ frontend handoffs.  
> Update a row when backend is ready or frontend is wired.

| Flow | Backend | Frontend | Backend files | UI touchpoint | Follow-up |
|------|---------|----------|---------------|---------------|-----------|
| Product catalog search + create listing (single card) | ✅ Ready | ✅ Wired (baseline) | `app/actions/productCatalog.ts`, `app/actions/listings.ts`, `app/api/listings/upload-image/route.ts`, `app/lib/hooks/useProductCatalogSearch.ts`, `app/store/useListingSubmitStore.ts`, `components/listings/ListingSubmitOverlay.tsx`, `lib/listings/*`, `lib/grading/options.ts`, `lib/storage/bunny.ts`, `middleware.ts`, migrations `20260702100000`, `20260703130000`–`20260703160000` | `AddAssetModal.tsx`, `ListingSubmitOverlay` (root layout) | [backend](./follow-up/product-catalog-search/backend.md) · [frontend](./follow-up/product-catalog-search/frontend.md) |
| Marketplace product search | ✅ Ready (v2 + keyword RPC + SSR bootstrap) | ✅ Wired (filters + grid + perf + buy CTA) | `app/actions/marketplace.ts` (`searchMarketplaceProducts`, `getMarketplacePriceBounds`, `getMarketplaceRarities`, **`getMarketplaceBootstrap`**), `lib/auth/session.ts` (`getOptionalAuthUser`), `app/lib/hooks/useCurrentUserId.ts`, `app/lib/marketplace/types.ts`, `app/lib/marketplace/searchParsers.ts`, `lib/marketplace/filter-options.ts`, `lib/grading/options.ts`, `app/lib/hooks/useMarketplaceSearch.ts`, `lib/marketplace/map-listing-to-execution.ts`, migrations `20260702120000`, `20260702130000`, **`20260704220000`** | `app/marketplace/page.tsx` (SSR), **`MarketplacePageClient.tsx`**, `AccordionFilters.tsx`, `MarketplaceCard.tsx` (own-listing + **`BuyButton` → slide-over**), `GlobalTxButtons.tsx`, `RarityBadge.tsx`, `MarketplaceEmptyState.tsx`, `HeroSearch.tsx` | [backend](./follow-up/marketplace-search/backend.md) · [frontend](./follow-up/marketplace-search/frontend.md) |
| Merchant storefront (`/marketplace/[id]`) | ✅ Ready | ✅ Wired | `getMarketplaceSellerProfile`, `searchMarketplaceSellerListings`, **`getMarketplaceSellerListingDetail`**, `search_marketplace_seller_listings` RPC, `lib/marketplace/load-seller-profile.ts`, `lib/marketplace/load-seller-listing-detail.ts`, `lib/marketplace/map-seller-listing.ts`, migration **`20260707160000`** | `app/marketplace/[id]/`, `app/marketplace/[id]/product/[productId]/` (**`BuyButton` → slide-over**), `useMarketplaceSellerSearch` | [backend](./follow-up/marketplace-storefront/backend.md) · [frontend](./follow-up/marketplace-storefront/frontend.md) · **[partner report](./follow-up/marketplace-storefront/PARTNER_REPORT.md)** |
| Auth login / register (member) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `lib/auth/validation.ts`, `lib/auth/username.ts`, `lib/supabase/admin.ts`, migration `20260704140000` | `app/auth/AuthForm.tsx` | [backend](./follow-up/auth-login-register/backend.md) · [frontend](./follow-up/auth-login-register/frontend.md) |
| Auth password (forgot + reset) | ✅ Ready | ✅ Wired (baseline) | `app/actions/auth.ts`, `app/auth/callback/route.ts`, `lib/auth/password-errors.ts`, `lib/auth/site-url.ts` | `app/auth/forgot-password/`, `app/auth/reset-password/`, `AuthForm.tsx`, `PasswordUpdatedToast` | [backend](./follow-up/auth-password-recovery/backend.md) · [frontend](./follow-up/auth-password-recovery/frontend.md) |
| User profile settings (member) | ✅ Ready | ✅ Wired (baseline + dashboard avatar upload) | `app/actions/profile.ts` (`updateUserAvatar`), `app/api/profile/upload-avatar/route.ts`, `lib/profile/client-upload.ts`, `lib/profile/avatar.ts`, `lib/profile/validation.ts`, `lib/profile/errors.ts`, `lib/storage/bunny.ts` (`uploadProfileAvatarToBunny`), migrations `20260703100000`–`20260703120000` | `app/profile/user/settings/`, `UserOverviewClient.tsx` (avatar edit overlay) | [backend](./follow-up/user-profile-settings/backend.md) · [frontend](./follow-up/user-profile-settings/frontend.md) |
| Merchant settings (shop profile) | ✅ Ready | ✅ Wired (baseline) | `app/actions/merchant-settings.ts`, `lib/merchant/validation.ts`, `lib/merchant/errors.ts`, `lib/marketplace/load-seller-profile.ts`, migration `20260716100000` | `app/profile/merchant/settings/` | [backend](./follow-up/merchant-settings/backend.md) · [frontend](./follow-up/merchant-settings/frontend.md) — ⏳ notifications mock |
| Role-based routing & session | ✅ Ready | ✅ Wired (baseline) | `lib/auth/roles.ts`, `lib/auth/session.ts`, `middleware.ts` (session refresh all routes; role guard `/profile` + `/admin`), `app/actions/profile.ts`, `app/actions/auth.ts` (`logout`) | `RoleProvider`, `LogoutModal`, `mockRole` consumers | [backend](./follow-up/role-based-routing/backend.md) · [frontend](./follow-up/role-based-routing/frontend.md) |
| Marketplace product detail (catalog) | ✅ Ready | ✅ Wired (baseline) | `app/actions/marketplace.ts` (`getMarketplaceProductDetail`), `app/lib/marketplace/types.ts` (`MarketplaceProductDetail`), `lib/catalog/element-types.ts`, `app/marketplace/product/[id]/page.tsx`, `ProductDetailClient.tsx`, `app/marketplace/MarketplaceChrome.tsx` | `app/marketplace/product/[id]/`, `MarketplaceCard.tsx` | [backend](./follow-up/marketplace-product-detail/backend.md) · [frontend](./follow-up/marketplace-product-detail/frontend.md) |
| Marketplace product detail (listings / chart / history) | ✅ Ready | ✅ Wired | `get_marketplace_product_listings` RPC, `getMarketplaceProductListings`, **`getMarketplaceListingDetail`**, `getMarketplaceProductTradeHistory`, **`getMarketplaceProductMarketPrices`**, **`getMarketplaceProductMarketPrice`**, `lib/marketplace/market-price.ts`, `lib/listings/images.ts`, `useMarketplaceProductMarketPrice`, `useMarketplaceListingDetail`, `getOptionalAuthUser` (`page.tsx`), migrations `20260703170000`, `20260703180000`, `20260703210000`, `20260703220000` | `ProductDetailClient.tsx` (banner, chart, market grade chips, order book, trade history, **own-listing guard**, **global `ExecutionSlideOver`**), `AskOrderBookRow.tsx`, `ExecutionSlideOverHost.tsx`, `ExecutionSlideOver.tsx` (on-demand listing photo grid) | [marketplace-product-detail](./follow-up/marketplace-product-detail/backend.md) · [frontend](./follow-up/marketplace-product-detail/frontend.md) |
| Market pricing aggregation (Cron 1b + 2) | ✅ Ready | ✅ Wired | `app/api/cron/ingest-platform-trades/route.ts`, `app/api/cron/aggregate-prices/route.ts`, `vercel.json` (02:30/03:00 HKT), `search_marketplace_products*` trend JOIN, migrations through **`20260710140000`** | Product detail chart + **`MarketplaceCard` 30D %** (`ProductDetailClient.tsx`) | [backend](./follow-up/market-pricing-cron/backend.md) · [frontend](./follow-up/market-pricing-cron/frontend.md) |
| Offers & negotiation (make / modify / accept / reject) | ✅ Ready | 🟡 Partial (buy entry wired) | `app/actions/offers.ts` (`makeOffer` + **`p_use_authentication`**), migrations `20260704130000`–`20260704250000`, **`20260705130000`**, **`20260705140000`**, `rpc_make_offer`, `rpc_modify_offer`, **`rpc_accept_offer`** (inherits offer auth → `member_orders`), `rpc_reject_offer` | **`GlobalTxButtons.tsx`** (`BuyButton` → global slide-over), **`ExecutionSlideOverHost.tsx`** (root layout), `lib/marketplace/map-listing-to-execution.ts`, `ExecutionSlideOver.tsx` (**鑑定加購** toggle), `OfferCard.tsx` (auth badge), `SpecialTransactionMessage.tsx` | [backend](./follow-up/offers-negotiation/backend.md) · [frontend](./follow-up/offers-negotiation/frontend.md) |
| Chat inbox + OfferCard (DB + mock + Realtime) | ✅ Ready | 🟡 Partial | `app/actions/chat.ts`, **`app/actions/reports.ts`** (`submitUserReport`), `app/actions/offers.ts`, `app/actions/reviews.ts` (`resolveChatCompletionOrderId`), `app/lib/chat/*`, `app/lib/reports/formatReportReason.ts`, `app/lib/hooks/useChatRoomRealtime.ts`, `app/lib/hooks/useRoomReviewedOrderIds.ts`, `lib/supabase/client.ts`, migrations through **`20260709310000`** | `GlobalChatOverlay.tsx`, `GlobalChatConsole.tsx` (**report wired**), `ChatReportDialogBody.tsx`, **`ProfileHeaderWithChat.tsx`** (report wired), `OfferCard.tsx`, `SystemOrderCompletedMessage.tsx`, `ReviewModal.tsx` | [backend](./follow-up/chat-offers-inbox/backend.md) · [frontend](./follow-up/chat-offers-inbox/frontend.md) · **[partner report](./follow-up/chat-offers-inbox/PARTNER_REPORT.md)**
| Merchant trading orders (seller list + detail) | ✅ Ready | ✅ Wired | `search_merchant_trading_orders`, `getMerchantOrderDetail`, migration **`20260717150000`** | `merchant/trading/*`, `merchant/orderDetail/[id]`, `MerchantOrderDetailView.tsx` | [backend](./follow-up/merchant-trading/backend.md) · [frontend](./follow-up/merchant-trading/frontend.md) — ⏳ Stripe / logistics mutations |
| User trading orders (list + detail + actions) | ✅ Ready | 🟡 Partial + perf | `app/actions/orders.ts` (`searchUserTradingOrders` RPC), `lib/member-order/constants.ts`, migrations through **`20260707130000`** | `trading/page.tsx`, `UserTradingPageData.tsx`, `useUserTrading.ts`, `UserOrderRow.tsx`, order detail + review components | [backend](./follow-up/user-trading-orders/backend.md) · [frontend](./follow-up/user-trading-orders/frontend.md) · **[PERF_REPORT](./follow-up/user-trading-orders/PERF_REPORT.md)** |
| Member auth escrow (C2C 鑑定託管, mock pay) | ✅ Ready | ✅ Wired (mock) | `app/actions/orders.ts`, `app/actions/admin-member-orders.ts`, `app/actions/listings.ts`, `lib/payments/member-auth-payment.ts`, `lib/listings/auth-service-copy.ts`, `app/lib/member-order/auth-escrow.ts`, migrations **`20260708100000`**–**`20260708120000`** | `MemberOrderDetailView.tsx`, `MemberAuthMockPaymentPanel.tsx`, `MemberAuthAdminDevPanel.tsx`, `AddAssetModal.tsx`, `ExecutionSlideOver.tsx`, `OfferCard.tsx`, `UserOrderRow.tsx` | [backend](./follow-up/member-auth-escrow/backend.md) · [frontend](./follow-up/member-auth-escrow/frontend.md) |
| Transaction reviews (submit + modal + **double-blind**) | ✅ Ready | ✅ Wired (trading + chat) | `app/actions/reviews.ts` (`getUserReviewedMemberOrderIds`), migrations **`20260704270000`**–**`20260704290000`**, `rpc_submit_transaction_review` (`revealed`), `fn_try_reveal_order_reviews`, `rpc_get_user_reviewed_member_order_ids` | `ReviewModal.tsx`, trading page + `GlobalChatConsole` / `SystemOrderCompletedMessage` review CTA | [backend](./follow-up/transaction-reviews/backend.md) · [frontend](./follow-up/transaction-reviews/frontend.md) |
| Public profile page (`/profile/[id]`) | ✅ Ready | ✅ Wired | `getPublicProfilePageBootstrap`, `loadMarketplaceSellerProfile` (+ `avatar_path`), `searchMarketplaceSellerListings`, `getPublicProfileReviews` | `app/profile/[id]/` (`PublicProfilePageData`, `PublicProfileClient`, `ProfileHeaderWithChat`) | [backend](./follow-up/public-profile-page/backend.md) · [frontend](./follow-up/public-profile-page/frontend.md) |
| Public profile rating list (dual persona) | ✅ Ready | 🟡 Partial | `app/actions/reviews.ts` (`getPublicProfileReviews`), migration **`20260706150000`** ✅ remote, `search_public_profile_reviews`, persona-split rating triggers | `app/profile/[id]/rating/page.tsx`, `usePublicProfileReviews.ts`, **`app/profile/user/(dashboard)/page.tsx`** (live reviews preview + rating CTA) | [backend](./follow-up/transaction-reviews/backend.md) · [frontend](./follow-up/profile-rating-list/frontend.md) · **[partner report](./follow-up/profile-rating-list/PARTNER_REPORT.md)** |
| Member rewards & gamification (check-in, coupons, auto-grant) | ✅ Ready | 🟡 Partial | `app/actions/rewards.ts`, `lib/constants/rewards.ts`, `lib/rewards/mapUserRewardCoupon.ts`, migrations **`20260705180000`**–**`20260705188000`**, RPCs `execute_daily_check_in`, `get_gamification_stats_for_me`, **`get_reward_coupon_center`**, `get_unacknowledged_reward_grants` | `CheckInCard.tsx`, `RewardUnlockedModal.tsx`, `RewardNotificationHost.tsx`, `UserProfileDashboardShell`, `/profile/user` hero PTS, `/profile/user/rewards` **4-tab coupon center** (wallet + **可解鎖** locked catalog) | [backend](./follow-up/member-rewards-gamification/backend.md) · [frontend](./follow-up/member-rewards-gamification/frontend.md) |
| Wishlist toggle + collection table | ✅ Ready (Phase 1–2) | ✅ Wired | `app/actions/wishlist.ts`, migration `20260706100000`, `lib/wishlist/grading.ts`, `app/lib/wishlist/types.ts`, `app/lib/hooks/useWishlist.ts` | `WishlistButton.tsx`, `WishlistTable.tsx`, `MarketplaceCard.tsx`, `MarketplacePageClient.tsx`, `collection/page.tsx` | [backend](./follow-up/wishlist/backend.md) · [frontend](./follow-up/wishlist/frontend.md) — ⏳ Phase 3 OneSignal |
| Home page sections (wishlist / merchant / C2C) | ✅ Ready | ✅ Wired | `app/actions/home.ts`, `getHomeWishlistPreview`, `lib/home/load-home-listings.ts`, `lib/wishlist/pricing.ts`, `lib/home/perf-log.ts` | `app/page.tsx`, `HomePageShell.tsx`, `Home*SectionData.tsx`, `WishlistTicker.tsx`, `PremiumMarket.tsx`, `NewArrivals.tsx` (**`BuyButton` → `ExecutionSlideOver`**), `HeroSearch.tsx` | [backend](./follow-up/home-sections/backend.md) · [frontend](./follow-up/home-sections/frontend.md) · [PERF](./follow-up/home-sections/PERF_REPORT.md) · **[partner report](./follow-up/home-sections/PARTNER_REPORT.md)** |
| User collection portfolio (hobby + sell prefill) | ✅ Ready (pushed) | ✅ Wired | `getCollectionPageBootstrap`, `lib/collection/load-user-collection.ts`, migration `20260709130000` (sold archive + listing link), SSR `UserCollectionPageData.tsx` | `UserCollectionClient.tsx`, `useCollection.ts`, `CollectionAddAfterListingDialog.tsx`, `AddAssetModal.tsx` (merch prompt + sellPrefill link) | [backend](./follow-up/user-collection/backend.md) · [frontend](./follow-up/user-collection/frontend.md) · [PERF](./follow-up/user-collection/PERF_REPORT.md) |
| User inventory (seller listings by product) | ✅ Ready | ✅ Wired (user + merchant) + perf + **edit modal** | `app/actions/inventory.ts`, `lib/listings/load-user-inventory.ts` (`sellerPersona` filter), `app/actions/listings.ts` (`incrementListingView`, **`updateCardListing`**), `lib/listings/submit-card-listing.ts` (edit mode), migrations `20260706120000`–`20260706140000` ✅ remote | `user/inventory/*`, `merchant/inventory/*`, `useInventory.ts`, `InventoryAccordion.tsx`, **`ListingEditDialog.tsx`** | [backend](./follow-up/user-inventory/backend.md) · [frontend](./follow-up/user-inventory/frontend.md) · **[PERF_REPORT](./follow-up/user-inventory/PERF_REPORT.md)** · [partner report](./follow-up/user-inventory/PARTNER_REPORT.md) |
| Member profile dashboard (overview) | ✅ Ready | ✅ Wired | `app/actions/member-dashboard.ts`, `UserOverviewPageData.tsx`, `lib/dashboard/*`, `lib/titles/member-title-progress.ts`; SSR streaming + perf log | `page.tsx`, `UserOverviewClient.tsx`, `useMemberDashboard.ts`, `UserProfileDashboardShell.tsx` | [backend](./follow-up/member-dashboard/backend.md) · [frontend](./follow-up/member-dashboard/frontend.md) · **[partner report](./follow-up/member-dashboard/PARTNER_REPORT.md)** |
| Merchant profile dashboard (overview) | ✅ Ready | ✅ Wired | `app/actions/merchant-dashboard.ts`, `MerchantOverviewPageData.tsx`, `lib/titles/merchant-title-progress.ts`, `useMerchantTitleDisplay.ts`, migration **`20260717170000`** (persona-split `merchant_shops.reputation_tag`) | `merchant/(dashboard)/page.tsx`, `MerchantOverviewClient.tsx` | [backend](./follow-up/merchant-dashboard/backend.md) · [frontend](./follow-up/merchant-dashboard/frontend.md) |
| Merchant performance analytics | ✅ Ready | ✅ Wired | `app/actions/merchant-performance.ts`, `get_merchant_performance_analytics` RPC, migration **`20260717190000`** | `merchant/performance/page.tsx`, `MerchantPerformanceClient.tsx` | [backend](./follow-up/merchant-performance/backend.md) · [frontend](./follow-up/merchant-performance/frontend.md) |
| Merchant product analytics (per SKU) | ✅ Ready | ✅ Wired | `app/actions/merchant-product-analytics.ts`, `get_merchant_product_analytics` RPC, `listing_engagement_events`, migrations **`20260717200000`**, **`20260717201000`** | `merchant/analytics/*`, performance + inventory `?productId=` links | [backend](./follow-up/merchant-product-analytics/backend.md) · [frontend](./follow-up/merchant-product-analytics/frontend.md) |
| Persona reputation split (titles + badges) | ✅ Ready | ✅ Wired | `lib/constants/titles.ts` (`MEMBER_*` / `MERCHANT_*` badges), `fn_recalculate_member/merchant_reputation_tags`, migration **`20260717170000`**, `load-seller-profile.ts` | Member + merchant dashboards, marketplace storefront badges | [backend](./follow-up/persona-reputation-split/backend.md) |
| Member profile avatars (live flows) | ✅ Ready | ✅ Wired | `lib/profile/avatar.ts`, `lib/profile/load-profile-snippets.ts`, `app/components/profile/ProfileAvatar.tsx`, `app/actions/orders.ts` (`counterparty.avatarUrl`), `app/actions/marketplace.ts` (`sellerAvatarUrl`), `app/lib/chat/mapDbChats.ts` (`partnerAvatarUrl`), migrations **`20260710180000`**, **`20260710181000`** | `ProfileHeaderWithChat.tsx`, `AskOrderBookRow.tsx`, `MemberOrderDetailView.tsx`, `GlobalChatConsole.tsx`, `UserOverviewClient.tsx`, `MerchantOverviewClient.tsx`, `ProductDetailClient.tsx` | Merchant finance page still mock |

## Prerequisites (shared)

- `lib/supabase/server.ts`
- `.env` / `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; URL must **not** include `/rest/v1/`)
- Bunny (create listing images + profile avatars): `BUNNY_STORAGE_ZONE_NAME`, `BUNNY_STORAGE_ACCESS_KEY`, `BUNNY_CDN_HOSTNAME`, optional `BUNNY_STORAGE_REGION`
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
- `supabase/migrations/20260706100000_product_watchlists_wishlist_extend.sql` — **`product_watchlists`** wishlist columns (`grading_*`, `tracked_price`, `target_price`, alert fields) + grade UNIQUE + owner RLS
- `supabase/migrations/20260706110000_user_collections_portfolio_extend.sql` — **`user_collections`** portfolio columns (`id`, `grading_*`, `purchase_price`); drop `quantity`; reputation `COUNT(*)`
- `supabase/migrations/20260706120000_listing_stats_inventory_extend.sql` — **`listing_stats`** slim (`views`, `offers_count`); seller RLS; init trigger
- `supabase/migrations/20260706130000_listing_stats_rpc_sync.sql` — **`rpc_make_offer`** bumps cumulative `offers_count`
- `supabase/migrations/20260706140000_rpc_increment_listing_view.sql` — view counter for `ExecutionSlideOver`
- `supabase/migrations/20260706150000_profile_reviews_persona_split.sql` — dual-persona rating split + `search_public_profile_reviews`
- `supabase/migrations/20260706160000_member_completed_trades_buy_and_sell.sql` — C2C seller counts toward `profiles.completed_trades_count`; reconcile backfill (excludes cancelled/refunded)
- `supabase/migrations/20260707130000_complete_member_order_buyer_only.sql` — **`rpc_complete_member_order`** buyer-only; `fn_enforce_member_order_transitions` seller-complete removed
- `supabase/migrations/20260709130000_user_collections_sold_archive.sql` — **`user_collections.sold_*`**, **`listings.source_collection_id`**, `fn_archive_seller_collection_for_listing`; P2P + escrow complete archive seller collection row
- `supabase/migrations/20260717100000_card_search_flexible_match.sql` — flexible card id search helpers + patched marketplace/seller/trading RPCs + `search_product_catalog`
- `supabase/migrations/20260717160000_merchant_shops_shop_avatar_path.sql` — merchant shop avatar SSOT (`shop_avatar_path`)
- `supabase/migrations/20260717170000_merchant_shops_reputation_tag_split.sql` — persona-split titles/badges (`merchant_shops.reputation_tag` + member/merchant recalc fns)
- `supabase/migrations/20260717180000_merchant_orders_authenticated_select.sql` — `GRANT SELECT ON merchant_orders TO authenticated` (merchant dashboard + trading RPC)

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
2. Log in as **buyer** → open offer slide-over from any entry point below → optional **平台鑑定加購** toggle → **發送叫價至聊天室**.
3. **Entry points (all wired to global `ExecutionSlideOverHost`):**
   - `/marketplace` grid card **⚡ 立即購買** (`MarketplaceCard` → `BuyButton`)
   - `/` C2C strip **⚡ 立即購買** (`NewArrivals` → `BuyButton`)
   - `/marketplace/product/[id]` order book row (`ProductDetailClient` → `AskOrderBookRow`)
   - `/marketplace/[sellerId]/product/[productId]` storefront buy CTA (`MerchantProductDetailPageClient` → `BuyButton`)
4. Global chat opens; `OfferCard` shows **待確認** with listing thumbnail; when auth toggled on → badge **含平台鑑定加購 (HK$ 150)** + pending alert for both parties.
5. **修改出價** once → price updates; second attempt blocked. Auth flag unchanged on modify (offer row only).
6. Send a plain text message → **發送** → persists in DB room; survives chat reopen.
7. Log in as **seller** → open chat (DB room in lobby + mock rooms) → **接受出價** on `OfferCard` (accept dialog notes auth add-on when applicable).
8. Listing `inactive` on marketplace; `member_orders` row `pending` with 14-day `expires_at`; `use_authentication` matches offer.
9. Order detail: auth orders → `MemberAuthOrderTimeline` + `MemberAuthOrderInvoice`; meetup-only → P2P timeline + simplified invoice.
10. **Own listing** — grid / home C2C buy button hidden or no-op; order book row not clickable (`sellerId === currentUserId`).
11. **Guest** — slide-over opens; guest gate inside `ExecutionSlideOver` redirects to `/auth?redirect=...`.
12. **`AuctionButton`** — still mock (`injectSpecialTransaction`); out of scope for this wiring pass.

See [offers-negotiation](./follow-up/offers-negotiation/backend.md) · [chat-offers-inbox backend](./follow-up/chat-offers-inbox/backend.md) · [chat-offers-inbox frontend](./follow-up/chat-offers-inbox/frontend.md).

**User trading orders (manual):**

1. Apply migrations through **`20260705130000`** (`bunx supabase db push`); regen `types/supabase.ts`.
2. Log in → accept an offer (seller) → `member_orders` row with `order_number` like `ORD-2026-XXXXXX`.
3. Open **`/profile/user/trading`** — live orders (RPC only; no mock on list).
4. Toggle persona / status tabs; search by order number or card name.
5. Click row → **`/profile/user/orderDetail/<uuid>`** — branches on `order.useAuthentication`: P2P meetup vs auth escrow timeline + invoice. See [user-trading-orders frontend](./follow-up/user-trading-orders/frontend.md).

See [user-trading-orders backend](./follow-up/user-trading-orders/backend.md) · [user-trading-orders frontend](./follow-up/user-trading-orders/frontend.md).

**User trading orders — cancel / complete / review (manual):**

1. Apply migrations through **`20260707130000`**.
2. **Buyer** pending order on **`/profile/user/trading`** or **order detail** → **確認完成交易** → handover confirm dialog (3 checkboxes + legal) → **確認完成交收** → `ReviewModal` → submit review.
3. **Seller** pending order → **取消交易** only (no complete CTA) → confirm dialog → **確認取消** → listing `active` on marketplace.
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

**Wishlist (manual):**

1. Apply migration `20260706100000_product_watchlists_wishlist_extend.sql` (`bunx supabase db push`); `bun run supabase:types`.
2. Log in → `/marketplace` → star a card → success toast + **查看清單** link.
3. Open **`/profile/user/collection`** — row shows thumbnail, grade, **平台現價** (or **暫無放售**), target price, **30D 走勢 (SNKRDUNK 參考)**.
4. Change grade via dropdown → platform price + trend refresh for new grade.
5. Edit target price via pencil → persists after refresh.
6. `⋯` → **從願望清單移除** → row gone; marketplace star unfilled.
7. Log out → star → toast with **登入 / 註冊** action (no DB write when `currentUserId={null}`).

See [wishlist backend](./follow-up/wishlist/backend.md) · [wishlist frontend](./follow-up/wishlist/frontend.md).

**User collection portfolio (manual):**

1. Migration `20260706110000_user_collections_portfolio_extend.sql` + `20260709130000_user_collections_sold_archive.sql` applied (`bunx supabase db push`); `bun run supabase:types`.
2. Log in → **`/profile/user/collection`** → **收錄新卡** → select catalog + grade + 入手成本 → row in holdings table (catalog thumbnail).
3. **AI 總身家估值** from `getCollectionPortfolioSummary` (separate from table pagination). Valuation per card: **exact-grade SNKRDUNK → same-grade platform MIN → purchase_price** (`resolveCollectionMarketValue`). No cross-grade fallback. Rows using purchase_price show **入手價估計** in table.
4. Header stats: 持有 / 已鑑定 / Raw / **已上架** (`listedCount`). Table: server pagination + filter/search.
5. Change grade via dropdown → 現市價格 + **30D 走勢** update (exact grade SNKRDUNK only).
6. `⋯` → **出售收藏品** → `openAddAssetModal({ mode: "merch", sellPrefill })` → upload 4–6 photos → confirm price → listing created.
7. Filter **已上架** → row shows **已上架**; sell action hidden for listed rows.
8. Merch **直接上架**（非 sellPrefill）→ 成功後彈窗「是否一併加入收藏庫？」→ 確認寫入 `user_collections` 或略過（orphan listing 仍由 dashboard 補數）。
9. P2P / escrow 成交完成 → 對應收藏 row `sold_at` 設置、身家估值排除；filter **已售出** 可見成交價與日期。
10. `⋯` → **移除出資產庫** → row removed（僅 active rows）。

See [user-collection backend](./follow-up/user-collection/backend.md) · [user-collection frontend](./follow-up/user-collection/frontend.md).
