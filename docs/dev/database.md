# Database TODOs

Frontend placeholders that require database/schema/RLS and Supabase queries, indexes, or precomputed fields.

## TODO Index

- `app/admin/approvals/page.tsx:21` — Replace with Supabase query — fetch KYC applications from `kyc_applications` table where status IN ('pending', 'approved', 'rejected'), ordered by submitted_at DESC
- `app/admin/database/page.tsx:20` — Replace with Supabase query — fetch card entries from `card_catalog` table, with JOIN `price_cache` for cachedAt; filter by needsReview flag
- `app/admin/page.tsx:8` — Replace with Supabase aggregation — query `orders`, `stripe_payouts` and `sessions` tables for live platform metrics
- `app/admin/page.tsx:16` — Replace with Supabase Realtime subscription on `orders` table JOIN `users` and `listings`, limit 5, order by created_at DESC
- `app/admin/page.tsx:25` — Replace with live health checks — ping each service endpoint and measure latency; update status in real-time
- `app/admin/page.tsx:44` — Replace hardcoded timestamp with real server time — use new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Hong_Kong' }) or server-side Date
- `app/admin/settings/page.tsx:73` — Scraper last-run timestamps are hardcoded — replace with `scraper_jobs.last_run_at` from Supabase
- `app/admin/settings/page.tsx:120` — API keys (sk_live_••••, tcgdex_••••, etc.) and statuses are hardcoded — replace with masked keys and live status from `api_credentials` table in Supabase
- `app/admin/settings/page.tsx:168` — Current rate (5%) is hardcoded in display text — read from `platform_settings` table
- `app/admin/users/page.tsx:22` — Replace with Supabase query — fetch all users from `profiles` table with role JOIN, ordered by join_date DESC
- `app/auth/page.tsx:192` — ¥2.4億+, 12,800+, 99.8% are placeholder metrics — replace with real aggregation from Supabase: sum(orders.amount), count(listings), avg(user_ratings.score)
- `app/components/cards/CardGrid.tsx:3` — Replace with Supabase query — fetch top-rated/featured listings from `listings` table ordered by price or view count
- `app/components/home/HeroSmartSearch.tsx:15` — Replace with Supabase `card_catalog` query (cached) + Bunny CDN images.
- `app/components/home/NewArrivals.tsx:4` — Replace with Supabase query — newest C2C listings ordered by created_at DESC.
- `app/components/home/PortfolioAndRewards.tsx:8` — Implement `user_check_ins` + `user_streaks` and server-side procedure using DB time (Asia/Hong_Kong).
- `app/components/home/PremiumEscrowMarket.tsx:14` — Only show listings from verified merchants (Stripe Connect onboarding + KYC verified).
- `app/components/home/SniperRadar.tsx:17` — Persist `price_delta_percentage` on `listings` and index it for fast homepage queries.
- `app/components/home/TokyoMarketIndex.tsx:11` — Store and serve precomputed `price_history` points for each card_id.
- `app/components/marketplace/MarketplaceGrid.tsx:3` — Replace this array with a Supabase query on the `listings` table,
- `app/components/ticker/PriceTicker.tsx:5` — Add a lightweight cached table/view for latest completed trades (e.g. `trade_feed_cache`).
- `app/components/transactions/TransactionWall.tsx:1` — Replace with Supabase Realtime stream — subscribe to `transactions` table INSERT events
- `app/components/transactions/TransactionWall.tsx:2` — Relative timestamps (e.g. "2分鐘前") must be computed from real `created_at` field using date-fns or Intl.RelativeTimeFormat
- `app/marketplace/page.tsx:9` — Replace with Supabase query — fetch listings from `listings` table with filters applied
- `app/marketplace/page.tsx:127` — Replace series list with Supabase query on `card_series` table
- `app/marketplace/page.tsx:217` — Replace with live count from Supabase `listings` table
- `app/profile/[id]/page.tsx:82` — Replace with Supabase query: supabase.from('profiles').select('*').eq('pkt_id', id).single()
- `app/profile/[id]/page.tsx:663` — "1,250" points balance is hardcoded — replace with real balance from `user_points` aggregation in Supabase for current user
- `app/profile/merchant/finance/page.tsx:8` — Replace with Supabase query — fetch merchant's Stripe Connect payout summary via Stripe API (stripe.balance.retrieve for connected account)
- `app/profile/merchant/finance/page.tsx:16` — Replace with Supabase query — fetch merchant's transaction history from `payout_transactions` table, ordered by date DESC
- `app/profile/merchant/inventory/page.tsx:23` — Replace with Supabase query — fetch merchant's listings from `listings` table WHERE seller_id = current user, ordered by created_at DESC
- `app/profile/merchant/page.tsx:9` — Replace with Supabase query — fetch merchant's revenue stats from `orders` aggregation (sum amount WHERE seller_id = current user, grouped by period)
- `app/profile/merchant/page.tsx:17` — Replace with Supabase query — fetch pending orders from `orders` table WHERE seller_id = current user AND status IN ('pending_confirmation', 'pending_shipment', 'grading'), ordered by created_at ASC
- `app/profile/merchant/page.tsx:25` — Replace with Supabase query — fetch completed sales from `orders` table WHERE seller_id = current user AND status = 'completed', ordered by created_at DESC, limit 5
- `app/profile/merchant/sales/page.tsx:23` — Replace with Supabase query — fetch merchant's sales orders from `orders` table WHERE seller_id = current user, ordered by created_at DESC
- `app/profile/merchant/settings/page.tsx:16` — defaultValue="レン精選卡牌" is hardcoded — replace with value from `merchant_profiles.shop_name` queried for current user
- `app/profile/user/collection/page.tsx:21` — Replace with Supabase query — fetch user's own card collection from `user_collections` table with JOIN `listings` for current prices
- `app/profile/user/collection/page.tsx:33` — Replace with Supabase aggregation — compute portfolio summary stats from `user_collections` JOIN `price_history` for current valuations
- `app/profile/user/orders/page.tsx:24` — Replace with Supabase query — fetch buyer's active orders from `orders` table WHERE buyer_id = current user AND status NOT IN ('released', 'cancelled'), ordered by updated_at DESC
- `app/profile/user/orders/page.tsx:54` — Replace with Supabase query — fetch completed orders from `orders` table WHERE buyer_id = current user AND status = 'released', ordered by updated_at DESC, limit 20
- `app/profile/user/page.tsx:11` — Replace with Supabase query — fetch authenticated user's portfolio stats from `portfolios` table
- `app/profile/user/page.tsx:27` — Replace with Supabase query — fetch authenticated user's member level, XP, and rating from `profiles` table
- `app/profile/user/page.tsx:37` — Replace with Supabase query — fetch earned badges from `user_badges` join table
- `app/profile/user/page.tsx:45` — Replace with Supabase query — fetch recent transactions from `orders` table for authenticated user, ordered by created_at DESC, limit 4
- `app/profile/user/page.tsx:46` — Relative timestamps (e.g. "3分鐘前") must be computed from real `created_at` using date-fns relativeTimeFromNow
- `app/profile/user/page.tsx:54` — Replace with Supabase query — fetch reviews from `reviews` table where reviewee_id = current user, ordered by created_at DESC
- `app/profile/user/page.tsx:61` — Replace with Supabase query — fetch streak and reward status from `user_streaks` table for authenticated user
- `app/profile/user/settings/page.tsx:22` — defaultValue="山田レン" is hardcoded — replace with value from `profiles.display_name` for current user
- `app/profile/user/settings/page.tsx:34` — defaultValue="yamada_ren" is hardcoded — replace with value from `profiles.handle` for current user
- `app/profile/user/settings/page.tsx:49` — defaultValue bio is hardcoded — replace with value from `profiles.bio` for current user
- `app/profile/user/settings/page.tsx:79` — Email "yamada.ren@example.com" and 2FA status "已停用" are hardcoded — replace with values from `auth.users` and `profiles.two_factor_enabled` for current user
- `app/profile/user/settings/page.tsx:184` — Notification preferences (`on: true/false`) are hardcoded — replace with user's actual preferences from `notification_settings` table in Supabase
- `app/settings/page.tsx:33` — "語言" / "貨幣" current values are hardcoded — replace with user preference from `user_preferences` table in Supabase
