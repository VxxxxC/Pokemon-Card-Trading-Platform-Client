# Platform Announcements — Backend

> **Status:** ✅ Ready  
> **Migration:** `supabase/migrations/20260922120000_platform_announcements_ssot.sql`

## Overview

Homepage modal, public `/announcements`, and `/admin/announcements` read/write `platform_announcements`. Poster images upload to Bunny CDN (`announcements/{announcementId}/{uuid}.{ext}`).

## Schema

Table `platform_announcements`:

| Column | Notes |
|--------|--------|
| `title`, `content` | Plain text |
| `image_url` | Required https CDN URL (or seed Unsplash) |
| `image_object_key` | Bunny key for delete-on-replace |
| `link_url` | Optional `/path` or `https://` |
| `start_date`, `end_date` | HKT calendar days |
| `is_active` | Manual off switch |
| `priority` | Lower = higher priority in carousel |

RLS: public `SELECT`; admin `ALL` via `is_admin()`. Grants: `anon`/`authenticated` SELECT; `service_role` full CRUD.

SQL helper: `fn_platform_active_announcements()` — active window in HKT, ordered `priority ASC, created_at DESC`.

## Server actions

File: `app/actions/admin-announcements.ts`

| Action | Auth | Purpose |
|--------|------|---------|
| `getActiveAnnouncementsForDisplay()` | Public | Homepage modal; returns `[]` when Supabase unset (CI) |
| `getAnnouncementsForPublicList()` | Public | `/announcements` SSR |
| `getAnnouncementsForAdmin()` | Admin | Admin table load |
| `createPlatformAnnouncement(input)` | Admin | Insert; optional `id` for upload-before-save |
| `updatePlatformAnnouncement(id, input)` | Admin | Update; deletes old Bunny object on key change |
| `deletePlatformAnnouncement(id)` | Admin | Delete row + best-effort Bunny cleanup |
| `togglePlatformAnnouncementActive(id)` | Admin | Flip `is_active` |

## Upload API

`POST /api/admin/upload-announcement-image`

- Auth: admin only (`isCurrentUserAdmin`)
- Returns **503** when `!isBunnyStorageConfigured()`
- Form fields: `image` (file), `announcementId` (UUID — existing row id on edit; pre-generated on create)
- Response: `{ objectKey, cdnUrl }`

## Domain module

`lib/announcements/*` — types, HKT date SSOT (`hkt-dates.ts`), status, validation, client upload helper, `use-has-active-announcements` hook for nav badge, `announcement-detail-link` CTA helper.

**Public visibility (Scheme A):** Out-of-window announcements are hidden on the homepage modal via server `activeOnly` query; DB `is_active` is not auto-flipped on expiry.

## Verify

### Automated

```bash
# CI-safe unit tests
bunx vitest run tests/unit/announcements/

# Integration (skips without E2E_* + Supabase env)
bunx vitest run tests/integration/announcements/platform-announcements.integration.test.ts

# Optional Bunny upload smoke (skips without BUNNY_*)
bunx vitest run tests/integration/announcements/upload-announcement-image.integration.test.ts

# Local pre-release gate (NOT for default CI — needs dev server + E2E_ADMIN_*)
bun run test:announcements:gate
```

| Script | CI-safe? |
|--------|----------|
| `vitest run tests/unit/announcements/` | Yes |
| `vitest run tests/integration/announcements/` | Partial (env-gated) |
| `test:e2e:announcements` | No |
| `test:announcements:gate` | No (local / pre-release only) |

### Manual (minimal)

1. UI visual polish on `/admin/announcements` and homepage modal
2. Optional: Bunny storage dashboard — confirm old object removed after image replace

**Homepage modal QA:** clear `sessionStorage` key `hasSeenAnnouncementsModal` (not `announcement-modal-dismissed`).
