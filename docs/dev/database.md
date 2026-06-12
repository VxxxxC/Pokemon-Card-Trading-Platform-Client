# Database Schema & Query TODO Tracker

> This document tracks all frontend locations that require **database schema, queries, or RLS policies** in Supabase (PostgreSQL).
> Each entry maps to a `TODO: [database]` comment in the codebase.

---

## Core Tables Required

### `listings` table
| File | Description |
|------|-------------|
| `app/page.tsx` | Fetch active box series from `card_series` table with live HKD price feed |
| `app/components/cards/CardGrid.tsx` | Fetch top-rated/featured listings ordered by price or view count |
| `app/components/home/NewArrivals.tsx` | Query WHERE `seller_type='individual'` ORDER BY `created_at` DESC |
| `app/components/home/SniperRadar.tsx` | Pre-compute `price_delta_percentage` via DB trigger, index on `WHERE price_delta_percentage <= -10` |
| `app/components/home/NewArrivals.tsx` | On "直接購買" success, update status to `escrow_locked` atomically — RLS blocks duplicate payments |
| `app/marketplace/page.tsx` | Fetch listings with filters applied |
| `app/marketplace/page.tsx` | Replace client-side filtering with Supabase query params |
| `app/marketplace/page.tsx` | Live listing count query |
| `app/profile/merchant/inventory/page.tsx` | Fetch merchant's listings WHERE `seller_id = current user` |

### `card_catalog` table
| File | Description |
|------|-------------|
| `app/components/home/HeroSearch.tsx` | Indexed search on `card_number` column for millisecond autocomplete |
| `app/admin/database/page.tsx` | Fetch card entries with JOIN `price_cache` for cachedAt; filter by needsReview flag |

### `transactions` / `orders` tables
| File | Description |
|------|-------------|
| `app/components/transactions/TransactionWall.tsx` | Subscribe to `transactions` table INSERT events via Supabase Realtime |
| `app/profile/merchant/trading/page.tsx` | Fetch merchant's sales orders WHERE `seller_id = current user` |
| `app/profile/user/orders/page.tsx` | Fetch buyer's active orders WHERE `buyer_id = current user` AND status NOT IN ('released', 'cancelled') |
| `app/profile/user/orders/page.tsx` | Fetch completed orders WHERE status = 'released' |
| `app/admin/page.tsx` | Supabase Realtime subscription on `orders` JOIN `users` and `listings` |

### `price_feed` / `mercari_price_history` tables
| File | Description |
|------|-------------|
| `app/components/ticker/PriceTicker.tsx` | Live data from Supabase Realtime subscription on `price_feed` table |
| `app/components/home/TokyoMarketIndex.tsx` | Store scraped Mercari sold prices with IQR-cleaned averages |
| `app/marketplace/page.tsx` | Card series list from `card_series` table |

### `profiles` / `auth.users` tables
| File | Description |
|------|-------------|
| `app/profile/[id]/page.tsx` | Query: `supabase.from('profiles').select('*').eq('pkt_id', id).single()` |
| `app/profile/user/page.tsx` | Fetch portfolio stats, member level, XP, rating, badges, recent transactions, reviews, streaks |
| `app/profile/user/settings/page.tsx` | Fetch display_name, handle, bio, email, 2FA status from profiles/auth tables |
| `app/admin/users/page.tsx` | Fetch all users with role JOIN |

### `user_portfolio` / `user_collections` tables
| File | Description |
|------|-------------|
| `app/components/home/PortfolioRewards.tsx` | Create `user_portfolio` table with card_id, quantity, condition; compute HKD net worth |
| `app/profile/user/collection/page.tsx` | Fetch user's card collection with JOIN `listings` for current prices |
| `app/profile/user/collection/page.tsx` | Portfolio summary stats via aggregation |

### `user_favorites` table
| File | Description |
|------|-------------|
| `app/components/home/FollowingFeed.tsx` | Create compound index on `(user_id, listing_id)` and `(user_id, merchant_id)` |

### `user_check_ins` / `user_streaks` tables
| File | Description |
|------|-------------|
| `app/components/home/PortfolioRewards.tsx` | UNIQUE constraint on `(user_id, check_in_date)`, `FOR UPDATE` row-level lock |
| `app/profile/user/page.tsx` | Fetch streak and reward status |

### `user_points` table
| File | Description |
|------|-------------|
| `app/profile/[id]/page.tsx` | Points balance from aggregation |

### `merchant_profiles` table
| File | Description |
|------|-------------|
| `app/profile/merchant/page.tsx` | Revenue stats from `orders` aggregation |
| `app/profile/merchant/settings/page.tsx` | Shop name from `merchant_profiles.shop_name` |
| `app/profile/merchant/finance/page.tsx` | Stripe Connect payout summary |
| `app/profile/merchant/finance/page.tsx` | Transaction history from `payout_transactions` table |

### `kyc_applications` table
| File | Description |
|------|-------------|
| `app/admin/approvals/page.tsx` | Fetch KYC applications WHERE status IN ('pending', 'approved', 'rejected') |

### `notification_settings` table
| File | Description |
|------|-------------|
| `app/profile/user/settings/page.tsx` | Notification preferences from `notification_settings` |

### `user_preferences` table
| File | Description |
|------|-------------|
| `app/settings/page.tsx` | Language/currency values from `user_preferences` |

### `platform_settings` table
| File | Description |
|------|-------------|
| `app/admin/settings/page.tsx` | Scraper last-run timestamps from `scraper_jobs.last_run_at` |
| `app/admin/settings/page.tsx` | API keys and statuses from `api_credentials` |
| `app/admin/settings/page.tsx` | Commission rate from `platform_settings` |
| `app/admin/page.tsx` | Platform metrics from `orders`, `stripe_payouts`, `sessions` aggregations |
| `app/admin/page.tsx` | Live health checks — ping each service endpoint |

---

## RLS Policies Required

| Table | Policy | Description |
|-------|--------|-------------|
| `listings` | Escrow lock | When `use_authentication = true`, enforce `account_type = 'merchant'` AND `kyc_status = 'verified'` |
| `listings` | Purchase lock | On `escrow_locked` status, block duplicate payment requests from other users |
| `user_check_ins` | Anti-cheat | UNIQUE constraint + atomic transaction with `FOR UPDATE` row-level lock |

---

## Indexes Required

| Table | Columns | Type | Reason |
|-------|---------|------|--------|
| `user_favorites` | `(user_id, listing_id)` | Compound | Following feed JOIN optimization |
| `user_favorites` | `(user_id, merchant_id)` | Compound | Merchant following query |
| `listings` | `price_delta_percentage` | Partial (`<= -10`) | Sniper radar WHERE clause |
| `card_catalog` | `card_number` | B-tree | Millisecond autocomplete search |
