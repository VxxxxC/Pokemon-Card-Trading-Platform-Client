# Member FPS Pipeline — E2E Checklist

> **適用時機：** Stripe test mode 已開通 **online multicapture**；Member 鑑定單可走 **manual capture + multicapture** 全流程。  
> **主流程入口：** [admin-grading PARTNER_HANDOFF.md](../admin-grading/PARTNER_HANDOFF.md)（P0 鑑定 capture）· 本文件涵蓋 FPS T+3 後段。  
> **涵蓋範圍：** Phase 1A（T+3 hold）· 1B（cron → `payout_requests`）· 1C（FPS 姓名 + ID）· Admin FPS 表。  
> **相關文件：** [backend.md](./backend.md) · [frontend.md](./frontend.md) · [member-auth-checkout/backend.md](../member-auth-checkout/backend.md) · [admin-grading/backend.md](../admin-grading/backend.md) · [escrow-payment-policy.md](../../escrow-payment-policy.md) §8.1

---

## 0. 前置條件（測試開始前）

### 環境與 migration

- [ ] `bunx supabase db push` 已套用：
  - `20260801120000_member_fps_payout.sql`
  - `20260802120000_member_fps_payout_pipeline.sql`
  - `20260803120200_profiles_fps_name.sql`
- [ ] `.env.local` 已設定：
  - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET`
  - `CRON_SECRET`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] 本機 webhook（擇一）：
  - `bun run stripe:webhook:listen`（轉發至 `localhost`），或
  - Stripe Dashboard 已指向 staging webhook URL
- [ ] `bun run dev` 可正常啟動

### Stripe 設定

- [ ] 使用 **test mode** 卡號（例：`4242 4242 4242 4242`）
- [ ] PaymentIntent 建立時含 `capture_method: manual` + `request_multicapture: if_available`（見 [member-auth-checkout](../member-auth-checkout/backend.md)）
- [ ] **重要：** 舊測試單若 PI 無 multicapture，鑑定 intake 後餘額可能已釋放 → goods capture 會失敗；請開 **新鑑定單** 測 E2E

### 測試帳號

| 角色 | 用途 |
|------|------|
| **Seller A** | 有完整 FPS（姓名 + ID） |
| **Seller B** | 無 FPS（測 `pending` + `PENDING_FPS` / `PENDING_FPS_NAME`） |
| **Buyer** | 付款、確認收貨 |
| **Admin** | `/admin/grading` 鑑定操作、`/admin/payouts` FPS 銷帳 |

### 建立測試訂單

- [ ] 上架鑑定 listing（`use_authentication = true`）
- [ ] Buyer 出價 / 立即購買並接受 → 產生 `member_orders` 鑑定單
- [ ] 記低 `order_id` / `order_number` 供 SQL 對照

---

## 1. Phase 1C — FPS 收集（可獨立於 Stripe 先驗，建議仍放 E2E 開頭）

### Seller B（無 FPS）

- [ ] 開 `/profile/user/orderDetail/{orderId}`（賣家視角）
- [ ] 見 **Dialog**：收款人姓名 + FPS ID／電話／電郵
- [ ] 見 **Banner**：「請補充轉數快收款人姓名及 ID…」
- [ ] 撳「稍後再說」→ 同 session 再入唔會再彈（`sessionStorage`）
- [ ] **未填 FPS 仍可**提交入庫物流單號（soft remind，唔 block）

### Seller A（填寫 FPS）

- [ ] Dialog 填 **姓名 + ID** → 儲存成功
- [ ] `/profile/user/settings` 兩欄有值
- [ ] 返回訂單詳情 → banner / dialog 消失
- [ ] 只填 ID 唔填姓名 → 儲存被拒（validation）

---

## 2. Stripe 付款 → 託管（Member auth checkout）

**Buyer** 於訂單詳情或 checkout 完成 Stripe 付款。

- [ ] UI 顯示 `MemberAuthStripePaymentPanel`（有 publishable key 時）
- [ ] 付款成功後訂單 `escrow_status` → `custody`
- [ ] `payment_capture_status` → `authorized`（未 capture 商品款）
- [ ] Webhook：`payment_intent.amount_capturable_updated` → `rpc_mark_member_auth_order_authorized`

**SQL 抽查：**

```sql
SELECT id, escrow_status, status, payment_capture_status, stripe_payment_intent_id
FROM member_orders WHERE id = '<order_id>';
```

---

## 3. 物流與 Admin 鑑定（→ `fully_captured`）

### 3.1 賣家入庫

- [ ] Seller 提交 **入庫順豐單號** → `rpc_submit_inbound_tracking`

### 3.2 Admin 鑑定工作台 `/admin/grading`

依序操作（Member C2C 單）：

| 步驟 | Admin 動作 | 預期 DB |
|------|------------|---------|
| 1 | **確認收貨（intake）** | `auth_fee_captured`；`custody` → `grading` |
| 2 | **鑑定通過** | `fully_captured`；`grading` → `shipped` |
| 3 | **上載代發貨單號** | `outbound_tracking_no` 非空 |

- [ ] Intake 後 Stripe：partial capture（鑑定費 HK$150，`final_capture: false`）
- [ ] Pass 後 Stripe：goods capture（`final_capture: true`）
- [ ] `auth_result = 'passed'`

**SQL 抽查（買家確認收貨前必須滿足）：**

```sql
SELECT escrow_status, auth_result, outbound_tracking_no, payment_capture_status
FROM member_orders WHERE id = '<order_id>';
-- escrow_status = 'shipped'
-- auth_result = 'passed'
-- outbound_tracking_no IS NOT NULL
-- payment_capture_status = 'fully_captured'
```

> ⚠️ 勿用 Dev「一鍵 Mock 全流程」代替以上步驟做 FPS E2E——mock 會跳過 Stripe capture 同 `rpc_confirm_buyer_received`。

---

## 4. Phase 1A — 買家確認收貨（T+3 hold）

**Buyer** 開同一訂單 → 應見「確認收貨」按鈕（需 `fully_captured`）。

- [ ] 撳 **確認收貨** → toast 成功
- [ ] 訂單 `status = completed`，`escrow_status = released`
- [ ] **尚未**出現 `payout_requests` row（1A 唔 insert）

**Seller** 訂單詳情：

- [ ] 撥款狀態顯示 **「款項保留中（T+3）」**
- [ ] 顯示買家確認時間、撥款解凍時間（約 +3 日）

**SQL 驗證：**

```sql
SELECT
  buyer_confirmed_at,
  payout_hold_until,
  seller_payout_status,
  status,
  escrow_status
FROM member_orders
WHERE id = '<order_id>';
```

| 欄位 | 預期 |
|------|------|
| `buyer_confirmed_at` | 非 NULL |
| `payout_hold_until` | ≈ `buyer_confirmed_at + 3 days` |
| `seller_payout_status` | `'held'` |

```sql
SELECT COUNT(*) FROM payout_requests WHERE order_id = '<order_id>';
-- 應為 0
```

---

## 5. Phase 1B — Cron 建立 `payout_requests`

### 5.1 等待 vs 快測

**正式路徑：** 等 `payout_hold_until` 自然到期（或等 hourly cron）。

**快測（僅 dev/staging）：**

```sql
UPDATE member_orders
SET payout_hold_until = now() - interval '1 hour'
WHERE id = '<order_id>';
```

### 5.2 手動觸發 cron

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "http://localhost:3000/api/cron/member-fps-payout-ready" | jq
```

- [ ] 回應 `{ "success": true, "scanned": >=1, "inserted": >=1, "errors": [] }`
- [ ] 重複執行 → `inserted: 0`（idempotent，`ON CONFLICT DO NOTHING`）

### 5.3 情境 A — Seller A（已有 FPS 姓名 + ID）

```sql
SELECT
  pr.amount,
  pr.fps_id_snapshot,
  pr.fps_name_snapshot,
  pr.status,
  mo.seller_payout_status
FROM payout_requests pr
JOIN member_orders mo ON mo.id = pr.order_id
WHERE pr.order_id = '<order_id>';
```

| 欄位 | 預期 |
|------|------|
| `gross_payout_hkd` | `item_subtotal + inbound_shipping_fee` |
| `fps_transfer_fee_hkd` | `fn_platform_fps_manual_transfer_fee_hkd()` (default 0) |
| `amount` | `gross_payout_hkd - fps_transfer_fee_hkd` (net) |
| `fps_id_snapshot` | Seller A 的 `profiles.fps_id` |
| `fps_name_snapshot` | Seller A 的 `profiles.fps_name` |
| `pr.status` | `'ready'` |
| `seller_payout_status` | `'ready'` |

### 5.4 情境 B — Seller B（缺 FPS，用另一張單重跑 §1–§5）

- [ ] Cron 後 `payout_requests.status = 'pending'`
- [ ] `fps_id_snapshot = 'PENDING_FPS'` 和／或 `fps_name_snapshot = 'PENDING_FPS_NAME'`
- [ ] `member_orders.seller_payout_status` 仍為 `'ready'`（訂單側已進入出款隊列）

### 5.5 Seller 補 FPS 後（可選）

- [ ] Seller B 於設定補齊姓名 + ID
- [ ] **已建立**的 `payout_requests` snapshot **唔會自動更新**（設計如此；admin 以 snapshot 對帳）
- [ ] 新單 cron 應帶最新 profile 值

---

## 6. Admin FPS 表 `/admin/payouts`

- [ ] **Member FPS** tab 見 §5 產生嘅 **live row**（非僅 seed）
- [ ] 欄位：提現單號、訂單號、用戶名稱、金額、`FPS 收款人`、`FPS ID`、狀態、提交時間
- [ ] 搜尋：訂單號 / 提現單號 / FPS ID / **收款人姓名**
- [ ] `ready` / `pending` 單可標記 **processing → completed**（銷帳）
- [ ] CSV 導出包含收款人 + FPS ID 欄

---

## 7. 負向 / 邊界（建議抽測）

| # | 情境 | 預期 |
|---|------|------|
| N1 | `payout_hold_until` 未到期跑 cron | 該單 **不**入 `payout_requests` |
| N2 | `payment_capture_status != fully_captured` 時買家確認 | UI 無確認按鈕；RPC 拒絕 |
| N3 | 已有 `payout_requests` 再跑 cron | 不重複 insert |
| N4 | P2P 非鑑定單完成交易 | 無 FPS hold / 無 `payout_requests` |
| N5 | 鑑定失敗 void 後 | 無 `fully_captured` → 走唔到 §4–§5 |

---

## 8. 完成定義（Sign-off）

全部勾選即視為 **Member FPS Pipeline E2E 通過**：

- [ ] Stripe multicapture 全流程：authorized → auth_fee_captured → **fully_captured**
- [ ] 買家確認收貨 → `held` + T+3
- [ ] Cron → `payout_requests`（`gross_payout_hkd` = item + inbound；`amount` = net）
- [ ] 有 FPS：**ready** + 正確 snapshot；無 FPS：**pending** + `PENDING_*`
- [ ] Admin FPS tab 可 list / 搜尋 / 銷帳
- [ ] 1C：姓名 + ID dialog／設定／soft remind 行為正確

---

## 附錄 A — 常用 SQL

```sql
-- 訂單 FPS / 託管總覽
SELECT
  id,
  order_number,
  use_authentication,
  escrow_status,
  status,
  auth_result,
  payment_capture_status,
  refund_status,
  buyer_confirmed_at,
  payout_hold_until,
  seller_payout_status,
  final_price
FROM member_orders
WHERE id = '<order_id>';

-- 提現單
SELECT * FROM payout_requests WHERE order_id = '<order_id>';

-- 賣家 FPS profile
SELECT fps_id, fps_name FROM profiles WHERE id = '<seller_id>';
```

## 附錄 B — 本機無 Stripe 時可測範圍

| 可測 | 不可測（需 Stripe） |
|------|---------------------|
| §1 Phase 1C UI + settings | §2 真實付款 |
| Admin FPS tab（seed 資料） | §3 goods capture → `fully_captured` |
| | §4 買家確認收貨按鈕 |
| | §5–§6 live pipeline |

詳見 [frontend.md](./frontend.md) acceptance checklist。
