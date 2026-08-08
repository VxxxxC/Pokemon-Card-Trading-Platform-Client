# 平台獎勵 v2 — Partner QA 測試清單

> **精簡版（建議 Partner 先看）：** [PARTNER_CHECKLIST.md](./PARTNER_CHECKLIST.md)  
> **分支：** `aaron-backend-wired`  
> **Migrations（遠端已套用）：** `20260813120000`、`20260815120000`、`20260815130000`、`20260816120000`、`20260817120000`  
> **負責人：** Frontend / 全端 Partner  
> **後端聯絡：** Aaron（server actions、RPC、payout）

## 前置條件

- [ ] 遠端 DB 已套用最新 migrations（`bunx supabase db push`）
- [ ] 具 `/admin/campaigns` 存取權的 Admin 帳號
- [ ] Member 測試帳號（錢包內有券，或可發布模板觸發 auto-grant）
- [ ] 商戶 listing：**非鑑定** B2C、支援順豐運送，價格例 **HK$100**
- [ ] 商戶店鋪基本運費 + listing 加價 → 總運費例 **HK$45**（免運券情境）
- [ ] Stripe 測試模式付款；（可選）T+7 出款 cron

## Part A — Admin 精靈（Phase 1）

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| A1 | `/admin/campaigns` → **獎勵模板** tab 載入 | 顯示表格或空狀態；無 crash | ☐ |
| A2 | **新增模板** → Step 1：建立 `free_shipping`，`max_subsidy_hkd=30`，限制 `order_kinds=merchant`、`shipping_methods=sf` | 儲存為草稿 | ☐ |
| A3 | Step 2：`auto_grant` → Step 3：略過 → **發布** | 狀態 `active`；出現在列表 | ☐ |
| A4 | 建立 `discount_coupon` HK$10，`min_spend_hkd=50` → 發布 | 第二個模板為 active | ☐ |
| A5 | 列表 **編輯** 開啟精靈 Step 1，帶現有 `id` | 表單已預填 | ☐ |
| A6 | `flash_only` 模板發布 | Step 3 檔期必填；建立 active 檔期 | ☐ |
| A7 | **搶券檔期** tab | 真實檔期 CRUD 表格；ROI mock 在獨立 tab | ☐ |

## Part B — Checkout 用券（Phase 2，僅 merchant_direct）

> **自動化：** `bun run test:rewards:gate` 覆蓋 B1–B3.7 主流程（E2E + Vitest P0）。人手僅 **spot-check** 或 Admin 未覆蓋 UI。

### B1 — 主流程：免運補貼

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| B1.1 | Member 持有 active `free_shipping` 券（錢包或發布後 auto-grant） | 在 `/profile/user/rewards` 可見 | ☐ |
| B1.2 | 購買商戶 listing **無**鑑定加購；checkout 運送 = **順豐** | `CheckoutCouponPicker` 可見 | ☐ |
| B1.3 | 選免運券；摘要顯示 **平台優惠 -HK$30**（上限） | 客戶端預覽一致 | ☐ |
| B1.4 | 完成 Stripe 付款 | PI 金額 = 總額 − 補貼（例 $145 → **$115**） | ☐ |
| B1.5 | DB `merchant_orders` | `total_amount`=總額、`platform_subsidy_amount`=30、`buyer_total_amount`=115、`merchant_payout_amount` **不變**（商品+運費總額 − 佣金） | ☐ |
| B1.6 | 該券 `user_rewards` | `is_used=true`、`used_at` 已設；`reserved_merchant_order_id` 已清空 | ☐ |

**SQL（替換 order id）：**
```sql
SELECT total_amount, buyer_total_amount, platform_subsidy_amount,
       coupon_user_reward_id, coupon_type, merchant_payout_amount
FROM merchant_orders WHERE id = '<order_id>';
```

### B2 — 折扣券

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| B2.1 | 商品小計 ≥ 最低消費 | 券 **符合資格**；補貼 = min(折扣額, 小計) | ☐ |
| B2.2 | 商品小計 < 最低消費 | **不符合資格**，附原因 | ☐ |

### B3 — 限制與邊界情況

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| B3.1 | 開啟 **鑑定加購**（Phase 2 直發） | **Picker 仍顯示**；已選券清空；列表以 `useAuth: true` 重新載入（僅符合鑑定資格的券） | ☐ |
| B3.2 | 直發路徑開 auth + 帶 coupon id（2b 前） | RPC 報錯 | ☐ |
| B3.3 | 運送 = **面交** + 免運券 | 不符合資格（運費 0） | ☐ |
| B3.4 | 付款前切換券 A → B | 舊 reserve 釋放；新 reserve 在 B | ☐ |
| B3.5 | 選券 → 清除選擇 → 付款 | 無補貼；`platform_subsidy_amount=0` | ☐ |
| B3.6 | `payment_intent.canceled` 或 48h 過期 cron | 執行 `fn_release_merchant_order_coupon`；付款前錢包 `is_used` 仍為 false | ☐ |
| B3.7 | 交易 / 訂單詳情 UI | 買家實付顯示 `buyer_total_amount ?? total_amount` | ☐ |

### B4 — 出款（可選，Stripe 測試）

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| B4.1 | 含補貼訂單完成 T+7 凍結期 | `executeMerchantConnectPayout` 成功 | ☐ |
| B4.2 | 當 `merchant_payout > amount_received` | 單筆 transfer **不帶** `source_transaction`（平台餘額補差） | ☐ |

## Part C — 不在範圍內（勿當 bug 提報）

- Member C2C checkout 用券 → **Phase 5**
- `percent_off`、積分兌換商店

## Part D — Phase 2b（merchant_auth + auth 開關用券）

### D1 — 鑑定折扣券

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| D1.1 | 購買商戶 listing **含**鑑定（立即購買開 auth 或 `merchant_auth` 訂單） | Coupon picker 可見 | ☐ |
| D1.2 | 選折扣券（`requires_authentication: true` 或 `any`） | 摘要 **平台優惠**；買家實付減少 | ☐ |
| D1.3 | 完成 Stripe authorize（manual capture） | PI 金額 = `buyer_total_amount` | ☐ |
| D1.4 | Admin 鑑定 pass（single capture） | PI full capture = `buyer_total_amount` | ☐ |

### D2 — 鑑定免運券（v2 outbound leg）

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| D2.1 | 鑑定 checkout + 免運券 | 補貼 = min(outbound leg, 上限)；摘要顯示平台優惠 | ☐ |
| D2.2 | DB `merchant_orders` | `shipping_fee=0`；`inbound/outbound` 有值；`escrow_capture_model='single'`；`total_amount` = 四行 gross | ☐ |

### D3 — 限制與還原

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| D3.1 | `requires_authentication: false` 的券用於鑑定訂單 | 不符合資格 | ☐ |
| D3.2 | `merchant_direct` + 開啟 auth 開關 | Picker 顯示符合鑑定資格的券；切換時清空已選券（同 B3.1） | ☐ |
| D3.3 | 鑑定失敗 void（admin） | 券 `is_used` 清除；錢包可重用 | ☐ |

## Part E — Phase 3（限時搶券）

### E1 — Admin 檔期 CRUD

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| E1.1 | `/admin/campaigns` → **搶券檔期** tab | 列表顯示庫存 %、時間窗、狀態 | ☐ |
| E1.2 | 精靈：`flash_only` + Step 3 檔期 → **發布** | 模板 `active` + 檔期 `active` | ☐ |
| E1.3 | 表格暫停 / 恢復檔期 | 狀態更新；會員端列表同步 | ☐ |

### E2 — 會員搶券

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| E2.1 | `/profile/user/rewards` **限時搶券** 區塊 | 進行中檔期、倒數、庫存 | ☐ |
| E2.2 | `starts_at` 前搶券 | 按鈕 disabled / 顯示尚未開始 | ☐ |
| E2.3 | 活動時間內搶券 | Toast 成功；券入錢包 | ☐ |
| E2.4 | 庫存搶光 | 錯誤「優惠券已被搶光」 | ☐ |
| E2.5 | 同一 HKT 日第二次搶券 | 錯誤「你已達今日搶券上限」 | ☐ |
| E2.6 | `flash_only` 模板 | **不**出現在「可解鎖」tab | ☐ |

### E3 — Checkout 回歸（搶到的券）

| # | 步驟 | 預期結果 | 通過 |
|---|------|----------|------|
| E3.1 | 用搶到的券於商戶 checkout 結帳 | 沿用 Part B 流程（符合資格 + 補貼） | ☐ |

### 合併簽核關卡（Phase 4 前）

執行一次：Part A–B 回歸 → **Part D**（2b）→ **Part E**（3）→ `bunx tsc --noEmit`、`bun run lint`、`bun run build:ci` → E2E `platform-rewards-phase2.spec.ts` + `platform-rewards-phase3.spec.ts`。

## 簽核

| 角色 | 姓名 | 日期 | 備註 |
|------|------|------|------|
| QA | Partner | 2026-08 | Phase 1–2 已通過 |
| Frontend | | | |
| Backend | | | |

## 問題紀錄

| ID | 區域 | 重現步驟 | 預期 | 實際 | 嚴重度 |
|----|------|----------|------|------|--------|
| | | | | | |
