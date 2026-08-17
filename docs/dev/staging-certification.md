# Staging Certification — 執行契約

> **終極 Checklist：** [system-feature-registry.md](./system-feature-registry.md)（Member · Merchant · Admin · System **每一項功能**）。  
> **North star：** 功能表 **全 ☑** + **`bun run test:staging:certify` 綠** + Partner **M0** = Staging 可俾人用。  
> **技術細表：** [test-coverage-ssot.md](./test-coverage-ssot.md) v2.4

---

## 1. 「Staging 已認證」定義（可驗證）

| # | 條件 | 驗證方式 |
|---|------|----------|
| **C1** | [system-feature-registry.md](./system-feature-registry.md) **全 ☑**（F-M/C/A/S + SC-FX-ALL） | `bun run test:staging:certify --check-ssot` |
| **C2** | Production + nightly + security 腳本 **0 failed** | `bun run test:staging:certify` |
| **C3** | Signoff **0 未批准 skip** | gate log + `PRODUCTION_GATE_SIGNOFF=1` |
| **C4** | Staging DB migration = repo 最新 | deploy checklist |
| **C5** | Partner **M0**（≤5 min） | [PARTNER_QA.md](./PARTNER_QA.md) |

**唔屬認證範圍（v3+）：** Auction **mock**（≠ make offer）· 申訴 portal · Listing 頁舉報 · Phase F cron · 全站 Email/Push — 見 [v3-deferred.md](./v3-deferred.md)。  
**永久政策（已 in-scope 驗證）：** P2P 面交永不平台退款（F-S-13）。

**誠實邊界：** 認證 = **in-scope 功能 + 已登記安全/合約防線** 全綠；唔宣稱「宇宙零 bug」，但宣稱 **SSOT 登記嘅風險已用自動化守衛關閉**。

---

## 2. 認證登記（兩層）

### 2.0 功能層（主表 — 必須全 ☑）

👉 **[system-feature-registry.md](./system-feature-registry.md)** — 67 項 in-scope 功能（Member 26 · Merchant 13 · Admin 15 · System 13）+ §5 匯總 **SC-FX-ALL**。

`check-staging-certification.sh` 掃描 **F-M/C/A/S** 同 **SC-FX-*** 進度欄。

### 2.1 Gate & CI 基座（自動化跑數）

| ID | 要求 | Artifact / 命令 | 進度 |
|----|------|-----------------|------|
| **SC-G01** | Signoff gate 全綠 | `test:production:gate:signoff` | ☐ |
| **SC-G02** | Nightly L1–L3 全綠 | `test:nightly:coverage` | ☐ |
| **SC-G03** | Rewards schedule 全綠 | `rewards.yml` integration + E2E production | ☐ |
| **SC-G04** | Moderation schedule 全綠 | `moderation-integration.yml` | ☐ |
| **SC-G05** | Matrix soak 3/3 | SSOT §10 | ☐ |

### 2.2 旅程／CC 匯總（對照 SSOT §3–§8 — 細項見功能表）

| ID | 說明 | 進度 |
|----|------|------|
| **SC-J** | J-CPN/MOD/AUTH/TRD 旅程 | ◐ |
| **SC-CC** | Config Contract 全站 | ☐ |
| **SC-T** | TC-P/N/E 技術項 | ☐ |
| **SC-M** | TC-M cron/平台/社交 | ☐ |

### 2.3 安全 / 濫用

| ID | 要求 | Artifact | 進度 |
|----|------|----------|------|
| **SC-S01** | 券安全 R-01..R-03 | `coupon-security.integration` | ☑ |
| **SC-S02** | 券 FSM PBT | `coupon-pbt.integration` | ☑ |
| **SC-S03** | Rewards mutation | `test:rewards:mutation` | ☐ |
| **SC-S04** | Moderation mutation | `test:moderation:mutation` | ☑ |
| **SC-S05** | Moderation PBT | `test:integration:moderation:pbt` | ☑ |
| **SC-S06** | E2E 關鍵路徑不可 silent skip | TC-E13 hard-fail policy | ☐ |

---

## 3. 執行命令

```bash
# 只檢查 §2 登記表是否全部 ☑（唔跑 test）
bun run test:staging:certify --check-ssot

# 完整認證（gate + nightly + security；SSOT 未全 ☑ 會 exit 1）
bun run test:staging:certify

# 認證通過後 Partner M0
# 見 PARTNER_QA.md
```

---

## 4. Deploy 流程

1. 工程：`test:staging:certify` 綠 → 更新本表相關行 ☑（若 artifact 已達標）  
2. Deploy staging + `db push`  
3. Partner：M0 only（**唔**做 regression）  
4. 記錄：signoff log 路徑 + certify 時間戳

---

## Changelog

| 日期 | 變更 |
|------|------|
| 2026-08-16 | 綁定 system-feature-registry 終極功能表 |
| 2026-08-16 | 初版：SC 登記表 · certify 腳本 |
