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

#### Component-Level DRY / Anti-Wrapper 鐵律

- **嚴禁重複彈窗/表單組件**：當兩個或以上組件（如新增與編輯 listing）共用相同業務邏輯、狀態與 UI 片段時，必須統一為單一 **engine component**（例如 `ListingFormModal`），以 `mode` 或類似 prop 區分行為，而非複製出多個高度相似的 wrapper 檔案。
- **遷移後清理舊 wrapper**：完成統一化後，必須立即刪除不再需要的舊 wrapper 檔案（如 `AddAssetModal.tsx`、`ListingEditDialog.tsx`），不得在 codebase 中留下「橋接層」或「零用途保留檔案」。
- **最小 component 層級**：layout 或 call site 應直接引用統一 engine component，避免再包一層只轉發 props 的「純 wrapper」。
- **活用 `Pick` / `Omit` / `Partial` 抽離 props**：為不同 mode 定義 discriminated union props，而非重建一組相似的 interface。

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

### 6. E2E 測試資安防線與憑證保護鐵律 (E2E Credential Safeguard Mandate)

- **硬性禁止防线**：嚴禁任何 AI 代理人（包含 QA-Tester、BAAS 工程師或腳本）調用 Supabase Admin Service Role Key、curl、Node.js 腳本或 SQL 去修改 `.env` 中指定的管理員 (Admin) 或真實測試帳戶密碼。
- **正統 E2E 測試機制**：
  1. 測試必須使用專屬的沙盒測試帳號:
     |Level|Email|Passworld|
     |-|-|-|
     |Admin|admin@t.com|Abcd1234!|
     |Merchant|merchant@t.com|Abcd1234!|
     |Member|test@t.com|Abcd1234!|

  2. 或使用 Playwright 官方推薦的 `playwright/.auth/user.json` (Storage State) 預存 Session 進行無密碼直接注入。
  3. 任何嘗試透過 Service Role 改寫 Password 的操作將被視為資安違規行為。

### 7. 👑 Git Commit 原子化提交鐵律 (Atomic Git Commit Mandate)

**核心原則**：嚴禁「任務結束後一次過提交幾十個檔案/幾千行代碼」的反模式（Monolithic Commit）。Git Commit 必須保持**極高頻率、小步快跑、微粒度（Atomic Level）**。

1. **微／原子級提交原則 (Atomic Commits First)**：
   - 每當完成一個獨立的小修改（例如：新增一個 Helper Function、微調單一 Component 樣式、新增/修訂 TypeScript Interface、修正單一 Selector Bug），必須**立即進行一次 Git Commit**。
   - 目的：確保每一個 Commit 都可獨立被 Review、Track 以及用 `git revert` 單獨回滾。

2. **完整邏輯單元例外 (Cohesive Feature Exception)**：
   - **例外情況**：若修改屬於一個完整且不可分割的業務 Logic（例如：新增一個 Zustand State + 寫對應的 Server Action + 修改消費該 State 的 Component），允許在**該完整 Logic 修改完畢且確認可運作後**進行一次提交。
   - **Commit Message 要求**：必須在內文中清晰描述這項完整 Logic 的內容，以及修訂過程中建立/修改了哪些 Function、Variable 或 Constant。

3. **Conventional Commits 格式強制規範**：
   所有 Commit Message 必須嚴格遵從 Conventional Commits 格式：
   - `feat(scope)`: 新增功能 / 組件 / 頁面 (例: `feat(orders): add date range filter parser`)
   - `fix(scope)`: 修復特定 Bug (例: `fix(select): resolve dropdown width layout shift on reopen`)
   - `refactor(scope)`: 重構邏輯，不影響外部功能 (例: `refactor(payouts): extract mock data to separate file`)
   - `style(scope)`: UI/UX 樣式微調 (例: `style(nav): adjust button padding and active state styling`)
   - `docs(scope)`: 更新註釋或文檔
   - `chore(scope)`: 配置檔或依賴變更

4. **Commit 前的安全門檻**：
   - 每次提交前，必須確保當前修改無語法錯誤，且不破壞整體 Compile (`bunx tsc --noEmit`)，確保每一個 Commit 都是「可建置、可運行 (Buildable)」的獨立節點。
   - 嚴禁將工作總結 Markdown、熔斷報錯檔等暫存檔混入代碼 Commit 中。

### 8. 👑 前端模組化與檔案行數硬性防線 (Frontend Modularity & Clean Code Mandate)

**核心目標**：杜絕超過 300 行的「上帝組件（God Component）」，嚴禁將 Data Fetching、State、Utils、Modal、Sub-views 全部塞在單一 `.tsx` 檔案中。維持極高可讀性與 Component-Level 可維護性。

1. **硬性檔案行數上限 (Strict File Line Limit)**：
   - **黃金標準**：單一 `.tsx` 檔案行數應控制在 **150 ~ 200 行** 內。
   - **硬性紅線 (Hard Cap)**：單一 `.tsx` 檔案**嚴禁超過 300 行**！
   - **重構觸發點**：當開發或修改過程中發現檔案接近 250 行時，Agent **必須主動暫停新功能寫入，先執行「模組拆分重構（Decomposition Refactoring）」**！

2. **巨型頁面拆分四部曲 (4-Step Refactoring Pipeline)**：
   當一個頁面/組件變大時，必須按照以下架構解耦拆分，禁止在單一檔案內用 `renderHeader()`, `renderTabA()` 等巨型 inline 函式：

   - **① 視圖拆分 (Sub-components Excision)**：
     - 將 Tab 內容、Data Table、Toolbar、Card 項目、Modal 彈窗等獨立 UI 區塊，抽離成獨立的子組件檔案（例：`app/admin/orders/components/PlatformOrdersTab.tsx`）。
   - **② 業務邏輯與狀態 Hook 化 (Custom Hooks Extraction)**：
     - 當組件內包含超過 5 個 `useState` / `useEffect` 或複雜的搜尋、過濾、Sorting、Fetching 邏輯時，必須將邏輯完全抽離至專屬 Custom Hook（例：`hooks/useOrderFilters.ts` 或 `hooks/useOrderActions.ts`）。
     - `.tsx` 視圖組件只留純 UI 渲染與宣告式資料綁定。
   - **③ 靜態選單/資料格式化離心 (Utils & Constants Extraction)**：
     - 所有的選單陣列 (`STATUS_OPTIONS`)、枚舉對照表、日期/貨幣格式化 Helper、計算邏輯，一律抽離至同目錄下的 `constants.ts` 或 `utils.ts`。
   - **④ 型別獨立 (Types Colocation)**：
     - 組件所需的 `interface` / `type` 一律放入 `types.ts`。

3. **Feature Colocation 檔案結構規範**：
   - **頁面專屬子組件**：若某個子組件（如 `GradingTable.tsx`）只為 `/admin/orders` 頁面服務，必須放在該頁面的 `components/` 子目錄內（例如：`app/admin/orders/components/GradingTable.tsx`）。
   - **跨頁面共用組件**：只有被 2 個以上獨立頁面使用的組件，才可放入全域 `@/app/components/` 或 `@/components/ui/`。

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
