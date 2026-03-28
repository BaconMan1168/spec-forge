# AI Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a two-stage AI pipeline (synthesis → proposals) triggered by the existing Analyze button, persisted to Supabase, and rendered in the project workspace with theme cards, expandable proposal cards, and staleness indicators.

**Architecture:** A Next.js API route handler (`POST /api/projects/[id]/analyze`) orchestrates auth, rate limiting, two sequential AI calls via Vercel AI SDK, and DB persistence via server actions. The workspace page (Server Component) fetches results on load and passes them to new client components. The existing Analyze button is replaced by a client `AnalyzeButton` component that manages loading/error state and calls `router.refresh()` on success.

**Tech Stack:** Vercel AI SDK (`ai` v6 + `@ai-sdk/anthropic` v3), Zod (schemas already defined), Supabase (new tables via migration), Next.js 15 App Router, `motion/react` for animations, Vitest + Testing Library for tests.

---

## File Map

| Action | File | Responsibility |
|---|---|---|
| Create | `supabase/migrations/003_insights_proposals.sql` | insights, proposals, analysis_runs tables + RLS |
| Create | `lib/ai/synthesize.ts` | Stage 1 — call model, return validated themes |
| Create | `lib/ai/synthesize.test.ts` | Unit tests for synthesize |
| Create | `lib/ai/generate-proposals.ts` | Stage 2 — one proposal per theme, sequential |
| Create | `lib/ai/generate-proposals.test.ts` | Unit tests for generate-proposals |
| Create | `app/actions/analysis.ts` | Persist/fetch insights, proposals, analysis_runs |
| Create | `app/actions/analysis.test.ts` | Unit tests for analysis actions |
| Create | `app/api/projects/[id]/analyze/route.ts` | POST handler — auth, rate limit, pipeline |
| Create | `app/api/projects/[id]/analyze/route.test.ts` | Tests for route handler |
| Create | `components/projects/workspace/analyze-button.tsx` | Client button — loading/stale/error states |
| Create | `components/projects/workspace/analyze-button.test.tsx` | Component tests |
| Create | `components/projects/workspace/themes-section.tsx` | Theme cards with frequency badges + quotes |
| Create | `components/projects/workspace/themes-section.test.tsx` | Component tests |
| Create | `components/projects/workspace/quotes-modal.tsx` | Modal showing all quotes for a theme |
| Create | `components/projects/workspace/quotes-modal.test.tsx` | Component tests |
| Create | `components/projects/workspace/proposals-section.tsx` | Expandable proposal cards |
| Create | `components/projects/workspace/proposals-section.test.tsx` | Component tests |
| Modify | `components/projects/workspace/inputs-section.tsx` | Add `lastAnalyzedAt` prop for staleness grouping |
| Modify | `components/projects/workspace/inputs-section.test.tsx` | Update tests for new prop |
| Modify | `app/(app)/projects/[id]/page.tsx` | Fetch results, compute staleness, wire all components |

---

## Task 1: DB Migration — insights, proposals, analysis_runs

**Files:**
- Create: `supabase/migrations/003_insights_proposals.sql`

- [ ] **Step 1: Write the migration**

```sql
-- Migration 003: insights, proposals, and analysis_runs tables
-- Run manually in Supabase SQL editor

-- insights: surfaced themes from Stage 1 analysis
create table if not exists insights (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references projects(id) on delete cascade not null,
  theme_name  text not null,
  frequency   text not null,
  quotes      jsonb not null default '[]',
  created_at  timestamptz default now() not null
);

-- proposals: feature proposals from Stage 2 analysis
create table if not exists proposals (
  id                    uuid primary key default gen_random_uuid(),
  project_id            uuid references projects(id) on delete cascade not null,
  feature_name          text not null,
  problem_statement     text not null,
  evidence              jsonb not null default '[]',
  ui_changes            jsonb not null default '[]',
  data_model_changes    jsonb not null default '[]',
  workflow_changes      jsonb not null default '[]',
  engineering_tasks     jsonb not null default '[]',
  created_at            timestamptz default now() not null
);

-- analysis_runs: lightweight rate limiting + staleness tracking
create table if not exists analysis_runs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  project_id  uuid references projects(id) on delete cascade not null,
  input_count int not null default 0,
  created_at  timestamptz default now() not null
);

-- Indexes for common queries
create index if not exists insights_project_id_idx on insights(project_id);
create index if not exists proposals_project_id_idx on proposals(project_id);
create index if not exists analysis_runs_user_id_created_at_idx on analysis_runs(user_id, created_at desc);
create index if not exists analysis_runs_project_id_created_at_idx on analysis_runs(project_id, created_at desc);

-- RLS: insights
alter table insights enable row level security;

create policy "Users can read their own project insights"
on insights for select
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can insert insights for their own projects"
on insights for insert
to authenticated
with check (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can delete insights for their own projects"
on insights for delete
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

-- RLS: proposals
alter table proposals enable row level security;

create policy "Users can read their own project proposals"
on proposals for select
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can insert proposals for their own projects"
on proposals for insert
to authenticated
with check (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

create policy "Users can delete proposals for their own projects"
on proposals for delete
to authenticated
using (
  project_id in (
    select id from projects where user_id = auth.uid()
  )
);

-- RLS: analysis_runs
alter table analysis_runs enable row level security;

create policy "Users can read their own analysis runs"
on analysis_runs for select
to authenticated
using (auth.uid() = user_id);

create policy "Users can insert their own analysis runs"
on analysis_runs for insert
to authenticated
with check (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration in Supabase SQL editor**

Paste the contents of `supabase/migrations/003_insights_proposals.sql` into the Supabase SQL editor and run it. Verify no errors appear and the three tables exist in the Table Editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/003_insights_proposals.sql
git commit -m "feat: add insights, proposals, and analysis_runs migrations"
```

---

## Task 2: Synthesize module (Stage 1)

**Files:**
- Create: `lib/ai/synthesize.ts`
- Create: `lib/ai/synthesize.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai/synthesize.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-model"),
}));

vi.mock("@/lib/env", () => ({
  env: { AI_MODEL: "claude-sonnet-4-5" },
}));

import { generateObject } from "ai";
import { synthesize } from "./synthesize";
import type { FeedbackFile } from "@/lib/types/database";

const mockFile = (id: string, content: string, sourceType: string): FeedbackFile => ({
  id,
  project_id: "p1",
  file_name: "file.txt",
  source_type: sourceType,
  content,
  storage_url: null,
  mime_type: "text/plain",
  input_method: "upload",
  word_count: 10,
  created_at: "2026-01-01T00:00:00Z",
});

beforeEach(() => vi.clearAllMocks());

describe("synthesize", () => {
  it("returns themes when model responds with valid data", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: {
        themes: [
          {
            themeName: "Onboarding confusion",
            frequency: "6 of 8 sources",
            quotes: [{ quote: "I was lost", sourceLabel: "Interview" }],
          },
        ],
      },
    });

    const files = [mockFile("f1", "I was lost after signup", "Interview")];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(1);
    expect(result.themes[0].themeName).toBe("Onboarding confusion");
    expect(generateObject).toHaveBeenCalledOnce();
  });

  it("returns empty themes array when model returns no themes (insufficient signal)", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: { themes: [] },
    });

    const files = [mockFile("f1", "ok", "Survey")];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(0);
  });

  it("includes source labels in the assembled prompt", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: { themes: [] },
    });

    const files = [mockFile("f1", "feedback text", "Support Ticket")];
    await synthesize(files);

    const call = (generateObject as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.prompt).toContain("Support Ticket");
    expect(call.prompt).toContain("feedback text");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/ai/synthesize.test.ts
```

Expected: FAIL — `Cannot find module './synthesize'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai/synthesize.ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { env } from "@/lib/env";
import { ThemeSchema } from "@/lib/schemas/synthesis";
import type { FeedbackFile } from "@/lib/types/database";

// Relaxed schema — allows empty themes for insufficient-signal case
// Does NOT modify the existing SynthesisOutputSchema (which enforces .min(1))
const SynthesisResultSchema = z.object({
  themes: z.array(ThemeSchema),
});

export type SynthesisResult = z.infer<typeof SynthesisResultSchema>;

const SYSTEM_PROMPT = `You are an expert product analyst synthesizing customer feedback for a product team.

Your job is to identify recurring themes, pain points, and opportunities across all provided feedback.

Rules:
- Only use the provided source text. Do not fabricate or embellish quotes.
- Quotes must be verbatim or near-verbatim and clearly attributable to a provided source label.
- Group semantically similar feedback into recurring themes.
- Prefer meaningful recurring pain points over one-off comments.
- Return AT MOST 5 themes, ranked by frequency and signal strength (strongest first).
- If signal is weak or no recurring themes exist, return an empty themes array instead of forcing themes.

Return a structured result with themes containing themeName, frequency (human-readable string like "6 of 8 sources"), and representative quotes with source labels.`;

function buildUserPrompt(files: FeedbackFile[]): string {
  const sections = files
    .map(
      (f, i) =>
        `--- Source ${i + 1}: ${f.source_type} ---\n${f.content.trim()}`
    )
    .join("\n\n");

  return `Analyze the following ${files.length} feedback input(s) and identify recurring themes:\n\n${sections}`;
}

export async function synthesize(files: FeedbackFile[]): Promise<SynthesisResult> {
  const { object } = await generateObject({
    model: anthropic(env.AI_MODEL),
    schema: SynthesisResultSchema,
    system: SYSTEM_PROMPT,
    prompt: buildUserPrompt(files),
  });

  return object;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/ai/synthesize.test.ts
```

Expected: PASS — 3 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/ai/synthesize.ts lib/ai/synthesize.test.ts
git commit -m "feat: add Stage 1 synthesize module with tests"
```

---

## Task 3: Generate Proposals module (Stage 2)

**Files:**
- Create: `lib/ai/generate-proposals.ts`
- Create: `lib/ai/generate-proposals.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/ai/generate-proposals.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-model"),
}));

vi.mock("@/lib/env", () => ({
  env: { AI_MODEL: "claude-sonnet-4-5" },
}));

import { generateObject } from "ai";
import { generateProposals } from "./generate-proposals";
import type { Theme } from "@/lib/schemas/synthesis";

const mockTheme: Theme = {
  themeName: "Onboarding confusion",
  frequency: "6 of 8 sources",
  quotes: [{ quote: "I was lost", sourceLabel: "Interview" }],
};

const mockProposalObject = {
  featureName: "Guided Onboarding Flow",
  problemStatement: "Users struggle to get started.",
  userEvidence: [{ quote: "I was lost", sourceLabel: "Interview" }],
  suggestedUiChanges: ["Add a welcome checklist"],
  suggestedDataModelChanges: [],
  suggestedWorkflowChanges: ["Show checklist on first login"],
  engineeringTasks: ["Build OnboardingChecklist component"],
};

beforeEach(() => vi.clearAllMocks());

describe("generateProposals", () => {
  it("returns one proposal per theme", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: mockProposalObject,
    });

    const result = await generateProposals([mockTheme]);

    expect(result).toHaveLength(1);
    expect(result[0].featureName).toBe("Guided Onboarding Flow");
    expect(generateObject).toHaveBeenCalledOnce();
  });

  it("calls model sequentially for multiple themes", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: mockProposalObject,
    });

    const themes = [mockTheme, { ...mockTheme, themeName: "CSV export missing" }];
    const result = await generateProposals(themes);

    expect(result).toHaveLength(2);
    expect(generateObject).toHaveBeenCalledTimes(2);
  });

  it("skips a theme when model response fails validation and continues", async () => {
    (generateObject as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ object: mockProposalObject })
      .mockRejectedValueOnce(new Error("model timeout"));

    const themes = [mockTheme, { ...mockTheme, themeName: "Broken" }];
    const result = await generateProposals(themes);

    expect(result).toHaveLength(1);
    expect(result[0].featureName).toBe("Guided Onboarding Flow");
  });

  it("returns empty array when given empty themes", async () => {
    const result = await generateProposals([]);
    expect(result).toHaveLength(0);
    expect(generateObject).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/ai/generate-proposals.test.ts
```

Expected: FAIL — `Cannot find module './generate-proposals'`

- [ ] **Step 3: Write the implementation**

```ts
// lib/ai/generate-proposals.ts
import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { env } from "@/lib/env";
import { ProposalOutputSchema, type ProposalOutput } from "@/lib/schemas/proposal";
import type { Theme } from "@/lib/schemas/synthesis";

const SYSTEM_PROMPT = `You are generating a structured product feature proposal from validated customer feedback.

Rules:
- Only use evidence provided from the source material. Do not fabricate quotes or unsupported claims.
- Scope the proposal to a single feature or opportunity matching the provided theme.
- Write a concise problem statement in plain language (2-3 sentences).
- Suggest UI, workflow, and data model changes only if justified by the evidence.
- If data model changes or workflow changes are not needed, return empty arrays for those fields.
- Break engineering work into atomic, implementation-ready steps suitable for AI coding agents.
- If the evidence is too weak, still produce the best proposal you can from the available quotes.

Return the proposal with all required fields: featureName, problemStatement, userEvidence, suggestedUiChanges, suggestedDataModelChanges, suggestedWorkflowChanges, engineeringTasks.`;

function buildProposalPrompt(theme: Theme): string {
  const quotesText = theme.quotes
    .map((q) => `- "${q.quote}" — ${q.sourceLabel}`)
    .join("\n");

  return `Generate a structured feature proposal for the following theme:

Theme: ${theme.themeName}
Frequency: ${theme.frequency}

Supporting evidence:
${quotesText}`;
}

export async function generateProposals(themes: Theme[]): Promise<ProposalOutput[]> {
  const results: ProposalOutput[] = [];

  for (const theme of themes) {
    try {
      const { object } = await generateObject({
        model: anthropic(env.AI_MODEL),
        schema: ProposalOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: buildProposalPrompt(theme),
      });
      results.push(object);
    } catch {
      // Skip failed proposals — continue with remaining themes
      // Per spec: "Stage 2 schema validation fails for one proposal → Skip that proposal, continue"
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/ai/generate-proposals.test.ts
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/ai/generate-proposals.ts lib/ai/generate-proposals.test.ts
git commit -m "feat: add Stage 2 generate-proposals module with tests"
```

---

## Task 4: Analysis server actions

**Files:**
- Create: `app/actions/analysis.ts`
- Create: `app/actions/analysis.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/actions/analysis.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFrom,
  mockSelect,
  mockInsert,
  mockDelete,
  mockEq,
  mockOrder,
  mockSingle,
  mockLt,
  mockGt,
} = vi.hoisted(() => {
  const mockLt = vi.fn();
  const mockGt = vi.fn();
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
    lt: mockLt,
    gt: mockGt,
  }));
  return { mockFrom, mockSelect, mockInsert, mockDelete, mockEq, mockOrder, mockSingle, mockLt, mockGt };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}));

import {
  persistAnalysisResults,
  getInsights,
  getProposals,
  getLastAnalysisRun,
} from "./analysis";
import type { ProposalOutput } from "@/lib/schemas/proposal";
import type { Theme } from "@/lib/schemas/synthesis";

const mockTheme: Theme = {
  themeName: "Onboarding confusion",
  frequency: "6 of 8 sources",
  quotes: [{ quote: "I was lost", sourceLabel: "Interview" }],
};

const mockProposal: ProposalOutput = {
  featureName: "Guided Onboarding Flow",
  problemStatement: "Users struggle to get started.",
  userEvidence: [{ quote: "I was lost", sourceLabel: "Interview" }],
  suggestedUiChanges: ["Add a welcome checklist"],
  suggestedDataModelChanges: [],
  suggestedWorkflowChanges: ["Show checklist on first login"],
  engineeringTasks: ["Build component"],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });
});

describe("persistAnalysisResults", () => {
  it("deletes existing insights and proposals before inserting new ones", async () => {
    mockInsert.mockReturnValue({ select: vi.fn().mockResolvedValue({ data: [], error: null }) });

    await persistAnalysisResults({
      projectId: "p1",
      userId: "u1",
      themes: [mockTheme],
      proposals: [mockProposal],
      inputCount: 3,
    });

    expect(mockFrom).toHaveBeenCalledWith("insights");
    expect(mockFrom).toHaveBeenCalledWith("proposals");
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("getInsights", () => {
  it("queries insights ordered by created_at ascending", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await getInsights("p1");
    expect(mockFrom).toHaveBeenCalledWith("insights");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("getProposals", () => {
  it("queries proposals ordered by created_at ascending", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await getProposals("p1");
    expect(mockFrom).toHaveBeenCalledWith("proposals");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("getLastAnalysisRun", () => {
  it("queries analysis_runs for the project ordered by created_at desc and returns first", async () => {
    mockSingle.mockResolvedValue({
      data: { id: "r1", created_at: "2026-03-28T00:00:00Z", input_count: 5 },
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: vi.fn().mockReturnValue({ single: mockSingle }) });

    const result = await getLastAnalysisRun("p1");
    expect(mockFrom).toHaveBeenCalledWith("analysis_runs");
    expect(result?.id).toBe("r1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test app/actions/analysis.test.ts
```

Expected: FAIL — `Cannot find module './analysis'`

- [ ] **Step 3: Write the implementation**

```ts
// app/actions/analysis.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import type { Theme } from "@/lib/schemas/synthesis";
import type { ProposalOutput } from "@/lib/schemas/proposal";
import type { Insight, Proposal } from "@/lib/types/database";

interface AnalysisRun {
  id: string;
  user_id: string;
  project_id: string;
  input_count: number;
  created_at: string;
}

export async function persistAnalysisResults({
  projectId,
  userId,
  themes,
  proposals,
  inputCount,
}: {
  projectId: string;
  userId: string;
  themes: Theme[];
  proposals: ProposalOutput[];
  inputCount: number;
}): Promise<void> {
  const supabase = await createClient();

  // Overwrite: delete existing insights and proposals
  await supabase.from("insights").delete().eq("project_id", projectId);
  await supabase.from("proposals").delete().eq("project_id", projectId);

  // Insert new insights
  if (themes.length > 0) {
    await supabase.from("insights").insert(
      themes.map((t) => ({
        project_id: projectId,
        theme_name: t.themeName,
        frequency: t.frequency,
        quotes: t.quotes,
      }))
    );
  }

  // Insert new proposals
  if (proposals.length > 0) {
    await supabase.from("proposals").insert(
      proposals.map((p) => ({
        project_id: projectId,
        feature_name: p.featureName,
        problem_statement: p.problemStatement,
        evidence: p.userEvidence,
        ui_changes: p.suggestedUiChanges,
        data_model_changes: p.suggestedDataModelChanges,
        workflow_changes: p.suggestedWorkflowChanges,
        engineering_tasks: p.engineeringTasks,
      }))
    );
  }

  // Record analysis run for rate limiting and staleness
  await supabase.from("analysis_runs").insert({
    user_id: userId,
    project_id: projectId,
    input_count: inputCount,
  });
}

export async function getInsights(projectId: string): Promise<Insight[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insights")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Insight[];
}

export async function getProposals(projectId: string): Promise<Proposal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Proposal[];
}

export async function getLastAnalysisRun(
  projectId: string
): Promise<AnalysisRun | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return (data as AnalysisRun) ?? null;
}

export async function countRecentRunsByUser(
  userId: string,
  windowMs: number = 60 * 60 * 1000
): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabase
    .from("analysis_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) return 0;
  return count ?? 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test app/actions/analysis.test.ts
```

Expected: PASS — 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add app/actions/analysis.ts app/actions/analysis.test.ts
git commit -m "feat: add analysis server actions with persist, fetch, and rate limit helpers"
```

---

## Task 5: API Route Handler

**Files:**
- Create: `app/api/projects/[id]/analyze/route.ts`
- Create: `app/api/projects/[id]/analyze/route.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/api/projects/[id]/analyze/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ai/synthesize", () => ({
  synthesize: vi.fn(),
}));

vi.mock("@/lib/ai/generate-proposals", () => ({
  generateProposals: vi.fn(),
}));

vi.mock("@/app/actions/analysis", () => ({
  persistAnalysisResults: vi.fn().mockResolvedValue(undefined),
  countRecentRunsByUser: vi.fn().mockResolvedValue(0),
}));

import { createClient } from "@/lib/supabase/server";
import { synthesize } from "@/lib/ai/synthesize";
import { generateProposals } from "@/lib/ai/generate-proposals";
import { countRecentRunsByUser } from "@/app/actions/analysis";
import { POST } from "./route";

const makeRequest = () => new Request("http://localhost/api/projects/proj-1/analyze", { method: "POST" });

const makeSupabase = (overrides: Record<string, unknown> = {}) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
  },
  from: vi.fn((table: string) => {
    if (table === "projects") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "proj-1", user_id: "user-1" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "feedback_files") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "f1", content: "feedback", source_type: "Interview" }],
            error: null,
          }),
        }),
      };
    }
    return {};
  }),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  (synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({ themes: [] });
  (generateProposals as ReturnType<typeof vi.fn>).mockResolvedValue([]);
});

describe("POST /api/projects/[id]/analyze", () => {
  it("returns 401 when user is not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 when project does not belong to user", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "other-user" } } }) },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "proj-1", user_id: "user-1" },
              error: null,
            }),
          }),
        }),
      })),
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    (countRecentRunsByUser as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(429);
  });

  it("returns 400 when no feedback files exist", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      ...makeSupabase(),
      from: vi.fn((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "proj-1", user_id: "user-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "feedback_files") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      }),
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 200 with insights and proposals on success", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    (synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({
      themes: [
        {
          themeName: "Onboarding confusion",
          frequency: "1 of 1 sources",
          quotes: [{ quote: "lost", sourceLabel: "Interview" }],
        },
      ],
    });
    (generateProposals as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        featureName: "Guided Onboarding",
        problemStatement: "Users get lost.",
        userEvidence: [{ quote: "lost", sourceLabel: "Interview" }],
        suggestedUiChanges: ["Add checklist"],
        suggestedDataModelChanges: [],
        suggestedWorkflowChanges: ["Show checklist"],
        engineeringTasks: ["Build it"],
      },
    ]);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signal).toBe("ok");
    expect(body.insightCount).toBe(1);
    expect(body.proposalCount).toBe(1);
  });

  it("returns 200 with insufficient signal when no themes found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    (synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({ themes: [] });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signal).toBe("insufficient");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test "app/api/projects/\[id\]/analyze/route.test.ts"
```

Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write the implementation**

```ts
// app/api/projects/[id]/analyze/route.ts
import { createClient } from "@/lib/supabase/server";
import { synthesize } from "@/lib/ai/synthesize";
import { generateProposals } from "@/lib/ai/generate-proposals";
import {
  persistAnalysisResults,
  countRecentRunsByUser,
} from "@/app/actions/analysis";

export const maxDuration = 60;

const RATE_LIMIT = 5; // max runs per hour per user

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params;
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return Response.json({ error: { code: "UNAUTHORIZED", message: "Not authenticated" } }, { status: 401 });
  }

  // 2. Ownership check
  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id")
    .eq("id", projectId)
    .single();

  if (!project || project.user_id !== user.id) {
    return Response.json({ error: { code: "FORBIDDEN", message: "Project not found" } }, { status: 403 });
  }

  // 3. Rate limit check
  const recentRuns = await countRecentRunsByUser(user.id);
  if (recentRuns >= RATE_LIMIT) {
    return Response.json(
      { error: { code: "RATE_LIMITED", message: "Too many analysis runs. Try again later." } },
      { status: 429, headers: { "Retry-After": "3600" } }
    );
  }

  // 4. Fetch feedback files
  const { data: files, error: filesError } = await supabase
    .from("feedback_files")
    .select("*")
    .eq("project_id", projectId);

  if (filesError || !files || files.length === 0) {
    return Response.json({ error: { code: "NO_INPUTS", message: "No feedback files found" } }, { status: 400 });
  }

  try {
    // Stage 1: Synthesize themes
    const { themes } = await synthesize(files);

    // Insufficient signal — persist empty results and return early
    if (themes.length === 0) {
      await persistAnalysisResults({
        projectId,
        userId: user.id,
        themes: [],
        proposals: [],
        inputCount: files.length,
      });
      return Response.json({ signal: "insufficient", insightCount: 0, proposalCount: 0 });
    }

    // Stage 2: Generate proposals (up to 5, one per theme)
    const proposals = await generateProposals(themes.slice(0, 5));

    // Persist results (overwrites previous)
    await persistAnalysisResults({
      projectId,
      userId: user.id,
      themes,
      proposals,
      inputCount: files.length,
    });

    return Response.json({
      signal: "ok",
      insightCount: themes.length,
      proposalCount: proposals.length,
    });
  } catch {
    return Response.json(
      { error: { code: "MODEL_ERROR", message: "Analysis failed. Please try again." } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test "app/api/projects/\[id\]/analyze/route.test.ts"
```

Expected: PASS — 6 tests pass

- [ ] **Step 5: Commit**

```bash
git add "app/api/projects/[id]/analyze/route.ts" "app/api/projects/[id]/analyze/route.test.ts"
git commit -m "feat: add analyze route handler with auth, rate limiting, and pipeline orchestration"
```

---

## Task 6: AnalyzeButton component

**Files:**
- Create: `components/projects/workspace/analyze-button.tsx`
- Create: `components/projects/workspace/analyze-button.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// components/projects/workspace/analyze-button.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AnalyzeButton } from "./analyze-button";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: vi.fn() })),
}));

const mockRefresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ refresh: mockRefresh })),
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ signal: "ok" }) });
});

describe("AnalyzeButton", () => {
  it("renders 'Analyze' when not stale and has inputs", () => {
    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    expect(screen.getByRole("button", { name: /analyze/i })).toBeInTheDocument();
  });

  it("renders 'Re-analyze' when stale", () => {
    render(<AnalyzeButton projectId="p1" hasInputs isStale />);
    expect(screen.getByRole("button", { name: /re-analyze/i })).toBeInTheDocument();
  });

  it("is disabled when hasInputs is false", () => {
    render(<AnalyzeButton projectId="p1" hasInputs={false} isStale={false} />);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls /api/projects/[id]/analyze on click and refreshes on success", async () => {
    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/projects/p1/analyze",
        expect.objectContaining({ method: "POST" })
      );
      expect(mockRefresh).toHaveBeenCalled();
    });
  });

  it("shows error message when fetch fails", async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: "Rate limited" } }) });
    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    await waitFor(() => {
      expect(screen.getByText(/rate limited/i)).toBeInTheDocument();
    });
  });

  it("shows 'Analyzing…' during the fetch", async () => {
    let resolvePromise!: (v: unknown) => void;
    global.fetch = vi.fn().mockReturnValue(new Promise((r) => (resolvePromise = r)));

    render(<AnalyzeButton projectId="p1" hasInputs isStale={false} />);
    fireEvent.click(screen.getByRole("button", { name: /analyze/i }));

    expect(await screen.findByText(/analyzing/i)).toBeInTheDocument();
    resolvePromise({ ok: true, json: async () => ({ signal: "ok" }) });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test components/projects/workspace/analyze-button.test.tsx
```

Expected: FAIL — `Cannot find module './analyze-button'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/projects/workspace/analyze-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AnalyzeButtonProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
}

export function AnalyzeButton({ projectId, hasInputs, isStale }: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const label = loading ? "Analyzing…" : isStale ? "Re-analyze" : "Analyze";

  async function handleClick() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message ?? "Analysis failed. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="relative">
        <Button
          size="sm"
          disabled={!hasInputs || loading}
          onClick={handleClick}
          title={!hasInputs ? "Add at least one labeled input" : undefined}
        >
          {loading ? (
            <Loader2 size={13} className="animate-spin" />
          ) : (
            <Zap size={13} />
          )}
          {label}
        </Button>
        {isStale && !loading && (
          <span
            aria-hidden="true"
            className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border-[1.5px] border-[var(--color-bg-0)] bg-[var(--color-accent-primary)]"
          />
        )}
      </div>
      {error && (
        <p className="text-[11px] text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test components/projects/workspace/analyze-button.test.tsx
```

Expected: PASS — 5 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/analyze-button.tsx components/projects/workspace/analyze-button.test.tsx
git commit -m "feat: add AnalyzeButton client component with loading, stale, and error states"
```

---

## Task 7: ThemesSection + QuotesModal

**Files:**
- Create: `components/projects/workspace/quotes-modal.tsx`
- Create: `components/projects/workspace/quotes-modal.test.tsx`
- Create: `components/projects/workspace/themes-section.tsx`
- Create: `components/projects/workspace/themes-section.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// @vitest-environment jsdom
// components/projects/workspace/quotes-modal.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuotesModal } from "./quotes-modal";
import type { InsightQuote } from "@/lib/types/database";

const quotes: InsightQuote[] = [
  { quote: "I was totally lost", sourceLabel: "Interview" },
  { quote: "No guide at all", sourceLabel: "Support Ticket" },
];

describe("QuotesModal", () => {
  it("renders all quotes when open", () => {
    render(
      <QuotesModal
        themeName="Onboarding confusion"
        quotes={quotes}
        isOpen
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText(/I was totally lost/i)).toBeInTheDocument();
    expect(screen.getByText(/No guide at all/i)).toBeInTheDocument();
  });

  it("renders nothing when not open", () => {
    render(
      <QuotesModal
        themeName="Onboarding confusion"
        quotes={quotes}
        isOpen={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText(/I was totally lost/i)).not.toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", () => {
    const onClose = vi.fn();
    render(
      <QuotesModal themeName="T" quotes={quotes} isOpen onClose={onClose} />
    );
    fireEvent.click(screen.getByRole("button", { name: /close/i }));
    expect(onClose).toHaveBeenCalled();
  });
});
```

```tsx
// @vitest-environment jsdom
// components/projects/workspace/themes-section.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemesSection } from "./themes-section";
import type { Insight } from "@/lib/types/database";

const makeInsight = (id: string, themeName: string): Insight => ({
  id,
  project_id: "p1",
  theme_name: themeName,
  frequency: "3 of 5 sources",
  quotes: [
    { quote: "Test quote", sourceLabel: "Interview" },
    { quote: "Another quote", sourceLabel: "Survey" },
  ],
  created_at: "2026-01-01T00:00:00Z",
});

describe("ThemesSection", () => {
  it("renders all theme names", () => {
    const insights = [
      makeInsight("i1", "Onboarding confusion"),
      makeInsight("i2", "CSV export missing"),
    ];
    render(<ThemesSection insights={insights} isStale={false} />);
    expect(screen.getByText("Onboarding confusion")).toBeInTheDocument();
    expect(screen.getByText("CSV export missing")).toBeInTheDocument();
  });

  it("renders frequency badge for each theme", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Theme A")]} isStale={false} />);
    expect(screen.getByText("3 of 5 sources")).toBeInTheDocument();
  });

  it("shows top 2 quotes inline per card", () => {
    render(<ThemesSection insights={[makeInsight("i1", "Theme A")]} isStale={false} />);
    expect(screen.getByText(/Test quote/i)).toBeInTheDocument();
    expect(screen.getByText(/Another quote/i)).toBeInTheDocument();
  });

  it("shows stale notice when isStale is true", () => {
    render(<ThemesSection insights={[makeInsight("i1", "T")]} isStale />);
    expect(screen.getByText(/new inputs/i)).toBeInTheDocument();
  });

  it("shows 'View all N quotes' button", () => {
    render(<ThemesSection insights={[makeInsight("i1", "T")]} isStale={false} />);
    expect(screen.getByText(/view all 2 quotes/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test components/projects/workspace/quotes-modal.test.tsx components/projects/workspace/themes-section.test.tsx
```

Expected: FAIL — modules not found

- [ ] **Step 3: Write QuotesModal**

```tsx
// components/projects/workspace/quotes-modal.tsx
"use client";

import { X } from "lucide-react";
import type { InsightQuote } from "@/lib/types/database";

interface QuotesModalProps {
  themeName: string;
  quotes: InsightQuote[];
  isOpen: boolean;
  onClose: () => void;
}

export function QuotesModal({ themeName, quotes, isOpen, onClose }: QuotesModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ backgroundColor: "hsla(220,18%,4%,0.8)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-3)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
              All quotes
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-[var(--color-text-primary)]">
              {themeName}
            </h2>
          </div>
          <button
            aria-label="Close"
            onClick={onClose}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <X size={15} strokeWidth={1.8} />
          </button>
        </div>

        <div
          className="flex flex-col gap-3 overflow-y-auto"
          style={{ maxHeight: "60vh" }}
        >
          {quotes.map((q, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-1)] p-4"
            >
              <p className="text-[13px] italic leading-relaxed text-[var(--color-text-secondary)]">
                &ldquo;{q.quote}&rdquo;
              </p>
              <p className="mt-2 text-[11px] text-[var(--color-text-disabled)]">
                — {q.sourceLabel}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write ThemesSection**

```tsx
// components/projects/workspace/themes-section.tsx
"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import type { Insight } from "@/lib/types/database";
import { QuotesModal } from "./quotes-modal";

// Frequency badge color — index-based (themes are already ranked by Stage 1)
const FREQ_STYLES = [
  "bg-[hsl(200_55%_18%)] text-[var(--color-analog-1)] border border-[hsl(200_55%_28%)]",
  "bg-[hsl(200_55%_18%)] text-[var(--color-analog-1)] border border-[hsl(200_55%_28%)]",
  "bg-[hsl(220_55%_18%)] text-[var(--color-analog-2)] border border-[hsl(220_55%_28%)]",
  "bg-[hsl(220_55%_18%)] text-[var(--color-analog-2)] border border-[hsl(220_55%_28%)]",
  "bg-[hsl(240_55%_18%)] text-[var(--color-analog-3)] border border-[hsl(240_55%_28%)]",
];

interface ThemesSectionProps {
  insights: Insight[];
  isStale: boolean;
}

export function ThemesSection({ insights, isStale }: ThemesSectionProps) {
  const [modalInsight, setModalInsight] = useState<Insight | null>(null);

  return (
    <>
      {isStale && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_40%_12%)] px-4 py-2.5">
          <Info size={13} strokeWidth={1.8} className="shrink-0 text-[hsl(40_70%_55%)]" />
          <p className="text-[12px] text-[hsl(40_70%_65%)]">
            New inputs were added after the last analysis. Re-analyze to include them.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        {insights.map((insight, i) => (
          <div
            key={insight.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-5 shadow-[var(--shadow-2)] transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.01] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]"
          >
            <div className="mb-3 flex items-center gap-3">
              <span className="flex-1 text-[14px] font-semibold text-[var(--color-text-primary)]">
                {insight.theme_name}
              </span>
              <span
                className={`rounded-[var(--radius-pill)] px-2.5 py-0.5 text-[11px] font-semibold ${FREQ_STYLES[i] ?? FREQ_STYLES[4]}`}
              >
                {insight.frequency}
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              {insight.quotes.slice(0, 2).map((q, qi) => (
                <div
                  key={qi}
                  className="rounded-r-[var(--radius-sm)] border-l-2 border-[var(--color-border-strong)] bg-[var(--color-bg-1)] px-3 py-2"
                >
                  <p className="text-[12px] italic leading-relaxed text-[var(--color-text-tertiary)]">
                    &ldquo;{q.quote}&rdquo;
                  </p>
                  <p className="mt-1 text-[11px] text-[var(--color-text-disabled)]">
                    — {q.sourceLabel}
                  </p>
                </div>
              ))}
            </div>

            {insight.quotes.length > 0 && (
              <button
                onClick={() => setModalInsight(insight)}
                className="mt-3 flex cursor-pointer items-center gap-1.5 text-[12px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                View all {insight.quotes.length} quotes
              </button>
            )}
          </div>
        ))}
      </div>

      {modalInsight && (
        <QuotesModal
          themeName={modalInsight.theme_name}
          quotes={modalInsight.quotes}
          isOpen
          onClose={() => setModalInsight(null)}
        />
      )}
    </>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test components/projects/workspace/quotes-modal.test.tsx components/projects/workspace/themes-section.test.tsx
```

Expected: PASS — all tests pass

- [ ] **Step 6: Commit**

```bash
git add components/projects/workspace/quotes-modal.tsx components/projects/workspace/quotes-modal.test.tsx components/projects/workspace/themes-section.tsx components/projects/workspace/themes-section.test.tsx
git commit -m "feat: add ThemesSection and QuotesModal components"
```

---

## Task 8: ProposalsSection

**Files:**
- Create: `components/projects/workspace/proposals-section.tsx`
- Create: `components/projects/workspace/proposals-section.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// @vitest-environment jsdom
// components/projects/workspace/proposals-section.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ProposalsSection } from "./proposals-section";
import type { Proposal } from "@/lib/types/database";

const makeProposal = (id: string, featureName: string, overrides: Partial<Proposal> = {}): Proposal => ({
  id,
  project_id: "p1",
  feature_name: featureName,
  problem_statement: "Users struggle with this.",
  evidence: [{ quote: "It's hard", sourceLabel: "Interview" }],
  ui_changes: ["Add button"],
  data_model_changes: [],
  workflow_changes: ["Update flow"],
  engineering_tasks: ["Build it"],
  created_at: "2026-01-01T00:00:00Z",
  ...overrides,
});

describe("ProposalsSection", () => {
  it("renders all proposal feature names", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Guided Onboarding"), makeProposal("p2", "CSV Export")]}
        isStale={false}
      />
    );
    expect(screen.getByText("Guided Onboarding")).toBeInTheDocument();
    expect(screen.getByText("CSV Export")).toBeInTheDocument();
  });

  it("proposal body is hidden by default", () => {
    render(<ProposalsSection proposals={[makeProposal("p1", "Feature A")]} isStale={false} />);
    expect(screen.queryByText(/problem statement/i)).not.toBeInTheDocument();
  });

  it("expands proposal body on header click", () => {
    render(<ProposalsSection proposals={[makeProposal("p1", "Feature A")]} isStale={false} />);
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.getByText(/problem statement/i)).toBeInTheDocument();
    expect(screen.getByText(/users struggle with this/i)).toBeInTheDocument();
  });

  it("omits data model changes section when empty", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A", { data_model_changes: [] })]}
        isStale={false}
      />
    );
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.queryByText(/data model/i)).not.toBeInTheDocument();
  });

  it("renders data model changes section when present", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A", { data_model_changes: ["Add column"] })]}
        isStale={false}
      />
    );
    fireEvent.click(screen.getByText("Feature A"));
    expect(screen.getByText(/data model/i)).toBeInTheDocument();
    expect(screen.getByText("Add column")).toBeInTheDocument();
  });

  it("shows stale notice when isStale is true", () => {
    render(<ProposalsSection proposals={[makeProposal("p1", "F")]} isStale />);
    expect(screen.getByText(/re-analyze/i)).toBeInTheDocument();
  });

  it("renders numbered proposal index", () => {
    render(
      <ProposalsSection
        proposals={[makeProposal("p1", "Feature A"), makeProposal("p2", "Feature B")]}
        isStale={false}
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test components/projects/workspace/proposals-section.test.tsx
```

Expected: FAIL — `Cannot find module './proposals-section'`

- [ ] **Step 3: Write the implementation**

```tsx
// components/projects/workspace/proposals-section.tsx
"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { Proposal } from "@/lib/types/database";

interface ProposalsSectionProps {
  proposals: Proposal[];
  isStale: boolean;
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function PropSection({ label, children }: SectionProps) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      {children}
    </div>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  index: number;
}

function ProposalCard({ proposal, index }: ProposalCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-[var(--shadow-2)] transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.005] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
      <button
        className="flex w-full cursor-pointer items-center gap-3 px-6 py-5 text-left"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[12px] font-semibold text-[var(--color-text-tertiary)]">
          {index + 1}
        </div>
        <span className="flex-1 text-[14px] font-semibold text-[var(--color-text-primary)]">
          {proposal.feature_name}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.8}
          className={`shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-[180ms] ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-6 pb-6">
          <div className="mb-5 h-px bg-[var(--color-border-subtle)]" />

          <PropSection label="Problem Statement">
            <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
              {proposal.problem_statement}
            </p>
          </PropSection>

          {proposal.evidence.length > 0 && (
            <PropSection label="User Evidence">
              <div className="flex flex-col gap-2">
                {proposal.evidence.map((e, i) => (
                  <div
                    key={i}
                    className="rounded-r-[var(--radius-sm)] border-l-2 border-[var(--color-border-strong)] bg-[var(--color-bg-1)] px-3 py-2"
                  >
                    <p className="text-[12px] italic leading-relaxed text-[var(--color-text-tertiary)]">
                      &ldquo;{e.quote}&rdquo;
                    </p>
                    <p className="mt-1 text-[11px] text-[var(--color-text-disabled)]">— {e.sourceLabel}</p>
                  </div>
                ))}
              </div>
            </PropSection>
          )}

          {proposal.ui_changes.length > 0 && (
            <PropSection label="Suggested UI Changes">
              <ul className="flex flex-col gap-1.5">
                {proposal.ui_changes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                    <span className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PropSection>
          )}

          {proposal.data_model_changes.length > 0 && (
            <PropSection label="Suggested Data Model Changes">
              <ul className="flex flex-col gap-1.5">
                {proposal.data_model_changes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                    <span className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]">–</span>
                    {item}
                  </li>
                ))}
              </ul>
            </PropSection>
          )}

          {proposal.workflow_changes.length > 0 && (
            <PropSection label="Suggested Workflow Changes">
              <ol className="flex flex-col gap-1.5">
                {proposal.workflow_changes.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </PropSection>
          )}

          {proposal.engineering_tasks.length > 0 && (
            <PropSection label="Engineering Tasks">
              <ol className="flex flex-col gap-1.5">
                {proposal.engineering_tasks.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                      {i + 1}
                    </span>
                    {item}
                  </li>
                ))}
              </ol>
            </PropSection>
          )}

          {/* Export actions — Plan 7 scope, inert in Plan 5 */}
          <div className="mt-5 flex gap-2 border-t border-[var(--color-border-subtle)] pt-4">
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] opacity-50"
            >
              Copy Markdown
            </button>
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] opacity-50"
            >
              Download .md
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProposalsSection({ proposals, isStale }: ProposalsSectionProps) {
  return (
    <>
      {isStale && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_40%_12%)] px-4 py-2.5">
          <Info size={13} strokeWidth={1.8} className="shrink-0 text-[hsl(40_70%_55%)]" />
          <p className="text-[12px] text-[hsl(40_70%_65%)]">
            These proposals are based on a previous analysis. Re-analyze to reflect new inputs.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {proposals.map((proposal, i) => (
          <ProposalCard key={proposal.id} proposal={proposal} index={i} />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test components/projects/workspace/proposals-section.test.tsx
```

Expected: PASS — 7 tests pass

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/proposals-section.tsx components/projects/workspace/proposals-section.test.tsx
git commit -m "feat: add ProposalsSection with expandable cards and all spec sections"
```

---

## Task 9: InputsSection staleness

**Files:**
- Modify: `components/projects/workspace/inputs-section.tsx`
- Modify: `components/projects/workspace/inputs-section.test.tsx`

- [ ] **Step 1: Write the new failing test cases**

Add these cases to the existing `describe("InputsSection")` block in `inputs-section.test.tsx`:

```tsx
// Add to existing describe block in components/projects/workspace/inputs-section.test.tsx

  it("shows 'Not included in analysis' group when some files are newer than lastAnalyzedAt", () => {
    const oldFile = { ...makeFile("f1", "Interview"), created_at: "2026-01-01T00:00:00Z" };
    const newFile = { ...makeFile("f2", "Survey"), created_at: "2026-03-01T00:00:00Z" };
    render(
      <InputsSection
        files={[oldFile, newFile]}
        projectId="p1"
        lastAnalyzedAt="2026-02-01T00:00:00Z"
      />
    );
    expect(screen.getByText(/not included/i)).toBeInTheDocument();
  });

  it("does not show staleness group when lastAnalyzedAt is null", () => {
    render(
      <InputsSection
        files={[makeFile("f1", "Interview")]}
        projectId="p1"
        lastAnalyzedAt={null}
      />
    );
    expect(screen.queryByText(/not included/i)).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run test to verify the new cases fail**

```bash
pnpm test components/projects/workspace/inputs-section.test.tsx
```

Expected: FAIL — new tests fail, existing tests still pass

- [ ] **Step 3: Update InputsSection**

Replace the `InputsSectionProps` interface and component implementation in `components/projects/workspace/inputs-section.tsx`:

```tsx
// Replace the interface (line ~53) and function signature:
interface InputsSectionProps {
  files: FeedbackFile[];
  projectId: string;
  lastAnalyzedAt?: string | null;
}

export function InputsSection({ files, projectId, lastAnalyzedAt }: InputsSectionProps) {
  const [localFiles, setLocalFiles] = useState(files);
  const [isPending, startTransition] = useTransition();

  // Split files into included vs new (not yet in analysis)
  const included = lastAnalyzedAt
    ? localFiles.filter((f) => f.created_at <= lastAnalyzedAt)
    : localFiles;
  const newFiles = lastAnalyzedAt
    ? localFiles.filter((f) => f.created_at > lastAnalyzedAt)
    : [];

  const includedBatches = groupFilesByLabel(included);
  const newBatches = groupFilesByLabel(newFiles);
  const allBatches = groupFilesByLabel(localFiles);

  const handleDelete = (sourceLabel: string) => {
    startTransition(async () => {
      await deleteFeedbackBatch(projectId, sourceLabel);
      setLocalFiles((prev) =>
        prev.filter((f) => f.source_type !== sourceLabel)
      );
    });
  };

  // When no staleness data, render as before
  if (!lastAnalyzedAt) {
    return (
      <div className="flex flex-col gap-2">
        {allBatches.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
            No inputs yet.
          </p>
        ) : (
          <div
            className="flex flex-col gap-2 overflow-y-auto py-1"
            style={{
              maxHeight: "212px",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
              scrollbarWidth: "thin",
            }}
          >
            {allBatches.map((batch) => (
              <BatchCard
                key={batch.sourceLabel}
                batch={batch}
                onDelete={() => handleDelete(batch.sourceLabel)}
                isDeleting={isPending}
                projectId={projectId}
              />
            ))}
          </div>
        )}
        <Link
          href={`/projects/${projectId}/add`}
          aria-label="Add more inputs"
          className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 transition-colors hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-accent-primary)]/5"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-tertiary)]">
            <Plus size={15} strokeWidth={2} />
          </div>
          <div>
            <div className="text-sm text-[var(--color-text-secondary)]">Add more inputs</div>
            <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Upload files or paste text</div>
          </div>
        </Link>
      </div>
    );
  }

  // With staleness data — split into two groups
  return (
    <div className="flex flex-col gap-2">
      {localFiles.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
          No inputs yet.
        </p>
      ) : (
        <div
          className="flex flex-col gap-2 overflow-y-auto py-1"
          style={{
            maxHeight: "260px",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
            scrollbarWidth: "thin",
          }}
        >
          {includedBatches.map((batch) => (
            <BatchCard
              key={batch.sourceLabel}
              batch={batch}
              onDelete={() => handleDelete(batch.sourceLabel)}
              isDeleting={isPending}
              projectId={projectId}
            />
          ))}

          {newBatches.length > 0 && (
            <>
              <div className="flex items-center gap-2 border-t border-dashed border-[var(--color-border-subtle)] pt-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="text-[hsl(40_70%_55%)] shrink-0">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[hsl(40_70%_55%)]">
                  Not included in current analysis
                </span>
              </div>
              {newBatches.map((batch) => (
                <div key={batch.sourceLabel} className="rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_20%_12%)]">
                  <BatchCard
                    batch={batch}
                    onDelete={() => handleDelete(batch.sourceLabel)}
                    isDeleting={isPending}
                    projectId={projectId}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <Link
        href={`/projects/${projectId}/add`}
        aria-label="Add more inputs"
        className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 transition-colors hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-accent-primary)]/5"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-tertiary)]">
          <Plus size={15} strokeWidth={2} />
        </div>
        <div>
          <div className="text-sm text-[var(--color-text-secondary)]">Add more inputs</div>
          <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Upload files or paste text</div>
        </div>
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run all InputsSection tests to verify they pass**

```bash
pnpm test components/projects/workspace/inputs-section.test.tsx
```

Expected: PASS — all tests pass including new ones

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/inputs-section.tsx components/projects/workspace/inputs-section.test.tsx
git commit -m "feat: add staleness grouping to InputsSection"
```

---

## Task 10: Wire workspace page

**Files:**
- Modify: `app/(app)/projects/[id]/page.tsx`

This task has no new tests — the server component is covered by the component tests above and integration through manual QA. Changes are confined to data fetching and prop passing.

- [ ] **Step 1: Replace the workspace page**

Replace the entire contents of `app/(app)/projects/[id]/page.tsx` with:

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Search, Star, Plus } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { InputsSection } from "@/components/projects/workspace/inputs-section";
import { LockedSection } from "@/components/projects/workspace/locked-section";
import { AnalyzeButton } from "@/components/projects/workspace/analyze-button";
import { ThemesSection } from "@/components/projects/workspace/themes-section";
import { ProposalsSection } from "@/components/projects/workspace/proposals-section";
import { getFeedbackFiles } from "@/app/actions/feedback-files";
import { getInsights, getProposals, getLastAnalysisRun } from "@/app/actions/analysis";
import type { Project } from "@/lib/types/database";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const p = project as Project;

  const [feedbackFiles, insights, proposals, lastRun] = await Promise.all([
    getFeedbackFiles(id),
    getInsights(id),
    getProposals(id),
    getLastAnalysisRun(id),
  ]);

  const hasInputs = feedbackFiles.length > 0;
  const lastAnalyzedAt = lastRun?.created_at ?? null;
  const isStale = lastAnalyzedAt
    ? feedbackFiles.some((f) => f.created_at > lastAnalyzedAt)
    : false;
  const hasResults = insights.length > 0 || proposals.length > 0;

  return (
    <div className="mx-auto max-w-[820px]">
      {/* Page header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
            {p.name}
          </h1>
          <div className="flex items-center gap-4">
            {[
              { label: "Inputs", value: feedbackFiles.length },
              {
                label: "Themes",
                value: insights.length > 0 ? insights.length : "—",
                accent: insights.length > 0,
              },
              {
                label: "Proposals",
                value: proposals.length > 0 ? proposals.length : "—",
                accent: proposals.length > 0,
              },
            ].map(({ label, value, accent }, i, arr) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-[17px] font-semibold ${
                      accent
                        ? "text-[var(--color-accent-primary)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {value}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                    {label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-8 w-px bg-[var(--color-border-subtle)]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Link
            href={`/projects/${id}/add`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <Plus size={13} />
            Add inputs
          </Link>
          <AnalyzeButton
            projectId={id}
            hasInputs={hasInputs}
            isStale={isStale}
          />
        </div>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Inputs section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText
                size={15}
                strokeWidth={1.8}
                className="text-[var(--color-text-secondary)]"
              />
              <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                Inputs
              </span>
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                {feedbackFiles.length} files
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <InputsSection
            files={feedbackFiles}
            projectId={id}
            lastAnalyzedAt={lastAnalyzedAt}
          />
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Themes section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center gap-2">
            <Search
              size={15}
              strokeWidth={1.8}
              className={
                hasResults
                  ? "text-[var(--color-text-secondary)]"
                  : "text-[var(--color-text-tertiary)]"
              }
            />
            <span
              className={`text-[14px] font-semibold ${
                hasResults
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-tertiary)]"
              }`}
            >
              Themes
            </span>
            {hasResults ? (
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                {insights.length} found
              </span>
            ) : (
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                Unlocks after Analyze
              </span>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          {insights.length > 0 ? (
            <ThemesSection insights={insights} isStale={isStale} />
          ) : (
            <LockedSection
              title="Themes unlock after analysis"
              description="Run Analyze to surface recurring themes and supporting quotes from your inputs."
            />
          )}
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Proposals section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center gap-2">
            <Star
              size={15}
              strokeWidth={1.8}
              className={
                hasResults
                  ? "text-[var(--color-text-secondary)]"
                  : "text-[var(--color-text-tertiary)]"
              }
            />
            <span
              className={`text-[14px] font-semibold ${
                hasResults
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-tertiary)]"
              }`}
            >
              Proposals
            </span>
            {hasResults ? (
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                {proposals.length} generated
              </span>
            ) : (
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                Unlocks after Analyze
              </span>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          {proposals.length > 0 ? (
            <ProposalsSection proposals={proposals} isStale={isStale} />
          ) : (
            <LockedSection
              title="Proposals unlock after analysis"
              description="Feature proposals are generated automatically from surfaced themes and evidence."
            />
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run all tests to confirm nothing broke**

```bash
pnpm typecheck && pnpm lint && pnpm test
```

Expected: all checks pass, no type errors, no lint errors

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/projects/[id]/page.tsx"
git commit -m "feat: wire workspace page with analysis results, staleness, and AnalyzeButton"
```

---

## Final validation

- [ ] **Run full test suite**

```bash
pnpm test
```

Expected: all tests pass

- [ ] **Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Manual smoke test**

1. Start dev server: `pnpm dev`
2. Create a project, add at least one feedback input
3. Click Analyze — button should show spinner and "Analyzing…"
4. After completion, Themes and Proposals sections unlock
5. Theme cards show frequency badges and quotes — "View all" opens modal
6. Proposal cards expand to show all sections
7. Add a new input — Re-analyze button shows amber dot, Inputs section shows "Not included" group
8. Stale notice appears in Themes and Proposals sections
9. Click Re-analyze — results update, stale indicators disappear

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete AI pipeline Plan 5"
```
