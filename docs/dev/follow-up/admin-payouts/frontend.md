# Admin Payouts — Frontend

> **Status:** Phase A 🟡 Partial (Merchant live + server pagination, FPS mock)  
> **Route:** `/admin/payouts`

## File layout

```
app/admin/payouts/
  page.tsx                          # SSR + admin guard
  AdminPayoutsClient.tsx            # tabs shell
  mock-data.ts                      # Phase A FPS mock + Stripe log mock
  components/
    PlatformBalanceSection.tsx      # Stripe balance + refresh
    MerchantConnectLedgerTab.tsx    # Merchant main table (server pagination)
    BlockingLoadingOverlay.tsx      # Full-screen blocking spinner for CSV export
    StripeLogPanel.tsx              # FPS payout mock only
    payouts-shared.tsx              # SortSelect, FilterChips
```

## Props (`AdminPayoutsClient`)

| Prop | Source |
|------|--------|
| `data` | `getAdminPayoutsPageData()` (Stripe balance only) |
| `loadError` | balance action error |
| `fpsBatchSchedule` | `getAdminFpsBatchSchedule()` |
| `initialMerchantPage` | `listAdminMerchantTransfers({ page: 1, pageSize: 10 })` |
| `merchantLoadError` | merchant list action error |

## Tab behaviour

### FPS 批次處理 (mock until Phase C)

- Withdrawal table: `mock-data.ts` `initialWithdrawals`
- Stripe Log: `MOCK_PAYOUT_LOGS` (38 rows)
- Banner: next Wednesday batch + cutoff from `fpsBatchSchedule`

### 商戶流水 (Stripe) — live

- Component: `MerchantConnectLedgerTab`
- Data: `listAdminMerchantTransfers` (SSR initial + client refetch on filter/page)
- **10 rows/page** server pagination
- Status filter chips: 全部 / 已成功 / 處理中 / 待撥款 / 已失敗 — each shows `statusCounts[key]` for current search/date scope
- Date range on `transferred_at`
- Columns include 訂單類型、卡價小計、佣金率、鑑定費、商戶實收 (Transfer)、撥款狀態（failed → tooltip `payout_error`）、對賬 ⚠、買家確認時間、PaymentIntent
- **Removed:** 帳戶餘額 column; Merchant tab Stripe Log panel
- CSV export: `listAdminMerchantTransfersForExport` with current filters (cap 2000); **blocking overlay** during export (`BlockingLoadingOverlay`)
- **Clickable cells** (all open in **new tab**):
  - 訂單號 → `/profile/merchant/orderDetail/{orderId}`
  - 商戶名稱 → `/marketplace/{merchantId}` (public storefront)
  - Stripe 流水號 (`tr_*`) → Stripe Connect Transfer Dashboard (new tab, `lib/stripe/dashboard-urls.ts`)
  - Stripe 帳戶 ID (`acct_*`) → Stripe Connect account Dashboard (new tab)
- 「查看訂單」 button retained (new tab)

### FPS 批次處理 — CSV export

- `handleExportFpsCSV` shows `BlockingLoadingOverlay` while generating download

## Acceptance checklist

- [x] Page SSR with `isSupabaseConfigured()` guard
- [x] Stripe Available / Pending / Today In display HK$ amounts
- [x] Refresh shows toast「已重新整理 Stripe 帳戶餘額」
- [x] Merchant tab count badge uses server `total`
- [x] Merchant table server pagination 10/page
- [x] FPS tab mock search/filter/export unchanged
- [x] FPS batch banner shows Wednesday schedule
- [ ] Phase C: wire FPS tab to `payout_requests`

## E2E

- `e2e/admin-stripe-finance.spec.ts` Route 2 — FPS mock Stripe Log retained; Merchant tab asserts main table headers (no duplicate Stripe Log)
