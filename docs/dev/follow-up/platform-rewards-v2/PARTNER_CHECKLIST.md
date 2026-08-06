# Partner Checklist — 平台獎勵 v2（人手 QA）

**對象：** Frontend / Partner  
**後端：** Aaron（actions、RPC、payout）  
**詳細步驟：** [QA_CHECKLIST.md](./QA_CHECKLIST.md) · E2E 覆蓋：[QA_MATRIX_RESULTS.md](./QA_MATRIX_RESULTS.md)

---

## 一句話

E2E 已覆蓋 **商戶 direct 結帳用券**、**搶券主流程**、**Stripe PI 對帳**、**Connect 出款補差**。Partner 只需補驗 **未自動化邊角** 同 **UI/鑑定路徑**。

---

## 開測前

- [ ] `bunx supabase db push`（含 `20260829120000` backdate RPC，供 E2E；人手測唔依賴）
- [ ] Admin + Member 測試帳；商戶 listing（順豐、可選鑑定）
- [ ] Stripe 測試模式

**後端自測（Partner 可跳過若綠燈）：**

```bash
bun run dev
bun run stripe:webhook:listen   # 另一終端
bun run test:e2e:rewards
bun run test:e2e:stripe-reconcile
```

---

## 唔使人手重測（E2E 已覆蓋）

| 區域 | 說明 |
|------|------|
| 免運 / 折扣券 direct checkout | phase2 B1、B2、B3.1/3.3–3.5 |
| merchant_auth + 券補貼 | phase2 B2b.1/2 |
| 搶券、每日上限、搶光、暫停/恢復 | phase3 C3.x、C3.8 |
| auto_grant `trade_count` | matrix M-G1–G3 |
| PI 金額 = `buyer_total_amount` | stripe-reconcile R1、phase2 B1 |
| 有補貼出款無 `source_transaction` | stripe-reconcile R2 |
| 無券出款綁 charge | stripe-reconcile R3 |

---

## P0 — 必須人手點（約 30 分鐘）

| # | 試咩 | 路由 / 操作 | 預期 |
|---|------|-------------|------|
| 1 | **取消付款釋放券** | checkout 選券 → 唔完成付款 / 取消 PI | 券 `is_used=false`，可再選 |
| 2 | **48h 過期釋放券** | 建立 `pending_payment` 訂單選券 → 等 cron 或手動觸發過期 | 同 #1 |
| 3 | **鑑定失敗還券** | 鑑定單 + 用券 → Admin 鑑定失敗 void | 券退回錢包可再用 |
| 4 | **訂單詳情實付** | 用券成交後開買家訂單詳情 | 顯示折後實付（`buyer_total_amount`） |
| 5 | **`event_once` 發放** | 觸發一種：完善資料 / 首次上架 / 註冊完成 | 券或積分按模板入帳 |

---

## P1 — 建議驗（鑑定 + Admin）

| # | 試咩 | 路由 | 預期 |
|---|------|------|------|
| 6 | **鑑定單 PI / capture** | merchant_auth checkout + 券 → Stripe Dashboard | authorize 金額 = `buyer_total_amount`；鑑定費 + 貨款 capture 正確 |
| 7 | **直發開 auth 帶券** | direct checkout 開鑑定開關並帶 coupon id | RPC/Toast 報錯（非法組合） |
| 8 | **非鑑定券用於鑑定單** | `requires_authentication: false` 券 + auth 訂單 | 不符合資格 |
| 9 | **Admin 精靈逐步** | `/admin/campaigns` 新增/編輯模板 | Step 1–3 預填、發布、限制欄位正確 |
| 10 | **簽到計劃儲存** | `/admin/campaigns?tab=check-in` | 改 7 日階梯 + completion bonus → 會員簽到生效 |

---

## P2 — 有時間再驗

| # | 試咩 | 備註 |
|---|------|------|
| 11 | 搶券 **未開始**（`starts_at` 前） | 按鈕 disabled / 文案 |
| 12 | 商戶角色 `trade_count` auto_grant | 買家路徑 E2E 有，商戶未單獨開 case |
| 13 | Admin 搶券檔期 **ROI tab** | 檔期 CRUD E2E 有；ROI 為 mock |
| 14 | 跨瀏覽器 / 手機 checkout 用券 | 純 UI smoke |

---

## 快速通過標準

- [ ] P0 五項全部 ✅  
- [ ] 鑑定用券路徑（P1 #6–8）至少跑通一單  
- [ ] Admin 簽到或精靈（P1 #9–10）至少各點一次  
- [ ] 無 console error、無錯誤 Toast  

---

## 問題回報

附：訂單 id、`user_rewards.id`、截圖、Stripe PI id（如有）。後端對照 [backend.md](./backend.md)。
