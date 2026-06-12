# 🏛️ Merchant ERP Revamp Summary — Dynamic Workspace Restructuring & Route Consolidation

> 交付對象：`app/profile/merchant/*` 商戶動態工作區
> 技術基線：Next.js 16.2 (Turbopack) · React 19.2 (Uncontrolled Native Forms) · TypeScript 5

---

## 1. Dynamic Workspace Restructuring Ledger（動態工作區重構總帳）

### 1.1 路由與標題遷移對照表

| 模組 | 舊路由 | 新路由 | 舊標題 / Tab | 新標題 / Tab | 重構說明 |
|------|--------|--------|--------------|--------------|----------|
| 總覽 | `/profile/merchant` | `/profile/merchant`（不變） | 儀表板 | **總覽** 📊 | Hero 身分看板由 `layout.tsx` 下放至 `page.tsx`；指標卡提純至僅剩「本月營收」與「本月訂單」；剷除「今日營收」「傭金扣減」「快速操作」「最近售出」「本月銷售走勢」 |
| 商品管理 | `/profile/merchant/inventory` | `/profile/merchant/inventory`（不變） | 商品管理 | 商品管理 🗂️ | 「所有商品」清單升級為可展開 SKU Accordion；「新增商品上架」抽離為 React 19 非受控表單組件；新增「商品分析」深度連結 |
| 進階商品分析 | —（新建） | **`/profile/merchant/analytics?sku={id}`** | — | **進階商品分析** | 全新黑金奢華 Loading Skeleton 矩陣，預留 Client Container Live Data Stream Viewport 接口（`searchParams` 為 Promise，await 後渲染 SKU 鎖定徽章） |
| 交易管理 | `/profile/merchant/sales` | **`/profile/merchant/trading`**（`git mv` 遷移） | 銷售訂單 | **交易管理** 🤝 | 篩選器剷除「待處理」「進行中」，重塑為四階段管線：**已取消 → 待付款 → 鑑定中 → 已完成**（外加「全部」預設膠囊） |
| 資金金流 | `/profile/merchant/finance` | `/profile/merchant/finance`（不變） | 資金金流 | 資金金流 💰 | 剷除「待提現金額」與「運費補貼」統計卡；嚴格保留三元素並鎖定渲染順序：①「本月總收入」大型指標卡 → ②「資金流水記錄」清單 → ③「Stripe Connect 帳戶」狀態卡 |
| 店舖設定 | `/profile/merchant/settings` | `/profile/merchant/settings`（不變） | 店舖設定 | 店舖設定 ⚙️ | 舊版表單全數抹除；100% 鏡像 `/profile/user/settings` 的 Schema 與 UI 行為（useSyncExternalStore 掛載防護、麵包屑、店舖資料／安全設定／通知設定／Session Control 四區塊、`max-w-[640px]` 金融看板寬度） |

### 1.2 組件搬遷與新建對照表

| 動作 | 來源 | 目的地 |
|------|------|--------|
| 🚚 下放 | `app/profile/merchant/layout.tsx` 內的 Merchant Hero Header Card | `app/profile/merchant/page.tsx`（layout 僅保留導航殼層 + `ProfileTabNav` + `{children}`，對齊 `/profile/user/(dashboard)/layout.tsx` 輕量包裝哲學） |
| 🚚 抽離 | `inventory/page.tsx` 內嵌上架表單 | **新建** `app/components/merchant/NewListingForm.tsx`（React 19 非受控 form actions） |
| ✨ 新建 | — | `app/components/merchant/InventoryAccordion.tsx`（SKU 手風琴客戶端組件，導出 `MerchantListing` 介面） |
| ✨ 新建 | — | `app/profile/merchant/analytics/page.tsx`（異步 Server Component 分析閘道） |
| 🚚 遷移 | `app/profile/merchant/sales/page.tsx` | `app/profile/merchant/trading/page.tsx`（保留 Git 歷史，rename 93% similarity） |

### 1.3 文件追蹤器同步

`docs/dev/server.md`、`docs/dev/database.md`、`docs/dev/api.md` 中所有指向 `merchant/sales` 與 inventory 內嵌表單的 TODO 行已同步改指 `merchant/trading` 與 `NewListingForm.tsx`；`project_structure .md` 路由樹補入 `/merchant/analytics` 與 `/merchant/trading`。

---

## 2. SKU Accordion UI & React 19 State Offloading Note（SKU 手風琴與狀態卸載備忘）

### 2.1 Accordion 展開機制（Raw Tailwind Transitions）

- 單一 `useState<string | null>` 持有 `openId`，整列商品僅一個展開源，零多餘狀態。
- 展開動畫採用純 CSS Grid 軌道過渡：`grid transition-[grid-template-rows] duration-300` 配合 `grid-rows-[0fr]` ⇄ `grid-rows-[1fr]` 切換，內層 `overflow-hidden` 收束，無任何第三方動畫庫。
- 完整無障礙語意：摘要列按鈕掛載 `aria-expanded` 與 `aria-controls`，箭頭以 `rotate-180` transform 跟隨展開態。
- 展開面板曝光四大深度資訊：**品相描述**（鏡面／居中／黑芯）、**邊角磨損**、**全解析度二級縮圖**（`next/image` + picsum seed 矩陣）、**歷史瀏覽量追蹤**（以 maxTrailViews 歸一化的金色進度條）。
- 每一 SKU 面板尾部掛載 `📈 商品分析` 錨點：`href={`/profile/merchant/analytics?sku=${listing.id}`}`，以 `next/link` 聲明式跳轉直通分析閘道。

### 2.2 React 19 非受控表單狀態卸載（Zero Keystroke Re-render）

- 「新增商品上架」表單**完全不持有任何輸入 state**：捨棄 `useState` + `onChange` 受控模式，改用 React 19 原生 `<form action={publishListing}>`，提交時由 `FormData` 一次性讀取欄位。
- 草稿分流採用 per-button 覆寫：`<button type="submit" formAction={saveDraft} formNoValidate>`，同一表單雙出口（立即上架走 required 驗證、儲存草稿繞過驗證），零條件渲染分支。
- 輸入控件統一鎖定深色金融質感樣式基底：`bg-[#17130f] border border-white/5 rounded-xl h-11 text-text-primary px-4`。
- 效益：打字過程 0 次組件重繪、0 次級聯渲染，鍵入延遲與 React 調和成本徹底卸載至瀏覽器原生表單層。

---

## 3. QA Attestation（品質保證鑑定書）

### 3.1 TypeScript 嚴格編譯 — ✅ 0 errors

```console
$ npx tsc --noEmit
TSC_EXIT=0
```

### 3.2 ESLint — ✅ 商戶模組 0 errors / 0 warnings

```console
$ npx eslint app/profile/merchant app/components/merchant
ESLINT_MERCHANT_EXIT=0
```

> ⚠️ 基線備註：全域 `npx eslint app` 存在 **4 個本次重構前已存在**的 `react-hooks/refs` 錯誤，全數位於 `app/components/home/PremiumMarket.tsx:106-109`（embla carousel `plugin.current` 於 render 期間取值）。該檔案與商戶模組無關、本次未觸碰，留待獨立修復票處理。

### 3.3 Next.js 16.2 Production Build — ✅ 成功

```console
$ npx next build
▲ Next.js 16.2.2 (Turbopack)

  Creating an optimized production build ...
✓ Compiled successfully in 15.6s
  Running TypeScript ...
  Finished TypeScript in 8.5s ...
  Collecting page data using 1 worker ...
✓ Generating static pages using 1 worker (30/30) in 621ms
  Finalizing page optimization ...

Route (app)
├ ○ /profile/merchant
├ ƒ /profile/merchant/analytics
├ ○ /profile/merchant/finance
├ ○ /profile/merchant/inventory
├ ○ /profile/merchant/settings
├ ○ /profile/merchant/trading
└ …（其餘 28 條路由全數生成成功）

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

BUILD_EXIT=0
```

### 3.4 建置阻斷修復附註（Build Unblock Note）

首次 `next build` 因 `app/layout.tsx` 殘留 `import { Geist } from "next/font/google"`（建置期需連網抓取 fonts.googleapis.com）而失敗。已依專案既定字體規範修復：移除網路抓取的重複 Geist 實例，並將 `app/globals.css` 的 `--font-sans` 改為別名本地打包的 `var(--font-geist-sans)`（`geist` npm package，同一字型、零視覺差異、離線可建置）。

### 3.5 路由驗證快照

- ✅ `/profile/merchant/analytics` 以 **ƒ Dynamic** 模式註冊（`searchParams` SKU 鎖定所需）
- ✅ `/profile/merchant/trading` 取代 `/profile/merchant/sales`（舊路由已自路由表徹底消失）
- ✅ 其餘商戶五模組全數靜態預渲染成功
