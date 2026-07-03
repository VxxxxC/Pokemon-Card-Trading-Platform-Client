# Auth Password Recovery & Reset — Frontend Handoff

## Status

- **Backend:** ✅ Ready — see [backend.md](./backend.md)
- **Frontend:** ✅ **Baseline wired**
- **Your focus:** Style pass, merchant settings password link, auth page redirect when logged in

## What is already done

| Feature | Location |
|---------|----------|
| Forgot password page (guest) | `app/auth/forgot-password/page.tsx`, `ForgotPasswordForm.tsx` |
| Email link completion | `app/auth/forgot-password/complete/page.tsx`, `CompleteForgotPasswordForm.tsx` |
| Logged-in reset | `app/auth/reset-password/page.tsx`, `ResetPasswordForm.tsx` |
| Auth shell layout | `app/auth/AuthFormShell.tsx` |
| Login「忘記密碼？」| `AuthForm.tsx` → `/auth/forgot-password` |
| Settings password link | `UserSettingsClient.tsx` → `/auth/reset-password` |
| Password updated toast | `components/auth/PasswordUpdatedToast.tsx` in root `layout.tsx` |
| 404 page | `app/not-found.tsx`, `components/errors/NotFoundContent.tsx` |

## Route map

```
Guest forgot:
  /auth/forgot-password → email → /auth/callback → /auth/forgot-password/complete

Logged-in reset (from settings):
  /profile/user/settings → /auth/reset-password → back to settings (?passwordUpdated=1)
```

## UI touchpoints

| File | Notes |
|------|-------|
| `app/auth/forgot-password/ForgotPasswordForm.tsx` | `useActionState(requestForgotPassword)` |
| `app/auth/reset-password/ResetPasswordForm.tsx` | Current + new + confirm; toasts on error |
| `app/auth/AuthForm.tsx` | `href="/auth/forgot-password"` on login tab |
| `app/profile/user/settings/UserSettingsClient.tsx` | Password「更改」→ `/auth/reset-password` |
| `app/profile/merchant/settings/page.tsx` | Password row still **mock button** — wire to `/auth/reset-password` |

## FormData contracts

### Forgot password

| `name` | Field |
|--------|-------|
| `email` | Email input |

### Reset password (logged-in)

| `name` | Field |
|--------|-------|
| `currentPassword` | 目前密碼 |
| `password` | 新密碼 |
| `confirmPassword` | 確認新密碼 |

### Complete forgot (email link)

| `name` | Field |
|--------|-------|
| `password` | 新密碼 |
| `confirmPassword` | 確認新密碼 |

## Toasts

| Event | Message | Mechanism |
|-------|---------|-----------|
| Password updated (redirect) | `密碼已更新` | `?passwordUpdated=1` + `PasswordUpdatedToast` |
| Same / invalid password on reset page | Field message | Inline + `toast.error` in `ResetPasswordForm` |

## Still pending

- [ ] Merchant settings — link password「更改」to `/auth/reset-password`
- [ ] Email「修改」on settings (separate from password)
- [ ] Redirect logged-in users away from `/auth` login page (optional)
- [ ] Style alignment with main `app/auth/page.tsx` relic panel (reset pages use `AuthFormShell` only)

## Acceptance checklist

- [ ] Guest: forgot flow end-to-end with email (requires Supabase redirect URLs)
- [ ] Logged-in: settings → reset → success toast + return to settings
- [ ] New password === current → error shown + toast
- [ ] Wrong current password →「目前密碼不正確」
- [ ] Invalid route → `app/not-found.tsx` renders
- [ ] Logged-in user visiting `/auth/forgot-password` → redirected to `/auth/reset-password`

## Related docs

- Member settings: [user-profile-settings](../user-profile-settings/frontend.md)
- Login/register: [auth-login-register](../auth-login-register/frontend.md)
