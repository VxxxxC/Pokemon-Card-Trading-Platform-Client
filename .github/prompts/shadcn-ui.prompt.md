---
description: "Installs and customises shadcn/ui components for HKCardVault. Strips all generic defaults — replaces with Whisper Borders, tactile buttons, spring-physics modals, and Fintech-grade Escrow timelines. Always reads DESIGN.md first."
agent: agent
tools:
  - read
  - edit
  - search
  - execute
---

# HKCardVault — shadcn/ui Taste Customizer

---

description: 'Installs and customises shadcn/ui components for HKCardVault. Strips all generic defaults — replaces with Whisper Borders, tactile buttons, spring-physics modals, and Fintech-grade Escrow timelines. Always reads DESIGN.md first.'
agent: agent
tools:

- read
- edit
- search
- execute

---

# HKCardVault — shadcn/ui Taste Customizer

## Primary Directive

When a UI implementation requires specific shadcn/ui components, or when `bunx --bun shadcn@latest init` is run, you are a frontend engineer specialised in **anti-generic UI** for **HKCardVault**, a premium Japanese Pokémon Card trading platform. Your job is to install, integrate, and taste-customize **shadcn/ui** components so they conform to the platform's premium Fintech design language.

**Before installing or editing any component**, load and follow the full workflow defined in:

> `.agents/skills/shadcn-ui/SKILL.md`

That skill governs component discovery, installation via CLI or MCP, project setup, and accessibility. The rules below are **HKCardVault-specific taste overrides** — they take precedence over any shadcn default.

---

## Pre-Work: Load Design Tokens

Read `DESIGN.md` in full before touching any component. Extract:

- Background, surface, and accent hex values
- Border-radius scale (overrides shadcn's `rounded-md`)
- Shadow/elevation approach (typically zero or 1px structural lines)
- Typography stack (overrides shadcn's `font-sans`)

Sync these values to `app/globals.css` CSS variables before customising any component.

---

## HKCardVault Taste Overrides (Non-Negotiable)

### 1. De-genericize All Defaults

| shadcn Default                   | HKCardVault Override                                                              |
| -------------------------------- | ---------------------------------------------------------------------------------- |
| `border` (1px solid gray)        | `border-zinc-200/50` (light) / `border-white/10` (dark) — "Whisper Borders"        |
| `shadow-md`, `shadow-lg`         | Remove entirely. Use 1px structural lines or `shadow-[0_1px_3px_rgba(0,0,0,0.06)]` |
| `rounded-md`                     | Use exact value from `DESIGN.md` border-radius scale                               |
| `font-sans`                      | Use `DESIGN.md` typography stack                                                   |
| `ring-2 ring-primary` focus ring | Replace with `outline-none ring-1 ring-zinc-300/50` — no neon/purple glows         |

### 2. Button & Input Overrides

- **BANNED on all buttons**: `ring-purple-500`, `shadow-lg`, neon/glow effects, generic blue defaults.
- All buttons require: `active:scale-[0.98] transition-transform` for tactile press feedback.
- Use `cn()` to layer overrides — never modify `components/ui/` files directly.
- Create wrapper components in `components/` for all HKCardVault customisations.

### 3. Escrow & Trading Components

**Escrow Progress Stepper**:

- Customise shadcn's progress/stepper to look like a high-end Fintech timeline.
- Steps should display: `Offer Confirmed → Funds Escrowed → Card Shipped → Inspection → Released`.
- Use thin connector lines, numbered nodes with `font-mono`, and subdued color for completed steps.

**Trade Offer Cards**:

- Use `Card` as base but apply Whisper Border, zero shadow, and `font-mono` for all price fields.
- Grade badges (PSA 10, BGS 9.5) must use `font-mono` with a subtle background chip, not a colored pill.

### 4. Modals & Dialogs — Spring Motion Required

```tsx
// All Dialog/Sheet overlays must use this pattern
<DialogContent className={cn(
  "backdrop-blur-sm",            // blur overlay
  "data-[state=open]:animate-spring-scale-up",  // spring entry
  "border border-zinc-200/50",   // Whisper Border
  "shadow-none"                  // no default shadow
)}>
```

Define `animate-spring-scale-up` in `tailwind.config.ts` using a spring-like keyframe or `framer-motion`.

### 5. Class Management Rule

- **Always** compose classes via `cn()` — never string concatenate Tailwind classes.
- Custom overrides go in wrapper components (`components/`) not in `components/ui/`.
- Base shadcn files in `components/ui/` remain unmodified (enables clean upstream updates).

---

## Installation Workflow

Follow `.agents/skills/shadcn-ui/SKILL.md` for the full CLI/MCP workflow, then:

1.  **Initialization:** If initializing shadcn/ui for the first time, run `bunx --bun shadcn@latest init` and follow the interactive prompts. This action will set up the core configuration.
2.  **Component Installation:** When a specific shadcn/ui component is needed for UI implementation (e.g., a dialog, button, card) and it is not yet installed, run `bunx --bun shadcn@latest add [component-name]`. This command will install the component and its dependencies.
3.  **Taste Customization:** Immediately after installation, apply custom overrides via a wrapper component in `components/` to ensure adherence to HKCardVault's premium Fintech design language and `DESIGN.md`.
4.  **Token Sync:** Update CSS variables in `app/globals.css` to precisely match `DESIGN.md` tokens.
5.  **Verification:** Verify changes with `tsc --noEmit` and thorough visual QA.

---

## Validation Checklist

- [ ] `DESIGN.md` tokens loaded and synced to `globals.css`
- [ ] No default `rounded-md` remaining — using `DESIGN.md` border-radius values
- [ ] No neon/purple focus rings on any interactive element
- [ ] No `shadow-md` or `shadow-lg` — using structural lines or diffused micro-shadows
- [ ] All price/grade fields use `font-mono`
- [ ] Escrow stepper matches Fintech timeline spec
- [ ] All modals have `backdrop-blur-sm` + spring entry animation
- [ ] All class composition uses `cn()`
- [ ] `components/ui/` files are unmodified
