# Partner QA — 退款政策 Spot Check

> **Status:** ⬜ 待 staging push 後與 [P1 煙霧](../admin-moderation/PARTNER_QA_SIGNOFF.md) **一次過簽**  
> **SSOT：** [refund-policy.md](../../refund-policy.md) · [rollout plan](../refund-policy-rollout-plan.md) §PR4  
> **環境：** staging only · 勿用 production 真實用戶

---

## 前提

- [ ] Staging Supabase migrations 已 push 至 `20260915120000`（含 PR2–PR3C）
- [ ] Dev gate 全綠：`bun run test:moderation:gate:full`
- [ ] 對外條款草案已上線：`/terms`、`/privacy`（法務審閱中）

**唔入 P1 必做項** — 避免 Partner 在 migrations 未齊時提早跑。Push 後用本清單追加簽收即可。

---

## Spot check 清單（必做 4 條）

### 1. Seller fault 鑑定 fail → 買家全額（含 D）

| 步驟 | 預期 |
|------|------|
| 建立 member_auth 訂單 → 入庫 → admin 鑑定 fail（seller fault） | Admin 可 finalize 退款 |
| 檢查買家 Stripe 退款金額 | 等於訂單總額 T（A+B+C+D） |
| Admin dispute 預覽面板 | breakdown 顯示 D 可退 |

**參考：** [admin-grading/PARTNER_HANDOFF.md](../admin-grading/PARTNER_HANDOFF.md)

### 2. Buyer fault 鑑定 fail → 買家 A+B+C，D 留平台

> **註：** 主線極少觸發；logic 已由 integration 覆蓋。若 staging 難造數，可改為 admin 預覽 RPC 肉眼確認。

| 步驟 | 預期 |
|------|------|
| 鑑定 fail（buyer fault）→ finalize | 買家收回卡價+運費（A+B+C） |
| 鑑定費 D | 留平台，唔退買家 |

### 3. Pass 後售後 seller fault → A+C，唔退 D

| 步驟 | 預期 |
|------|------|
| 鑑定 pass → 買家確認收貨 → 3 日內開售後爭議 | 窗口內可申請 |
| Admin 裁定 seller fault → finalize | 退 A+C；D 唔退 |
| Member 窗口 | 3 曆日；Merchant 為 7 曆日 |

### 4. P2P 舉報 → 無退款選項

| 步驟 | 預期 |
|------|------|
| Member P2P 面交訂單 → 買家舉報 | Admin dispute 頁 **無** order refund finalize |
| 裁定結果 | 僅制裁／記錄，唔走 Stripe 退款 |

---

## 可選（建議）

| 項目 | 預期 |
|------|------|
| Carrier fault 售後 | breakdown 按 carrier 規則；fee 分攤合理 |
| Admin refund preview panel | `/admin/disputes/[id]` 預覽與實際 finalize 一致 |
| Checkout 披露 | 鑑定託管／商戶加購鑑定步驟顯示條款連結 |

---

## 簽收

| 項目 | 簽收 |
|------|------|
| Spot check #1–#4 | ⬜ |
| 可選 carrier / preview | ⬜ |

**Partner 簽名：** _______________ **日期：** ___________
