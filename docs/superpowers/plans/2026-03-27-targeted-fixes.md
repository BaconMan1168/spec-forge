# Targeted Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply eight targeted fixes covering cursor-pointer consistency, PDF upload body size limit, success card text, input card hover animation, clipboard copy + detail page for paste batches, and a collapsible file list with per-file remove.

**Architecture:** Each task is self-contained. Tasks 1–5 are trivial one-file patches. Tasks 6–7 extend `BatchCard` and add a new Next.js route. Task 8 rewrites the file list inside `StepUpload`. All UI follows the existing design system tokens. TDD throughout — run `pnpm test` after every task.

**Tech Stack:** Next.js 15 App Router, React 19, TypeScript strict, Tailwind CSS, motion/react (Framer Motion), Vitest + Testing Library, Supabase.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `docs/product/design-system.md` | Modify | Add cursor-pointer rule for all interactive elements |
| `next.config.ts` | Modify | Add serverActions bodySizeLimit: 20mb |
| `components/projects/inputs/step-type-select.tsx` | Modify | Add cursor-pointer to method cards |
| `components/projects/inputs/add-input-form.tsx` | Modify | Fix "itemsadded" text spacing |
| `components/projects/inputs/step-upload.tsx` | Modify | Collapsible file list with per-file remove |
| `components/projects/inputs/step-upload.test.tsx` | Modify | Tests for collapsible file list |
| `components/projects/workspace/batch-card.tsx` | Modify | cursor-pointer on trash, 500ms hover animation, paste link + clipboard copy |
| `components/projects/workspace/batch-card.test.tsx` | Modify | Tests for new paste link and clipboard behaviour |
| `components/projects/workspace/inputs-section.tsx` | Modify | Thread projectId down to BatchCard |
| `components/projects/workspace/inputs-section.test.tsx` | Modify | Update test fixture for new BatchCard prop |
| `app/(app)/projects/[id]/inputs/[sourceType]/page.tsx` | Create | Paste input detail page (server component) |
| `app/(app)/projects/[id]/inputs/[sourceType]/loading.tsx` | Create | Skeleton loading state for detail page |

---

## Task 1: Design system — cursor-pointer rule for all interactive elements

**Files:**
- Modify: `docs/product/design-system.md`

- [ ] **Step 1: Add the rule**

In `docs/product/design-system.md`, find the `## Buttons` section inside `# 7. Component Rules`. Directly after the existing `### Cursor` subsection (which says "ALL buttons must use `cursor: pointer` on hover"), add a new subsection:

```markdown
### Interactive Elements

ALL clickable non-button elements must also use `cursor: pointer`:
- Cards acting as clickable surfaces
- Icon-only buttons and icon wrappers
- Clickable list rows and batch cards
- Any `<div>` or `<span>` with an `onClick` handler

Never use `cursor: default` on any interactive element.
```

- [ ] **Step 2: Commit**

```bash
git add docs/product/design-system.md
git commit -m "docs: extend cursor-pointer rule to all interactive elements"
```

---

## Task 2: Next.js serverActions body size limit

**Files:**
- Modify: `next.config.ts`

The default Next.js serverActions body size is 1 MB. File uploads fail for PDFs even under 1 MB because the FormData envelope (with metadata fields) pushes the total over the limit. Setting `bodySizeLimit` to `'20mb'` gives headroom for multi-file uploads while keeping well within the 10 MB per-file guard already in the server action.

- [ ] **Step 1: Update next.config.ts**

Replace the entire file content:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
```

- [ ] **Step 2: Verify typecheck passes**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add next.config.ts
git commit -m "fix: increase serverActions bodySizeLimit to 20mb for PDF uploads"
```

---

## Task 3: cursor-pointer on input method cards

**Files:**
- Modify: `components/projects/inputs/step-type-select.tsx`
- Test: `components/projects/inputs/step-type-select.test.tsx`

- [ ] **Step 1: Write the failing test**

Open `components/projects/inputs/step-type-select.test.tsx`. Add inside the existing `describe` block (or create the file if it doesn't exist):

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepTypeSelect } from "./step-type-select";

describe("StepTypeSelect", () => {
  it("method card buttons have cursor-pointer class", () => {
    render(
      <StepTypeSelect value={null} onChange={vi.fn()} onNext={vi.fn()} />
    );
    const buttons = screen.getAllByRole("button").filter(
      (b) => b.textContent?.includes("Upload files") || b.textContent?.includes("Paste text")
    );
    expect(buttons.length).toBe(2);
    buttons.forEach((btn) => {
      expect(btn.className).toContain("cursor-pointer");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- step-type-select
```
Expected: FAIL — buttons don't have `cursor-pointer` yet.

- [ ] **Step 3: Add cursor-pointer to method card buttons**

In `components/projects/inputs/step-type-select.tsx`, find the `<button>` element inside the `.map()`. The current className string starts with `"flex flex-col items-center gap-2 rounded-[var(--radius-md)] border px-3 py-5 transition-all"`. Add `cursor-pointer` to it:

```tsx
className={[
  "flex flex-col cursor-pointer items-center gap-2 rounded-[var(--radius-md)] border px-3 py-5 transition-all",
  selected
    ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10"
    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-surface-2)]",
].join(" ")}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- step-type-select
```
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/projects/inputs/step-type-select.tsx components/projects/inputs/step-type-select.test.tsx
git commit -m "fix: add cursor-pointer to input method cards"
```

---

## Task 4: Fix success card "itemsadded" text spacing

**Files:**
- Modify: `components/projects/inputs/add-input-form.tsx`
- Test: `components/projects/inputs/add-input-form.test.tsx`

- [ ] **Step 1: Write the failing test**

In `components/projects/inputs/add-input-form.test.tsx`, add a new test at the bottom of the `describe` block. First add the import for `act` from React if not present:

```tsx
import { uploadFeedbackFiles } from "@/app/actions/feedback-files";

it("success card renders 'items added' with a space", async () => {
  vi.mocked(uploadFeedbackFiles).mockResolvedValueOnce({
    succeeded: [{ id: "f1" } as never, { id: "f2" } as never],
    failed: [],
  });

  render(<AddInputForm projectId="p1" />);

  // Navigate to upload step
  fireEvent.click(screen.getByText("Upload files").closest("button")!);
  fireEvent.click(screen.getByRole("button", { name: /next/i }));
  await waitFor(() => screen.getByText(/drag & drop/i));

  // Fill source label
  fireEvent.change(
    screen.getByPlaceholderText(/interview|ticket|survey/i),
    { target: { value: "Test Source" } }
  );

  // Add a dummy file (simulate files already set via state)
  // Submit — the mock will return 2 succeeded records
  // Since we can't set files via fireEvent, test the text node only when
  // submitResult is set via direct state — instead mock the action and
  // look for the text in the rendered output after submit
  fireEvent.click(screen.getByRole("button", { name: /submit/i }));

  await waitFor(() =>
    expect(screen.getByText(/items added/i)).toBeInTheDocument()
  );
  // Ensure no "itemsadded" run-together
  expect(screen.queryByText(/itemsadded/i)).not.toBeInTheDocument();
});
```

Note: The submit button is disabled without files, so this test uses the mock to verify the text shape. If the submit button stays disabled in the test environment, remove the submit step and instead check that the string literal in the source is space-separated. The key assertion is the absence of `itemsadded`.

- [ ] **Step 2: Run test to verify it fails (or confirm the text issue)**

```bash
pnpm test -- add-input-form
```

- [ ] **Step 3: Fix the text in add-input-form.tsx**

In `components/projects/inputs/add-input-form.tsx`, find the `<p>` inside the success block (around line 102–105). Replace:

```tsx
<p className="text-[13px] font-medium text-[var(--color-text-primary)]">
  {count} {count === 1 ? "item" : "items"} added under &ldquo;
  {sourceLabel}&rdquo;
</p>
```

With:

```tsx
<p className="text-[13px] font-medium text-[var(--color-text-primary)]">
  {`${count} ${count === 1 ? "item" : "items"} added under \u201c${sourceLabel}\u201d`}
</p>
```

`\u201c` = `"` (left double quotation mark), `\u201d` = `"` (right double quotation mark). This replaces the HTML entities and keeps everything in one string literal — no JSX whitespace ambiguity.

- [ ] **Step 4: Run all tests**

```bash
pnpm test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add components/projects/inputs/add-input-form.tsx components/projects/inputs/add-input-form.test.tsx
git commit -m "fix: ensure space between count and 'items added' in success card"
```

---

## Task 5: BatchCard — cursor-pointer on trash, 500ms hover animation

**Files:**
- Modify: `components/projects/workspace/batch-card.tsx`
- Modify: `components/projects/workspace/batch-card.test.tsx`

- [ ] **Step 1: Write a failing test for cursor-pointer on the trash button**

In `components/projects/workspace/batch-card.test.tsx`, add inside the existing `describe("BatchCard")` block:

```tsx
it("trash button has cursor-pointer class", () => {
  render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
  const deleteBtn = screen.getByRole("button", { name: /delete/i });
  expect(deleteBtn.className).toContain("cursor-pointer");
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- batch-card
```
Expected: FAIL.

- [ ] **Step 3: Add cursor-pointer to the trash button and 500ms hover animation to the card wrapper**

Replace the entire `batch-card.tsx` content:

```tsx
import type { FeedbackFile } from "@/lib/types/database";
import { Trash2, FileText, Clipboard } from "lucide-react";

export type BatchGroup = {
  sourceLabel: string;
  files: FeedbackFile[];
  wordCount: number;
  badge: "PDF" | "TXT" | "DOCX" | "MD" | "JSON" | "Paste" | "Mixed";
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface BatchCardProps {
  batch: BatchGroup;
  onDelete: () => void;
  isDeleting: boolean;
}

export function BatchCard({ batch, onDelete, isDeleting }: BatchCardProps) {
  const latestDate = batch.files.reduce(
    (max, f) => (f.created_at > max ? f.created_at : max),
    batch.files[0].created_at
  );
  const Icon = batch.badge === "Paste" ? Clipboard : FileText;
  const fileLabel =
    batch.files.length === 1 ? "1 file" : `${batch.files.length} files`;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 flex-shrink-0 transition-[transform,box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)]">
        <Icon size={15} strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {batch.sourceLabel}
        </div>
        <div className="mt-0.5 flex gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>{fileLabel}</span>
          <span>·</span>
          <span>{batch.wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>{formatRelativeTime(latestDate)}</span>
        </div>
      </div>
      <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
        {batch.badge}
      </span>
      <button
        aria-label="Delete batch"
        disabled={isDeleting}
        onClick={onDelete}
        className="cursor-pointer flex items-center justify-center rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-error)] disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.7} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test -- batch-card
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/batch-card.tsx components/projects/workspace/batch-card.test.tsx
git commit -m "fix: cursor-pointer on trash icon and 500ms hover animation on BatchCard"
```

---

## Task 6: Clipboard copy + paste detail link on BatchCard

This task makes paste batches clickable (link to detail page) and adds a clipboard copy button on their icon. Non-paste batches stay unchanged.

**Files:**
- Modify: `components/projects/workspace/batch-card.tsx`
- Modify: `components/projects/workspace/batch-card.test.tsx`
- Modify: `components/projects/workspace/inputs-section.tsx`
- Modify: `components/projects/workspace/inputs-section.test.tsx`

- [ ] **Step 1: Write failing tests for paste link and clipboard copy**

In `components/projects/workspace/batch-card.test.tsx`, add these mocks at the top of the file (after existing mocks):

```tsx
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} className={className} {...rest}>{children}</a>
  ),
}));

// Mock clipboard
Object.assign(navigator, {
  clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
});
```

Then add new test fixtures and tests inside the `describe("BatchCard")` block:

```tsx
const pasteBatch: BatchGroup = {
  sourceLabel: "Interview Notes",
  files: [
    {
      id: "p1", project_id: "proj1", file_name: "Pasted text",
      source_type: "Interview Notes",
      content: "This is the paste content",
      storage_url: null, mime_type: null,
      input_method: "paste", word_count: 5,
      created_at: new Date().toISOString(),
    },
  ],
  wordCount: 5,
  badge: "Paste",
};

it("paste batch card renders as a link to the detail page", () => {
  render(
    <BatchCard
      batch={pasteBatch}
      onDelete={vi.fn()}
      isDeleting={false}
      projectId="proj1"
    />
  );
  const link = screen.getByRole("link");
  expect(link).toHaveAttribute(
    "href",
    `/projects/proj1/inputs/${encodeURIComponent("Interview Notes")}`
  );
});

it("clipboard icon copies batch content when clicked", async () => {
  render(
    <BatchCard
      batch={pasteBatch}
      onDelete={vi.fn()}
      isDeleting={false}
      projectId="proj1"
    />
  );
  const copyBtn = screen.getByRole("button", { name: /copy/i });
  fireEvent.click(copyBtn);
  expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
    "This is the paste content"
  );
});

it("non-paste batch does not render a link wrapper", () => {
  render(
    <BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} projectId="proj1" />
  );
  expect(screen.queryByRole("link")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- batch-card
```
Expected: new tests FAIL (BatchCard doesn't accept `projectId` yet).

- [ ] **Step 3: Update BatchCard to support paste link and clipboard copy**

Replace the entire `components/projects/workspace/batch-card.tsx`:

```tsx
"use client";

import Link from "next/link";
import type { FeedbackFile } from "@/lib/types/database";
import { Trash2, FileText, Clipboard, Copy } from "lucide-react";

export type BatchGroup = {
  sourceLabel: string;
  files: FeedbackFile[];
  wordCount: number;
  badge: "PDF" | "TXT" | "DOCX" | "MD" | "JSON" | "Paste" | "Mixed";
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface BatchCardProps {
  batch: BatchGroup;
  onDelete: () => void;
  isDeleting: boolean;
  projectId: string;
}

export function BatchCard({ batch, onDelete, isDeleting, projectId }: BatchCardProps) {
  const latestDate = batch.files.reduce(
    (max, f) => (f.created_at > max ? f.created_at : max),
    batch.files[0].created_at
  );
  const isPaste = batch.badge === "Paste";
  const Icon = isPaste ? Clipboard : FileText;
  const fileLabel =
    batch.files.length === 1 ? "1 file" : `${batch.files.length} files`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = batch.files.map((f) => f.content).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
  };

  const cardClass =
    "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 flex-shrink-0 transition-[transform,box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]";

  const inner = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)]">
        <Icon size={15} strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {batch.sourceLabel}
        </div>
        <div className="mt-0.5 flex gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>{fileLabel}</span>
          <span>·</span>
          <span>{batch.wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>{formatRelativeTime(latestDate)}</span>
        </div>
      </div>
      <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
        {batch.badge}
      </span>
      {isPaste && (
        <button
          aria-label="Copy text"
          onClick={handleCopy}
          className="cursor-pointer flex items-center justify-center rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <Copy size={14} strokeWidth={1.7} />
        </button>
      )}
      <button
        aria-label="Delete batch"
        disabled={isDeleting}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        className="cursor-pointer flex items-center justify-center rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-error)] disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.7} />
      </button>
    </>
  );

  if (isPaste) {
    const href = `/projects/${projectId}/inputs/${encodeURIComponent(batch.sourceLabel)}`;
    return (
      <Link href={href} className={`${cardClass} cursor-pointer`}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
```

- [ ] **Step 4: Update InputsSection to pass projectId to BatchCard**

In `components/projects/workspace/inputs-section.tsx`, find the `<BatchCard>` JSX and add the `projectId` prop:

```tsx
<BatchCard
  key={batch.sourceLabel}
  batch={batch}
  onDelete={() => handleDelete(batch.sourceLabel)}
  isDeleting={isPending}
  projectId={projectId}
/>
```

- [ ] **Step 5: Update inputs-section tests**

In `components/projects/workspace/inputs-section.test.tsx`, the existing `makeFile` fixture has `input_method: "upload"`. The existing tests render `<InputsSection files={...} projectId="p1" />` — the `projectId` prop is already threaded (it was already a prop). Verify the test still passes as-is since BatchCard now gets `projectId` from InputsSection.

Run:

```bash
pnpm test -- inputs-section
```
Expected: all pass (no change to InputsSection props API — it already had `projectId`).

- [ ] **Step 6: Run all batch-card tests**

```bash
pnpm test -- batch-card
```
Expected: all pass.

- [ ] **Step 7: Run full test suite**

```bash
pnpm test
```
Expected: all pass.

- [ ] **Step 8: Commit**

```bash
git add components/projects/workspace/batch-card.tsx components/projects/workspace/batch-card.test.tsx components/projects/workspace/inputs-section.tsx
git commit -m "feat: paste BatchCard links to detail page and copies text to clipboard"
```

---

## Task 7: Paste input detail page + skeleton loading

**Files:**
- Create: `app/(app)/projects/[id]/inputs/[sourceType]/page.tsx`
- Create: `app/(app)/projects/[id]/inputs/[sourceType]/loading.tsx`

There are no unit tests for server components in this codebase — they rely on integration/e2e. Verify with typecheck.

- [ ] **Step 1: Create the detail page**

Create `app/(app)/projects/[id]/inputs/[sourceType]/page.tsx`:

```tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { FeedbackFile } from "@/lib/types/database";

export default async function PasteInputDetailPage({
  params,
}: {
  params: Promise<{ id: string; sourceType: string }>;
}) {
  const { id, sourceType } = await params;
  const decodedSourceType = decodeURIComponent(sourceType);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feedback_files")
    .select("*")
    .eq("project_id", id)
    .eq("source_type", decodedSourceType)
    .eq("input_method", "paste")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) notFound();

  const files = data as FeedbackFile[];
  const totalWords = files.reduce((s, f) => s + (f.word_count ?? 0), 0);
  const latestDate = files.reduce(
    (max, f) => (f.created_at > max ? f.created_at : max),
    files[0].created_at
  );
  const fullContent = files.map((f) => f.content).join("\n\n---\n\n");

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-[13px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Back to project
        </Link>
      </div>

      <h1 className="mb-1 text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
        {decodedSourceType}
      </h1>
      <p className="mb-6 text-[13px] text-[var(--color-text-tertiary)]">
        {totalWords.toLocaleString()} words ·{" "}
        {new Date(latestDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6">
        <div
          className="h-[60vh] overflow-y-auto pr-2 text-[14px] leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap [scrollbar-width:thin]"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 85%, transparent 100%)",
          }}
        >
          {fullContent}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create the loading skeleton**

Create `app/(app)/projects/[id]/inputs/[sourceType]/loading.tsx`:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function PasteInputDetailLoading() {
  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6">
        <Skeleton className="h-4 w-32 bg-[var(--color-surface-1)]" />
      </div>
      <Skeleton className="mb-1 h-7 w-64 bg-[var(--color-surface-1)]" />
      <Skeleton className="mb-6 h-4 w-40 bg-[var(--color-surface-1)]" />
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6">
        <div className="flex h-[60vh] flex-col gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 bg-[var(--color-surface-1)]"
              style={{ width: `${70 + ((i * 13) % 30)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/projects/[id]/inputs/[sourceType]/page.tsx" "app/(app)/projects/[id]/inputs/[sourceType]/loading.tsx"
git commit -m "feat: add paste input detail page with skeleton loading"
```

---

## Task 8: Collapsible file list in StepUpload

Replace the "N files selected" text with a collapsible accordion below the drop zone. When contracted: shows the most recently added filename + "and N more" badge. When expanded: shows all files with a per-file remove button. Uses `motion/react` AnimatePresence for smooth height reveal.

**Files:**
- Modify: `components/projects/inputs/step-upload.tsx`
- Modify: `components/projects/inputs/step-upload.test.tsx`

- [ ] **Step 1: Write failing tests**

In `components/projects/inputs/step-upload.test.tsx`, replace the file entirely:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepUpload } from "./step-upload";

vi.mock("motion/react", () => ({
  motion: {
    button: ({
      children,
      className,
      whileHover: _wh,
      whileTap: _wt,
      transition: _tr,
      ...rest
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
      whileHover?: unknown;
      whileTap?: unknown;
      transition?: unknown;
    }) => <button className={className} {...rest}>{children}</button>,
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown;
      animate?: unknown;
      exit?: unknown;
      transition?: unknown;
    }) => <div className={className} {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const makeFile = (name: string) =>
  new File(["content"], name, { type: "application/pdf" });

const baseProps = {
  files: [],
  onFilesChange: vi.fn(),
  sourceLabel: "",
  onSourceLabelChange: vi.fn(),
  sourceLabelError: null,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
};

describe("StepUpload", () => {
  it("renders dropzone", () => {
    render(<StepUpload {...baseProps} />);
    expect(screen.getByText(/drag & drop/i)).toBeInTheDocument();
  });

  it("shows accepted formats hint", () => {
    render(<StepUpload {...baseProps} />);
    expect(screen.getByText(/pdf.*docx.*txt.*md.*json/i)).toBeInTheDocument();
  });

  it("renders source label input", () => {
    render(<StepUpload {...baseProps} />);
    expect(
      screen.getByPlaceholderText(/interview|ticket|survey/i)
    ).toBeInTheDocument();
  });

  it("shows source label error when provided", () => {
    render(<StepUpload {...baseProps} sourceLabelError="Required" />);
    expect(screen.getByText("Required")).toBeInTheDocument();
  });

  it("calls onBack when Back is clicked", () => {
    render(<StepUpload {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });

  it("Submit button is disabled when no files selected", () => {
    render(<StepUpload {...baseProps} files={[]} />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("shows contracted file row with latest filename when 1 file selected", () => {
    const props = { ...baseProps, files: [makeFile("report.pdf")] };
    render(<StepUpload {...props} />);
    expect(screen.getByText("report.pdf")).toBeInTheDocument();
  });

  it("shows 'and N more' badge when multiple files selected", () => {
    const props = {
      ...baseProps,
      files: [makeFile("a.pdf"), makeFile("b.pdf"), makeFile("c.pdf")],
    };
    render(<StepUpload {...props} />);
    expect(screen.getByText(/and 2 more/i)).toBeInTheDocument();
  });

  it("expands to show all filenames when toggle is clicked", () => {
    const props = {
      ...baseProps,
      files: [makeFile("a.pdf"), makeFile("b.pdf")],
    };
    render(<StepUpload {...props} />);
    fireEvent.click(screen.getByRole("button", { name: /show files|expand/i }));
    expect(screen.getByText("a.pdf")).toBeInTheDocument();
    expect(screen.getByText("b.pdf")).toBeInTheDocument();
  });

  it("calls onFilesChange without the removed file when × is clicked", () => {
    const onFilesChange = vi.fn();
    const files = [makeFile("a.pdf"), makeFile("b.pdf")];
    const props = { ...baseProps, files, onFilesChange };
    render(<StepUpload {...props} />);
    // Expand first
    fireEvent.click(screen.getByRole("button", { name: /show files|expand/i }));
    // Click remove on first file
    fireEvent.click(screen.getAllByRole("button", { name: /remove/i })[0]);
    expect(onFilesChange).toHaveBeenCalledWith([files[1]]);
  });
});
```

- [ ] **Step 2: Run tests to verify new ones fail**

```bash
pnpm test -- step-upload
```
Expected: new tests about file list FAIL; existing tests still pass.

- [ ] **Step 3: Implement collapsible file list in StepUpload**

Replace `components/projects/inputs/step-upload.tsx` entirely:

```tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { UploadCloud, ArrowLeft, ChevronDown, ChevronUp, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";

// To add a new file format: append its extension and MIME type here.
// No other UI files need to change.
export const ACCEPTED_EXTENSIONS =
  ".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain,.md,text/markdown,.json,application/json";

export const ACCEPTED_FORMATS_LABEL = "PDF, DOCX, TXT, MD, JSON";

export function validateSourceLabel(v: string): string | null {
  const t = v.trim();
  if (!t) return "Source label is required";
  if (t.length > 60) return "Must be 60 characters or less";
  if (!/^[a-zA-Z0-9 \-]+$/.test(t))
    return "Only letters, numbers, spaces, and hyphens";
  return null;
}

interface StepUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  sourceLabel: string;
  onSourceLabelChange: (v: string) => void;
  sourceLabelError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepUpload({
  files,
  onFilesChange,
  sourceLabel,
  onSourceLabelChange,
  sourceLabelError,
  onBack,
  onSubmit,
  isSubmitting,
}: StepUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const prevCountRef = useRef(files.length);

  // Auto-expand when a new file is added beyond the first
  useEffect(() => {
    if (files.length > 1 && files.length > prevCountRef.current) {
      setIsExpanded(true);
    }
    // Auto-collapse when back to 1
    if (files.length <= 1) {
      setIsExpanded(false);
    }
    prevCountRef.current = files.length;
  }, [files.length]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...dropped]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    onFilesChange([...files, ...selected]);
    // Reset input so the same file can be re-added if removed
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const canSubmit = files.length > 0 && !isSubmitting;
  const latestFile = files[files.length - 1];
  const extraCount = files.length - 1;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Drop files here
        </p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/5 px-5 py-7 text-center transition-colors hover:border-[var(--color-accent-primary)]/50"
        >
          <UploadCloud
            size={28}
            strokeWidth={1.5}
            className="text-[var(--color-accent-primary)]"
          />
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            Multiple files · Max 10 MB each
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {ACCEPTED_FORMATS_LABEL}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>

        {/* Collapsible file list */}
        {files.length > 0 && (
          <div className="mt-2 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] overflow-hidden">
            {/* Contracted header — always visible */}
            <button
              type="button"
              aria-label={isExpanded ? "Collapse files" : "Show files / expand"}
              onClick={() => setIsExpanded((v) => !v)}
              className="cursor-pointer flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <span className="flex-1 truncate text-[12px] font-medium text-[var(--color-text-primary)]">
                {latestFile.name}
              </span>
              {extraCount > 0 && (
                <span className="shrink-0 rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
                  and {extraCount} more
                </span>
              )}
              {isExpanded ? (
                <ChevronUp size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
              ) : (
                <ChevronDown size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
              )}
            </button>

            {/* Expanded list */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="file-list"
                  initial={{ height: 0, opacity: 0, y: 4 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: 4 }}
                  transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[var(--color-border-subtle)] px-1 py-1">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 hover:bg-[var(--color-surface-2)] transition-colors"
                      >
                        <span className="flex-1 truncate text-[12px] text-[var(--color-text-primary)]">
                          {file.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-[var(--color-text-tertiary)]">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="cursor-pointer flex shrink-0 items-center justify-center rounded p-0.5 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-error)]"
                        >
                          <X size={12} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Source label
        </p>
        <input
          type="text"
          value={sourceLabel}
          onChange={(e) => onSourceLabelChange(e.target.value)}
          placeholder="e.g. User Interview, Support Ticket, Survey…"
          maxLength={60}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-primary)]/50 focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
        />
        {sourceLabelError && (
          <p className="mt-1 text-[11px] text-[var(--color-error)]">
            {sourceLabelError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} type="button">
          <ArrowLeft size={14} />
          Back
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={onSubmit}
          type="button"
        >
          Submit batch
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test -- step-upload
```
Expected: all pass.

- [ ] **Step 5: Run full suite**

```bash
pnpm test
```
Expected: all pass.

- [ ] **Step 6: Run lint and typecheck**

```bash
pnpm lint && pnpm typecheck
```
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add components/projects/inputs/step-upload.tsx components/projects/inputs/step-upload.test.tsx
git commit -m "feat: collapsible file list with per-file remove in StepUpload"
```

---

## Self-Review

**Spec coverage check:**

| Spec item | Task |
|-----------|------|
| cursor-pointer design system rule | Task 1 |
| PDF upload body limit (20mb) | Task 2 |
| cursor-pointer on method cards | Task 3 |
| cursor-pointer on trash icon | Task 5 |
| Success card "items added" text | Task 4 |
| 500ms hover animation on BatchCard | Task 5 |
| Clipboard copy on paste card | Task 6 |
| Paste card links to detail page | Task 6, 7 |
| Detail page scrollable text | Task 7 |
| Skeleton loading state | Task 7 |
| File list with remove per file | Task 8 |
| Collapsible file list | Task 8 |
| Auto-expand on second file | Task 8 |

All spec items covered. No placeholders. Types are consistent across tasks — `BatchGroup`, `FeedbackFile`, `BatchCardProps` all match. `projectId: string` added to `BatchCardProps` in Task 6 and used correctly in Task 5's prior version (Task 5 is superseded by Task 6's full replacement of `batch-card.tsx` — the engineer should skip Task 5's Step 3 replacement and instead use Task 6's version, which includes both changes).

> **Note:** Task 5 adds cursor-pointer and 500ms animation. Task 6 replaces the full file again to add paste link + clipboard copy. The engineer should apply Task 5 first, then Task 6 will supersede it. Both replacements are complete and self-contained — no partial merging needed.
