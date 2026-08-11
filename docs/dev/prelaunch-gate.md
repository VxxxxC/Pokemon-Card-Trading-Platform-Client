# Prelaunch gate — H1 / H2 前人手 QA 前測試順序

> Dev 跑完 gate 全綠後，Partner 才做 [H1 staging 煙霧](#phase-3--partner-人手) + [H2 鑑定 pass](#h2--鑑定-pass-主線)。

## 一鍵命令

| 階段 | 命令 |
|------|------|
| Env 檢查（1a） | `bun run test:prelaunch:check-env` |
| Env 檢查（1b + Stripe） | `bun run test:prelaunch:check-env:stripe` |
| Phase 1a（無 webhook） | `bun run test:prelaunch:gate:1a` |
| Phase 1b（要 webhook） | `bun run test:prelaunch:gate:1b` |
| 1a + 可選 1b | `bun run test:prelaunch:gate`（1b 需 `PRELAUNCH_RUN_1B=1`） |

```bash
# 完整本機流程
bun run test:prelaunch:gate:1a
bun run stripe:webhook:listen   # 另一 terminal；whsec → STRIPE_WEBHOOK_SECRET
PRELAUNCH_RUN_1B=1 bun run test:prelaunch:gate
# 或
bun run test:prelaunch:gate:1b
```

---

## Phase 0 — 前置

1. `git pull` + `bun install`
2. `bunx supabase db push`（與 staging 對齊）
3. `bun run test:prelaunch:check-env`（1b 前用 `test:prelaunch:check-env:stripe`）

| 變數 | 用途 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` | Integration + E2E |
| `E2E_ADMIN_*` / `E2E_BUYER_*` / `E2E_SELLER_*` | 測試帳號 |
| `E2E_SELLER_ID` / `E2E_LISTING_ID` | Merchant checkout / reconcile |
| `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Phase 1b |
| `STRIPE_WEBHOOK_SECRET` | 與 `bun run stripe:webhook:listen` 一致 |

腳本：[scripts/prelaunch-check-env.sh](../scripts/prelaunch-check-env.sh)

---

## Phase 1a — 無 webhook（~45–90 min）

由 [scripts/prelaunch-gate-1a.sh](../scripts/prelaunch-gate-1a.sh) 順序執行：

1. `bunx tsc --noEmit`
2. `bun run test:integration:grading`
3. `bun run test:integration:grading:stripe-smoke`（fail 真 PI，唔經 webhook）
4. `bun run test:integration:grading:pass-stripe-smoke`（pass 全額 capture 真 PI）
5. `bun run test:moderation:gate:full`（含 `seed:moderation-e2e` + seller project E2E）
6. `bun run build:ci`

**可 skip：** `test:auth-escrow:gate`（1b `rewards-gate` 已含 B2b）

---

## Phase 1b — 要 webhook（~20–40 min）

由 [scripts/prelaunch-gate-1b.sh](../scripts/prelaunch-gate-1b.sh) 執行：

1. `bun run test:rewards:gate`
2. `bun run test:e2e:moderation-stripe-smoke`（I-H14）

**本機：** `bun run stripe:webhook:listen` → localhost  
**Staging：** Stripe Dashboard webhook → staging URL（唔用 listen）

```bash
PLAYWRIGHT_BASE_URL=https://<staging-host> bun run test:e2e:moderation-stripe-smoke
```

---

## Phase 3 — Partner 人手

Gate 全綠後進行；**唔重跑** 舉報／退款／券 logic。

### H1 — Staging 煙霧（~3 min）

- Admin + buyer login
- 開 `/admin/disputes`、`/admin/grading`、`/profile/user/rewards` — 無 5xx／白屏

### H2 — 鑑定 pass 主線（可選 / ~10 min）

見 [admin-grading/PARTNER_HANDOFF.md](./follow-up/admin-grading/PARTNER_HANDOFF.md) P0。

Phase 1a #4 `test:integration:grading:pass-stripe-smoke` 已自動驗 **member_auth single-capture pass**（authorize → admin pass → full capture）。H2 可降為 **可選** staging 煙霧：Webhook UI 路徑、Merchant B2C、出庫／買家確認。

---

## Dev sign-off

| Step | 命令 | Webhook |
|------|------|---------|
| 0 | `supabase db push` + `test:prelaunch:check-env` | — |
| 1a | `test:prelaunch:gate:1a` | 唔需要 |
| 1b | `test:prelaunch:gate:1b` | **要** |
| 8b | staging 重跑 I-H14 | Dashboard |
| H1 | Partner 三頁 | — |
| H2 | Partner 鑑定 pass | **要** |

---

## 相關 gate

| Scope | 獨立命令 |
|-------|----------|
| 獎勵 | `bun run test:rewards:gate` |
| 舉報 | `bun run test:moderation:gate:full` |
| 鑑定用券 | `bun run test:auth-escrow:gate` |

詳見 [e2e.md](./e2e.md) · [PARTNER_QA_SIGNOFF](./follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md)
