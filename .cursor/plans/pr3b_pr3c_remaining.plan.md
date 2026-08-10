# PR3B / PR3C — Remaining moderation refund work (post-PR3A)

**SSOT:** [refund-policy.md](../../docs/dev/refund-policy.md) §5 / §8 / §11 / §12 · [refund-policy-rollout-plan.md](../../docs/dev/follow-up/refund-policy-rollout-plan.md) PR3 §3B–3C  
**Prerequisite:** PR3A ✅ — migration `20260913140000`, I-H10, §12 member finalize

**Scope:** Planning only. PR3B and PR3C are **separate PRs** (can ship independently; recommended order below).

---

## Gap assessment (post-PR3A)

| Area | SSOT target | Current code | Gap |
|------|-------------|--------------|-----|
| Member S3 finalize (admin session) | ✅ | `20260913140000` + I-H10 | **Done (PR3A)** |
| Resolve UI `fault_party` | seller / buyer / platform / **carrier** / **inconclusive** | `DisputeDetailClient` + `types.ts` only 3 values | **PR3B** |
| `rpc_resolve_moderation_case` whitelist | all 5 enum values | rejects carrier/inconclusive (`20260910180000` L1146–1152) | **PR3B** |
| `fn_compute_moderation_order_refund` | carrier ≈ seller eligible; inconclusive full eligible; settlement flags per §5/§8 | only `settlementRequired` for seller; no breakdown | **PR3B** (+ **PR3C** for preview fields) |
| `rpc_finalize_moderation_order_refund` | carrier(seller logistics) → receivable; carrier(platform) → no receivable; inconclusive → no seller recovery + fee split | only seller fault → `seller_receivables` / `merchant_ledgers` | **PR3B** |
| `moderation-order-refund-saga.ts` | buyer deducts stripe fee; seller/carrier/inconclusive full policy refund | buyer-only fee deduct; `settlementRequired` from prepare only | **PR3B** |
| Admin amount preview (§2.1) | read-only 6-field breakdown before resolve | none | **PR3C** |
| `refund-policy.md` §12 | carrier/inconclusive S3 ✅ | ❌ 舉報 UI 未接 | **PR3B** docs |
| Integration I-H15 / I-H16 | rollout plan | not defined in `6phase-test-plan.md` | **PR3B** |

**Already aligned (no PR3B change for buyer path):** S3 eligible base (A+C, +D on platform fault), buyer stripe-fee deduction in saga, grading fail UI already exposes carrier/inconclusive (`AdminGradingClient.tsx`).

---

## ❓ Intent checks (block implementation until confirmed)

### IC-1 — S3 `inconclusive` Stripe fee split

[refund-policy §5](../../docs/dev/refund-policy.md#5-stripe-processing-fee-總規則) states **50/50 buyer/seller** for `inconclusive`, with a footnote allowing platform absorb in PR scope.

**Confirm before PR3B migration:**

- **Option A (SSOT default):** `stripe_fee_actual` split 50/50 — buyer refund unchanged (full eligible); record half on seller receivable / merchant ledger and half as `platform_absorb_hkd` (or internal ledger only).
- **Option B:** Platform absorbs entire stripe fee (`platform_absorb_hkd = stripe_fee_actual`); no buyer deduction, no seller recovery for fee.

> S1 inconclusive auth-fee goodwill (§4) is **separate** from S3 stripe-fee rule — do not conflate.

### IC-2 — S3 `carrier` logistics liability

[refund-policy §5](../../docs/dev/refund-policy.md#5-stripe-processing-fee-總規則) / [§8.2](../../docs/dev/refund-policy.md#82-s3-breakdown-表鑑定-pass-後): carrier splits by **who arranged shipping**.

**Confirm before PR3B UI:**

- **Option A (recommended):** Add resolve payload field `carrierLiabilityParty: 'seller' | 'platform'` (required when `faultParty === 'carrier'`). Seller logistics → same as seller fault (receivable + stripe fee). Platform logistics → full buyer refund, stripe fee platform absorb, **no** seller receivable.
- **Option B:** Default heuristic only (e.g. outbound damage → platform; inbound → seller) with no UI — higher mis-routing risk.

### IC-3 — PR3C preview stripe fee source

**Confirm before PR3C:**

- **Option A:** Preview uses **policy formula** only; `stripe_fee_hkd` shown as「依 finalize 時 Stripe balance transaction」with estimated placeholder 0 unless cached on order.
- **Option B:** Preview calls Stripe PI retrieve (admin-only server action) — accurate but slower + requires live Stripe in staging.

Default recommendation: **Option A** for v1 preview; label fee row as estimate.

---

## PR3B — Carrier / inconclusive fault expansion

**Goal:** Phase H resolve end-to-end for `carrier` and `inconclusive` per SSOT §5 / §8 / §11.

### 1. Database migration `20260914xxxx_moderation_fault_carrier_inconclusive.sql`

| Function | Change |
|----------|--------|
| `rpc_resolve_moderation_case` | Whitelist `carrier`, `inconclusive`; validate `carrierLiabilityParty` when carrier (if IC-2 Option A) |
| `fn_compute_moderation_order_refund` | Return extended JSON: `settlementRequired`, `stripeFeeBearer`, `authFeeRetainedHkd`, `carrierLiabilityParty` (optional); carrier(seller) → `settlementRequired=true`; inconclusive → `settlementRequired=false` |
| `rpc_finalize_moderation_order_refund` | carrier(seller logistics): receivable/ledger like seller; carrier(platform): skip receivable; inconclusive: per IC-1 (no full-order seller recovery) |
| `rpc_retry_moderation_order_refund_prepare` | Recompute `settlementRequired` for carrier (not only seller) |

**Do not regress:** PR3A `set_config('moderation.order_refund')` wrappers in finalize / mark_failed / retry for `member_auth`.

### 2. Saga — `lib/payments/moderation-order-refund-saga.ts`

| Change | Rule |
|--------|------|
| `computeRefundCents` | Only `buyer` deducts stripe fee; `carrier` / `inconclusive` / `platform` / `seller` → full policy cents |
| `p_stripe_fee_hkd` on finalize | Pass fee when settlement/receivable path (seller **or** carrier-seller per IC-2) |
| `parsePrepareModerationOrderRefundPayload` | Accept new prepare fields if added |

### 3. Backend actions — `app/actions/admin-moderation.ts`

- Extend `buildResolvePayload` / `ResolveAdminModerationCaseInput` (via `lib/moderation/types.ts`) for `carrier` | `inconclusive` and optional `carrierLiabilityParty`.
- Reuse `isGradingFaultParty` from `auth-grading-fail-void-saga.ts` for validation consistency.

### 4. Frontend — `app/admin/disputes/[id]/DisputeDetailClient.tsx`

**Addition-only per backend wire-up protocol:**

| Element | Detail |
|---------|--------|
| `<select name="faultParty">` | Add options: `carrier`（物流）, `inconclusive`（無法判定） |
| Conditional sub-select | When `carrier`: `carrierLiabilityParty` seller / platform (if IC-2 Option A) |
| Validation | Mirror platform reason: inconclusive may need optional admin note (product call) |
| `handleResolve` | Pass extended `orderRefund` to `resolveAdminModerationCase` |

**Also update:** `lib/moderation/types.ts` (`faultParty` union + `carrierLiabilityParty?`).

### 5. Tests

| ID | Scenario | File | Assert |
|----|----------|------|--------|
| **I-H15** | `member_auth` carrier (seller logistics): resolve → prepare → admin finalize | `tests/integration/moderation/phase-h-refund.integration.test.ts` | `fault_party=carrier`, `refunded`, **seller_receivables** row (fee + refund like I-H10 seller) |
| **I-H16** | `member_auth` inconclusive: resolve → prepare → admin finalize | same | `fault_party=inconclusive`, `refunded`, **no** seller receivable (or split per IC-1) |

Optional unit tests:

- `tests/unit/moderation/moderation-refund-compute.test.ts` — pure TS mirror of §8.2 amounts (if logic extracted); else SQL integration only.

### 6. Docs (PR3B PR)

| File | Update |
|------|--------|
| `docs/dev/refund-policy.md` §12 | S3 carrier/inconclusive → ✅ |
| `docs/dev/follow-up/admin-moderation/6phase-test-plan.md` §1.6 | Add I-H15, I-H16 rows |
| `docs/dev/follow-up/admin-moderation/REFUND_ADMIN_PLAYBOOK.md` §5 | carrier/inconclusive ✅ |
| `docs/dev/follow-up/admin-moderation/backend.md` | Phase H fault matrix + `carrierLiabilityParty` contract |
| `docs/dev/follow-up/admin-moderation/frontend.md` | Resolve fault select spec |
| `docs/dev/follow-up/refund-policy-rollout-plan.md` | PR3 §3B checkbox |

### PR3B acceptance criteria

- [ ] IC-1 and IC-2 confirmed in writing (PR description or issue)
- [ ] Admin can resolve with carrier / inconclusive; invalid combo rejected at RPC
- [ ] `bun run test:integration:moderation` green including **I-H15**, **I-H16**
- [ ] `bunx tsc --noEmit` + `bun run lint` pass
- [ ] `refund-policy.md` §12 S3 carrier/inconclusive marked ✅
- [ ] No regression on I-H1–I-H10, I-H2, I-H3

### PR3B risks

| Risk | Mitigation |
|------|------------|
| Inconclusive fee split ambiguous | Block on IC-1 |
| Carrier mis-attribution without sub-field | Block on IC-2 Option A |
| finalize receivable logic drift | Copy seller branch pattern; integration asserts |

**Estimate:** 1 migration + saga patch + UI select + 2 integration tests (~1–1.5d)

---

## PR3C — Admin resolve amount preview (read-only)

**Goal:** Before「執行最終仲裁裁決」, show [refund-policy §2.1](../../docs/dev/refund-policy.md#21-breakdown-輸出格式admin對客) breakdown without mutating order or calling Stripe refund.

### 1. Database — `20260915xxxx_moderation_refund_preview.sql` (or extend existing fn)

**Preferred:** `fn_preview_moderation_order_refund_breakdown(p_order_id, p_fault_party, p_platform_fault_reason, p_carrier_liability_party DEFAULT NULL) RETURNS JSONB`

Output (all HKD, 2 dp):

```json
{
  "eligiblePolicyHkd": 850,
  "stripeFeeHkd": null,
  "stripeFeeNote": "finalize 時從 Stripe 讀取",
  "refundToBuyerHkd": 850,
  "authFeeRetainedHkd": 150,
  "sellerRecoveryHkd": 880,
  "platformAbsorbHkd": 0,
  "orderKind": "member_auth",
  "faultParty": "seller"
}
```

Implementation: delegate eligible base to `fn_compute_moderation_order_refund`; apply §5 fee rules in SQL or shared TS helper (keep single source — prefer SQL STABLE fn for preview = prepare consistency).

**Must not:** write orders, call Stripe, or bypass eligibility (`fn_moderation_order_refund_eligible` should gate preview action).

### 2. Server action — `app/actions/admin-moderation.ts`

```ts
previewModerationOrderRefund(input: {
  orderId: string;
  faultParty: GradingFaultParty;
  platformFaultReason?: string;
  carrierLiabilityParty?: 'seller' | 'platform';
}): ActionResult<ModerationRefundBreakdownPreview>
```

- Admin guard + eligibility check
- RPC `fn_preview_moderation_order_refund_breakdown`
- Return structured breakdown for UI

### 3. Types — `lib/moderation/types.ts`

Add `ModerationRefundBreakdownPreview` matching §2.1 fields (import enum from supabase types where possible).

### 4. Frontend — `app/admin/disputes/[id]/DisputeDetailClient.tsx`

**Addition-only:**

- When `executeOrderRefund && refundOrderId && faultParty`: debounced fetch preview (client `useEffect` or server action on select change)
- Read-only panel listing 6 breakdown rows (unstyled / placeholder OK)
- Loading + error states; hide when ineligible order

Optional: extract `ModerationRefundPreviewPanel.tsx` if file grows — not required for v1.

### 5. Tests

| Layer | File | Coverage |
|-------|------|----------|
| Unit | `tests/unit/moderation/refund-preview.test.ts` | seller / buyer / platform / carrier / inconclusive matrix vs §8.2 example (A=800,C=50,D=150,fee=30) |
| Integration | optional `I-H17` | RPC returns breakdown for seeded `member_auth` order (no finalize) |

### 6. Docs (PR3C PR)

| File | Update |
|------|--------|
| `docs/dev/follow-up/admin-moderation/frontend.md` | Preview panel acceptance |
| `docs/dev/follow-up/admin-moderation/backend.md` | `previewModerationOrderRefund` contract |
| `REFUND_ADMIN_PLAYBOOK.md` |「裁定前可預覽 breakdown」|

### PR3C acceptance criteria

- [ ] Preview visible when refund checkbox + order + fault selected
- [ ] Preview amounts match `fn_compute_moderation_order_refund` / §8.2 for seller, buyer, platform on `member_auth` fixture
- [ ] Resolve + actual refund flow **unchanged** (preview is read-only)
- [ ] `bunx tsc --noEmit` + `bun run lint` pass
- [ ] Works with PR3B fault types when PR3B merged (or graceful message if only 3 faults pre-3B)

### PR3C dependencies

| Dependency | Required? |
|------------|-----------|
| PR3A | Yes (member path stable) |
| PR3B | **Soft** — preview can ship with 3 faults first; extend breakdown rows when PR3B lands. **Recommend merge PR3B first** so preview covers full enum. |
| IC-3 | Yes (stripe fee display strategy) |

**Estimate:** 1 migration/RPC + 1 server action + UI panel + unit tests (~0.5–1d)

---

## Recommended merge order

```text
PR3A (done)
  → PR3B (carrier/inconclusive + I-H15/I-H16 + IC-1/IC-2)
  → PR3C (preview RPC + UI; benefits from full fault matrix)
  → PR4 (ToS / Partner QA spot checks including inconclusive playbook)
```

**DB push sequence (cumulative after PR3A):**

```text
… 20260913140000  (PR3A — done)
→ 20260914xxxx    (PR3B — fault expansion)
→ 20260915xxxx    (PR3C — preview fn; can same day as 3B if combined, but separate PR preferred)
```

**CI gate (unchanged):**

```bash
bunx supabase db push
bun run test:integration:moderation
bun run test:moderation:gate:full   # pre-release
bunx tsc --noEmit && bun run lint
```

---

## Out of scope (remain deferred)

- Real Stripe E2E for member_auth refund (I-H14 is `merchant_direct` only)
- Appeal portal / listing report (v2)
- Persisting breakdown snapshot on order row at prepare time (optional future; not required for PR3C read-only)
- Grading fail S1 carrier/inconclusive UI gaps (grading UI already has options; saga matrix is PR2+ territory)

---

## Checklist summary

### PR3B

- [ ] IC-1 inconclusive fee split confirmed
- [ ] IC-2 carrier liability UI confirmed
- [ ] Migration `20260914xxxx`
- [ ] Saga + finalize receivable branches
- [ ] DisputeDetailClient fault options
- [ ] I-H15, I-H16 green
- [ ] §12 + playbook updated

### PR3C

- [ ] IC-3 stripe fee preview strategy confirmed
- [ ] `fn_preview_moderation_order_refund_breakdown` + action
- [ ] Preview panel in resolve form
- [ ] Unit tests §8.2 matrix
- [ ] backend.md / frontend.md updated
