# 🗂️ HKCardVault - 完整專案結構樹 (Full-Depth)

## 📊 項目統計

- **根目錄層級**: 5 層
- **主要目錄**: 13 個（`app/`, `components/`, `lib/`, `types/`, `scripts/`, `e2e/`, `supabase/`, `docs/`, `public/`, `.stitch/`, `.agents/`, `.github/`, `.vscode/`）
- **總檔案數**: 740+ 個（排除 `node_modules`、`.next`）
- **TypeScript/TSX 檔案**: 410+ 個
- **DB migrations**: 89 檔（`supabase/migrations/`）
- **語言**: TypeScript/TSX, CSS, JSON, Markdown, SQL
- **框架**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, Serwist (PWA), Playwright (E2E)
- **後端整合**: **大部分已接線** — Supabase（Auth、RLS、RPC、Server Actions、Realtime、Cron）；首頁 / 收藏 / 庫存 / 願望清單 / 獎勵 / 公開檔案 / 訂單詳情 / 聊天已讀 / 檢舉已接後端；商戶 dashboard 與 checkout 仍部分 mock
- **Package manager**: Bun only（`bun.lock`；見 `.cursorrules` §7）

---

## 🌳 頂層結構 (Top-Level)

```
Pokemon-Card-Trading-Platform-Client/
├─ 🔧 配置 & 規範
│   ├── package.json                 # scripts: dev, build, build:ci, lint, supabase:types, test:*, test:e2e
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── playwright.config.ts         # Playwright E2E（讀 `.env` / `.env.local`）
│   ├── vercel.json                  # Cron: ingest-platform-trades + aggregate-prices
│   ├── components.json              # shadcn/ui
│   ├── middleware.ts                # Supabase session + RBAC（env 未設定時安全跳過）
│   ├── .cursorrules                 # 開發守則（含 §8 CI-safe Supabase / prerender）
│   ├── bun.lock
│   └── README.md
│
├─ 📁 app/                           # Next.js App Router（路由 + UI + store + hooks）
├─ 🧩 components/                    # shadcn/ui + 跨路由共用元件
├─ 📦 lib/                           # 後端輔助、Supabase client、domain helpers
├─ 🗄️ types/                         # Supabase CLI 生成型別 + 衍生文件
│   ├── supabase.ts                  # 唯一 DB schema 來源（`bun run supabase:types`）
│   └── supabase.md                  # 同上命令自動生成的人類可讀摘要
├─ 🛠️ scripts/                       # 開發 / CI 輔助腳本
├─ 🎭 e2e/                           # Playwright E2E specs + fixtures（見 docs/dev/e2e.md）
├─ 🐘 supabase/                      # migrations + config.toml
├─ 📖 docs/                          # 需求、RBAC、dev handoff
├─ 🎨 .stitch/                       # Stitch 設計系統
├─ 🤖 .agents/skills/                # Agent 技能庫
├─ 🔗 .github/workflows/ci.yml       # tsc → lint → build（無 .env）
└─ 🌐 public/                        # 靜態資源 & PWA
```

---

## 📁 app/ — App Router

```
app/
├── 根層級
│   ├── page.tsx                     # 首頁
│   ├── layout.tsx                   # 全局 Layout（AddAssetModal、ListingSubmitOverlay、GlobalChatOverlay、ExecutionSlideOverHost）
│   ├── not-found.tsx                # 404
│   ├── globals.css
│   ├── manifest.json
│   ├── sw.ts
│   └── settings/page.tsx
│
├── actions/                         # ⭐ Server Actions（前後端契約）
│   ├── auth.ts                      # 登入 / 註冊 / 密碼重設
│   ├── profile.ts                   # 用戶設定、頭像
│   ├── marketplace.ts               # 搜尋、商品詳情、掛單簿、成交紀錄、市場價格、商戶櫥窗
│   ├── productCatalog.ts            # 目錄搜尋（Hero / AddAsset）
│   ├── listings.ts                  # 上架提交（Bunny + listings insert）
│   ├── offers.ts                    # 出價 / 接受 / 拒絕 / 修改 / OfferCard context
│   ├── chat.ts                      # inbox, sendMessage, markRoomRead → RPC
│   ├── orders.ts                    # searchUserTradingOrders, complete/cancel, order detail, mock pay / escrow
│   ├── reviews.ts                   # 雙盲評價 + 公開檔案評價列表
│   ├── reports.ts                   # submitUserReport（聊天 / 檔案檢舉）
│   ├── home.ts                      # 首頁三區塊 bootstrap（願望清單 / 商戶 / C2C）
│   ├── collection.ts                # 收藏 portfolio bootstrap + 售出歸檔
│   ├── inventory.ts                 # 賣家庫存 accordion
│   ├── wishlist.ts                  # 願望清單 toggle + 列表
│   ├── rewards.ts                   # 簽到、積分、折價券中心
│   ├── member-dashboard.ts          # 用戶總覽 dashboard stats
│   └── admin-member-orders.ts       # Dev/admin：鑑定託管狀態推進（mock flow）
│
├── api/
│   ├── cron/
│   │   ├── ingest-platform-trades/route.ts  # Cron Job 1b：平台成交快照 ingest
│   │   └── aggregate-prices/route.ts        # Cron Job 2：快照聚合 → market_prices cache
│   ├── listings/upload-image/route.ts
│   └── profile/upload-avatar/route.ts
│
├── auth/                            # 認證
│   ├── page.tsx                     # 登入 / 註冊
│   ├── AuthForm.tsx
│   ├── AuthFormShell.tsx
│   ├── callback/route.ts            # OAuth / magic link callback
│   ├── forgot-password/
│   │   ├── page.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   └── complete/                # 郵件連結後設定新密碼
│   └── reset-password/              # 已登入更改密碼
│       ├── page.tsx
│       └── ResetPasswordForm.tsx
│
├── marketplace/
│   ├── page.tsx                     # 大盤搜尋（Supabase RPC v2）
│   ├── MarketplacePageClient.tsx      # 客戶端搜尋狀態 + 篩選互動
│   ├── layout.tsx
│   ├── MarketplaceChrome.tsx        # 商品詳情頁隱藏全局 Nav
│   ├── product/[id]/
│   │   ├── page.tsx                 # SSR catalog + ProductDetailClient
│   │   └── ProductDetailClient.tsx  # 掛單簿、成交紀錄、市場價 banner、價格圖表；order book → 全域 ExecutionSlideOver
│   ├── [id]/                        # 商戶櫥窗（Supabase storefront）
│   │   ├── page.tsx
│   │   ├── MerchantStorefrontPageClient.tsx
│   │   └── product/[productId]/
│   │       ├── page.tsx
│   │       └── MerchantProductDetailPageClient.tsx  # BuyButton → 全域 slide-over
│   └── payment-status/page.tsx
│
├── profile/                         # 三層級檔案系統（見下方路由表）
│   ├── user/
│   │   ├── (dashboard)/             # 總覽 / 收藏 / 庫存 / 交易列表
│   │   ├── orderDetail/[id]/        # 會員訂單詳情（P2P + 鑑定託管）
│   │   ├── rewards/                 # 折價券中心
│   │   └── settings/
│   ├── merchant/                    # 商戶 dashboard（部分 mock）
│   └── [id]/                        # 公開檔案 + /rating 評價列表
├── home/                            # 首頁 SSR 區塊 data loaders
│   ├── HomeWishlistSectionData.tsx
│   ├── HomeMerchantSectionData.tsx
│   ├── HomeC2cSectionData.tsx
│   └── HomeSectionSkeletons.tsx
├── checkout/[id]/                   # 結帳
├── admin/                           # 管理員 RBAC
├── search/page.tsx
├── ~offline/page.tsx
├── serwist/[path]/route.ts
│
├── lib/                             # App 層工具（非根 lib/）
│   ├── marketplace/
│   │   ├── types.ts                 # 搜尋 / 詳情 / 掛單 / 市場價型別
│   │   ├── searchParsers.ts
│   │   └── perf-log-client.ts
│   ├── chat/                        # DB 聊天映射 + Realtime 解碼 + 已讀游標
│   │   ├── constants.ts             # isMockChatRoomId, isDbChatRoomId
│   │   ├── mapDbChats.ts            # inbox rows → Zustand ChatRoom / Message
│   │   ├── mergeChatRooms.ts        # mock + DB room 合併
│   │   ├── hydrateChatRoomThread.ts # 長線程分頁 hydrate
│   │   ├── persistMarkRoomRead.ts   # markRoomRead 客戶端持久化
│   │   ├── roomHydration.ts         # 房間訊息 hydration 協調
│   │   ├── offerCardImage.ts
│   │   ├── offerCardContextCache.ts
│   │   ├── resolveMemberOrderId.ts
│   │   └── realtimeChatMessages.ts
│   ├── collection/                  # 收藏 portfolio 型別 + perf log
│   ├── dashboard/                   # 用戶總覽型別 + perf log
│   ├── home/                        # 首頁區塊型別 + perf log
│   ├── inventory/                   # 庫存 accordion 型別 + perf log
│   ├── member-order/                # 訂單詳情映射（P2P / auth escrow）
│   ├── reports/                     # formatReportReason
│   ├── reviews/                     # 評價 UI 型別
│   ├── wishlist/                    # 願望清單型別
│   ├── hooks/
│   │   ├── useCurrentUserId.ts
│   │   ├── useChatRoomRealtime.ts
│   │   ├── useChatThreadPagination.ts
│   │   ├── useRoomReviewedOrderIds.ts
│   │   ├── useMarketplaceSearch.ts
│   │   ├── useMarketplaceSellerSearch.ts
│   │   ├── useMarketplaceProductListings.ts
│   │   ├── useMarketplaceProductTradeHistory.ts
│   │   ├── useMarketplaceProductMarketPrice.ts
│   │   ├── useMarketplaceListingDetail.ts
│   │   ├── useProductCatalogSearch.ts
│   │   ├── useHeroMarketplaceSearch.ts
│   │   ├── useUserTrading.ts
│   │   ├── useCollection.ts
│   │   ├── useInventory.ts
│   │   ├── useWishlist.ts
│   │   ├── useMemberDashboard.ts
│   │   ├── useMemberTitleDisplay.ts
│   │   ├── usePublicProfileReviews.ts
│   │   ├── useIsDesktopChat.ts
│   │   ├── usePWAEnvironment.ts
│   │   └── usePwaInstall.ts
│   ├── mock-data/                   # 過渡期 mock（profile / chat / orders）
│   └── types/                       # rbac, trading
│
├── store/                           # Zustand
│   ├── useMarketStore.ts
│   ├── useUIStore.ts                # AddAsset modal、mockRole、**openExecutionSlideOver** / close
│   ├── useHkCardVaultStore.ts       # 全局聊天 + offers 狀態帳本 + Scheme A store actions
│   ├── useMerchantStore.ts
│   ├── useMockDbStore.ts
│   └── useListingSubmitStore.ts     # 上架提交 overlay 狀態
│
└── components/                      # App 層 UI（80+ 元件，按 domain 分目錄）
    ├── marketplace/                 # MarketplaceCard, AccordionFilters, PriceSpreadBadge, AskOrderBookRow…
    ├── home/                        # HeroSearch、NewArrivals、PremiumMarket、WishlistTicker…
    ├── market/                      # CollectionTable, WishlistTable, WishlistButton
    ├── shared/                      # AddAssetModal, CollectionAddAfterListingDialog, MarketSkeletons…
    ├── navigation/                  # TopNav, BottomNav, MobileHeader, Footer…
    ├── profile/                     # ProfileAvatar, ProfileHeaderWithChat, TitleBadgeIcon…
    ├── rewards/                     # CheckInCard, RewardUnlockedModal, UserProfileDashboardShell…
    ├── transactions/
    │   ├── GlobalTxButtons.tsx      # BuyButton（→ 全域 slide-over）、AuctionButton（mock）
    │   ├── ExecutionSlideOverHost.tsx
    │   ├── ExecutionSlideOver.tsx
    │   ├── MemberAuthMockPaymentPanel.tsx
    │   └── OrderLifecycleStepper.tsx
    ├── trading/                     # ReviewModal（交易評價彈窗）
    ├── user/                        # UserOrderRow, MemberOrderDetailView, P2P/Auth 發票與時間軸…
    ├── chat/                        # GlobalChatOverlay, GlobalChatConsole, ChatUnreadDot, OfferCard, ChatReportDialogBody…
    ├── merchant/                    # InventoryAccordion, MerchantOrderRow…
    └── …                            # admin, pwa, cards, ticker…
```

---

## 📦 lib/ — 根層級 Domain & Infra

```
lib/
├── supabase/
│   ├── env.ts                       # getSupabasePublicEnv(), isSupabaseConfigured()
│   ├── server.ts                    # createClient() — SSR / Server Actions
│   ├── client.ts                    # createClient() — browser / Realtime
│   ├── public.ts                    # 公開 env 讀取輔助
│   ├── admin.ts                     # service_role（僅 server / cron）
│   └── middleware.ts                # updateSession()
│
├── auth/
│   ├── session.ts                   # getOptionalAuthUser(), resolveCurrentDemoRole()
│   ├── roles.ts                     # RBAC 路由
│   ├── validation.ts
│   ├── username.ts
│   ├── password-errors.ts
│   └── site-url.ts
│
├── marketplace/
│   ├── filter-options.ts
│   ├── product-listing-filters.ts
│   ├── listing-display.ts
│   ├── map-listing-to-execution.ts
│   ├── map-seller-listing.ts
│   ├── load-seller-profile.ts / load-seller-listing-detail.ts
│   ├── market-price.ts
│   ├── portfolio-pricing.ts
│   ├── platform-snapshot-ingest.ts
│   ├── seller-identity.ts / seller-profile.ts
│   ├── search-default.ts / product-detail-default.ts
│   ├── constants.ts
│   └── perf-log.ts
│
├── catalog/
│   └── element-types.ts
│
├── collection/
│   ├── build-entries.ts
│   ├── load-user-collection.ts
│   ├── constants.ts
│   └── perf-log.ts
│
├── dashboard/
│   ├── member-trading-stats.ts
│   ├── constants.ts
│   └── perf-log.ts
│
├── home/
│   ├── load-home-listings.ts
│   ├── constants.ts
│   └── perf-log.ts
│
├── grading/
│   └── options.ts
│
├── listings/
│   ├── validation.ts
│   ├── images.ts / image-files.ts
│   ├── client-upload.ts
│   ├── submit-card-listing.ts
│   ├── build-inventory-groups.ts
│   ├── load-user-inventory.ts
│   ├── auth-service-copy.ts
│   ├── constants.ts
│   ├── errors.ts
│   └── perf-log.ts
│
├── member-order/
│   ├── auth-escrow.ts               # escrow 狀態常數 / 顯示輔助
│   ├── member-order-rpc.ts          # complete/cancel RPC 封裝
│   ├── resolve-order-id.ts / resolve-listing-id.ts
│   ├── repair-listing-id.ts
│   ├── order-kind.ts / constants.ts
│   ├── dev-mock-flow.ts
│   └── perf-log.ts
│
├── payments/
│   └── member-auth-payment.ts
│
├── profile/
│   ├── validation.ts
│   ├── avatar.ts
│   ├── client-upload.ts
│   ├── load-profile-snippets.ts
│   └── errors.ts
│
├── rewards/
│   └── mapUserRewardCoupon.ts
│
├── titles/
│   └── member-title-progress.ts
│
├── wishlist/
│   ├── grading.ts / pricing.ts / sparkline.ts
│
├── constants/
│   ├── commerce.ts
│   ├── rewards.ts
│   └── titles.ts
│
├── cron/
│   └── request.ts                   # Cron route 共用驗證
│
├── storage/
│   └── bunny.ts
│
└── utils.ts
```

---

## 🧩 components/ — shadcn & 共用

```
components/
├── ui/                              # shadcn 基礎元件（含 chart.tsx, badge.tsx, tabs.tsx）
├── reui/                            # badge, stepper
├── auth/PasswordUpdatedToast.tsx
├── errors/NotFoundContent.tsx
├── listings/ListingSubmitOverlay.tsx
├── shared/RelativeDateTime.tsx      # 成交紀錄相對時間
└── examples/
```

---

## 🛠️ scripts/

```
scripts/
├── generate-supabase-md.ts          # `supabase:types` 後自動生成 types/supabase.md
├── test-product-catalog-search.ts   # `bun run test:catalog-search`
├── test-member-order-complete-rpc.ts
├── test-chat-mark-read.ts
└── run-member-auth-mock-flow.ts     # `bun run test:member-auth-mock-flow`
```

---

## 🎭 e2e/ — Playwright

```
e2e/
├── fixtures/
│   ├── auth.setup.ts                # buyer / seller storageState
│   ├── supabase-admin.ts            # service_role 清理與 assert
│   ├── test-data.ts / chat-test-data.ts
│   └── listing-photo.png
├── helpers/
│   ├── member-trading.ts
│   └── collection-asset.ts
├── marketplace-search-offer.spec.ts
├── marketplace-storefront.spec.ts
├── merchant-product-detail.spec.ts
├── global-chat-realtime.spec.ts
├── member-offer-negotiation.spec.ts
├── member-trading-p2p.spec.ts
├── member-trading-smoke.spec.ts
├── member-trading-filters.spec.ts
├── member-order-detail-p2p.spec.ts
├── member-order-detail-auth.spec.ts
├── member-auth-escrow.spec.ts
├── member-auth-inbound.spec.ts
├── member-auth-settings.spec.ts
├── member-collection-wishlist.spec.ts
├── member-collection-operations.spec.ts
├── member-inventory.spec.ts
├── member-dashboard.spec.ts
├── member-rewards-redeem.spec.ts
├── member-rating-page.spec.ts
├── member-merchant-trading.spec.ts
├── public-profile-page.spec.ts
└── user-report.spec.ts
```

**Run:** `bun run test:e2e` · 詳見 [`docs/dev/e2e.md`](./dev/e2e.md)

---

## 🐘 supabase/

```
supabase/
├── config.toml
└── migrations/                      # 89 檔，按時間戳排序；`bunx supabase db push`
    ├── 20260702100000_product_catalog_public_read.sql
    ├── …                            # auth, marketplace search, listings, offers, chat, orders…
    ├── 20260708100000_member_auth_escrow_status.sql
    ├── 20260709120000_rpc_send_chat_message_aml_warning.sql
    ├── 20260709130000_user_collections_sold_archive.sql
    ├── 20260709220000_chat_thread_pagination.sql
    ├── 20260709300000_reports_rls.sql
    ├── 20260710130000_marketplace_search_market_trend.sql
    ├── 20260710140000_platform_trade_snapshots.sql
    ├── 20260710180000_trading_orders_counterparty_avatar.sql
    ├── 20260715160000_rpc_complete_member_order_either_party.sql
    ├── 20260715200000_chat_room_reads.sql
    ├── 20260715210000_offer_aml_shared_guard.sql
    └── 20260715230000_chat_mark_read_counterpart_rooms.sql
```

**Regenerate types:** `bun run supabase:types` → `types/supabase.ts` + `types/supabase.md`

---

## 📖 docs/dev/ — 整合 handoff

```
docs/dev/
├── INTEGRATION_QUEUE.md             # ⭐ 前後端整合狀態總表
├── api.md                           # Server Actions 契約
├── database.md
├── server.md
├── e2e.md                           # Playwright 環境變數與測試矩陣
└── follow-up/                       # 每個 workflow 一 packet
    ├── auth-login-register/
    ├── auth-password-recovery/
    ├── marketplace-search/
    ├── marketplace-product-detail/
    ├── marketplace-performance/     # PERF_REPORT
    ├── market-pricing-cron/
    ├── product-catalog-search/
    ├── user-profile-settings/
    ├── role-based-routing/
    ├── offers-negotiation/
    ├── chat-offers-inbox/
    ├── member-auth-escrow/
    ├── marketplace-storefront/
    ├── home-sections/
    ├── public-profile-page/
    ├── profile-rating-list/
    ├── user-trading-orders/
    ├── user-inventory/
    ├── user-collection/
    ├── member-dashboard/
    ├── member-rewards-gamification/
    ├── transaction-reviews/
    ├── wishlist/
    └── lucky-bag-listings-v2/
```

---

## 📋 路由架構

### 三層級檔案系統

```
/profile/user              → 你的個人中心 (第一人稱)
/profile/merchant          → 你的商家儀表板 (第一人稱)
/profile/[id]              → 查看他人檔案 (第三人稱)
```

### 關鍵路由

| 路由 | 用途 | 資料來源 |
|------|------|----------|
| `/auth` | 登入 / 註冊 | Supabase Auth |
| `/auth/forgot-password` | 忘記密碼 | Supabase Auth |
| `/auth/forgot-password/complete` | 郵件連結後重設 | Supabase Auth |
| `/auth/reset-password` | 已登入改密碼 | Supabase Auth |
| `/marketplace` | 大盤搜尋 | `search_marketplace_products` RPC |
| `/marketplace/product/[id]` | 商品詳情 | catalog + 掛單 RPC + 成交紀錄 + 市場價 + 買家出價（全域 `ExecutionSlideOver`） |
| `/marketplace/[id]` | 商戶櫥窗 | `search_marketplace_seller_listings` RPC |
| `/marketplace/[id]/product/[productId]` | 店鋪單品詳情 | `getMarketplaceSellerListingDetail` + BuyButton |
| `/profile/user` | 用戶總覽 dashboard | `member-dashboard.ts` + SSR streaming |
| `/profile/user/collection` | 收藏 portfolio | `getCollectionPageBootstrap` |
| `/profile/user/inventory` | 賣家庫存 | `inventory.ts` + accordion RPC |
| `/profile/user/trading` | 我的買賣訂單 | `searchUserTradingOrders` RPC |
| `/profile/user/orderDetail/[id]` | 訂單詳情 | P2P + 鑑定託管（`MemberOrderDetailView`） |
| `/profile/user/rewards` | 折價券中心 | `rewards.ts` |
| `/profile/user/settings` | 用戶設定 | `getUserSettings` |
| `/profile/[id]` | 公開檔案 | `getPublicProfilePageBootstrap` |
| `/profile/[id]/rating` | 公開評價列表 | `getPublicProfileReviews` |
| `/checkout/[id]` | 結帳 | mock（待整合） |
| `/admin/*` | 管理後台 | mock + RBAC |
| `/api/cron/ingest-platform-trades` | 平台成交快照 cron | `platform_trade_snapshots` |
| `/api/cron/aggregate-prices` | 市場價聚合 cron | `product_price_snapshots` → `product_grading_market_prices` |

---

## 🎯 核心模組狀態

| 模組 | 位置 | 狀態 |
|------|------|------|
| **Auth 登入 / 註冊** | `app/actions/auth.ts`, `app/auth/` | ✅ Supabase |
| **密碼重設** | `app/auth/forgot-password/`, `reset-password/` | ✅ Supabase |
| **大盤搜尋** | `app/marketplace/`, RPC v2 + keyword + trend | ✅ Wired |
| **商品詳情** | `app/marketplace/product/[id]/` | ✅ 掛單簿 + 成交紀錄 + 市場價 + 圖表 |
| **商戶櫥窗** | `app/marketplace/[id]/` | ✅ Wired |
| **市場價聚合 (Cron)** | `app/api/cron/*`, `lib/marketplace/market-price.ts` | ✅ Wired（ingest + aggregate） |
| **首頁三區塊** | `app/home/`, `app/actions/home.ts` | ✅ SSR + BuyButton |
| **用戶設定 / 頭像** | `app/profile/user/settings/`, `app/api/profile/upload-avatar/` | ✅ Wired |
| **卡牌上架** | `AddAssetModal`, `listings.ts`, Bunny | ✅ Backend ready |
| **收藏 portfolio** | `collection.ts`, `UserCollectionClient` | ✅ Wired |
| **賣家庫存** | `inventory.ts`, `InventoryAccordion` | ✅ Wired（user）；⏳ merchant page |
| **願望清單** | `wishlist.ts`, `WishlistButton` / `WishlistTable` | ✅ Wired |
| **會員獎勵** | `rewards.ts`, `/profile/user/rewards` | 🟡 簽到 + 折價券中心已接；部分 UI 待 polish |
| **用戶總覽** | `member-dashboard.ts`, `UserOverviewClient` | ✅ Wired |
| **出價協商** | `offers.ts`, `ExecutionSlideOver` | 🟡 買家入口已全域接線；accept 後 checkout 導流待完成 |
| **聊天收件匣** | `chat.ts`, `GlobalChatConsole`, `useChatRoomRealtime` | 🟡 DB inbox + Realtime + 已讀游標 + 檢舉；mock 房間保留 |
| **用戶訂單** | `orders.ts`, `UserTradingClient`, `MemberOrderDetailView` | 🟡 列表 + 詳情 + 完結/取消/評價已接 |
| **鑑定託管** | `member-auth-escrow`, `MemberAuthMockPaymentPanel` | ✅ Mock pay flow wired |
| **交易評價** | `reviews.ts`, `ReviewModal` | ✅ 雙盲（交易頁 + 聊天）；公開評價列表 🟡 |
| **公開檔案** | `app/profile/[id]/` | ✅ Wired |
| **結帳 / 商戶 dashboard** | checkout, merchant dashboard | ⏳ Mock |
| **E2E** | `e2e/`, `playwright.config.ts` | ✅ 20+ specs（需 Supabase fixture env） |

---

## ⚙️ CI & 本地驗證

GitHub Actions（`.github/workflows/ci.yml`）**不含** `.env`：

```bash
bun ci                    # frozen lockfile
bunx tsc --noEmit
bun run lint
bun run build             # CI 等同此步
bun run build:ci          # 本地模擬 CI（空 Supabase env）
bun run test:catalog-search
bun run test:member-order-complete-rpc
bun run test:chat-mark-read
bun run test:e2e          # Playwright（需 .env fixture；見 docs/dev/e2e.md）
```

**Prerender 守則**（`.cursorrules` §8）：

- `app/**/page.tsx` 不可無 guard 呼叫 `createClient()`
- 使用 `isSupabaseConfigured()`、`getOptionalAuthUser()`
- Server Actions 讀取（被 page SSR 呼叫）需 guard；mutation 可於 runtime 直接 `createClient()`

---

## ✅ 開發檢查清單

提交前確認:

- [ ] 新 `page.tsx` 若讀 Supabase → `isSupabaseConfigured()` / `getOptionalAuthUser()`
- [ ] 新 Server Action → `{ success, data \| error }` 信封
- [ ] DB 型別只從 `types/supabase.ts` import
- [ ] 新 migration → `docs/dev/INTEGRATION_QUEUE.md` + `follow-up/*/backend.md`
- [ ] `bunx tsc --noEmit` · `bun run lint` · `bun run build:ci`
- [ ] 僅用 Bun（勿 npm / yarn / pnpm）
- [ ] 設計遵循 `.stitch/designs/DESIGN.md`

---

## 🚀 快速導航

| 需求 | 位置 |
|------|------|
| 新增頁面 | `app/[route]/page.tsx` |
| Server Action | `app/actions/` |
| API Route | `app/api/` |
| Cron / 背景任務 | `app/api/cron/` |
| Domain helper | `lib/[domain]/` |
| 客戶端 hook | `app/lib/hooks/` |
| Supabase 型別 | `types/supabase.ts` |
| Migration | `supabase/migrations/` |
| 出價 slide-over mapper | `lib/marketplace/map-listing-to-execution.ts` |
| 全域出價 UI host | `app/components/transactions/ExecutionSlideOverHost.tsx` |
| 整合狀態 | `docs/dev/INTEGRATION_QUEUE.md` |
| E2E 測試 | `e2e/`, `docs/dev/e2e.md` |
| 訂單詳情 UI | `app/components/user/MemberOrderDetailView.tsx` |
| 收藏 / 庫存 / 願望清單 | `docs/dev/follow-up/user-collection/`, `user-inventory/`, `wishlist/` |
| 出價協商 handoff | `docs/dev/follow-up/offers-negotiation/` |
| 聊天收件匣 handoff | `docs/dev/follow-up/chat-offers-inbox/` |
| 用戶訂單 handoff | `docs/dev/follow-up/user-trading-orders/` |
| 交易評價 handoff | `docs/dev/follow-up/transaction-reviews/` |
| 會員獎勵 handoff | `docs/dev/follow-up/member-rewards-gamification/` |
| API 契約 | `docs/dev/api.md` |
| 開發守則 | `.cursorrules` |
| CI 配置 | `.github/workflows/ci.yml` |
| 設計規範 | `.stitch/designs/DESIGN.md` |

---

**最後更新**: 2026-07-16  
**版本**: Full-Depth v5.0  
**維護者**: HKCardVault 開發團隊
