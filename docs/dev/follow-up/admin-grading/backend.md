# Admin grading workbench — backend

> **Status:** ✅ P1 Ready · 🟡 Partner QA  
> **Refund policy:** [refund-policy §7](../../refund-policy.md#7-s1--鑑定失敗grading-fail) · **Admin 速查:** [REFUND_ADMIN_PLAYBOOK.md](../admin-moderation/REFUND_ADMIN_PLAYBOOK.md)  
> **Partner handoff:** [PARTNER_HANDOFF.md](./PARTNER_HANDOFF.md)

## Files

| Path | Purpose |
|------|---------|
| `supabase/migrations/20260729190000_admin_grading_workbench.sql` | Schema, audit logs, admin RPCs, legacy refund saga, payout/receipt guards |
| `supabase/migrations/20260730100000_escrow_p0_manual_capture.sql` | P0 manual capture: `payment_capture_status`, authorize/auth-fee capture RPCs, grading cancel lock |
| `supabase/migrations/20260731100000_escrow_p1_goods_capture_fail_void.sql` | P1: `grading_fault_party`, goods capture + fail void RPCs, `fully_captured` guards |
| `supabase/migrations/20260811120000_member_order_admin_grading_fail_trigger.sql` | Member auth trigger: admin grading fail prepare/finalize whitelist |
| `lib/payments/auth-capture-saga.ts` | Admin intake auth-fee capture saga |
| `lib/payments/goods-capture-saga.ts` | Admin pass goods capture saga |
| `lib/payments/auth-grading-fail-void-saga.ts` | Admin fail void uncaptured balance saga |
| `app/actions/admin-grading.ts` | Production admin guard + queue search + mutations |
| `app/api/stripe/webhook/route.ts` | `payment_intent.succeeded` partial capture finalize; `payment_intent.canceled` void sync |
| `supabase/migrations/20260901140000_auth_escrow_single_capture.sql` | Single-capture auth escrow: intake no capture, pass full capture |
| `supabase/migrations/20260901160000_admin_auth_pass_grading.sql` | `auth_grading_company` / `auth_grading_score`; grading required on pass RPCs |
| `supabase/migrations/20260901170000_admin_grading_fail_single_capture_fix.sql` | Restore admin grading-fail trigger whitelist; single-capture `rpc_finalize_auth_grading_fail` |
| `supabase/migrations/20260912120000_grading_fail_buyer_fault_single.sql` | PR2: buyer fault `capture_auth_fee_only`; seller settlement restore; `search_admin_grading_orders` preview fields |
| `supabase/migrations/20260912130000_grading_fail_member_trigger_bypass.sql` | Re-restore admin grading-fail trigger whitelist after moderation migration regression |

## Migrations / env

- Push: `bunx supabase db push`
- Regenerate types: `bun run supabase:types`
- Stripe webhook: `bun run stripe:webhook:sync`（Dashboard）或 `bun run stripe:webhook:listen`（本機）；事件清單見 `lib/stripe/webhook-events.ts`
- Uses existing `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

## Admin action contract

All exports return `{ success: true, data } | { success: false, error }`.

| Action | RPC / Stripe | Notes |
|--------|--------------|-------|
| `searchAdminGradingOrders` | `search_admin_grading_orders` | Tabs: `awaiting_intake \| grading \| awaiting_outbound \| closed` |
| `adminConfirmGradingIntake` | **single:** `rpc_prepare_auth_intake_confirm` → optional re-auth (`auth-authorization-refresh`) → `rpc_finalize_auth_intake_confirm`（**no Stripe capture**） · **legacy:** `rpc_prepare_auth_fee_capture` → partial capture → `rpc_finalize_auth_fee_capture` | 分流：`rpc_get_auth_escrow_capture_model`（admin SECURITY DEFINER，唔經 participant RLS）；single: `authorized` + `platform_received_at`；legacy: `auth_fee_captured` |
| `adminPassGrading` | `rpc_prepare_goods_capture(p_auth_grading_*)` → `stripe.paymentIntents.capture` → `rpc_finalize_goods_capture` | **Required** `gradingOptionId` (non-RAW `GRADING_OPTIONS`); persists `auth_grading_*`. **single:** full `buyer_total`, **omit** `final_capture`; **legacy:** goods leg + `final_capture: true` |
| `adminSubmitGradingOutbound` | `rpc_admin_submit_grading_outbound` | Requires `auth_result=passed` |
| `adminFailGradingAndRefund` | `rpc_prepare_auth_grading_fail` → single buyer: `capture(auth_fee)` · single other: `PI.cancel` · legacy: `capture(0)` → `rpc_finalize_auth_grading_fail` | single buyer: retain D; single seller: void + receivable |
| `getAdminGradingAuditHistory` | `get_admin_grading_audit_history` | Admin read via session client |

Admin-triggered sagas (`run*Saga`) use session `createClient()` for prepare/finalize RPCs (`_grading_require_admin()` needs `auth.uid()`). Webhook `finalize*FromWebhook` and `rpc_mark_auth_grading_fail_failed` use service-role `createAdminClient()`.

**Capture model:** 新單 `escrow_capture_model = 'single'`（migration `20260901140000`）— 入庫不 capture；pass 一次扣全額。Legacy `NULL` 仍 multicapture；見 [PARTNER_HANDOFF](./PARTNER_HANDOFF.md)。

## Fail / void policy (P1)

> **Target breakdown:** [refund-policy §7](../../refund-policy.md#7-s1--鑑定失敗grading-fail) · **現況 vs target:** [§12](../../refund-policy.md#12-實作對照與缺口)

| 路徑 | 現行 code | Target |
|------|-----------|--------|
| **single + buyer fault** | `capture(D, final_capture)` | Capture D only，釋放 A+B+C | ✅ PR2 |
| **single + seller fault** | `PI.cancel` 全釋 → 追賣家 | ✅ 一致 |
| **legacy + seller fault** | `refund(D+B)` + `capture(0)` | ✅ 大致一致 |
| **legacy + other fault** | `capture(0)` only | 見 refund-policy §7.3 |

- `fault_party` enum: `buyer | seller | platform | carrier | inconclusive` (required on fail)
- Idempotency key: `auth-grading-fail-capture-zero:<orderKind>:<orderId>` (must differ from legacy `auth-grading-fail-void:*` used with `cancel`)
- Legacy `rpc_finalize_auth_refund` + `refund.created` webhook kept for manual recovery only

## Guards added

- `fn_enforce_member_order_transitions`: admin (`is_admin()`) may update member auth orders during grading fail prepare (`pending/grading` metadata only) and finalize (`pending+grading` → `cancelled`, `auth_result=failed`); required because fail void saga uses session client, not `service_role`
- `rpc_confirm_buyer_received`: `auth_result=passed` + `outbound_tracking_no` + `payment_capture_status=fully_captured`
- `rpc_prepare_merchant_order_payout`: auth orders require `fully_captured` + `authenticated` + outbound tracking
- `rpc_mark_auth_order_payment_voided`: only sets `voided` when `authorized` (not after partial capture)

## Verify (backend)

1. Non-admin session → all admin RPCs reject
2. Member: custody → intake → pass (`fully_captured`) → outbound → buyer confirm
3. Merchant auth: intake → pass → outbound → buyer confirm → payout
4. Fail on 100+30+150: captured 150 only; listing `active`; `fault_party` stored; no「保安攔截：您不屬於此筆訂單的交易關係人」on member orders (migration `20260811120000`)
5. Webhook replay `payment_intent.succeeded` (goods) idempotent
6. `bunx tsc --noEmit`, `bun run lint`, `bun run build:ci`
