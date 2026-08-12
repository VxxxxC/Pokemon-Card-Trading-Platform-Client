# Partner QA — 上線前人手簽收（SSOT）

> **Status:** ⬜ 待 Partner 簽收  
> **更新：** 2026-08-12  
> **環境：** staging only · 勿用 production 真實用戶  
> **Dev 前提：** `test:prelaunch:gate:1a` + `test:prelaunch:gate:1b` 全綠 · staging `bunx supabase db push` 對齊 `20260916160000` 及以前 migrations

本頁為 **唯一 Partner 人手清單**。Logic／回歸已由 prelaunch gate 覆蓋；Partner **唔**重跑 integration / E2E 業務規則。

---

## 測試帳號（staging）

| 角色 | 來源 |
|------|------|
| Buyer | `E2E_BUYER_EMAIL` / `E2E_BUYER_PASSWORD` |
| Seller | `E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD` · `E2E_SELLER_ID` |
| Admin | `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD` |

---

## Gate 已覆蓋（Partner 勿重測）

| Gate | 已自動驗 |
|------|----------|
| **1a** | `tsc` · grading integration · fail/pass Stripe smoke · moderation full gate · `build:ci` |
| **1b** | `test:rewards:gate`（checkout 券、reconcile、搶券）· **I-H14** moderation Stripe 售後退款 |
| **鑑定 pass** | G-BP-S1 `member_auth` single-capture pass（真 PI） |

詳見 [prelaunch-gate.md](./prelaunch-gate.md)。

---

## 必做（Must-do）— 約 1–1.5 小時

建議 **一次 staging session** 按序完成；簽收欄打勾即可。

### M1 — Staging 煙霧（~3 min）

| ⬜ | 步驟 | 預期 |
|----|------|------|
| | Admin + Buyer 登入 staging | 無 auth 錯誤 |
| | 開 `/admin/disputes` | 無 5xx／白屏 |
| | 開 `/admin/grading` | 無 5xx／白屏 |
| | 開 `/profile/user/rewards` | 無 5xx／白屏 |

### M2 — 舉報主線（~10 min）

| ⬜ | 步驟 | 預期 |
|----|------|------|
| | **Buyer** — chat 或 public profile 舉報 seller（惡意欺詐） | 「舉報信號已受理」 |
| | **Admin** — `/admin/disputes` → 開該案 →「駁回舉報」→ 執行裁定 | 成功、無錯誤 |
| | **Buyer** — `/profile/user` →「舉報結果通知」modal →「我知道了」 | reload 後唔再彈 |

### M3 — 退款政策 spot check（~30–45 min）

與 M2 同批。政策 SSOT：[refund-policy.md](./refund-policy.md)。

| ⬜ | # | 場景 | 預期 |
|----|---|------|------|
| | **3.1** | Member 鑑定 fail（**seller fault**）→ admin finalize | 買家 Stripe 退款 ≈ 訂單總額 T（含鑑定費 D） |
| | **3.2** | 鑑定 fail（**buyer fault**）→ finalize | 買家收回 A+B+C；D 留平台（難造數可改 admin 預覽肉眼） |
| | **3.3** | 鑑定 **pass** → 買家確認 → 售後爭議（seller fault） | 退 A+C，唔退 D；Member 窗口 3 日 / Merchant 7 日 |
| | **3.4** | **P2P 面交** 訂單舉報 | Admin dispute **無** order refund finalize；僅制裁／記錄 |

### M4 — 條款與 checkout 披露（~5 min）

| ⬜ | 步驟 | 預期 |
|----|------|------|
| | 開 `/terms`、`/privacy` | 可讀、無 500 |
| | 鑑定／商戶 checkout 步驟 | 有條款或政策連結（草案 banner 可接受至法務審閱） |

### M5 — 首頁 P0（~15 min）

Guest + 登入各走一次 `/`。

| ⬜ | 步驟 | 預期 |
|----|------|------|
| | Guest：merchant + C2C 區塊 | 真數據或空狀態；無心水／簽到 |
| | 登入：簽到區可見；有心水時顯示 wishlist strip | 價格 fallback 合理 |
| | C2C「立即購買」 | 開 slide-over；登入後 submit 可到 chat |
| | 商品連結 | 開 `/marketplace/product/{productId}` |

---

## 建議（Recommended）— +~45 min

| ⬜ | ID | 內容 | 時間 |
|----|-----|------|------|
| | **R1** | 舉報 dialog、admin 工作台、結果 modal 中文／按鈕位置 | ~5 min |
| | **R2** | 售後 carrier breakdown；dispute 預覽與 finalize 一致 | ~15 min |
| | **R3** | **Rewards G2.6**：Admin 設每人終身限兌 → 達限「已達上限」+ redeem 拒絕 | ~10 min |
| | **R4** | 鑑定單 + 券：staging 肉眼 Stripe PI／capture（gate 已驗 logic） | ~15 min |

---

## 可選（Optional）

| ⬜ | ID | 內容 | 備註 |
|----|-----|------|------|
| | **O1** | 鑑定 pass staging 全鏈（付款→入庫→pass→出庫→確認） | G-BP-S1 已驗 capture；可 skip |
| | **O2** | 鑑定 fail seller fault → 待追償 → 寄回 | [admin-grading/PARTNER_HANDOFF.md](./follow-up/admin-grading/PARTNER_HANDOFF.md) |
| | **O3** | Member FPS T+3 → Admin 銀行轉帳銷帳 | [member-fps-payout/e2e-checklist.md](./follow-up/member-fps-payout/e2e-checklist.md) |
| | **O4** | Merchant KYC → Stripe Connect onboarding | 若本次 release 含商戶 onboarding |
| | **O5** | 首頁 P1 空狀態 copy、相對時間 zh-Hant | 拋光 |

---

## 簽收

| 區塊 | 簽收 |
|------|------|
| M1–M5 必做 | ⬜ |
| R1–R4 建議 | ⬜ |
| O* 可選 | ⬜ |

**Partner 簽名：** _______________ **日期：** ___________

---

## 不在 Partner 範圍（v2 / 全站 batch）

| 項目 | 時程 |
|------|------|
| Moderation Phase F 自動升級 cron | v2 |
| Email / Push 全站（含被罰用戶通知） | Pre-v1 batch |
| 申訴 portal · Listing 頁舉報 | v2 |
| Auction 競標（仍 mock） | 隱藏或 v2 |

---

## Dev 參考（Partner 唔使跑）

| 文件 | 用途 |
|------|------|
| [prelaunch-gate.md](./prelaunch-gate.md) | Dev gate 命令 |
| [follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md](./follow-up/admin-moderation/PARTNER_QA_SIGNOFF.md) | Moderation automation backlog |
| [follow-up/admin-grading/PARTNER_HANDOFF.md](./follow-up/admin-grading/PARTNER_HANDOFF.md) | 鑑定操作細節（O1/O2） |
| [follow-up/home-sections/PARTNER_REPORT.md](./follow-up/home-sections/PARTNER_REPORT.md) | 首頁技術報告 |
| [follow-up/platform-rewards-v2/QA_CHECKLIST.md](./follow-up/platform-rewards-v2/QA_CHECKLIST.md) | Rewards 歷史簽收記錄 |
