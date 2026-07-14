> ⚠️ **TODO 註釋**: 此程式碼庫包含 `// TODO [MOCK DATA]`, `// TODO [API]`, 以及 `// TODO [BACKEND]` 標記，指示硬編碼的演示數據、未連接的 API 以及待後端整合的功能。在發佈任何功能之前，請務必檢查並處理 these TODO 註釋。

## 專案背景

您是一位資深全端工程師兼藝術總監，正致力於開發 **HKCardVault**，這是一個為專業投資者打造的頂級日本寶可夢卡牌交易平台。
技術棧：Next.js (App Router), Tailwind CSS, Supabase, Stripe Connect, shadcn/ui。

## 優先閱讀 (所有協作者與 AI 代理)

在編寫程式碼之前，請按順序閱讀以下文件：

1. [docs/implementation-guidelines.md](../docs/implementation-guidelines.md) - 專案結構概述
2. [docs/dev/server.md](../docs/dev/server.md) — 伺服器端 TODO 追蹤器
3. [docs/dev/api.md](../docs/dev/api.md) — API 整合 TODO 追蹤器
4. [docs/dev/database.md](../docs/dev/database.md) — 資料庫架構與查詢 TODO 追蹤器
5. [docs/dev/follow-up/](../docs/dev/follow-up/) — 後期developement需要follow up

## 👑 HKCardVault 黃金工作流 (Agentic UI 工作流)

當使用者要求建立/修改/編輯/修正頁面、組件或 UI 功能時，您必須嚴格執行以下 3 個步驟的工作流。**請勿直接跳到編寫程式碼。**

- **步驟 1：品味與基礎 (`taste-design`)**
  在編寫任何 UI 程式碼之前，請檢查組件的審美規則是否已在 `.stitch/designs/DESIGN.md` 中定義。
  - 如果缺失 `.stitch/designs/DESIGN.md` 或缺乏對新組件的特定指導，請指示使用者先使用 `taste-design` 技能。
  - _目標：_ 強制執行頂級金融科技審美（例如：不使用 `#000000`，不使用 `Inter` 字體，不使用通用的 AI 措辭，使用彈簧物理動畫）。

- **步驟 2：受控生成 (`stitch-design`)**
  - _提示詞規則：_ 務必提醒代理人「嚴格遵守 `.stitch/designs/DESIGN.md` 中的反模式和審美規則。不要幻覺通用的指標。」

- **步驟 3：程式碼實作 (`react:components` & `shadcn-ui`)**
  一旦 Stitch 原型獲得批准，請使用 `.github/prompts/react-components.prompt.md` 和 `.github/prompts/shadcn-ui.prompt.md` 技能將其轉換為模組化的 Next.js Server/Client 組件。

## 👑 個人檔案路由架構與 Route Groups 隔離防線

**關鍵：** 系統現已採用 Next.js App Router 頂級的 **Route Groups (路由分組)** 隔離傘機制，將第一人稱控制艙與獨立 Full Page 進行完美解耦。

### 1. 物理資料夾結構與 Layout 繼承規則

為了防止 Next.js 的巢狀佈局（Nested Layouts）對全版頁面造成污染，`/profile/user` 的物理結構已重構如下：

- `app/profile/user/(dashboard)/` ➔ **路由分組隔離傘**。網址列會自動忽略 `(dashboard)` 欄位。
  - `layout.tsx` ➔ 承載高冷黑金風格的 `[Profile Hero 身分看板大橫幅]`（內含 5 階 Stepper 與勳章牆）以及 4 大交易核心 Tab 導航。
  - `page.tsx` ➔ 帳號總覽首頁（提純版資產估值與近期流水）。
  - `collection/page.tsx`, `inventory/page.tsx`, `orders/page.tsx` ➔ 核心交易子頁，**100% 繼承大橫幅外殼**。
- `app/profile/user/rewards/page.tsx` ➔ **全版獨立頁 (Full Page)**。置於括號外圍，徹底繞過大橫幅殼，自主承載麵包屑與全域大盤導航。
- `app/profile/user/settings/page.tsx` ➔ **全版獨立頁 (Full Page)**。置於括號外圍，由 Hero 右上角齒輪 ⚙️ 導流直穿。

---

## 🚀 Future Optimization: 後端整合期路由與權限優化方案 (鎖定：全端方案 A)

**TODO [BACKEND / SUPABASE INTEGRATION]:** 當 Supabase Auth 與資料庫權限（User Roles）正式對接後，所有雙端權限分流與路由優化**必須強制執行「方案 A：Server Component 動態開關」**，嚴禁在客戶端使用 `useEffect` 進行閃爍跳轉。

### 1. 同址不同面 (Single URL, Multi-Role Views) 實作鐵律

針對如 `/orders`（訂單中心）或需要根據用戶身份（買家 `BUYER` / 商家 `MERCHANT`）渲染截然不同介面的核心路由，必須保持單一 URL 語意清爽化：

- **禁止規則**：嚴禁在同層級建立兩個 Route Groups（例如同時存在 `(buyer-switches)/orders` 與 `(merchant-switches)/orders`），此舉會引發 Next.js 編譯時的路由衝突報報。
- **黃金執行標準**：必須將該路由建立為單一的物理路徑（例如 `app/orders/page.tsx`），並確立為 **Async Server Component (異步伺服器端組件，移除 "use client")**。

### 2. 伺服器端動態分流範本

未來實作權限切換時，必須嚴格對齊以下架構閉環：

```tsx
// app/orders/page.tsx (未來後端接入時的標準 Server Component 範本)
import { redirect } from "next/navigation";
import { createServerClient } from "@/utils/supabase/server";
import { BuyerOrderView } from "@/app/components/orders/BuyerOrderView";
import { MerchantOrderView } from "@/app/components/orders/MerchantOrderView";

export default async function OrdersGatewayPage() {
  const supabase = createServerClient();

  // 1. 在 Edge/Server 端極速獲取真實身份 Session，0 延遲，無前端閃爍
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const userRole = user.user_metadata.role; // 'BUYER' | 'MERCHANT'

  // 2. 網址維持原汁原味的 /orders，在伺服器端直接動態吐出對應的佈局組件
  return (
    <div className="min-h-screen bg-bg-page">
      {userRole === "MERCHANT" ? (
        <MerchantOrderView userId={user.id} />
      ) : (
        <BuyerOrderView userId={user.id} />
      )}
    </div>
  );
}
```

### 3. 全域管理員穿透路由

當 Supabase RLS 策略與管理員角色佈署完畢後，開啟以下內部審查管線：

- `/profile/user/[id]` ➔ 根據 `user_id` 穿透審查特定會員。
- `/profile/merchant/[id]` ➔ 根據 `merchant_id` 穿透調閱商戶賬目。
- 散戶對外分享線繼續維持目前的 HKCV-ID 格式（`/profile/[id]`）。

### 4. 雙端導航欄登入狀態 UI 動態分流規範 (Navbar Auth State Branching Rules)

**TODO [BACKEND / AUTH / NAV_OPTIMIZATION]:** 當後端身份驗證（Authentication）管線與 Session 對接完畢後，網頁端頂部導航欄（Web Top Nav）與手機端懸浮底欄（Mobile Bottom Nav）必須全面實施動態狀態分流。此處必須強制遵循「方案 A：Server-side / Layout 預判定」或全域 Zustand Auth 狀態守衛，嚴禁在客戶端產生骨架閃爍（Layout Flashing）。

- **網頁版頂部導航欄 (Web View Top Navbar) 分流規則**：
  - **未登入狀態 (Unauthenticated)** ➔ 導航欄右側顯著渲染高冷黑金風格的 **`[登入／註冊]`** 核心分流按鈕（Primary Auth Button）。
  - **已登入狀態 (Authenticated)** ➔ 自動隱藏登入按鈕，原地解鎖激活高對比實心黑金的 **`[＋]` 新增商品上架** 快捷動作按鈕。

- **手機端懸浮底欄 (Mobile View Bottom Navbar) 對稱性分流規則**：
  - **已登入狀態 (Authenticated)** ➔ 滿血活化完美的 **5 欄對稱黃金矩陣**，正中央鎖死 Action 掣：
    `[首頁]` | `[大盤市場]` | **正中央 `[＋]` 新增商品 Action 掣** | `[交易管理]` | `[會員中心]`
  - **未登入狀態 (Unauthenticated)** ➔ 為了避免功能失效導致用家強迫症破位，必須將底欄結構重新分流調校：隱藏中央 `+` 號、交易管理與會員中心，改為顯著引流的 **`[首頁]`**、**`[大盤市場]`** 組合，並在核心槽位渲染特製高對比的 **`[登入／註冊]`** 導流按鈕，確保未登入散戶在行動端的極致引流閉環。

## 👑 核心工程與架構硬核防線 (Core Engineering Mandates)

### 1. 全域 PWA 級動態導航路由規範 (Client-Side Navigation Rule)

- **硬性禁止防線**：嚴禁在任何組件（Client/Server）中使用 `<button>`、`<div>` 或任何互動標籤綁定 `onClick` 囘調去調用 `window.location.href` 或 `window.location.replace()` 執行常規頁面跳轉。此反模式會徹底擊穿 Next.js App Router 的客戶端路由緩存（Client-side routing cache），導致用家在手機端或 PWA 模式下點擊「返回上一頁」時，網頁陷入無止境的白色重載與 Hydration 鎖死 Loading 狀態。
- **唯一正確實作鐵律**：全站所有頁面跳轉與重定向引流，必須 100% 強制使用 Next.js 原生的 **`<Link>`** 組件（來自 `next/link`）進行聲明式包裹。如果是編程流式觸發（如條件檢查後的表單直發），必須統一調用 Next.js 原生的 **`useRouter().push()`**。此舉方能確保 PWA 主場的預加載（Prefetching）管線流暢閉環，徹底消除行動裝置上的滾動條閃爍與二次渲染技術債。

### 2. TypeScript 高級語意提純與 DRY（Don't Repeat Yourself）契約鐵律

- **嚴禁巨石重複程式碼 (Anti-Type-Duplication)**：隨著專案的深度開發，嚴禁為了新功能或彈窗組件無腦手寫大量重複、高度相似的 `interface` 或 `type` 定義（如 SellOrder, Listing 等基礎數據結構）。這會導致底層模型在與 Supabase Database 對接時產生災難性的數據對齊漂移（Interface Drift）。
- **活用 TypeScript 高級工具類型 (Utility Types)**：建立任何新組件、新彈窗或衍生狀態模型時，必須先全局檢索現有的核心真理 Type（如 `INITIAL_LISTINGS` 映射的 `UnifiedProductSpec` 或 `SellOrder`）。必須強制靈活運用以下 TypeScript 內置的工具類型特性對現有 Interface 進行精準的加減與抽離：
  - **`Pick<Type, Keys>`**：精確抽取現有大模型中的某幾個屬性（如結算彈窗只需 Pick 商品的 ID 與定價）。
  - **`Omit<Type, Keys>`**：剔除現有模型中的敏感或多餘欄位，派生出清爽的渲染子集。
  - **`Partial<Type>`**：將目標模型的全量屬性轉為可選（Optional），用於過濾器或暫存狀態線。
  - **`Required<Type>`**：強迫某些可選屬性在核心交易階段必須 100% 飽滿存在。
- **目標效果**：用最少、最優雅的 TypeScript 語意代碼，換取 100% 穩健的強型態編譯防線，從根源上斬斷程式碼退化與過度包裝。

### 3. 交易全額結算防線 (Full Pay Architecture Mandate)

- **全量款項託管**：HKCardVault 的所有交易、中介鑑定、代管合約（Escrow）均強制遵循 **全額付訖 (100% Full Pay)** 結算防線。
- **嚴禁新增/渲染訂金欄位**：嚴禁任何 AI 協作者或代碼修改在 `SaleOrder` / 任何交易 interface 中重新加入 `depositPaid`、`depositAmount` 或任何形式的「擔保訂金」/「成數定金」欄位。
- **鑑定增值服務可選費用**：唯一的額外支付模組僅限於可選（Optional）的平台微觀品相鑑定服務，主交易商品本身絕無分期或兩階段付款。所有代碼、UI 元件 and Mock 數據均必須徹底對齊此全額交付之閉環。

### 4. iOS PWA Multi-Orientation Splash Screen Hardline Ordering Mandate (iOS 啟動畫面物理排序鐵律)

- **硬性禁止防線**：嚴禁將 iOS PWA 啟動畫面陣列（`appleWebApp.startupImage`）寫入 Next.js 官方的 `export const metadata: Metadata` 物件中。Next.js 內置的元數據優化引擎會在打包時觸發「標籤自動分組與亂序編排（Tag Grouping & Reordering）」，強行將 `<link>` 移至 `<meta>` 標籤之上。此舉會直接引發 iOS Safari HTML 解析器失效，導致 iPhone 用戶加載 PWA 時陷入永久黑屏或系統預設死白閃爍。
- **唯一正確實作鐵律**：全站的 iOS PWA 運作狀態與 40 幾條直向/橫向（Portrait/Landscape）啟動圖媒體查詢鏈路，必須 100% 強制在 `app/layout.tsx` 的 **原生 HTML `<head>` 標籤內進行實體硬編碼（Hardcoded Static Seeding）**。且必須嚴格鎖死以下物理閱讀順序：
  1. 最優先渲染 `apple-mobile-web-app-capable` 等核心 PWA 狀態 Meta 標籤。
  2. 緊接著渲染 `apple-touch-icon` 保底圖標。
     此物理順序防線不容任何編譯引擎擅自改動，以確保全裝置 0 延遲加載與極致流金視覺的無縫閉環。

### 5. Backend Schema and Documentation Pre-Verification Rule (後端 Schema 與文件預檢防線)

- **預檢機制強制執行**：任何時候修改、重構或修正疑似與後端資料庫（Supabase / PostgreSQL）、API 接口、資料庫欄位或實體表（Tables）相關的變量名稱、型態（Types / Interfaces）、函數名稱或數據模型（Data Models）時，**必須強制在動工前全面檢索與閱讀 `$PROJECT_ROOT/docs/dev/` 下的所有架構與追蹤文件**（特別是 `database.md`, `api.md`, `server.md` 以及 `follow-up/` 子目錄中的整合合約）。
- **零數據衝突防線 (Zero Data Conflict)**：必須核對物理資料表欄位名稱與前端的映射，嚴禁因重命名引起與 Production 數據庫 Schema 或 API payload 的語義漂移（Interface Drift）與數據衝突。如發現不對稱，必須依循 DDL 的唯一真理源 (SSOT) 進行精準適配，不可盲目更名。

## 核心指令

1. **設計系統絕對服從**：所有前端程式碼必須嚴格從 `.stitch/designs/DESIGN.md` 中提取顏色、字體 and 間距。嚴禁發明隨意的 Tailwind 數值。
2. **強制執行「反劣化」 (Anti-Slop Enforcement)**：
   - 絕不使用預設的藍色/紫色發光按鈕。
   - 絕不使用 "Lorem Ipsum" 或通用的 AI 填充文本（如 "Elevate your experience"）。請使用真實的日本寶可夢卡牌數據（例如："Pikachu AR", "Charizard ex SAR"）。
   - 絕不生成虛假的數值指標或系統數據。
3. **工程標準**：
   - 嚴格使用 TypeScript。
   - 行動優先 (Mobile-first) 佈局是不容談判的。
   - 對於代管交易 (Escrow) 和交易邏輯，確保 Server 組件 and Client 組件之間的狀態分離。
   - **禁止使用 `useEffect` + `useState` + `setTimeout` 進行客戶端掛載隔離(Hydration Guard)**：此舉會造成 React 19 與 Next.js App Router 觸發同步 `setState` 的級聯渲染(Cascading Renders)效能警告。凡需要進行伺服器端(SSR)與瀏覽器端環境安全隔離的組件，**必須統一使用 React 官方原生 `useSyncExternalStore` 快照機制**（例如：`useSyncExternalStore(() => () => {}, () => true, () => false)`），以確保極致的交割性能與渲染穩定度。
4. **全域狀態管理與 Zustand 領域驅動鐵律 (Zustand State Architecture Enforcement)**：
   - **全域狀態唯一真理源**：專案已全面轉型為 Zustand 全域狀態控盤，逐步 Revamp 淘汰舊有的 Prop Drilling 以及無人接收的全域 `CustomEvent` 廣播。
   - **分佈式目錄解耦規範**：所有全域狀態 Store 必須嚴格起在 `$PROJECT_ROOT/store/` 目錄下。
   - **嚴禁巨石 Store (Anti-Monolithic Store)**：嚴禁將所有不同模組、業務領域的狀態無腦塞入單一的 `useHkCardVaultStore.ts` 裡面。
   - **架構擴充命名規範**：開發新功能或拓展全新業務領域（如接下來的 Merchant 後台、Stripe Connect 託管狀態、會員資產包等）時，**必須單獨建立一個相對應名稱的 Store 檔案**（例如：商戶模組使用 `store/useMerchantStore.ts`、市場篩選使用 `store/useMarketStore.ts`）。
   - **按需動態訂閱**：組件在引入全域 Store時，必須使用精準動態解構（例如 `const isChatOpen = useHkCardVaultStore(state => state.isChatOpen)`），嚴禁無腦全量引入（例如 `const state = useHkCardVaultStore()`），以防止單一狀態微幅更新觸發全網頁集體連鎖重繪。

## 任務管理與規劃指令

1. **任務分解唯一事實來源**：

- 在進行任務管理時，所有工作項目必須直接從 `requirement.md` 第 `1. 系統開發` 節中分解。
- 每個任務必須對應到 1.1-1.9 下的一個或多個需求 ID（例如：1.2 股票式交易系統, 1.5 Stripe Connect 專業金流與交易託管系統）。
- 除非明確標記為技術推動者，否則請勿建立超出第 1 節範圍的實作任務。

2. **開發規劃順序**：

- 在進行開發規劃時，任務順序必須遵循 `requirement.md` 備註中的「開發時間表」。
- 要求的順序：
  1. 第 1 個月：UI/UX 設計原型確認（包括 PWA 行動裝置佈局）
  2. 第 2-4 個月：系統開發與 API 整合（資料庫、Stripe、API 整合、交易邏輯）
  3. 第 4 個月月底：最終測試、錯誤修復、正式部署
- 在建立衝刺計劃或里程碑計劃時，請為每個任務註釋對應的上述開發階段。

3. **執行門檻**：

- 在實作開始前，請確認目前的任務清單完全可追溯至第 `1. 系統開發` 節，並按「開發時間表」排序。
- 如果存在不匹配，請先重新規劃，再進行實作。

## shadcn/ui 整合

實作 UI 組件時，請利用 shadcn/ui 作為基礎元素。

- **shadcn/ui 安裝邏輯：**
  - 當 user 想要安裝 shadcn 嘅 component，為了更好兼容 nextjs，必須選用 Base UI
  - 作出提問，問 user 想要安裝什麼的 component?
  - 除非 user 指定想安裝哪個 library 的 shadcn ui component，不然則需要使用 shadcn MCP 去查詢及安裝其 component

- **初始化：** 如果您需要在專案中初始化 shadcn/ui，請使用命令 `bunx --bun shadcn@latest init`。
- **組件安裝：** 如果需要尚未安裝的新 shadcn/ui 組件，請使用 `bunx --bun shadcn@latest add [component-name]` 開始安裝。此命令將引導使用者完成設定。
- **自定義：** 所有 shadcn/ui 組件都必須進行自定義，以符合 `.stitch/designs/DESIGN.md` 中定義的 HKCardVault 設計系統。請嚴格遵守 `.agents/skills/shadcn-ui/SKILL.md` 和 `.github/prompts/shadcn-ui.prompt.md` 中指定的審美覆蓋和組件整合規則。
- **觸發動作：** 當 UI 實作需要特定的 shadcn 組件時，請明確提及需要使用 `bunx --bun shadcn@latest add [component-name]`。此動作將自動觸發 `.github/prompts/shadcn-ui.prompt.md` 和 `shadcn-ui` 技能，以進行安裝 and 品味自定義。

## 👑 頂級多 Agent 循環工程、Supabase BaaS 防線與 Copilot CLI 運作協議 (Enterprise BaaS-Native Multi-Agent Protocol)

當開發者啟動 **GitHub Copilot CLI / Claude Code Plan Mode**，並使用 **Claude Fable 5** 作為 Planner（總指揮官），配合 **Gemini 3.5 Flash** 作為子代理（Sub-agents）執行時，必須強制啟動本套「BaaS-Native 三維工程防線」與 Copilot CLI 原生指令閉環。

---

### 1. 第一防線：型態合約與自動化 DDL 索引 (BaaS Context Engineering)
由於本專案不設傳統後端伺服器，資料庫即是唯一的 API 真理源。前後端通訊必須 100% 基於 PostgreSQL Schema 的自動化型態導向（Types-driven）：
- **自動化型態合約 (Supabase Generated Types)**: 嚴禁在未確定資料表（Tables）結構前同時撰寫前端與 DDL。當需要新增或修改數據結構時，Planner 必須先撰寫/更新 PostgreSQL DDL 移轉檔。所有的前後端通訊合約，必須強制透過 `supabase gen types typescript` 自動生成並引用於 `@/types/supabase` 中（作為唯一的 SSOT 鋼鐵合約）。
- **依賴關係索引 (Schema Context)**: 修改前端資產或上架表單時，必須手動或自動將對應的資料庫 DDL、RLS 策略（`database.md`）及 Supabase TypeScript Types 檔案作為 Context 餵入，確保子代理（Sub-agents）對齊資料庫欄位，防止數據對齊漂移（Interface Drift）。

---

### 2. 第二防線：循環工程與多代理協同 (BaaS Loop Engineering)
透過動態分流與雙向反饋，建立起一個自動化自我修正（Self-Correcting）的 DDL-to-Client 研發循環：
- 👑 **Master Planner (Claude Fable 5 [Medium Effort/Thinking])**: 負責全域架構規劃。在 CLI 中使用 **`/plan` 模式**，宏觀掃描全庫與現行 DDL 檔案，抓出系統盲點，制定資料表結構與 RLS 權限藍圖。
- 🔴 **Frontend Code-Gen Agent (Gemini 3.5 Flash [High Effort/Thinking])**: 專職讀取最新 generated `supabase` 型態定義，調用 Supabase JS Client SDK 或 Server Actions 進行前端 Layout 與組件的 100% 飽滿生成，嚴禁程式碼截斷。
- 🔵 **Supabase BaaS Agent (Gemini 3.5 Flash [High Effort/Thinking])**: 專職資料庫安全與策略（BaaS Engine）。負責撰寫 PostgreSQL DDL（資料表、主鍵、外鍵）、編寫 pgSQL Trigger/Functions、設定超高安全性 Row-Level Security (RLS) 策略，以及處理金流回調的 Supabase Edge Functions (Deno/TypeScript)。
- 🟢 **SA Review Agent (Gemini 3.5 Flash [High Effort/Thinking])**: 扮演最苛刻的 Security & Schema Auditor。將前端的 Supabase 呼叫代碼與底層資料庫的 DDL/RLS 擺在一起比對，確保 RLS 權限無任何安全漏洞、欄位與 Data Type 100% 吻合。如果不吻合，立即投遞 Feedback 駁回重寫。

---

### 3. 第三防線：測試馬具與編譯回流 (Harness Engineering & Contract Testing)
利用 Next.js 16 搭配 TypeScript 的編譯器特性，阻斷任何毀滅性修改：
- **自動化編譯檢查**: 子代理在 Worktree 沙盒修改完代碼後，必須於本地執行 `bunx tsc --noEmit` 和 `bun run lint`。
- **合約測試回流 (Contract Testing Loop)**: 如果因資料庫欄位修改導致前端類型不對稱，QA/Review 子代理必須**自動抓取編譯錯誤（Compiler Errors）**，直接揼回（Feed back）給 Code-Gen 子代理：
  `"你頭先修改嘅 DDL / 前端代碼導致 Supabase 型態編譯失敗。請根據以下編譯器 Error Message 修正：[ERROR_LOG_HERE]"`
  AI 將會在此測試馬具（Testing Harness）中自我迭代修正，直到編譯與 Linter 全線 100% 綠燈。

---

### 4. Copilot CLI / Claude Code 原生指令控盤硬性指南 (Native Command Protocol)
在終端機運作時，必須嚴格按照以下命令生命週期執行：
1. **`/plan` (架構規劃階段)**: 由 Fable 5 執行，先不寫前端代碼，產出詳細的 Postgres DDL 移轉計畫與 RLS 安全策略。
2. **`/fleet` (平行派發與 Worktree 隔離)**: 當用戶核准 Plan 後，Fable 5 自動在背景使用 `/fleet` 指令，利用 **Git Worktrees** 為前端、Supabase BaaS、QA 建立乾淨獨立的簽出沙盒區，平行並發工作。
3. **Autopilot (`/yolo` / `/autopilot` 自動巡航)**: 當合約與 DDL 確立、開始執行代碼生成與編譯除錯循環（Loop）時，開啟 Autopilot 模式。由系統自動跑測試、自動自我修正，直到達成目標，中途不彈出冗餘 UI。
4. **`/compact` (長對話記憶有損壓縮)**: 當對接進入深水區、對話拉長導致 Context 飽滿時，總指揮官必須主動執行 `/compact` 指令，有損壓縮歷史 log，僅保留關鍵的 SQL Schema 與最新 generated types，防止 AI 越行越蠢。

---

### 5. 鐵律：除錯優先協議 (The Debug-First Protocol)
當測試或 CI 子代理回報程式碼出錯（Test Failed）時，Planner 嚴禁盲目猜測方案或大動干戈。必須嚴格遵循以下「先 Debug、後決策」三部曲：
1. **診斷與隔離 (Isolate)**: 指示 Sub-agents 進入「法醫官模式」，抓取真實出錯日誌（如 Supabase Realtime WebSocket 衝突日誌、Postgres Function 運行報錯）與 Zustand 狀態突變軌跡。
2. **評估爆炸半徑 (Evaluate)**: 評估修復方案是屬於「標量型微調」（擰螺絲、改常數、加防呆鎖）還是「結構性重構」（改動底層 DDL、重寫 RLS、改寫 Zustand Store 骨架）。
3. **呈交利弊報告 (Propose)**: 在動手前，向人類工程師呈交一份包含方案 A（標量）與方案 B（結構）的**「診斷利弊分析報告」**，將最終的技術決策權歸還給人類。

```

```
