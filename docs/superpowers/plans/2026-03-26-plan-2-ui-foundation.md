# UI Foundation & Routing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the visual shell of the app — real login page with Supabase auth, authenticated app layout with nav, and a dashboard page showing the user's projects.

**Architecture:** Login is a Client Component (browser state + Supabase auth calls). The dashboard is a Server Component that fetches projects directly from Supabase. An `(app)` route group wraps all authenticated pages with a shared nav layout. The proxy (Plan 1) already protects routes — this plan builds the UI on top of it.

**Tech Stack:** Next.js 16 App Router, Tailwind v4 (design token CSS vars), `@supabase/ssr`, `@testing-library/react`, `vitest`, `jsdom`

---

## Next.js App Router Notes — Read Before Starting

- Route groups like `(app)/` create layout scopes without affecting URLs. `app/(app)/dashboard/page.tsx` → `/dashboard`.
- `useSearchParams()` requires a `<Suspense>` boundary in the parent. Always wrap components that use it.
- Server Components can be `async` and call `await createClient()` directly.
- `"use client"` at the top of a file marks a Client Component. Required for hooks (`useState`, `useRouter`, etc.).

---

## Design System Notes

All styling uses CSS variables from `app/globals.css`. Tailwind v4 exposes them inline via `var(--color-*)`, `var(--radius-*)`, etc. Never use arbitrary colors or spacing values outside the token set.

Key tokens in use:
- Backgrounds: `var(--color-bg-0)`, `var(--color-bg-1)`, `var(--color-surface-0)`, `var(--color-surface-1)`, `var(--color-surface-2)`
- Text: `var(--color-text-primary)`, `var(--color-text-secondary)`, `var(--color-text-tertiary)`, `var(--color-text-disabled)`
- Accent: `var(--color-accent-primary)`, `var(--color-accent-hover)`
- Borders: `var(--color-border-subtle)`
- Radius: `var(--radius-sm)`, `var(--radius-lg)`, `var(--radius-pill)`
- Shadows: `var(--shadow-1)`, `var(--shadow-2)`
- Error: `var(--color-error)`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `vitest.config.ts` | Modify | Add `@/` path alias + `setupFiles` for component tests |
| `vitest.setup.ts` | Create | Import jest-dom matchers |
| `components/ui/button.tsx` | Create | Button component (primary + secondary variants) |
| `components/ui/input.tsx` | Create | Labeled input with optional error state |
| `components/ui/card.tsx` | Create | Card wrapper |
| `components/auth/login-form.tsx` | Create | Client Component: email/password form + Google OAuth button |
| `components/auth/login-form.test.tsx` | Create | Tests for LoginForm logic |
| `components/auth/sign-out-button.tsx` | Create | Client Component: calls `supabase.auth.signOut()` |
| `app/login/page.tsx` | Modify | Replace Plan 1 stub with real login UI |
| `app/(app)/layout.tsx` | Create | Authenticated shell: header nav + main content area |
| `app/(app)/dashboard/page.tsx` | Create | Dashboard: project list or empty state |
| `app/page.tsx` | Modify | Redirect `/` → `/dashboard` |

---

## Task 1: Test Infrastructure for Component Tests

**Files:**
- Modify: `vitest.config.ts`
- Create: `vitest.setup.ts`

The current vitest config has no `@/` path alias and no setup file for jest-dom matchers. Component tests using `@testing-library/react` need both.

- [ ] **Step 1: Update `vitest.config.ts`**

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
  },
});
```

The global environment stays `"node"` to keep existing schema/env tests working. Component test files override this per-file using the `// @vitest-environment jsdom` pragma (see Task 3).

- [ ] **Step 2: Create `vitest.setup.ts`**

```typescript
// vitest.setup.ts
import "@testing-library/jest-dom";
```

- [ ] **Step 3: Run existing tests to verify nothing broke**

```bash
pnpm test
```

Expected: 17 tests pass

- [ ] **Step 4: Commit**

```bash
git add vitest.config.ts vitest.setup.ts
git commit -m "chore: add vitest path alias and jest-dom setup for component tests"
```

---

## Task 2: Shared UI Components

**Files:**
- Create: `components/ui/button.tsx`
- Create: `components/ui/input.tsx`
- Create: `components/ui/card.tsx`

No unit tests — these are thin wrappers with no logic. Behavior is exercised by LoginForm tests in Task 3.

- [ ] **Step 1: Create `components/ui/button.tsx`**

```typescript
// components/ui/button.tsx
import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<Variant, string> = {
    primary:
      "bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-0)] rounded-[var(--radius-pill)] px-6 py-4 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] active:scale-[0.98]",
    secondary:
      "bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-[var(--radius-pill)] px-6 py-4 active:scale-[0.98]",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
```

- [ ] **Step 2: Create `components/ui/input.tsx`**

```typescript
// components/ui/input.tsx
import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[var(--color-text-secondary)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-[var(--radius-sm)] border bg-[var(--color-surface-0)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors ${
          error
            ? "border-[var(--color-error)]"
            : "border-[var(--color-border-subtle)]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create `components/ui/card.tsx`**

```typescript
// components/ui/card.tsx
import { type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] border border-[var(--color-border-subtle)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Run checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add components/ui/button.tsx components/ui/input.tsx components/ui/card.tsx
git commit -m "feat: add shared Button, Input, and Card UI components"
```

---

## Task 3: Login Form Component

**Files:**
- Create: `components/auth/login-form.tsx`
- Create: `components/auth/login-form.test.tsx`

`LoginForm` is a Client Component with form state and Supabase auth calls. Tests use jsdom, mock `@/lib/supabase/client`, and mock `next/navigation`.

- [ ] **Step 1: Write the failing tests**

```typescript
// components/auth/login-form.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LoginForm } from "./login-form";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signInWithOAuth: mockSignInWithOAuth,
    },
  }),
}));

describe("LoginForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password fields", () => {
    render(<LoginForm />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("calls signInWithPassword with form values on submit", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "password123",
      });
    });
  });

  it("shows error message when auth fails", async () => {
    mockSignInWithPassword.mockResolvedValue({
      error: { message: "Invalid login credentials" },
    });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "bad@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Invalid login credentials"
      );
    });
  });

  it("redirects to /dashboard after successful login", async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null });
    render(<LoginForm />);

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "test@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test components/auth/login-form.test.tsx
```

Expected: FAIL — `Cannot find module './login-form'`

- [ ] **Step 3: Create `components/auth/login-form.tsx`**

```typescript
// components/auth/login-form.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
  }

  async function handleGoogleSignIn() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        required
      />
      {error && (
        <p role="alert" className="text-sm text-[var(--color-error)]">
          {error}
        </p>
      )}
      <Button type="submit" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
      <div className="relative flex items-center gap-4">
        <div className="flex-1 border-t border-[var(--color-border-subtle)]" />
        <span className="text-xs text-[var(--color-text-tertiary)]">or</span>
        <div className="flex-1 border-t border-[var(--color-border-subtle)]" />
      </div>
      <Button type="button" variant="secondary" onClick={handleGoogleSignIn}>
        Continue with Google
      </Button>
    </form>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test components/auth/login-form.test.tsx
```

Expected: 4 tests pass

- [ ] **Step 5: Run full checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add components/auth/login-form.tsx components/auth/login-form.test.tsx
git commit -m "feat: add LoginForm with email/password and Google OAuth"
```

---

## Task 4: Login Page

**Files:**
- Modify: `app/login/page.tsx`

Replace the Plan 1 stub with the real login page. `LoginForm` calls `useSearchParams` so it must be wrapped in `<Suspense>` to avoid a Next.js build error.

- [ ] **Step 1: Replace `app/login/page.tsx`**

```typescript
// app/login/page.tsx
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg-0)] flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-[25px] font-semibold text-[var(--color-text-primary)]">
            SpecForge
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            Sign in to your account
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
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
git commit -m "feat: replace login stub with real login page"
```

---

## Task 5: App Shell Layout

**Files:**
- Create: `app/(app)/layout.tsx`
- Create: `components/auth/sign-out-button.tsx`

The `(app)` route group layout wraps all authenticated pages. It does a redundant auth check (belt-and-suspenders beyond the proxy) and renders a top nav with a sign-out button.

`SignOutButton` is a separate Client Component because it needs `onClick` and `useRouter`.

- [ ] **Step 1: Create `components/auth/sign-out-button.tsx`**

```typescript
// components/auth/sign-out-button.tsx
"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button
      variant="secondary"
      onClick={handleSignOut}
      className="text-sm px-4 py-2"
    >
      Sign out
    </Button>
  );
}
```

- [ ] **Step 2: Create `app/(app)/layout.tsx`**

```typescript
// app/(app)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[var(--color-bg-0)]">
      <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-1)]">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <span className="font-semibold text-[var(--color-text-primary)]">
            SpecForge
          </span>
          <SignOutButton />
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
    </div>
  );
}
```

- [ ] **Step 3: Run checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/(app)/layout.tsx components/auth/sign-out-button.tsx
git commit -m "feat: add authenticated app shell layout with sign-out"
```

---

## Task 6: Dashboard Page

**Files:**
- Create: `app/(app)/dashboard/page.tsx`

Server Component. Fetches the current user's projects ordered by newest first. Shows an empty state if none exist. The "New Project" button is present as a stub — Plan 3 wires it up.

- [ ] **Step 1: Create `app/(app)/dashboard/page.tsx`**

```typescript
// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)]">
          Your Projects
        </h1>
        {/* TODO: Plan 3 — wire up project creation */}
        <Button>New Project</Button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-base text-[var(--color-text-secondary)] mb-2">
            No projects yet.
          </p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Create your first project to start analyzing feedback.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(projects as Project[]).map((project) => (
            <Card key={project.id}>
              <p className="font-medium text-[var(--color-text-primary)]">
                {project.name}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
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
git add app/(app)/dashboard/page.tsx
git commit -m "feat: add dashboard page with project list and empty state"
```

---

## Task 7: Root Redirect

**Files:**
- Modify: `app/page.tsx`

The proxy redirects unauthenticated users from `/` to `/login`. Authenticated users who hit `/` should land on `/dashboard`.

- [ ] **Step 1: Update `app/page.tsx`**

```typescript
// app/page.tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 2: Run all tests**

```bash
pnpm test
```

Expected: 17 existing + 4 new LoginForm tests = 21 tests pass

- [ ] **Step 3: Run full checks**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: redirect root to dashboard"
```

---

## Verification Checklist

After completing all tasks:

- [ ] `pnpm lint` passes with no errors
- [ ] `pnpm typecheck` passes with no errors
- [ ] `pnpm test` passes (21+ tests)
- [ ] Visiting `/` redirects to `/dashboard` (then to `/login` if unauthenticated)
- [ ] `/login` renders email, password fields and Google button
- [ ] Successful sign-in redirects to `/dashboard`
- [ ] `/dashboard` shows the empty state or project list
- [ ] Clicking "Sign out" clears the session and returns to `/login`

---

## Notes for Plan 3

- The "New Project" button on the dashboard is a stub — Plan 3 adds a modal/form and creates a row in `public.projects`
- Plan 3 will add `app/(app)/projects/[id]/page.tsx` for the project workspace
- The `Card` component in the dashboard will be extended in Plan 3 with a link to the workspace
