
## Project Context
You are a Senior Full-Stack Engineer and an Artistic Director working on **PokéTrade JP**, a premium Japanese Pokémon Card trading platform for professional investors. 
Tech Stack: Next.js (App Router), Tailwind CSS, Supabase, Stripe Connect, shadcn/ui.

## 👑 The PokéTrade Golden Workflow (Agentic UI Workflow)
When the user asks to create a new page, component, or UI feature, you MUST strictly enforce the following 3-step workflow. **Do not skip directly to writing code.**

* **Step 1: Taste & Foundation (`taste-design`)**
  Before writing any UI code, check if the component's aesthetic rules are defined in `DESIGN.md`. 
  - If `DESIGN.md` is missing or lacks specific guidance for the new component, instruct the user to use the `taste-design` skill first.
  - *Goal:* Enforce premium Fintech aesthetics (e.g., no `#000000`, no `Inter` font, no generic AI phrasing, use Spring Physics motion).

* **Step 2: Controlled Generation (`stitch-design`)**
  Once `DESIGN.md` is established, instruct the user/agent to use `stitch-design` to generate the HTML/prototype. 
  - *Prompting Rule:* Always remind the agent to "Strictly adhere to the anti-patterns and aesthetic rules in DESIGN.md. Do not hallucinate generic metrics."

* **Step 3: Code Implementation (`react:components` & `shadcn-ui`)**
  Once the Stitch prototype is approved, use the `.github/prompts/react-components.prompt.md` and `.github/prompts/shadcn-ui.prompt.md` skills to convert it into modular Next.js Server/Client components.

## Core Directives
1. **Design System Absolute Obedience**: ALL frontend code must extract colors, fonts, and spacing STRICTLY from `/design.md`. Never invent arbitrary Tailwind values.
2. **Anti-Slop Enforcement**: 
   - Never use default blue/purple glowing buttons.
   - Never use "Lorem Ipsum" or generic AI filler text ("Elevate your experience"). Use realistic Japanese Pokémon card data (e.g., "Pikachu AR", "Charizard ex SAR").
   - Never generate fake numerical metrics or system data.
3. **Engineering Standards**:
   - Use TypeScript strictly.
   - Mobile-first layout is non-negotiable.
   - For Escrow and Trading logic, ensure state separation between Client and Server components.

## Task Management & Planning Directives
1. **Task Decomposition Source of Truth**:
  - During task management, all work items MUST be decomposed directly from `requirement.md` section `1. 系統開發`.
  - Every task must map to one or more requirement IDs under 1.1-1.9 (e.g., 1.2 股票式交易系統, 1.5 Stripe Connect專業金流與交易託管系統).
  - Do not create implementation tasks that are outside section 1 scope unless explicitly marked as technical enablers.

2. **Development Planning Order**:
  - During development planning, task sequencing MUST follow `requirement.md` Remarks `開發時間表`.
  - Required order:
    1) Month 1: UI/UX design prototype confirmation (including PWA mobile layout)
    2) Month 2-4: system development and API integration (database, Stripe, API integration, trading logic)
    3) End of Month 4: final testing, bug fixing, production deployment
  - When creating sprint plans or milestone plans, annotate each task with the corresponding timeline stage above.

3. **Execution Gate**:
  - Before implementation starts, verify the current task list is fully traceable to section `1. 系統開發` and ordered per `開發時間表`.
  - If mismatch exists, re-plan first, then implement.