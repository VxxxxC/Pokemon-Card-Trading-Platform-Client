# Member Auth Escrow — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ Wired (mock mode)

## UI touchpoints

| File | Role |
|------|------|
| `AddAssetModal.tsx` | Seller toggle **接受買家加購平台鑑定** (default ON) + tooltip |
| `ExecutionSlideOver.tsx` | Buyer auth toggle; disabled when `listing.useAuthentication=false` |
| `OfferCard.tsx` | Seller alert on pending auth offers |
| `MemberOrderDetailView.tsx` | Auth branch: mock pay, inbound tracking, confirm receipt; P2P complete hidden |
| `MemberAuthOrderTimeline.tsx` | Five-step timeline from `escrowStatus` |
| `MemberAuthMockPaymentPanel.tsx` | Buyer mock payment CTA |
| `MemberAuthAdminDevPanel.tsx` | Dev-only platform steps |
| `UserOrderRow.tsx` / `UserTradingClient.tsx` | Escrow badges; **前往付款**; no P2P complete on auth rows |
| `app/lib/types/rbac.ts` | `ESCROW_STEPS` copy (platform logistics) |

## Copy

Shared strings: `lib/listings/auth-service-copy.ts`

## Acceptance checklist

- [x] Seller listing toggle default ON + tooltip explains HK$150 buyer fee and flow
- [x] Seller OFF → buyer cannot enable auth in slide-over
- [x] Auth offer shows seller notification in chat (`OfferCard`)
- [x] Accept → `payment` → mock pay → `custody`
- [x] Seller submits inbound tracking; dev panel confirms receipt → `grading`
- [x] Dev panel pass → `shipped`; outbound tracking; buyer confirms → completed
- [x] Dev panel fail → cancelled + refund copy
- [x] P2P orders unchanged
- [x] `bun run build:ci` passes

## Test path

1. List card with auth ON (default).
2. Buyer: product detail → negotiate → enable 鑑定加購 → make offer.
3. Seller: chat → see auth alert → accept.
4. Buyer: `/profile/user/orderDetail/<id>` → mock pay.
5. Seller: submit 順豐单号 (to platform).
6. Dev: confirm platform received → grading pass → outbound tracking.
7. Buyer: confirm receipt → review CTA.

### Dev 一鍵完成（推薦）

在訂單詳情頁紫色 **Dev 平台操作** 區塊，點 **「▶ 一鍵跑完 Mock 全流程」** — 會從當前 `escrow_status` 自動推進至 `completed`（含模擬付款、入庫單號、平台步驟、代發貨、確認收貨）。

CLI（需 `SUPABASE_SERVICE_ROLE_KEY`）：

```bash
bun run test:member-auth-mock-flow
# 或指定訂單
bun run scripts/run-member-auth-mock-flow.ts <order-uuid>
```
