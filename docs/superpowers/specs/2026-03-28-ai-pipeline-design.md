# AI Pipeline — Design Spec

**Date:** 2026-03-28
**Plan:** 5
**Status:** Approved

---

## Overview

Plan 5 builds the two-stage AI pipeline that turns stored feedback inputs into structured insights and feature proposals. It also delivers the frontend that renders those results in the project workspace.

---

## Decisions Made

| Topic | Decision |
|---|---|
| Trigger | Existing "Analyze" button on workspace page — no new button |
| Re-run | Overwrite — delete old insights/proposals and replace on each run |
| Loading UX | Spinner while processing, results rendered all at once on completion |
| Theme cap | Hard cap of 5 themes (set in Stage 1 prompt) |
| Proposal cap | Hard cap of 5 proposals — one per theme, always 1:1, no mismatch |
| Pipeline transport | API route handler (`/api/projects/[id]/analyze`) — avoids server action timeout risk on Vercel |
| Staleness UX | New inputs added after analysis show a "Not included" visual group + amber stale notice on Themes/Proposals; results are not cleared until Re-analyze is clicked |
| All quotes | "View all N quotes" button on each theme card opens a modal/drawer — no extra AI cost, data already stored |

---

## Architecture

### Data Flow

```
[Analyze button click]
        ↓
[POST /api/projects/[id]/analyze]
        ↓
 1. Auth check            → 401 if no session
 2. Ownership check       → 403 if project not owned by user
 3. Rate limit check      → 429 if >5 runs in last hour (per user)
 4. Fetch feedback_files  → 400 if none exist
        ↓
[lib/ai/synthesize.ts]  — Stage 1
 - Assemble prompt: all file content + source labels
 - Call model via Vercel AI SDK (generateObject)
 - Validate response with SynthesisOutputSchema (already exists)
 - Take top 5 themes (model instructed to return ≤5)
        ↓
[lib/ai/generate-proposals.ts]  — Stage 2
 - For each theme (up to 5), call model sequentially
 - Validate each response with ProposalOutputSchema (already exists)
        ↓
[app/actions/analysis.ts]  — Persistence
 - Delete existing insights + proposals for this project
 - Insert new insights rows
 - Insert new proposals rows
 - Insert analysis_run row (for rate limiting)
        ↓
[Return JSON: { insights, proposals }]
        ↓
[Client component re-fetches / router.refresh()]
```

### New Files

| File | Purpose |
|---|---|
| `lib/ai/synthesize.ts` | Stage 1 — build prompt, call model, return validated themes |
| `lib/ai/generate-proposals.ts` | Stage 2 — one proposal per theme, sequential calls |
| `app/api/projects/[id]/analyze/route.ts` | POST handler — auth, rate limit, orchestrate pipeline |
| `app/actions/analysis.ts` | Server actions — persist insights + proposals, fetch both |
| `supabase/migrations/003_insights_proposals.sql` | `insights`, `proposals`, `analysis_runs` tables |
| `components/projects/workspace/analyze-button.tsx` | Client component wrapping the Analyze button with loading state |
| `components/projects/workspace/themes-section.tsx` | Renders theme cards with frequency badges and quotes |
| `components/projects/workspace/proposals-section.tsx` | Renders expandable proposal cards |
| `components/projects/workspace/quotes-modal.tsx` | Modal/drawer for "View all quotes" on a theme |

### Modified Files

| File | Change |
|---|---|
| `app/(app)/projects/[id]/page.tsx` | Fetch insights + proposals; pass to new section components; wire AnalyzeButton; compute staleness |
| `lib/types/database.ts` | No changes — Insight and Proposal types already defined |

---

## Security & Rate Limiting

### Auth

Route handler checks Supabase session before any work. No session → 401, no AI call made.

### Ownership

After auth, verify `project.user_id === session.user.id`. Prevents authenticated users from triggering analysis on other users' projects → 403.

### Rate Limiting

Tracked in a lightweight `analysis_runs` table:

```sql
analysis_runs (
  id         uuid primary key,
  user_id    uuid references auth.users not null,
  project_id uuid references projects not null,
  created_at timestamptz default now()
)
```

Before running: count `analysis_runs` where `user_id = ?` and `created_at > now() - interval '1 hour'`. If ≥ 5, return 429.

After successful run: insert a row. No Redis or external dependency needed.

---

## Database Migration (003)

Three new tables:

**`insights`**
```sql
id          uuid primary key default gen_random_uuid()
project_id  uuid references projects(id) on delete cascade not null
theme_name  text not null
frequency   text not null
quotes      jsonb not null  -- InsightQuote[]
created_at  timestamptz default now()
```

**`proposals`**
```sql
id                    uuid primary key default gen_random_uuid()
project_id            uuid references projects(id) on delete cascade not null
feature_name          text not null
problem_statement     text not null
evidence              jsonb not null  -- ProposalEvidence[]
ui_changes            jsonb not null  -- string[]
data_model_changes    jsonb not null  -- string[]
workflow_changes      jsonb not null  -- string[]
engineering_tasks     jsonb not null  -- string[]
created_at            timestamptz default now()
```

**`analysis_runs`** (rate limiting)
```sql
id          uuid primary key default gen_random_uuid()
user_id     uuid references auth.users(id) on delete cascade not null
project_id  uuid references projects(id) on delete cascade not null
created_at  timestamptz default now()
```

RLS on all three: authenticated users can only read/write rows where `project_id` belongs to a project they own.

---

## AI Pipeline

### Stage 1 — Synthesize (`lib/ai/synthesize.ts`)

- Uses Vercel AI SDK `generateObject` with a local `SynthesisResultSchema` — a relaxed variant of `SynthesisOutputSchema` that allows `themes: z.array(ThemeSchema)` (no `.min(1)`). This lets the model return an empty array for insufficient-signal inputs without a schema validation error.
- The existing `SynthesisOutputSchema` (which enforces `.min(1)`) is unchanged and remains correct for contexts that assert non-empty results.
- System prompt is stable (cacheable): defines the analyst role and grounding rules
- User prompt assembles all feedback content with source labels
- Instructs model to return **at most 5 themes**, ranked by frequency/signal strength
- Returns `{ themes: Theme[] }` — empty array signals insufficient input

### Stage 2 — Generate Proposals (`lib/ai/generate-proposals.ts`)

- Receives the array of themes from Stage 1
- Iterates sequentially (not parallel) — avoids rate limit issues with the model provider
- For each theme: calls `generateObject` with `ProposalOutputSchema`
- System prompt is stable (cacheable)
- Returns `ProposalOutput[]`

### Model Config

- Provider: `@ai-sdk/anthropic` (already installed)
- Model: `env.AI_MODEL` (defaults to `claude-sonnet-4-5`)
- No code changes required to swap models

### Failure Handling

| Failure | Behavior |
|---|---|
| No feedback files | 400 before any AI call |
| Model returns insufficient signal | Stage 1 returns empty `themes` array → return `{ insights: [], proposals: [], signal: 'insufficient' }` |
| Stage 1 schema validation fails | Return 500 with error code `SYNTHESIS_PARSE_ERROR` |
| Stage 2 schema validation fails for one proposal | Skip that proposal, continue with remaining |
| Model timeout / provider error | Return 500 with error code `MODEL_ERROR` |
| Rate limit exceeded | Return 429 with `Retry-After` hint |

---

## Frontend

### Workspace Page Changes

The workspace page remains a Server Component. It additionally fetches `insights` and `proposals` for the project on load.

Staleness is computed server-side:
- `lastAnalyzedAt` = most recent `analysis_runs.created_at` for the project (or null)
- `newInputsCount` = count of `feedback_files.created_at > lastAnalyzedAt`
- `isStale` = `newInputsCount > 0`

Props passed to components:
- `AnalyzeButton`: `hasInputs`, `isStale`, `projectId`
- `InputsSection`: `files`, `projectId`, `lastAnalyzedAt` — used to split files into "included" and "not included" groups
- `ThemesSection`: `insights`, `isStale`
- `ProposalsSection`: `proposals`, `isStale`, `inputCount` (total inputs at time of last run, for the stale notice message)

### AnalyzeButton (`components/projects/workspace/analyze-button.tsx`)

Client component. Replaces the current static `<Button>` in the page header.

States:
- **Ready**: "Analyze" label, enabled when inputs exist
- **Stale**: "Re-analyze" label + amber dot indicator when `isStale`
- **Loading**: spinner + "Analyzing…" label, both Add inputs and button disabled
- **Error**: brief inline error toast, returns to ready state

On click: `POST /api/projects/[id]/analyze` → on success, `router.refresh()` to reload server component data.

### ThemesSection (`components/projects/workspace/themes-section.tsx`)

Renders when `insights.length > 0`. Each theme card shows:
- Theme name
- Frequency badge (analogous color scale: `analog-1` high, `analog-2` mid, `analog-3` low)
- Top 2 quotes inline
- "View all N quotes" button → opens `QuotesModal`

Stale notice banner shown at top of section when `isStale`.

Card hover: three-property animation per design system §8.7 (transform + box-shadow + border-color, 320ms).

### ProposalsSection (`components/projects/workspace/proposals-section.tsx`)

Renders when `proposals.length > 0`. Expandable cards:
- Collapsed: shows proposal number + feature name + chevron
- Expanded: all sections rendered in order per `output-spec.md`:
  1. Problem Statement
  2. User Evidence (quotes with source labels)
  3. Suggested UI Changes
  4. Suggested Data Model Changes (omitted if empty array)
  5. Suggested Workflow Changes (omitted if empty array)
  6. Engineering Tasks
  - Export actions: "Copy Markdown" + "Download .md" (Plan 7 scope — buttons present but inert in Plan 5)

Stale notice banner shown at top when `isStale`.

### QuotesModal (`components/projects/workspace/quotes-modal.tsx`)

Opens when "View all quotes" is clicked on a theme card. Renders all quotes for that insight from the already-loaded `insights` data. No additional fetch required.

### Locked → Unlocked Transition

When `insights` and `proposals` arrive (after `router.refresh()`), the `LockedSection` components are replaced by `ThemesSection` and `ProposalsSection`. The `ScrollReveal` wrapper provides the entrance animation (opacity 0→1, translateY 16→0, 280ms per design system §8.5).

---

## Stats Header Update

The workspace header currently shows `Themes: —` and `Proposals: —`. After analysis:
- Count values update to actual numbers
- Values rendered in `--accent-primary` (amber) to draw attention

These are driven by `insights.length` and `proposals.length` passed from the server component — no client state needed.

---

## Not In Scope (Plan 5)

- Markdown export (Plan 7)
- Streaming output
- Proposal editing
- Analysis history / run comparison
- `analysisRunId` linkage on insights/proposals

---

## Testing

- Unit tests for `synthesize.ts` and `generate-proposals.ts` — mock `generateObject`, test prompt assembly and schema validation
- Unit tests for `analysis.ts` server actions — mock Supabase client
- Integration test for the route handler — test auth, ownership, rate limit, and happy path
- Component tests for `AnalyzeButton`, `ThemesSection`, `ProposalsSection` states
