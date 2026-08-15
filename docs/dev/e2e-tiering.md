# E2E tiering — Gate / Nightly / Manual

> **目的：** 避免誤稱「repo 內每個 e2e spec 都已入 production gate」。  
> **SSOT 簽收：** [PRODUCTION_GATE.md](./PRODUCTION_GATE.md) · Partner：[PARTNER_QA.md](./PARTNER_QA.md)

## Gate（`bun run test:production:gate:signoff`）

| 套件 | Spec 範例 |
|------|-----------|
| Rewards | `platform-rewards-phase2/3/4` · `rewards-checkout-coupon` · `merchant-auth-baseline-checkout` ·（opt-in）`platform-rewards-matrix` |
| Moderation | `user-report` · `admin-moderation` · `report-outcome-notification` |
| Smoke | `home-p0-smoke` · `legal-pages-smoke` |
| Grading / Stripe | `admin-grading` · `moderation-stripe-refund-smoke` |

## Nightly / PR optional（v2.2+）

唔阻 v2.1 merge；建議 CI nightly 或 label 觸發。

| 優先 | Spec | 說明 |
|------|------|------|
| P2 | `member-trading-p2p.spec.ts` · `member-offer-negotiation.spec.ts` | C2C 主流程 |
| P2 | `global-chat-realtime.spec.ts` | Chat realtime |
| P3 | `merchant-product-detail.spec.ts` · `marketplace-search-offer.spec.ts` | 瀏覽/下單入口 |
| P3 | `admin-announcements.spec.ts` · `member-dashboard.spec.ts` | Admin/用戶周邊 |
| P3 | `member-collection-*.spec.ts` · `member-inventory.spec.ts` | Collection 周邊 |

## Manual（Partner）

| 場景 | 頻率 |
|------|------|
| **M1** 四頁煙霧（disputes / grading / rewards / payouts） | **每次 staging deploy** |
| **M3.1** 一條退款肉眼 | **首次 prod cutover 前**（可選） |
| M2–M7 | v2.1 gate 覆蓋後 **日常 skip** |
