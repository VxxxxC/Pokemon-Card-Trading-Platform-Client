# Partner Regression SSOT — UI / 探索性 bug 自動化

> **版本：** v1.0 · **更新：** 2026-08-20  
> **範圍：** [system-feature-registry.md](./system-feature-registry.md) 全 **67** 項 in-scope（Member / Merchant / Admin / System）；**唔包** [v3-deferred.md](./v3-deferred.md)。  
> **來源：** Partner `bugs_finding.org` · 工程探索性 QA · 新 bug **先寫 failing spec 再 fix**。

---

## 0. 與其他 SSOT 嘅關係（四層合一）

| 層 | SSOT | 驗咩 | 命令 |
|----|------|------|------|
| **L1 Gate** | [staging-certification.md](./staging-certification.md) SC-G* | 金流合約 · signoff · mutation | `test:staging:certify` |
| **L2 Feature** | [system-feature-registry.md](./system-feature-registry.md) F-* | T0–T3 有無 artifact · CI 接入 | `test:staging:certify:check-ssot` |
| **L3 Journey** | [test-coverage-ssot.md](./test-coverage-ssot.md) J-* / TC-* | Solidity S0–S2 · Path Fixture/Partner | gate / nightly / rewards |
| **L4 Partner** | **本文件** P-* | **UI-first** · 顯示層 assert · 跨頁狀態 | `test:e2e:partner` |

**North star（v2.5 起）：**

```text
F-* 全 ☑  +  test:staging:certify 綠  +  SC-P0 全 ☑  +  Partner M0
= Staging 可俾人用（Partner 探索性 bug 有自動化守衛）
```

**誠實邊界：** L1–L3 綠 **唔保證** Partner log 下半部全清；L4 先針對 **Partner-path 顯示／同步** bug。

---

## 1. 進度總覽（rollup）

| 匯總 ID | 條件 | 進度 |
|---------|------|------|
| **SC-P0** | §2 [#A] P-A01–P-A08 **全 ☑** | ☑ |
| **SC-P1** | §3 [#B] 全 ☑ | ☑ |
| **SC-P2** | §4 [#C] P-C01–P-C03 **全 ☑**（P-C04 預留） | ☑ |
| **SC-P-FX** | §5 每 F-* 至少 1 條 P-TC ☑（Phase 3） | ☑ |
| **SC-P-ALL** | SC-P0 + certify 綠 + M0 | ☐ |

**統計（2026-08-20）：** P0 **8/8 ☑** · P1 **9/9 ☑** · P2 **3/3 ☑**（P-C04 預留） · F-* Partner 覆蓋 **67/67 ☑**。

---

## 2. P0 — Partner [#A]（必須先綠）

> **守則：** UI 操作為主 · 禁止 sole reliance on `update` bypass · assert 可見 UI（stepper / dialog / badge / URL / invoice 行）。

| ID | Partner 摘要 | 功能 | Spec（目標） | Path | In CI | 進度 |
|----|-------------|------|--------------|------|-------|------|
| **P-A01** | 裸卡 + 開鑑定 toggle 後 marketplace 買家 toggle 仍 disable | F-C-03 · F-M-07 | `e2e/partner/merchant/p-a01-inventory-auth-marketplace.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A02** | 48h 待付款過期後 listing 唔 reactivate · 雙方仍待付款 | F-S-12 · F-C-11 | `e2e/partner/system/p-a02-pending-payment-expiry-ui.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A03** | B2C 鑑定 + 寄貨 · buyer stepper 錯顯示面交 4 steps | F-M-17 · F-C-10 | `e2e/partner/member/p-a03-b2c-auth-stepper-courier.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A04** | B2C 鑑定確認收貨冇 confirm dialog | F-M-17 | `e2e/partner/member/p-a04-b2c-auth-confirm-dialog.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A05** | C2C 鑑定 seller「實收總額」同 FPS 預計唔一致 | F-M-16 · F-M-17 | `e2e/partner/member/p-a05-c2c-auth-seller-invoice.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A06** | C2B merchant seller 實收（待驗） | F-C-11 · F-C-13 | `e2e/partner/merchant/p-a06-c2b-seller-invoice.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A07** | Chat 㩒 member 頭像 → 錯跳 merchant profile | F-M-13 | `e2e/partner/system/p-a07-chat-avatar-persona.spec.ts` | Partner | Partner nightly | ☑ |
| **P-A08** | 新對話收件匣 icon 冇綠點 | F-M-13 | `e2e/partner/system/p-a08-inbox-unread-badge.spec.ts` | Partner | Partner nightly | ☑ |

**外部 ID 對照：** `bugs_finding.org` Stripe/Escrow § Member-Merchant § Chatroom [#A] 項。

---

## 3. P1 — Partner [#B]

| ID | Partner 摘要 | 功能 | Spec（目標） | 進度 |
|----|-------------|------|--------------|------|
| **P-B01** | 首頁走馬燈港元符號 | F-M-04 | `e2e/partner/member/p-b01-home-ticker-currency.spec.ts` | ☑ |
| **P-B02** | 首頁走馬燈仍為 mock data | F-M-04 | `e2e/partner/member/p-b02-home-ticker-live-data.spec.ts` | ☑ |
| **P-B03** | 認證商家 carousel redirect 顯示 member username | F-M-04 | `e2e/partner/member/p-b03-certified-merchant-carousel.spec.ts` | ☑ |
| **P-B04** | Merchant trading「只顯示 RAW」filter 失效 | F-C-02 | `e2e/partner/merchant/p-b04-raw-filter.spec.ts` | ☑ |
| **P-B05** | 已完成訂單 chat 仍顯示付款 button | F-M-13 | `e2e/partner/system/p-b05-chat-paid-order-cta.spec.ts` | ☑ |
| **P-B06** | 已完成訂單仍可進 checkout（button disabled） | F-M-19 | `e2e/partner/member/p-b06-checkout-completed-guard.spec.ts` | ☑ |
| **P-B07** | Member order detail invoice 冇顯示券扣減 | F-M-19 | `e2e/partner/member/p-b07-order-invoice-coupon.spec.ts` | ☑ |
| **P-B08** | BGS/CGC 長 grading label 新增失敗（varchar） | F-M-10 · F-C-03 | `e2e/partner/member/p-b08-grading-long-label.spec.ts` | ☑ |
| **P-B09** | Marketplace 最低價 seller 名稱同 badge 不一致 | F-M-05 | `e2e/partner/member/p-b09-product-card-seller-badge.spec.ts` | ☑ |

---

## 4. P2 — Partner [#C]

| ID | Partner 摘要 | 功能 | Spec（目標） | 進度 |
|----|-------------|------|--------------|------|
| **P-C01** | Member trading filter chips 數字錯 | F-M-18 | `e2e/partner/member/p-c01-trading-filter-counts.spec.ts` | ☑ |
| **P-C02** | Logout 後 login 另一帳號 chat cache 殘留 | F-M-13 | `e2e/partner/system/p-c02-chat-session-isolation.spec.ts` | ☑ |
| **P-C03** | 對話記錄唔完整／延遲出現 | F-M-13 | `e2e/partner/system/p-c03-chat-history-sync.spec.ts` | ☑ |
| **P-C04** | （預留） | — | — | ☐ |

---

## 5. Feature → Partner TC 覆蓋（Phase 3 目標）

每個 **F-*** 至少 **1** 條 `e2e/partner/**` spec（可以合併多功能，但 ID 要喺 spec 註解標明）。

| 域 | 功能數 | Partner spec 目標數 | 現有 | 進度 |
|----|--------|---------------------|------|------|
| Member F-M-* | 26 | ≥26 | 26 | ☑ |
| Merchant F-C-* | 13 | ≥13 | 13 | ☑ |
| Admin F-A-* | 15 | ≥15（T0 可合併 smoke） | 15 | ☑ |
| System F-S-* | 13 | ≥13 | 13 | ☑ |

**P-F 合併 smoke（Phase 3，已綠）：**

| ID | 摘要 | 功能 | Spec |
|----|------|------|------|
| **P-F01** | Member auth／dashboard／settings | F-M-01 · 02 · 03 · 09 · 12 | `e2e/partner/member/p-f01-member-auth-shell.spec.ts` |
| **P-F02** | 市集／profile／inventory／trading／legal | F-M-06 · 08 · 11 · 14 · 15 · 24 · 25 · F-S-05 · 11 · 13 | `e2e/partner/member/p-f02-member-discovery.spec.ts` |
| **P-F03** | 積分錢包＋舉報 dialog | F-M-20 · 21 · 22 | `e2e/partner/member/p-f03-member-rewards-moderation.spec.ts` |
| **P-F04** | Merchant ops＋member-seller trading | F-C-01 · 04–09 · F-M-26 | `e2e/partner/merchant/p-f04-merchant-shell.spec.ts` |
| **P-F04B** | Member KYC 申請頁 | F-C-08 | `e2e/partner/member/p-f04b-merchant-kyc-apply.spec.ts` |
| **P-F05** | Admin workbench T0 合併 | F-A-01–14 · 05b · F-M-23 · F-S-01–04 · 07 · 09 · 10 | `e2e/partner/admin/p-f05-admin-ops-smoke.spec.ts` |

其餘 F-* 由現有 P-A／P-B／P-C `@features` 覆蓋（例如 F-C-02＝P-B04、F-S-12＝P-A02）。P-F 新 smoke 已綠；**SC-P-ALL 仍 ☐**（等 M0）。

**Phase 路線：**

| Phase | 內容 | 完成條件 |
|-------|------|----------|
| **P0** | §2 八條 [#A] | SC-P0 ☑ |
| **P1** | §3 [#B] | SC-P1 ☑ |
| **P2** | §4 [#C] | SC-P2 ☑ |
| **P3** | §5 每 F-* 1 spec | SC-P-FX ☑ |

---

## 6. 寫 spec 契約

```ts
// e2e/partner/member/p-a03-....spec.ts
// @partner-id P-A03
// @features F-M-17, F-C-10
// @path Partner (no DB seed for listing auth — use inventory UI)
```

| 規則 | 說明 |
|------|------|
| 目錄 | `e2e/partner/{member,merchant,admin,system}/` |
| 命名 | `p-{a\|b\|c}{nn}-{slug}.spec.ts` |
| Skip | 只允許 `test.skip(!hasXEnv())`；**禁止** skip 因為 bug 未修 |
| Assert | 優先 `getByRole` / 可見文字 / `toHaveURL` / step 數量 |
| 更新 | bug fix PR **必須** 將對應 P-* 改 ☑ |

---

## 7. 命令與 CI 接入

```bash
# Partner suite only（Playwright）
bun run test:e2e:partner

# SSOT 掃描 Partner 進度（唔跑 test）
bun run test:partner:check-ssot

# 完整認證（gate + nightly + partner check 可選）
bun run test:staging:certify
```

| Job | 時機 | 內容 |
|-----|------|------|
| **PR optional** | backend/UI PR 觸碰相關域 | 單條 `playwright test e2e/partner/.../p-a0N-...` |
| **Nightly** | HKT 03:00 後 | `test:e2e:partner`（Phase 1 起） |
| **Pre-M0** | certify 綠之後、Partner 簽收之前 | SC-P0 必須 ☑ |

---

## 8. 更新流程（新 bug / fix）

1. Partner 登記 `bugs_finding.org` → 工程喺 **§2–4** 加 **P-*** 行（預設 ☐）  
2. 加 `e2e/partner/...` failing spec（或 `test.fixme` 僅限 48h 內要 fix）  
3. Fix product → spec 綠 → 本表 **☑**  
4. 若屬 gate 已覆蓋域：更新 [test-coverage-ssot.md](./test-coverage-ssot.md) 對應 J/TC **Path** 欄為 `Both` 或 **Solid** 升至 S2  

---

## 9. 與功能表「進度」欄嘅關係

| 符號 | 含義 |
|------|------|
| F-* **☑** | T0–T3 artifact 存在 + CI 接入（**唔代表** Partner TC 已做） |
| P-* **☑** | Partner-path 回歸已守 |
| **SC-FX-ALL** | F-* 全 ☑ + certify 綠（現行） |
| **SC-P-ALL** | 上列 + **SC-P0** 全 ☑（建議 M0 前門檻） |

建議：**Staging 首次 Partner 簽收** 用 **SC-P-ALL**；日常 deploy 用 **M0**（certify + SC-P0 已長期綠）。

---

## Changelog

| 日期 | 變更 |
|------|------|
| 2026-08-20 | Phase 3：P-F01–F05 Partner smoke 綠 · F-* **67/67** · **SC-P-FX ☑**（SC-P-ALL 仍等 M0） |
| 2026-08-20 | P-B01–B09 · P-C01–C03 Partner 全綠 · SC-P1／SC-P2 ☑；P-B04 修 merchant RAW filter（SaleOrder 空 company 誤判） |
| 2026-08-19 | 寫入 P-C01–P-C03 Partner P2 spec（未跑；等 p86 完） |
| 2026-08-19 | 寫入 P-B01–P-B09 Partner P1 spec（未跑；等 p86 完） |
| 2026-08-19 | P-A01–P-A08 Partner P0 全綠 · SC-P0 ☑ |
| 2026-08-18 | v1.0：四層 SSOT · P-A/B/C 登記表 · F-* 覆蓋 Phase · 命令契約 |
