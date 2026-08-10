# Partner QA Sign-off — 舉報與仲裁（Admin Moderation）

> **Status:** ⬜ 待 Partner 簽收  
> **Feature:** Phase A–E+ · Phase G · G+（reporter outcome）  
> **環境：** staging only · 勿用 production 真實用戶

---

## 原則

| 層 | 負責 | 工具 |
|----|------|------|
| **Logic / regression** | Dev / CI | Stable moderation gate（見下） |
| **可寫 test 但未寫** | Dev backlog | [§Automation backlog](#automation-backlog) — **唔入** Partner 清單 |
| **Partner 人手** | Staging 部署驗證 +（可選）UX 觀感 | **§Partner 簽收**（≤2 項必做／可選） |

**Logic 已由自動化覆蓋；Partner 唔重跑業務規則。**

---

## Dev release 前提（dev 簽，partner 信）

- [ ] Target branch 上 **stable gate 全綠**（見 [§Stable gate](#stable-gate-dev--ci)）
- [ ] Staging Supabase 已 push migrations `20260806120000`–`20260911140000`（含 Phase H refund saga + I-H2/I-H3 auth seeds + member prepare bypass）

> Partner P1 可與其他 flow **稍後一次過簽**；dev gate 已覆蓋 logic。**售後退款 Stripe 煙霧**可選跑 `bun run test:e2e:moderation-stripe-smoke`（需 `STRIPE_SECRET_KEY` + webhook listener）。v2／pre-launch 分層見 [v2-plan.md](./v2-plan.md)。

### Stable gate（dev / CI）

```bash
bun run test:moderation:gate:full
# 或逐步：
bun run test:integration:moderation:pbt
bun run test:moderation:mutation
MODERATION_GATE=1 bun run test:e2e e2e/user-report.spec.ts e2e/report-outcome-notification.spec.ts --project=setup --project=buyer
bun run seed:moderation-e2e
MODERATION_GATE=1 bun run test:e2e e2e/admin-moderation.spec.ts --project=setup --project=guest --project=buyer --project=seller
bun run build:ci
```

詳情：[6phase-test-plan.md](./6phase-test-plan.md) · [e2e.md](../../e2e.md)

---

## Partner 簽收（人手）

### 測試帳號（staging）

| 角色 | 來源 |
|------|------|
| 舉報人（buyer） | `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` |
| 被舉報人（seller） | `E2E_SELLER_ID` |
| Admin | `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` |

### P1 — Staging 煙霧測試（必做，~10 分鐘）

在 **staging URL**（唔係本機 `localhost`）用上述帳號走一條主線：

1. **Buyer** — chat 或 profile 舉報 seller（惡意欺詐）→「舉報信號已受理」
2. **Admin** — `/admin/disputes` → 開該案 →「駁回舉報」→ 執行裁定
3. **Buyer** — `/profile/user` →「舉報結果通知」modal →「我知道了」→ reload 唔再彈

**預期：** 無 5xx／白屏；流程與 dev gate 一致。

| 簽收 | ⬜ |

### P2 — UX / 文案抽查（可選，~5 分鐘）

舉報 dialog、admin 工作台、結果 modal：中文清晰、按鈕位置合理。  
（唔驗業務規則 — 規則已由 integration / E2E 覆蓋。）

| 簽收 | ⬜ |

**Partner 簽名：** _______________ **日期：** ___________

---

## 自動化已覆蓋（唔使人手）

> Partner 清單唔再列以下項；回歸靠 gate。

| 領域 | Integration | E2E |
|------|-------------|-----|
| 舉報提交、dedup、offline_trade 擋、證據、case 合併 | I-R1–R6 | `user-report.spec.ts` |
| Admin queue / bundle / chat audit / 調分 / dismiss / suspend(DB) | I-M* · I-L1a/b · I-M4 | `admin-moderation.spec.ts` |
| Subject history | I-G1–G4 | E2E-G5 |
| Outcome notify、resolution 文案、legacy、ack、IDOR | I-N* · I-G3 | E2E-N1 |
| 權限（非 admin、member redirect、suspended） | I-M5 | admin access + E2E-AB5a/b |
| 制裁副作用（listing / payout / chat / evidence override） | I-E1–I-E5 | — |
| Proxy 解封、永久封禁、訂單 panel 細節 | I-E5 | E2E-AB6 · E2E-AB7 · E2E-AB8 |
| 重複 resolve | I-L3 | — |
| 純函數 / resolution mapping | unit · PBT · mutation ≥85% | — |

完整 test ID 對照：[6phase-test-plan.md §5](./6phase-test-plan.md)

---

## Automation backlog

> ✅ AB-1～AB-9 已實作（2026-08-10）。保留作 test ID 對照。

| # | 行為 | Test ID | 狀態 |
|---|------|---------|------|
| AB-1 | upheld + 限制 Member 上架 → listings inactive | I-E1 | ✅ |
| AB-2 | upheld + 凍結出款 → `payout_status` frozen | I-E2 | ✅ |
| AB-3 | 制裁後禁發 chat | I-E3 | ✅ |
| AB-4 | 證據不足 + 管理員強制裁定 upheld | I-E4 | ✅ |
| AB-5 | suspend → `/marketplace` redirect；admin 豁免 | E2E-AB5a/b | ✅ |
| AB-6 | suspend 過期 → proxy 解封 | I-E5 · E2E-AB6 | ✅ |
| AB-7 | 永久封禁 → 登入失敗 | E2E-AB7 | ✅ |
| AB-8 | 關聯訂單卡連結 / timeline | E2E-AB8 | ✅ |
| AB-9 | I-N6 IDOR — CI 常駐 seller creds | `hasFullModerationIntegrationEnv` + workflow | ✅ |

---

## 參考（歷史人手步驟，非 Partner 必做）

詳細 UI／SQL 步驟仍留作 dev 除錯：

- [backend.md §Partner manual QA](./backend.md#partner-manual-qaphase-e--e)（E1–E7、E+1–E+9）
- [frontend.md §Partner manual QA](./frontend.md#partner-manual-qaphase-e--e)（F1–F15）
- [subject-history-plan.md §9](./subject-history-plan.md#9-verify-manual)

---

## 參考

- [6phase-test-plan.md](./6phase-test-plan.md) · [backend.md](./backend.md) · [frontend.md](./frontend.md) · [v2-plan.md](./v2-plan.md) · [e2e.md](../../e2e.md) · [PARTNER_QA_PENDING.md](../../PARTNER_QA_PENDING.md)
