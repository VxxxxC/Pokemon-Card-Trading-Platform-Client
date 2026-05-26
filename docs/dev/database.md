# Database Implementation TODOs

All `TODO [database]` markers across the frontend codebase. Each item requires **Supabase tables, queries, or aggregations** to be implemented.

---

## Tables Referenced

The following Supabase tables are referenced across the codebase and need to be created/migrated:

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles (display_name, handle, bio, role, is_banned, two_factor_enabled) |
| `merchant_profiles` | Merchant-specific data (shop_name, stripe_account_id) |
| `listings` | Card listings (name, price, status, seller_id, images, category) |
| `orders` | Purchase orders (buyer_id, seller_id, status, amount) |
| `bids` | Auction bids on listings |
| `transactions` | Completed transactions (for ticker/wall) |
| `user_points` | Points ledger (user_id, points, reason) |
| `user_streaks` | Check-in streaks (user_id, last_checkin, streak_days, reward_claimed) |
| `user_badges` | Earned achievement badges |
| `user_collections` | User's personal card collection |
| `user_preferences` | Language, currency preferences |
| `notification_settings` | Per-user notification toggles |
| `reviews` | User reviews/ratings |
| `kyc_applications` | KYC verification applications |
| `card_catalog` | Master card database |
| `card_series` | Box series with live price feeds |
| `price_cache` | Cached market prices (from Mercari/TCGdex) |
| `price_history` | Historical price data for portfolio valuation |
| `platform_settings` | Global settings (commission_rate, shipping_subsidy) |
| `platform_stats` | Aggregated platform metrics |
| `payout_transactions` | Stripe payout history |
| `api_credentials` | Encrypted API keys (Stripe, TCGdex, etc.) |
| `scraper_jobs` | Scraper run history and timestamps |
| `announcements` | Platform news/announcements |
| `portfolios` | User portfolio stats |
| `sessions` | Active user sessions |

---

## TODOs by Feature Area

### User Profile (`app/profile/user/`)

| File | Line | Description |
|------|------|-------------|
| `app/profile/user/page.tsx` | 11 | Fetch portfolio stats from `portfolios` table |
| `app/profile/user/page.tsx` | 27 | Fetch member level, XP, rating from `profiles` |
| `app/profile/user/page.tsx` | 37 | Fetch earned badges from `user_badges` join |
| `app/profile/user/page.tsx` | 45 | Fetch recent transactions from `orders` |
| `app/profile/user/page.tsx` | 46 | Compute relative timestamps from `created_at` |
| `app/profile/user/page.tsx` | 54 | Fetch reviews from `reviews` table |
| `app/profile/user/page.tsx` | 61 | Fetch streak/reward status from `user_streaks` |
| `app/profile/user/collection/page.tsx` | 21 | Fetch card collection from `user_collections` JOIN `listings` |
| `app/profile/user/collection/page.tsx` | 33 | Compute portfolio summary from `user_collections` JOIN `price_history` |
| `app/profile/user/orders/page.tsx` | 24 | Fetch active orders from `orders` WHERE `status NOT IN ('released', 'cancelled')` |
| `app/profile/user/orders/page.tsx` | 54 | Fetch completed orders from `orders` WHERE `status = 'released'` |
| `app/profile/user/settings/page.tsx` | 22 | Replace hardcoded display_name from `profiles` |
| `app/profile/user/settings/page.tsx` | 34 | Replace hardcoded handle from `profiles` |
| `app/profile/user/settings/page.tsx` | 49 | Replace hardcoded bio from `profiles` |
| `app/profile/user/settings/page.tsx` | 79 | Replace hardcoded email/2FA from `auth.users` and `profiles` |
| `app/profile/user/settings/page.tsx` | 184 | Replace hardcoded notification prefs from `notification_settings` |
| `app/profile/[id]/page.tsx` | 663 | Replace "1,250" points balance from `user_points` aggregation |

### Merchant Profile (`app/profile/merchant/`)

| File | Line | Description |
|------|------|-------------|
| `app/profile/merchant/page.tsx` | 9 | Fetch revenue stats from `orders` aggregation |
| `app/profile/merchant/page.tsx` | 17 | Fetch pending orders from `orders` |
| `app/profile/merchant/page.tsx` | 25 | Fetch completed sales from `orders` |
| `app/profile/merchant/inventory/page.tsx` | 23 | Fetch merchant's listings from `listings` WHERE `seller_id = current user` |
| `app/profile/merchant/sales/page.tsx` | 23 | Fetch sales orders from `orders` WHERE `seller_id = current user` |
| `app/profile/merchant/settings/page.tsx` | 16 | Replace hardcoded shop_name from `merchant_profiles` |
| `app/profile/merchant/finance/page.tsx` | 8 | Fetch Stripe payout summary |
| `app/profile/merchant/finance/page.tsx` | 16 | Fetch transaction history from `payout_transactions` |

### Homepage Components (`app/components/home/`)

| File | Line | Description |
|------|------|-------------|
| `app/components/home/PlatformStats.tsx` | 3 | Fetch platform stats from `platform_stats` or aggregation |
| `app/components/home/PortfolioDashboard.tsx` | 6 | Aggregate user's card collection value |
| `app/components/home/PortfolioDashboard.tsx` | 8 | `user_check_ins` needs UNIQUE constraint + row lock |
| `app/components/home/PortfolioDashboard.tsx` | 54 | Replace hardcoded portfolio value |
| `app/components/home/TrustedSellers.tsx` | 4 | Fetch verified merchants — WHERE `account_type='merchant' AND kyc_status='verified'` |
| `app/components/home/FollowingFeed.tsx` | 13 | Compound index needed on `user_favorites(user_id, listing_id)` |
| `app/components/home/CommunityNews.tsx` | 3 | Fetch announcements from `announcements` table |

### Marketplace (`app/marketplace/`)

| File | Line | Description |
|------|------|-------------|
| `app/components/marketplace/MarketplaceGrid.tsx` | 3 | Replace mock array with Supabase query on `listings` |

### Admin (`app/admin/`)

| File | Line | Description |
|------|------|-------------|
| `app/admin/page.tsx` | 8 | Fetch platform metrics from `orders`, `stripe_payouts`, `sessions` |
| `app/admin/users/page.tsx` | 22 | Fetch all users from `profiles` with role JOIN |
| `app/admin/settings/page.tsx` | 73 | Replace hardcoded scraper timestamps from `scraper_jobs` |
| `app/admin/settings/page.tsx` | 120 | Replace hardcoded API keys from `api_credentials` |
| `app/admin/settings/page.tsx` | 168 | Replace hardcoded commission rate from `platform_settings` |

### Auth (`app/auth/`)

| File | Line | Description |
|------|------|-------------|
| `app/auth/page.tsx` | 192 | Replace hardcoded metrics (¥2.4億+, 12,800+, 99.8%) with real aggregation |

### Settings (`app/settings/`)

| File | Line | Description |
|------|------|-------------|
| `app/settings/page.tsx` | 33 | Replace hardcoded language/currency from `user_preferences` |
