# Auth Escrow v2 — Backend

> **Status:** 🟢 Phase B + single capture (v2.1) · **Phase C/D:** pending  
> **Migration:** `20260901120000`, `20260901130000`, **`20260901140000_auth_escrow_single_capture.sql`**  
> **Plan:** [plan.md](./plan.md) · **Blocks:** [Platform Rewards v2 Phase 2b](../platform-rewards-v2/plan.md)  
> **Policy SSOT (pending v0.2):** [escrow-payment-policy.md](../../escrow-payment-policy.md)

## Overview

鑑定託管金流 v2：Member 鑑定 + Merchant 鑑定兩類；全程順豐；平台固定單程運費；兩段運費 snapshot；**pass 單次 full capture**；賣方責任鑑定失敗時買家全退 + 賣方追償。

**Phase B** 已 patch prepare / payout（無券）。**v2.1（`20260901140000`）** 新單 `escrow_capture_model = 'single'`；在途 NULL 仍 staged multicapture。fail saga Phase C pending。

---

## Phase A — Migration

### Enums

| Enum | Values |
|------|--------|
| `seller_settlement_status` | `none`, `pending`, `cleared`, `waived` |
| `seller_receivable_status` | `pending`, `paid`, `waived`, `cancelled` |
| `transaction_type` | + `grading_fail_recovery`（Phase C merchant ledger） |

### `member_orders` / `merchant_orders` (new columns)

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `inbound_shipping_fee` | `NUMERIC NOT NULL` | `0` | 賣家 → 平台（順豐單程） |
| `outbound_shipping_fee` | `NUMERIC NOT NULL` | `0` | 平台 → 買家（順豐單程） |
| `seller_settlement_status` | `seller_settlement_status` | `none` | 鑑定失敗追償 gate（Phase C） |

**`member_orders` only:**

| Column | Type | Default |
|--------|------|---------|
| `buyer_total_amount` | `NUMERIC` | `NULL` | Phase B：`total_amount − subsidy`；NULL 時視同 `total_amount` |

**保留：** `merchant_orders.shipping_fee` 不刪除 — 非鑑定直發與舊版 auth 用券路徑仍使用；Phase B 鑑定單以 `inbound_*` / `outbound_*` 為準。

### `platform_settings`

| Key | JSON | Purpose |
|-----|------|---------|
| `auth_escrow_config` | `{ "sf_leg_fee_hkd": 30, "auth_fee_hkd": 150 }` | 鑑定單順豐單程運費 + 鑑定費（與 `fps_payout_config` 分開） |

### SQL helpers (read-only)

| Function | Returns | Fallback |
|----------|---------|----------|
| `fn_platform_auth_escrow_config()` | `JSONB` | `{}` |
| `fn_platform_auth_sf_leg_fee()` | `NUMERIC` | `30` |
| `fn_platform_auth_fee_hkd()` | `NUMERIC` | `150` |

Grant: `authenticated`, `service_role`.

### `seller_receivables`

Member 賣家鑑定失敗追償（Merchant 主要用 `merchant_ledgers` Phase C）。

| Column | Notes |
|--------|-------|
| `order_kind` | `'member'` \| `'merchant'` |
| `order_id` | UUID |
| `seller_id` | FK `profiles` |
| `amount_hkd` | `> 0` |
| `status` | `seller_receivable_status` |
| `fps_reference`, `stripe_fee_hkd`, `notes` | Admin 人手 FPS |
| `paid_at`, `paid_by` | 結清記錄 |

**Constraints:** `UNIQUE (order_kind, order_id)`

**RLS:**

- Seller: `SELECT` own rows
- Admin: `is_admin()` ALL
- Writes: Phase C via `service_role` / admin RPC（無 client INSERT）

---

## Amount formulas (Phase B — implemented)

```text
inbound_shipping_fee  = fn_platform_auth_sf_leg_fee()
outbound_shipping_fee = fn_platform_auth_sf_leg_fee()
auth_fee              = fn_platform_auth_fee_hkd()

total_amount     = item_subtotal + auth_fee + inbound_shipping_fee + outbound_shipping_fee
buyer_total_amount = total_amount - platform_subsidy_amount   -- Phase D 用券
```

Checkout breakdown 四行：卡價、鑑定費、運費（入庫段）、運費（出庫段）。

---

## Capture model (v2.1 — single capture for new orders)

| Column | Values |
|--------|--------|
| `member_orders.escrow_capture_model` | `'single'` = 新單；`NULL` = legacy staged |
| `merchant_orders.escrow_capture_model` | 同上（v2 無券鑑定 checkout 寫入 `single`） |

### Single capture (`escrow_capture_model = 'single'`)

| Step | Stripe | `payment_capture_status` |
|------|--------|--------------------------|
| Checkout | authorize `buyer_total` | `authorized` |
| 入庫 | **no capture**；可 `re-auth` PI | `authorized`（`platform_received_at` 有值） |
| 鑑定通過 | `capture(buyer_total, final_capture: true)` | `fully_captured` |
| 鑑定失敗（入庫後） | `cancel` PI | `voided` |

**RPCs:** `rpc_prepare_auth_intake_confirm` / `rpc_finalize_auth_intake_confirm`；`rpc_refresh_auth_escrow_payment_intent`（re-auth 換掛）。

**Sagas:** `lib/payments/auth-intake-confirm-saga.ts`，`lib/payments/auth-authorization-refresh.ts`；`adminConfirmGradingIntake` 依 `escrow_capture_model` 分流。

### Legacy staged multicapture (`escrow_capture_model IS NULL`)

| Step | Capture | `payment_capture_status` |
|------|---------|--------------------------|
| 入庫 | `auth_fee + inbound_shipping_fee` | `auth_fee_captured` |
| 鑑定通過 | `buyer_total - auth_fee - inbound` | `fully_captured` |

**RPCs:** `rpc_prepare_auth_fee_capture` / `rpc_finalize_auth_fee_capture`（unchanged for legacy).

---

## Fail & settlement target (Phase C — not implemented)

**賣方責任（`fault_party = seller`）MVP：**

1. Stripe **refund** 已 capture（鑑定費 + inbound + 若有的其餘）
2. Void 未 capture 餘額
3. 買家收回：卡價 + 鑑定費 + 兩段運費
4. Member → `INSERT seller_receivables`；Merchant → `merchant_ledgers` `grading_fail_recovery`
5. `seller_settlement_status = pending` → Admin 收款 → `cleared` → 允許寄回賣家 tracking

取代現行 fail saga（`capture(0)` + **auth_fee 不退**）。

---

## Files (Phase B)

| Area | Paths |
|------|-------|
| Migration | `20260901130000_auth_escrow_v2_phase_b.sql` — `fn_compute_auth_escrow_amounts`, prepare/capture/payout RPCs |
| Actions | `app/actions/member-auth-checkout.ts`, `app/actions/merchant-checkout.ts` |
| Checkout UI | `lib/checkout/*`, `app/checkout/[id]/*` |
| Defaults | `lib/auth-escrow/defaults.ts` |

## Files (future phases)

| Phase | Paths |
|-------|-------|
| C | `lib/payments/auth-grading-fail-void-saga.ts`, Admin 追償 UI |
| D | `fn_compute_platform_subsidy`（免運只減 outbound）、Rewards Phase 2b 解鎖 |

---

## Verify (Phase B)

```bash
bunx supabase db push
bun run supabase:types
```

SQL smoke (new member auth order, item $100):

```sql
SELECT public.rpc_prepare_member_auth_order_payment('<order_id>');
-- total_amount=310, inbound=outbound=30, buyer_total=310
SELECT public.fn_compute_auth_escrow_amounts(100);
```

```bash
bunx tsc --noEmit
bun run build:ci
bun run test:rewards:gate
```

**Partner QA:** [frontend.md](./frontend.md) · multicapture amounts in [PARTNER_HANDOFF](../admin-grading/PARTNER_HANDOFF.md)

## Verify (Phase A)

```bash
bunx supabase db push          # local
bun run supabase:types
```

SQL smoke:

```sql
SELECT public.fn_platform_auth_sf_leg_fee();   -- expect 30
SELECT public.fn_platform_auth_fee_hkd();      -- expect 150
SELECT key, value FROM platform_settings WHERE key = 'auth_escrow_config';
```

```bash
bunx tsc --noEmit
bun run build:ci
bun run test:rewards:gate   # non-auth paths unchanged
```

**Partner QA:** Phase A 無人手驗收項。

---

## Changelog

| Date | Change |
|------|--------|
| 2026-08-08 | Phase B — checkout amounts, multicapture split, payout inbound, checkout UI |
| 2026-08-08 | Phase A — migration + backend handoff |
