# Task 5 工作匯報：Replace Existing `window.alert()` with shadcn/ui Sonner Toast

日期：2026-06-03

## 任務目標
將目前指定前端活躍組件中的同步阻塞式 `window.alert()` 改為統一的 `shadcn/ui` Sonner Toast，並以 PokéTrade JP 的暗金深色設計系統全域掛載。

## 需求追溯
- `requirement.md` → **1.6 PWA 設計**（流暢、Mobile-first 的互動回饋）
- `requirement.md` → **1.7 遊戲化功能**（每日簽到、積分獎勵）
- `requirement.md` → **1.9 用戶與管理後台**（個人庫存與獎勵中心互動）
- 開發階段：**第 1 個月 - UI/UX 設計原型確認**

## 已完成內容

### 1. 安裝 shadcn/ui Sonner
已執行：
```bash
bunx --bun shadcn@latest add sonner
```

### 2. 建立並客製化全域 Toaster
已覆寫 `components/ui/sonner.tsx`，採用指定深色風格：
- 背景：`#26211C`
- 主要文字：`#eae1da`
- 次要文字：`#d4c4b7`
- 邊框：`rgba(237,232,224,0.08)`
- 成功 / 錯誤 / 警告 toast 狀態樣式已配置

### 3. 全域掛載 Toast Provider
已在 `app/layout.tsx` 內掛載：
```tsx
<Toaster position="top-center" closeButton richColors expand={false} />
```

### 4. 指定檔案中的 `alert()` 已替換為 Sonner Toast

#### `app/components/rewards/CheckInCard.tsx`
- `handleCheckInExecute` 已改為 `toast.success(...)`
- 已加入 CTA：`進入專區 🎟️`

#### `app/profile/user/inventory/page.tsx`
已替換以下流程：
- `handleCreateListing`（編輯成功） → `toast.success`
- `handleCreateListing`（新上架成功） → `toast.success`
- `handleCreateTransactionOrder` → `toast.success`
- `handleConfirmCancelListing` → `toast.warning`

另外同一活躍頁面內的模擬圖片上傳提示亦一併由 `alert()` 改為 `toast(...)`，避免阻塞式互動殘留。

#### `app/profile/user/rewards/page.tsx`
- `handleClaimMissionReward` 已改為 `toast.success(...)`

## 追蹤文件更新
已更新 `docs/task.md` 的 `Ticket 26` 備註，標記：
- 成功提交 toast 已接入 `app/profile/user/inventory/page.tsx`
- 失敗提示與 redirect handler 仍待補完

> 注意：`Ticket 26` 仍未完全完成，所以 checkbox 保持未勾選。

## 驗證結果
已執行：
```bash
bun run build
```
結果：**成功通過** ✅

Build 重點：
- Compiled successfully
- Finished TypeScript
- Static / dynamic routes 正常生成
- 無新增 `any` 型別

## 本次涉及檔案
- `components/ui/sonner.tsx`
- `app/layout.tsx`
- `app/components/rewards/CheckInCard.tsx`
- `app/profile/user/inventory/page.tsx`
- `app/profile/user/rewards/page.tsx`
- `docs/task.md`

## 範圍外但仍存在的 `alert()`
以下位置仍有 `alert()`，今次未納入指定修改範圍：
- `app/components/transactions/ExecutionSlideOver.tsx`
- `app/profile/user/orders/[id]/page.tsx`
- `app/profile/user/orders/page.tsx`

如要完全統一整個前端提示系統，建議下一步把以上三處都遷移到 Sonner。

## 總結
今次已完成指定 Sonner 安裝、全域掛載、設計系統對齊，以及三個目標前端組件的 `alert()` 替換。整體編譯成功，未引入 hydration guard 反模式，並保持現有 `useSyncExternalStore` 隔離策略不變。
