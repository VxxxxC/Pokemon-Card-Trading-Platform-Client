# Email notifications — manual test checklist

> **Scope:** Phase 1–2 app transactional + Supabase Auth emails  
> **SSOT:** [email-notifications-ssot.md](../../email-notifications-ssot.md) · **Backend:** [backend.md](./backend.md)  
> **Automated gate（先跑）：** `bun run test:email:phase1` · `bun run test:email:phase2`  
> **Registry：** `email-phase1-registry.ts` · `email-phase2-registry.ts`

---

## 0. 開測前（一次過）

### Env

- [ ] `RESEND_API_KEY`（worker 寄信）
- [ ] `RESEND_FROM_EMAIL` 或預設 `Cardvault HK <noreply@notify.cardvaulthk.com>`
- [ ] `CRON_SECRET`（cron Bearer）
- [ ] `SUPABASE_SERVICE_ROLE_KEY`（outbox + auth email lookup）
- [ ] `NEXT_PUBLIC_SITE_URL` = 實際瀏覽 URL（建議 dev：`http://127.0.0.1:3000`）

### Supabase Dashboard

- [ ] **Confirm email** ON（Authentication → Providers → Email）
- [ ] **Site URL：** `http://127.0.0.1:3000`（唔用 `0.0.0.0`）
- [ ] **Redirect URLs：** `http://127.0.0.1:3000/auth/callback` · `http://localhost:3000/auth/callback`
- [ ] **SMTP：** `noreply@notify.cardvaulthk.com` via Resend；模板已貼（見 [supabase-auth-templates.md](../../email/supabase-auth-templates.md)）

### 本地瀏覽

- [ ] 只用 **`http://127.0.0.1:3000`** 開站（避免 auth cookie / redirect loop）
- [ ] `bun run dev` 已重啟（proxy / callback 改動後）

### 測試帳號（建議）

| 角色 | 用途 |
|------|------|
| Buyer | 出價、付款、確認收貨 |
| Merchant seller | 接受/拒絕 offer、發貨、商戶訂單 |
| Member seller | C2C 鑑定單取消/確認（如測 member flow） |
| 新信箱 | 註冊 confirm（`E-ACC-01`） |

### 自動 gate（必跑，代替逐 template 肉眼 check）

```bash
bun run test:email:phase1
```

- [ ] 全綠（template render + outbox insert mock）

---

## 1. 共用：查 outbox + 跑 worker

### SQL — 最近 outbox

```sql
SELECT id, event_id, template_key, to_email, status, attempts,
       created_at, sent_at, last_error
FROM notification_email_outbox
ORDER BY created_at DESC
LIMIT 30;
```

### SQL — 按 event 篩選

```sql
SELECT event_id, to_email, status, idempotency_key, created_at
FROM notification_email_outbox
WHERE event_id = 'E-OFF-01'  -- 改成目標 event
ORDER BY created_at DESC;
```

### 手動觸發 worker

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3000/api/cron/process-email-outbox"
```

- [ ] 回傳 `success` / `sent` > 0
- [ ] Resend Dashboard（`notify.cardvaulthk.com`）有對應 send
- [ ] outbox `status = sent`（或 `dead` 時查 `last_error`）

---

## 2. Supabase Auth（唔經 app outbox）

| ID | 事件 | 步驟 | 驗證 |
|----|------|------|------|
| E-ACC-01 | 註冊驗證 | 新信箱註冊 → 收 confirm 信 | 連結格式 `/auth/callback?token_hash=...&type=signup`；點擊後登入成功 |
| E-ACC-03 | 重設密碼 | `/auth/forgot-password`（**未登入**） | 收 recovery 信 → 設新密碼 → 可登入 |
| — | — | 已登入改密碼走 `/auth/reset-password` | 唔發 recovery 信 |

- [ ] E-ACC-01 通過
- [ ] E-ACC-03 通過

---

## 3. App transactional — Phase 1

> 每項：觸發 flow → 查 outbox 有 **正確 `event_id` + `to_email`** → 跑 worker → 收件 / Resend log  
> 雙人 email（買家+賣家）要各有一 row。

### Account（Resend outbox）

| ID | 觸發 | 操作 | Outbox 預期 |
|----|------|------|-------------|
| E-ACC-04 | 密碼已變更 | 完成 forgot-password 設密碼 **或** 設定頁改密碼 | 1 row → 該用戶 email |

- [ ] E-ACC-04

### Offers

| ID | 觸發 | 操作 | Outbox 預期 |
|----|------|------|-------------|
| E-OFF-01 | 新叫價 | Buyer 對 active listing 出價 | Seller：`E-OFF-01` |
| E-OFF-02 | 修改出價 | Buyer 修改 pending offer 價格 | Seller：`E-OFF-02` |
| E-OFF-03 | 接受出價 | Seller accept offer | Buyer：`E-OFF-03` |
| E-OFF-04 | 拒絕出價 | Seller reject offer | Buyer：`E-OFF-04` |
| E-OFF-06 | 立即購買 | Buyer buy now | Seller：`E-OFF-06` |

- [ ] E-OFF-01
- [ ] E-OFF-02
- [ ] E-OFF-03
- [ ] E-OFF-04
- [ ] E-OFF-06

**建議順序（一條 listing）：** 出價 → 改價 →（另開 listing）拒絕 →（另開）接受 → 付款；或 buy now 獨立測。

### Orders — 付款

| ID | 觸發 | 操作 | Outbox 預期 |
|----|------|------|-------------|
| E-ORD-01 | 付款成功 | 商戶直購/accept 後 Stripe 付款成功（webhook） | Buyer + Seller：`E-ORD-01` |
| E-ORD-02 | 待付款逾時 | `pending_payment` 商戶單過 48h **或** staging 觸發 cron | Buyer + Seller：`E-ORD-02` |

- [ ] E-ORD-01（需 Stripe webhook / test 卡）
- [ ] E-ORD-02（可 `GET /api/cron/expire-merchant-pending-payment`）

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" \
  "http://127.0.0.1:3000/api/cron/expire-merchant-pending-payment"
```

### Orders — 履約

| ID | 觸發 | 操作 | Outbox 預期 |
|----|------|------|-------------|
| E-ORD-04 | 已發貨 | Merchant **非鑑定** SF 單：`submitMerchantDirectFulfillment` | Buyer：`E-ORD-04` |
| E-ORD-05 | 買家確認收貨 | Buyer `completeMerchantOrder` **或** member `confirmBuyerReceived` | Seller：`E-ORD-05` |
| E-ORD-03 | 訂單取消 | Seller `cancelMemberOrder` **或** merchant `cancelMerchantAuthOrder` | Buyer + Seller：`E-ORD-03` |

- [ ] E-ORD-04（需已付款、非 meetup、非鑑定直發）
- [ ] E-ORD-05
- [ ] E-ORD-03

---

## 3b. Phase 2 — mod / payout / grading / offer expired

| ID | 觸發 | 操作 | Outbox 預期 |
|----|------|------|-------------|
| E-MOD-02 | 舉報結案 | Admin `resolveAdminModerationCase`（`notifyReporter` 預設 true） | 每位 reporter：`E-MOD-02` |
| E-PAY-02 | Connect 撥款成功 | Cron `merchant-connect-payout-ready` 或 admin payout | Merchant：`E-PAY-02` |
| E-GRD-C2C-01 | C2C 鑑定已付款 | Member auth Stripe webhook → custody | Seller：`E-GRD-C2C-01` |
| E-GRD-C2C-05 | 鑑定通過出庫 | Admin grading outbound（member） | Buyer + Seller：`E-GRD-C2C-05` |
| E-GRD-C2C-06 | 鑑定失敗 | Admin `adminFailGradingAndRefund`（member） | Buyer + Seller：`E-GRD-C2C-06` |
| E-GRD-C2C-07 | 鑑定失敗退款 | Grading fail finalize（saga / webhook） | Buyer：`E-GRD-C2C-07` |
| E-GRD-B2C-02 | 商戶鑑定已付款 | Merchant auth webhook `payment_held` | Merchant：`E-GRD-B2C-02` |
| E-GRD-B2C-05/06 | 商戶鑑定出庫/失敗 | Admin grading outbound / fail（merchant） | 同 C2C 對應 |
| E-OFF-05 | 出價失效 | Accept offer / buy now / 下架 listing | 其他 pending buyer：`E-OFF-05` |

- [ ] E-MOD-02
- [ ] E-PAY-02
- [ ] E-GRD-C2C-01 / 05 / 06 / 07
- [ ] E-GRD-B2C-02 / 05 / 06
- [ ] E-OFF-05

---

## 3c. Phase 3 — refunds / KYC / sanctions / grading P1 / B2C

| ID | 觸發 | 操作 | Outbox 預期 |
|----|------|------|-------------|
| E-REF-01 | 仲裁退款批准 | Admin resolve + `orderRefundPrepared` | Buyer：`E-REF-01` |
| E-REF-02 | Stripe refund 完成 | Moderation / 售後 refund webhook | Buyer：`E-REF-02`（skip `auth_grading_*` metadata） |
| E-MCH-01 | KYC 提交 | `submitMerchantKycApplication` | Applicant：`E-MCH-01` |
| E-MCH-02/03 | KYC 審核 | Admin `reviewKycApplication` | Applicant：`E-MCH-02` / `E-MCH-03` |
| E-MCH-05 | Connect 開通 | Stripe `account.updated` webhook | Merchant：`E-MCH-05` |
| E-MOD-01 | 舉報提交 | `submitUserReport` | Reporter：`E-MOD-01` |
| E-MOD-03/04 | 舉報成立 + 制裁 | Resolve `upheld` + `freeze_payout` | Subject：`E-MOD-03` / `E-MOD-04` |
| E-ACC-06/07 | 停權 / 封禁 | Resolve sanction `suspend` / `ban` | Subject：`E-ACC-06` / `E-ACC-07` |
| E-PAY-03 | Connect 撥款失敗 | `executeMerchantConnectPayout` failure | Merchant：`E-PAY-03` |
| E-PAY-04 | Member FPS ready | Cron `member-fps-payout-ready` | Seller：`E-PAY-04` |
| E-PAY-05 | 商戶追償 | Merchant grading fail | Merchant：`E-PAY-05` |
| E-GRD-C2C-02/03 | 入庫物流 / intake | `submitInboundTracking` / admin intake confirm | Buyer (+ seller intake) |
| E-GRD-C2C-08/09/10 | 賣家寄回 / 買家確認 / FPS 銷帳 | Admin seller return / buyer confirm / clear settlement | Seller |
| E-GRD-B2C-03/04 | 商戶入庫 | `submitMerchantLogistics` / admin intake | Buyer (+ merchant intake) |
| E-GRD-B2C-07/08 | 鑑定失敗結算 / 買家確認 | Admin fail / `completeMerchantOrder` (auth) | Merchant |
| E-ORD-06 | 訂單完成 | Buyer complete / confirm received | Buyer：`E-ORD-06` |
| E-ORD-B2C-01/02/03 | B2C 履約 | Payment / ship / Connect payout | Merchant / Buyer |

```bash
bun run test:email:phase3
```

- [ ] Phase 3 gate 全綠
- [ ] 抽樣 2–3 條真 flow outbox + worker

---

## 4. 極簡 smoke（時間唔夠時）

只做以下 **4 步**，其餘靠 `bun run test:email:phase1`：

1. [ ] 新信箱 **E-ACC-01** confirm link 可登入
2. [ ] **E-OFF-01** 叫價 → outbox + worker → 收信
3. [ ] **E-ORD-01** 付款成功 → buyer+seller outbox（Stripe test）
4. [ ] **E-ACC-03** forgot password 一輪

---

## 5. 常見問題

| 現象 | 檢查 |
|------|------|
| 無 outbox row | action 是否 success；`createAdminClient` / service role；console `[offer-emails]` / `[order-emails]` |
| outbox `pending` 唔寄 | 跑 `process-email-outbox`；`RESEND_API_KEY` |
| `auth_callback` / redirect loop | Site URL、`127.0.0.1`、模板用 `token_hash` |
| 重複信 | 查 `idempotency_key` 是否重觸發；webhook 重送 |
| Auth 信樣式唔對 | Dashboard 重新貼 `supabase/templates/auth/*.html` |

---

## 6. Sign-off

| 項目 | 日期 | 測試人 |
|------|------|--------|
| `bun run test:email:phase1` 全綠 | | |
| `bun run test:email:phase2` 全綠 | | |
| `bun run test:email:phase3` 全綠 | | |
| Supabase Auth E-ACC-01 / 03 | | |
| App Phase 1 outbox（11 events） | | |
| Worker + Resend 真寄信抽樣 | | |

**備註 / 失敗 event ID：**

```
（填寫）
```
