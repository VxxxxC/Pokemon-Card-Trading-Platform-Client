# 🗂️ HKCardVault - 完整專案結構樹 (Full-Depth)

## 📊 項目統計

- **根目錄層級**: 5 層
- **主要目錄**: 11 個（`app/`, `components/`, `lib/`, `types/`, `supabase/`, `docs/`, `public/`, `.stitch/`, `.agents/`, `.github/`, `.vscode/`）
- **總檔案數**: 350+ 個（排除 `node_modules`）
- **語言**: TypeScript/TSX, CSS, JSON, Markdown, SQL
- **框架**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, Serwist (PWA)
- **後端整合**: **進行中** — Supabase（Auth、RLS、RPC、Server Actions）；部分 UI 仍用 mock data
- **Package manager**: Bun only（`bun.lock`；見 `.cursorrules` §7）

---

## 🌳 頂層結構 (Top-Level)

```
Pokemon-Card-Trading-Platform-Client/
├─ 🔧 配置 & 規範
│   ├── package.json                 # scripts: dev, build, build:ci, lint, supabase:types
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
├─ 🗄️ types/supabase.ts              # Supabase CLI 生成型別（唯一 DB schema 來源）
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
│   ├── layout.tsx                   # 全局 Layout
│   ├── not-found.tsx                # 404
│   ├── globals.css
│   ├── manifest.json
│   ├── sw.ts
│   └── settings/page.tsx
│
├── actions/                         # ⭐ Server Actions（前後端契約）
│   ├── auth.ts                      # 登入 / 註冊 / 密碼重設
│   ├── profile.ts                   # 用戶設定、頭像
│   ├── marketplace.ts               # 搜尋、商品詳情、掛單、成交紀錄
│   ├── productCatalog.ts            # 目錄搜尋（Hero / AddAsset）
│   └── listings.ts                  # 上架提交（Bunny + listings insert）
│
├── api/
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
│   ├── layout.tsx
│   ├── MarketplaceChrome.tsx        # 商品詳情頁隱藏全局 Nav
│   ├── product/[id]/
│   │   ├── page.tsx                 # SSR catalog + ProductDetailClient
│   │   └── ProductDetailClient.tsx  # 掛單簿、成交紀錄、圖表 skeleton
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
│   │   ├── types.ts                 # 搜尋 / 詳情 / 掛單型別
│   │   └── searchParsers.ts
│   ├── hooks/
│   │   ├── useMarketplaceSearch.ts
│   │   ├── useMarketplaceProductListings.ts
│   │   ├── useMarketplaceProductTradeHistory.ts
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
│   ├── useHkCardVaultStore.ts
│   ├── useMerchantStore.ts
│   ├── useMockDbStore.ts
│   └── useListingSubmitStore.ts     # 上架提交 overlay 狀態
│
└── components/                      # App 層 UI（50+ 元件，按 domain 分目錄）
    ├── marketplace/                 # MarketplaceCard, AccordionFilters, AskOrderBookRow…
    ├── home/                        # HeroSearch（接 catalog search）
    ├── shared/                      # AddAssetModal（上架）, MarketSkeletons…
    ├── navigation/                  # TopNav, BottomNav…
    ├── transactions/                # ExecutionSlideOver
    └── …                            # profile, merchant, pwa, chat, cards…
```

---

## 📦 lib/ — 根層級 Domain & Infra

```
lib/
├── supabase/
│   ├── env.ts                       # getSupabasePublicEnv(), isSupabaseConfigured()
│   ├── server.ts                    # createClient() — SSR / Server Actions
│   ├── admin.ts                     # service_role（僅 server）
│   └── middleware.ts                # updateSession()
│
├── auth/
│   ├── session.ts                   # getOptionalAuthUser(), resolveCurrentDemoRole()
│   ├── roles.ts                     # RBAC 路由
│   ├── validation.ts
│   ├── password-errors.ts
│   └── site-url.ts
│
├── marketplace/
│   ├── filter-options.ts
│   ├── product-listing-filters.ts   # 掛單簿 grade chip → RPC JSON
│   └── listing-display.ts           # 等級標籤、相對成交時間
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
├── ui/                              # shadcn 基礎元件
├── reui/                            # badge, stepper
├── auth/PasswordUpdatedToast.tsx
├── errors/NotFoundContent.tsx
├── listings/ListingSubmitOverlay.tsx
├── shared/RelativeDateTime.tsx      # 成交紀錄相對時間
└── examples/
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
    └── 20260703180000_member_orders_trade_history_read.sql   # 成交紀錄 RLS
```

**Regenerate types:** `bun run supabase:types` → `types/supabase.ts`

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
    ├── product-catalog-search/
    ├── user-profile-settings/
    ├── role-based-routing/
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
| `/marketplace/product/[id]` | 商品詳情 | catalog + 掛單 RPC + 成交紀錄 |
| `/profile/user/settings` | 用戶設定 | `getUserSettings` |
| `/checkout/[id]` | 結帳 | mock（待整合） |
| `/admin/*` | 管理後台 | mock + RBAC |

---

## 🎯 核心模組狀態

| 模組 | 位置 | 狀態 |
|------|------|------|
| **Auth 登入 / 註冊** | `app/actions/auth.ts`, `app/auth/` | ✅ Supabase |
| **密碼重設** | `app/auth/forgot-password/`, `reset-password/` | ✅ Supabase |
| **大盤搜尋** | `app/marketplace/page.tsx`, RPC v2 | ✅ Wired |
| **商品詳情** | `app/marketplace/product/[id]/` | ✅ Catalog + 掛單簿 + 成交紀錄；⏳ 價格圖表 |
| **用戶設定** | `app/profile/user/settings/` | ✅ Supabase profiles |
| **卡牌上架** | `AddAssetModal`, `listings.ts`, Bunny | ✅ Backend ready |
| **結帳 / 願望清單** | checkout, wishlist UI | ⏳ Mock |
| **Profile 訂單 / 聊天** | profile dashboards | ⏳ 多為 mock |

---

## ⚙️ CI & 本地驗證

GitHub Actions（`.github/workflows/ci.yml`）**不含** `.env`：

```bash
bun ci                    # frozen lockfile
bunx tsc --noEmit
bun run lint
bun run build             # CI 等同此步
bun run build:ci          # 本地模擬 CI（空 Supabase env）
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
| Domain helper | `lib/[domain]/` |
| 客戶端 hook | `app/lib/hooks/` |
| Supabase 型別 | `types/supabase.ts` |
| Migration | `supabase/migrations/` |
| 整合狀態 | `docs/dev/INTEGRATION_QUEUE.md` |
| API 契約 | `docs/dev/api.md` |
| 開發守則 | `.cursorrules` |
| CI 配置 | `.github/workflows/ci.yml` |
| 設計規範 | `.stitch/designs/DESIGN.md` |

---

**最後更新**: 2026-07-03  
**版本**: Full-Depth v4.0  
**維護者**: HKCardVault 開發團隊
