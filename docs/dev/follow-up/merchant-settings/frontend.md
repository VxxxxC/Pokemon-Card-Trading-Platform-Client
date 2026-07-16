# Merchant Settings — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ **Baseline wired** — shop info + security; notifications **mock** (intentional)

## What is done

| Feature | Location |
|---------|----------|
| Server fetch → client form | `page.tsx` + `MerchantSettingsClient.tsx` |
| Save shop profile (`useActionState`) | `MerchantSettingsClient.tsx` → `updateMerchantShopProfile` |
| Real auth email (read-only) | Security section |
| Password change link | → `/auth/reset-password` |
| Success / error toasts | `sonner` on save |
| Notification toggles (mock) | Original 4 rows — **no backend** |
| Logout | `LogoutModal` |

## UI touchpoints

| File | Area |
|------|------|
| `app/profile/merchant/settings/page.tsx` | Server Component — `getMerchantSettings()`, redirect if guest |
| `app/profile/merchant/settings/MerchantSettingsClient.tsx` | Form, security, notifications (mock), session |

## Server action usage

```tsx
// page.tsx
const result = await getMerchantSettings();
return <MerchantSettingsClient initialData={result.data} />;

// MerchantSettingsClient.tsx
const [errors, formAction, isPending] = useActionState(updateMerchantShopProfile, null);
```

### Form field `name` attributes (must match backend)

| UI label | `name` |
|----------|--------|
| 店舖名稱 | `shopName` |
| 店舖帳號 (Handle) | `shopHandle` |
| 店舖簡介 | `shopDescription` |

## Still mock / pending

| Area | Status | Notes |
|------|--------|-------|
| Notification toggles | ⏳ Mock UI | Wait for `notification_settings` |
| Email「修改」button | ⏳ Not wired | Display only (same as member) |

## Acceptance checklist

- [ ] `/profile/merchant/settings` shows live `shop_name`, `shop_handle`, `shop_description`, auth email
- [ ] Save updates `merchant_shops` only; `profiles` member fields unchanged
- [ ] Duplicate shop handle shows inline error + toast
- [ ] Password「更改」→ `/auth/reset-password`
- [ ] Notification section shows 4 toggles (visual only)
- [ ] Logout still works
- [ ] Storefront `/marketplace/{shop_handle}` reflects saved shop name

## Related docs

- Member settings pattern: [user-profile-settings](../user-profile-settings/frontend.md)
- Password change: [auth-password-recovery](../auth-password-recovery/frontend.md)
- Storefront loader: [marketplace-storefront](../marketplace-storefront/backend.md)
