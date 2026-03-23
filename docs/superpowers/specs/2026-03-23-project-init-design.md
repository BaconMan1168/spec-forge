# SpecForge — Project Initialization Design

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Initialize the SpecForge codebase from scratch using `create-next-app` as the base scaffold, then layer on all required dependencies per the engineering spec. Boilerplate is removed after scaffolding. No product features are implemented — this is infrastructure only.

---

## Approach

Use `pnpm create next-app` with TypeScript + Tailwind CSS + App Router flags, then:
1. Remove default boilerplate content (sample page, default styles)
2. Add all project dependencies
3. Set up config files
4. Create Zod schemas for AI output contracts
5. Add initial tests for those schemas

---

## Repo Structure

```
spec-forge/
  app/
    layout.tsx          # root layout with Inter font + design token CSS vars
    page.tsx            # minimal placeholder
    globals.css         # CSS custom properties from design system
  components/
    .gitkeep            # preserves directory in git
  lib/
    schemas/
      synthesis.ts      # Zod schema for Stage 1 AI output
      synthesis.test.ts # Tests for synthesis schema
      proposal.ts       # Zod schema for Stage 2 AI output
      proposal.test.ts  # Tests for proposal schema
  supabase/
    .gitkeep            # preserves directory in git, ready for migrations
  public/               # empty
  docs/
  .env.example
  .env.local            # gitignored
  package.json
  tsconfig.json
  tailwind.config.ts
  next.config.ts
  vitest.config.ts
```

---

## Dependencies

### Production
| Package | Purpose |
|---|---|
| `next` | Framework |
| `react`, `react-dom` | UI runtime |
| `@supabase/supabase-js` | Supabase client |
| `@supabase/ssr` | SSR-safe Supabase client helpers |
| `ai` | Vercel AI SDK |
| `@ai-sdk/anthropic` | Anthropic provider for Vercel AI SDK |
| `zod` | Schema validation |
| `stripe` | Stripe server SDK |
| `@stripe/stripe-js` | Stripe client SDK |
| `pdf-parse` | PDF text extraction |
| `mammoth` | DOCX text extraction |

### Development
| Package | Purpose |
|---|---|
| `typescript` | Type checking |
| `@types/node`, `@types/react`, `@types/react-dom` | Type definitions |
| `tailwindcss`, `postcss`, `autoprefixer` | Styling |
| `@types/pdf-parse` | Types for pdf-parse (mammoth ships its own types) |
| `vitest` | Test runner |
| `@vitejs/plugin-react` | React support for Vitest |
| `@testing-library/react` | React component testing utilities |
| `@testing-library/jest-dom` | DOM matchers |
| `jsdom` | DOM environment for tests |

---

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

---

## Environment Variables

`.env.example` (committed):

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# AI
AI_MODEL=claude-sonnet-4-5
ANTHROPIC_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

`.env.local` is gitignored and never committed.

---

## Initial Tests

Two Zod schema files establish the AI output contracts:

**`lib/schemas/synthesis.ts`** — Stage 1 output schema
```ts
themes: Array<{
  themeName: string
  frequency: string  // human-readable signal per data-model.md ("simple user-readable signal in MVP")
  quotes: Array<{ quote: string; sourceLabel: string }>
}>
```

**`lib/schemas/proposal.ts`** — Stage 2 output schema (matches output-spec.md exactly)
```ts
{
  featureName: string
  problemStatement: string
  userEvidence: Array<{ quote: string; sourceLabel: string }>
  suggestedUiChanges: string[]
  suggestedDataModelChanges: string[]
  suggestedWorkflowChanges: string[]
  engineeringTasks: string[]
}
```

**Tests validate:**
- Valid output passes schema
- Missing required fields fail
- Empty required arrays fail
- Quote source labels are required
- Extra fields are stripped (no passthrough)

---

## What Is NOT Included

- No product feature implementation
- No Supabase migrations (schema defined in data-model.md, migrations come later)
- No auth flows
- No UI components beyond minimal placeholder
- No Stripe webhook handlers
