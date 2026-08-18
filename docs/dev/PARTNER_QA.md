# Partner QA — Staging 人手簽收

> **Status:** ⬜ 待 Partner 簽收  
> **更新：** 2026-08-16  
> **環境：** staging only · 勿用 production 真實用戶

**Dev 前提：** [system-feature-registry.md](./system-feature-registry.md) **全 ☑** + `test:staging:certify` 綠 + **[partner-regression.md](./partner-regression.md) SC-P0 全 ☑** + `test:e2e:partner` 綠

Logic／回歸／安全由 [staging-certification.md](./staging-certification.md) 覆蓋；Partner **唔**重跑 gate integration，但 **P0 UI bug 已由 `e2e/partner` 守衛**。

---

## 測試帳號（staging）

| 角色 | 來源 |
|------|------|
| Buyer | `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` |
| Seller | `E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD` · `E2E_SELLER_ID`（**須為同一 merchant 帳號**） |
| Admin | `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` |

---

## 每次 staging deploy（必做 ~5 min）— **M0**

> 僅當工程已跑 `bun run test:staging:certify` 綠。未認證時請聯絡工程，**唔**自行 deep regression。

| ⬜ | 步驟 | 預期 |
|----|------|------|
| ⬜ | Admin + Buyer 登入 | 無 auth 錯誤 |
| ⬜ | 開 `/admin/disputes` | 無 5xx／白屏 |
| ⬜ | 開 `/admin/grading` | 無 5xx／白屏 |
| ⬜ | 開 `/profile/user/rewards` | 無 5xx／白屏 |
| ⬜ | 開 `/terms`、`/privacy` | 可讀、無 500 |

**Partner 簽名：** _______________ **日期：** ___________

---

## 首次 production cutover 前（可選 +15 min）

| ⬜ | 步驟 | 預期 |
|----|------|------|
| ⬜ | Admin `/admin/disputes` — 開一案 | UI／中文／按鈕正常 |
| ⬜ | （可選）售後退款失敗單 → **重試退款** | toast 成功或明確錯誤；唔白屏 |

---

## 唔使人手做（Staging 認證已驗）

見 [staging-certification.md](./staging-certification.md) SC 表 — 券／退款／鑑定／FPS／Connect／moderation Stripe／rewards E2E／security mutation 等。

---

## 不在 Partner 範圍

見 [v3-deferred.md](./v3-deferred.md)
