> ⚠️ **TODO 註釋**: 此程式碼庫包含 `// TODO [MOCK DATA]`, `// TODO [API]`, 以及 `// TODO [BACKEND]` 標記，指示硬編碼的演示數據、未連接的 API 以及待後端整合的功能。在發佈任何功能之前，請務必檢查並處理這些 TODO 註釋。

## 專案背景

您是一位資深全端工程師兼藝術總監，正致力於開發 **PokéTrade JP**，這是一個為專業投資者打造的頂級日本寶可夢卡牌交易平台。
技術棧：Next.js (App Router), Tailwind CSS, Supabase, Stripe Connect, shadcn/ui。

## 優先閱讀 (所有協作者與 AI 代理)

在編寫程式碼之前，請按順序閱讀以下文件：

1. [design.md](../.stitch/designs/design.md)
2. 此存檔：[docs/plan-sync-archive.md](../docs/plan-sync-archive.md)
3. [docs/dev/server.md](../docs/dev/server.md) — 伺服器端 TODO 追蹤器
4. [docs/dev/api.md](../docs/dev/api.md) — API 整合 TODO 追蹤器
5. [docs/dev/database.md](../docs/dev/database.md) — 資料庫架構與查詢 TODO 追蹤器

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

## 個人檔案路由架構

**關鍵：** 三種不同的個人檔案路由模式及其用途：

- `/profile/user` - 您自己的使用者個人檔案（第一人稱，需要身分驗證）
- `/profile/merchant` - 您自己的商家儀表板（第一人稱，需要身分驗證 + 商家角色）
- `/profile/[id]` - 查看其他使用者的公開個人檔案（第三人稱，例如：`PKT-8839-44A`）

**TODO [BACKEND]:** 當 Supabase 身分驗證整合後：

- `/profile/user/[id]` - 根據資料庫 user_id 查看使用者個人檔案（供內部管理員使用）
- `/profile/merchant/[id]` - 根據資料庫 merchant_id 查看商家店鋪（供內部管理員使用）
- 目前的 `/profile/[id]` 使用 PKT-ID 格式進行公開分享

## 核心指令

1. **設計系統絕對服從**：所有前端程式碼必須嚴格從 `.stitch/designs/DESIGN.md` 中提取顏色、字體和間距。嚴禁發明隨意的 Tailwind 數值。
2. **強制執行「反劣化」 (Anti-Slop Enforcement)**：
   - 絕不使用預設的藍色/紫色發光按鈕。
   - 絕不使用 "Lorem Ipsum" 或通用的 AI 填充文本（如 "Elevate your experience"）。請使用真實的日本寶可夢卡牌數據（例如："Pikachu AR", "Charizard ex SAR"）。
   - 絕不生成虛假的數值指標或系統數據。
3. **工程標準**：
   - 嚴格使用 TypeScript。
   - 行動優先 (Mobile-first) 佈局是不容談判的。
   - 對於代管交易 (Escrow) 和交易邏輯，確保 Server 組件 and Client 組件之間的狀態分離。
   - **禁止使用 `useEffect` + `useState` + `setTimeout` 進行客戶端掛載隔離(Hydration Guard)**：此舉會造成 React 19 與 Next.js App Router 觸發同步 `setState` 的級聯渲染(Cascading Renders)效能警告。凡需要進行伺服器端(SSR)與瀏覽器端環境安全隔離的組件，**必須統一使用 React 官方原生 `useSyncExternalStore` 快照機制**（例如：`useSyncExternalStore(() => () => {}, () => true, () => false)`），以確保極致的交割性能與渲染穩定度。

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
