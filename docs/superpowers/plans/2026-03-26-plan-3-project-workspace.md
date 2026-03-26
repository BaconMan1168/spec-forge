# Plan 3: Project Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to create projects from the dashboard and land in a project workspace with an empty-state ready for Plan 4 (input ingestion).

**Architecture:** A Server Action (`createProject`) inserts a row into `projects` and redirects to the workspace. A client-side modal component owns open/close state and submits the form. The project workspace page is a Server Component that fetches project data and shows an empty state.

**Tech Stack:** Next.js App Router, Server Actions, Supabase SSR client, React `useState`, Tailwind + CSS tokens, Vitest + Testing Library

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `app/actions/projects.ts` | Create | `createProject` server action — insert project, redirect |
| `app/actions/projects.test.ts` | Create | Unit tests for server action |
| `components/projects/new-project-modal.tsx` | Create | Client component: button + modal with name form |
| `components/projects/new-project-modal.test.tsx` | Create | Component tests for modal |
| `app/(app)/projects/[id]/page.tsx` | Create | Server Component workspace page |
| `app/(app)/dashboard/page.tsx` | Modify | Wire `<NewProjectModal>`, make cards link to workspace |

---

## Task 1: Server Action — createProject

**Files:**
- Create: `app/actions/projects.ts`
- Create: `app/actions/projects.test.ts`

- [ ] **Step 1: Write the failing test**

Create `app/actions/projects.test.ts`:

```typescript
// app/actions/projects.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

import { createProject } from "./projects";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

describe("createProject", () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn(() => ({ single: mockSingle }));
  const mockInsert = vi.fn(() => ({ select: mockSelect }));
  const mockFrom = vi.fn(() => ({ insert: mockInsert }));
  const mockGetUser = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockSingle.mockResolvedValue({ data: { id: "proj-1" }, error: null });
    mockGetUser.mockResolvedValue({ data: { user: { id: "user-1" } } });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      from: mockFrom,
      auth: { getUser: mockGetUser },
    });
  });

  it("inserts a project with name and user_id then redirects to workspace", async () => {
    const formData = new FormData();
    formData.set("name", "Test Project");

    await createProject(formData);

    expect(mockFrom).toHaveBeenCalledWith("projects");
    expect(mockInsert).toHaveBeenCalledWith({ name: "Test Project", user_id: "user-1" });
    expect(redirect).toHaveBeenCalledWith("/projects/proj-1");
  });

  it("redirects to /login when user is not authenticated", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });

    const formData = new FormData();
    formData.set("name", "Test Project");

    await createProject(formData);

    expect(redirect).toHaveBeenCalledWith("/login");
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it("throws when insert returns an error", async () => {
    mockSingle.mockResolvedValue({ data: null, error: { message: "DB error" } });

    const formData = new FormData();
    formData.set("name", "Test Project");

    await expect(createProject(formData)).rejects.toThrow("DB error");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test app/actions/projects.test.ts
```

Expected: FAIL — `createProject` does not exist yet.

- [ ] **Step 3: Implement the server action**

Create `app/actions/projects.ts`:

```typescript
// app/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function createProject(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  redirect(`/projects/${data.id}`);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test app/actions/projects.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add app/actions/projects.ts app/actions/projects.test.ts
git commit -m "feat: add createProject server action"
```

---

## Task 2: NewProjectModal component

**Files:**
- Create: `components/projects/new-project-modal.tsx`
- Create: `components/projects/new-project-modal.test.tsx`

- [ ] **Step 1: Write the failing test**

Create `components/projects/new-project-modal.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewProjectModal } from "./new-project-modal";

vi.mock("@/app/actions/projects", () => ({
  createProject: vi.fn(),
}));

describe("NewProjectModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the New Project button", () => {
    render(<NewProjectModal />);
    expect(
      screen.getByRole("button", { name: /new project/i })
    ).toBeInTheDocument();
  });

  it("does not show modal by default", () => {
    render(<NewProjectModal />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("opens modal when button is clicked", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows project name input in modal", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    expect(screen.getByLabelText(/project name/i)).toBeInTheDocument();
  });

  it("closes modal when cancel is clicked", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test components/projects/new-project-modal.test.tsx
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the component**

Create `components/projects/new-project-modal.tsx`:

```tsx
// components/projects/new-project-modal.tsx
"use client";

import { useState } from "react";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewProjectModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-6"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />

          {/* Card */}
          <div className="relative w-full max-w-sm rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-2)] p-8">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-[var(--color-text-primary)] mb-6"
            >
              New Project
            </h2>

            <form action={createProject} className="flex flex-col gap-6">
              <Input
                label="Project name"
                name="name"
                type="text"
                placeholder="e.g. Q2 Discovery Sprint"
                required
                autoFocus
              />

              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test components/projects/new-project-modal.test.tsx
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/projects/new-project-modal.tsx components/projects/new-project-modal.test.tsx
git commit -m "feat: add NewProjectModal component"
```

---

## Task 3: Update dashboard — wire modal and card links

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Update the dashboard page**

Replace the content of `app/(app)/dashboard/page.tsx` with:

```tsx
// app/(app)/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NewProjectModal } from "@/components/projects/new-project-modal";
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
        <NewProjectModal />
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
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-[var(--color-accent-primary)] transition-colors cursor-pointer">
                <p className="font-medium text-[var(--color-text-primary)]">
                  {project.name}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Check Card accepts a className prop**

Open `components/ui/card.tsx`. If `className` is not forwarded, add it:

```tsx
// components/ui/card.tsx
type CardProps = {
  children: React.ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-2)] p-6 ${className}`}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/(app)/dashboard/page.tsx components/ui/card.tsx
git commit -m "feat: wire NewProjectModal and project card links in dashboard"
```

---

## Task 4: Project workspace page

**Files:**
- Create: `app/(app)/projects/[id]/page.tsx`

- [ ] **Step 1: Create the workspace page**

```tsx
// app/(app)/projects/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
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

  return (
    <div>
      <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)] mb-8">
        {p.name}
      </h1>

      {/* Empty state — Plan 4 will replace this with the input ingestion UI */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-base text-[var(--color-text-secondary)] mb-2">
          No feedback yet.
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Upload files or paste text to start analyzing feedback.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/projects/[id]/page.tsx"
git commit -m "feat: add project workspace page with empty state"
```

---

## Task 5: Full validation

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```

Expected: all tests pass (previous 21 + new 8 = 29 total).

- [ ] **Step 2: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: no errors.

- [ ] **Step 3: Verify manually (optional)**

Start the dev server (`pnpm dev`) and:
1. Log in and land on the dashboard
2. Click "New Project" — modal should open
3. Enter a name and click "Create" — should redirect to `/projects/[id]`
4. See workspace page with empty state
5. Go back to dashboard — project card should appear and link back to workspace

---
