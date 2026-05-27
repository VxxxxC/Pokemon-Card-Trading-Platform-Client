# 📂 Document 3: Task 3 - 股票式交易執行面板與分段託管金流頁 (Trading & Checkout Flow)

本文件詳細定義 PokéTrade JP 平台之交易撮合中樞、右側滑出式執行面板（Slide-over Sheet）、收貨資料確認頁（Checkout）以及付款結果與訂單追蹤頁的純前端 UI 實作細節。本模組是平台完成商業閉環與資金安全感的靈魂所在。

---

## 🧭 1. 基於實體檔案樹之佈局對齊 (Codebase Layout Alignment)

* **新增組件實體路徑 (New Component Path)**：➔ `app/components/transactions/ExecutionSlideOver.tsx` (與你現有的 `TransactionWall.tsx` 歸於同一個業務模組資料夾)
* **結帳與訂單追蹤實體路由 (Existing Routes)**：
  - `app/profile/user/orders/page.tsx` (用作結帳 Review 訂單明細與展示購買/賣出訂單歷史列表的雙向核心頁)
* **版面特徵 (Layout Strategy)**：
  - 全局高度重視大拇指操作熱區。
  - 在行動端上，核心結帳與出價按鈕必須全寬滿鋪、固定於螢幕底部，並透過 Tailwind 預留與你既有的底欄 `app/components/navigation/BottomNav.tsx` 的避讓安全間距（Safe Area Padding），防止 UI 疊加遮擋。

---

## 🛠️ 2. 核心子模組功能與 UI 細節 (Component Specs)

### A. 通用右側滑出式交易執行面板 (ExecutionSlideOver.tsx)
* **外觀與架構**：當用戶在 `MarketplaceCard.tsx` 或商品詳情頁點擊「直接購買」或「即時出價」時，透過狀態管理控制其滑出。
* **暗金調表面與遮罩**：面板背景色為抬升表面 `bg-[#2e2925]`，右側滑出寬度在 Desktop 限制為 `max-w-md` (約 `400px`)。背景疊加高感度毛玻璃遮罩層 `backdrop-blur-sm bg-black/50`。
* **動態分流互動模式 (State Switching)**：
  - **直接購買模式 (Instant Buy Mode)**：
    - 頂部清晰展示卡牌縮圖、系列編號與品相標籤。
    - 下方呈現分段式託管保障文字區塊：「*🔒 本項目支援分段式 Escrow 託管。針對高價值卡牌，您當前僅需支付 10% 港幣訂金即可立刻啟動第三方實體鑑定流程。*」
  - **即時出價模式 (Instant Bid Mode)**：
    - 呈現一個高密度的數值輸入框（Input），數字必須全量強制使用等寬字體且點亮品牌色（`font-mono text-2xl text-[#d4a574]`）。
    - 買家可自由掛出理想收購價，下方配備股市撮合機制說明：「*您的出價將進入平台掛單撮合池，當有賣家願意以此價匹配時，系統將自動為您成交。*」

### B. 香港本地優化訂單明細牆 (Financial Ledger Wall - orders/page.tsx)
* **香港本地優化表單**：專為香港客群深度優化，表單輸入框背景為 `bg-[#26211C]`，內置支援順豐智能櫃代碼、順豐站地址、自提點以及香港本地 8 位數電話號碼格式校驗的極簡表單。
* **金融級等寬對齊明細**：
   - 欄位排版必須全量強制使用等寬字體 `font-mono` (JetBrains Mono)，確保所有港幣數值、符號上下完美對齊，呈現極致精確感：
    * `商品小計 (Subtotal) :------------------ HK$ 1,480`
    * `順豐速遞運費 (Shipping) :--------------- HK$    30`
    * `平台定額優惠券補貼 (Subsidy) :---------- -HK$    30`
    * `本次實時應付總額 (Total) :-------------- HK$ 1,480`

### C. 付款結果回報頁 (Payment Splash Landing View)
* **成功頁面 (Success View)**：
  - 畫面掛載時觸發 Framer Motion 順滑彈簧動畫，點亮**成功綠 (`#10b981`)** 呼吸燈效果。
  - 特大號字體顯示 `付款成功` 標題。
  - 帳單明細區利用 `font-mono text-xs text-[#d4c4b7]` 外顯一組模擬的 Stripe 交易鎖定流水號與訂單編號。
  - 底部配置滿鋪品牌溫金棕色按鈕，引導買家至「我的購買」追蹤實體鑑定與資金託管進度。
* **失敗頁面 (Fail View)**：
  - 點亮**警告紅 (`#ef4444`)** 燈，明確提示失敗原因（如：`Stripe 信用卡授權失敗`、`餘額不足`、或 `該卡牌現貨剛剛已被其他玩家優先直接購買截胡`）。
  - 提供一鍵返回 Marketplace 重新進行狙擊尋寶的次要按鈕。

---

## 🛡️ 3. 首席架構師前端防禦線

* **客端狀態防重鎖定與觸覺回饋 (Idempotency Lock)**：
  - 核心交易結帳按鈕 `[ ⚡ 確認付款 ]` 或 `[ 📈 提交掛單出價 ]` 必須綁定嚴格的客端防重發點擊機制。
  - 當用戶點擊按鈕的瞬間，按鈕狀態必須瞬時進入 `disabled`，文字轉化為一個古銅棕色、無休止旋轉的極簡圈圈微光（Spinner），避免因香港用家網絡延遲或連擊（Double Click）導致向後端或 Stripe Webhook 發起重複的扣款請求。
  - 按鈕必須配備觸覺反饋彈簧物理動畫（`whileTap={{ scale: 0.98 }}`），給予用家鋼鐵般專業、沉穩的交易所下單回饋。