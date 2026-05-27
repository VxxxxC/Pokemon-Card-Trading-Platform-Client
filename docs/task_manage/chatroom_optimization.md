# 📂 Document 4.1: Task 4 特化修訂案 - 全局即時聊天中樞與安全防禦通訊室 (Global Chat Hub)

本文件詳細定義 PokéTrade JP 平台之「全局即時聊天中樞（Global Chat Hub）」的純前端 UI 實作細節。為了徹底解決深藏在會員 Profile 導致體驗不佳的 Anti-Pattern，本優化案將聊天室提升為全局頂層組件（Global Utility），使用戶在整站任何頁面均能一鍵開聊，並在通訊底層構築鋼鐵般的前端安全防線。

---

## 🧭 1. 基於實體檔案樹之全局入口佈局 (Codebase Entry Layout)

為了達到「任何頁面、任何時間都能開聊」的極致體驗，聊天按鈕與未讀紅點必須直接注入到你現有的全局導航組件中，並落戶於通用聊天目錄：

* **新增組件實體路徑 (New Components)**：
  - `app/components/chat/ChatHubDrawer.tsx` (全局右側/底部滑出式聊天中樞抽屜)
  - `app/components/chat/ChatWindow.tsx` (核心雙邊對話流與正則監聽核心)
* **PC 端入口對齊 (Desktop Integration)**：
  - **實實檔案**：`app/components/navigation/TopNav.tsx`
  - **位置**：放置於 Header 右側操作區，與用戶頭像、`PWANavbarStatus`（PWA 狀態信號燈）完美並排。
* **行動端入口對齊 (Mobile Integration)**：
  - **實體檔案**：`app/components/navigation/MobileHeader.tsx`
  - **位置**：放置於頂部最右側，與現有的通知鈴鐺（Notification Bell）保持優雅的避讓間距，符合大拇指單手操作熱區。

---

## 🛠️ 2. 核心子模組功能與 UI 細節 (Component Specs)

### A. 全局 Navbar 聊天觸發按鈕 (ChatTriggerButton)
* **外觀視覺**：採用高質感電商暗金色調，微型 💬 訊息 SVG 圖標，顏色常駐為羊皮紙灰 `text-[#d4c4b7]`。當有新訊息時，Hover 觸發溫和縮放與發光：`hover:scale-110 hover:text-[#d4a574]`。
* **多巴胺未讀紅點 (Pulsing Unread Counter)**：
  - 當 Mock 狀態存在未讀訊息時，圖標右上角 absolute 定位掛載一個**警告紅 (`#ef4444`)** 的微型圓形數字 Badge。
  - 字體全量強制使用等寬 `font-mono text-[10px] text-[#eae1da]`。
  - Badge 自帶 Framer Motion 的無限無休止呼吸發光光暈（`animate-pulse`），強烈吸引用戶點擊，拉高整站日活。

### B. 響應式全局聊天抽屜 (ChatHubDrawer.tsx)
* **滑出交互機制 (Global Zustand Trigger)**：
  - 用戶在整站任何頁面（TopNav、MobileHeader、或商品詳情頁的「聯絡賣家」按鈕）點擊時，不觸發頁面跳轉，而是瞬時喚醒全局狀態 `isChatOpen: true`。
  - **PC 端**：從螢幕右側優雅滑出，寬度鎖定 `max-w-md` (約 `400px`)，背景色為抬升表面 `bg-[#2e2925]`，疊加高感度毛玻璃遮罩層 `backdrop-blur-sm bg-black/50`。
  - **行動端**：轉化為從螢幕底部向上滑出的 Bottom Sheet，底部預留與你既有 `BottomNav.tsx` 欄位的安全避讓間距。
* **雙欄/分段結構設計**：
  - **對話歷史列表區 (Chat List)**：高密度羅列當前有過通訊的賣家頭像、店名、最後一條訊息摘要及時間（`font-mono text-xs text-[#8A8680]`）。
  - **當前對話視窗區 (Active Chat Box)**：點擊特定商家後，無縫切換載入 `ChatWindow.tsx`。

### C. 對稱式對話流與正則安全防線 (ChatWindow.tsx)
* **鋼鐵 C2C 信任氣泡流**：
  - **自己發送的訊息**：靠右對齊，氣泡填充為古銅棕底色 `bg-[rgba(140,115,85,0.15)]`，文字為高對比象牙白 `text-[#eae1da]`。
  - **對方發送的訊息**：靠左對齊，氣泡填充為高亮炭棕色 `bg-[#2e2925]`，邊框為極細白邊 `border-[rgba(237,232,224,0.08)]`。
  - **系統交易狀態通知**：置中顯示，使用柔軟淺灰文字 `text-[#8A8680]`，斜體，無氣泡包裹（例：*「系統提示：賣家已上載順豐單號，資金已進入安全託管階段」*）。
* **正則安全監聽防禦線 (Frontend Text Regex Monitor)**：
  - 聊天室正上方常駐一個羊皮紙灰的終端風警告橫幅：「*🔒 本平台已全面啟用 Stripe Connect 雙兩段式資金託管保障，請切勿進行私下交易。*」
  - **即時攔截交互**：當用戶在底部 Input 輸入框中打字，前端 `onChange` 觸發正則表達式監聽。一旦偵測到包含「私下交易」、「電話」、「PayMe/轉數快」、「WhatsApp」等試圖繞過平台金流的字眼時，輸入框下方瞬時跳出**警告紅 (`#ef4444`)** 的即時文字警告：`[⚠️ 安全提示：偵測到敏感通訊，請使用平台 Stripe Connect 託管以保障資金安全]`。

---

## 🛡️ 3. 首席架構師前端防禦線

* **流暢鍵盤避讓與樂觀發送 (Mobile UX Guardrails)**：
  - **行動端虛擬鍵盤防遮擋**：當用戶點擊底部聊天輸入框、手機鍵盤彈出時，聊天容器高度必須使用 `h-[calc(100vh-keyboardHeight)]` 或動態動態監聽，強制將最新一條對話氣泡與發送按鈕推至鍵盤上方，嚴禁將輸入框頂出螢幕或被鍵盤死死遮擋（這在 PWA 環境下是致命的體驗 Bug）。
  - **發送多巴胺樂觀更新**：用戶點擊發送時，前端立即（Optimistic）將文字氣泡渲染到對話流中，自帶從下往上輕微位移 4px 的淡入彈簧動畫，隨後異步進行模擬的 WebSocket 狀態確認，維持交易所級的高流暢打字感。