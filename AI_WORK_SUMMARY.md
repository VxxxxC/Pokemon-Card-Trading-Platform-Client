# Admin Payouts 重構工作總結

## 任務目標
重構 `app/admin/payouts/page.tsx`，將 mock 資料與型別抽離，並精簡 FPS 批次處理與商戶流水兩個 tab 的工具列 UI。

## 變更內容

### 新增檔案
- `app/admin/payouts/types.ts`
  - 集中管理 `WithdrawalRequest`、`MerchantStripeFlow`、`FpsFilter`、`FpsSortValue`、`StripeSortValue`、`StripeLogStatus`、`StripeLogVariant`、`StripePayoutLog`、`StripeTransferLog`、`StripeLogRow` 等型別。
- `app/admin/payouts/mockPayouts.ts`
  - 集中管理所有 mock 資料與產生器：`MOCK_WITHDRAWALS`、`MOCK_MERCHANT_FLOWS`、`MOCK_PAYOUT_LOGS`、`MOCK_TRANSFER_LOGS`、`stripePlatformBalance`、`parseLocalDate`、`mockUuid` 及 Stripe log helper。

### 修改檔案
- `app/admin/payouts/page.tsx`
  - 移除所有已遷移的型別、mock 資料與 helper，改由 `./types` 與 `./mockPayouts` import。
  - FPS 工具列改為兩行式佈局：
    - Row 1：搜尋輸入框
    - Row 2：FilterChips + SortSelect + 「批量銷帳」（僅有選取時顯示）+ 「導出 CSV」
  - Stripe 工具列改為兩行式佈局：
    - Row 1：搜尋輸入框
    - Row 2：SortSelect + 「導出 CSV」
  - 「導出 CSV」按鈕改為 shadcn/ui `<Button variant="outline" size="sm">`，尺寸縮小為 `h-9 px-3 text-xs`。
  - 動態文案：無選取時顯示「導出全部 CSV」；有選取時顯示「導出已選 (N)」，並以品牌色邊框高亮。
  - 移除獨立的「已選 X 筆」badge 與獨立「導出已選」按鈕。
  - `handleExportFpsCSV` 與 `handleExportMerchantCSV` 改為無參數，內部優先導出已選項目；無選取時導出當前篩選/排序後的檢視結果。
  - 狀態徽章統一使用 `--success` / `--brand` / `--warning` / `--error` token。
  - Tab 標籤移除 emoji，並補上 `type="button"`。

## 設計決策
- Mock 檔與型別檔放在 `app/admin/payouts/` 目錄下，符合 feature colocation。
- 保留「批量銷帳」功能，但只在 FPS 有勾選 row 時顯示，與導出按鈕同列。
- 導出按鈕無選取時統一文案為「導出全部 CSV」。
- 不引入 E2E 測試，以 TypeScript 編譯與手動驗證為主。

## 驗證結果
```bash
bunx tsc --noEmit   # ✅ 無錯誤
bun run lint        # ✅ 0 errors（12 warnings 均與本次檔案無關）
```
SA reviewer 亦確認 `bun run build` 編譯成功。

## 殘留輕微建議（非 commit 阻擋）
1. 搜尋框觸控目標可進一步放大至 `min-h-[44px]`。
2. 行動版右側操作群組可改為 `flex-wrap` 以應對極窄螢幕。
3. 未來可將 `SortSelect`、`FilterChips`、`StripeLogPanel`、`FpsTable`、`StripeTable` 拆分成獨立元件，進一步降低 `page.tsx` 行數。
4. 專案層級建議統一 `--warning` token 語義（目前 `globals.css` 為 amber，`DESIGN.md` 定義為紅色）。
