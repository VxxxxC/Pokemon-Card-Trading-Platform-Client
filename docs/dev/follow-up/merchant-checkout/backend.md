# Merchant Checkout — 平台 Stripe 收款（Payment Milestone 1）

> B2C 商戶訂單真實收款：買家全額付款 → 資金 100% 入**平台** Stripe 帳戶託管 → webhook 確認後 `payment_held`。
> 撥款給商戶（`transfers.create`）與平台佣金屬 **Milestone 2**，本階段刻意唔用 `application_fee_amount` / `transfer_data`。

## 1. 託管狀態機（本階段新增前置狀態）

```
pending_payment ──▶ payment_held ──▶ authenticating ──▶ authenticated ──▶ completed_and_transferred
   （訂單成立         （Stripe 收款              …                              （Milestone 2 才真正
    未付款）           確認、資金託管）                                            transfer 給商戶）
```

- 訂單成立（接受出價 / 立即購買）→ `pending_payment`
- `payment_intent.succeeded` webhook → `payment_held`
- `rpc_complete_merchant_order` 的 allowed-from **不含** `pending_payment`，未付款無法確認收貨
- `getMerchantSellerActionFlags().canSubmitLogistics` 仍只認 `payment_held`，未收款不可出貨

## 2. Migrations

| 檔案 | 內容 |
|------|------|
| `20260729100000_escrow_state_pending_payment.sql` | `escrow_state` 新增 `pending_payment`（PostgreSQL 不允許同一 transaction 內新增並使用 enum 值，故單獨一檔） |
| `20260729110000_merchant_order_stripe_payment.sql` | `merchant_orders` 金額明細欄位；`rpc_accept_offer` merchant 分支改 `pending_payment`；新 `rpc_buy_now_merchant_listing`；新 `rpc_mark_merchant_order_paid` |
| `20260729120000_merchant_order_payment_prepare.sql` | `fn_merchant_checkout_shipping_fee` / `fn_merchant_checkout_auth_fee`；`rpc_prepare_merchant_order_payment`；`rpc_attach_merchant_order_payment_intent` |
| `20260729130000_merchant_trading_pending_payment_facets.sql` | `fn_merchant_order_is_open` 納入 `pending_payment`；新 `fn_merchant_order_is_payment_stage`；重建 `search_merchant_trading_orders` facets |

### `merchant_orders` 新欄位

| 欄位 | 說明 |
|------|------|
| `item_subtotal` | 商品成交價（= `final_price`） |
| `shipping_fee` | 運費（SF `30` / 面交 `0`），`NOT NULL DEFAULT 0` |
| `auth_fee` | 鑑定費（`150` / `0`），`NOT NULL DEFAULT 0` |
| `shipping_method` | `'sf'` \| `'meetup'` |
| `total_amount` | 託管總額 = 三者之和 |
| `paid_at` | webhook 確認收款時間 |
| `stripe_payment_intent_id` | 既有欄位，本階段開始實際使用（partial index） |

舊有 `payment_held` 訂單已回填 `item_subtotal` / `total_amount` = `final_price`。

## 3. RPC 契約

### `rpc_buy_now_merchant_listing(p_listing_id, p_buyer_id, p_use_auth)`
`SECURITY DEFINER` · `authenticated`。立即購買 = 以賣家開價建立 `offers`（`status='accepted'`）+ `merchant_orders`（`pending_payment`）+ 鎖 listing `inactive` + chat `SYSTEM_OFFER_ACCEPTED`。
Fail-closed：`auth.uid() = p_buyer_id`、listing 必須 `active` + `seller_persona='merchant'`、非自售、鑑定加購需賣家開放。
回傳 `{ order, order_kind: 'merchant', offer_id, message_id }`。

### `rpc_prepare_merchant_order_payment(p_order_id, p_shipping_method, p_use_auth)`
`SECURITY DEFINER` · `authenticated`。**DB 為金額真理源**：由 SQL 常數算運費 / 鑑定費並寫入訂單，避免 client 或 action 傳入被篡改的總額。
Fail-closed：`auth.uid() = buyer_id`、必須 `pending_payment`、`p_shipping_method ∈ ('sf','meetup')`、鑑定加購需 listing 開放。
回傳 `{ order_id, merchant_id, item_subtotal, shipping_fee, auth_fee, total_amount, shipping_method, stripe_payment_intent_id }`。

### `rpc_attach_merchant_order_payment_intent(p_order_id, p_payment_intent_id)`
`SECURITY DEFINER` · `authenticated`。綁定 PaymentIntent（買家本人 + `pending_payment`）。

### `rpc_mark_merchant_order_paid(p_order_id, p_payment_intent_id, p_amounts jsonb)`
`SECURITY DEFINER` · **只授權 `service_role`**（webhook 專用）。
- 只允許 `pending_payment → payment_held`；已處理過回 `{ success: true, already_applied: true }`（webhook 重放安全）
- 訂單已綁定不同 PI 會 raise，攔截錯誤入帳
- 寫 `paid_at` + 金額明細（`p_amounts` 缺欄位則保留 DB 現值）
- Insert `merchant_ledgers`（`transaction_type='escrow_payment'`，同一訂單只插一次）

> `merchant_orders` 對 `authenticated` 只開放 `SELECT`（`merchant_orders_participant_read`），所以結帳期間所有寫入都經上述 RPC，唔用 service-role client。

## 4. Server Actions — `app/actions/merchant-checkout.ts`

| Action | 契約 |
|--------|------|
| `buyNowMerchantListing(listingId, useAuth?)` | `{ success: true, data: { orderId, orderNumber, checkoutHref } }`。先驗 listing 為 merchant + `isMerchantPayoutReady()`，再調 `rpc_buy_now_merchant_listing` |
| `loadMerchantCheckoutOrder(orderIdOrNumber)` | 結帳頁快照：金額、`isPayable`、`shippingMethod`、`listingAcceptsAuthentication`、商戶與商品資料 |
| `createMerchantOrderPaymentIntent(orderIdOrNumber, { shippingMethod, useAuth })` | `{ clientSecret, publishableKey, itemSubtotal, shippingFee, authFee, totalAmount }` |
| `getMerchantCheckoutPaymentStatus(orderIdOrNumber)` | `{ escrowStatus, totalAmount, paidAt }`，成功頁輪詢用 |

`createMerchantOrderPaymentIntent` 流程：

1. `isSupabaseConfigured()` + Stripe 設定 guard（缺 env 回結構化錯誤，唔 throw）
2. `resolveMerchantOrderIdForBuyer` 解析 UUID / `ORD-*`，限買家本人
3. 訂單必須 `pending_payment`
4. **Fail-closed**：商戶 `kyc_records` 需通過 `isMerchantPayoutReady()`（verified + charges + payouts）
5. `rpc_prepare_merchant_order_payment` 取得權威金額
6. PaymentIntent：`amount = total_amount × 100`、`currency: 'hkd'`、`automatic_payment_methods`、**無** `application_fee_amount` / `transfer_data`
7. 已有 PI 則 retrieve：`succeeded` / `processing` 直接擋（防重複收款）；`canceled` 重新建立；其餘 `update` amount
8. `rpc_attach_merchant_order_payment_intent` 回寫 PI id

PaymentIntent `metadata`：`order_kind: 'merchant'`、`order_id`、`order_number`、`buyer_id`、`merchant_id`、`listing_id`、`item_subtotal`、`shipping_fee`、`auth_fee`、`total_amount`、`shipping_method`。

## 5. Webhook — `app/api/stripe/webhook/route.ts`

| 事件 | 動作 |
|------|------|
| `account.updated` | （既有）同步 `kyc_records.stripe_charges_enabled` / `stripe_payouts_enabled` |
| `payment_intent.succeeded` | `metadata.order_kind === 'merchant'` → `rpc_mark_merchant_order_paid`（service-role client） |
| `payment_intent.payment_failed` | 只 `console.warn` 留痕，訂單維持 `pending_payment` 讓買家重試 |

非 merchant metadata 的 PI 直接回 `200`，避免 Stripe 重試風暴。

## 6. Env

| 變數 | 用途 | 狀態 |
|------|------|------|
| `STRIPE_SECRET_KEY` | 伺服器 Stripe client | 已有 |
| `STRIPE_WEBHOOK_SECRET` | webhook 簽章驗證 | 已有 |
| **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** | 瀏覽器 `loadStripe()` | **需新增（`pk_test_…`）** |

> `lib/stripe.ts` 於 module 載入即 throw（缺 `STRIPE_SECRET_KEY`），所以有機會被 prerender 求值的模組要經 `lib/stripe/env.ts` 的 `getStripeClient()` lazy import。新 action 已遵守，`bun run build:ci` 通過。

## 7. 如何驗證

```bash
bunx supabase db push
bun run supabase:types
bunx tsc --noEmit && bun run lint && bun run build:ci
stripe listen --forward-to localhost:3000/api/stripe/webhook \
  --events account.updated,payment_intent.succeeded,payment_intent.payment_failed
```

驗收流程：

1. 商戶 KYC `verified` + Stripe Connect `charges_enabled` & `payouts_enabled`
2. 買家於 merchant listing 按「立即以 HK$… 購買」→ 訂單 `pending_payment`，listing 轉 `inactive`
3. `/checkout/[orderId]`：選配送 / 鑑定 → 建立 PaymentIntent → Payment Element 用 `4242 4242 4242 4242` 付款
4. Webhook 到達後訂單 `payment_held`、`paid_at` 有值、`merchant_ledgers` 出現一筆 `escrow_payment`
5. 未付款前商戶無「確認訂單並移交保管」CTA，買家無「確認完成」CTA
6. 重送同一 `payment_intent.succeeded` 事件 → `already_applied: true`，`merchant_ledgers` 不重複

### 本次已驗證

| 項目 | 結果 |
|------|------|
| `bunx supabase db push` | ✅ `20260729100000`–`20260729130000` 已同步 remote（`supabase migration list` local/remote 對齊） |
| `bunx tsc --noEmit` | ✅ 0 error |
| `bun run lint` | ✅ 0 error（13 個 warning 全為既有檔案，非本次新增） |
| `bun run build:ci` | ✅ 空 Supabase env 下通過，`/checkout/[id]` 與 `/checkout/[id]/success` 皆為 `ƒ` dynamic |
| `stripe trigger payment_intent.succeeded` | ✅ `200`；CLI fixture 無 `order_kind=merchant` metadata，走略過分支不報錯 |
| `stripe trigger payment_intent.payment_failed` | ✅ `200` 並留痕 `[stripe/webhook] payment_intent.payment_failed pi_… Your card was declined.` |

⚠️ **未能自動驗證**：真實買家付款 → `pending_payment → payment_held` 全鏈路，因 `.env` 仍缺
`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`（Payment Element 無法載入）。補上 key 後請按上面 1–6 步人手跑一次。

## 8. 已知缺口（Milestone 2）

- `pending_payment` 訂單**無過期 / 取消機制** → listing 會一直鎖住
- 未有 `transfers.create` 撥款、平台佣金、`platform_settings` 抽成率
- 優惠券未接後端，checkout 券選單暫時 disabled，總額不折扣
- 收件資料（電話 / 順豐櫃 / 面交備註 / 買家備註）仍只留前端 state，未有 DB 欄位
- C2C `member_orders` 仍走 mock pay
