# Auth & Database Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up Supabase auth, session management, protected routes, database schema, and TypeScript types — the foundation every other plan depends on.

**Architecture:** Supabase handles auth (email/password + OAuth). Three Supabase client helpers cover browser, server, and proxy contexts. The `proxy.ts` file (Next.js 16 replacement for `middleware.ts`) refreshes sessions and redirects unauthenticated users. A single SQL migration creates all four MVP tables with RLS enabled.

**Tech Stack:** `@supabase/supabase-js`, `@supabase/ssr`, `zod`, Next.js 16 App Router, `proxy.ts` (Node.js runtime)

---

## Next.js 16 Breaking Changes — Read Before Starting

- **`middleware.ts` is deprecated.** Use `proxy.ts` with a named export `proxy` (not `middleware`).
- **`cookies()` is async.** Always `await cookies()` in server components and route handlers.
- **`params` and `searchParams` are async** in page/layout components — use `await props.params`.
- **Edge runtime is NOT supported** in `proxy.ts`. It runs Node.js by default — no configuration needed.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/env.ts` | Create | Zod validation of all required env vars at startup |
| `lib/env.test.ts` | Create | Tests for env validation |
| `lib/supabase/client.ts` | Create | Browser Supabase client (singleton) |
| `lib/supabase/server.ts` | Create | Async server Supabase client (Server Components, Route Handlers, Server Actions) |
| `supabase/migrations/001_initial_schema.sql` | Create | All four MVP tables with RLS policies |
| `lib/types/database.ts` | Create | TypeScript types mirroring the DB schema |
| `proxy.ts` | Create | Session refresh + protected route redirect (Next.js 16 middleware replacement) |
| `app/login/page.tsx` | Create | Minimal login page stub (unblocks redirect from proxy) |
| `app/auth/callback/route.ts` | Create | Supabase OAuth/magic-link callback handler |

---

## Task 1: Environment Variable Validation

**Files:**
- Create: `lib/env.ts`
- Create: `lib/env.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// lib/env.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports valid env when all required vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");
    vi.stubEnv("AI_MODEL", "claude-sonnet-4-5");

    const { env } = await import("./env");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.AI_MODEL).toBe("claude-sonnet-4-5");
  });

  it("uses claude-sonnet-4-5 as default AI_MODEL when not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");
    // Do NOT stub AI_MODEL — leave undefined so .default() fires

    const { env } = await import("./env");
    expect(env.AI_MODEL).toBe("claude-sonnet-4-5");
  });

  it("throws when a required env var is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    await expect(import("./env")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/env.test.ts
```

Expected: FAIL — `Cannot find module './env'`

- [ ] **Step 3: Implement `lib/env.ts`**

```typescript
// lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  AI_MODEL: z.string().default("claude-sonnet-4-5"),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/env.test.ts
```

Expected: PASS (2 tests)

- [ ] **Step 5: Run full checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/env.ts lib/env.test.ts
git commit -m "feat: add env variable validation with Zod"
```

---

## Task 2: Supabase Browser Client

**Files:**
- Create: `lib/supabase/client.ts`

- [ ] **Step 1: Create `lib/supabase/client.ts`**

No test needed — this is a thin wrapper over `@supabase/ssr`. Type safety comes from TypeScript strict mode.

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

- [ ] **Step 2: Run checks**

```bash
pnpm typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/client.ts
git commit -m "feat: add Supabase browser client"
```

---

## Task 3: Supabase Server Client

**Files:**
- Create: `lib/supabase/server.ts`

`cookies()` is async in Next.js 16 — this file must use `await cookies()`.

- [ ] **Step 1: Create `lib/supabase/server.ts`**

```typescript
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll called from a Server Component — safe to ignore.
            // Cookies will be set by the proxy on the next request.
          }
        },
      },
    }
  );
}
```

- [ ] **Step 2: Run checks**

```bash
pnpm typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/server.ts
git commit -m "feat: add Supabase server client with async cookies"
```

---

## Task 4: Database Migration

**Files:**
- Create: `supabase/migrations/001_initial_schema.sql`

This implements the full data model from `docs/engineering/data-model.md`. Run this against your Supabase project via the Supabase dashboard SQL editor or CLI.

- [ ] **Step 1: Create `supabase/migrations/001_initial_schema.sql`**

```sql
-- supabase/migrations/001_initial_schema.sql

-- Project: primary user-owned container
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- FeedbackFile: a single uploaded or pasted input
create table if not exists public.feedback_files (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects(id) on delete cascade,
  file_name    text not null,
  source_type  text not null,
  content      text not null,
  storage_url  text,
  mime_type    text,
  input_method text not null check (input_method in ('upload', 'paste')),
  word_count   integer,
  created_at   timestamptz not null default now()
);

-- Insight: a surfaced theme from AI synthesis (Stage 1 output)
create table if not exists public.insights (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  theme_name  text not null,
  frequency   text not null,
  quotes      jsonb not null default '[]',
  created_at  timestamptz not null default now()
);

-- Proposal: a structured feature proposal (Stage 2 output)
create table if not exists public.proposals (
  id                      uuid primary key default gen_random_uuid(),
  project_id              uuid not null references public.projects(id) on delete cascade,
  feature_name            text not null,
  problem_statement       text not null,
  evidence                jsonb not null default '[]',
  ui_changes              jsonb not null default '[]',
  data_model_changes      jsonb not null default '[]',
  workflow_changes        jsonb not null default '[]',
  engineering_tasks       jsonb not null default '[]',
  created_at              timestamptz not null default now()
);

-- Row Level Security
alter table public.projects        enable row level security;
alter table public.feedback_files  enable row level security;
alter table public.insights        enable row level security;
alter table public.proposals       enable row level security;

-- RLS Policies: users can only access their own data
create policy "users can manage own projects"
  on public.projects for all
  using (auth.uid() = user_id);

create policy "users can manage own feedback files"
  on public.feedback_files for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

create policy "users can manage own insights"
  on public.insights for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

create policy "users can manage own proposals"
  on public.proposals for all
  using (
    project_id in (
      select id from public.projects where user_id = auth.uid()
    )
  );

-- Auto-update updated_at on projects
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger projects_updated_at
  before update on public.projects
  for each row execute function public.update_updated_at();
```

- [ ] **Step 2: Run migration against Supabase**

Option A — Supabase dashboard:
1. Go to your Supabase project → SQL Editor
2. Paste the contents of `supabase/migrations/001_initial_schema.sql`
3. Click Run
4. Verify tables appear in Table Editor

Option B — Supabase CLI (if installed):
```bash
supabase db push
```

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/001_initial_schema.sql
git commit -m "feat: add initial database migration with RLS"
```

---

## Task 5: TypeScript Database Types

**Files:**
- Create: `lib/types/database.ts`

These types mirror the SQL schema. They are used throughout the app for type-safe DB access.

- [ ] **Step 1: Create `lib/types/database.ts`**

```typescript
// lib/types/database.ts

export type InputMethod = "upload" | "paste";

export type Project = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at: string;
};

export type FeedbackFile = {
  id: string;
  project_id: string;
  file_name: string;
  source_type: string;
  content: string;
  storage_url: string | null;
  mime_type: string | null;
  input_method: InputMethod;
  word_count: number | null;
  created_at: string;
};

export type InsightQuote = {
  quote: string;
  sourceLabel: string;
};

export type Insight = {
  id: string;
  project_id: string;
  theme_name: string;
  frequency: string;
  quotes: InsightQuote[];
  created_at: string;
};

export type ProposalEvidence = {
  quote: string;
  sourceLabel: string;
};

export type Proposal = {
  id: string;
  project_id: string;
  feature_name: string;
  problem_statement: string;
  evidence: ProposalEvidence[];
  ui_changes: string[];
  data_model_changes: string[];
  workflow_changes: string[];
  engineering_tasks: string[];
  created_at: string;
};
```

- [ ] **Step 2: Run checks**

```bash
pnpm typecheck
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add lib/types/database.ts
git commit -m "feat: add TypeScript types for database schema"
```

---

## Task 6: Proxy (Auth Middleware)

**Files:**
- Create: `proxy.ts`

**Next.js 16 note:** This file is named `proxy.ts`, NOT `middleware.ts`. The exported function is named `proxy`, NOT `middleware`. The edge runtime is not used — Node.js is the default and cannot be configured.

- [ ] **Step 1: Create `proxy.ts`**

```typescript
// proxy.ts
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not add logic between createServerClient and getUser.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isPublicPath =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname); // preserve destination for post-login redirect
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

- [ ] **Step 2: Run checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "feat: add proxy for session refresh and protected routes"
```

---

## Task 7: Login Page Stub

**Files:**
- Create: `app/login/page.tsx`

A minimal page that satisfies the proxy redirect target. Full auth UI is built in Plan 2 (UI Foundation).

- [ ] **Step 1: Create `app/login/page.tsx`**

```typescript
// app/login/page.tsx
export default function LoginPage() {
  return (
    <main>
      <h1>Sign in</h1>
      <p>Login UI coming in Plan 2.</p>
    </main>
  );
}
```

- [ ] **Step 2: Run checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add app/login/page.tsx
git commit -m "feat: add login page stub"
```

---

## Task 8: Auth Callback Route Handler

**Files:**
- Create: `app/auth/callback/route.ts`

Required for Supabase email confirmation and OAuth flows. Exchanges the code returned by Supabase for a user session.

- [ ] **Step 1: Create `app/auth/callback/route.ts`**

```typescript
// app/auth/callback/route.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

- [ ] **Step 2: Run checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

Expected: all existing tests pass (14+)

- [ ] **Step 4: Commit**

```bash
git add app/auth/callback/route.ts
git commit -m "feat: add Supabase auth callback route handler"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm test` passes (all tests including 2 new env tests)
- [ ] Migration has been run against your Supabase project
- [ ] Visiting any non-login route without a session redirects to `/login`
- [ ] `/login` and `/auth/callback` are accessible without a session
- [ ] DB tables visible in Supabase Table Editor: `projects`, `feedback_files`, `insights`, `proposals`
- [ ] RLS enabled on all four tables

---

## Notes for Next Plans

- **Plan 2 (UI Foundation)** will replace the login page stub with real auth UI
- The `createClient()` server helper is async — always `await` it
- The `proxy.ts` pattern means all session refresh happens automatically; downstream code just calls `supabase.auth.getUser()` without worrying about refresh
- `lib/types/database.ts` types are used directly — no ORM, just typed Supabase JS client queries
