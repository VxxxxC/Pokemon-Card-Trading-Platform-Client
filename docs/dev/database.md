# Database Schema & Data Requirements

This document tracks all database tables, queries, and data operations that need to be implemented in Supabase (PostgreSQL).

## Core Tables Overview

### Authentication & User Management
- `auth.users` - Supabase Auth managed table
- `profiles` - User profile data and metadata
- `user_preferences` - User settings (language, currency, notifications)
- `user_points` - Point/reward ledger
- `user_streaks` - Daily check-in tracking
- `user_badges` - Earned achievements
- `user_collections` - User's owned cards
- `user_favorites` - Followed cards and merchants

### Trading & Marketplace
- `listings` - Card listings for sale
- `orders` - Purchase orders and escrow transactions
- `bids` - Offer-based trading bids
- `transactions` - Completed transaction log
- `escrow_steps` - Escrow state tracking

### Card Catalog & Pricing
- `card_catalog` - Master card database
- `card_series` - Card set/series metadata
- `price_cache` - Cached price data from TCGdex
- `price_feed` - Live price updates stream
- `price_history` - Historical price trends

### Merchant & KYC
- `merchant_profiles` - Merchant-specific data
- `kyc_applications` - KYC verification requests
- `payout_transactions` - Stripe payout history

### Platform Operations
- `platform_settings` - Global configuration
- `api_credentials` - External service credentials
- `scraper_jobs` - Background job tracking
- `notification_settings` - User notification preferences

## Detailed Table Schema & TODO Mappings

### profiles Table
**Purpose**: Extended user profile data beyond Supabase Auth

**Referenced In**:
- `app/profile/user/settings/page.tsx:22` - display_name field
- `app/profile/user/settings/page.tsx:34` - handle field
- `app/profile/user/settings/page.tsx:49` - bio field
- `app/profile/user/settings/page.tsx:79` - two_factor_enabled field
- `app/profile/user/settings/page.tsx:161` - role field update
- `app/profile/user/page.tsx:27` - member level, XP, rating
- `app/profile/page.tsx:14` - role-based routing
- `app/profile/merchant/settings/page.tsx:16` - N/A (use merchant_profiles)
- `app/admin/users/page.tsx:22` - user list with role JOIN
- `app/admin/users/page.tsx:140` - is_banned field
- `app/admin/approvals/page.tsx:135` - role update to MERCHANT

**Schema**:
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  handle TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'USER' CHECK (role IN ('USER', 'MERCHANT', 'PENDING_MERCHANT', 'ADMIN')),
  is_banned BOOLEAN DEFAULT FALSE,
  member_level INTEGER DEFAULT 1,
  xp INTEGER DEFAULT 0,
  rating DECIMAL(3,2) DEFAULT 5.00,
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_handle ON profiles(handle);
CREATE INDEX idx_profiles_is_banned ON profiles(is_banned) WHERE is_banned = TRUE;
```

**RLS Policies**:
- Users can read their own profile
- Users can update their own display_name, handle, bio
- Only admins can update role and is_banned
- Public profiles are readable by all (for /profile/[id])

---

### listings Table
**Purpose**: Card listings for marketplace

**Referenced In**:
- `app/marketplace/page.tsx:9` - fetch with filters
- `app/marketplace/page.tsx:181` - client-side filtering (to be replaced)
- `app/marketplace/page.tsx:217` - count query
- `app/marketplace/page.tsx:240` - full-text search
- `app/components/marketplace/MarketplaceGrid.tsx:3` - listing data
- `app/components/cards/CardGrid.tsx:3` - featured listings
- `app/components/cards/CardItem.tsx:85` - listing detail page
- `app/profile/merchant/inventory/page.tsx:23` - merchant's listings
- `app/profile/merchant/inventory/page.tsx:166-167` - insert draft/active
- HKcardvault spec Section 4 - price_delta_percentage field

**Schema**:
```sql
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_catalog(id),
  card_name TEXT NOT NULL,
  card_number TEXT,
  series_code TEXT,
  rarity TEXT CHECK (rarity IN ('C', 'U', 'R', 'RR', 'RRR', 'SR', 'SSR', 'UR', 'SAR', 'AR', 'PROMO')),
  grade_service TEXT CHECK (grade_service IN ('PSA', 'BGS', 'CGC', 'RAW')),
  grade_value DECIMAL(3,1),
  condition TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_delta_percentage DECIMAL(5,2), -- Pre-computed: (listing_price - market_avg) / market_avg * 100
  buy_now_enabled BOOLEAN DEFAULT TRUE,
  offer_enabled BOOLEAN DEFAULT TRUE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'cancelled', 'escrow_locked')),
  photos TEXT[] NOT NULL, -- Array of CDN URLs
  description TEXT,
  use_authentication BOOLEAN DEFAULT FALSE, -- Requires KYC merchant
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_status ON listings(status) WHERE status = 'active';
CREATE INDEX idx_listings_rarity ON listings(rarity);
CREATE INDEX idx_listings_series ON listings(series_code);
CREATE INDEX idx_listings_price ON listings(price);
CREATE INDEX idx_listings_price_delta ON listings(price_delta_percentage) WHERE price_delta_percentage <= -10;
CREATE INDEX idx_listings_search ON listings USING gin(to_tsvector('english', card_name));
```

**RLS Policies**:
- All users can read active listings
- Only seller can read their own draft listings
- Only seller can update their own listings
- Only verified merchants can create listings with use_authentication = TRUE

**Triggers**:
- Update `updated_at` on row modification
- Recalculate `price_delta_percentage` when price changes or market data updates

---

### orders Table
**Purpose**: Purchase orders and escrow transactions

**Referenced In**:
- `app/admin/page.tsx:8` - platform metrics aggregation
- `app/admin/page.tsx:16` - recent orders
- `app/components/cards/CardItem.tsx:83` - create order on direct purchase
- `app/profile/user/orders/page.tsx:24` - buyer's active orders
- `app/profile/user/orders/page.tsx:54` - buyer's completed orders
- `app/profile/user/orders/page.tsx:163` - order messaging
- `app/profile/merchant/page.tsx:9` - revenue aggregation
- `app/profile/merchant/page.tsx:17` - pending orders
- `app/profile/merchant/page.tsx:25` - completed sales
- `app/profile/merchant/sales/page.tsx:23` - all sales orders
- `app/profile/merchant/sales/page.tsx:113` - status updates

**Schema**:
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL, -- Human-readable ID: ORD-YYYYMMDD-XXXXX
  buyer_id UUID NOT NULL REFERENCES profiles(id),
  seller_id UUID NOT NULL REFERENCES profiles(id),
  listing_id UUID NOT NULL REFERENCES listings(id),

  -- Pricing
  item_price DECIMAL(10,2) NOT NULL,
  deposit_amount DECIMAL(10,2) NOT NULL, -- 10-20% deposit
  final_amount DECIMAL(10,2) NOT NULL, -- Remaining balance
  platform_fee DECIMAL(10,2) NOT NULL,
  shipping_subsidy DECIMAL(10,2) DEFAULT 0,

  -- Payment tracking
  stripe_deposit_intent_id TEXT,
  stripe_final_intent_id TEXT,

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending_deposit' CHECK (status IN (
    'pending_deposit',
    'pending_confirmation', -- Awaiting merchant confirmation
    'pending_shipment',     -- Ready to ship
    'in_transit',
    'grading',              -- Platform inspection
    'pending_final_payment',
    'completed',
    'released',             -- Funds released to seller
    'disputed',
    'cancelled'
  )),

  -- Escrow tracking
  escrow_locked_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  grading_completed_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,

  -- Communication
  buyer_notes TEXT,
  seller_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_seller ON orders(seller_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_listing ON orders(listing_id);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
```

**RLS Policies**:
- Buyers can read their own orders (buyer_id = current_user)
- Sellers can read their own orders (seller_id = current_user)
- Admins can read all orders
- Only buyer/seller can update their respective notes
- Only system/admin can update status

---

### user_streaks Table
**Purpose**: Daily check-in tracking and streak rewards

**Referenced In**:
- `app/components/profile/CheckInWidget.tsx:118` - persist check-in
- `app/profile/user/page.tsx:61` - streak status
- `app/profile/[id]/page.tsx:643` - reward redemption

**Schema**:
```sql
CREATE TABLE user_streaks (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  streak_days INTEGER DEFAULT 0,
  last_checkin TIMESTAMPTZ,
  reward_claimed BOOLEAN DEFAULT FALSE,
  total_checkins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent double check-in on same day
  CONSTRAINT unique_checkin_per_day UNIQUE (user_id, last_checkin::DATE)
);

CREATE INDEX idx_user_streaks_last_checkin ON user_streaks(last_checkin);
```

**Stored Procedure for Check-in** (Anti-cheat):
```sql
CREATE OR REPLACE FUNCTION checkin_user(p_user_id UUID)
RETURNS TABLE (
  success BOOLEAN,
  new_streak INTEGER,
  points_awarded INTEGER,
  message TEXT
) AS $$
DECLARE
  v_last_checkin TIMESTAMPTZ;
  v_streak INTEGER;
  v_server_time TIMESTAMPTZ := timezone('Asia/Hong_Kong', now());
  v_today DATE := v_server_time::DATE;
BEGIN
  -- Lock row to prevent concurrent check-ins
  SELECT last_checkin, streak_days INTO v_last_checkin, v_streak
  FROM user_streaks
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- Check if already checked in today
  IF v_last_checkin::DATE = v_today THEN
    RETURN QUERY SELECT FALSE, v_streak, 0, '今天已經簽到過了';
    RETURN;
  END IF;

  -- Determine if streak continues
  IF v_last_checkin::DATE = v_today - 1 THEN
    v_streak := v_streak + 1;
  ELSE
    v_streak := 1; -- Reset streak
  END IF;

  -- Update streak
  UPDATE user_streaks
  SET
    streak_days = v_streak,
    last_checkin = v_server_time,
    total_checkins = total_checkins + 1,
    updated_at = v_server_time
  WHERE user_id = p_user_id;

  -- Award points (atomic transaction)
  INSERT INTO user_points (user_id, points, reason, created_at)
  VALUES (p_user_id, 50, 'daily_checkin', v_server_time);

  RETURN QUERY SELECT TRUE, v_streak, 50, '簽到成功！';
END;
$$ LANGUAGE plpgsql;
```

**RLS Policies**:
- Users can read their own streak data
- Only server functions can write to this table

---

### user_points Table
**Purpose**: Point/reward ledger for gamification

**Referenced In**:
- `app/components/profile/CheckInWidget.tsx:119` - award check-in points
- `app/profile/[id]/page.tsx:643` - claim reward points
- `app/profile/[id]/page.tsx:663` - points balance display

**Schema**:
```sql
CREATE TABLE user_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  reference_id UUID, -- Order ID, listing ID, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_points_user ON user_points(user_id);
CREATE INDEX idx_user_points_created ON user_points(created_at DESC);

-- View for current balance
CREATE VIEW user_points_balance AS
SELECT
  user_id,
  SUM(points) AS total_points,
  COUNT(*) AS transaction_count
FROM user_points
GROUP BY user_id;
```

**RLS Policies**:
- Users can read their own point history
- Only server functions can insert points

---

### kyc_applications Table
**Purpose**: KYC verification requests for merchant upgrade

**Referenced In**:
- `app/profile/user/settings/page.tsx:161` - submit KYC application
- `app/admin/approvals/page.tsx:21` - fetch pending applications
- `app/admin/approvals/page.tsx:121` - document retrieval
- `app/admin/approvals/page.tsx:135` - approve application
- `app/admin/approvals/page.tsx:142` - reject application

**Schema**:
```sql
CREATE TABLE kyc_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  -- Uploaded documents
  document_urls TEXT[] NOT NULL, -- Storage bucket URLs

  -- Business info (optional for business sellers)
  business_name TEXT,
  business_license TEXT,
  tax_id TEXT,

  -- Review
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,

  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kyc_user ON kyc_applications(user_id);
CREATE INDEX idx_kyc_status ON kyc_applications(status) WHERE status = 'pending';
CREATE INDEX idx_kyc_submitted ON kyc_applications(submitted_at DESC);
```

**RLS Policies**:
- Users can read their own applications
- Users can insert one application (if no pending exists)
- Only admins can update status and review fields
- Only admins can read document_urls

---

### merchant_profiles Table
**Purpose**: Merchant-specific data and Stripe account linkage

**Referenced In**:
- `app/profile/merchant/settings/page.tsx:16` - shop_name field
- `app/profile/merchant/finance/page.tsx:75` - stripe_account_id

**Schema**:
```sql
CREATE TABLE merchant_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  shop_name TEXT NOT NULL,
  shop_description TEXT,
  shop_logo_url TEXT,

  -- Stripe Connect
  stripe_account_id TEXT UNIQUE,
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,

  -- Merchant stats
  total_sales INTEGER DEFAULT 0,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 5.00,
  review_count INTEGER DEFAULT 0,

  -- Badges (道館主徽章系統)
  badges TEXT[], -- ['professional_gym_leader', 'hall_of_fame_collector']

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_merchant_stripe ON merchant_profiles(stripe_account_id);
```

**RLS Policies**:
- Merchants can read their own profile
- Merchants can update shop_name, shop_description
- Only system can update stripe_account_id and stats
- Public can read shop_name, shop_description, badges for marketplace

---

### card_catalog Table
**Purpose**: Master card database (TCGdex + manual entries)

**Referenced In**:
- `app/page.tsx:10` - card series with price feed
- `app/admin/database/page.tsx:20` - card entries needing review
- `app/admin/database/page.tsx:81` - manual card entry

**Schema**:
```sql
CREATE TABLE card_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_number TEXT NOT NULL,
  card_name TEXT NOT NULL,
  series_code TEXT NOT NULL,
  rarity TEXT,
  type TEXT, -- Pokemon type
  hp INTEGER,
  image_url TEXT,
  image_url_hires TEXT,

  -- Metadata
  tcgdex_id TEXT UNIQUE,
  needs_review BOOLEAN DEFAULT FALSE,
  last_synced_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_card_catalog_number ON card_catalog(card_number);
CREATE INDEX idx_card_catalog_series ON card_catalog(series_code);
CREATE INDEX idx_card_catalog_tcgdex ON card_catalog(tcgdex_id);
CREATE INDEX idx_card_catalog_review ON card_catalog(needs_review) WHERE needs_review = TRUE;
CREATE INDEX idx_card_catalog_search ON card_catalog USING gin(to_tsvector('english', card_name));
```

**RLS Policies**:
- Public read access for all cards
- Only admins can insert/update

---

### price_cache Table
**Purpose**: Cached price data from TCGdex and market sources

**Referenced In**:
- `app/admin/database/page.tsx:20` - JOIN with card_catalog for cachedAt
- `app/admin/database/page.tsx:52` - update cache from TCGdex

**Schema**:
```sql
CREATE TABLE price_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID REFERENCES card_catalog(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('tcgdex', 'mercari', 'skunk')),

  -- Price data
  avg_price DECIMAL(10,2),
  min_price DECIMAL(10,2),
  max_price DECIMAL(10,2),
  sample_size INTEGER,

  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_price_cache_card ON price_cache(card_id);
CREATE INDEX idx_price_cache_source ON price_cache(source);
CREATE INDEX idx_price_cache_expires ON price_cache(expires_at);
```

**Cleanup Job**: Regularly delete expired cache entries

---

### price_feed Table
**Purpose**: Live price update stream for real-time ticker

**Referenced In**:
- `app/components/ticker/PriceTicker.tsx:3` - Realtime subscription

**Schema**:
```sql
CREATE TABLE price_feed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_series TEXT NOT NULL,
  box_name TEXT NOT NULL,
  current_price DECIMAL(10,2) NOT NULL,
  price_delta DECIMAL(10,2),
  price_delta_pct DECIMAL(5,2),
  direction TEXT CHECK (direction IN ('up', 'down', 'neutral')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_price_feed_series ON price_feed(card_series);
CREATE INDEX idx_price_feed_created ON price_feed(created_at DESC);
```

**Realtime Subscription**: Enable Supabase Realtime for INSERT events

---

### transactions Table
**Purpose**: Completed transaction log for transaction wall

**Referenced In**:
- `app/components/transactions/TransactionWall.tsx:1` - Realtime subscription

**Schema**:
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id),
  buyer_handle TEXT NOT NULL, -- Anonymized or actual
  seller_handle TEXT NOT NULL,
  card_name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_created ON transactions(created_at DESC);
```

**Realtime Subscription**: Enable for INSERT events
**Optimization**: Cache last 20 in Redis, frontend polls every 30-60 sec

---

### user_collections Table
**Purpose**: User's owned card collection (virtual portfolio)

**Referenced In**:
- `app/profile/user/collection/page.tsx:21` - user's collection
- `app/profile/user/collection/page.tsx:33` - portfolio aggregation

**Schema**:
```sql
CREATE TABLE user_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID REFERENCES card_catalog(id),
  quantity INTEGER DEFAULT 1,
  purchase_price DECIMAL(10,2),
  purchase_date DATE,
  condition TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_collections_user ON user_collections(user_id);
CREATE INDEX idx_user_collections_card ON user_collections(card_id);
```

**Portfolio Value Query**:
```sql
SELECT
  uc.user_id,
  SUM(uc.quantity * COALESCE(pc.avg_price, uc.purchase_price)) AS total_value,
  COUNT(DISTINCT uc.card_id) AS unique_cards,
  SUM(uc.quantity) AS total_cards
FROM user_collections uc
LEFT JOIN price_cache pc ON uc.card_id = pc.card_id AND pc.source = 'tcgdex'
WHERE uc.user_id = $1
GROUP BY uc.user_id;
```

---

### user_favorites Table
**Purpose**: User's followed cards and merchants

**Referenced In**:
- HKcardvault spec Section 3 - My Following Feed
- `app/page.tsx:10` - following feed query (implicit)

**Schema**:
```sql
CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  merchant_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- User can favorite either a listing OR a merchant, not both
  CONSTRAINT chk_favorite_type CHECK (
    (listing_id IS NOT NULL AND merchant_id IS NULL) OR
    (listing_id IS NULL AND merchant_id IS NOT NULL)
  )
);

CREATE INDEX idx_user_favorites_user_listing ON user_favorites(user_id, listing_id);
CREATE INDEX idx_user_favorites_user_merchant ON user_favorites(user_id, merchant_id);
CREATE UNIQUE INDEX idx_unique_favorite_listing ON user_favorites(user_id, listing_id) WHERE listing_id IS NOT NULL;
CREATE UNIQUE INDEX idx_unique_favorite_merchant ON user_favorites(user_id, merchant_id) WHERE merchant_id IS NOT NULL;
```

**Compound Index Importance**: Per HKcardvault spec Section 3, must have compound indexes to prevent first-page load slowdown when user has many favorites.

---

### platform_settings Table
**Purpose**: Global platform configuration

**Referenced In**:
- `app/admin/settings/page.tsx:21` - shipping_subsidy_amount
- `app/admin/settings/page.tsx:167` - commission_rate
- `app/admin/settings/page.tsx:168` - commission_rate display

**Schema**:
```sql
CREATE TABLE platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pre-populate default settings
INSERT INTO platform_settings (key, value, description) VALUES
  ('commission_rate', '0.05', 'Platform commission rate (5%)'),
  ('shipping_subsidy_amount', '500', 'Shipping subsidy in JPY for 7-day streak reward'),
  ('enable_trading', 'true', 'Global trading enable/disable switch'),
  ('maintenance_mode', 'false', 'Emergency maintenance mode toggle');
```

**RLS Policies**:
- Public read access
- Only admins can update

---

### api_credentials Table
**Purpose**: Secure storage for external API keys

**Referenced In**:
- `app/admin/settings/page.tsx:120` - API keys and status
- `app/admin/settings/page.tsx:121` - update API key

**Schema**:
```sql
CREATE TABLE api_credentials (
  service TEXT PRIMARY KEY,
  api_key_encrypted TEXT NOT NULL, -- Use pgcrypto for encryption
  api_key_masked TEXT NOT NULL, -- Display: sk_live_••••
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'invalid', 'expired')),
  last_verified_at TIMESTAMPTZ,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services: stripe, tcgdex, mercari, skunk, bunnycdn
```

**Encryption**: Use Supabase Vault or pgcrypto for encryption at rest

---

### scraper_jobs Table
**Purpose**: Background job tracking for external data scrapers

**Referenced In**:
- `app/admin/settings/page.tsx:72` - trigger scraper job
- `app/admin/settings/page.tsx:73` - last_run_at timestamps

**Schema**:
```sql
CREATE TABLE scraper_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type TEXT NOT NULL CHECK (job_type IN ('mercari', 'skunk', 'tcgdex')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  cards_updated INTEGER DEFAULT 0,
  error_message TEXT,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_jobs_type ON scraper_jobs(job_type);
CREATE INDEX idx_scraper_jobs_status ON scraper_jobs(status);
```

---

### notification_settings Table
**Purpose**: User notification preferences

**Referenced In**:
- `app/profile/user/settings/page.tsx:184` - preference values
- `app/profile/user/settings/page.tsx:185` - toggle handlers

**Schema**:
```sql
CREATE TABLE notification_settings (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  email_order_updates BOOLEAN DEFAULT TRUE,
  email_price_drops BOOLEAN DEFAULT TRUE,
  email_marketing BOOLEAN DEFAULT FALSE,
  push_order_updates BOOLEAN DEFAULT TRUE,
  push_price_drops BOOLEAN DEFAULT TRUE,
  push_messages BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### user_preferences Table
**Purpose**: User UI/UX preferences

**Referenced In**:
- `app/settings/page.tsx:33` - language and currency

**Schema**:
```sql
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  language TEXT DEFAULT 'zh-TW' CHECK (language IN ('zh-TW', 'zh-CN', 'ja', 'en')),
  currency TEXT DEFAULT 'JPY' CHECK (currency IN ('JPY', 'HKD', 'TWD', 'USD')),
  theme TEXT DEFAULT 'dark' CHECK (theme IN ('dark')), -- Only dark mode for now
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### card_series Table
**Purpose**: Card set/series metadata for filtering and navigation

**Referenced In**:
- `app/marketplace/page.tsx:127` - series list query

**Schema**:
```sql
CREATE TABLE card_series (
  code TEXT PRIMARY KEY, -- sv4a, sv2a, etc.
  name TEXT NOT NULL,
  name_ja TEXT,
  release_date DATE,
  total_cards INTEGER,
  icon_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### bids Table
**Purpose**: Offer-based trading bids

**Referenced In**:
- `app/components/cards/CardItem.tsx:84` - submit bid

**Schema**:
```sql
CREATE TABLE bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES profiles(id),
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bids_listing ON bids(listing_id);
CREATE INDEX idx_bids_bidder ON bids(bidder_id);
CREATE INDEX idx_bids_status ON bids(status) WHERE status = 'pending';
```

---

### user_badges Table
**Purpose**: Earned achievements and merchant badges

**Referenced In**:
- `app/profile/user/page.tsx:37` - earned badges

**Schema**:
```sql
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL, -- 'professional_gym_leader', 'hall_of_fame_collector'
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, badge_code)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
```

---

### payout_transactions Table
**Purpose**: Stripe payout history for merchants

**Referenced In**:
- `app/admin/page.tsx:8` - platform metrics (Stripe payouts)
- `app/profile/merchant/finance/page.tsx:16` - merchant transaction history

**Schema**:
```sql
CREATE TABLE payout_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES profiles(id),
  stripe_payout_id TEXT UNIQUE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'JPY',
  status TEXT CHECK (status IN ('pending', 'paid', 'failed', 'canceled')),
  arrival_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payout_merchant ON payout_transactions(merchant_id);
CREATE INDEX idx_payout_date ON payout_transactions(created_at DESC);
```

---

## Row Level Security (RLS) Summary

### Critical RLS Policies

**listings Table (HKcardvault Spec Section 5)**:
```sql
-- Only KYC-verified merchants can create authenticated listings
CREATE POLICY "merchant_authenticated_listings" ON listings
FOR INSERT
WITH CHECK (
  CASE WHEN use_authentication = TRUE THEN
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'MERCHANT'
      AND EXISTS (
        SELECT 1 FROM kyc_applications
        WHERE kyc_applications.user_id = auth.uid()
        AND kyc_applications.status = 'approved'
      )
    )
  ELSE TRUE
  END
);

-- Prevent double-purchase via status lock
CREATE POLICY "prevent_escrow_locked_purchase" ON orders
FOR INSERT
WITH CHECK (
  NOT EXISTS (
    SELECT 1 FROM listings
    WHERE listings.id = listing_id
    AND listings.status = 'escrow_locked'
  )
);
```

**user_streaks Table (HKcardvault Spec Section 6)**:
```sql
-- Only server functions can write (anti-cheat)
CREATE POLICY "system_only_write" ON user_streaks
FOR ALL
USING (FALSE) -- No direct user writes
WITH CHECK (FALSE);
```

## Database Functions & Triggers

### Auto-update timestamps
```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_timestamp BEFORE UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- (repeat for other tables)
```

### Auto-calculate price_delta_percentage
```sql
CREATE OR REPLACE FUNCTION calculate_price_delta()
RETURNS TRIGGER AS $$
DECLARE
  v_market_avg DECIMAL(10,2);
BEGIN
  -- Fetch market average from price_cache
  SELECT avg_price INTO v_market_avg
  FROM price_cache
  WHERE card_id = (
    SELECT id FROM card_catalog
    WHERE card_number = NEW.card_number
    AND series_code = NEW.series_code
  )
  AND source = 'mercari'
  ORDER BY cached_at DESC
  LIMIT 1;

  IF v_market_avg IS NOT NULL AND v_market_avg > 0 THEN
    NEW.price_delta_percentage := ((NEW.price - v_market_avg) / v_market_avg) * 100;
  ELSE
    NEW.price_delta_percentage := NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_listing_delta BEFORE INSERT OR UPDATE OF price ON listings
FOR EACH ROW EXECUTE FUNCTION calculate_price_delta();
```

## Implementation Priority

### Phase 1 - Month 2 (Critical)
1. Core tables: profiles, listings, orders
2. Authentication & RLS setup
3. Basic indexes for performance
4. Stripe integration tables

### Phase 2 - Month 2-3 (High Priority)
1. Trading tables: bids, transactions
2. Merchant tables: merchant_profiles, kyc_applications, payout_transactions
3. Card catalog: card_catalog, price_cache, card_series
4. Anti-cheat functions for check-in

### Phase 3 - Month 3 (Medium Priority)
1. Gamification: user_streaks, user_points, user_badges
2. User preferences: user_preferences, notification_settings
3. Collections: user_collections, user_favorites
4. Real-time feeds: price_feed, transactions

### Phase 4 - Month 4 (Operations)
1. Platform operations: platform_settings, api_credentials, scraper_jobs
2. Performance optimization (indexes, materialized views)
3. Backup & disaster recovery setup
4. Monitoring & alerting

## Performance Optimization

### Compound Indexes (Critical)
Per HKcardvault spec:
- `user_favorites(user_id, listing_id)` - Section 3 防止首頁卡頓
- `user_favorites(user_id, merchant_id)` - Section 3 防止首頁卡頓
- `listings(status, price_delta_percentage)` - Section 4 狙擊雷達查詢
- `orders(seller_id, status, created_at)` - Merchant dashboard
- `orders(buyer_id, status, updated_at)` - User orders

### Materialized Views
```sql
-- Popular cards view (refresh hourly)
CREATE MATERIALIZED VIEW popular_cards AS
SELECT
  l.card_name,
  l.series_code,
  COUNT(*) AS listing_count,
  MIN(l.price) AS lowest_price,
  AVG(l.price) AS avg_price,
  SUM(l.view_count) AS total_views
FROM listings l
WHERE l.status = 'active'
GROUP BY l.card_name, l.series_code
ORDER BY total_views DESC
LIMIT 100;

CREATE UNIQUE INDEX ON popular_cards(card_name, series_code);
```

### Partitioning (Future)
For high-volume tables (orders, transactions, price_feed):
- Partition by created_at (monthly partitions)
- Improves query performance for recent data
- Facilitates data archival

## Backup & Maintenance

### Automated Tasks
1. **Daily**: Full database backup
2. **Hourly**: Refresh materialized views
3. **Daily**: Clean expired price_cache entries
4. **Weekly**: VACUUM ANALYZE all tables
5. **Monthly**: Archive old transactions to cold storage

### Monitoring
- Query performance (pg_stat_statements)
- Table bloat detection
- Index usage statistics
- Connection pool metrics
- Replication lag (if using read replicas)
