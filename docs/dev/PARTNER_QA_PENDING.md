# Partner QA — 待簽收總覽

> **SSOT：** 各 flow 詳細步驟見下方連結；本頁只列 **仍未簽收** 的項目。  
> **更新：** 2026-08-10（v2 決策見 [admin-moderation/v2-plan.md](./follow-up/admin-moderation/v2-plan.md)）

---

## 1. 舉報與仲裁（Admin Moderation）— ⬜ 待簽

| 狀態 | 說明 |
|------|------|
| 自動化 | ✅ `test:moderation:gate:full` 全綠 · migrations 含 `20260911140000` |
| Pre-release | ✅ **I-H14** `bun run test:e2e:moderation-stripe-smoke`（env-gated；取代人手 staging 退款煙霧） |
| Partner | ⬜ **P1 staging 煙霧**（~10min）；**可與其他 flow 稍後一次過簽** |

**清單：** [follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md](./follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md) — **只含人手項**；logic 靠 stable gate + [Automation backlog](./follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md#automation-backlog)

---

## 2. 鑑定 / Escrow / 出款 — 🟡 待簽（與舉報無關）

| Flow | 狀態 | 清單 |
|------|------|------|
| Admin 鑑定工作台 + Single capture E2E | 🟡 Partner QA | [admin-grading/PARTNER_HANDOFF.md](./follow-up/admin-grading/PARTNER_HANDOFF.md) |
| Member C2C 鑑定託管 | 🟡 multicapture E2E | 同上 handoff |
| Merchant 鑑定 checkout | 🟡 multicapture | [unified-checkout/backend.md](./follow-up/unified-checkout/backend.md) |
| Member FPS 出款（T+3 後段） | 🟡 multicapture 後段 | [member-fps-payout/e2e-checklist.md](./follow-up/member-fps-payout/e2e-checklist.md) |

**已簽 ✅：** [Auth Escrow v2 PARTNER_QA](./follow-up/auth-escrow-v2/PARTNER_QA.md)（P0–P2）

---

## 3. 平台獎勵 v2 — 局部待簽

| 項目 | 狀態 | 清單 |
|------|------|------|
| Phase 3 / 4 / 2b | ✅ Partner QA | [platform-rewards-v2/QA_CHECKLIST.md](./follow-up/platform-rewards-v2/QA_CHECKLIST.md) |
| Phase 5 member_auth 免運券 | ✅（INTEGRATION_QUEUE）· plan Part F 草案 | [phase-5-plan.md §Partner QA Part F](./follow-up/platform-rewards-v2/phase-5-plan.md#partner-qa--part-f草案) |
| G2.6 每人限兌（終身） | ⬜ 單項 | [QA_CHECKLIST.md Part G](./follow-up/platform-rewards-v2/QA_CHECKLIST.md) |

---

## 4. 不在 Partner QA 範圍

| 項目 | 時程 | 備註 |
|------|------|------|
| Phase F 自動升級 cron | v2 | [v2-plan.md](./follow-up/admin-moderation/v2-plan.md) |
| Email / push（含被罰用戶裁定通知） | **Pre-v1 全站 batch** | Backend only；與其他通知位一次過接 |
| 申訴 portal · listing 舉報 · carrier/inconclusive UI | v2 / PR3 | 退款 SSOT: [refund-policy.md](./refund-policy.md) |
| 完整退款 spot check（全 orderKind × fault） | **PR4** | 見 [refund-policy-rollout-plan.md](./follow-up/refund-policy-rollout-plan.md) |

---

## 簽收優先序（建議）

1. **舉報機制** → [PARTNER_QA_SIGNOFF.md](./follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md) **P1 staging 煙霧**
2. **鑑定 single capture** → [PARTNER_HANDOFF.md](./follow-up/admin-grading/PARTNER_HANDOFF.md)（若同時上線支付）
3. **Rewards G2.6** → 積分商城限兌（可獨立）
