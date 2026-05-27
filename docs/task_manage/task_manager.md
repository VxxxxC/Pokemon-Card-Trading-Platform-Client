# 📂 Master Document 0: 全局項目協調與開發順序指南 (Master Instruction Guide)

本文件作為項目經理（Project Manager）的核心調度大腦，詳細定義了 PokéTrade JP 平台 4 個特化前端開發任務的依賴關係、潛在衝突防禦以及絕對執行指南。所有協作者與 AI Agents 在執行任何單一子任務前，必須先閱讀此指南。

---

## 🗺️ 1. 任務關係與核心依賴鏈 (Dependency Matrix)

這 4 個任務並非孤立存在，它們彼此之間有著嚴格的數據與組件依賴。為了防止 AI Coding Agent 生成重複、不兼容或斷裂的代碼，必須嚴格遵循以下順序執行：
[Task 1: 市場探索與篩選中樞](./marketplace.md) ➔ 完善 app/marketplace/page.tsx 與 components/marketplace/ 內組件, 導出 Card 元件與 Watchlist 狀態
↓
[Task 2: 商品技術規格詳情頁](./product_detail.md) ➔ 新建 app/marketplace/[id]/page.tsx，承接 Task 1 之卡片數據, 承接 Card 資料、解鎖 Buy/Bid Actions
↓
[Task 3: 股票交易與支付金流](./checkout_flow.md) ➔ 實作交易滑出面板，並對接 app/profile/user/orders/, 觸發 Slide-over / 承接 Checkout 數據流
↓
[Task 4: 資產中樞與安全通訊](./messaging.md) ➔ 注入 WishlistTable.tsx，對接 app/profile/user/collection/, 整合 Watchlist、展現總身家與安全防線

### 核心依賴說明：
* **Task 1 是一切的基石**：它會直接去調整你現有的 `app/marketplace/page.tsx`，並在 `app/components/market/WishlistButton.tsx` 確立核心星標狀態和基本的價格漲跌幅狀態。Task 2、3、4 內所使用的卡牌元件與數據格式，必須完全承接 Task 1 的定義。
* **Task 3 是動態交互的核心**：它所實作的右側滑出式交易面板（Slide-over Sheet），將會直接被逆向注入到 Task 1 的商品卡片與 Task 2 的 `[id]/page.tsx` 詳情頁中。

---

## ⚡ 2. 核心衝突防禦點 (Conflict Mitigation Blueprint)

AI Agent 在分段開發不同頁面時，極易在以下幾個跨頁面交界處產生代碼衝突與 Pattern 混亂。本指南建立以下鋼鐵防禦線：

* **防禦政策 A：星標按鈕（⭐️ Wishlist Button）的唯一性與命名對齊**
  * *衝突預防*：專案已統一命名為 **`Wishlist`**（非 Watchlist）。你已擁有實體檔案 `app/components/market/WishlistButton.tsx`。
  * *鋼鐵規則*：此元件是唯一控制星標狀態的核心。Task 2（詳情頁）和 Task 4（會員資產庫）需要用到星標功能時，**一律直接 Import 此現有路徑**，嚴禁讓 AI 在 `components/marketplace/` 或其他地方重複生成同類元件，防止狀態脱節。
* **防禦政策 B：首頁 Skeleton 與實體頁面整合**
  * *衝突預防*：你的首頁組件已平鋪喺 `app/components/home/`（如 `SniperRadar.tsx`, `FollowingFeed.tsx`）。
  * *鋼鐵規則*：Task 1 與 Task 2 在 Mock 數據時，所使用的 `Interface`（如卡牌名稱、系列、HKD 價格）必須與首頁這些既有元件保持 100% 欄位對齊，確保未來大數據串接時全局畫面不會崩塌。
* **防禦政策 C：金融等寬字體與貨幣格式強制令**
  * *鋼鐵規則*：全專案所有涉及到港幣價錢（`HK$`）、漲跌幅（`▲/▼`）、卡牌編號、日期的文字，Tailwind 類別**必須強制鎖定 `font-mono` (對應你 config 內的 JetBrains Mono)**。格式化一律為 `HK$ X,XXX`，確保排版達到交易所級的視覺精確度。
* **防禦政策 D：路由群組（Route Groups）防錯**
  * *鋼鐵規則*：專案無使用 `(public)` 或 `(user)` 等括號路由群組。所有路徑直鋪於 `app/` 根目錄下。AI Agent 寫路徑時必須嚴格遵守實體樹結構。
---

## 📅 3. 階段性開發順序與 Guideline

請引導 AI Agent 嚴格按照以下工期順序逐步解鎖：

* **【第 1 階段】執行 [Task 1 - 市場探索與篩選中樞](./marketplace.md)**：完善現有的 `app/marketplace/page.tsx` 及 `app/components/marketplace/` 內組件，確立卡牌基礎外觀與星標基本切換動畫。
* **【第 2 階段】執行 [Task 2 - 商品技術規格詳情頁](./product_detail.md)**：**手動新建** `app/marketplace/[id]/page.tsx` 路由，實作左側 4-6 張強制實物展台，完成卡牌官方技術規格矩陣與大數據折線圖。
* **【第 3 階段】執行 [Task 3 - 股票交易與支付金流](./checkout_flow.md)**：新開 `components/transactions/` 或通用實作右側滑出式支付/出價執行面板，以及完善現有的結帳、付款結果回報落地頁。
* **【第 4 階段】執行 [Task 4 - 資產中樞與安全通訊](./messaging.md)**：完善現有的 `app/profile/user/collection/page.tsx`，對接現有的 `WishlistTable.tsx`，並實作帶有正則表達式監聽的內置安全聊天室。
