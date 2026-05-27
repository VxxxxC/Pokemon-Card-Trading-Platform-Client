# API Integration Requirements

This document tracks all external API integrations and internal API endpoints that need to be implemented.

## External API Integrations

### TCGdex API (Card Catalog Data)
**Location**: `app/admin/database/page.tsx:52`
- **Purpose**: Fetch Pokemon card metadata and pricing
- **Endpoint**: TCGdex REST API
- **Update Frequency**:
  - Top 100 hot cards: 4 times per day
  - Regular cards: 1 time per day
- **Data Flow**:
  1. Fetch card data from TCGdex API
  2. Transform to platform schema
  3. UPDATE `price_cache` table in Supabase
  4. UPDATE `card_catalog` table with metadata
- **Error Handling**: Log failures, retry with exponential backoff
- **Rate Limiting**: Respect TCGdex API rate limits

**Location**: `app/components/cards/CardItem.tsx:85`
- **Purpose**: Card detail page data source
- **Note**: `/listing/[id]` route needs TCGdex integration for card metadata

### Mercari JP Scraper (Market Price Data)
**Location**: `app/components/ticker/PriceTicker.tsx:4`
- **Purpose**: Real-time card valuations from Japanese market
- **Provider**: Apify + Japanese residential proxy
- **Data Source**: Mercari JP sold listings (actual transaction prices)
- **Update Frequency**:
  - Popular cards: Every 6 hours
  - Standard cards: Daily
- **Implementation**:
  1. Scheduled job via Supabase Edge Function
  2. Apify actor for scraping
  3. Parse sold listing prices
  4. Store in `price_feed` table
  5. Push updates via Supabase Realtime
- **Data Points**: Card name, sold price, sold date, condition, seller rating

**Location**: `app/admin/settings/page.tsx:72`
- **Purpose**: Manual trigger for scraper job
- **Requirements**:
  - Server action to trigger Apify actor
  - Update `scraper_jobs.last_run_at` timestamp
  - Track job status and errors

### SKUNK Price API (Alternative Market Data)
**Location**: `app/components/ticker/PriceTicker.tsx:4`
- **Purpose**: Secondary price data source for validation
- **Use Case**: Cross-reference with Mercari data, fill gaps
- **Integration**: REST API calls via Edge Function

### Stripe Connect API (Payment Processing)

#### Account Management
**Location**: `app/profile/merchant/finance/page.tsx:82`
- **Endpoint**: `stripe.accounts.createLoginLink(accountId)`
- **Purpose**: Generate secure link to Stripe Express Dashboard
- **Data Source**: `merchant_profiles.stripe_account_id`
- **Requirements**:
  - Verify merchant ownership
  - Generate time-limited access token
  - Redirect to Stripe dashboard

#### Payment Processing
**Location**: `app/components/cards/CardItem.tsx:83`
- **Endpoint**: `stripe.paymentIntents.create()`
- **Purpose**: Process direct purchase (Buy Now)
- **Flow**:
  1. Create PaymentIntent for deposit amount (10-20%)
  2. Store payment details in `orders` table
  3. Lock listing via status update
  4. Redirect to Stripe Checkout or use Elements
- **Webhook**: Handle payment confirmation via `/api/webhooks/stripe`

#### Balance & Payout Queries
**Location**: `app/profile/merchant/finance/page.tsx:8`
- **Endpoint**: `stripe.balance.retrieve()`
- **Purpose**: Fetch merchant's available balance and pending payouts
- **Requirements**: Query for connected account
- **Caching**: Cache for 5 minutes to reduce API calls

## Internal API Endpoints

### Search & Filtering

#### Card Search
**Location**: `app/components/marketplace/MarketplaceHeader.tsx:49`
- **Endpoint**: `/api/search/cards`
- **Method**: GET
- **Query Params**: `q` (search term), `limit`, `offset`
- **Data Source**:
  - Supabase `listings` table with `.textSearch('card_name', query)`
  - Fallback to TCGdex API for card suggestions
- **Response**: Array of matching cards with images and prices
- **Caching**: Redis cache for popular searches (5 min TTL)

#### Category Filtering
**Location**: `app/components/marketplace/MarketplaceHeader.tsx:62`
- **Endpoint**: `/api/listings`
- **Method**: GET
- **Query Params**: `category` (sar, ur, sr, ar), `page`, `limit`
- **Requirements**:
  - Update URL search params (?category=sar)
  - Re-filter Supabase listings query
- **Response**: Paginated listing results

**Location**: `app/marketplace/page.tsx:240`
- **Endpoint**: `/api/search/fulltext`
- **Method**: GET
- **Query Params**: `query`, `filters[]`
- **Requirements**: Supabase full-text search on `listings` table
- **Response**: Ranked search results with highlights

### Real-Time Data Feeds

#### Transaction Wall
**Location**: `app/components/transactions/TransactionWall.tsx:1`
- **Protocol**: Supabase Realtime WebSocket subscription
- **Channel**: `transactions` table INSERT events
- **Frequency**: Real-time on INSERT
- **Optimization**:
  - Cache last 20 transactions in Redis
  - Frontend polls every 30-60 seconds instead of direct WebSocket (for non-authenticated users)
  - Authenticated users can use WebSocket
- **Data**: Transaction ID, buyer (anonymized), card name, price, timestamp

#### Price Ticker Feed
**Location**: `app/components/ticker/PriceTicker.tsx:3`
- **Protocol**: Supabase Realtime subscription on `price_feed` table
- **Fallback**: Polling every 60 seconds for high-traffic pages
- **Data Source**: Live data from Mercari scraper + TCGdex
- **Requirements**:
  - Subscribe to price updates
  - Display moving ticker with smooth animation
  - Update prices without page refresh

### Data Aggregation Endpoints

#### Platform Metrics (Admin Dashboard)
**Location**: `app/admin/page.tsx:8`
- **Endpoint**: `/api/admin/metrics`
- **Method**: GET
- **Authentication**: Admin role required
- **Data Sources**:
  - Query `orders` table (total revenue, order count)
  - Query `stripe_payouts` table (commission revenue)
  - Query `sessions` table (active user count)
- **Aggregations**: SUM, COUNT, AVG grouped by time period
- **Response**: Platform-wide statistics

**Location**: `app/admin/page.tsx:16`
- **Endpoint**: `/api/admin/recent-orders`
- **Method**: GET
- **Authentication**: Admin role required
- **Query**: Supabase Realtime subscription on `orders` table
- **Join**: `users` and `listings` tables
- **Order**: created_at DESC, limit 5
- **Response**: Recent order details for monitoring

#### Service Health Checks
**Location**: `app/admin/page.tsx:25`
- **Endpoint**: `/api/admin/health`
- **Method**: GET
- **Authentication**: Admin role required
- **Requirements**:
  - Ping Supabase (database connection test)
  - Ping Stripe API (check API key validity)
  - Ping TCGdex (check external service availability)
  - Measure response latency for each service
- **Response**: Service status and latency metrics
- **Update**: Real-time health monitoring

#### User Portfolio Stats
**Location**: `app/profile/user/collection/page.tsx:33`
- **Endpoint**: `/api/user/portfolio/stats`
- **Method**: GET
- **Authentication**: User must be authenticated
- **Data Sources**:
  - `user_collections` table (owned cards)
  - `price_history` table (current valuations)
  - `listings` table (market prices)
- **Aggregations**:
  - Total portfolio value (SUM of current prices)
  - Number of unique cards
  - Top performing cards (biggest % gains)
  - Total purchase cost vs current value
- **Response**: Portfolio summary statistics

#### Merchant Revenue Stats
**Location**: `app/profile/merchant/page.tsx:9`
- **Endpoint**: `/api/merchant/revenue`
- **Method**: GET
- **Authentication**: Merchant role required
- **Query**: Aggregate `orders` table WHERE seller_id = current user
- **Group By**: Time period (day, week, month)
- **Response**: Revenue trends and statistics

### User Data Queries

#### User Favorites/Following
**Location**: `app/page.tsx:10`
- **Endpoint**: `/api/user/following-feed`
- **Method**: GET
- **Authentication**: Optional (different data for logged in vs out)
- **Logged In**:
  - Query `user_favorites` table
  - JOIN `listings` for current lowest prices
  - Show followed cards/merchants' latest listings
- **Logged Out**: Show global popular recommendations
- **Optimization**: Use compound index on `(user_id, listing_id)` and `(user_id, merchant_id)`

#### User Check-in Status
**Location**: `app/profile/user/page.tsx:61`
- **Endpoint**: `/api/user/checkin-status`
- **Method**: GET
- **Authentication**: User must be authenticated
- **Query**: Fetch from `user_streaks` table for current user
- **Response**: Streak count, last check-in date, reward status

#### User Points Balance
**Location**: `app/profile/[id]/page.tsx:663`
- **Endpoint**: `/api/user/points`
- **Method**: GET
- **Authentication**: User must be authenticated
- **Query**: Aggregate `user_points` table for current user
- **Response**: Total points balance

### Listing Management

#### Fetch Listings with Filters
**Location**: `app/marketplace/page.tsx:9`
- **Endpoint**: `/api/listings`
- **Method**: GET
- **Query Params**: `category`, `rarity`, `minPrice`, `maxPrice`, `grade`, `series`
- **Requirements**: Replace client-side filtering with server-side Supabase query
- **Optimization**: Use indexed fields for fast filtering
- **Response**: Paginated listing results

**Location**: `app/marketplace/page.tsx:181`
- **Note**: Client-side filtering should be replaced with query params passed to this endpoint

#### Listing Count
**Location**: `app/marketplace/page.tsx:217`
- **Endpoint**: `/api/listings/count`
- **Method**: GET
- **Query Params**: Same filters as listing query
- **Requirements**: COUNT query on `listings` table with filters
- **Response**: Total count of matching listings

#### Sniper Radar (Price Delta)
**Location**: Description in HKcardvault spec Section 4
- **Endpoint**: `/api/listings/deals`
- **Method**: GET
- **Requirements**:
  - Query listings WHERE `price_delta_percentage <= -10`
  - Pre-computed field updated by Supabase Trigger
  - Compare listing price vs Mercari average price
- **Response**: Cards priced below market average

### Orders & Transactions

#### User Orders (Buyer)
**Location**: `app/profile/user/orders/page.tsx:24`
- **Endpoint**: `/api/orders/buyer`
- **Method**: GET
- **Authentication**: User must be authenticated
- **Query**: `orders` table WHERE buyer_id = current user
- **Filter**: Active orders (status NOT IN 'released', 'cancelled')
- **Order**: updated_at DESC
- **Response**: User's purchase orders

**Location**: `app/profile/user/orders/page.tsx:54`
- **Endpoint**: `/api/orders/buyer/history`
- **Method**: GET
- **Authentication**: User must be authenticated
- **Query**: Completed orders (status = 'released')
- **Limit**: 20
- **Response**: Order history

#### Merchant Orders (Seller)
**Location**: `app/profile/merchant/page.tsx:17`
- **Endpoint**: `/api/orders/seller/pending`
- **Method**: GET
- **Authentication**: Merchant role required
- **Query**: `orders` table WHERE seller_id = current user
- **Filter**: status IN ('pending_confirmation', 'pending_shipment', 'grading')
- **Order**: created_at ASC
- **Response**: Orders requiring merchant action

**Location**: `app/profile/merchant/page.tsx:25`
- **Endpoint**: `/api/orders/seller/completed`
- **Method**: GET
- **Authentication**: Merchant role required
- **Query**: Completed sales (status = 'completed')
- **Limit**: 5
- **Response**: Recent completed sales

**Location**: `app/profile/merchant/sales/page.tsx:23`
- **Endpoint**: `/api/orders/seller`
- **Method**: GET
- **Authentication**: Merchant role required
- **Query**: All sales orders for merchant
- **Order**: created_at DESC
- **Response**: Full sales order list

### Admin Queries

#### KYC Applications
**Location**: `app/admin/approvals/page.tsx:21`
- **Endpoint**: `/api/admin/kyc/applications`
- **Method**: GET
- **Authentication**: Admin role required
- **Query**: `kyc_applications` table WHERE status IN ('pending', 'approved', 'rejected')
- **Order**: submitted_at DESC
- **Response**: KYC application list with user details

#### User Management
**Location**: `app/admin/users/page.tsx:22`
- **Endpoint**: `/api/admin/users`
- **Method**: GET
- **Authentication**: Admin role required
- **Query Params**: `search`, `role`, `page`, `limit`
- **Query**: `profiles` table with role JOIN
- **Filter**: `.ilike('name', %${query}%)` and `.eq('role', selectedRole)`
- **Order**: join_date DESC
- **Response**: Paginated user list

#### Card Database Management
**Location**: `app/admin/database/page.tsx:20`
- **Endpoint**: `/api/admin/cards`
- **Method**: GET
- **Authentication**: Admin role required
- **Query**: `card_catalog` table JOIN `price_cache`
- **Filter**: needsReview flag
- **Response**: Cards requiring admin review

#### Platform Settings
**Location**: `app/admin/settings/page.tsx:73`
- **Endpoint**: `/api/admin/settings/scrapers`
- **Method**: GET
- **Authentication**: Admin role required
- **Query**: `scraper_jobs.last_run_at` from Supabase
- **Response**: Scraper job status and timestamps

**Location**: `app/admin/settings/page.tsx:120`
- **Endpoint**: `/api/admin/settings/credentials`
- **Method**: GET
- **Authentication**: Admin role required
- **Query**: `api_credentials` table
- **Response**: Masked API keys and service status

**Location**: `app/admin/settings/page.tsx:168`
- **Endpoint**: `/api/admin/settings/commission`
- **Method**: GET
- **Authentication**: Admin role required
- **Query**: `platform_settings.commission_rate`
- **Response**: Current platform commission rate

### Storage & File Uploads

#### Listing Photos
**Location**: `app/profile/merchant/inventory/page.tsx:132`
- **Endpoint**: Supabase Storage API
- **Bucket**: `listing-photos`
- **Path**: `${listingId}/${photoIndex}`
- **Requirements**:
  - Accept multiple files (4-6 images)
  - Transform to WebP format
  - Compress and resize
  - Upload to bunny.net CDN
  - Store URLs in `listings.photos` array
- **Validation**: File size, type, dimensions

#### KYC Documents
**Location**: `app/profile/user/settings/page.tsx:140`
- **Endpoint**: Supabase Storage API
- **Bucket**: `kyc-docs`
- **Path**: `${userId}/${timestamp}`
- **Requirements**:
  - Accept identity documents (ID, passport, business license)
  - Secure storage with encryption at rest
  - Access restricted to admin users
  - Create signed URL for admin review
- **Validation**: File type, size limits

**Location**: `app/admin/approvals/page.tsx:121`
- **Endpoint**: `supabase.storage.from('kyc-docs').createSignedUrl(appId)`
- **Purpose**: Admin review of uploaded KYC documents
- **Requirements**: Generate time-limited signed URL
- **Response**: Secure document URL

## Rate Limiting & Caching

### Cache Strategy
- **Popular Searches**: Redis cache, 5 min TTL
- **Card Metadata**: CDN cache, 1 hour TTL
- **Price Feed**: Redis cache, 1 min TTL
- **User Portfolio**: Redis cache, 10 min TTL
- **Platform Metrics**: Redis cache, 5 min TTL

### Rate Limits (per IP/user)
- **Search API**: 60 requests/min
- **Listing API**: 100 requests/min
- **Admin API**: 1000 requests/min
- **Stripe Webhooks**: No limit (verify signature)

## Implementation Priority

### Phase 1 - Month 2 (Critical)
1. Stripe Connect Payment Intent API
2. Listing Query & Filtering API
3. User Authentication API
4. Order Management API (buyer & seller)

### Phase 2 - Month 2-3 (High Priority)
1. Mercari JP Scraper Integration
2. TCGdex API Integration
3. Real-time Transaction Wall
4. Price Ticker Feed
5. Storage API for Listing Photos

### Phase 3 - Month 3 (Medium Priority)
1. Search & Full-text API
2. Portfolio Stats API
3. KYC Document Storage
4. Admin Dashboard Metrics
5. Health Check API

### Phase 4 - Month 4 (Nice to Have)
1. SKUNK Price API Integration
2. Advanced Analytics API
3. Notification System API
4. Chat/Messaging API

## Security & Best Practices

### All API Endpoints Must:
1. Validate authentication token
2. Check authorization (role-based access)
3. Sanitize and validate input
4. Use parameterized queries (prevent SQL injection)
5. Implement rate limiting
6. Log requests for audit trail
7. Return proper HTTP status codes
8. Handle errors gracefully
9. Use HTTPS only
10. Implement CORS properly

### External API Integration:
1. Use environment variables for API keys
2. Implement retry logic with exponential backoff
3. Set reasonable timeouts
4. Log all external API calls
5. Monitor API usage and costs
6. Have fallback data sources where possible
