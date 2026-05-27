# PokéTrade JP Implementation Sync Archive

## Read First (All Collaborators & AI Agents)
Before writing code, read these files in order:
1. [requirement.md](./requirement.md)
2. [design.md](../.stitch/designs/design.md)
3. [task.md](./docs/task.md)
4. [Role-Based-Access-Control.md](./Role-Based-Access-Control.md)
5. [server.md](./dev/server.md) — Server-side TODO tracker
6. [api.md](./dev/api.md) — API integration TODO tracker
7. [database.md](./dev/database.md) — Database schema & query TODO tracker

## Membership Level
- Before implement related to the membership system (such as: login / register / individual interface, sub-tab or sub-page according to the member level ) , please reference to [Role-Based-Access-Control.md](./Role-Based-Access-Control.md)

## Task Planning
- According to the [requirement.md](./requirement.md) Development Timeline, planning the task ticket from [task.md](./docs/task.md) for various period

## Golden Workflow (Mandatory)
1. `taste-design`: confirm aesthetics and anti-pattern rules are covered.
2. `stitch-design`: generate/adjust prototype with strict DESIGN compliance.
3. `react-components` + `shadcn-ui`: implement modular Next.js components.

Never skip from idea to direct code without checking the design system.

## Current Branch Status
- Branch: `copilot/revamp-home-page` (Updated from `copilot/start-implementation-phase`)
- Active PR: `feat: homepage revamp, e-shop footer, TODO standardization & dev docs`
- Completed baseline: 
  - ✅ Core homepage/navigation/ticker/card grid/marketplace/portfolio/settings skeleton
  - ✅ Basic PWA scaffold with Serwist integration
  - ✅ All settings pages (general/user/merchant/admin) with responsive design
  - ✅ Admin backend pages with mobile responsive layout
  - ✅ Marketplace page (renamed from search) with sidebar filters
  - ✅ Role-based profile routing (user/merchant/[id])
  - ✅ Auth pages (login/register skeleton)

## Execution Plan Snapshot (1.1-1.9 Full Scope)
### Phase 0: Spec + Consistency
- Freeze requirement coverage for 1.1-1.9.
- Fix prompt path consistency in [/.github/copilot-instructions.md](../.github/copilot-instructions.md).

### Phase 1: Domain & Data (🔄 IN PROGRESS)
- [ ] Supabase schema + RLS: users, listings, offers, trades, escrow steps, KYC, notifications, portfolio.
- [ ] Shared TypeScript contracts.
- [ ] Data sync policy for TCGdex/JustTCG/Mercari.
- **Assigned**: Track B

### Phase 2: Trading Core (📋 READY)
- [ ] Search aggregator + rarity mapping.
- [ ] Listing creation + 4-6 image validation.
- [ ] Buy-now + offer-matching + escrow transitions.
- [ ] Live transaction wall and price history APIs.
- **Assigned**: Track C

### Phase 3: Payments + Notifications
- Stripe Connect split payouts, deposit/final payment, subsidy deduction.
- Webhook reconciliation and dispute/refund flows.
- In-app + email + push notification matrix.

### Phase 4: Ops UI
- Seller dashboard + KYC flows.
- Admin moderation/dispute views.
- Chat + sensitive content warning + ratings.

### Phase 5: Launch Readiness
- SEO pages + metadata + sitemap.
- PWA validation and offline fallback.
- E2E runbook and rollback plan.

## Track Assignment
- Track A (UI Foundation): frontend polish and PWA UX.
- Track B (Domain+Data): schema/RLS/contracts.
- Track C (Trading+Escrow): matching + escrow state machine.
- Track D (Payments): Stripe Connect + webhooks.
- Track E (Data Sync): external feeds + scheduling.
- Track F (Notifications): event matrix + dedupe/throttling.
- Track G (Admin/KYC/Chat): internal tools + moderation.
- Track H (QA/Release): E2E + Lighthouse + release guardrails.

## Definition of Done (Cross-Track)
1. Matches [design.md](../.stitch/designs/design.md) tokens and anti-pattern rules.
2. Uses realistic Japanese Pokemon card context and no fabricated metrics.
3. Passes TypeScript, lint, and runtime smoke checks.
4. Includes mobile-first behavior and PWA/offline compatibility.
5. Documents API contracts and state transitions for handoff.

## After writing code / implementation
- update checkbox status of task ticket in [task.md](./docs/task.md)

## Handoff Note Template
When handing off work, include:
- update checkbox status of task ticket in [task.md](./docs/task.md)
- Files changed
- Contract changes (API/schema/event)
- Test evidence
- Risks and follow-up tasks
