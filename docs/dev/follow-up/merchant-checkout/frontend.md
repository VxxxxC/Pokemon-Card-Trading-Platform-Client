# Merchant Checkout — 前端接駁（Payment Milestone 1）

> 後端契約見 [backend.md](./backend.md)。以下為已接駁的 UI 位置與仍需前端精修的項目。

## 1. 前置條件

`.env` 需新增（缺少時 checkout 會回「付款服務尚未設定」）：

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

已安裝：`@stripe/stripe-js`、`@stripe/react-stripe-js`（`bun add`）。

## 2. 已接駁檔案

| 檔案 | 改動 |
|------|------|
| `app/checkout/[id]/page.tsx` | `[id]` 現為**訂單 id / `ORD-*` 單號**（原本係商品 id）。移除 `MOCK_INVENTORY_DATABASE`，改 `loadMerchantCheckoutOrder()`；按鈕由 `setTimeout` 改為 `createMerchantOrderPaymentIntent()` → `<Elements>` + `<PaymentElement>` → `stripe.confirmPayment({ redirect: "if_required" })` |
| `app/checkout/[id]/success/page.tsx` | 改讀真訂單；webhook 為非同步，最多輪詢 8 次 × 2s，`pending_payment` 顯示「⏳ 付款處理中」，轉 `payment_held` 後顯示「🎉 交易成功設立」 |
| `app/components/transactions/ExecutionSlideOver.tsx` | 所有 listing「⚡ 立即購買」→ `buyNowListing()` → **開 chat**（付款由 Offer 卡 CTA 去 checkout） |
| `app/components/transactions/BuyNowConfirmDialog.tsx` | `BuyButton` 預設開確認框；「改為議價出價」才開 slide-over |
| `app/components/chat/OfferCard.tsx` | accepted 買家「前往付款」/「查看訂單」CTA |
| `app/components/user/UserOrderRow.tsx` | `dbOrderContext.pendingPayment` → 顯示「前往付款」CTA（去 `/checkout/[orderId]`）；同時**隱藏**「確認完成」CTA |
| `app/components/user/MemberOrderDetailView.tsx` | `order.pendingPayment` → 頂部待付款提示區塊 + 買家「前往付款」；未付款不顯示 P2P 完成流程 |
| `app/components/merchant/MerchantOrderDetailView.tsx` | `escrowStatus === "pending_payment"` → 「等待買家完成託管付款」提示；原「買家已完成全額付款 + 確認訂單並移交保管」改為只在真正 `payment_held` 顯示 |
| `app/components/merchant/MerchantOrderRow.tsx` | `OrderStatusBadge` 新增 `labelOverride`，pending_payment 顯示「待買家付款」 |
| `app/profile/user/(dashboard)/trading/UserTradingClient.tsx` | `order.pendingPayment` → 「待付款」badge；傳 `pendingPayment` 落 `dbOrderContext` |

## 3. 資料契約

`UserTradingOrder` / `MemberOrderDetail` 新增欄位：

```ts
pendingPayment: boolean; // B2C 商戶訂單尚未完成 Stripe 託管付款
```

`SaleOrder` 新增選填欄位：

```ts
statusLabelOverride?: string; // 託管步進器以外的細分狀態文案（例：待買家付款）
```

計價常數（UI 預覽用，**DB 為權威值**）：`lib/merchant-checkout/pricing.ts`
`SF_SHIPPING_FEE = 30`、`MEETUP_SHIPPING_FEE = 0`、`AUTHENTICATION_FEE = 150`。

## 4. 驗收清單

- [ ] `.env` 已加 `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] 點「立即購買」→ 確認框 → chat 開啟 + Offer 卡已接受（非直跳 checkout）
- [ ] Offer 卡「前往付款」→ `/checkout/[orderId]`，商品資料 / 賣家 / 價格為真實訂單值
- [ ] slide-over 內「立即購買」同樣開 chat（可從確認框「改為議價出價」進入 slide-over 後測）
- [ ] 切換順豐 / 面交、開關鑑定服務，總額同步（30 / 0、150 / 0）
- [ ] 按「鎖定資產並進入安全託管支付」後出現 Payment Element；`4242…` 測試卡付款成功
- [ ] 成功頁先顯示「付款處理中」，webhook 到達後自動轉「交易成功設立」
- [ ] `/profile/user/trading` 未付款訂單顯示「待付款」badge + 「前往付款」，**無**「確認完成」
- [ ] 商戶 `/profile/merchant/trading` 見「待買家付款」badge，訂單詳情**無**出貨 CTA
- [ ] 重新進入已付款訂單的 `/checkout/[id]`，顯示「已完成付款或已進入下一階段」且付款鍵 disabled

## 5. 待前端精修（樣式 / UX，後端唔會動）

- 「立即購買」CTA 目前用 outline 佔位樣式，與「發送叫價至聊天室」主鍵的視覺層級待調整
- `<PaymentElement>` 用 Stripe `appearance: { theme: "night", labels: "floating" }` 預設，未對齊 brand token
- 優惠券選單已 disabled（後端未接），placeholder 文案「優惠券功能即將開放（本次結帳暫不折扣）」待設計確認是否改為隱藏
- 收件電話 / 順豐櫃代碼 / 面交備註 / 買家備註仍只有前端 state，未持久化；如需入庫請與後端確認欄位
- 待付款訂單暫無過期倒數 UI（後端亦未有過期機制，Milestone 2）
