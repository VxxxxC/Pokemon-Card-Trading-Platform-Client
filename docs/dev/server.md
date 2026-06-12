# Server-Side TODO Tracker

> This document tracks all frontend locations that require **server-side implementation** (Edge Functions, Server Actions, webhooks, server-side logic).
> Each entry maps to a `TODO: [server]` comment in the codebase.

---

## Authentication & Session

| File | Description |
|------|-------------|
| `app/profile/page.tsx` | Read auth session role from Supabase — `supabase.auth.getSession()` then check `user.user_metadata.role` |
| `app/auth/AuthForm.tsx` | Replace mock login with `supabase.auth.signInWithPassword()` |
| `app/auth/AuthForm.tsx` | Replace mock register with `supabase.auth.signUp()` |
| `app/components/profile/LogoutModal.tsx` | Supabase `signOut()` + redirect to login |

## Escrow & Trading Flow

| File | Description |
|------|-------------|
| `app/components/cards/CardItem.tsx` | "直接購買" must trigger escrow flow — create order in Supabase, initiate Stripe Connect PaymentIntent |
| `app/components/cards/CardItem.tsx` | `/listing/${card.id}` route does not exist yet — create `app/listing/[id]/page.tsx` |
| `app/components/home/PremiumMarket.tsx` | "Escrow 購買" must create Stripe Connect PaymentIntent with platform fee split |
| `app/components/home/NewArrivals.tsx` | "直接購買" triggers escrow flow — Stripe PaymentIntent for deposit |
| `app/components/home/NewArrivals.tsx` | Image upload: Edge Function must convert to WebP, compress, and upload to bunny.net CDN |

## Merchant Operations

| File | Description |
|------|-------------|
| `app/components/merchant/NewListingForm.tsx` | Photo upload — implement `supabase.storage.from('listing-photos').upload()` handler |
| `app/components/merchant/NewListingForm.tsx` | "儲存草稿" — server action to INSERT into `listings` with `status='draft'` |
| `app/components/merchant/NewListingForm.tsx` | "立即上架" — server action to INSERT into `listings` with `status='active'` |
| `app/profile/merchant/trading/page.tsx` | "確認並準備發貨"/"確認發貨" — server action to update `orders.status`, notify buyer |
| `app/profile/merchant/trading/page.tsx` | "聯絡買家" — open in-platform messaging or navigate to chat thread |
| `app/profile/merchant/settings/page.tsx` | "儲存更改" — server action to UPDATE `merchant_profiles` (shop_name, handle, bio) |
| `app/profile/merchant/finance/page.tsx` | Stripe Express Dashboard redirect — `stripe.accounts.createLoginLink(accountId)` server action |
| `app/components/home/PremiumMarket.tsx` | Stripe Connect Onboarding status must be checked via webhook before allowing premium listing |

## User Profile & Settings

| File | Description |
|------|-------------|
| `app/profile/user/settings/page.tsx` | "儲存更改" — server action to UPDATE `profiles` table (display_name, handle, bio) |
| `app/profile/user/settings/page.tsx` | Email/password/2FA action buttons — Supabase `auth.updateUser()`, `sendPasswordRecovery()`, MFA enrollment |
| `app/profile/user/settings/page.tsx` | KYC file upload — `supabase.storage.from('kyc-docs').upload(userId, file)` |
| `app/profile/user/settings/page.tsx` | "提交 KYC 申請" — INSERT into `kyc_applications`, update `profiles.role` |
| `app/profile/user/settings/page.tsx` | Notification toggle handlers — UPDATE `notification_settings` |
| `app/profile/user/orders/page.tsx` | "聯絡賣家" — navigate to in-platform chat thread |
| `app/profile/[id]/page.tsx` | "立即領取" — INSERT into `user_points`, mark reward as claimed |
| `app/components/profile/CheckInWidget.tsx` | Persist check-in to Supabase — `user_streaks` upsert |
| `app/components/profile/CheckInWidget.tsx` | Award points via server action — `user_points` insert |
| `app/components/transactions/TransactionWall.tsx` | Relative timestamps must be computed server-side from real `created_at` |

## Homepage Sections

| File | Description |
|------|-------------|
| `app/components/home/TrustBanner.tsx` | Trust flow steps should be configurable via CMS/admin panel in Supabase |
| `app/components/home/PortfolioRewards.tsx` | Daily check-in: Supabase Stored Procedure using `timezone('Asia/Hong_Kong', now())` — reject client timestamps |
| `app/components/home/FollowingFeed.tsx` | For logged-out users, return global hot recommendations from a cached Edge Function |
| `app/components/home/SniperRadar.tsx` | Backend Edge Function must run IQR algorithm to filter outlier prices every hour |
| `app/components/home/TokyoMarketIndex.tsx` | Edge Function: daily exchange rate cache (HKD to JPY), serve via memory cache |
| `app/components/navigation/Footer.tsx` | Footer links should be fetched from CMS or Supabase `site_config` table |

## Admin Operations

| File | Description |
|------|-------------|
| `app/admin/settings/page.tsx` | "儲存運費設定" — upsert `platform_settings.shipping_subsidy_amount` |
| `app/admin/settings/page.tsx` | "立即觸發" — trigger Mercari/SKUNK scraper job |
| `app/admin/settings/page.tsx` | "更換" API key — secure update via server action with encryption at rest |
| `app/admin/settings/page.tsx` | "更新費率" — upsert `platform_settings.commission_rate` |
| `app/admin/settings/page.tsx` | "暫停全平台交易"/"清除快取" — admin-auth-gated server actions |
| `app/admin/users/page.tsx` | "封禁"/"解封" — update `profiles.is_banned`, invalidate user session |
| `app/admin/database/page.tsx` | "更新 Top-100 快取" — re-run TCGdex API fetch, update `price_cache` |
| `app/admin/database/page.tsx` | Manual card entry form — INSERT into `card_catalog` with admin auth |
| `app/admin/approvals/page.tsx` | "批准" KYC — update status + update `profiles.role = 'MERCHANT'`, send email |
| `app/admin/approvals/page.tsx` | "拒絕" KYC — update status + send rejection email |
| `app/admin/approvals/page.tsx` | Fetch uploaded KYC document — `supabase.storage.from('kyc-docs').createSignedUrl()` |

## Settings

| File | Description |
|------|-------------|
| `app/settings/page.tsx` | All action buttons (語言, 貨幣, 通知, 隱私, FAQ, 客服) need onClick handlers/modals |
