# Server TODOs

Frontend placeholders that require server-side implementation (server actions, edge functions, auth/session, Stripe orchestration).

## TODO Index

- `app/admin/approvals/page.tsx:121` — Fetch and display uploaded KYC document from Supabase Storage — call supabase.storage.from('kyc-docs').createSignedUrl(app.id)
- `app/admin/approvals/page.tsx:135` — "批准" must call server action — update kyc_applications.status = 'approved' + update profiles.role = 'MERCHANT' in Supabase, then send confirmation email
- `app/admin/approvals/page.tsx:142` — "拒絕" must call server action — update kyc_applications.status = 'rejected' + send rejection email with reason
- `app/admin/database/page.tsx:52` — "更新 Top-100 快取" has no handler — must call server action to re-run TCGdex API fetch and update `price_cache` table in Supabase
- `app/admin/database/page.tsx:81` — Manual entry form submit has no handler — must call server action to INSERT into `card_catalog` table with admin auth check
- `app/admin/settings/page.tsx:21` — "儲存運費設定" button has no handler — must call server action to upsert `platform_settings.shipping_subsidy_amount` in Supabase
- `app/admin/settings/page.tsx:72` — "立即觸發" button has no handler — must call server action to trigger Mercari/SKUNK scraper job; scraper status ("上次: 2小時前") is hardcoded
- `app/admin/settings/page.tsx:121` — "更換" button has no handler — must open a modal to securely update API key via server action with encryption at rest
- `app/admin/settings/page.tsx:167` — "更新費率" button has no handler — must call server action to upsert `platform_settings.commission_rate` in Supabase
- `app/admin/settings/page.tsx:202` — "暫停全平台交易" and "清除所有快取數據" buttons have no handlers — must call server actions with admin auth check before execution
- `app/admin/users/page.tsx:72` — Search input and role filter have no handler — connect to Supabase query with .ilike('name', `%${query}%`) and .eq('role', selectedRole)
- `app/admin/users/page.tsx:139` — "詳情" → navigate to /admin/users/[id] detail page (not yet created)
- `app/admin/users/page.tsx:140` — "封禁"/"解封" must call server action — update profiles.is_banned = true/false in Supabase + invalidate user session
- `app/auth/AuthForm.tsx:236` — Replace with Supabase auth.signInWithPassword()
- `app/auth/AuthForm.tsx:250` — Replace with Supabase auth.signUp()
- `app/components/cards/CardItem.tsx:83` — "直接購買" must trigger escrow flow — create order in Supabase, initiate Stripe Connect PaymentIntent
- `app/components/cards/CardItem.tsx:84` — "即時出價" must open bid modal and submit to `bids` table with user auth check
- `app/components/cards/CardItem.tsx:85` — /listing/${card.id} route does not exist yet — create app/listing/[id]/page.tsx
- `app/components/home/FollowingFeed.tsx:17` — If authenticated, fetch user's followed cards/merchants and compute lowest-price listings.
- `app/components/home/FollowingFeed.tsx:58` — Replace with session check from Supabase auth.
- `app/components/home/HeroSmartSearch.tsx:105` — Replace with unified search route + query params.
- `app/components/home/HeroSmartSearch.tsx:193` — Replace with deep link to listing/catalog detail page.
- `app/components/home/NewArrivals.tsx:5` — Ensure buy-now locks listing status to prevent double payment (`escrow_locked`).
- `app/components/home/PortfolioAndRewards.tsx:9` — Prevent cheating: do not rely on frontend clock; enforce UNIQUE (user_id, check_in_date) + atomic transaction.
- `app/components/home/PremiumEscrowMarket.tsx:15` — Enforce RLS: listings.use_authentication=true requires merchant role + verified KYC.
- `app/components/marketplace/MarketplaceHeader.tsx:49` — onChange must query Supabase `listings` table with .textSearch('card_name', query) or TCGdex API
- `app/components/marketplace/MarketplaceHeader.tsx:62` — category onChange must update URL search params (?category=sar) and re-filter Supabase listings
- `app/components/profile/CheckInWidget.tsx:118` — Persist check-in to Supabase — call server action: supabase.from('user_streaks').upsert({ user_id, last_checkin: new Date(), streak_days: streak + 1 })
- `app/components/profile/CheckInWidget.tsx:119` — Award points via server action: supabase.from('user_points').insert({ user_id, points: 50, reason: 'daily_checkin' })
- `app/components/profile/LogoutModal.tsx:12` — Integrate Supabase auth signOut + redirect to /auth
- `app/components/ticker/PriceTicker.tsx:3` — Do not connect public visitors directly to Supabase Realtime.
- `app/components/ticker/PriceTicker.tsx:4` — Implement Edge Function cache refresh every 30–60s; frontend polls quietly.
- `app/marketplace/page.tsx:181` — Replace client-side filtering with Supabase query params
- `app/marketplace/page.tsx:240` — Connect to Supabase full-text search on `listings` table — .textSearch('name', query)
- `app/marketplace/page.tsx:312` — Update URL search params on filter change for shareable links
- `app/profile/[id]/page.tsx:643` — "立即領取" form submit has no handler — must call server action to INSERT into `user_points` table and mark reward as claimed in `user_streaks.reward_claimed = true`
- `app/profile/merchant/finance/page.tsx:75` — acct_1R8xK2KojiTCGDemo is a demo Stripe account ID — replace with real connected account ID fetched from `merchant_profiles.stripe_account_id` in Supabase
- `app/profile/merchant/finance/page.tsx:82` — Redirect to merchant's Stripe Express Dashboard — use stripe.accounts.createLoginLink(accountId) server action
- `app/profile/merchant/inventory/page.tsx:132` — Photo upload divs are decorative — no `<input type="file">` and no Supabase Storage upload handler; implement with supabase.storage.from('listing-photos').upload(`${listingId}/${i}`, file)
- `app/profile/merchant/inventory/page.tsx:166` — "儲存草稿" has no handler — must call server action to INSERT into `listings` with status='draft'
- `app/profile/merchant/inventory/page.tsx:167` — "立即上架" form submit has no handler — must call server action to INSERT into `listings` with status='active', then update merchant inventory count
- `app/profile/merchant/sales/page.tsx:113` — "確認並準備發貨" and "確認發貨" buttons have no handlers — must call server action to update `orders.status`, then notify buyer via Supabase realtime / email
- `app/profile/merchant/sales/page.tsx:114` — "聯絡買家" button has no handler — must open in-platform messaging or navigate to chat thread
- `app/profile/merchant/settings/page.tsx:20` — "儲存店舖資料" form submit has no handler — must call server action to UPDATE `merchant_profiles.shop_name` for current user
- `app/profile/page.tsx:14` — Read auth session role from Supabase — supabase.auth.getSession() then check user.user_metadata.role
- `app/profile/user/orders/page.tsx:163` — "聯絡賣家" button has no handler — must navigate to in-platform chat thread or open a messaging modal for order.id
- `app/profile/user/settings/page.tsx:60` — "儲存更改" form submit has no handler — must call server action to UPDATE `profiles` table (display_name, handle, bio) for current user
- `app/profile/user/settings/page.tsx:93` — "修改"/"更改"/"開啟" action buttons have no handlers — must open modals/flows: email update via Supabase auth.updateUser(), password reset via sendPasswordRecovery(), 2FA via MFA enrollment API
- `app/profile/user/settings/page.tsx:140` — File upload div is decorative — no `<input type="file">` element, no Supabase Storage upload handler. Implement with supabase.storage.from('kyc-docs').upload(userId, file)
- `app/profile/user/settings/page.tsx:161` — "提交 KYC 申請" form submit has no handler — must call server action to INSERT into `kyc_applications` table and update `profiles.role = 'PENDING_MERCHANT'`
- `app/profile/user/settings/page.tsx:185` — Toggle buttons have no onClick handlers — must call server action to UPDATE `notification_settings` for current user
- `app/settings/page.tsx:32` — All action buttons (語言變更, 貨幣變更, 通知偏好管理, 隱私政策查看, FAQ前往, 聯絡客服) have no onClick handlers — each must open a modal or navigate to sub-pages once those routes are created
