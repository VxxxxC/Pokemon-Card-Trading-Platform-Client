# Design System: PokéTrade JP

## Brand & Context

- **Product Name**: PokéTrade JP
- **Sector**: Pokémon TCG 專業交易與投資平台
- **Target User**: 針對日版卡牌收藏家及專業賣家
- **Visual Personality**: 結合「專業金融股票系統」的嚴謹感與「日系極簡」設計
- **Guiding Principle**: 數據驅動與透明化。介面需強調實時成交數據與實物細節展示

---

## 1. Visual Theme & Atmosphere

A precision-engineered trading terminal blended with Japanese curatorial minimalism. The atmosphere is **data-dense but never cluttered** — like a Bloomberg Terminal that attended a Tokyo TCG gallery opening. Every pixel earns its place: real transaction prices, real card grades, real yen values. No decorative noise, no AI filler.

- **Density**: 7 — Data-heavy Fintech dashboard. Prices, grades, escrow status, and live transaction history coexist with calibrated breathing room.
- **Variance**: 6 — Asymmetric panel splits preferred over equal-width grids. Desktop favours left-heavy data layouts with narrow right sidebars.
- **Motion**: 8 — Spring-physics driven. Every interactive element has tactile weight. Perpetual micro-motion on live price tickers and active escrow indicators.

---

## 2. Color Palette & Roles

- **Misty Canvas** (`#F8F9FA`) — Primary page background. Cool, clinical. Never pure white.
- **Pure Surface** (`#FFFFFF`) — Card and panel fill. Used only to lift components above the canvas.
- **Off-Black Ink** (`#202124`) — Primary text, card names, core transaction data. Never pure `#000000`.
- **Steel Mist** (`#5F6368`) — Secondary text, card serial numbers, rarity labels, timestamps, metadata.
- **Whisper Border** (`rgba(226,232,240,0.6)`) — All card edges, table row dividers, 1px structural lines. Never heavy strokes.
- **Trade Indigo** (`#2563EB`) — **Sole brand accent**. Primary CTAs (「直接購買」), active navigation states, focus rings, links. Saturation calibrated below 80%.
- **Bullish Jade** (`#16A34A`) — **Semantic-only**. Rising price deltas (`▲ ¥2,400`), successful escrow milestones, grade confirmation. Never used as a brand or decorative color.
- **Bearish Crimson** (`#DC2626`) — **Semantic-only**. Falling price deltas (`▼ ¥1,800`), escrow warnings, security alerts, KYC rejection notices. Never decorative.

> **Accent discipline**: Trade Indigo is the only brand accent. Bullish Jade and Bearish Crimson are market-semantic signals — used exclusively for directional data and status feedback, never for decorative UI elements.

---

## 3. Typography Rules

- **Display / Headlines**: `Geist` — Track-tight, weight-driven hierarchy. Bold (700) for page titles (`24px`), SemiBold (600) for section headers (`20px`). Scale capped — no screaming headlines.
- **Body / UI Text**: `Geist` — Regular (400), relaxed leading (`1.6`), max `65ch` per line. Secondary copy in Steel Mist.
- **Monospace / All Data**: `Geist Mono` — **Mandatory** for every price (`¥120,000`), grade (`PSA 10`, `BGS 9.5`), serial number (`sv2a-215`), percentage delta, and tabular data. No exceptions.
- **Rarity Labels**: `Geist Mono` — `12px / Medium`. SAR, UR, SR, AR chips rendered in monospace for typographic precision.

**Type Scale:**
| Role | Font | Size | Weight |
|---|---|---|---|
| Page Title | Geist | 24px | 700 |
| Section Header | Geist | 20px | 600 |
| Body | Geist | 16px | 400 |
| Price Ticker | Geist Mono | 18px | 500 |
| Metadata / Labels | Geist Mono | 12px | 500 |

**Banned Fonts:**
- `Inter` — Generic, overused. Banned platform-wide.
- `Roboto`, `system-ui` as primary fonts — too anonymous for premium context.
- All generic serifs (`Times New Roman`, `Georgia`, `Garamond`, `Palatino`) — banned entirely.
- No serif fonts in any dashboard or trading UI context.

---

## 4. Component Stylings

### Buttons
- **Primary (「直接購買」)**: Trade Indigo fill, white label. No outer glow. Active: `translateY(1px) scale(0.98)` — tactile push feedback.
- **Secondary (「即時出價」)**: Ghost style. `1px Whisper Border`, Trade Indigo label. Same tactile active state.
- **Destructive / Warning**: Bearish Crimson fill, white label. Same tactile feedback.
- **BANNED**: Purple/neon focus glows. `box-shadow: 0 0 Xpx color`. Use `ring-1 ring-indigo-300/50` instead.
- **Border-radius**: `8px` — precise, not generic. Override shadcn's `rounded-md`.

### Cards
- `Pure Surface` fill, `Whisper Border` (1px), `border-radius: 16px`.
- Shadow: `0 1px 4px rgba(0,0,0,0.06)` — micro diffused. Never `shadow-md` or `shadow-lg`.
- High-density contexts (transaction lists, order books): replace cards with `border-top` dividers + negative space, not card stacking.

### Rarity Badges (SAR, UR, SR, AR)
- `Geist Mono`, `12px`, `Pure Surface` background, `Whisper Border`.
- Subtle `3px` left-border in Trade Indigo to signal rarity tier.
- Typographic chips — not colored pill badges.

### Grade Badges (PSA 10, BGS 9.5, CGC Pristine 10)
- `Geist Mono`, chip shape, `Off-Black Ink` background, `Pure Surface` text.
- Single-line: grading authority + numeric score. No decorative ornamentation.

### Escrow Progress Stepper
- Fintech-grade timeline: thin `1px` connector lines, numbered circular nodes.
- Steps: `Offer Confirmed → Funds Escrowed → Card Shipped ✈ → Inspection → Released`
- Completed steps: `Bullish Jade` connector line, muted node.
- Active step: `Trade Indigo` node with a perpetual subtle ring-pulse animation.
- Step labels: `Geist Mono`, `12px`.
- NEVER release funds before the Inspection step is confirmed.

### Price Ticker / Live Transaction Wall
- `Geist Mono` exclusively. `18px` for primary price, `14px` for card name and grade metadata.
- Rising price: `Bullish Jade` with `▲` prefix. Falling: `Bearish Crimson` with `▼` prefix. Neutral: `Off-Black Ink`.
- Ticker tape animation: CSS `transform: translateX` only. Hardware-accelerated. No `left` property.

### Inputs / Forms
- Label always above the input. Helper text optional below. Error text in `Bearish Crimson` below input.
- Focus: `ring-1 ring-indigo-400/60`. No default browser outline.
- No floating labels. No placeholder-as-label.

### KYC Wizard (商業賣家)
- Step-by-step wizard with persistent progress indicator at top.
- Steps: `上傳證件 → 審核中 → 完成`
- Current step: Trade Indigo filled node. Completed: Bullish Jade. Pending: Steel Mist.

### Loading States
- Skeletal shimmer matching exact component layout dimensions.
- Shimmer: `rgba(0,0,0,0.05)` pulse on `Pure Surface`. Never generic circular spinners.

### Empty States
- Composed typographic instruction. Example: `まだ取引記録がありません。最初のカードを出品してみましょう。`
- Never plain "No data found" text.

### Toast Notifications
- **Success** (付款成功, 發貨確認): `Bullish Jade` `4px` left-border strip, `Pure Surface` background, Trade Indigo check icon.
- **Warning/Error** (出價被超越, 餘額催付): `Bearish Crimson` `4px` left-border, `Pure Surface` background. High visual weight.
- Entry animation: spring-slide from top-right (`translateX(120%) → translateX(0)`).
- No full colored backgrounds on toasts.

### Notification Center
- Bell icon with `Bearish Crimson` unread badge (numeric count, `Geist Mono`).
- Dropdown: two tabs — `交易狀態` / `系統公告`. Whisper Border separators.

### Chat System
- Buyer messages: right-aligned, `Trade Indigo` bubble, white `Geist` text.
- Seller messages: left-aligned, `Pure Surface` bubble, `Whisper Border`, `Off-Black Ink` text.
- System messages (trade state updates): centered, `Steel Mist`, `Geist` italic. No bubble.
- Security warning: full-width `Bearish Crimson` banner above chat input when sensitive content detected.

### Seller/Admin Dashboard
- Metric Cards: `Pure Surface`, `Whisper Border`, `Geist Mono` for all figures. Real data only — no fabricated metrics.
- Charts: Bar/Line using `Trade Indigo` as primary series. `Bullish Jade` / `Bearish Crimson` for delta indicators.
- Data Tables: Support Filter, Sort, Pagination. `Geist Mono` for all numeric columns.

### Card Search & Display
- Search: supports card serial number input, auto-suggest with name + rarity attribute.
- Condition Gallery: force 4–6 real card photos with detail zoom for corner/scratch inspection.
- Image fallback: `picsum.photos` or local assets. Never broken Unsplash links.

### User Portfolio
- Stats display: user's total collection value in `Geist Mono` (`¥` denomination). Real calculated data only.
- Identity tier labels: 資深收藏家, 専門道館主 — in `Geist`, not `Geist Mono`.
- 7-day check-in milestone: thin progress bar in Trade Indigo. No gamification emojis.

---

## 5. Layout Principles

- **Grid-First**: CSS Grid for all multi-column layouts. Never `calc()` percentage hacks with Flexbox.
- **Max-Width Container**: `1400px` centered, `32px` horizontal gutter on desktop.
- **No Equal 3-Column Card Grids**: Use asymmetric grid (`5:3` split), 2-column zig-zag, or horizontal scroll.
- **Full-Height Sections**: Always `min-h-[100dvh]`. Never `h-screen` (iOS Safari viewport catastrophe).
- **Spacing Base Unit**: `8px`. All spacing values are multiples of 8.
- **No Overlapping Elements**: Every element occupies its own clean spatial zone. No absolute-positioned stacking.

### Responsive Strategy
- **Mobile (< 768px)**: Single column collapse. No horizontal overflow. Vertical section gaps via `clamp(3rem, 8vw, 6rem)`.
- **Tablet (768px–1023px)**: 2-column layouts. Top nav or hamburger.
- **Desktop (≥ 1024px)**: Top horizontal Navigation Bar or collapsible Left Sidebar. Full chart and table layouts.
- **Touch Targets**: All interactive elements minimum `44×44px`.
- **Container Padding**: `16px` mobile / `32px` desktop.

### Navigation Patterns
- Mobile (< 1024px): Fixed Bottom Navigation Bar — 4 tabs: 首頁, 搜尋, 收藏, 設定.
- Desktop (≥ 1024px): Top horizontal nav or left sidebar.
- Active tab: `Trade Indigo` icon + label. Inactive: `Steel Mist`.
- PWA Install Prompt: Non-intrusive banner (not modal). `Trade Indigo` primary button. Dismissible.

---

## 6. Motion & Interaction

- **Spring Physics Default**: `stiffness: 400, damping: 30` for micro-interactions (buttons, tooltips, toasts). `stiffness: 100, damping: 20` for page-level transitions.
- **No Linear Easing**: All interactive state changes use spring or `cubic-bezier(0.34, 1.56, 0.64, 1)`. `ease-in-out` and `linear` are banned for interactive elements.
- **Tactile Buttons**: `active:scale-[0.98] active:translate-y-[1px]` on all clickable elements.
- **Perpetual Micro-Interactions**:
  - Live ticker tape: infinite `transform: translateX` CSS animation loop.
  - Active escrow step node: subtle `ring-pulse` in `Trade Indigo`.
  - New transaction arrival: `opacity: 0→1` + `translateY(4px→0)` spring reveal.
- **Staggered Cascade**: Card and list mounts use `staggerChildren: 0.05s` — waterfall reveal, never simultaneous pop-in.
- **Modal / Drawer Entry**: Spring scale-up (`scale(0.95) → scale(1.0)`) + `backdrop-blur-sm` overlay.
- **Performance Rule**: Animate ONLY `transform` and `opacity`. Never animate `top`, `left`, `width`, `height`, or `background-color`.
- **Client Component Isolation**: All spring-physics and perpetual loop animations must live in `'use client'` components. Server Components must be animation-free.

---

## 7. Anti-Patterns (Banned)

**Typography:**
- `Inter` font — banned platform-wide
- Generic serifs: `Georgia`, `Times New Roman`, `Garamond`, `Palatino` — banned
- Gradient text on large headings
- `LABEL // YEAR` formatting (e.g., `SYSTEM // 2025`) — lazy AI convention

**Color:**
- Pure black (`#000000`) as any UI color — use `Off-Black Ink` (`#202124`)
- Pure white (`#FFFFFF`) as the page background — use `Misty Canvas` (`#F8F9FA`)
- Neon glows, purple/blue aura effects, `box-shadow: 0 0 Xpx #color`
- More than one brand accent color
- Oversaturated accents (saturation > 80%)
- Using `Bullish Jade` or `Bearish Crimson` for decorative or branding purposes

**Layout:**
- 3-column equal-width card grids — use asymmetric splits or 2-column zig-zag
- Overlapping elements — clean spatial separation always
- `h-screen` for full-height — use `min-h-[100dvh]`
- Horizontal scroll on mobile
- `calc()` percentage hacks in Flexbox

**Content / Data:**
- `Lorem Ipsum`, `John Doe`, `Acme Corp`, `Nexus` — any placeholder names
- Fabricated metrics: `99.98% Uptime`, `124ms Response`, `18.5k Deploys` — use `[metric]` placeholder if real data unavailable
- AI copywriting clichés: `Elevate`, `Seamless`, `Unleash`, `Next-Gen`, `Empower`
- Filler UI text: `Scroll to explore`, `Swipe down`, bouncing chevrons, scroll arrows
- Broken Unsplash links — use `picsum.photos` or local project assets
- Emojis in UI (except functional indicators: ✈ in Escrow step, ✓ in success states)
- Fabricated dashboard stats sections — `SYSTEM PERFORMANCE METRICS`, `KEY STATISTICS` filled with invented numbers

**Interaction:**
- `ease-in-out` or `linear` transitions for interactive states
- Generic browser blue focus rings — use `ring-1 ring-indigo-300/50`
- Custom mouse cursors
- Circular loading spinners
- Instant list mounts without stagger
- Releasing escrow funds before Inspection step is confirmed
- Hiding Mercari JP historical price data — all market data must be transparent to users
