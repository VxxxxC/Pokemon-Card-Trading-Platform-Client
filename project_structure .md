# 🗂️ PokéTrade JP - 完整專案結構樹 (Full-Depth)

## 📊 項目統計

- **根目錄層級**: 5 層
- **主要目錄**: 16 個
- **總檔案數**: 130+ 個（排除 node_modules）
- **語言**: TypeScript/TSX, CSS, JSON, Markdown
- **框架**: Next.js 14 (App Router), Tailwind CSS, Supabase, shadcn/ui

---

## 🌳 完整樹狀結構 (Full Depth Tree)

```
Pokemon-Card-Trading-Platform/
├─ 🔧 配置檔案 (Configuration & Build)
├─ 📁 app/ (Next.js App Router 應用層)
├─ 📖 docs/ (文件 & 規劃中心)
├─ 🎨 .stitch/ (Stitch 設計系統)
├─ 🤖 .agents/skills/ (Agent 技能庫)
├─ 🔗 .github/ (GitHub 配置 & AI指引)
├─ 🌐 public/ (靜態資源)
└─ [其他根檔案]
```

### 詳細結構

**app/ 目錄** (Next.js App Router - 80+ 檔案)

```
app/
├── 根層級
│   ├── page.tsx                    # 首頁
│   ├── layout.tsx                  # 全局 Layout
│   ├── globals.css                 # 全局樣式
│   ├── manifest.json               # PWA 配置
│   ├── favicon.ico
│   ├── sw.ts                       # Service Worker
│   └── settings/page.tsx
│
├── auth/                           # 認證系統
│   ├── page.tsx
│   └── AuthForm.tsx
│
├── marketplace/                    # 商城模組
│   ├── page.tsx
│   ├── layout.tsx
│   ├── [id]/page.tsx              # 卡片詳情 (動態路由)
│   └── payment-status/page.tsx
│
├── profile/                        # 三層級檔案系統
│   ├── page.tsx
│   ├── user/                      # 📌 用戶自己的檔案 (第一人稱)
│   │   ├── page.tsx               # 用戶個人中心
│   │   ├── layout.tsx
│   │   ├── orders/page.tsx        # 訂單歷史
│   │   ├── collection/            # 願望單/收藏
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       └── WishlistTable.tsx
│   │   └── settings/page.tsx      # 個人設定
│   │
│   ├── merchant/                  # 📌 商家儀表板 (第一人稱)
│   │   ├── page.tsx               # 商家首頁
│   │   ├── layout.tsx
│   │   ├── inventory/page.tsx     # 庫存管理
│   │   ├── sales/page.tsx         # 銷售報告
│   │   ├── finance/page.tsx       # 財務報表
│   │   └── settings/page.tsx      # 商家設定
│   │
│   └── [id]/                      # 📌 查看他人檔案 (第三人稱)
│       ├── page.tsx               # 公開檔案頁
│       └── components/
│           └── InteractiveChat.tsx
│
├── admin/                          # 管理員模組 (RBAC保護)
│   ├── page.tsx
│   ├── layout.tsx
│   ├── users/page.tsx
│   ├── approvals/page.tsx         # KYC審批
│   ├── database/page.tsx
│   └── settings/page.tsx
│
├── search/page.tsx                # 全域搜尋
├── ~offline/page.tsx              # PWA 離線頁面
├── serwist/[path]/route.ts        # Service Worker 路由
│
├── components/                     # 40+ 共享元件庫
│   ├── home/                      # 首頁元件
│   │   ├── HeroSearch.tsx
│   │   ├── TrustBanner.tsx
│   │   ├── TokyoMarketIndex.tsx
│   │   ├── PremiumMarket.tsx
│   │   ├── NewArrivals.tsx
│   │   ├── FollowingFeed.tsx
│   │   ├── PortfolioRewards.tsx
│   │   └── SniperRadar.tsx
│   │
│   ├── cards/                     # 卡片元件
│   │   ├── CardGrid.tsx
│   │   ├── CardItem.tsx
│   │   ├── GradeBadge.tsx
│   │   └── RarityBadge.tsx
│   │
│   ├── marketplace/               # 商城元件
│   │   ├── MarketplaceHeader.tsx
│   │   ├── MarketplaceGrid.tsx
│   │   ├── MarketplaceCard.tsx
│   │   └── filters/
│   │       ├── AccordionFilters.tsx
│   │       └── SmartSearch.tsx
│   │
│   ├── navigation/                # 導航元件
│   │   ├── TopNav.tsx
│   │   ├── MobileHeader.tsx
│   │   ├── BottomNav.tsx
│   │   └── Footer.tsx
│   │
│   ├── profile/                   # 檔案元件
│   │   ├── ProfileTabNav.tsx
│   │   ├── CheckInWidget.tsx
│   │   └── LogoutModal.tsx
│   │
│   ├── chat/ChatWindow.tsx        # 聊天
│   ├── ticker/PriceTicker.tsx     # 行情條
│   ├── transactions/              # 交易
│   │   ├── TransactionWall.tsx
│   │   └── ExecutionSlideOver.tsx
│   ├── pwa/                       # PWA 元件
│   │   ├── PWANavbarStatus.tsx
│   │   ├── PwaInstallPrompt.tsx
│   │   ├── PwaHeroInstallButton.tsx
│   │   └── PwaNetworkBanner.tsx
│   ├── admin/AdminNav.tsx
│   ├── market/WishlistButton.tsx
│   ├── shared/WishlistTicker.tsx
│   └── serwist-provider.tsx
│
└── lib/                           # 工具庫
    ├── hooks/
    │   ├── usePWAEnvironment.ts
    │   └── usePwaInstall.ts
    └── types/
        └── rbac.ts
```

**docs/ 目錄** (文件中心 - 30+ 檔案)

```
docs/
├── 📋 主要文件
│   ├── requirement.md             # ⭐ 系統需求規格
│   ├── plan-sync-archive.md       # 開發計劃
│   ├── task.md                    # 任務追蹤
│   ├── Role-Based-Access-Control.md
│   ├── HKcardvault_Homepage_Specification.md
│   └── marketplace_productDetail_implementation_planning.md
│
├── dev/                           # 開發 TODO 追蹤
│   ├── server.md
│   ├── api.md
│   ├── database.md
│   └── wishlist_feature/
│       ├── backend_db_api.md
│       └── frontend_ui.md
│
└── task_manage/                   # 功能任務分解
    ├── task_manager.md
    ├── marketplace.md
    ├── product_detail.md
    ├── checkout_flow.md
    ├── messaging.md
    └── chatroom_optimization.md
```

**.stitch/ 目錄** (設計系統)

```
.stitch/
└── designs/
   └── DESIGN.md                  # 主設計規範
```

**.agents/skills/ 目錄** (12 個技能)

```
.agents/skills/
├── taste-design/                  # 建立設計規範
├── extract-design-md/             # 提取設計系統
├── stitch-design/                 # 生成 UI 設計
├── generate-design/               # 生成設計變體
├── react-components/              # 轉換為 React
├── shadcn-ui/                     # shadcn 整合
├── code-to-design/                # 代碼→設計
├── extract-static-html/           # 提取 HTML
├── upload-to-stitch/              # 上傳資源
├── enhance-prompt/                # 改進提示詞
├── manage-design-system/          # 管理設計系統
└── stitch-loop/                   # 迭代構建工作流
```

**.github/ 目錄** (AI指引)

```
.github/
├── copilot-instructions.md        # 📌 PokéTrade 黃金工作流
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
/profile/user          → 你的個人中心  (第一人稱)
  /user/collection     → 你的願望單/收藏
  /user/orders         → 你的購買訂單
  /user/settings       → 你的個人設定

/profile/merchant      → 你的商家儀表板 (第一人稱)
  /merchant/inventory  → 你的庫存管理
  /merchant/analytics  → 你的商品分析
  /merchant/trading    → 你的交易管理
  /merchant/finance    → 你的財務報表
  /merchant/settings   → 你的商家設定

/profile/[id]          → 查看他人檔案 (第三人稱)
  例: /profile/PKT-8839-44A
```

### 其他關鍵路由

| 路由           | 用途         | 認證 | 角色限制   |
| -------------- | ------------ | ---- | ---------- |
| `/auth`        | 登入/註冊    | ✖️   | 無         |
| `/marketplace` | 卡片交易市場 | ✖️   | 無         |
| `/search`      | 全域搜尋     | ✖️   | 無         |
| `/admin/*`     | 管理員後台   | ✅   | Admin only |
| `/~offline`    | PWA 離線頁面 | ✖️   | 無         |

---

## 🎯 核心模組分析

### 1️⃣ 應用層 (`/app`) - 80+ 檔案

| 模組            | 檔案數 | 用途              | 狀態      |
| --------------- | ------ | ----------------- | --------- |
| **marketplace** | 4      | 卡片交易市場      | ✅ 開發中 |
| **profile**     | 12     | 用戶/商家檔案系統 | ✅ 開發中 |
| **components**  | 40+    | UI 元件庫         | ✅ 開發中 |
| **admin**       | 8      | 管理員儀表板      | 🔄 計劃中 |
| **auth**        | 2      | 認證系統          | 🔄 計劃中 |
| **lib**         | 3      | 工具函數 & 型別   | ✅ 開發中 |

### 2️⃣ 設計系統 (`.stitch/`)

**DESIGN.md** 規範：

- 🎨 **色彩系統**: 禁止 #000000、符合高端金融美學
- ✍️ **排版**: 禁止 Inter、使用高端字型
- 📏 **間距**: 嚴格的量度系統
- 🧩 **元件樣式**: 模組化元件規則
- ⚡ **動畫**: Spring physics 動畫指引

### 3️⃣ Agent 技能庫 - 12 個專門技能

**工作流順序**:

1. **taste-design** → 建立設計規範
2. **stitch-design** → 生成 UI 設計
3. **react-components** → 轉換為 React

---

## ✅ 開發檢查清單

提交前確認:

- [ ] ✅ 檢查 `.stitch/designs/DESIGN.md` 規則
- [ ] ✅ 顏色/字型 100% 來自 DESIGN.md
- [ ] ✅ 檢查 TODO [MOCK DATA], [API], [BACKEND] 註解
- [ ] ✅ 在 `/docs/dev/` 更新 TODO 追蹤表
- [ ] ✅ 新元件必須在 `/app/components/` 分類
- [ ] ✅ 路由符合三層級檔案系統規則
- [ ] ✅ TypeScript 型別 100% 覆蓋
- [ ] ✅ Mobile-first 佈局確認
- [ ] ✅ 禁止使用泛用 AI 措辭
- [ ] ✅ 禁止 #000000、Inter 字型

---

## 🚀 快速導航

| 需求        | 檔案位置                          |
| ----------- | --------------------------------- |
| 新增頁面    | `/app/[route]/page.tsx`           |
| 新增元件    | `/app/components/[category]/`     |
| 設計規範    | `.stitch/designs/DESIGN.md`       |
| 系統需求    | `/docs/requirement.md`            |
| 開發計劃    | `/docs/plan-sync-archive.md`      |
| API TODO    | `/docs/dev/api.md`                |
| 資料庫 TODO | `/docs/dev/database.md`           |
| 伺服器 TODO | `/docs/dev/server.md`             |
| AI 指引     | `.github/copilot-instructions.md` |

---

**最後更新**: 2026-05-29
**版本**: Full-Depth v2.0
**維護者**: PokéTrade JP 開發團隊
