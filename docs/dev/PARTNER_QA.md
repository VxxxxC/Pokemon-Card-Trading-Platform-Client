# Partner QA — Staging 人手簽收

> **Status:** ⬜ 待 Partner 簽收  
> **更新：** 2026-08-16  
> **環境：** staging only · 勿用 production 真實用戶

**Dev 前提：** [`test:production:gate:signoff`](./PRODUCTION_GATE.md) 全綠 · staging `bunx supabase db push` 至 **`20260928150000`**（或 repo 最新 migration）

Logic／回歸由 [PRODUCTION_GATE.md](./PRODUCTION_GATE.md) 覆蓋；Partner **唔**重跑 integration / E2E 業務規則。

---

## 測試帳號（staging）

| 角色 | 來源 |
|------|------|
| Buyer | `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` |
| Seller | `E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD` · `E2E_SELLER_ID`（**須為同一 merchant 帳號**） |
| Admin | `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` |

---

## 每次 staging deploy（必做 ~5 min）

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

## 唔使人手做（Gate 已驗）

退款規則 · 券 FSM · 鑑定 fail/pass · FPS / Connect 出賬 · moderation Stripe · rewards E2E · home/legal smoke · merchant 未付款過期（S0-05）· 退款 retry（C7）

日常 **唔使** 跑舉報全鏈、退款 spot check、FPS/Connect 全鏈、首頁 P0 深度 — 見 [e2e-tiering.md](./e2e-tiering.md) · [v2.1-deferred.md](./v2.1-deferred.md)

---

## 不在 Partner 範圍

Auction · 申訴 portal · 全站 Email/Push · Moderation Phase F cron — 見 [v2.1-deferred.md](./v2.1-deferred.md)
