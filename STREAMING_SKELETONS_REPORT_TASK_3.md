# Streaming Skeletons 任務工作匯報

## 任務目標
為 PokéTrade JP 兩個高頻串流模組建立高保真 skeleton loading 體驗：

1. 首頁右側 `TransactionWall` 最新交易牆
2. 加密議價 / 對話抽屜 `GlobalChatConsole`

目標包括：

- 使用 shadcn/ui `Skeleton` 作為唯一骨架基底
- 模擬真實金融終端 stream loading 的文字長短與訊息氣泡節奏
- 在 realtime channel / chat room 尚未同步完成前，避免空白閃爍
- 維持版面尺寸穩定，減少 CLS / layout collapse

---

## 完成內容

### 1. 驗證 Skeleton 可用
已確認專案可正常使用：

```tsx
import { Skeleton } from "@/components/ui/skeleton";
```

---

### 2. 新增串流骨架元件檔案
新增檔案：

- `app/components/shared/StreamingSkeletons.tsx`

包含兩個 export：

#### `TransactionWallSkeleton`
- 4 行垂直交易 feed stub
- 使用變化寬度：
  - `w-1/2`
  - `w-2/3`
  - `w-5/12`
  - `w-7/12`
- 模擬真實市場流中 card 名稱長短不一的金融 terminal 質感
- 包含：
  - status pill
  - 主資訊區
  - price box
  - time pill

#### `ChatDrawerSkeleton`
- 模擬聊天室抽屜載入態
- 包含：
  - 頂部房間 header stub
  - 左右交錯 message bubble stubs
  - 底部 message input console stub

整體外框配色已對齊專案深色金融主題：

- `#17130f`
- `#26211C`
- `#2e2925`

---

## 3. 接入首頁 Transaction Wall

### 修改檔案
- `app/components/transactions/TransactionWall.tsx`
- `app/page.tsx`

### `TransactionWall.tsx` 變更
新增：

- `TransactionWallItem` 型別
- `TransactionWallProps`
  - `records?: TransactionWallItem[]`
  - `isLoading?: boolean`

加入 fallback 邏輯：

```tsx
if (isLoading || feed.length === 0) {
  return <TransactionWallSkeleton />;
}
```

### `app/page.tsx` 變更
在首頁右側 sidebar `TransactionWall` 區塊中，加入顯式 loading 分支：

```tsx
const isTransactionWallLoading = false;
```

並於 JSX 中接入：

```tsx
{isTransactionWallLoading ? (
  <TransactionWallSkeleton />
) : (
  <TransactionWall />
)}
```

目前預設為 `false`，保留現有 mock feed 行為不變；未來可直接替換為 Supabase realtime channel connection state。

---

## 4. 接入加密聊天室 Drawer

### 修改檔案
- `app/components/chat/GlobalChatConsole.tsx`

### 變更內容
新增可選 props：

```tsx
isLoading?: boolean;
```

並在 chat room 資料尚未就緒時加上 fallback：

```tsx
if (isLoading || chats.length === 0 || !activeRoom) {
  return ...<ChatDrawerSkeleton />
}
```

### Desktop / Mobile 都有 fallback
- Desktop：保留原有右下角浮動 console 外框尺寸 `640 x 460`
- Mobile：保留全螢幕 drawer 動畫容器
- 兩邊都用 `ChatDrawerSkeleton` 填滿內容區，避免 stream 尚未建立時出現白板/空抽屜

這個做法同時對 `TopNav` 與 `MobileHeader` 生效，因為兩者都共用 `GlobalChatConsole`。

---

## 型別與工程策略

### 嚴格 TypeScript
本次無引入 `any`。

新增型別：
- `TransactionWallItem`
- `TransactionWallProps`
- `GlobalChatConsoleProps.isLoading?: boolean`

### 未來接駁 Realtime 的準備
本次不是只做靜態 UI，而係為未來真實串流保留乾淨接點：

- `TransactionWall`
  - 可直接接 Supabase transaction stream data
  - 可用 `isLoading` 綁定 channel connection state

- `GlobalChatConsole`
  - 可直接接 room history sync / channel bootstrapping state
  - 當 `chats` 為空或 active room 尚未解析時，自動顯示 skeleton

---

## 驗證結果

### Diagnostics
以下檔案均無 errors / warnings：

- `app/components/shared/StreamingSkeletons.tsx`
- `app/components/transactions/TransactionWall.tsx`
- `app/components/chat/GlobalChatConsole.tsx`
- `app/page.tsx`

### Build 驗證
已成功執行：

```bash
bun run build
```

結果：✅ 成功

重點：
- Next.js production build compiled successfully
- TypeScript passed
- `/` 首頁與聊天相關 UI 所在 routes 均正常編譯

---

## 本次涉及檔案

### 新增
- `app/components/shared/StreamingSkeletons.tsx`
- `STREAMING_SKELETONS_REPORT.md`

### 修改
- `app/components/transactions/TransactionWall.tsx`
- `app/components/chat/GlobalChatConsole.tsx`
- `app/page.tsx`

---

## 總結
本次已完成 streaming skeleton system 第一期，令首頁交易牆與聊天室抽屜在未來 Supabase realtime / channel sync 對接時擁有更穩定、更專業的 loading 體驗。

### 下一步建議
如果要繼續第四個 task，我建議可以延伸到：

1. inbox dropdown list skeleton（`TopNav` 收件匣下拉）
2. mobile chat room list skeleton（房間清單與訊息預覽）
3. `ExecutionSlideOver` 交易抽屜 skeleton
4. 為 stream modules 增加 route / suspense 級別 fallback 整合
