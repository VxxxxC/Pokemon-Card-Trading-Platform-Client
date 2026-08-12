# Platform Announcements — Frontend

> **Status:** ✅ Wired

## Touchpoints

| Surface | Files |
|---------|--------|
| Homepage modal | `app/page.tsx` → `app/HomePageShell.tsx` → `app/components/announcements/AnnouncementModal.tsx` |
| Public list | `app/announcements/page.tsx` (SSR) + `AnnouncementsPageClient.tsx` (tabs) |
| Admin CRUD | `app/admin/announcements/page.tsx` |
| Nav badge | `TopNav.tsx`, `MobileHeader.tsx` via `useHasActiveAnnouncements()` |

## Admin wire-up checklist

- [x] `useEffect` loads `getAnnouncementsForAdmin()` on mount
- [x] Create/update calls `createPlatformAnnouncement` / `updatePlatformAnnouncement`
- [x] Pending file uploads via `uploadAnnouncementPosterImage()` before save
- [x] `pendingAnnouncementId` = `crypto.randomUUID()` on new form; existing `id` on edit
- [x] Never persist `blob:` preview URLs — Bunny CDN, manual https, or `DEFAULT_ANNOUNCEMENT_POSTER_URL`
- [x] Toggle/delete wired to server actions
- [x] Loading/saving states + existing `feedbackMessage` toast

## Acceptance

1. Admin can create, edit, toggle, and delete announcements; poster upload persists after reload.
2. Homepage modal shows server-fetched active announcements (HKT window + `priority` sort).
3. `/announcements` lists all rows; client tabs use `getAnnouncementStatus`.
4. Nav megaphone dot appears when at least one active announcement exists.

## Optional v2

- Modal `linkUrl` CTA button
- Rich-text editor
- Per-announcement dismiss in `sessionStorage`
