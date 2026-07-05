# 🗂️ HKCardVault - 完整專案結構樹 (Full-Depth)

## 📊 項目統計

- **根目錄層級**: 5 層
- **主要目錄**: 12 個（`app/`, `components/`, `lib/`, `types/`, `scripts/`, `supabase/`, `docs/`, `public/`, `.stitch/`, `.agents/`, `.github/`, `.vscode/`）
- **總檔案數**: 470+ 個（排除 `node_modules`、`.next`）
- **TypeScript/TSX 檔案**: 230+ 個
- **語言**: TypeScript/TSX, CSS, JSON, Markdown, SQL
- **框架**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, Serwist (PWA)
- **後端整合**: **進行中** — Supabase（Auth、RLS、RPC、Server Actions、Realtime、Cron）；出價協商 + DB 聊天收件匣 + 訂單列表搜尋 / 分頁 / 完結 / 評價已接後端（含 Realtime Scheme A、completion card、雙盲評價）；部分 checkout UI 仍用 mock data
- **Package manager**: Bun only（`bun.lock`；見 `.cursorrules` §7）

---

## 🌳 頂層結構 (Top-Level)

```
Pokemon-Card-Trading-Platform-Client/
├─ 🔧 配置 & 規範
│   ├── package.json                 # scripts: dev, build, build:ci, lint, supabase:types, test:catalog-search
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
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
│   ├── supabase.ts                  # 唯一 DB schema 來源
│   └── supabase.md                  # `bun run supabase:types` 自動生成
├─ 🛠️ scripts/                       # 開發 / CI 輔助腳本
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
│   ├── layout.tsx                   # 全局 Layout（含 GlobalChatOverlay、ListingSubmitOverlay）
│   ├── not-found.tsx                # 404
│   ├── globals.css
│   ├── manifest.json
│   ├── sw.ts
│   └── settings/page.tsx
│
├── actions/                         # ⭐ Server Actions（前後端契約）
│   ├── auth.ts                      # 登入 / 註冊 / 密碼重設
│   ├── profile.ts                   # 用戶設定、頭像
│   ├── marketplace.ts               # 搜尋、商品詳情、掛單簿、成交紀錄、市場價格
│   ├── productCatalog.ts            # 目錄搜尋（Hero / AddAsset）
│   ├── listings.ts                  # 上架提交（Bunny + listings insert）
│   ├── offers.ts                    # 出價 / 接受 / 拒絕 / 修改 / OfferCard context
│   ├── chat.ts                      # getUserChatInbox, sendMessage → rpc_send_chat_message
│   ├── orders.ts                    # searchUserTradingOrders (RPC), getUserTradingOrders, completeMemberOrder, cancelMemberOrder
│   └── reviews.ts                   # submitTransactionReview, getUserReviewedMemberOrderIds, resolveChatCompletionOrderId
│
├── api/
│   ├── cron/
│   │   └── aggregate-prices/route.ts  # Cron Job 2：快照聚合 → market_prices cache
│   └── listings/upload-image/route.ts
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
│   │   └── ProductDetailClient.tsx  # 掛單簿、成交紀錄、市場價 banner、價格圖表
│   ├── [id]/page.tsx                # 商戶櫥窗（mock）
│   ├── [id]/product/[productId]/page.tsx
│   └── payment-status/page.tsx
│
├── profile/                         # 三層級檔案系統（見下方路由表）
├── checkout/[id]/                   # 結帳
├── admin/                           # 管理員 RBAC
├── search/page.tsx
├── ~offline/page.tsx
├── serwist/[path]/route.ts
│
├── lib/                             # App 層工具（非根 lib/）
│   ├── marketplace/
│   │   ├── types.ts                 # 搜尋 / 詳情 / 掛單 / 市場價型別
│   │   └── searchParsers.ts
│   ├── chat/                        # DB 聊天映射 + Realtime 解碼 + 效能輔助
│   │   ├── constants.ts             # isMockChatRoomId, isDbChatRoomId
│   │   ├── mapDbChats.ts            # inbox rows → Zustand ChatRoom / Message（含 SYSTEM_ORDER_COMPLETED）
│   │   ├── mergeChatRooms.ts        # mock + DB room 合併
│   │   ├── offerCardImage.ts        # 出價卡縮圖 URL
│   │   ├── offerCardContextCache.ts # getOfferCardContext 客戶端快取（5 min TTL）
│   │   ├── resolveMemberOrderId.ts # 從 thread 收集 member_order_id（評價批次用）
│   │   └── realtimeChatMessages.ts  # Realtime → Message + Scheme A 解碼 + 修改出價價格解析
│   ├── hooks/
│   │   ├── useCurrentUserId.ts                   # 當前登入 user id（marketplace / 出價 guard）
│   │   ├── useChatRoomRealtime.ts                # chat_messages INSERT 訂閱 + 離線補償
│   │   ├── useRoomReviewedOrderIds.ts            # 每房間批次查詢已評價訂單（聊天完結卡用）
│   │   ├── useMarketplaceSearch.ts
│   │   ├── useMarketplaceProductListings.ts
│   │   ├── useMarketplaceProductTradeHistory.ts
│   │   ├── useMarketplaceProductMarketPrice.ts   # 市場價 banner + 圖表
│   │   ├── useMarketplaceListingDetail.ts        # 掛單詳情（ExecutionSlideOver）
│   │   ├── useProductCatalogSearch.ts
│   │   ├── useHeroMarketplaceSearch.ts
│   │   ├── usePWAEnvironment.ts
│   │   └── usePwaInstall.ts
│   ├── mock-data/                   # 過渡期 mock（profile / chat / orders）
│   └── types/                       # rbac, trading
│
├── store/                           # Zustand
│   ├── useMarketStore.ts
│   ├── useUIStore.ts
│   ├── useHkCardVaultStore.ts       # 全局聊天 + offers 狀態帳本 + Scheme A store actions
│   ├── useMerchantStore.ts
│   ├── useMockDbStore.ts
│   └── useListingSubmitStore.ts     # 上架提交 overlay 狀態
│
└── components/                      # App 層 UI（50+ 元件，按 domain 分目錄）
    ├── marketplace/                 # MarketplaceCard, AccordionFilters, AskOrderBookRow…
    ├── home/                        # HeroSearch（接 catalog search）
    ├── shared/                      # AddAssetModal（上架）, MarketSkeletons…
    ├── navigation/                  # TopNav, BottomNav, MobileHeader…
    ├── transactions/                # ExecutionSlideOver（買家出價入口）
    ├── trading/                     # ReviewModal（交易評價彈窗）
    ├── user/                        # UserOrderRow（#orderNumber 標題 + 完結 / 評價 / 取消）
    ├── chat/                        # GlobalChatOverlay, GlobalChatConsole (+ ReviewModal), OfferCard, SystemOrderCompletedMessage, SpecialTransactionMessage
    └── …                            # profile, merchant, pwa, cards…
```

---

## 📦 lib/ — 根層級 Domain & Infra

```
lib/
├── supabase/
│   ├── env.ts                       # getSupabasePublicEnv(), isSupabaseConfigured()
│   ├── server.ts                    # createClient() — SSR / Server Actions
│   ├── client.ts                    # createClient() — browser / Realtime
│   ├── admin.ts                     # service_role（僅 server / cron）
│   └── middleware.ts                # updateSession()
│
├── auth/
│   ├── session.ts                   # getOptionalAuthUser(), resolveCurrentDemoRole()
│   ├── roles.ts                     # RBAC 路由
│   ├── validation.ts
│   ├── username.ts                  # 註冊時唯一 username 候選生成
│   ├── password-errors.ts
│   └── site-url.ts
│
├── marketplace/
│   ├── filter-options.ts
│   ├── product-listing-filters.ts   # 掛單簿 grade chip → RPC JSON
│   ├── listing-display.ts           # 等級標籤、相對成交時間
│   └── market-price.ts              # 市場價聚合、grade 正規化、圖表資料
│
├── catalog/
│   └── element-types.ts             # 卡牌屬性 → 繁中
│
├── grading/
│   └── options.ts                   # GRADING_OPTIONS, matchesGradeFilter
│
├── listings/                        # 上架流程
│   ├── validation.ts
│   ├── images.ts / image-files.ts
│   ├── client-upload.ts
│   ├── submit-card-listing.ts
│   └── errors.ts
│
├── profile/
│   ├── validation.ts
│   ├── avatar.ts
│   └── errors.ts
│
├── storage/
│   └── bunny.ts                     # Bunny.net 圖片上傳
│
└── utils.ts                         # cn() 等 shadcn 工具
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
└── test-product-catalog-search.ts   # `bun run test:catalog-search` — DB 連線驗證
```

---

## 🐘 supabase/

```
supabase/
├── config.toml
└── migrations/                      # 按時間戳排序，bunx supabase db push
    ├── 20260702100000_product_catalog_public_read.sql
    ├── 20260702110000_auth_profiles_registration.sql
    ├── 20260702120000_marketplace_search_rpc.sql
    ├── 20260702130000_marketplace_search_rpc_v2.sql
    ├── 20260703100000_profiles_default_avatar.sql
    ├── 20260703110000_profiles_owner_update.sql
    ├── 20260703120000_profiles_settings_columns.sql
    ├── 20260703130000_listings_owner_insert.sql
    ├── 20260703140000_listings_owner_insert_simplify.sql
    ├── 20260703150000_listings_service_role_grants.sql
    ├── 20260703160000_listing_stats_service_role_grants.sql
    ├── 20260703170000_get_marketplace_product_listings.sql   # 商品詳情掛單簿 RPC
    ├── 20260703180000_member_orders_trade_history_read.sql   # 成交紀錄 RLS
    ├── 20260703210000_market_prices_service_role_grants.sql   # cron 寫入 market_prices
    ├── 20260703220000_product_grading_market_prices_public_read.sql  # 圖表 / banner 公開讀
    ├── 20260704130000_rpc_make_offer.sql                      # 原子出價 + chat room + message
    ├── 20260704140000_profiles_username_on_signup.sql         # 註冊觸發器自動分配 username
    ├── 20260704150000_rpc_accept_offer.sql                    # 賣家接受 → hold listing + member_orders
    ├── 20260704160000_rpc_make_offer_single_pending.sql       # 每買家每掛單僅一筆 active offer
    ├── 20260704170000_rpc_modify_offer.sql                    # 買家修改 pending offer + modified_count
    ├── 20260704180000_offers_listing_id_user_centric_rooms.sql  # offers.listing_id + user-centric chat rooms
    ├── 20260704190000_chat_rooms_messages_rls.sql              # chat_rooms / chat_messages / offers RLS
    ├── 20260704190500_rpc_reject_offer.sql                    # 賣家拒絕出價 + SYSTEM_OFFER_REJECTED
    ├── 20260704200000_get_user_chat_inbox_rpc.sql            # get_user_chat_inbox() SECURITY DEFINER
    ├── 20260704210500_rpc_send_chat_message.sql               # 純文字發送 RPC + is_chat_room_member
    ├── 20260704210000_order_actions_rpc.sql                   # rpc_complete_member_order / rpc_cancel_member_order
    ├── 20260704220000_marketplace_search_keyword.sql          # 大盤搜尋關鍵字 RPC
    ├── 20260704230000_rpc_accept_offer_fix_listing_id.sql     # accept_offer listing_id 修復（Scheme B）
    ├── 20260704240000_chat_messages_realtime.sql              # chat_messages 加入 Realtime publication
    ├── 20260704250000_member_orders_order_number.sql          # member_orders.order_number + accept 注入
    ├── 20260704260000_merchant_order_reputation_stats.sql     # 信譽統計 trigger
    ├── 20260704270000_transaction_reviews_rls.sql             # transaction_reviews RLS
    ├── 20260704280000_rpc_submit_transaction_review.sql       # 提交評價 + 批次已評價查詢 RPC
    ├── 20260704290000_transaction_reviews_double_blind.sql    # 雙盲公開評價
    ├── 20260704300000_get_user_chat_inbox_member_order_id.sql  # inbox 訊息含 member_order_id
    └── 20260705120000_search_user_trading_orders.sql         # 訂單列表分頁搜尋 + tab facet counts
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
└── follow-up/                       # 每個 workflow 一 packet
    ├── auth-login-register/
    ├── auth-password-recovery/
    ├── marketplace-search/
    ├── marketplace-product-detail/
    ├── market-pricing-cron/         # Cron Job 2：價格快照聚合
    ├── product-catalog-search/
    ├── user-profile-settings/
    ├── role-based-routing/
    ├── offers-negotiation/          # 出價 / 接受 / 修改（legacy handoff；見 chat-offers-inbox）
    ├── chat-offers-inbox/           # DB 收件匣 + OfferCard + Realtime + 完結卡 / 評價 CTA + 長線程效能
    ├── user-trading-orders/         # 我的訂單分頁搜尋 RPC + 完結 / 取消 + orderNumber 列布局
    ├── transaction-reviews/         # 雙盲評價 + ReviewModal（交易頁 + 聊天）
    ├── member-rewards-gamification/ # 簽到 / 積分 / 折價券 / auto-grant 通知
    └── wishlist/
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
| `/marketplace/product/[id]` | 商品詳情 | catalog + 掛單 RPC + 成交紀錄 + 市場價 + 買家出價 |
| `/profile/user/settings` | 用戶設定 | `getUserSettings` |
| `/profile/user/trading` | 我的買賣訂單 | `searchUserTradingOrders` RPC + 伺服器分頁 / 搜尋 / tab counts + `UserOrderRow` |
| `/checkout/[id]` | 結帳 | mock（待整合） |
| `/admin/*` | 管理後台 | mock + RBAC |
| `/api/cron/aggregate-prices` | 市場價聚合 cron | `product_price_snapshots` → `product_grading_market_prices` |

---

## 🎯 核心模組狀態

| 模組 | 位置 | 狀態 |
|------|------|------|
| **Auth 登入 / 註冊** | `app/actions/auth.ts`, `app/auth/`, `lib/auth/username.ts` | ✅ Supabase（含註冊自動 username） |
| **密碼重設** | `app/auth/forgot-password/`, `reset-password/` | ✅ Supabase |
| **大盤搜尋** | `app/marketplace/page.tsx`, RPC v2 | ✅ Wired |
| **商品詳情** | `app/marketplace/product/[id]/` | ✅ Catalog + 掛單簿 + 成交紀錄 + 市場價 banner + 圖表 |
| **市場價聚合 (Cron)** | `app/api/cron/aggregate-prices/`, `lib/marketplace/market-price.ts` | ✅ Wired |
| **用戶設定** | `app/profile/user/settings/` | ✅ Supabase profiles |
| **卡牌上架** | `AddAssetModal`, `listings.ts`, Bunny | ✅ Backend ready |
| **出價協商** | `app/actions/offers.ts`, `app/components/chat/OfferCard.tsx` | 🟡 make / modify / accept / reject RPC 已接；checkout 導流待完成 |
| **聊天收件匣** | `app/actions/chat.ts`, `GlobalChatOverlay`, `GlobalChatConsole`, `useChatRoomRealtime` | 🟡 DB inbox + 文字發送 + Realtime + 完結卡 / 評價 CTA + 長線程效能優化；mock 房間保留 |
| **用戶訂單** | `app/actions/orders.ts`, `app/profile/user/(dashboard)/trading/`, `UserOrderRow.tsx` | 🟡 分頁搜尋 RPC + 完結 / 取消 / 評價已接；訂單詳情頁仍 mock |
| **交易評價** | `app/actions/reviews.ts`, `ReviewModal.tsx`, `SystemOrderCompletedMessage.tsx` | ✅ 雙盲提交已接（交易頁 + 聊天）；profile 評價展示待完成 |
| **結帳 / 願望清單** | checkout, wishlist UI | ⏳ Mock |

---

## ⚙️ CI & 本地驗證

GitHub Actions（`.github/workflows/ci.yml`）**不含** `.env`：

```bash
bun ci                    # frozen lockfile
bunx tsc --noEmit
bun run lint
bun run build             # CI 等同此步
bun run build:ci          # 本地模擬 CI（空 Supabase env）
bun run test:catalog-search  # 可選：驗證 catalog DB 連線
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
| 整合狀態 | `docs/dev/INTEGRATION_QUEUE.md` |
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

**最後更新**: 2026-07-05  
**版本**: Full-Depth v4.5  
**維護者**: HKCardVault 開發團隊
