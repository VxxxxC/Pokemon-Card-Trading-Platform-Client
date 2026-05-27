# HKcardvault 市場與商品詳情頁最終整合規格說明書 (Frontend UI Version)

本文件詳細定義 HKcardvault 平台之市場探索頁（Marketplace Page）與商品詳情頁（Product Detail Page）的結構排列、業務邏輯、交互體驗以及首席架構師前端防禦部署。整體設計嚴格遵循 `DESIGN.md` 之**暗金色深色主題 (Dark Mode Only)**，全面以**港幣 (HKD)** 進行等寬數值渲染，在保障純前端 Mock 順暢運作的同時，為未來的後端與數據流對接打下鋼鐵般的架構基礎。

---

## 🏗️ 全局架構技術棧總覽 (Frontend Context)
* **Framework**: Next.js (App Router - `'use client'` 狀態與動畫隔離)
* **Styling**: Tailwind CSS (極致暗金午夜交易終端 tokens)
* **Animation**: Framer Motion (精確的彈簧物理過渡，拒絕線性 ease-in-out)
* **Typography**: `font-sans` (UI/標題) + `font-mono` (JetBrains Mono 價格、編號與數據對齊)
* **Base Currency**: 港幣 (`HK$ X,XXX`)

---

## 🧭 1. 市場探索頁 Section 結構與排版藍圖 (Marketplace Page)

### 📊 版面佈局 (Layout Blueprint)
桌面上採用不對稱 2 欄高密度版面。左側（佔 3/12 寬度）為固定黏性（Sticky）的**高級交易所篩選器面板**；右側（佔 9/12 寬度）為 3-4 欄的**商品網格流 (Product Grid)**。行動端則自動折疊為單欄，並由底部浮動液體玻璃欄導航。

### 🛠️ 核心子模組功能拆解

#### A. 交易所級進階篩選器 (Advance Search & Filters)
* **UI 呈現**：背景為 `bg-[#26211C]`，帶有極細透明白邊框 `border-[rgba(237,232,224,0.08)]` 的垂直手風琴式（Accordion）面板。
* **核心欄位與晶片**：
    * **精準關鍵字/編號搜尋**：支援卡牌編號（如 `SV8a-123`）輸入，自帶防抖（Debounce）模擬下拉預覽。
    * **日版特有稀有度晶片**：橫向 Pill 按鈕，外顯 `SAR`、`UR`、`SR`、`AR` 標準標籤。
    * **品相分級篩選**：可勾選 `【美品 S】`、`【微傷 A】`、`【傷 B】`。
    * **封裝規格篩選**：可篩選 `裸卡 (Raw Card)`、`PSA 10`、`BGS 9.5` 鑑定殼商品。
* **排序機制 (Products Sorting)**：頂部提供極簡下拉選單：`價格：由低到高`、`價格：由高到低`、`上架時間：最新`。

#### B. 交易所商品卡片 (Market Product Card)
* **UI 呈現**：高質感非對稱卡片，右上角 absolute 定位擺放**星標追蹤按鈕 (⭐️ Watchlist Button)**。
* **遊戲化/尋寶感 (全息反光特效)**：滑鼠 Hover 時卡片觸發微幅彈簧上移與 `scale(1.02)`，同時卡面圖層疊加 WebGL/CSS 漸變的**全息反光塗層（Holographic Foil Layer）**，重現實體閃卡質感。
* **等寬價格排版**：底部左側外顯全港最低價（`font-mono font-semibold`，例如 `HK$ 1,280`）；右側外顯 24h 漲跌幅（`▲ +3.2%` 或 `▼ -1.5%`）。
* **微型執行按鈕 (Instant Action Triggers)**：卡片下方緊湊配置兩個微型按鈕——主動作「**直接購買**」（滿鋪金棕色）與次動作「**即時出價**」（金色邊框）。

### 🛡️ 首席架構師前端防禦線
* **防動作混淆 (Slide-over Cart/Bid Panel)**：點擊「直接購買」或「即時出價」時，**嚴禁直接跳轉頁面或中斷用戶逛街流**。前端必須觸發一個從右側滑出的迷你執行面板（Slide-over Sheet），讓用戶在當前頁面就能直接完成 Mock 付款或掛單出價輸入，維持極致流暢的 C2C 尋寶多巴胺閉環。

---

## 🧭 2. 商品詳情頁 Section 結構與排版藍圖 (Product Detail Page)

### 📊 版面佈局 (Layout Blueprint)
採用黃金比例不對稱雙欄佈局。左側（佔 5/12 寬度）為**強制實物條件存證展台**；右側（佔 7/12 寬度）為高資訊密度的**金融級交易終端面板**。行動端則變更為垂直上下堆疊，確保核心 CTA 按鈕處於單手大拇指熱區之內。

### 🛠️ 核心子模組功能拆解

#### A. 強制實物相冊展台 (4-6 Live Photos Gallery)
* **UI 呈現**：上方為大面積主圖容器，下方排布 4-6 張微型實物縮圖列（Thumbnails）。
* **業務邏輯**：
    * 滑鼠 Hover 縮圖時，主圖無縫流暢切換。
    * 主圖左上角強制外顯由 `JetBrains Mono` 渲染的品相存證標籤：`【美品 S】實物品品相存證`。
* **多巴胺信任感**：透過透明展示卡角、邊緣、刮痕等 4-6 張實物細節，徹底消除本地買家對假卡、瑕疵卡的恐懼。

#### B. 認證商家與遊戲化身份模組 (Seller Identity Module)
* **UI 呈現**：右側面板頂部的精緻賣家名片。
* **業務邏輯**：外顯賣家名稱、雙向評分累積之好評率（例如 `⭐ 4.9 (120+ 筆成交)`）。
* **遊戲化稱號**：名字後方掛载黃金 3D 質感的身份稱號徽章：**`🏅 專業道館主`** 或 **`資深收藏家`**，以頭銜背書建立強大實體信任感。

#### C. 卡牌標準數據庫矩陣 (Card Technical Specs Matrix)
* **UI 呈現**：採用高密度、邊框分明的極簡網格表格（Bordered Grid Table）。
* **數據整合**：完整展示連通日版 Pokémon 數據庫交叉校驗後的官方技術規格：
  `【名稱】噴火龍 ex`、`【稀有度】SAR`、`【編號】SV8a-123/094`、`【屬性】火`、`【階段】Stage 2`、`【弱點】水 x2`、`【抗性】無`、`【撤退成本】◆◆`、`【招式/傷害】爆裂燃燒 330`、`【畫師】AKIRA EGAWA`。

#### D. 金融交易中樞與大數據走勢 (Market Financial Center)
* **UI 呈現**：使用比背景更深的 `bg-[#17130f]` 作為數據底層面板。
* **數值外顯**：大字體 `font-mono font-bold text-3xl` 渲染當前香港賣家設定的港幣最低現貨價（例 `HK$ 1,480`），下方標註小字體建立日期 `2026-05-27`。
* **歷史走勢圖 (Price History)**：嵌入一條由 `recharts` 繪製、與暗金背景完全融合的透明 **30天 Mercari JP 真實已成交歷史線圖 (Sparkline)**。
* **實時成交牆 (Transaction History)**：垂直排列展示該款卡牌在全平台最近 3 筆已售出記錄的微型清單（`font-mono` 渲染成交時間與港幣價）。

#### E. 核心電商交易按鈕調配 (Execution Actions)
* **直接購買按鈕 (滿鋪金棕色 `bg-[#d4a574]`)**：絕對亮眼的核心 CTA 動作，高度 `h-12`，點擊跳出分段式 Escrow 託管保障面板（外顯 10% 訂金啟動流程提示）。
* **即時出價按鈕 (金色細邊框 `border-[#d4a574] text-[#d4a574]`)**：次要動作按鈕，點擊彈出股市撮合掛單輸入框。

### 🛡️ 首席架構師前端防禦線
* **數據載入骨架微光 (Skeleton Shimmer)**：在純前端 Mock 狀態轉換或頁面初次載入時，**嚴禁出現任何白閃或通用灰色骨架屏**。必須使用符合暗金調性的棕金卡牌脈衝過渡（基底：`#26211C`，微光中間層：`#2e2925`），維持平台視覺個性的一致性與精確感。

---

## 📈 總結：市場與詳情頁多巴胺轉化閉環

1.  **進階篩選與全息反光 (Marketplace)**：透過精準的日版稀有度/品相篩選鎖定目標，結合滑鼠 Hover 的全息塗層特效，點燃買家「尋寶」的視覺多巴胺。
2.  **實物存證與道館主背書 (Detail Left & Top)**：左側強制 4-6 張實物圖與右側賣家「專業道館主徽章」形成雙重信任防線，徹底打消高額 C2C 假卡疑慮。
3.  **大數據線圖與黃金 CTA (Detail Right)**：利用 Mercari JP 的港幣成交折線圖與平台成交歷史提供科學依據，配合高度對齊、極具誘惑力的金棕色「直接購買」按鈕，完成從「逛街」到「落單」的最後一公里轉化閉環。

---

## 🤖 導出：Copilot / Cursor UI 開發提示詞 (可直接貼入 AI)

```markdown
# GitHub Copilot / Cursor Workflow Prompt: Implement Marketplace & Product Detail UI

Please strictly refer to the UI specifications defined above. Generate the requested code files in Next.js (App Router, 'use client') and Tailwind CSS, following the Pure Dark Mode theme colors and font constraints.

### [File 1] `app/marketplace/page.tsx`
Implement the complete Marketplace catalog. Use an asymmetrical 2-column layout on desktop. Include the Advance Filter Sidebar (with Rarity, Condition, Capsule specs) and the Product Card Grid. Ensure each card component embeds the absolute-positioned `WatchlistButton` and the microaction triggers (Buy Now/Bid Now) inside its layout.

### [File 2] `app/marketplace/[id]/page.tsx`
Implement the complete Product Detail screen. Use a 2-column layout (5-column width for the 4-6 Mandatory Live Photos Gallery on the left; 7-column width for the Terminal Execution & Specs Matrix Panel on the right). Ensure the identity tier badge, specs grid table, recharts sparkline, and the primary gold CTA button are perfectly aligned using `font-mono` for all numeric values.

### [Coding Safety Guidelines]
- Use fully localized Mock Data arrays with real Hong Kong Dollar currency symbols (`HK$`).
- Ensure no universal white skeleton loading is used; code the precise dark gold pulse shimmer instead.
- Export all interfaces cleanly to prevent hydration mismatches or TypeScript lint errors.