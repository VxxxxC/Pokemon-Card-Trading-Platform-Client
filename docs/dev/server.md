# Server-Side Implementation TODOs

All `TODO [server]` markers across the frontend codebase. Each item requires a **server action**, **API route**, or **server-side logic** to be implemented.

---

## Authentication & Authorization

| File | Line | Description |
|------|------|-------------|
| `app/profile/page.tsx` | 14 | Read auth session role from Supabase — `supabase.auth.getSession()` then check `user.user_metadata.role` |
| `app/components/home/FollowingFeed.tsx` | 25 | Check auth state — show personalized feed if logged in |
| `app/components/home/PortfolioDashboard.tsx` | 21 | Check auth state — show login prompt if not authenticated |

## Escrow & Payment (Stripe Connect)

| File | Line | Description |
|------|------|-------------|
| `app/components/cards/CardItem.tsx` | 63, 137 | "直接購買" must trigger escrow flow — create order in Supabase, initiate Stripe Connect PaymentIntent |
| `app/components/cards/CardItem.tsx` | 138 | "即時出價" must open bid modal and submit to `bids` table with user auth check |
| `app/components/home/NewArrivals.tsx` | 11 | "直接購買" sets listing status to `escrow_locked` — RLS blocks other buyers |
| `app/components/home/NewArrivals.tsx` | 103 | 直接購買 triggers Stripe escrow PaymentIntent + listing lock |
| `app/profile/merchant/finance/page.tsx` | 75 | Replace demo Stripe account ID with real connected account from `merchant_profiles.stripe_account_id` |
| `app/profile/merchant/finance/page.tsx` | 82 | Redirect to merchant's Stripe Express Dashboard — `stripe.accounts.createLoginLink(accountId)` |

## Listing Management

| File | Line | Description |
|------|------|-------------|
| `app/components/cards/CardItem.tsx` | 139 | `/listing/${card.id}` route does not exist yet — create `app/listing/[id]/page.tsx` |
| `app/profile/merchant/inventory/page.tsx` | 132 | Photo upload — implement with `supabase.storage.from('listing-photos').upload(...)` |
| `app/profile/merchant/inventory/page.tsx` | 166 | "儲存草稿" — INSERT into `listings` with `status='draft'` |
| `app/profile/merchant/inventory/page.tsx` | 167 | "立即上架" — INSERT into `listings` with `status='active'` |
| `app/components/home/NewArrivals.tsx` | 10 | Cover thumbnails must be WebP compressed via Edge Function + bunny.net CDN |
| `app/components/home/HeroSection.tsx` | 58 | Replace picsum placeholder with real card image from Supabase Storage |

## Order Flow

| File | Line | Description |
|------|------|-------------|
| `app/profile/merchant/sales/page.tsx` | 113 | "確認並準備發貨" / "確認發貨" — update `orders.status`, notify buyer |
| `app/profile/merchant/sales/page.tsx` | 114 | "聯絡買家" — open in-platform messaging |
| `app/profile/user/orders/page.tsx` | 163 | "聯絡賣家" — navigate to chat thread or messaging modal |

## KYC & User Management

| File | Line | Description |
|------|------|-------------|
| `app/admin/approvals/page.tsx` | 121 | Fetch KYC document from Supabase Storage |
| `app/admin/approvals/page.tsx` | 135 | "批准" — update `kyc_applications.status = 'approved'` + update `profiles.role = 'MERCHANT'` |
| `app/admin/approvals/page.tsx` | 142 | "拒絕" — update `kyc_applications.status = 'rejected'` + send rejection email |
| `app/admin/users/page.tsx` | 72 | Search input and role filter — connect to Supabase query |
| `app/admin/users/page.tsx` | 139 | "詳情" → navigate to `/admin/users/[id]` detail page (not yet created) |
| `app/admin/users/page.tsx` | 140 | "封禁"/"解封" — update `profiles.is_banned` + invalidate session |
| `app/profile/user/settings/page.tsx` | 60 | "儲存更改" — UPDATE `profiles` table |
| `app/profile/user/settings/page.tsx` | 93 | Auth actions — email update, password reset, 2FA enrollment |
| `app/profile/user/settings/page.tsx` | 140 | KYC file upload — `supabase.storage.from('kyc-docs').upload(...)` |
| `app/profile/user/settings/page.tsx` | 161 | "提交 KYC 申請" — INSERT into `kyc_applications` |
| `app/profile/user/settings/page.tsx` | 185 | Notification toggle — UPDATE `notification_settings` |
| `app/profile/merchant/settings/page.tsx` | 20 | "儲存店舖資料" — UPDATE `merchant_profiles.shop_name` |

## Check-in & Rewards

| File | Line | Description |
|------|------|-------------|
| `app/components/home/PortfolioDashboard.tsx` | 7 | Check-in must use server-side `timezone('Asia/Hong_Kong', now())` — reject client timestamps |
| `app/components/profile/CheckInWidget.tsx` | 118 | Persist check-in to Supabase — `user_streaks.upsert(...)` |
| `app/components/profile/CheckInWidget.tsx` | 119 | Award points — `user_points.insert(...)` |
| `app/profile/[id]/page.tsx` | 643 | "立即領取" — INSERT into `user_points` + mark reward as claimed |

## Admin Operations

| File | Line | Description |
|------|------|-------------|
| `app/admin/database/page.tsx` | 52 | "更新 Top-100 快取" — re-run TCGdex API fetch + update `price_cache` |
| `app/admin/database/page.tsx` | 81 | Manual card entry — INSERT into `card_catalog` with admin auth |
| `app/admin/settings/page.tsx` | 21 | "儲存運費設定" — upsert `platform_settings.shipping_subsidy_amount` |
| `app/admin/settings/page.tsx` | 72 | "立即觸發" — trigger Mercari/SKUNK scraper job |
| `app/admin/settings/page.tsx` | 121 | "更換" API key — secure update via server action |
| `app/admin/settings/page.tsx` | 167 | "更新費率" — upsert `platform_settings.commission_rate` |
| `app/admin/settings/page.tsx` | 202 | "暫停全平台交易" / "清除快取" — server actions with admin auth |

## Data Fetching (Replace Hardcoded Data)

| File | Line | Description |
|------|------|-------------|
| `app/components/cards/CardGrid.tsx` | 8 | Fetch featured listings from `listings` table |
| `app/components/home/FollowingFeed.tsx` | 12 | Fetch user's followed cards / global hot recommendations |
| `app/components/home/SniperRadar.tsx` | 9 | Fetch below-market-price listings |
| `app/components/home/SniperRadar.tsx` | 10 | `price_delta_percentage` must be pre-calculated by backend trigger |
| `app/components/home/TrustedSellers.tsx` | 5 | RLS policy for merchant + KYC verification |
| `app/components/home/NewArrivals.tsx` | 9 | Fetch latest C2C listings |
| `app/components/ticker/PriceTicker.tsx` | 10 | Supabase Edge Function polling for latest transactions |
| `app/components/transactions/TransactionWall.tsx` | 6 | Supabase Realtime stream for `transactions` table |
| `app/components/transactions/TransactionWall.tsx` | 7 | Compute relative timestamps from `created_at` |
| `app/page.tsx` | 19 | Fetch active box series from `card_series` table |
| `app/marketplace/page.tsx` | 181 | Replace client-side filtering with Supabase query params |
| `app/marketplace/page.tsx` | 240 | Full-text search on `listings` table |
| `app/marketplace/page.tsx` | 312 | Update URL search params on filter change |

## Miscellaneous

| File | Line | Description |
|------|------|-------------|
| `app/components/home/CommunityNews.tsx` | 116 | Create dedicated policy pages (隱私政策, 服務條款, 交易保障政策) |
| `app/settings/page.tsx` | 32 | All settings action buttons need onClick handlers / sub-page navigation |
| `app/components/marketplace/MarketplaceHeader.tsx` | 49 | Search — query `listings` table with `.textSearch(...)` |
| `app/components/marketplace/MarketplaceHeader.tsx` | 62 | Category filter — update URL params and re-filter listings |
