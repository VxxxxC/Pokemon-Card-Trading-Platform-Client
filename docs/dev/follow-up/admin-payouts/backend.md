# Admin Payouts — Backend

> **Status:** Phase A ✅ · Phase B ✅ · Merchant ledger ✅ · Phase C MVP ✅ (FPS list/mutations) · Pipeline ⏳  
> **Route:** `/admin/payouts`

## Phase A — Server actions

### `getAdminPayoutsPageData()`

```ts
{ success: true, data: {
  stripeBalance: { available, pending, todayIn, currency, lastSyncedAt } | null,
  stripeBalanceError?: string,
}}
```

- Auth: `requireAdmin()` + `createAdminClient()`
- Stripe: `getPlatformStripeBalance()` + `getPlatformStripeTodayInflow()` (HKT start-of-day, positive HKD net)

### `listAdminMerchantTransfers(input)`

```ts
type ListAdminMerchantTransfersInput = {
  page?: number;           // default 1
  pageSize?: number;       // default 10, max 50
  search?: string;
  statusFilter?: "all" | "paid" | "failed" | "processing" | "pending";
  sort?: "transferred_at-desc" | "transferred_at-asc" | "merchantName-asc" | "merchantName-desc";
  dateFrom?: string;       // ISO, transferred_at >=
  dateTo?: string;
};

{ success: true, data: {
  rows: MerchantTransferRow[],  // includes merchantId
  total: number,
  page: number,
  pageSize: number,
  totalPages: number,
  statusCounts: { all, paid, processing, pending, failed },
}}
```

- Base query: `merchant_orders` where `stripe_transfer_id IS NOT NULL`
- Server pagination: `.select(..., { count: "exact" }).range(offset, offset + pageSize - 1)`
- **`statusCounts`**: 5 parallel head-count queries with same search/date filters (ignores active `statusFilter`)
- Extended fields: `item_subtotal`, `commission_rate_applied`, `auth_fee`, `buyer_confirmed_at`, `stripe_payment_intent_id`, `requires_authentication`
- Join enrichment: `merchant_shops`, `kyc_records`, `profiles`, `merchant_ledgers` reconciliation
- `merchantName` sort: in-memory sort up to `MERCHANT_NAME_SORT_FETCH_CAP` (5000), then slice

### `listAdminMerchantTransfersForExport(input)`

- Same filters as list; fetches up to `MERCHANT_TRANSFERS_EXPORT_CAP` (2000) rows for CSV

### `refreshAdminStripeBalance()`

- `revalidatePath('/admin/payouts')`

### `getAdminFpsBatchSchedule()`

- Returns next Wednesday batch date + cutoff from `lib/admin-payouts/fps-batch-config.ts`

## Phase B — Migration `20260801120000_member_fps_payout.sql`

### Enums

- `member_seller_payout_status`: `none | held | ready | processing | paid | frozen | failed`
- `payout_request_status`: `pending | ready | processing | completed | failed`
- `payout_batch_status`: `draft | processing | completed`

### Tables

| Table | Purpose |
|-------|---------|
| `member_orders` + `buyer_confirmed_at`, `payout_hold_until`, `seller_payout_status` | T+3 hold state |
| `payout_requests` | 1:1 `member_orders`, FPS snapshot |
| `payout_batches` | Weekly batch audit |
| `profiles.fps_id` | Seller FPS ID |
| `platform_settings` | Seed `fps_payout_config` |

### RLS

- `payout_requests`: seller read own; admin all
- `payout_batches`: admin only

## Phase C — FPS ledger MVP ✅ (partial)

### `listAdminPayoutRequests(input)`

```ts
type ListAdminPayoutRequestsInput = {
  page?: number;           // default 1
  pageSize?: number;       // default 10, max 50
  search?: string;         // request id, order_number, seller name, fps_id, admin_fps_reference
  statusFilter?: "all" | "incomplete" | "completed" | "failed";
  sort?: "submittedAt-desc" | "submittedAt-asc" | "userName-asc" | "userName-desc";
  dateFrom?: string;       // ISO, created_at >=
  dateTo?: string;
};

{ success: true, data: {
  rows: FpsPayoutRow[],
  total, page, pageSize, totalPages,
  statusCounts: { all, incomplete, completed, failed },
}}
```

- Base query: `payout_requests` with server pagination
- **`incomplete`** = `pending` + `ready` + `processing`
- Join enrichment: `member_orders.order_number`, `profiles.display_name` / `username`
- `submittedAt` = `formatAdminDateTime(ready_at ?? created_at)`
- `statusCounts`: 4 parallel head-count queries (same search/date scope, ignores active status filter)

### `listAdminPayoutRequestsForExport(input)`

- Same filters; cap `FPS_EXPORT_CAP` (2000)

### `updateAdminPayoutRequestStatus(input)`

```ts
{ requestId, status: "processing" | "completed" | "failed", adminFpsReference?: string }
```

- `completed`: sets `paid_at`, `paid_by`, optional `admin_fps_reference`
- Guard: only from `pending|ready|processing`
- `revalidatePath('/admin/payouts')`

### `batchCompleteAdminPayoutRequests({ requestIds })`

- Bulk mark `completed` with `paid_at` / `paid_by`

## Phase C — Still deferred

1. **`confirmBuyerReceived`** — T+3 hold + auto `payout_requests` insert
2. **Cron** — auto-insert ready rows when `payout_hold_until` elapses
3. **Member order detail** — seller payout UI
4. **`profiles.fps_id`** persist on profile update

## Migration verify (ops)

```bash
bunx supabase db push   # or apply 20260801120000 in SQL editor
```

Sanity SQL:

```sql
SELECT COUNT(*) FROM payout_requests;
SELECT key FROM platform_settings WHERE key = 'fps_payout_config';
```

## Dev seed (FPS ledger)

```bash
# In Supabase SQL editor, run:
# scripts/dev/seed-fps-payout-requests.sql
```

- Idempotent: picks auth `member_orders` without existing `payout_requests`
- Mixed statuses: `pending`, `ready`, `processing`, `completed`, `failed`
- `fps_id_snapshot` from `profiles.fps_id` or `9999999`

## Verify (Phase C MVP)

```bash
bunx supabase db push          # if not applied
# Run scripts/dev/seed-fps-payout-requests.sql on dev
bunx tsc --noEmit
bun run lint
bun run build:ci
# As admin: /admin/payouts → FPS tab chips, pagination, 銷帳/駁回, CSV overlay
```

## Verify (Phase A + Merchant ledger)

```bash
bunx tsc --noEmit
bun run build:ci
# As admin: /admin/payouts → Stripe balance HK$ numeric; Merchant tab server pagination 10/page
```

## Verify (Phase B)

```bash
bunx supabase db push   # or apply migration in SQL editor
# Confirm types: payout_requests, payout_batches, platform_settings in types/supabase.ts
```
