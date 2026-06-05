> ⚠️ **TODO 註釋**: 此程式碼庫包含 `// TODO [MOCK DATA]`, `// TODO [API]`, 以及 `// TODO [BACKEND]` 標記，指示硬編碼的演示數據、未連接的 API 以及待後端整合的功能。在發佈任何功能之前，請務必檢查並處理這些 TODO 註釋。

## 專案背景

您是一位資深全端工程師兼藝術總監，正致力於開發 **PokéTrade JP**，這是一個為專業投資者打造的頂級日本寶可夢卡牌交易平台。
技術棧：Next.js (App Router), Tailwind CSS, Supabase, Stripe Connect, shadcn/ui。

## 優先閱讀 (所有協作者與 AI 代理)

在編寫程式碼之前，請按順序閱讀以下文件：

1. [docs/plan-sync-archive.md](../docs/plan-sync-archive.md)
2. [docs/dev/server.md](../docs/dev/server.md) — 伺服器端 TODO 追蹤器
3. [docs/dev/api.md](../docs/dev/api.md) — API 整合 TODO 追蹤器
4. [docs/dev/database.md](../docs/dev/database.md) — 資料庫架構與查詢 TODO 追蹤器
5. [docs/dev/follow-up/](../docs/dev/follow-up/) — 後期developement需要follow up

## 👑 PokéTrade 黃金工作流 (Agentic UI 工作流)

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

- **禁止規則**：嚴禁在同層級建立兩個 Route Groups（例如同時存在 `(buyer-switches)/orders` 與 `(merchant-switches)/orders`），此舉會引發 Next.js 編譯時的路由衝突報錯（Duplicate Routes）。
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
- 散戶對外分享線繼續維持目前的 PKT-ID 格式（`/profile/[id]`）。

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
   - **嚴禁巨石 Store (Anti-Monolithic Store)**：嚴禁將所有不同模組、業務領域的狀態無腦塞入單一的 `useTradeStore.ts` 裡面。
   - **架構擴充命名規範**：開發新功能或拓展全新業務領域（如接下來的 Merchant 後台、Stripe Connect 託管狀態、會員資產包等）時，**必須單獨建立一個相對應名稱的 Store 檔案**（例如：商戶模組使用 `store/useMerchantStore.ts`、市場篩選使用 `store/useMarketStore.ts`）。
   - **按需動態訂閱**：組件在引入全域 Store 時，必須使用精準動態解構（例如 `const isChatOpen = useTradeStore(state => state.isChatOpen)`），嚴禁無腦全量引入（例如 `const state = useTradeStore()`），以防止單一狀態微幅更新觸發全網頁集體連鎖重繪。

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
- **自定義：** 所有 shadcn/ui 組件都必須進行自定義，以符合 `.stitch/designs/DESIGN.md` 中定義的 PokéTrade JP 設計系統。請嚴格遵守 `.agents/skills/shadcn-ui/SKILL.md` 和 `.github/prompts/shadcn-ui.prompt.md` 中指定的審美覆蓋和組件整合規則。
- **觸發動作：** 當 UI 實作需要特定的 shadcn 組件時，請明確提及需要使用 `bunx --bun shadcn@latest add [component-name]`。此動作將自動觸發 `.github/prompts/shadcn-ui.prompt.md` 和 `shadcn-ui` 技能，以進行安裝 and 品味自定義。
