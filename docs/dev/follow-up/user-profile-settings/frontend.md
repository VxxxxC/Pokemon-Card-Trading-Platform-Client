# User Profile Settings (Member) — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ **Baseline wired** — personal info + security; dashboard avatar upload; notifications **mock** (intentional)
- **Your focus:** Merchant settings parity, notification wiring (later)

## What is already done

| Feature | Location |
|---------|----------|
| Server fetch → client form | `page.tsx` + `UserSettingsClient.tsx` |
| Save profile (`useActionState`) | `UserSettingsClient.tsx` → `updateUserProfile` |
| Real email (read-only) | Security section |
| Password change link | → `/auth/reset-password` |
| Success / error toasts | `sonner` on save + username taken |
| Notification toggles (mock) | Original 4 rows — **no backend** |
| Logout | `LogoutModal` |

## UI touchpoints

| File | Area |
|------|------|
| `app/profile/user/settings/page.tsx` | Server Component — `getUserSettings()`, redirect if guest |
| `app/profile/user/settings/UserSettingsClient.tsx` | Form, security, notifications (mock), session |
| `app/profile/user/(dashboard)/UserOverviewClient.tsx` | Hero avatar + **edit overlay** (camera button → Bunny upload) |
| `public/asset/default-avator.webp` | Default avatar asset |

## Server action usage (already integrated)

```tsx
// page.tsx (Server Component)
const result = await getUserSettings();
return <UserSettingsClient initialData={result.data} />;

// UserSettingsClient.tsx
const [errors, formAction, isPending] = useActionState(updateUserProfile, null);
```

### Form field `name` attributes (must match backend)

| UI label | `name` |
|----------|--------|
| 顯示名稱 | `displayName` |
| 用戶名 (Handle) | `username` |
| 個人簡介 | `shortDescription` |

## Still mock / pending

| Area | Status | Notes |
|------|--------|-------|
| Notification toggles | ⏳ Mock UI | TODO comments in `UserSettingsClient.tsx`; wait for `notification_settings` |
| Email「修改」button | ⏳ Not wired | Display only |
| Dashboard hero avatar | ✅ Wired | Live `profile.avatarUrl` + edit overlay uploads to Bunny via `uploadProfileAvatar` → `updateUserAvatar` |
| Merchant settings profile | ⏳ Hardcoded | Separate page: `/profile/merchant/settings` |

## Optional polish (partner backlog)

- [x] Wire user dashboard hero to `profile.avatarUrl` from `useMemberDashboard`
- [x] Dashboard avatar upload UI → Bunny CDN + `profiles.avatar_path` update
- [ ] Loading skeleton on settings page (server fetch is fast; optional)
- [ ] Merchant settings: mirror member pattern (`getMerchantSettings` TBD)
- [ ] Footer「帳戶設定」link — role-aware (`/profile/user/settings` vs merchant)
- [ ] Notification prefs when backend table exists

## Acceptance checklist

- [ ] `/profile/user` hero avatar edit → pick image → toast「頭像已更新」; persists after refresh
- [ ] `/profile/user/settings` shows live `display_name`, `username`, `short_description`, email
- [ ] Save updates DB; toast「個人資料已更新」; form reflects new values after refresh
- [ ] Duplicate handle shows inline error + toast
- [ ] Notification section shows 4 toggles (visual only; clicks do nothing)
- [ ]「更改」password → `/auth/reset-password` (logged-in flow)
- [ ] Logout still works

## Related docs

- Password change: [auth-password-recovery](../auth-password-recovery/frontend.md)
- Auth / session: [auth-login-register](../auth-login-register/frontend.md), [role-based-routing](../role-based-routing/frontend.md)
