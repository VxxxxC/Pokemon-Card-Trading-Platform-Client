# Coding Agent Prompt: Part 2 - Backend, Database & API Integration (Wishlist Feature)

## 🎯 Role & Context
You are an expert full-stack developer specializing in Supabase, PostgreSQL, and Next.js Server Actions.
We have already implemented the frontend UI components (`WishlistButton.tsx`, `WishlistTicker.tsx`, `WishlistTable.tsx`) with mock data. 
Your task is to **implement the backend database schema, Row Level Security (RLS) policies, and connect the live data streams** using Server Actions.

---

## 🛠️ Implementation Tasks (Backend Integration)

### Task 1: Supabase Database Migration
Please generate a SQL migration or write the code to set up the Wishlist schema:
- **Table Name**: `user_favorites`
- **Columns**:
  - `id`: `uuid` (Primary Key, default: `gen_random_uuid()`)
  - `user_id`: `uuid` (References `auth.users.id` on delete cascade, Required)
  - `listing_id`: `uuid` (References `listings.id` on delete cascade, Required)
  - `created_at`: `timestamp with time zone` (default: `now()`)
- **Constraints & Indexes**:
  - Add a `UNIQUE` constraint on `(user_id, listing_id)` to prevent duplicate tracking.
  - Create a compound index on `(user_id, listing_id)` to optimize high-concurrency home page queries.

### Task 2: Row Level Security (RLS) Policies
- Enable RLS on the `user_favorites` table.
- Implement PostgreSQL policies to ensure data privacy:
  - `SELECT`: Allowed only if `auth.uid() = user_id`.
  - `INSERT`: Allowed only if `auth.uid() = user_id`.
  - `DELETE`: Allowed only if `auth.uid() = user_id`.

### Task 3: Next.js Server Actions for Syncing State
- **File Path**: `app/actions/Wishlist.ts`
- Implement server actions with strict error handling:
  - `toggleWishlistAction(listingId: string)`: Checks if the session user is authenticated. If yes, check if a row exists in `user_favorites`. If it exists, delete it (untrack); if not, insert it (track). Return the new status.
  - If the user is unauthenticated, throw an explicit error to trigger the frontend login toast alert.

### Task 4: Connect Data Streams to Frontend
- Update `app/(public)/page.tsx` (Home Dashboard): Replace the mock data inside `WishlistTicker.tsx` with a live Supabase query fetching real-time lowest listing prices and 24h trends (`price_delta_percentage`).
- Update `app/(user)/collection/components/WishlistTable.tsx`: Bind the table rows to a live database call that pulls the user's actual `user_favorites` list joined with the `listings` and `cards_catalog` tables.

---

## 🤖 Coding Instructions for Copilot
1. Scan `lib/supabase/server.ts` or `utils/supabase` to use the project's default authenticated Supabase server client creator.
2. Implement database transactions or optimistic updates safely to ensure smooth performance under HKD target currency constraints.
3. Ensure proper cache revalidation (`revalidatePath('/')`) occurs inside the Server Actions after toggling.