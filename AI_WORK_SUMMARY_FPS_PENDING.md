# FPS 待結算金額動態化工作總結

## 任務目標
在 `app/admin/payouts/page.tsx` 中，讓「FPS 批次處理」tab 的待結算指標依據 `withdrawals` state 動態計算，並在頂部 KPI 卡片中呈現。

## 變更內容

### 修改檔案
- `app/admin/payouts/page.tsx`

### 具體改動
1. 新增動態計算 `useMemo`：
   ```typescript
   const fpsPendingTotalAmount = useMemo(() => {
     return withdrawals
       .filter((w) => w.status === "pending" || w.status === "processing")
       .reduce((sum, w) => sum + w.amount, 0);
   }, [withdrawals]);
   ```
   此計算會在 `withdrawals` 狀態改變時自動重新計算（例如點擊「銷帳」或「駁回」後）。

2. 頂部卡片改為依據 `activeTab` 動態切換：
   - **FPS tab 活躍時**：
     - 標題：`FPS 提現總覽`
     - 副標題：`待處理與處理中提現之總額`
     - metrics：
       - 待處理筆數（`text-warning`）
       - 待處理/處理中提現總額 `HK$ {fpsPendingTotalAmount.toLocaleString("zh-TW")}`（`text-brand`）
       - 處理中筆數（`text-warning`）
     - 重新整理 toast：`已重新整理 FPS 提現資料`
     - 底部：`即時運算`
   - **Stripe tab 活躍時**：
     - 保持原有「Stripe 平台帳戶餘額」內容不變。

## 設計決策
- 採用頂部卡片動態切換方案，讓管理員切換 tab 時，頂部 KPI 始終與當前業務語境對應。
- 不引入 E2E 測試，以 TypeScript 編譯與手動互動驗證為主。

## 驗證結果
```bash
bunx tsc --noEmit   # ✅ 無錯誤
bun run lint        # ✅ 0 errors（12 warnings 均與本次檔案無關）
```

## 手動互動驗證
- 在 FPS tab 點擊任一待處理提現單的「✓ 銷帳」或「✕ 駁回」後，`withdrawals` state 會更新，`fpsPendingTotalAmount` 會即時重新計算，頂部卡片中的總額會同步下降。
