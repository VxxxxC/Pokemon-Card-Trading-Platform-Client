# 伺服器端 TODO 追蹤器（Stripe Connect 託管協定生命週期）

> 本文件為 HKCardVault **伺服器端邏輯單一真理源 (SSOT)**，涵蓋 Server Actions、Edge Functions 與 Stripe Connect Webhook 非同步事件迴圈。
>
> **核心鐵律：全額付訖 (100% Full Pay)**
> 資金於 `payment_intent.succeeded` 一次性 100% 鎖定託管，直至鑑定／收貨完成後釋放給賣家。**全程嚴禁訂金（deposit）或分段付款邏輯。**

---

## 1. 託管狀態機總覽 (Escrow Lifecycle)

對齊 `app/lib/types/trading.ts` 的 `OrderStatus` 與 `ESCROW_STEPS` 5 階水平步進器：

```
payment ──▶ custody ──▶ shipped ──▶ grading ──▶ released
  │            │            │            │           │
 付款       保管中        已發貨        鑑定中       已釋放
（全額）   （平台託管）  （上載單號） （可選增值）  （撥款賣家）
                                                     │
                                              cancelled（爭議退款）
```

B2C 商戶訂單（`merchant_orders.escrow_status`，DB enum `escrow_state`）實際落地為：

```
pending_payment ──▶ payment_held ──▶ authenticating ──▶ authenticated ──▶ completed_and_transferred
（訂單成立未付款）  （Stripe 收款確認、             …                        （⏳ Milestone 2 才真正
                     100% 平台託管）                                          transfer 給商戶）
```

> `pending_payment` 為 Payment Milestone 1 新增前置狀態：訂單於接受出價 / 立即購買時建立，買家於 `/checkout/[orderId]` 付款、webhook 確認後才轉 `payment_held`。未付款前商戶不可出貨、買家不可確認收貨。

| 狀態 | 觸發事件 | 伺服器動作 | 資金狀態 |
|------|----------|------------|----------|
| `payment` | 買家於 `/checkout/[id]` 確認 | 建立 `PaymentIntent`（全額 + 平台抽佣分賬意圖） | 待授權 |
| `custody` | Webhook `payment_intent.succeeded` | 建立 `orders`、鎖定 `listings='sold'` | 100% 鎖定託管 |
| `shipped` | 賣家 `shipOrder` 上載 `trackingNo` | 更新 `orders.tracking_no`、通知買家 | 持續託管 |
| `grading` | 買家啟用鑑定（`has_authentication`） | 第三方鑑定機構流程；HK$150 增值費已於結帳計入 | 持續託管 |
| `released` | 買家確認收貨 / 鑑定通過 | `transfer` 撥款賣家、扣平台佣金 | 釋放至賣家 |
| `cancelled` | 爭議仲裁 / 退款 | `refund` 全額退回買家、回滾 `listings` | 退回買家 |

---

## 2. Stripe Connect Express 入駐 (Onboarding)

### 2.1 建立 Express 帳戶並產生 Account Link

```ts
// app/api/stripe/connect/onboard/route.ts  [Server, MERCHANT only]
// 1. fail-closed 驗證 role === 'MERCHANT'
// 2. 若 profiles.stripe_account_id 為空 → stripe.accounts.create({ type: 'express', country: 'HK' })
// 3. 回寫 profiles.stripe_account_id
// 4. stripe.accountLinks.create({ account, refresh_url, return_url: '/api/stripe/connect/return' })
// 5. 回傳 { accountLinkUrl }
```

### 2.2 入駐回調與 Webhook 狀態同步

| Webhook 事件 | 伺服器動作 |
|--------------|------------|
| `account.updated` | 檢查 `charges_enabled && payouts_enabled` → `UPDATE profiles SET stripe_connected = true` |
| `capability.updated` | 記錄 capability 狀態，未就緒則維持 `stripe_connected = false`（fail-closed） |

> **守衛：** 只有 `stripe_connected = true` 的 MERCHANT 才可被指定為 `transfer` 收款方；否則交易撮合 fail-closed。

---

## 3. 付款與分賬 (PaymentIntent + Application Fee)

### 3.1 建立全額 PaymentIntent

> **實作決策（Payment Milestone 1，已落地）：** 託管語意為「**確認收貨先放款**」，因此收款採 **separate charge**——資金 100% 收入**平台**帳戶，**唔用** `application_fee_amount` / `transfer_data` 即時分賬。撥款給商戶改為訂單完成時以 `transfers.create` 執行（Milestone 2）。
>
> 實際程式：[`app/actions/merchant-checkout.ts`](../../app/actions/merchant-checkout.ts) · 詳細契約見 [merchant-checkout/backend.md](./follow-up/merchant-checkout/backend.md)。

```ts
// app/actions/merchant-checkout.ts → createMerchantOrderPaymentIntent  [Server, buyer only]
// 金額由 DB 權威計算：rpc_prepare_merchant_order_payment
// totalAmount = final_price + shippingFee(SF 30 / 面交 0) + authFee(150 / 0)
// 優惠券未接後端，Milestone 1 不折扣

await stripe.paymentIntents.create({
  amount: totalAmount * 100,                 // 轉為「仙」(cents)
  currency: 'hkd',
  capture_method: 'automatic',
  automatic_payment_methods: { enabled: true },
  // ⚠️ 刻意無 application_fee_amount / transfer_data：全額留喺平台託管
  metadata: {
    order_kind: 'merchant',
    order_id, order_number, buyer_id, merchant_id, listing_id,
    item_subtotal, shipping_fee, auth_fee, total_amount, shipping_method,
  },
});
```

**Fail-closed 前置條件：** 商戶 `kyc_records` 需通過 `isMerchantPayoutReady()`（`kyc_status='verified'` + `stripe_charges_enabled` + `stripe_payouts_enabled`），否則拒絕建立 PaymentIntent。

### 3.2 平台佣金與運費補貼分賬比例

| 項目 | 計算 | 說明 |
|------|------|------|
| 平台佣金 | `itemSubtotal × commission_rate` | `commission_rate` 由 `platform_settings` 動態設定 — ⏳ **Milestone 2 未落地** |
| 運費補貼 | 使用免運券時，由平台佣金扣除定額補貼給賣家 | 對齊 `requirement.md` 1.5 — ⏳ 未落地 |
| 鑑定費 | HK$150（`authFee`） | 可選增值服務，獨立行項，不入賣家分賬本金 |
| 賣家實收 | `totalAmount − 平台佣金` | 訂單完成時以 `transfers.create` 撥款 — ⏳ **Milestone 2** |

---

## 4. Webhook 事件迴圈 (`/api/webhooks/stripe`)

```ts
// 必須以 raw body 驗簽：stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)
// Next.js：route segment config 須關閉 body parser，讀取 raw stream
```

實際路徑為 `app/api/stripe/webhook/route.ts`。

| 事件 | 處理邏輯 | 狀態轉移 | 狀態 |
|------|----------|----------|------|
| `payment_intent.succeeded` | `metadata.order_kind === 'merchant'` → service-role 調 `rpc_mark_merchant_order_paid`（`FOR UPDATE` 行鎖，寫 `paid_at` + 金額明細 + `merchant_ledgers.escrow_payment`） | `pending_payment → payment_held` | ✅ 已落地 |
| `payment_intent.payment_failed` | `console.warn` 留痕，訂單維持待付款讓買家重試（listing 保持 `inactive`） | 維持 `pending_payment` | ✅ 已落地 |
| `account.updated` | 同步 `kyc_records.stripe_charges_enabled` / `stripe_payouts_enabled` | — | ✅ 已落地 |
| `charge.refunded` | `escrow_status='refunded'`、回滾 `listings='active'` | `* → refunded` | ⏳ 未落地 |
| `transfer.created` | 確認商戶撥款、寫入撥款流水 | `completed_and_transferred` 後留痕 | ⏳ Milestone 2 |

> **冪等性：** `rpc_mark_merchant_order_paid` 只允許 `pending_payment → payment_held`，重送同一事件回 `already_applied: true`；`merchant_ledgers` 以 `(order_id, transaction_type)` 存在性檢查防重複入帳。訂單已綁定另一個 PaymentIntent 時會 raise，攔截錯誤入帳。

---

## 5. 結算與釋放 (Settlement & Release)

```ts
// [Server Action] confirmReceipt / releaseEscrow  [買家本人 or 鑑定通過]
// 1. 驗證 escrow_status IN ('shipped', 'grading')
// 2. UPDATE orders SET escrow_status = 'released'
// 3. 若使用 transfer_data 即時分賬，款項已在賣家 Connected Account；此步確認解除爭議窗口
// 4. 觸發雙向評分邀請、累加賣家 totalSalesCount
```

---

## 6. 非 Stripe 的 Server Actions / Edge Functions

### 6.1 身份驗證
| 檔案 | 動作 |
|------|------|
| `app/auth/AuthForm.tsx` | 接駁真實 `supabase.auth.signUp()` / `signInWithPassword()`，替換 `setTimeout` mock |
| `app/components/profile/LogoutModal.tsx` | `supabase.auth.signOut()` + 導向 `/auth` |
| `middleware.ts` | 攔截受保護路由；`/admin` 強制 `role === 'ADMIN'`，fail-closed 重導 |

### 6.2 上架與相片
| 檔案 | 動作 |
|------|------|
| `app/components/merchant/NewListingForm.tsx` | `supabase.storage.from('listing-images').upload()`；6 槽 `{url,remark}[]`，active 強制 ≥ 2 張 |
| `app/components/shared/AddAssetModal.tsx` | 收藏（hobby）寫入 `user_collections`；上架（merch）寫入 `listings`，帶 `item_type` / `condition` / `grader` |
| Edge Function | 圖片轉 WebP、壓縮、上載 CDN |

### 6.3 簽到與遊戲化
| 檔案 | 動作 |
|------|------|
| `app/components/rewards/CheckInCard.tsx` | 呼叫 `execute_daily_check_in()` RPC；伺服器時區 `Asia/Hong_Kong`，拒絕客戶端時間戳 |
| `app/components/home/PortfolioRewards.tsx` | 身家估值 Edge Function：聚合 `user_collections` × 市價 API（HKD） |

### 6.4 議價聊天
| 檔案 | 動作 |
|------|------|
| `app/store/useHkCardVaultStore.ts` | `injectOffer` / `respondOffer` 寫入 `messages`（`type='special_transaction'`）；確定性房號雙向對稱 |
| `app/components/chat/SpecialTransactionMessage.tsx` | `accept` 後伺服器更新 `offer_status` 並回傳直購跳轉 `/checkout/[listingId]` |

### 6.5 管理後台
| 檔案 | 動作 |
|------|------|
| `app/admin/approvals/page.tsx` | `reviewKyc`：核准時 `UPDATE profiles SET role='MERCHANT', kyc_status='approved'`、發信 |
| `app/admin/users/page.tsx` | `toggleBan`：`UPDATE profiles SET is_banned`、撤銷 session |
| `app/admin/settings/page.tsx` | `upsertPlatformSetting`（佣金率、運費補貼）、`triggerScraperJob`（Mercari/SKUNK） |

---

## 7. 自動通知 (Email & Push)

對齊 `requirement.md` 1.8，於下列關鍵時刻觸發專業郵件與手機推播：

| 觸發點 | 收件人 | 通道 |
|--------|--------|------|
| `payment_intent.succeeded` | 買家 + 賣家 | Email + Push |
| `shipOrder`（上載單號） | 買家 | Email + Push |
| 出價被超越 / 收到新議價 | 相關方 | Push |
| `released` 撥款完成 | 賣家 | Email |
| KYC 審核結果 | 申請人 | Email |

---

## 8. 待辦事項清單（Server Migration TODO）

- [ ] 建立 `/api/webhooks/stripe` route，關閉 body parser、實作 raw body 驗簽。
- [ ] 實作 Express 入駐 `onboard` / `return` / `login-link` 三端點（MERCHANT fail-closed）。
- [ ] 實作 `create-payment-intent`，套用全額 `transfer_data` 分賬與 `application_fee_amount`。
- [ ] 以 `stripe_event_id` UNIQUE 實現 Webhook 冪等去重。
- [ ] 接駁 `supabase.auth` 取代所有 `setTimeout` mock 流程。
- [ ] 部署 `middleware.ts` 角色守衛（`/admin` 僅 ADMIN）。
- [ ] 部署簽到 RPC、身家估值 Edge Function、圖片 WebP 轉檔 Edge Function。
- [ ] 串接交易關鍵節點的 Email / Push 通知管線。
