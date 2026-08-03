# Partner Handoff — 鑑定 Multicapture E2E

**Date:** 2026-08-03  
**Branch:** `aaron-backend-wired`（pull 最新後再測）  
**Scope:** Member C2C 鑑定單 · Stripe manual PI + **online multicapture** · Admin 鑑定工作台  
**Backend:** Aaron track  
**Frontend / QA:** Partner  

---

## 一句話

Stripe 帳戶已開通 **online multicapture**；code 已接好 **authorize → 鑑定費 partial capture → 商品款 final capture**。請用 **新開鑑定單** + **真 Stripe test mode** 跑通下面主流程；舊測試單唔可用。

---

## 你要驗咩

| 優先 | 流程 | 路由 |
|------|------|------|
| **P0** | 買家付款 → 賣家入庫物流 → Admin 入庫 → Admin 鑑定通過 | Member C2C + `/admin/grading` |
| P1 | 鑑定失敗 void（只留 HK$150 鑑定費） | Admin fail + `fault_party` |
| P2 | 出庫物流 → 買家確認 → T+3 FPS | 見 [member-fps-payout e2e-checklist](../member-fps-payout/e2e-checklist.md) |
| P3 | Merchant B2C 鑑定單（同上 staged capture） | `MerchantOrderDetailView` 入庫 + `/admin/grading` |

**唔使驗：** Playwright `member-auth-escrow.spec.ts` 只係 mock 付款，**唔代表** multicapture 已通。

---

## 環境 checklist（開測前）

```bash
git pull origin aaron-backend-wired
bun install
bunx supabase db push
bun run supabase:types
```

### `.env.local` 必須有

| 變數 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | App + auth |
| `SUPABASE_SERVICE_ROLE_KEY` | SQL 抽查（Dashboard 亦可） |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 真 Payment Element |
| `STRIPE_SECRET_KEY` | PI / capture |
| `STRIPE_WEBHOOK_SECRET` | `authorized` 狀態同步 |
| `CRON_SECRET` | （可選）T+3 cron |

### 本機 webhook（擇一）

```bash
bun run dev
# 另一個 terminal：
bun run stripe:webhook:listen
```

無 webhook → 付款後 `payment_capture_status` 唔會變 `authorized` → Admin 入庫會報「尚未完成授權付款」。

### 測試帳號

| 角色 | 要求 |
|------|------|
| **Admin** | `profiles.role = 'admin'` |
| **Buyer** | 鑑定單付款 |
| **Seller** | 上架 `use_authentication = true`；入庫前可填 FPS（soft remind，唔 block） |

### 開單

1. Seller 上架鑑定 listing  
2. Buyer 出價（開鑑定）→ Seller accept → 產生 `member_orders`  
3. **記低 `order_id` / `order_number`**  
4. ⚠️ **必須係新單**——舊 PI 無 `request_multicapture` 會喺 pass 步 fail  

---

## 主流程（Member C2C · P0）

| # | 誰 | 做咩 | 預期 |
|---|-----|------|------|
| 1 | Buyer | `/checkout/{orderId}` 用 Stripe test 卡 `4242…` 付款 | PI `requires_capture`；**唔好**見「模擬付款」 |
| 2 | — | Webhook `payment_intent.amount_capturable_updated` | DB `escrow_status=custody`，`payment_capture_status=authorized` |
| 3 | Seller | 訂單詳情填入庫物流（快遞 + 單號） | `inbound_tracking_no` 有值 |
| 4 | Admin | `/admin/grading` → **待入庫** → 開單 → **確認入庫** | `payment_capture_status=auth_fee_captured`；Stripe **第一次** partial capture（鑑定費） |
| 5 | Admin | **鑑定中** → **鑑定通過** | `payment_capture_status=fully_captured`；Stripe **第二次** final capture（商品+運費） |
| 6 | Admin | **待出庫** → 填出庫物流 | `outbound_tracking_no` 有值 |
| 7 | Buyer | 確認收貨 | `buyer_confirmed_at` 有值；（可選）T+3 → FPS payout |

### SQL 抽查

```sql
SELECT id, order_number, escrow_status, payment_capture_status,
       stripe_payment_intent_id, inbound_tracking_no, outbound_tracking_no,
       auth_result, seller_payout_status
FROM member_orders
WHERE id = '<order_id>';
```

### Stripe Dashboard

同一 `payment_intent_id` 應見 **兩次 capture**（鑑定費 + 商品運費）。

---

## 常見踩坑

| 現象 | 原因 | 處理 |
|------|------|------|
| Checkout 見「模擬付款」 | 無 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 補 env 重開 dev |
| Admin 待入庫冇單 | 賣家未填入庫物流 | Seller 先 submit inbound |
| 入庫報「尚未完成授權付款」 | Webhook 未收到 | 開 `stripe:webhook:listen` 或檢查 Dashboard |
| Pass 報 `amount_capturable` 不足 | 舊單 / 無 multicapture PI | **開新鑑定單**重測 |
| 非 admin 開 `/admin/grading` | role 唔啱 | 將測試帳號設 `profiles.role=admin` |

---

## UI 驗收（可選 polish）

`/admin/grading` baseline 已 functional；詳見 [frontend.md](./frontend.md) acceptance checklist。樣式可之後 refine，**唔 block** P0 sign-off。

---

## 參考文件

| 文件 | 內容 |
|------|------|
| [backend.md](./backend.md) | Action contract、RPC、saga |
| [frontend.md](./frontend.md) | UI touchpoints、acceptance |
| [member-fps-payout/e2e-checklist.md](../member-fps-payout/e2e-checklist.md) | 完整 FPS + multicapture 手動清單 |
| [escrow-payment-policy.md](../../escrow-payment-policy.md) §8 | 政策 SSOT |

---

## Sign-off（回覆時請貼）

- [ ] P0 Member 主流程通過（含 Stripe 兩次 capture）
- [ ] （可選）P1 fail void 通過
- [ ] （可選）P2 FPS T+3 通過
- [ ] （可選）P3 Merchant B2C 鑑定通過

**測試單：** `order_number` = `________` · `payment_intent_id` = `________`  
**環境：** staging / local · Stripe test mode  
**問題：** （無則寫「無」）

---

## 短訊版（可直接 copy 俾 partner）

```
鑑定 multicapture 可以開測。

Branch: aaron-backend-wired
文件: docs/dev/follow-up/admin-grading/PARTNER_HANDOFF.md

前置: db push + Stripe 三個 key + webhook listen + admin 帳號
重要: 一定要新開鑑定單，唔好用舊單；要有真 Stripe 付款，唔係 mock

主流程: 買家付款 → 賣家入庫物流 → /admin/grading 入庫(capture $150) → 鑑定通過(capture 商品款) → 出庫 → 買家確認

驗收: DB payment_capture_status 由 authorized → auth_fee_captured → fully_captured；Stripe 同一 PI 兩次 capture

跑完請回 PARTNER_HANDOFF.md 底部 sign-off + order_number
```
