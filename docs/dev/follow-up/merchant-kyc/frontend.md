# Merchant KYC Flow — Frontend Handoff

## Status

- **Backend:** ✅ Ready
- **Frontend:** 🟡 申請 wizard + admin 表格 UI 已接駁；merchant Stripe CTA 樣式待精修

## 申請表 Wizard（`MerchantApplyClient.tsx`）

（結構與行為不變 — 見先前 spec）

## Admin 審核頁（`AdminMerchantsClient.tsx`）

已還原至原先 admin 表格設計（參考 git `d9ba641`）：

- 頁首 card：「商戶與 KYC 審查」
- 搜尋：公司名 / Handle / 電郵 / BR / Stripe ID
- Filter chips：全部 / 待審核 / 已批准 / 已拒絕（含 count）
- shadcn `Table` + 狀態 badge + client 分頁
- **待審核**：Popover 查看 4 份文件、批准、拒絕（必填原因）
- **已批准** 無 `stripeAccountId`：「重試 Stripe 開通」（`retryKycProvisioning`）
- 反饋：`toast`（sonner）

### Admin hooks

- `listKycApplications()` — SSR `page.tsx`
- `getKycDocumentSignedUrl(documentId)`
- `reviewKycApplication(id, decision, reason?)`
- `retryKycProvisioning(applicationId)`

## 其他 UI

| File | 現況 |
|------|------|
| `MerchantOverviewClient.tsx` | Stripe CTA 仍為無樣式 stub |

## Acceptance checklist

- [x] 3 步 wizard + stepper
- [x] `/admin/merchants` 表格 UI + 審批/文件/重試
- [ ] Merchant dashboard Stripe CTA 樣式
