# Test Coverage SSOT — Post v2.1 進度

> **更新：** 2026-08-16  
> **用途：** 追蹤 **v2.1 production gate 以外** 嘅功能／logic flow 測試覆蓋與 backlog 進度。  
> **唔取代：** [PRODUCTION_GATE.md](./PRODUCTION_GATE.md) 附錄 A（v2.1 商業主線簽收）· [v2.1-deferred.md](./v2.1-deferred.md)（v2.1 專項）· [e2e-tiering.md](./e2e-tiering.md)（E2E 分層）

---

## 狀態圖例

| Status | 意思 |
|--------|------|
| **Gate** | 已納入 `test:production:gate:signoff` |
| **Partial** | 有 test，但未完整或 opt-in / mock only |
| **HasTest** | repo 有 spec，**未**入 gate（建議 nightly / PR optional） |
| **Missing** | 無 meaningful 自動化 |
| **Ops** | 人手／Dashboard，唔預期自動化 |
| **N/A** | 刻意不做（政策／零在途／out of scope） |
| **OutOfScope** | v2+ 功能，唔阻 launch |

**進度欄：** `☐` 未做 · `◐` 進行中 · `☑` 完成 · `—` 不適用

---

## 1. v2.1 商業主線（Gate — 視為 solid）

`test:production:gate:signoff` 全綠 = 下列域 **logic 已簽收**（詳見 PRODUCTION_GATE 附錄 A）。

| 域 | 涵蓋 |
|----|------|
| S0–S1 鑑定 | cancel · fail 矩陣 · pass · merchant 對稱 · stripe smoke |
| S3 售後 | Phase H member/merchant · I-H14 E2E · C7 retry |
| S4 出款 | FPS pipeline · Connect held/retry/failed |
| Coupon / checkout | FSM · member auth coupon · E2E reconcile · baseline C8 |
| Moderation | matrix integration · admin/report E2E · mutation |
| Webhook | C1 HTTP route integration |
| Smoke | home P0 · legal pages · admin grading guest |

Partner 人手：[PARTNER_QA.md](./PARTNER_QA.md) M1 only。

---

## 2. v2.1 範圍內仍 Partial（可選收緊）

| ID | Flow | Status | Artifact | 進度 | Next action |
|----|------|--------|----------|------|-------------|
| **TC-P01** | Coupon release on `PI.cancel`（全 HTTP webhook） | Partial | `coupon-webhook.integration.test.ts` | ☐ | 擴 C1 / coupon-webhook 事件 |
| **TC-P02** | Grading fail webhook finalize 全鏈 | Partial | `auth-grading-fail-webhook.test.ts` (unit) | ☐ | E2E 或 webhook-route 加 event |
| **TC-P03** | S2 pass 後、確認前 dispute | Partial | workflow + happy-path 間接 | ☐ | 專項 integration 或標 OutOfScope |
| **TC-P04** | Connect payout 全 block 零 skip | Partial | `merchant-connect-payout-pipeline` | ☐ | verify 綠後消滅 skip |
| **TC-P05** | Rewards matrix M-A1 | Partial | `platform-rewards-matrix.spec.ts` | ◐ | soak 後 `PRODUCTION_GATE_INCLUDE_MATRIX=1` |
| **TC-P06** | Staging webhook Dashboard replay | Ops | — | — | PG-WH-03 人手 checklist |
| **TC-P07** | Legacy 非 seller fail (C6) | N/A | G-LF1/LF2 only | — | 零 legacy 在途 |

---

## 3. 有 test、未入 Gate（Nightly / PR optional）

### 3.1 Integration（有檔、未串 `production-gate.sh`）

| ID | 模組 | Spec | 進度 | 建議 |
|----|------|------|------|------|
| **TC-N01** | Platform legal SSOT | `tests/integration/platform/platform-legal.integration.test.ts` | ◐ | PR label `platform` 或 nightly |
| **TC-N02** | Auth fee 設定 | `tests/integration/platform/auth-fee.integration.test.ts` | ◐ | 同上 |
| **TC-N03** | P2P AML limits | `tests/integration/platform/p2p-aml-limits.integration.test.ts` | ◐ | 同上 |
| **TC-N04** | Announcements | `tests/integration/announcements/*` + `test:announcements:gate` | ☐ | 獨立 gate script 已有 |
| **TC-N05** | Rewards matrix (integration) | `tests/integration/rewards/rewards-matrix.integration.test.ts` | ◐ | 與 E2E matrix 一齊 soak |

### 3.2 E2E（spec 存在、見 [e2e-tiering.md](./e2e-tiering.md)）

| ID | 優先 | Spec | 進度 | 說明 |
|----|------|------|------|------|
| **TC-E01** | P2 | `member-trading-p2p.spec.ts` | ◐ | C2C 主流程 |
| **TC-E02** | P2 | `member-offer-negotiation.spec.ts` | ◐ | 議價 |
| **TC-E03** | P2 | `global-chat-realtime.spec.ts` | ◐ | Chat realtime |
| **TC-E04** | P3 | `marketplace-search-offer.spec.ts` · `marketplace-storefront.spec.ts` | ☐ | 瀏覽／搜尋 |
| **TC-E05** | P3 | `merchant-product-detail.spec.ts` | ☐ | Buy-now UI |
| **TC-E06** | P3 | `member-dashboard.spec.ts` | ☐ | 簽到／dashboard |
| **TC-E07** | P3 | `member-collection-*.spec.ts` · `member-inventory.spec.ts` | ☐ | Collection |
| **TC-E08** | P3 | `member-auth-escrow.spec.ts` · `member-auth-inbound.spec.ts` · `member-order-detail-auth.spec.ts` | ☐ | Member 鑑定 UI 鏈 |
| **TC-E09** | P3 | `admin-announcements.spec.ts` · `admin-settings.spec.ts` · `admin-catalog.spec.ts` · `admin-user-control.spec.ts` · `admin-stripe-finance.spec.ts` | ☐ | Admin 周邊 |
| **TC-E10** | P3 | `member-rewards-redeem.spec.ts` · `rewards-order-detail.spec.ts` | ☐ | production gate 未含 order-detail |
| **TC-E11** | P3 | `member-merchant-trading.spec.ts` · `member-trading-filters.spec.ts` · `member-trading-smoke.spec.ts` | ☐ | 交易列表 |
| **TC-E12** | P3 | `member-order-detail-p2p.spec.ts` · `public-profile-page.spec.ts` · `member-rating-page.spec.ts` | ☐ | 訂單／profile |

**建議落地：** [`.github/workflows/nightly-test-coverage.yml`](../../.github/workflows/nightly-test-coverage.yml)（03:00 HKT 串行）或 PR label `platform` / `nightly-e2e`；唔擴 production gate 除非 soak 穩定。

---

## 4. 薄覆蓋／Missing（真正 backlog）

### 4.1 Cron HTTP（RPC 有測、route 多數無）

| ID | Route | RPC / 備註 | Status | 進度 |
|----|-------|------------|--------|------|
| **TC-M01** | `/api/cron/expire-merchant-pending-payment` | S0-05 測 RPC | Missing (HTTP) | ☐ |
| **TC-M02** | `/api/cron/release-stale-coupon-reserves` | — | Missing | ☐ |
| **TC-M03** | `/api/cron/member-fps-payout-ready` | pipeline integration 間接 | Missing (HTTP) | ☐ |
| **TC-M04** | `/api/cron/merchant-connect-payout-ready` | 同上 | Missing (HTTP) | ☐ |
| **TC-M05** | `/api/cron/ingest-platform-trades` | — | Missing | ☐ |
| **TC-M06** | `/api/cron/aggregate-prices` | — | Missing | ☐ |

### 4.2 Stripe Connect / KYC

| ID | Flow | Status | 進度 |
|----|------|--------|------|
| **TC-M10** | `/api/stripe/connect/onboard` · `return` · `dashboard` | Missing | ☐ |
| **TC-M11** | `admin-kyc` · `merchant-kyc` actions + `kyc/upload-document` | Missing | ☐ |

### 4.3 交易／社交（actions 為主）

| ID | Flow | Status | 進度 | 備註 |
|----|------|--------|------|------|
| **TC-M20** | P2P 面交全鏈（成交→完成） | HasTest (E2E only) | ☐ | integration 只得 dispute 無退款 |
| **TC-M21** | Chat server actions | Missing (integration) | ☐ | E2E realtime only |
| **TC-M22** | Reviews / 評價 | Missing | ☐ | |
| **TC-M23** | Collection / wishlist / inventory CRUD | HasTest (E2E only) | ☐ | |
| **TC-M24** | Merchant 直購 checkout→paid（非鑑定） | Partial | ☐ | E2E dialog；無專項 integration |
| **TC-M25** | Member 非鑑定訂單 complete/cancel | Missing | ☐ | |

### 4.4 Upload / 媒體 API

| ID | Route | Status | 進度 |
|----|-------|--------|------|
| **TC-M30** | `profile/upload-avatar` · `listings/upload-image` | Missing | ☐ |
| **TC-M31** | `reports/upload-evidence` · `merchant/upload-*` | Missing | ☐ |
| **TC-M32** | `admin/upload-announcement-image` | HasTest | ☑ | announcements gate |

### 4.5 Admin / 營運

| ID | Flow | Status | 進度 |
|----|------|--------|------|
| **TC-M40** | `admin-member-orders` | Missing | ☐ |
| **TC-M41** | Daily check-in program（獨立於 matrix tab） | Partial | ☐ |
| **TC-M42** | `merchant-finance` · merchant/member dashboards | Missing | ☐ |

---

## 5. Out of scope（v2+，唔計入 launch 缺口）

| 項目 | 追蹤 |
|------|------|
| Auction mock | OutOfScope |
| 申訴 portal | OutOfScope |
| Listing 頁舉報 | OutOfScope |
| Moderation Phase F 自動升級 cron | OutOfScope |
| 全站 Email / Push | OutOfScope |
| P2P 面交平台退款 | OutOfScope（有 `p2p-dispute-no-refund` 證明唔退） |
| S2 一般售後（政策） | OutOfScope · refund-policy §3 |

---

## 6. 建議實施順序（post-launch test program）

| Phase | 目標 | IDs |
|-------|------|-----|
| **L1** | Nightly E2E 接入 CI | TC-E01–E03 |
| **L2** | Platform integration 入 PR optional | TC-N01–N03 |
| **L3** | Matrix soak → 預設 gate | TC-P05 |
| **L4** | Cron HTTP smoke（CRON_SECRET + 1 order fixture） | TC-M01–M04 |
| **L5** | Connect/KYC onboarding smoke | TC-M10–M11 |
| **L6** | 其餘 P3 E2E nightly | TC-E04–E12 |
| **L7** | Upload / reviews / chat integration | TC-M21–M31 |

---

## 8. Nightly CI（locked）

| 項目 | 值 |
|------|-----|
| Workflow | [`.github/workflows/nightly-test-coverage.yml`](../../.github/workflows/nightly-test-coverage.yml) |
| Schedule | `0 19 * * *` UTC = **03:00 HKT** |
| 觸發 | `schedule` · `workflow_dispatch` · PR label `platform`（L2）· `nightly-e2e`（L1） |
| Env | Staging Supabase + `E2E_*` GitHub Secrets（同 moderation/rewards workflows） |
| 執行策略 | **串行**：`nightly-coverage` job 跑 `bun run test:nightly:coverage`（L2 → L1 → L3；一次 build + server） |
| Fail policy | 只通知（GitHub watch email）；**唔**阻 PR merge |

### Rewards E2E regression 分工

| Workflow | Job | Schedule | 內容 | Matrix |
|----------|-----|----------|------|--------|
| **nightly-test-coverage** | `nightly-coverage` | 03:00 HKT | L2 + L1 + L3 matrix soak | ✅ schedule only |
| **rewards.yml** | `rewards-integration` | 05:00 HKT | vitest rewards | — |
| **rewards.yml** | `rewards-e2e` | 05:00 HKT（needs integration） | `test:e2e:rewards-gate:production` | ❌ |
| **rewards.yml** | `rewards-e2e` | dispatch / PR `rewards` | `test:e2e:rewards-gate`（full） | ✅ |

本地：`bun run test:nightly:coverage`（需 `.env.local`；輕量 env check，唔跑 `verify:merchant-grading-e2e`）。

---

## 9. TC-P05 Matrix soak tracker

**計數單位：** `nightly-test-coverage` workflow 的 **`nightly-coverage` job 整體綠**（L3 E2E matrix + TC-N05 integration 都要過）。

| # | Date (HKT) | Workflow run | `nightly-coverage` | Streak |
|---|------------|--------------|--------------------|--------|
| 1 | — | — | — | **0/3** |
| 2 | — | — | — | |
| 3 | — | — | — | |

**Exit criteria：** streak **3/3** → 人手 `PRODUCTION_GATE_INCLUDE_MATRIX=1 bun run test:production:gate:signoff` → 先至改 `production-gate.sh` 預設 include matrix。

---

## 10. Changelog

| 日期 | 變更 |
|------|------|
| 2026-08-16 | Phase 1 nightly CI：L1/L2/L3 串行 workflow；rewards schedule 改 production E2E subset @ 05:00 HKT |
| 2026-08-16 | 初版：post v2.1 gate signoff 後覆蓋審計；S0-05/C7 done；C6 N/A；PARTNER_QA 精簡為 M1 |

---

## 相關文件

| 文件 | 角色 |
|------|------|
| [PRODUCTION_GATE.md](./PRODUCTION_GATE.md) | v2.1 商業 logic 簽收 SSOT |
| [v2.1-deferred.md](./v2.1-deferred.md) | v2.1 專項 done/deferred |
| [e2e-tiering.md](./e2e-tiering.md) | E2E gate vs nightly |
| [PARTNER_QA.md](./PARTNER_QA.md) | Partner 人手 M1 |
| [prelaunch-1a-gap-checklist.md](./prelaunch-1a-gap-checklist.md) | 1a 跑 log 對照（audit 已併入 PRODUCTION_GATE 附錄 A） |
