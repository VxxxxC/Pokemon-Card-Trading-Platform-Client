# API Implementation TODOs

All `TODO [API]` markers across the frontend codebase. Each item requires an **external API integration** or **internal API route** to be implemented.

---

## Current API Routes

| Route | Purpose | Status |
|-------|---------|--------|
| `/api/pokemon-cards` | Proxy to pokemontcg.io for development mock data | ✅ Implemented (dev only) |

## External APIs to Integrate

### pokemontcg.io (Development Only)

- **Endpoint**: `https://api.pokemontcg.io/v2/cards`
- **Used by**: `app/lib/pokemon-data.ts` — fetches card data for all homepage components
- **Status**: ✅ Working with 5s timeout + fallback to static data
- **Note**: This is a temporary development data source. In production, all card data will come from Supabase.

### Apify / Mercari JP Scraper

| File | Line | Description |
|------|------|-------------|
| `app/components/home/TokyoMarketIndex.tsx` | 8 | Connect to Apify scraper endpoint for Mercari JP real completed transaction prices |
| `app/admin/settings/page.tsx` | 72 | Trigger Mercari/SKUNK scraper job on demand |

- **Purpose**: Scrape Mercari JP sold-out listings for real market price data
- **Frequency**: Top 100 cards daily 4x, others daily 1x
- **Storage**: Results stored in Supabase `price_cache` table

### TCGdex API

| File | Line | Description |
|------|------|-------------|
| `app/admin/database/page.tsx` | 52 | Fetch Top-100 card data and update `price_cache` |

- **Purpose**: Card metadata and pricing reference
- **Frequency**: On-demand via admin trigger

### Stripe Connect API

| File | Line | Description |
|------|------|-------------|
| `app/profile/merchant/finance/page.tsx` | 75 | `stripe.balance.retrieve` for connected account |
| `app/profile/merchant/finance/page.tsx` | 82 | `stripe.accounts.createLoginLink(accountId)` for Express Dashboard |
| `app/components/cards/CardItem.tsx` | 63, 137 | `stripe.paymentIntents.create` for escrow PaymentIntent |
| `app/components/home/NewArrivals.tsx` | 103 | Stripe escrow PaymentIntent + listing lock |

### Supabase Auth API

| File | Line | Description |
|------|------|-------------|
| `app/profile/page.tsx` | 14 | `supabase.auth.getSession()` |
| `app/profile/user/settings/page.tsx` | 93 | `supabase.auth.updateUser()`, `sendPasswordRecovery()`, MFA enrollment |

### Supabase Storage API

| File | Line | Description |
|------|------|-------------|
| `app/admin/approvals/page.tsx` | 121 | `supabase.storage.from('kyc-docs').createSignedUrl(app.id)` |
| `app/profile/user/settings/page.tsx` | 140 | `supabase.storage.from('kyc-docs').upload(userId, file)` |
| `app/profile/merchant/inventory/page.tsx` | 132 | `supabase.storage.from('listing-photos').upload(...)` |

### Supabase Realtime

| File | Line | Description |
|------|------|-------------|
| `app/components/transactions/TransactionWall.tsx` | 6 | Subscribe to `transactions` table INSERT events |

## API Routes to Create

| Route | Purpose | Priority |
|-------|---------|----------|
| `POST /api/orders` | Create escrow order + Stripe PaymentIntent | High |
| `POST /api/bids` | Submit bid on a listing | High |
| `POST /api/listings` | Create/update listing (draft or active) | High |
| `POST /api/check-in` | Daily check-in with server-side timestamp | Medium |
| `POST /api/kyc/submit` | Submit KYC application | Medium |
| `POST /api/admin/approve-kyc` | Approve/reject KYC application | Medium |
| `POST /api/admin/ban-user` | Ban/unban user | Medium |
| `POST /api/admin/update-settings` | Update platform settings | Low |
| `POST /api/admin/trigger-scraper` | Trigger Mercari scraper job | Low |
| `GET /api/market-index` | Tokyo market index data (Mercari JP) | Medium |
| `GET /api/listings/featured` | Featured listings for homepage | High |
| `GET /api/listings/sniper` | Below-market-price deals | Medium |
| `GET /api/transactions/recent` | Recent transactions for ticker + wall | High |
