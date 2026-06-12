# API Integration TODO Tracker

> This document tracks all frontend locations that require **API integration** (external services, data fetching endpoints, third-party connections).
> Each entry maps to a `TODO: [API]` comment in the codebase.

---

## Price & Market Data APIs

| File | Description |
|------|-------------|
| `app/components/ticker/PriceTicker.tsx` | Connect to Mercari JP scraper or SKUNK price API for real-time card valuations in HKD |
| `app/page.tsx` | Connect to Mercari JP scraper for real-time box series pricing converted to HKD |
| `app/components/home/SniperRadar.tsx` | Fetch sniper radar data — compare HK seller prices vs Mercari JP sold prices via Apify scraper |
| `app/components/home/TokyoMarketIndex.tsx` | Fetch Tokyo market reference data from Apify scraper — Mercari JP sold-out prices converted to HKD |

## Card Catalog & Search APIs

| File | Description |
|------|-------------|
| `app/components/home/HeroSearch.tsx` | Connect search to Supabase `card_catalog` table for real-time card lookup by set number |
| `app/components/marketplace/MarketplaceHeader.tsx` | Search onChange must query Supabase `listings` with `.textSearch()` or TCGdex API |
| `app/marketplace/page.tsx` | Connect to Supabase full-text search on `listings` table |

## Listing & Trading APIs

| File | Description |
|------|-------------|
| `app/components/cards/CardItem.tsx` | "即時出價" must open bid modal and submit to `bids` table with user auth check |
| `app/components/home/PremiumMarket.tsx` | Lock listing status to `escrow_locked` after deposit payment |
| `app/components/home/NewArrivals.tsx` | "即時出價" submits to `bids` table with auth check |
| `app/components/home/FollowingFeed.tsx` | Fetch user's following feed from Supabase — JOIN `user_favorites` + `listings` for lowest-price followed cards |
| `app/components/home/PremiumMarket.tsx` | Fetch premium escrow listings — only verified merchant accounts |
| `app/components/home/NewArrivals.tsx` | Fetch C2C new arrivals — query `listings` WHERE `seller_type='individual'` |
| `app/components/home/PortfolioRewards.tsx` | Fetch user portfolio value — aggregate `user_portfolio` table card values in HKD |

## User & Merchant APIs

| File | Description |
|------|-------------|
| `app/components/marketplace/MarketplaceHeader.tsx` | Category filter onChange must update URL params and re-filter listings |
| `app/profile/merchant/analytics/page.tsx` | Fetch per-SKU analytics aggregation from `listing_analytics` (views, watchers, price history) + Supabase Realtime live stream |
| `app/components/merchant/NewListingForm.tsx` | "搜尋" must query card catalog API (`cards` full-text search) and autofill set/cardNo |
| `app/admin/users/page.tsx` | Search input and role filter — connect to Supabase `.ilike()` and `.eq()` queries |
| `app/marketplace/page.tsx` | Update URL search params on filter change for shareable links |

## Admin APIs

| File | Description |
|------|-------------|
| `app/admin/settings/page.tsx` | Stripe, TCGdex, Mercari API key management and live status checks |
