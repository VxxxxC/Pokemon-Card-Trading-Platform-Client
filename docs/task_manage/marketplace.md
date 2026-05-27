# 📂 Document 1: Task 1 - 交易所級市場探索與進階篩選中樞 (Marketplace & Filter Core)

本文件詳細定義 PokéTrade JP 平台之市場探索頁（Marketplace Page）的核心結構、進階篩選元件與商品網格卡片的純前端 UI 實作細節。本頁面是一切 End-User 買賣探索流的起點，必須展現出極致高密度、精確的港幣金融交易終端美學。

---

## 🧭 1. 基於實體檔案樹之佈局對齊 (Codebase Layout Alignment)

* **路由實體路徑 (File Path)**：`app/marketplace/page.tsx`
* **連帶組件目錄 (Associated Components)**：`app/components/marketplace/`
* **PC 端版面 (Desktop Layout)**：
  - 採用不對稱 2 欄高密度版面。
  - 左側（佔 `col-span-3` 寬度）調用 `app/components/marketplace/filters/` 內組件，實作為固定黏性定位的**進階篩選器面板 (Sticky Sidebar Filters)**，高度限制為 `h-[calc(100vh-4rem)]`，允許獨立垂直滾動。
  - 右側（佔 `col-span-9` 寬度）調用 `app/components/marketplace/MarketplaceGrid.tsx`，展現 3-4 欄的**動態商品網格流 (Product Grid)**。
* **行動端版面 (Mobile Layout)**：
  - 自動折疊為單欄卡牌瀑布流，利用 `app/components/marketplace/MarketplaceHeader.tsx` 處理頂部橫向滑動的 Pill 篩選晶片。
  - 底部導航直接由現有的 `app/components/navigation/BottomNav.tsx`（浮動液體玻璃選項卡欄）進行核心功能流暢導航。

---

## 🛠️ 2. 核心子模組功能與 UI 細節 (Component Specs)

### A. 交易所級進階篩選器 (Advance Search & Filters - app/components/marketplace/filters/)
* **組件外觀**：背景色固定為棕金卡牌層 `bg-[#26211C]`，帶有極細微的透明白邊框 `border-[rgba(237,232,224,0.08)]`。
* **精準搜尋與聯想 (Smart Search Input)**：
  - 在 `MarketplaceHeader.tsx` 內置一個帶有金棕色高亮邊框（Focus 時觸發 `ring-1 ring-[#d4a574]/40`）的搜尋輸入框。
  - [cite_start]當用戶輸入卡牌編號（如 `SV8a-123`）時，下方需以毫秒級速度彈出 Mock 數據的下拉式預覽清單（含卡牌官方高清原圖縮圖）[cite: 2, 9]。
* **手風琴式篩選組件群 (Accordion Filters)**：
  - **日版特有稀有度晶片**：橫向 Pill 晶片按鈕群，外顯 `SAR`、`UR`、`SR`、`AR` 乾淨標籤。
  - **香港玩家品相分級**：極簡複選框（Checkbox）組件，包含 `【美品 S】`、`【微傷 A】`、`【傷 B】`。
  - **封裝規格篩選**：可篩選 `裸卡 (Raw Card)`、`PSA 10`、`BGS 9.5` 鑑定殼商品。
* **排序調度器 (MarketplaceHeader Dropdown)**：
  - 網格右上方提供一個與背景融合的極簡下拉選單（Dropdown），選項包括：`價格：由低到高`、`價格：由高到低`、`上架時間：最新`。

### B. 交易所商品卡片 (MarketplaceCard.tsx & WishlistButton.tsx)
* **實體既有星標追蹤按鈕 (`app/components/market/WishlistButton.tsx`)**：
  - **此組件為此功能之唯一狀態核心，必須在 MarketplaceCard.tsx 內直接 Import 本檔案**。
  - *位置*：Absolute 定位在商品卡片的右上角（`top-2 right-2 z-10`）。
  - *未追蹤狀態 (Default)*：空心星形 SVG，顏色為羊皮紙灰 `text-[#d4c4b7]`。Hover 時觸發溫和縮放 `hover:scale-110 hover:text-[#d4a574]`。
  - *已追蹤狀態 (Active)*：實心星形 SVG，填充顏色為品牌溫金棕 `text-[#d4a574]`，並自帶微弱的環境發光陰影 `shadow-[0_0_10px_rgba(212,165,116,0.3)]`。
  - *互動動畫*：點擊瞬間觸發 Framer Motion 輕微壓扁縮放的觸覺反饋彈簧動畫 `whileTap={{ scale: 0.9 }}`。
* **全息反光特效 (Holographic Foil Hover Shine)**：
  - 當用戶滑鼠 Hover `MarketplaceCard.tsx` 時，卡片觸發精確的彈簧物理微幅上移（`y-[-4px]`）與 `scale(1.02)`。
  - 卡面圖片上方會優雅地淡入一層隨滑鼠移動產生虹光/極光漸變的半透明全息反光層（Holographic Overlay Layer），重現實體閃卡的尊貴感。
* **香港本位等寬價格排版**：
  - 欄位排版左側外顯全港最低現貨價，**必須全量強制使用等寬字體 `font-mono` (JetBrains Mono)**，格式化為 `HK$ 1,280`，確保上下數值完美對齊。
  - 價格右側外顯 24h 價格漲跌幅指示器：上升點亮為成功綠 `text-[#10b981]` ▲，下跌點亮為警告紅 `text-[#ef4444]` ▼。
  - 卡片底部緊湊配置兩個微型交易執行按鈕：「**直接購買**」（滿鋪品牌溫金棕色 `bg-[#d4a574]`）與「**即時出價**」（無填充，僅有古銅金細線邊框）。

---

## 🛡️ 3. 首席架構師前端防禦線

* **防動作混淆與多巴胺逛街流保護**：
  - 點擊卡牌網格上的「直接購買」或「即時出價」微型按鈕時，**前端架構底層嚴禁直接執行頁面跳轉（Router Push）**。
  - 前端必須透過全局狀態管理器發出訊號，在畫面右側滑出一個流暢的交易執行面板（Slide-over Sheet，此面板將於 Task 3 中實作）。將香港買家鎖定在當前的市場探索與「執漏」資訊流中，防止因中斷逛街流而降低整站的下單轉化率。