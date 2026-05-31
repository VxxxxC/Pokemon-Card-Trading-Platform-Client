# 🤖 HKcardvault 買家訂單詳情與全域原地通訊優化最終開發指令書 (AI Workflow Prompt)

## 🏗️ 任務總覽與上下文 (Context Context)

你依家係一位精通 Next.js (App Router)、TypeScript 5.x 同 Tailwind CSS 嘅資深前端架構師。我哋正在開發一個高質感嘅暗金電競彭博金融終端風（Dark Bloomberg Terminal Style）嘅 Pokémon TCG 卡牌 C2C 交易平台。全站全局通訊採用咗一體化、雙端自適應嘅 `GlobalChatConsole.tsx` 控制台，透過全域自定義事件（Custom Events）進行長駐驅動。

今次你嘅核心任務係要優化買家訂單管理空間，將以下兩大優化徹底落地：

全域原地通訊改裝：改裝訂單詳情頁（或訂單卡片）入面粒「進入全域安全對話」按鈕，拒絕任何路由跳轉（Route Redirect），實現原地開片。

進行中 vs 歷史完成訂單 UI 徹底解耦：拒絕用同一個 UI 敷衍了事，根據訂單 `status` 狀態條件分流渲染兩個完全獨立、深度優化嘅功能面板組件。

---

## 🛠️ 核心任務 1：改裝「聯絡賣家 / 安全對話」按鈕為全域事件驅動

- 目標檔案：`app/profile/user/orders/[id]/page.tsx` (以及 `app/profile/user/orders/page.tsx` 內之訂單卡片控制列)
- 現存技術債：目前粒「💬 聯絡賣家進行安全對話」按鈕依然包裹住舊版嘅 ``，點擊會導致整頁硬刷新跳轉，極度破壞買家喺當前訂單頁面追蹤進度嘅多巴胺尋寶流暢感。
- 重構要求：

1. 連根拔起舊路由：徹底移除所有包裹住聯絡賣家按鈕嘅 `Link` 標籤或 `router.push` 邏輯。
2. 發射全域事件廣播：將按鈕嘅 `onClick` 改為直接向 Window 全局發射一個 CustomEvent，事件命名必須精準對齊為 `"open-global-chat"`。
3. Payload 數據強型態對齊：發射廣播時，`detail` 物件內必須精準帶上當前訂單所屬商戶/賣家嘅實體識別代碼與名牌，型態如下：

```typescript
window.dispatchEvent(
  new CustomEvent("open-global-chat", {
    detail: {
      roomId: order.sellerId, // 帶入當前訂單賣家 ID（例如: "PKT-8839-44A"）
      partnerName: order.seller, // 帶入當前訂單賣家名稱（例如: "渡邊道館"）
    },
  }),
);
```

4. **原地起飛 UX**：確保點擊按鈕時網頁完全無任何白閃或轉頁，等頂層常駐嘅 `GlobalChatConsole` 攔藉到訊號後，喺電腦端原地吸附滑出右下角小對講機；喺手機端則直穿突入專屬聊天視窗！

---

## 🛠️ 核心任務 2：進行中（Active）vs 歷史完成（Completed）訂單詳情界面徹底解耦

- 目標路由：`app/profile/user/orders/[id]/page.tsx` (動態訂單詳情頁)
- 架構設計思維：
  為保持全站網址（URL）嘅簡潔性，嚴禁開設多餘嘅子路由網址。請保持單一動態路由檔案 `[id]/page.tsx`，但在 presentation 層面，根據訂單的數據狀態 `order.status` 進行極致分流，拆解成兩個完全解耦嘅高效能子組件。

- 具體實作指令：
  在同一個資料夾下建立或封裝兩個獨立嘅 UI 元件，當 `order.status === "released"` (代表交易已完成，資金已釋放) 時，渲染完成面板；其餘任何狀態一律視為進行中訂單。

```tsx
if (order.status === "released") {
  return <CompletedOrderDetail order={order} />;
}
return <ActiveOrderDetail order={order} />;
```

### 📦 A. 子組件 1：`<ActiveOrderDetail order={order} />` (進行中行動看板)

- 專屬業務邏輯與 UI 鋪設：
- 動態電競步進器 (Glowing Stepper)：必須外顯帶有實時脈衝光芒嘅第三方 Escrow 資金託管進度條（Payment -> Custody -> Shipped -> Grading）。
- 順豐自提物流動作卡片 (SF Locker Action Card)：包含用戶可隨時交互修改嘅「香港手提電話號碼（8位數強格式校驗）」與「順豐智能櫃/網點代碼自選下拉選單」。
- 資金凍結提示：醒目外顯「10-20% 定金已鎖定於 Stripe 託管帳戶」之字眼，建立中介信任感。

### 📜 B. 子組件 2：`<CompletedOrderDetail order={order} />` (歷史完成存檔電子收據)

- 專屬業務邏輯與 UI 鋪設：
- 全面移除硬核步進器：歷史已成定局，不應再展示進行中嘅 Stepper 條。
- 高端金融結帳明細 (Financial Ledger)：使用 `font-mono` (JetBrains Mono) 進行嚴格等寬右對齊嘅電子收據清冊（包括商品小計、運費、平台免郵券定額補貼、以及實時最終實付總額 `HK$ X,XXX`）。
- 官方資產存證核銷：新增一個高質感嘅「📥 下載官方實物鑑定存證報告 (PDF)」Mock 按鈕，點擊跳出提示，滿足收藏家對品相資產認證嘅安全感。
- 雙向誠信評價機制：新增一個精緻嘅賣家星級點擊評分表單（1-5星），提示買家「給予道館主本次託管效率評價」，用於解鎖大賣家嘅黃金 3D 質感徽章系統。

---

## 🛡️ 🛡️ 首席架構師硬核前端防禦線 (Technical Guardrails)

React 19 Lint 效能防錯（拒絕級聯渲染）：
在編寫任何 `useEffect` 掛載對齊或初始化狀態時，嚴禁在 Effect 頂層同步呼叫 `setState`（例如同步更新 View 或初始 ID），否則會觸發 React 19 嘅 Cascading Render 紅牌報錯。所有初始化的狀態對齊，必須強制包裹進下一個事件循環 Tick 之中：

```tsx
useEffect(() => {
  const timer = setTimeout(() => {
    // 在此處安全執行狀態同步更新
  }, 0);
  return () => clearTimeout(timer); // 必須精準清除計時器，拒絕內存洩漏
}, []);
```

TypeScript 5.x 字面量嚴格校驗：
通訊系統中嘅 `sender` 欄位被嚴格定義為字面量聯合型態 `"me" | "them" | "system"`。喺處理 Mock 數據或系統提示字句生成時，切勿直接將普通 `string` 塞入，必須使用強型態限制或 `as const` 斷言鎖死，杜絕型態外溢報錯。

視覺 Tokens 嚴格對齊：
嚴格遵循純深色主題（Pure Dark Mode）。底色限用午夜漆黑 `#17130f` 與碳黑 `#26211C`；邊框限用高質感極細微光 `border-[rgba(237,232,224,0.08)]`；核心執行主按鈕（CTA）滿鋪金棕色 `#d4a574`。數字與港幣符號一律選用 `font-mono` 對齊。
