# 🗂️ HKCardVault - 完整專案結構樹 (Full-Depth)

## 📊 項目統計

- **根目錄層級**: 5 層
- **主要目錄**: 9 個（`app/`, `components/`, `docs/`, `lib/`, `public/`, `.stitch/`, `.agents/`, `.github/`, `.vscode/`）
- **總檔案數**: 300+ 個（排除 `node_modules`）
- **語言**: TypeScript/TSX, CSS, JSON, Markdown
- **框架**: Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui, Zustand, Serwist (PWA)
- **後端整合**: 規劃中（詳見 `BACKEND_INTEGRATION_MASTERPLAN.md`；目前以 mock data 驅動）

---

## 🌳 完整樹狀結構 (Full Depth Tree)

```
Pokemon-Card-Trading-Platform-Client/
├─ 🔧 配置檔案 (Configuration & Build)
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── eslint.config.mjs
│   ├── postcss.config.mjs
│   ├── components.json              # shadcn/ui 配置
│   ├── skills-lock.json
│   ├── bun.lock
│   ├── README.md
│   ├── GEMINI.md
│   └── BACKEND_INTEGRATION_MASTERPLAN.md
│
├─ 📁 app/ (Next.js App Router 應用層)
├─ 🧩 components/ (shadcn/ui 基礎元件)
├─ 📦 lib/ (shadcn 工具函數)
├─ 📖 docs/ (文件 & 規劃中心)
├─ 🎨 .stitch/ (Stitch 設計系統)
├─ 🤖 .agents/skills/ (Agent 技能庫)
├─ 🔗 .github/ (GitHub 配置 & AI 指引)
├─ 🌐 public/ (靜態資源 & PWA 素材)
└─ ⚙️ .vscode/ (編輯器配置)
```

### 詳細結構

**app/ 目錄** (Next.js App Router — 110+ 檔案)

```
app/
├── 根層級
│   ├── page.tsx                    # 首頁
│   ├── layout.tsx                  # 全局 Layout
│   ├── globals.css                 # 全局樣式
│   ├── manifest.json               # PWA 配置
│   ├── favicon.ico
│   ├── sw.ts                       # Service Worker
│   └── settings/page.tsx           # 全局設定
│
├── auth/                           # 認證系統
│   ├── page.tsx
│   └── AuthForm.tsx
│
├── marketplace/                    # 商城模組
│   ├── page.tsx
│   ├── layout.tsx
│   ├── [id]/page.tsx               # 賣家/系列詳情
│   ├── [id]/product/[productId]/page.tsx
│   ├── product/[id]/page.tsx       # 商品詳情
│   └── payment-status/page.tsx
│
├── checkout/                       # 結帳流程
│   └── [id]/
│       ├── page.tsx
│       └── success/page.tsx
│
├── profile/                        # 三層級檔案系統
│   ├── page.tsx                    # 檔案入口
│   │
│   ├── user/                       # 📌 用戶自己的檔案 (第一人稱)
│   │   ├── (dashboard)/            # 路由群組（共用 layout + TabNav）
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # 總覽
│   │   │   ├── collection/page.tsx # 卡牌庫
│   │   │   ├── inventory/page.tsx  # 商品管理
│   │   │   └── trading/page.tsx    # 交易管理
│   │   ├── orderDetail/[id]/page.tsx
│   │   ├── rewards/page.tsx
│   │   └── settings/page.tsx
│   │
│   ├── merchant/                   # 📌 商家儀表板 (第一人稱)
│   │   ├── (dashboard)/            # 路由群組（共用 layout + TabNav）
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx            # 總覽
│   │   │   ├── inventory/page.tsx  # 商品管理
│   │   │   ├── trading/page.tsx    # 交易管理
│   │   │   └── finance/page.tsx    # 資金金流
│   │   ├── analytics/page.tsx      # 商品分析
│   │   ├── performance/page.tsx    # 績效報告
│   │   ├── orderDetail/[id]/page.tsx
│   │   └── settings/page.tsx
│   │
│   └── [id]/                       # 📌 查看他人檔案 (第三人稱)
│       ├── page.tsx                # 公開檔案頁
│       └── rating/page.tsx         # 評價頁
│
├── admin/                          # 管理員模組 (RBAC 保護)
│   ├── page.tsx
│   ├── layout.tsx
│   ├── users/page.tsx
│   ├── approvals/page.tsx          # KYC 審批
│   ├── database/page.tsx
│   └── settings/page.tsx
│
├── search/page.tsx                 # 全域搜尋
├── ~offline/page.tsx               # PWA 離線頁面
├── serwist/[path]/route.ts         # Service Worker 路由
│
├── store/                          # Zustand 狀態管理
│   ├── useHkCardVaultStore.ts
│   ├── useMarketStore.ts
│   ├── useMerchantStore.ts
│   ├── useMockDbStore.ts
│   └── useUIStore.ts
│
├── components/                     # 50+ 共享元件庫
│   ├── home/                       # 首頁元件
│   │   ├── HeroSearch.tsx
│   │   ├── TrustBanner.tsx
│   │   ├── PremiumMarket.tsx
│   │   ├── NewArrivals.tsx
│   │   ├── FollowingFeed.tsx
│   │   └── PortfolioRewards.tsx
│   │
│   ├── cards/                      # 卡片元件
│   │   ├── CardGrid.tsx
│   │   ├── CardItem.tsx
│   │   ├── GradeBadge.tsx
│   │   └── RarityBadge.tsx
│   │
│   ├── marketplace/                # 商城元件
│   │   ├── MarketplaceHeader.tsx
│   │   ├── MarketplaceGrid.tsx
│   │   ├── MarketplaceCard.tsx
│   │   ├── AskOrderBookRow.tsx
│   │   └── filters/
│   │       ├── AccordionFilters.tsx
│   │       └── SmartSearch.tsx
│   │
│   ├── navigation/                 # 導航元件
│   │   ├── TopNav.tsx
│   │   ├── MobileHeader.tsx
│   │   ├── BottomNav.tsx
│   │   └── Footer.tsx
│   │
│   ├── profile/                    # 檔案元件
│   │   ├── ProfileTabNav.tsx
│   │   ├── ProfileHeaderWithChat.tsx
│   │   └── LogoutModal.tsx
│   │
│   ├── merchant/                   # 商家元件
│   │   ├── NewListingForm.tsx
│   │   ├── InventoryAccordion.tsx
│   │   └── MerchantOrderRow.tsx
│   │
│   ├── user/UserOrderRow.tsx       # 用戶訂單列
│   ├── rewards/CheckInCard.tsx     # 簽到獎勵
│   │
│   ├── chat/                       # 聊天
│   │   ├── GlobalChatConsole.tsx
│   │   └── SpecialTransactionMessage.tsx
│   │
│   ├── ticker/PriceTicker.tsx      # 行情條
│   │
│   ├── transactions/               # 交易
│   │   ├── ExecutionSlideOver.tsx
│   │   ├── GlobalTxButtons.tsx
│   │   └── OrderLifecycleStepper.tsx
│   │
│   ├── pwa/                        # PWA 元件
│   │   ├── PWANavbarStatus.tsx
│   │   ├── PwaInstallPrompt.tsx
│   │   ├── PwaHeroInstallButton.tsx
│   │   ├── PwaNetworkBanner.tsx
│   │   ├── PwaInlineBanner.tsx
│   │   └── IosPwaModal.tsx
│   │
│   ├── shared/                     # 共用 UI
│   │   ├── AddAssetModal.tsx
│   │   ├── DemoRoleSwitcher.tsx
│   │   ├── WishlistTicker.tsx
│   │   ├── MarketSkeletons.tsx
│   │   ├── PortfolioSkeletons.tsx
│   │   ├── CouponSkeletons.tsx
│   │   └── StreamingSkeletons.tsx
│   │
│   ├── ui/                         # App 層自訂 UI
│   │   ├── Accordion.tsx
│   │   ├── Pagination.tsx
│   │   └── SlideOver.tsx
│   │
│   ├── admin/AdminNav.tsx
│   ├── market/
│   │   ├── WishlistButton.tsx
│   │   └── WishlistTable.tsx
│   └── serwist-provider.tsx
│
└── lib/                            # 工具庫
    ├── hooks/
    │   ├── usePWAEnvironment.ts
    │   └── usePwaInstall.ts
    ├── types/
    │   ├── rbac.ts
    │   └── trading.ts
    ├── utils/chatUtils.ts
    ├── mock-public-members.ts
    └── mock-data/
        ├── cards.ts
        ├── chatrooms.ts
        ├── member-rating.ts
        ├── members.ts
        └── transactions.ts
```

**components/ 目錄** (shadcn/ui 基礎元件)

```
components/
├── ui/                             # shadcn 基礎元件
│   ├── alert-dialog.tsx
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── carousel.tsx
│   ├── chart.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── pagination.tsx
│   ├── progress.tsx
│   ├── select.tsx
│   ├── separator.tsx
│   ├── skeleton.tsx
│   ├── slider.tsx
│   ├── sonner.tsx
│   ├── spinner.tsx
│   └── switch.tsx
├── reui/                           # ReUI 擴展元件
│   ├── badge.tsx
│   └── stepper.tsx
└── examples/                       # 元件範例
    ├── c-alert-dialog-8.tsx
    └── c-chart-16.tsx
```

**lib/ 目錄** (根層級 shadcn 工具)

```
lib/
└── utils.ts                        # cn() 等共用工具函數
```

**docs/ 目錄** (文件中心)

```
docs/
├── 📋 主要文件
│   ├── requirement.md              # ⭐ 系統需求規格
│   ├── plan-sync-archive.md        # 開發計劃
│   ├── task.md                     # 任務追蹤
│   └── Role-Based-Access-Control.md
│
└── dev/                            # 開發 TODO 追蹤
    ├── server.md
    ├── api.md
    ├── database.md
    └── follow-up/                  # 功能後續整合追蹤
        ├── toast_backend_follow_up.md
        ├── merchant_checkout_follow_up.md
        ├── marketplace_search_and_filter_follow_up.md
        └── wishlist/
            ├── backend_db_api.md
            └── frontend_ui.md
```

**public/ 目錄** (靜態資源)

```
public/
├── asset/                          # 品牌 & 展示素材
│   ├── logo.png
│   ├── 01.png
│   ├── 02.png
│   └── 03.png
├── icons/                          # PWA 圖示
│   ├── icon-192x192.png
│   └── icon-512x512.png
├── splash_screens/                 # iOS PWA 啟動畫面 (多裝置尺寸)
└── [svg 資源]
    ├── file.svg
    ├── globe.svg
    ├── next.svg
    ├── vercel.svg
    └── window.svg
```

**.stitch/ 目錄** (設計系統)

```
.stitch/
└── designs/
    └── DESIGN.md                   # 主設計規範
```

**.agents/skills/ 目錄** (13 個技能)

```
.agents/skills/
├── taste-design/                   # 建立設計規範
├── extract-design-md/              # 提取設計系統
├── stitch-design/                  # 生成 UI 設計
├── generate-design/                # 生成設計變體
├── react-components/               # 轉換為 React
├── shadcn-ui/                      # shadcn 整合指引
├── shadcn/                         # shadcn CLI & 元件管理
├── code-to-design/                 # 代碼 → 設計
├── extract-static-html/            # 提取 HTML
├── upload-to-stitch/               # 上傳資源
├── enhance-prompt/                 # 改進提示詞
├── manage-design-system/           # 管理設計系統
└── stitch-loop/                    # 迭代構建工作流
```

**.github/ 目錄** (AI 指引 & CI)

```
.github/
├── copilot-instructions.md         # 📌 HKCardVault 黃金工作流
├── workflows/
│   └── ci.yml                      # CI 流程
└── prompts/
    ├── react-components.prompt.md
    ├── shadcn-ui.prompt.md
    ├── stitch-code-to-design-v2.prompt.md
    ├── stitch-screen-to-code.prompt.md
    └── taste-prompt-generator.prompt.md
```

---

## 📋 路由架構 (三層級檔案系統)

### 核心特色：三層級檔案系統

```
/profile/user              → 你的個人中心 (第一人稱)
  /user/collection         → 卡牌庫
  /user/inventory          → 商品管理
  /user/trading            → 交易管理
  /user/orderDetail/[id]   → 訂單詳情
  /user/rewards            → 獎勵中心
  /user/settings           → 個人設定

/profile/merchant          → 你的商家儀表板 (第一人稱)
  /merchant/inventory      → 商品管理
  /merchant/trading        → 交易管理
  /merchant/finance        → 資金金流
  /merchant/analytics      → 商品分析
  /merchant/performance    → 績效報告
  /merchant/orderDetail/[id] → 訂單詳情
  /merchant/settings       → 商家設定

/profile/[id]              → 查看他人檔案 (第三人稱)
  /[id]/rating             → 評價頁
  例: /profile/HKCV-8839-44A
```

> `(dashboard)` 為 Next.js 路由群組，不影響 URL 路徑，僅共用 layout 與 TabNav。

### 其他關鍵路由

| 路由                              | 用途           | 認證 | 角色限制   |
| --------------------------------- | -------------- | ---- | ---------- |
| `/auth`                           | 登入/註冊      | ✖️   | 無         |
| `/marketplace`                    | 卡片交易市場   | ✖️   | 無         |
| `/marketplace/product/[id]`       | 商品詳情       | ✖️   | 無         |
| `/marketplace/[id]/product/[productId]` | 賣家商品詳情 | ✖️ | 無         |
| `/checkout/[id]`                  | 結帳流程       | ✅   | 登入用戶   |
| `/checkout/[id]/success`          | 結帳成功       | ✅   | 登入用戶   |
| `/search`                         | 全域搜尋       | ✖️   | 無         |
| `/admin/*`                        | 管理員後台     | ✅   | Admin only |
| `/settings`                       | 全局設定       | ✅   | 登入用戶   |
| `/~offline`                       | PWA 離線頁面   | ✖️   | 無         |

---

## 🎯 核心模組分析

### 1️⃣ 應用層 (`/app`)

| 模組            | 檔案數 | 用途                    | 狀態      |
| --------------- | ------ | ----------------------- | --------- |
| **marketplace** | 6      | 卡片交易市場 & 商品詳情 | ✅ 開發中 |
| **checkout**    | 2      | 結帳流程                | ✅ 開發中 |
| **profile**     | 20     | 用戶/商家檔案系統       | ✅ 開發中 |
| **components**  | 54     | App 層 UI 元件庫        | ✅ 開發中 |
| **store**       | 5      | Zustand 全局狀態        | ✅ 開發中 |
| **admin**       | 6      | 管理員儀表板            | ✅ 開發中 |
| **auth**        | 2      | 認證系統                | ✅ 開發中 |
| **lib**         | 12     | Mock 資料、型別、Hooks  | ✅ 開發中 |

### 2️⃣ UI 基礎層 (`/components` + `/lib`)

- **`components/ui/`** — shadcn/ui 安裝的基礎元件（Button, Dialog, Chart 等）
- **`components/reui/`** — ReUI 擴展元件（Badge, Stepper）
- **`lib/utils.ts`** — `cn()` 等 Tailwind 合併工具
- **`components.json`** — shadcn 配置（路徑別名、樣式主題）

### 3️⃣ 設計系統 (`.stitch/`)

**DESIGN.md** 規範：

- 🎨 **色彩系統**: 禁止 #000000、符合高端金融美學
- ✍️ **排版**: 禁止 Inter、使用高端字型
- 📏 **間距**: 嚴格的量度系統
- 🧩 **元件樣式**: 模組化元件規則
- ⚡ **動畫**: Spring physics 動畫指引

### 4️⃣ Agent 技能庫 — 13 個專門技能

**工作流順序**:

1. **taste-design** → 建立設計規範
2. **stitch-design** → 生成 UI 設計
3. **react-components** → 轉換為 React
4. **shadcn** / **shadcn-ui** → 整合基礎 UI 元件

---

## ✅ 開發檢查清單

提交前確認:

- [ ] ✅ 檢查 `.stitch/designs/DESIGN.md` 規則
- [ ] ✅ 顏色/字型 100% 來自 DESIGN.md
- [ ] ✅ 檢查 TODO `[MOCK DATA]`, `[API]`, `[BACKEND]` 註解
- [ ] ✅ 在 `/docs/dev/` 更新 TODO 追蹤表
- [ ] ✅ 新 App 元件放在 `/app/components/[category]/`
- [ ] ✅ 新 shadcn 元件透過 CLI 安裝至 `/components/ui/`
- [ ] ✅ 路由符合三層級檔案系統規則
- [ ] ✅ 全局狀態優先使用 `/app/store/` 的 Zustand store
- [ ] ✅ TypeScript 型別 100% 覆蓋
- [ ] ✅ Mobile-first 佈局確認
- [ ] ✅ 禁止使用泛用 AI 措辭
- [ ] ✅ 禁止 #000000、Inter 字型

---

## 🚀 快速導航

| 需求           | 檔案位置                                      |
| -------------- | --------------------------------------------- |
| 新增頁面       | `/app/[route]/page.tsx`                       |
| 新增 App 元件  | `/app/components/[category]/`                 |
| 新增 shadcn 元件 | `bunx --bun shadcn@latest add [component]` → `/components/ui/` |
| 全局狀態       | `/app/store/`                                 |
| Mock 資料      | `/app/lib/mock-data/`                         |
| 設計規範       | `.stitch/designs/DESIGN.md`                   |
| 系統需求       | `/docs/requirement.md`                        |
| 開發計劃       | `/docs/plan-sync-archive.md`                  |
| 後端整合計劃   | `/BACKEND_INTEGRATION_MASTERPLAN.md`           |
| API TODO       | `/docs/dev/api.md`                            |
| 資料庫 TODO    | `/docs/dev/database.md`                       |
| 伺服器 TODO    | `/docs/dev/server.md`                         |
| AI 指引        | `.github/copilot-instructions.md`             |
| CI 配置        | `.github/workflows/ci.yml`                    |

---

**最後更新**: 2026-07-02
**版本**: Full-Depth v3.0
**維護者**: HKCardVault 開發團隊
