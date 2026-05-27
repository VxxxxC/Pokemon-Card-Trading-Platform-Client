# Server-Side Implementation Requirements

This document tracks all server-side logic and server actions that need to be implemented when backend infrastructure is ready.

## Authentication & Session Management

### User Profile Management
**Location**: `app/profile/user/settings/page.tsx:60`
- **Action**: Form submit handler for profile updates
- **Requirements**: Server action to UPDATE `profiles` table (display_name, handle, bio) for current user
- **Authentication**: Requires authenticated user session

**Location**: `app/profile/user/settings/page.tsx:93`
- **Action**: Security settings update handlers
- **Requirements**:
  - Email update via Supabase `auth.updateUser()`
  - Password reset via `sendPasswordRecovery()`
  - 2FA via MFA enrollment API
- **Authentication**: Requires authenticated user session

### Role-Based Access Control
**Location**: `app/profile/page.tsx:14`
- **Action**: Read auth session role
- **Requirements**: `supabase.auth.getSession()` then check `user.user_metadata.role`
- **Authentication**: Required for profile routing logic

## Merchant/Shop Management

### Merchant Profile Settings
**Location**: `app/profile/merchant/settings/page.tsx:20`
- **Action**: Save shop information
- **Requirements**: Server action to UPDATE `merchant_profiles.shop_name` for current user
- **Authentication**: Requires merchant role verification

### Inventory Management
**Location**: `app/profile/merchant/inventory/page.tsx:166`
- **Action**: Save listing as draft
- **Requirements**: Server action to INSERT into `listings` with status='draft'
- **Authentication**: Requires merchant role

**Location**: `app/profile/merchant/inventory/page.tsx:167`
- **Action**: Publish listing
- **Requirements**: Server action to INSERT into `listings` with status='active', then update merchant inventory count
- **Authentication**: Requires merchant role

### Sales Order Management
**Location**: `app/profile/merchant/sales/page.tsx:113`
- **Action**: Order status updates
- **Requirements**:
  - "確認並準備發貨" - update `orders.status`
  - "確認發貨" - update `orders.status` and notify buyer
- **Authentication**: Requires merchant role and order ownership verification
- **Side Effects**: Trigger buyer notification via Supabase realtime / email

## Admin Operations

### KYC Application Management
**Location**: `app/admin/approvals/page.tsx:135`
- **Action**: Approve KYC application
- **Requirements**:
  - UPDATE `kyc_applications.status = 'approved'`
  - UPDATE `profiles.role = 'MERCHANT'`
  - Send confirmation email
- **Authentication**: Requires admin role
- **Audit**: Log approval action with admin user ID

**Location**: `app/admin/approvals/page.tsx:142`
- **Action**: Reject KYC application
- **Requirements**:
  - UPDATE `kyc_applications.status = 'rejected'`
  - Send rejection email with reason
- **Authentication**: Requires admin role
- **Audit**: Log rejection action with admin user ID and reason

### User Management
**Location**: `app/admin/users/page.tsx:140`
- **Action**: Ban/Unban user
- **Requirements**:
  - UPDATE `profiles.is_banned = true/false`
  - Invalidate user session
- **Authentication**: Requires admin role
- **Audit**: Log ban/unban action with admin user ID and reason

### Platform Settings
**Location**: `app/admin/settings/page.tsx:21`
- **Action**: Update shipping subsidy settings
- **Requirements**: Server action to upsert `platform_settings.shipping_subsidy_amount`
- **Authentication**: Requires admin role

**Location**: `app/admin/settings/page.tsx:72`
- **Action**: Trigger scraper job manually
- **Requirements**: Call server action to trigger Mercari/SKUNK scraper job
- **Authentication**: Requires admin role
- **Side Effects**: Initiate async scraping process

**Location**: `app/admin/settings/page.tsx:121`
- **Action**: Update API credentials
- **Requirements**: Securely update API key via server action with encryption at rest
- **Authentication**: Requires admin role
- **Security**: Mask keys in responses, encrypt at rest

**Location**: `app/admin/settings/page.tsx:167`
- **Action**: Update platform commission rate
- **Requirements**: Server action to upsert `platform_settings.commission_rate`
- **Authentication**: Requires admin role

**Location**: `app/admin/settings/page.tsx:202`
- **Action**: Emergency platform controls
- **Requirements**:
  - "暫停全平台交易" - disable all trading operations
  - "清除所有快取數據" - flush cache layers
- **Authentication**: Requires admin role
- **Security**: Require additional confirmation/2FA

### Card Database Management
**Location**: `app/admin/database/page.tsx:52`
- **Action**: Manual cache refresh
- **Requirements**: Call server action to re-run TCGdex API fetch and update `price_cache` table
- **Authentication**: Requires admin role

**Location**: `app/admin/database/page.tsx:81`
- **Action**: Manual card entry
- **Requirements**: Server action to INSERT into `card_catalog` table with admin auth check
- **Authentication**: Requires admin role
- **Validation**: Validate card data format and uniqueness

## Trading & Escrow Operations

### Purchase & Bidding
**Location**: `app/components/cards/CardItem.tsx:83`
- **Action**: Direct purchase (Buy Now)
- **Requirements**:
  - Create order in Supabase
  - Initiate Stripe Connect PaymentIntent
  - Lock listing to prevent double-purchase
- **Authentication**: Requires authenticated user
- **Transaction**: Atomic operation with RLS check

**Location**: `app/components/cards/CardItem.tsx:84`
- **Action**: Submit bid offer
- **Requirements**:
  - Open bid modal
  - Submit to `bids` table with user auth check
- **Authentication**: Requires authenticated user

## User Check-in & Gamification

### Daily Check-in System
**Location**: `app/components/profile/CheckInWidget.tsx:118`
- **Action**: Persist daily check-in
- **Requirements**: Server action to upsert `user_streaks` table
  - Field: `user_id, last_checkin: new Date(), streak_days: streak + 1`
  - Use server-side timestamp: `timezone('Asia/Hong_Kong', now())`
- **Authentication**: Requires authenticated user
- **Security**: Use PostgreSQL atomic transaction with `FOR UPDATE` row lock
- **Anti-cheat**: Enforce UNIQUE constraint on `(user_id, check_in_date)`

**Location**: `app/components/profile/CheckInWidget.tsx:119`
- **Action**: Award check-in points
- **Requirements**: Server action to insert into `user_points` table
  - Field: `user_id, points: 50, reason: 'daily_checkin'`
- **Authentication**: Requires authenticated user
- **Transaction**: Must be part of same atomic transaction as check-in

### Reward Redemption
**Location**: `app/profile/[id]/page.tsx:643`
- **Action**: Claim streak reward
- **Requirements**:
  - INSERT into `user_points` table
  - UPDATE `user_streaks.reward_claimed = true`
- **Authentication**: Requires authenticated user
- **Validation**: Verify streak milestone reached and reward not already claimed

## Messaging & Communication

### In-Platform Messaging
**Location**: `app/profile/user/orders/page.tsx:163`
- **Action**: Contact seller from order
- **Requirements**: Navigate to in-platform chat thread or open messaging modal for order.id
- **Authentication**: Requires authenticated user
- **Validation**: Verify user is buyer of the order

**Location**: `app/profile/merchant/sales/page.tsx:114`
- **Action**: Contact buyer from order
- **Requirements**: Open in-platform messaging or navigate to chat thread
- **Authentication**: Requires merchant role
- **Validation**: Verify user is seller of the order

## Stripe Connect Integration

### Payout Management
**Location**: `app/profile/merchant/finance/page.tsx:82`
- **Action**: Redirect to Stripe Express Dashboard
- **Requirements**: Use `stripe.accounts.createLoginLink(accountId)` server action
- **Authentication**: Requires merchant role
- **Data Source**: Fetch connected account ID from `merchant_profiles.stripe_account_id`

## Settings & Preferences

### General Settings
**Location**: `app/settings/page.tsx:32`
- **Action**: Various settings updates
- **Requirements**:
  - Language change modal/action
  - Currency change modal/action
  - Notification preference management
  - Navigate to privacy policy/FAQ/support pages
- **Authentication**: Some actions require auth, others are public

### Notification Preferences
**Location**: `app/profile/user/settings/page.tsx:185`
- **Action**: Toggle notification settings
- **Requirements**: Server action to UPDATE `notification_settings` for current user
- **Authentication**: Requires authenticated user

## KYC & Verification

### KYC Application Submission
**Location**: `app/profile/user/settings/page.tsx:161`
- **Action**: Submit KYC application
- **Requirements**:
  - INSERT into `kyc_applications` table
  - UPDATE `profiles.role = 'PENDING_MERCHANT'`
- **Authentication**: Requires authenticated user
- **Validation**: Validate required documents are uploaded

## Implementation Priority

### Phase 1 - Critical (Month 2)
1. Authentication & Session Management
2. KYC Application Management (Admin)
3. Direct Purchase Flow (Escrow initiation)
4. User Profile Management

### Phase 2 - High Priority (Month 2-3)
1. Merchant Inventory Management
2. Order Status Management
3. Stripe Connect Payout Integration
4. Platform Settings (Admin)

### Phase 3 - Medium Priority (Month 3)
1. Daily Check-in & Points System
2. Notification Preferences
3. In-Platform Messaging
4. Ban/Unban User Management

### Phase 4 - Nice to Have (Month 4)
1. Manual Card Database Entry
2. Cache Refresh Operations
3. Emergency Platform Controls

## Security Considerations

### All Server Actions Must:
1. Verify user authentication via `supabase.auth.getSession()`
2. Check role-based permissions (USER, MERCHANT, ADMIN)
3. Validate ownership for resource modifications
4. Use Row Level Security (RLS) policies in Supabase
5. Log sensitive operations for audit trail
6. Use atomic transactions for multi-step operations
7. Implement rate limiting for abuse prevention
8. Sanitize and validate all input data

### Anti-Cheat Measures:
1. Use server-side timestamps only (no client-provided dates)
2. Implement database-level unique constraints
3. Use PostgreSQL row-level locks for concurrent operations
4. Validate business logic server-side (never trust client)

## Testing Requirements

Each server action should have:
1. Unit tests for business logic
2. Integration tests with Supabase
3. Authorization tests (deny unauthorized access)
4. Edge case testing (concurrent operations, invalid input)
5. Performance testing for high-traffic endpoints
