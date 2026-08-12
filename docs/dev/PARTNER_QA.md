# Partner QA — 上線前人手簽收（SSOT）

> **Status:** ⬜ 待 Partner 簽收  
> **更新：** 2026-08-12  
> **環境：** staging only · 勿用 production 真實用戶  
> **Dev 前提：** `test:prelaunch:gate:1a` + `test:prelaunch:gate:1b` 全綠 · staging `bunx supabase db push` 對齊 **`20260924150000`** 及以前 migrations

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
| **1a** | `tsc` · grading integration · fail/pass Stripe smoke · moderation full gate · **`test:integration:fps-payout`** · **`test:integration:merchant-connect-payout`** · `build:ci` |
| **1b** | `test:rewards:gate`（checkout 券、reconcile、搶券）· **I-H14** moderation Stripe 售後退款 |
| **鑑定 pass** | G-BP-S1 `member_auth` single-capture pass（真 PI） |
| **FPS 出賬** | `test:integration:fps-payout` — 1A confirm · 1B finalize · admin 銷帳 → `paid`（獨立 full gate：`test:fps-payout:gate`） |
| **Merchant Connect 出賬** | `test:integration:merchant-connect-payout` — held candidate · admin retry RPC · finalize_failed（1a 已含） |

詳見 [prelaunch-gate.md](./prelaunch-gate.md)。

---

## 必做（Must-do）— 約 1.5–2 小時

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

### M6 — Member FPS 出賬（~15 min）

與 [capture-policy.md](./capture-policy.md) · [member-fps-payout/e2e-checklist.md](./follow-up/member-fps-payout/e2e-checklist.md) 對齊。**Gate 已驗** RPC／fee／銷帳 sync；Partner 只做 staging 肉眼 4 步：

| ⬜ | # | 步驟 | 預期 |
|----|---|------|------|
| | **6.1** | 新鑑定單（`escrow_capture_model=single`）+ 真 Stripe test mode 付款 | `authorized` → 入庫後仍未 capture 商品款 |
| | **6.2** | Admin `/admin/grading` 鑑定通過 | 一次 full capture；`fully_captured` |
| | **6.3** | 出庫 → **Buyer** 確認收貨 | Seller 見 T+3 hold（`seller_payout_status=held`） |
| | **6.4** | T+3 後 Admin `/admin/payouts` FPS 銷帳（**必填 FPS 參考**） | `payout_requests.completed`；seller「已撥款」 |

### M7 — Merchant Connect 出賬（~10 min）

與 [admin-payouts/e2e-checklist.md](./follow-up/admin-payouts/e2e-checklist.md) 對齊。**Gate 已驗** held/retry/finalize_failed；Partner 只做 staging 肉眼 4 步：

| ⬜ | # | 步驟 | 預期 |
|----|---|------|------|
| | **7.1** | Dev 跑 `bun run seed:merchant-connect-payout-e2e` | JSON 輸出 `heldOrderId`、`failedOrderId`、兩筆 `orderNumber` |
| | **7.2** | Admin `/admin/payouts` → **「💳 商戶流水 (Stripe)」** → chip「保留中（T+7）」→ 搜尋 held `orderNumber` | 見 held 列；撥款時間「保留至 …」（未來 T+7） |
| | **7.3** | chip「已失敗」→ 搜尋 failed `orderNumber` | 見 failed 列；操作欄 **重試撥款** |
| | **7.4** | （可選，staging 有 Stripe）點 **重試撥款** | toast 成功或明確錯誤；唔白屏 |

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
| | ~~**O3**~~ | ~~Member FPS T+3 → Admin 銀行轉帳銷帳~~ | **已併入 M6** |
| | **O4** | Merchant KYC → Stripe Connect onboarding | 若本次 release 含商戶 onboarding |
| | **O5** | 首頁 P1 空狀態 copy、相對時間 zh-Hant | 拋光 |

---

## 簽收

| 區塊 | 簽收 |
|------|------|
| M1–M7 必做 | ⬜ |
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
| [capture-policy.md](./capture-policy.md) | Single vs legacy multicapture |
| [follow-up/member-fps-payout/e2e-checklist.md](./follow-up/member-fps-payout/e2e-checklist.md) | M6 FPS 細節 |
| [follow-up/admin-payouts/e2e-checklist.md](./follow-up/admin-payouts/e2e-checklist.md) | M7 Merchant Connect 細節 |
| [follow-up/home-sections/PARTNER_REPORT.md](./follow-up/home-sections/PARTNER_REPORT.md) | 首頁技術報告 |
| [follow-up/platform-rewards-v2/QA_CHECKLIST.md](./follow-up/platform-rewards-v2/QA_CHECKLIST.md) | Rewards 歷史簽收記錄 |
