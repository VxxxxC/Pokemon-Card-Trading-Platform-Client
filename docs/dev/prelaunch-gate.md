# Prelaunch gate — H1 / H2 前人手 QA 前測試順序

> Dev 跑完 gate 全綠後，Partner 跟 **[PARTNER_QA.md](./PARTNER_QA.md)** 簽收（M1–M7 必做）。

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
2. `bunx supabase db push`（與 staging 對齊；本次 release 至 **`20260924150000`**）
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

## Phase 1a — 無 webhook（~50–95 min）

由 [scripts/prelaunch-gate-1a.sh](../scripts/prelaunch-gate-1a.sh) 順序執行：

1. `bunx tsc --noEmit`
2. `bun run test:integration:grading`
3. `bun run test:integration:grading:stripe-smoke`（fail 真 PI，唔經 webhook）
4. `bun run test:integration:grading:pass-stripe-smoke`（pass 全額 capture 真 PI）
5. `bun run test:moderation:gate:full`（含 `seed:moderation-e2e` + seller project E2E）
6. `bun run test:integration:fps-payout`（Member FPS 1A→1B→admin 銷帳 integration）
7. `bun run test:integration:merchant-connect-payout`（Merchant Connect held/failed/retry integration）
8. `bun run build:ci`

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

**唯一清單：** [PARTNER_QA.md](./PARTNER_QA.md)

| 舊代號 | 新對應 |
|--------|--------|
| H1 三頁煙霧 | **M1** |
| 舉報主線 | **M2** |
| 退款 spot check | **M3** |
| 條款／checkout | **M4** |
| 首頁 P0 | **M5** |
| FPS 出賬 | **M6** |
| Merchant Connect 出賬 | **M7** |
| H2 鑑定 pass staging | **O1**（可選；G-BP-S1 已驗 capture） |

---

## Dev sign-off

```bash
bunx supabase db push   # 對齊至 20260924150000
bun run test:integration:fps-payout
bun run test:integration:merchant-connect-payout
bun run test:prelaunch:gate:1a   # 含上述兩項 + tsc + grading + moderation + build:ci
```

| Step | 命令 | Webhook |
|------|------|---------|
| 0 | `supabase db push`（至 **`20260924150000`**）+ `test:prelaunch:check-env` | — |
| 1a | `test:prelaunch:gate:1a` | 唔需要 |
| 1b | `test:prelaunch:gate:1b` | **要** |
| 8b | staging 重跑 I-H14 | Dashboard |
| H1 | Partner M1–M7（見 PARTNER_QA.md） | — |
| H2 | Partner O1 可選 | 唔需要（G-BP-S1） |

---

## 相關 gate

| Scope | 獨立命令 |
|-------|----------|
| 獎勵 | `bun run test:rewards:gate` |
| 舉報 | `bun run test:moderation:gate:full` |
| 鑑定用券 | `bun run test:auth-escrow:gate` |
| FPS 出賬 | `bun run test:fps-payout:gate`（獨立 full gate；1a 只跑 `test:integration:fps-payout`） |
| Merchant Connect 出賬 | `bun run test:integration:merchant-connect-payout`（1a 已含；無獨立 release gate） |

詳見 [e2e.md](./e2e.md) · **[PARTNER_QA.md](./PARTNER_QA.md)** · [PARTNER_QA_SIGNOFF](./follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md)（dev automation）
