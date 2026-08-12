# Variable commission — frontend

## UI touchpoints

| Route / component | Change |
|-------------------|--------|
| `/admin/settings` | Load/save commission via `getPlatformFinancialConfig` / `updatePlatformFinancialConfig` |
| `app/profile/merchant/orderDetail/[id]/page.tsx` | Pass `defaultCommissionRate` from `getPlatformCommissionRateForDisplay()` |
| `MerchantOrderDetailView.tsx` | Pre-confirm estimate uses `defaultCommissionRate`; post-confirm uses `commissionRateApplied` / `commissionAmount` |

## Acceptance checklist

- [ ] `/admin/settings` shows DB rate (8% after seed), not mock 5%
- [ ]「儲存財務設定」persists commission + appraisal fee; FPS still mock
- [ ] Merchant order detail: estimate before confirm matches current settings; after confirm shows snapshot fields
- [ ] Admin dashboard commission rate label reflects settings when available

## Out of scope (this flow)

- Member FPS fee on settings page — toast-only until separate flow lands. Appraisal fee: see [variable-appraisal-fee](../variable-appraisal-fee/plan.md).
