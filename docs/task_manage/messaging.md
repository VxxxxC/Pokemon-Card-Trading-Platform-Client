# 📂 Document 4: Task 4 - 個人資產中樞與安全防禦通訊室 (Portfolio & Secure Chat)

本文件詳細定義 PokéTrade JP 平台之用戶個人資產管理中樞（Portfolio）、遊戲化每日簽到組件、以及內置即時聊天室與安全防禦監聽系統的純前端 UI 實作細節。本模組旨在大幅拉高用戶日活（DAU）與黏著度，同時在前端築起鋼鐵般的安全防線。

---

## 🧭 1. 基於實體檔案樹之佈局對齊 (Codebase Layout Alignment)

* **資產中樞與簽到實體路徑 (Existing Routes & Components)**：
  - `app/profile/user/collection/page.tsx` (個人資產收藏庫與總身家計算中樞主頁)
  - `app/components/profile/CheckInWidget.tsx` (內置於資產庫的 7 日簽到里程碑組件)
  - `app/profile/user/collection/components/WishlistTable.tsx` (用作展現用戶心水追蹤卡牌清單的數據表格)
* **公開商家與聊天室路徑 (Profile & Chat Router)**：
  - `app/profile/[id]/page.tsx` (公開賣家商舖展廳頁)
  - `app/components/chat/ChatWindow.tsx` (你需要新建此通訊組件檔案，或落戶於現有通用組件目錄中)

---

## 🛠️ 2. 核心子模組功能與 UI 細節 (Component Specs)

### A. AI 總身家計算器與 7 日簽到里程碑 (collection/page.tsx & CheckInWidget.tsx)
* **AI 總身家計算面板 (collection/page.tsx)**：
  - 面板頂部使用特大號字體且全量強制等寬（**`font-mono text-4xl font-bold text-[#eae1da]`**），動態渲染當前持有的卡牌港幣總資產估值（例 `HK$ 45,280`）。
  - **多巴胺跳動特效**：當頁面掛載（Mount）完成時，數字自帶從零遞增滾動到目標值的數字跑馬燈動畫，激發用戶的資產優越感。
  - 下方整合你既有的 `WishlistTable.tsx`，清單內每張卡牌皆與 `Task 1` 的基礎卡牌模型對齊，外顯最新港幣市價與 24h 跌宕幅度。
* **7 日連續簽到進度條 (CheckInWidget.tsx)**：
  - 橫向 7 節點膠囊型進度條。已簽到日子點亮為實心溫金棕色 `bg-[#d4a574]`，當前活躍日子帶有動態微弱脈衝光暈（Pulse），並外顯進度提示：「*已連續簽到 5 日！第 7 日即可解鎖香港本地免運費券！*」

### B. 公開賣家商舖頁 (Public Seller Store - profile/[id]/page.tsx)
* **賣家榮譽名片**：展示賣家頭像、自訂店名、累積成交筆數與好評率（例 `99.8% 好評`）。名字後方掛載黃金 3D 質感的身份稱號徽章：**`🏅 專業道館主`**。
* **商品現貨瀑布流 (Active Listings Grid)**：展示該賣家目前「正在上架中」的卡牌網格，承接 `Task 1` 內 `MarketplaceCard.tsx` 的卡片外觀，方便買家在同一個具備高信任度的賣家商舖內進行「打包式執漏」。

### C. 內置即時聊天室與正則安全防線 (ChatWindow.tsx)
* **對稱式對話氣泡流**：
  - **自己發送的訊息**：靠右對齊，氣泡填充為古銅棕底色 `bg-[rgba(140,115,85,0.15)]`，文字為高對比象牙白 `text-[#eae1da]`。
  - **對方發送的訊息**：靠左對齊，氣泡填充為高亮炭棕色 `bg-[#2e2925]`，邊框為極細白邊 `border-[rgba(237,232,224,0.08)]`。
  - **系統交易狀態通知**：置中顯示，使用柔軟淺灰文字 `text-[#8A8680]`，斜體，無氣泡包裹（例：*「系統提示：賣家已上載順豐單號，資金已進入安全託管階段」*）。
* **正則安全監聽防禦線 (Frontend Text Regex Monitor)**：
  - 聊天室正上方常駐一個羊皮紙灰的終端風警告橫幅。
  - **即時攔截交互**：當用戶在底部 Input 輸入框中打字，前端 `onChange` 觸發正則表達式監聽。一旦偵測到包含「私下交易」、「電話」、「PayMe/轉數快」等試圖繞過平台 Stripe Connect 金流的字眼時，輸入框下方瞬時跳出**警告紅 (`#ef4444`)** 的即時文字警告：`[⚠️ 安全提示：偵測到敏感通訊，請使用平台 Stripe Connect 託管以保障資金安全]`。

### D. 商戶金流收款綁定卡片 (merchant/settings/page.tsx)
* **Express 收款專區**：位於商戶設定頁。若用戶具備賣家權限，設定頁會解鎖 Stripe Connect Express 收款區。未綁定時外顯顯眼的溫金棕色主要行動按鈕 `[ ⚡ 連結 Stripe 帳戶以啟用自動分賬收款 ]`。

---

## 🛡️ 3. 首席架構師前端防禦線

* **拒絕前端時間與原子性狀態**：
  - 收藏管理與簽到組件在前端觸發點擊時，一律採用樂觀更新（Optimistic Updates）先變更 UI 狀態以維持多巴胺流暢感。
  - 但元件內部必須埋入防作弊校驗，**禁止在傳遞數據時夾帶客端本地的時間戳（Timestamp）**，防止用家透過修改手機系統時區等手段來外掛刷簽到。
  - 所有的時間與日期標籤在純前端 Mock 結構中，一律標記為 `[SERVER_TIME_RESOLVED]` 預留位置，待後期後端對接時由伺服器時間統一取代。