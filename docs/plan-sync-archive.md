# PokéTrade JP Implementation Sync Archive

## Read First (All Collaborators & AI Agents)
Before writing code, read these files in order:
1. [.github/copilot-instructions.md](../.github/copilot-instructions.md)
2. [design.md](../design.md)
3. [requirement.md](../requirement.md)
4. This archive: [docs/plan-sync-archive.md](./plan-sync-archive.md)

If you are using non-Copilot AI tools, still enforce the same workflow and constraints from [/.github/copilot-instructions.md](../.github/copilot-instructions.md).

## Golden Workflow (Mandatory)
1. `taste-design`: confirm aesthetics and anti-pattern rules are covered.
2. `stitch-design`: generate/adjust prototype with strict DESIGN compliance.
3. `react-components` + `shadcn-ui`: implement modular Next.js components.

Never skip from idea to direct code without checking the design system.

## Current Branch Status
- Branch: `copilot/start-implementation-phase`
- Active PR: `feat: implement PokéTrade JP core platform — homepage, navigation, ticker, cards, transactions`
- Completed baseline: core homepage/navigation/ticker/card grid/search/portfolio/settings skeleton + basic PWA scaffold.

## Execution Plan Snapshot (1.1-1.9 Full Scope)
### Phase 0: Spec + Consistency
- Freeze requirement coverage for 1.1-1.9.
- Fix prompt path consistency in [/.github/copilot-instructions.md](../.github/copilot-instructions.md).

### Phase 1: Domain & Data
- Supabase schema + RLS: users, listings, offers, trades, escrow steps, KYC, notifications, portfolio.
- Shared TypeScript contracts.
- Data sync policy for TCGdex/JustTCG/Mercari.

### Phase 2: Trading Core
- Search aggregator + rarity mapping.
- Listing creation + 4-6 image validation.
- Buy-now + offer-matching + escrow transitions.
- Live transaction wall and price history APIs.

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
1. Matches [design.md](../design.md) tokens and anti-pattern rules.
2. Uses realistic Japanese Pokemon card context and no fabricated metrics.
3. Passes TypeScript, lint, and runtime smoke checks.
4. Includes mobile-first behavior and PWA/offline compatibility.
5. Documents API contracts and state transitions for handoff.

## Handoff Note Template
When handing off work, include:
- Files changed
- Contract changes (API/schema/event)
- Test evidence
- Risks and follow-up tasks
