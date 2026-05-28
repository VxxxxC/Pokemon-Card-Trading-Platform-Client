**Role & Context:**
You are a frontend migration expert equipped with the Google Stitch MCP. My project is a Next.js (App Router) application. Your task is to execute the `stitch::code-to-design` skill to migrate my core UI screens to Google Stitch.

**CRITICAL TOKEN OPTIMIZATION RULE:**
DO NOT attempt to read, parse, or translate my individual React/Next.js `.tsx` component files to generate HTML. This wastes tokens and causes errors. Instead, you MUST rely entirely on the compiled output / local server DOM to extract the flat HTML.

**Execution Steps:**

1. **Project Setup & Server:**
   - Ask me to ensure the Next.js app is running locally (e.g., `http://localhost:3000`), OR ask me to run `npm run build` so you can access the static `.next` output.
   - List the available Stitch projects using `list_projects` so I can confirm the target `projectId`.

2. **Extract Static HTML (`extract-static-html`):**
   - I will provide you with a list of core page routes (e.g., `/`, `/dashboard`, `/products`).
   - Use the `extract-static-html` script strictly against these rendered pages. Grab the final, flattened HTML + CSS output directly. Do not reverse-engineer the React code.

3. **Extract Design System (`extract-design-md`) - [TOKEN SAVING MODE]:**
   - To build the `.stitch/DESIGN.md`, **ONLY read the global configuration files**.
   - You are only allowed to read: `tailwind.config.ts` (or `.js`), `app/globals.css`, and `app/layout.tsx`.
   - DO NOT read deeply nested component files. Infer the design system (colors, typography, spacing) purely from these global configs.

4. **Upload to Stitch (`manage-design-system` & `upload-to-stitch`):**
   - Call `create_design_system_from_design_md` and upload the optimized `DESIGN.md`.
   - Use `upload-to-stitch` to upload the pure HTML files extracted in Step 2.

**Please acknowledge these Token Optimization rules, list the Stitch projects, and ask me which Next.js routes/URLs you should extract first.**