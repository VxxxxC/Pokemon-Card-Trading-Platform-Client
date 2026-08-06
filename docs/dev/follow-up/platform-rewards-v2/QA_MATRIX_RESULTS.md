# 平台獎勵 v2 — 全矩陣 QA 結果

> 執行指令：
> - `bun run test:e2e:rewards` — phase2 + phase3 + matrix
> - `bun run test:e2e:stripe-reconcile` — PI 對帳 + Connect 出款補差（獨立，較慢）

## Stripe 對帳 / 出款（`platform-rewards-stripe-reconcile`）

| ID | 情境 | E2E |
|----|------|-----|
| R1 | PI `amount` = DB `buyer_total_amount`（免運券 direct） | ✅ |
| R2 | 有補貼出款：`merchant_payout > buyer_total` → transfer **無** `source_transaction` | ✅ |
| R3 | 無券出款：`merchant_payout <= buyer_total` → transfer **有** `source_transaction` | ✅ |
| B1+ | phase2 B1 在設 `STRIPE_SECRET_KEY` 時加 PI assert | ✅ |

**所需 env（reconcile 專用）：** `STRIPE_SECRET_KEY`、`E2E_SELLER_EMAIL` / `E2E_SELLER_PASSWORD`（須對應 `E2E_SELLER_ID` 與 listing 擁有者）、`bun run stripe:webhook:listen`。

## 券種 × 情境矩陣

| 券種 | 發放方式 | 情境 | E2E | 備註 |
|------|----------|------|-----|------|
| `discount_coupon` | `auto_grant` + `trade_count` 買家 | 後台發布 → RPC 自動發放 | ✅ matrix M-G1 | |
| `free_shipping` | `auto_grant` + `trade_count` 買家 | 後台發布 → RPC 自動發放 | ✅ matrix M-G2 | |
| `points` | `auto_grant` + `trade_count` 買家 | 後台發布 → `point_ledger` 入帳 | ✅ matrix M-G3 | |
| `discount_coupon` | `auto_grant` | 可解鎖 tab 進度（5 筆門檻） | ✅ matrix M-M1 | |
| `discount_coupon` | `flash_only` | 搶券 / 庫存 / 每日上限 | ✅ phase3 C3.x | |
| `free_shipping` | `flash_only` | 不出現在可解鎖 tab | ✅ matrix M-M3 | |
| `free_shipping` | 手動入錢包 | merchant_direct + 順豐 checkout | ✅ phase2 B1 | 補貼金額隨 listing 運費 |
| `discount_coupon` | 手動入錢包 | 最低消費符合 / 不符合 | ✅ phase2 B2 | |
| `free_shipping` / `discount` | 手動入錢包 | 切換券 / 清除券 | ✅ phase2 B3.4–B3.5 | |
| `free_shipping` | 手動入錢包 | 面交不符合 | ✅ phase2 B3.3 | |
| `free_shipping` | 手動入錢包 | checkout 開啟鑑定開關清空選券 | ✅ phase2 B3.1 | |
| `discount_coupon` | 手動入錢包 | merchant_auth checkout | ✅ phase2 B2b.1 | |
| `free_shipping` | 手動入錢包 | merchant_auth checkout | ✅ phase2 B2b.2 | |
| 封存 `CHECK_IN_DAY7_BONUS` | — | 不可解鎖列表 | ✅ matrix M-M2 | |
| 簽到計劃 | — | Admin `?tab=check-in` 載入 | ✅ matrix M-A2 | |
| 獎勵活動列表 | — | Admin campaigns 載入 | ✅ matrix M-A1 | |

## 仍建議人工點一輪（E2E 未覆蓋或僅部分覆蓋）

| 情境 | 原因 |
|------|------|
| `event_once`（完善資料 / 首次上架 / 註冊完成） | 需真實事件觸發鏈，matrix 以 `trade_count` 代表 auto_grant |
| 商戶角色 `trade_count` | 未單獨開 case |
| 付款取消 / 48h cron 釋放券 | phase2 B3.6 未自動化 |
| 鑑定失敗 void 還券 | Part D3.3 未自動化 |
| T+7 Connect 出款補差 | ~~Part B4 可選~~ → **R2/R3 已自動化**（`test:e2e:stripe-reconcile`） |
| Admin 搶券檔期暫停/恢復 UI | ✅ phase3 C3.8 |
| 簽到計劃儲存（7 日階梯 + completion bonus） | 僅 smoke 載入，未測儲存 |

## 執行紀錄

- 新增 `e2e/platform-rewards-stripe-reconcile.spec.ts`：PI 對帳 + 出款 `source_transaction` 規則
- `bun run test:e2e:rewards` 請在具備 `E2E_ADMIN_*`、`E2E_BUYER_*`、`E2E_LISTING_ID`、Stripe 測試模式與 `SUPABASE_SERVICE_ROLE_KEY` 的環境執行
- `bun run test:e2e:stripe-reconcile` 另需 `STRIPE_SECRET_KEY` 與 seller 帳號對齊 listing
- Partner 人手清單：[PARTNER_CHECKLIST.md](./PARTNER_CHECKLIST.md)
