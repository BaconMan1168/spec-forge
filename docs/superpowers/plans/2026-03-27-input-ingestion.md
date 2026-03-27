# Input Ingestion & Parsing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the project workspace hub (`/projects/[id]`) and a multi-step animated input form (`/projects/[id]/add`) with file parsing and Supabase Storage.

**Architecture:** The workspace page is a server component fetching project + files, rendering scroll-animated sections (Inputs, Themes locked, Proposals locked). The add-inputs route is a client-side multi-step form using `motion/react` `AnimatePresence`. Files are parsed server-side via `pdf-parse`/`mammoth`/native-read, stored in Supabase Storage, and inserted as `FeedbackFile` records. Files are grouped by `source_type` label for display (no DB batch concept — Option B). Step 1 of the form offers two choices only: **Upload files** or **Paste text** — adding new file formats requires zero UI changes.

**Tech Stack:** Next.js 15 App Router, `motion/react`, shadcn `Button` (existing), Lucide React icons, Supabase Storage + Postgres, `pdf-parse`, `mammoth`, Vitest + Testing Library, Tailwind v4 CSS vars.

**Supported file formats:** `.pdf`, `.docx`, `.txt`, `.md`, `.json`. Adding a new format = 1 entry in `SUPPORTED_MIME_TYPES` + 1 parser case in `parseFileToText` + update `ACCEPTED_EXTENSIONS` string. No component changes.

---

## File Map

**Create:**
- `supabase/migrations/002_feedback_storage.sql` — manual: Storage bucket + RLS
- `lib/parse/parse-file.ts` — PDF/DOCX/TXT parsing + word count
- `lib/parse/parse-file.test.ts`
- `app/actions/feedback-files.ts` — server actions: upload, paste, list, deleteBatch
- `app/actions/feedback-files.test.ts`
- `components/ui/scroll-reveal.tsx` — IntersectionObserver + motion wrapper (no test)
- `components/projects/workspace/batch-card.tsx` — batch row (label, count, delete)
- `components/projects/workspace/batch-card.test.tsx`
- `components/projects/workspace/locked-section.tsx` — locked placeholder card
- `components/projects/workspace/locked-section.test.tsx`
- `components/projects/workspace/inputs-section.tsx` — scrollable container + delete logic
- `components/projects/workspace/inputs-section.test.tsx`
- `components/projects/inputs/step-type-select.tsx` — Step 1: Upload / Paste 2-tile selector + `INPUT_TYPES` config
- `components/projects/inputs/step-type-select.test.tsx`
- `components/projects/inputs/step-upload.tsx` — Step 2a: dropzone + source label
- `components/projects/inputs/step-upload.test.tsx`
- `components/projects/inputs/step-paste.tsx` — Step 2b: textarea + source label
- `components/projects/inputs/step-paste.test.tsx`
- `components/projects/inputs/add-input-form.tsx` — multi-step shell with AnimatePresence
- `components/projects/inputs/add-input-form.test.tsx`
- `app/(app)/projects/[id]/add/page.tsx` — add inputs route

**Modify:**
- `app/(app)/projects/[id]/page.tsx` — full rewrite as workspace hub

---

## Shared Patterns

**motion/react mock** (use in every component test file):
```tsx
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, initial: _i, animate: _a, exit: _e,
            transition: _t, custom: _c, variants: _v, ref: _r, ...rest }: any) => (
      <div className={className} {...rest}>{children}</div>
    ),
    button: ({ children, className, whileHover: _wh, whileTap: _wt,
               transition: _tr, ...rest }: any) => (
      <button className={className} {...rest}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

**next/navigation mock** (use when component calls useRouter):
```tsx
const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  Link: ({ href, children, className }: any) => <a href={href} className={className}>{children}</a>,
}));
```

**scroll-reveal mock** (use when workspace components import ScrollReveal):
```tsx
vi.mock("@/components/ui/scroll-reveal", () => ({
  ScrollReveal: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
```

---

## Task 1: Supabase Storage Migration

**Files:**
- Create: `supabase/migrations/002_feedback_storage.sql`

- [ ] **Step 1: Create migration file**

```sql
-- supabase/migrations/002_feedback_storage.sql
-- Run this manually in the Supabase SQL editor (same as 001_initial_schema.sql)

insert into storage.buckets (id, name, public)
values ('feedback-uploads', 'feedback-uploads', false)
on conflict (id) do nothing;

create policy "Authenticated users can upload feedback files"
on storage.objects for insert to authenticated
with check (bucket_id = 'feedback-uploads');

create policy "Authenticated users can read feedback files"
on storage.objects for select to authenticated
using (bucket_id = 'feedback-uploads');

create policy "Authenticated users can delete feedback files"
on storage.objects for delete to authenticated
using (bucket_id = 'feedback-uploads');
```

- [ ] **Step 2: Run in Supabase SQL editor**

Open the Supabase dashboard → SQL editor → paste the file contents → Run.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/002_feedback_storage.sql
git commit -m "chore: add feedback-uploads storage bucket migration"
```

---

## Task 2: Parse Utility

**Files:**
- Create: `lib/parse/parse-file.ts`
- Create: `lib/parse/parse-file.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/parse/parse-file.test.ts
import { describe, it, expect, vi } from "vitest";

vi.mock("mammoth", () => ({
  default: {
    extractRawText: vi.fn().mockResolvedValue({ value: "  docx content  " }),
  },
}));

vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "  pdf content  " }),
}));

import { isSupportedMimeType, countWords, parseFileToText } from "./parse-file";

describe("isSupportedMimeType", () => {
  it("accepts application/pdf", () => {
    expect(isSupportedMimeType("application/pdf")).toBe(true);
  });
  it("accepts text/plain", () => {
    expect(isSupportedMimeType("text/plain")).toBe(true);
  });
  it("accepts text/markdown", () => {
    expect(isSupportedMimeType("text/markdown")).toBe(true);
  });
  it("accepts application/json", () => {
    expect(isSupportedMimeType("application/json")).toBe(true);
  });
  it("accepts docx mime", () => {
    expect(isSupportedMimeType(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    )).toBe(true);
  });
  it("rejects image/png", () => {
    expect(isSupportedMimeType("image/png")).toBe(false);
  });
});

describe("countWords", () => {
  it("counts words", () => expect(countWords("hello world foo")).toBe(3));
  it("handles extra whitespace", () => expect(countWords("  hi   there  ")).toBe(2));
  it("returns 0 for empty", () => expect(countWords("   ")).toBe(0));
});

describe("parseFileToText", () => {
  it("parses plain text (.txt)", async () => {
    const result = await parseFileToText(Buffer.from("hello"), "text/plain");
    expect(result).toBe("hello");
  });
  it("parses markdown (.md via text/markdown)", async () => {
    const result = await parseFileToText(Buffer.from("# Hello\nworld"), "text/markdown");
    expect(result).toBe("# Hello\nworld");
  });
  it("parses markdown (.md reported as text/plain by browser)", async () => {
    const result = await parseFileToText(Buffer.from("# Hi"), "text/plain", "notes.md");
    expect(result).toBe("# Hi");
  });
  it("parses JSON and pretty-prints it", async () => {
    const result = await parseFileToText(
      Buffer.from('{"key":"value"}'),
      "application/json"
    );
    expect(result).toContain('"key"');
    expect(result).toContain('"value"');
  });
  it("calls pdf-parse and returns trimmed text", async () => {
    const result = await parseFileToText(Buffer.from("x"), "application/pdf");
    expect(result).toBe("pdf content");
  });
  it("calls mammoth and returns trimmed text", async () => {
    const result = await parseFileToText(
      Buffer.from("x"),
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(result).toBe("docx content");
  });
  it("throws on invalid JSON", async () => {
    await expect(
      parseFileToText(Buffer.from("not json"), "application/json")
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test lib/parse/parse-file.test.ts
```
Expected: `Cannot find module './parse-file'`

- [ ] **Step 3: Implement**

```ts
// lib/parse/parse-file.ts
import mammoth from "mammoth";

// To add a new format: add its MIME type here, add a case in parseFileToText,
// and add the extension to ACCEPTED_EXTENSIONS in step-upload.tsx. Nothing else changes.
export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",     // .txt and .md (some browsers report .md as text/plain)
  "text/markdown",  // .md on browsers that send the correct MIME
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

export function isSupportedMimeType(mime: string): mime is SupportedMimeType {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mime);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// fileName is used to resolve ambiguity when the browser reports .md files as text/plain
export async function parseFileToText(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  const ext = fileName?.split(".").pop()?.toLowerCase();

  if (mimeType === "application/pdf" || ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default as (
      buf: Buffer
    ) => Promise<{ text: string }>;
    return (await pdfParse(buffer)).text.trim();
  }

  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  if (mimeType === "application/json" || ext === "json") {
    const parsed = JSON.parse(buffer.toString("utf-8"));
    return JSON.stringify(parsed, null, 2);
  }

  // text/plain, text/markdown, .txt, .md — all read as UTF-8 text
  return buffer.toString("utf-8").trim();
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
pnpm test lib/parse/parse-file.test.ts
```
Expected: all 8 tests pass.

- [ ] **Step 5: Commit**

```bash
git add lib/parse/parse-file.ts lib/parse/parse-file.test.ts
git commit -m "feat: add file parse utility (pdf, docx, txt)"
```

---

## Task 3: Server Actions

**Files:**
- Create: `app/actions/feedback-files.ts`
- Create: `app/actions/feedback-files.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
// app/actions/feedback-files.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSelect = vi.fn();
const mockSingle = vi.fn();
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
}));

// Chain returns
beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, single: mockSingle, order: mockOrder });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockSingle.mockResolvedValue({
    data: {
      id: "f1", project_id: "p1", file_name: "Pasted text",
      source_type: "Interview", content: "hello", storage_url: null,
      mime_type: null, input_method: "paste", word_count: 1, created_at: "2026-01-01",
    },
    error: null,
  });
});

const mockStorageRemove = vi.fn().mockResolvedValue({ error: null });
const mockStorageFrom = vi.fn(() => ({ remove: mockStorageRemove }));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }) },
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}));

vi.mock("@/lib/parse/parse-file", () => ({
  countWords: vi.fn().mockReturnValue(1),
  parseFileToText: vi.fn().mockResolvedValue("parsed"),
  isSupportedMimeType: vi.fn().mockReturnValue(true),
}));

import { pasteFeedbackText, getFeedbackFiles, deleteFeedbackBatch } from "./feedback-files";

describe("pasteFeedbackText", () => {
  it("inserts a feedback_files record and returns it", async () => {
    const result = await pasteFeedbackText({
      projectId: "p1",
      sourceType: "Interview",
      content: "some text",
    });
    expect(mockFrom).toHaveBeenCalledWith("feedback_files");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "p1",
        source_type: "Interview",
        input_method: "paste",
      })
    );
    expect(result.id).toBe("f1");
  });

  it("throws when content is empty", async () => {
    await expect(
      pasteFeedbackText({ projectId: "p1", sourceType: "X", content: "   " })
    ).rejects.toThrow("Content is required");
  });

  it("throws when sourceType is empty", async () => {
    await expect(
      pasteFeedbackText({ projectId: "p1", sourceType: "  ", content: "hi" })
    ).rejects.toThrow("Source label is required");
  });
});

describe("getFeedbackFiles", () => {
  it("queries feedback_files ordered by created_at desc", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const result = await getFeedbackFiles("p1");
    expect(mockFrom).toHaveBeenCalledWith("feedback_files");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual([]);
  });
});

describe("deleteFeedbackBatch", () => {
  it("deletes DB records and removes storage files", async () => {
    mockEq.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ storage_url: "projects/p1/file.pdf" }], error: null,
      }),
    });
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await deleteFeedbackBatch("p1", "Interview");
    expect(mockFrom).toHaveBeenCalledWith("feedback_files");
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test app/actions/feedback-files.test.ts
```
Expected: `Cannot find module './feedback-files'`

- [ ] **Step 3: Implement**

```ts
// app/actions/feedback-files.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import {
  parseFileToText,
  isSupportedMimeType,
  countWords,
  type SupportedMimeType,
} from "@/lib/parse/parse-file";
import type { FeedbackFile } from "@/lib/types/database";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

function sanitizeSourceLabel(raw: string): string {
  return raw.trim().replace(/[^a-zA-Z0-9 \-]/g, "").slice(0, 60);
}

export type UploadResult = {
  succeeded: FeedbackFile[];
  failed: { name: string; error: string }[];
};

export async function uploadFeedbackFiles(
  formData: FormData
): Promise<UploadResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const projectId = formData.get("project_id") as string;
  const sourceType = sanitizeSourceLabel(formData.get("source_type") as string);
  if (!sourceType) throw new Error("Source label is required");
  if (!projectId) throw new Error("Project ID is required");

  const files = formData.getAll("files") as File[];
  const succeeded: FeedbackFile[] = [];
  const failed: { name: string; error: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      failed.push({ name: file.name, error: "File exceeds 10 MB limit" });
      continue;
    }
    if (!isSupportedMimeType(file.type)) {
      failed.push({ name: file.name, error: "Unsupported file type" });
      continue;
    }
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const content = await parseFileToText(buffer, file.type, file.name);
      const storagePath = `projects/${projectId}/${crypto.randomUUID()}-${file.name}`;

      const { error: storageError } = await supabase.storage
        .from("feedback-uploads")
        .upload(storagePath, buffer, { contentType: file.type });

      if (storageError) {
        failed.push({ name: file.name, error: storageError.message });
        continue;
      }

      const { data: record, error: dbError } = await supabase
        .from("feedback_files")
        .insert({
          project_id: projectId,
          file_name: file.name,
          source_type: sourceType,
          content,
          storage_url: storagePath,
          mime_type: file.type,
          input_method: "upload",
          word_count: countWords(content),
        })
        .select()
        .single();

      if (dbError || !record) {
        failed.push({ name: file.name, error: dbError?.message ?? "DB insert failed" });
        continue;
      }
      succeeded.push(record as FeedbackFile);
    } catch (err) {
      failed.push({
        name: file.name,
        error: err instanceof Error ? err.message : "Parse failed",
      });
    }
  }

  return { succeeded, failed };
}

export async function pasteFeedbackText(data: {
  projectId: string;
  sourceType: string;
  content: string;
}): Promise<FeedbackFile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const sourceType = sanitizeSourceLabel(data.sourceType);
  const content = data.content.trim();
  if (!sourceType) throw new Error("Source label is required");
  if (!content) throw new Error("Content is required");

  const { data: record, error } = await supabase
    .from("feedback_files")
    .insert({
      project_id: data.projectId,
      file_name: "Pasted text",
      source_type: sourceType,
      content,
      storage_url: null,
      mime_type: null,
      input_method: "paste",
      word_count: countWords(content),
    })
    .select()
    .single();

  if (error || !record) throw new Error(error?.message ?? "Failed to save");
  return record as FeedbackFile;
}

export async function getFeedbackFiles(
  projectId: string
): Promise<FeedbackFile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("feedback_files")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as FeedbackFile[];
}

export async function deleteFeedbackBatch(
  projectId: string,
  sourceType: string
): Promise<void> {
  const supabase = await createClient();

  const { data: files } = await supabase
    .from("feedback_files")
    .select("storage_url")
    .eq("project_id", projectId)
    .eq("source_type", sourceType);

  const { error } = await supabase
    .from("feedback_files")
    .delete()
    .eq("project_id", projectId)
    .eq("source_type", sourceType);

  if (error) throw new Error(error.message);

  const paths = (files ?? [])
    .map((f) => f.storage_url)
    .filter((p): p is string => p !== null);

  if (paths.length > 0) {
    await supabase.storage.from("feedback-uploads").remove(paths);
  }
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
pnpm test app/actions/feedback-files.test.ts
```
Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/actions/feedback-files.ts app/actions/feedback-files.test.ts
git commit -m "feat: add feedback file server actions (upload, paste, list, delete)"
```

---

## Task 4: ScrollReveal Component

**Files:**
- Create: `components/ui/scroll-reveal.tsx`

- [ ] **Step 1: Implement**

```tsx
// components/ui/scroll-reveal.tsx
"use client";

import { useRef, useEffect, useState } from "react";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number; // ms
  className?: string;
}

export function ScrollReveal({ children, delay = 0, className }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay);
          observer.unobserve(el);
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{ duration: 0.65, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/ui/scroll-reveal.tsx
git commit -m "feat: add ScrollReveal component with IntersectionObserver"
```

---

## Task 5: BatchCard + LockedSection

**Files:**
- Create: `components/projects/workspace/batch-card.tsx`
- Create: `components/projects/workspace/batch-card.test.tsx`
- Create: `components/projects/workspace/locked-section.tsx`
- Create: `components/projects/workspace/locked-section.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// components/projects/workspace/batch-card.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { BatchCard, type BatchGroup } from "./batch-card";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, initial: _i, animate: _a, exit: _e,
            transition: _t, custom: _c, variants: _v, ...rest }: any) => (
      <div className={className} {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const batch: BatchGroup = {
  sourceLabel: "User Interview",
  files: [
    { id: "f1", project_id: "p1", file_name: "a.pdf", source_type: "User Interview",
      content: "", storage_url: null, mime_type: "application/pdf",
      input_method: "upload", word_count: 500, created_at: new Date().toISOString() },
    { id: "f2", project_id: "p1", file_name: "b.pdf", source_type: "User Interview",
      content: "", storage_url: null, mime_type: "application/pdf",
      input_method: "upload", word_count: 300, created_at: new Date().toISOString() },
  ],
  wordCount: 800,
  badge: "PDF",
};

describe("BatchCard", () => {
  it("renders source label", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
    expect(screen.getByText("User Interview")).toBeInTheDocument();
  });

  it("renders file count", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
    expect(screen.getByText(/2 files/i)).toBeInTheDocument();
  });

  it("renders word count", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={false} />);
    expect(screen.getByText(/800 words/i)).toBeInTheDocument();
  });

  it("calls onDelete when delete button clicked", () => {
    const onDelete = vi.fn();
    render(<BatchCard batch={batch} onDelete={onDelete} isDeleting={false} />);
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it("disables delete button while deleting", () => {
    render(<BatchCard batch={batch} onDelete={vi.fn()} isDeleting={true} />);
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });
});
```

```tsx
// components/projects/workspace/locked-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LockedSection } from "./locked-section";

describe("LockedSection", () => {
  it("renders title", () => {
    render(<LockedSection title="Themes" description="Run Analyze to unlock." />);
    expect(screen.getByText("Themes")).toBeInTheDocument();
  });
  it("renders description", () => {
    render(<LockedSection title="Themes" description="Run Analyze to unlock." />);
    expect(screen.getByText("Run Analyze to unlock.")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test components/projects/workspace/batch-card.test.tsx components/projects/workspace/locked-section.test.tsx
```

- [ ] **Step 3: Implement BatchCard**

```tsx
// components/projects/workspace/batch-card.tsx
import type { FeedbackFile } from "@/lib/types/database";
import { Trash2, FileText, Clipboard } from "lucide-react";

export type BatchGroup = {
  sourceLabel: string;
  files: FeedbackFile[];
  wordCount: number;
  badge: "PDF" | "TXT" | "DOCX" | "Paste" | "Mixed";
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
  const fileLabel = batch.files.length === 1 ? "1 file" : `${batch.files.length} files`;

  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 flex-shrink-0">
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
        className="flex items-center justify-center rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-error)] disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.7} />
      </button>
    </div>
  );
}
```

- [ ] **Step 4: Implement LockedSection**

```tsx
// components/projects/workspace/locked-section.tsx
import { Lock } from "lucide-react";

interface LockedSectionProps {
  title: string;
  description: string;
}

export function LockedSection({ title, description }: LockedSectionProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-6 py-8 text-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent, transparent 9px, hsl(220 12% 20% / 0.25) 9px, hsl(220 12% 20% / 0.25) 10px)",
      }}
    >
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-surface-1)] text-[var(--color-text-tertiary)]">
          <Lock size={17} strokeWidth={1.7} />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">{title}</p>
        <p className="max-w-sm text-xs leading-relaxed text-[var(--color-text-tertiary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run — verify PASS**

```bash
pnpm test components/projects/workspace/batch-card.test.tsx components/projects/workspace/locked-section.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add components/projects/workspace/batch-card.tsx components/projects/workspace/batch-card.test.tsx components/projects/workspace/locked-section.tsx components/projects/workspace/locked-section.test.tsx
git commit -m "feat: add BatchCard and LockedSection workspace components"
```

---

## Task 6: InputsSection

**Files:**
- Create: `components/projects/workspace/inputs-section.tsx`
- Create: `components/projects/workspace/inputs-section.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/projects/workspace/inputs-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InputsSection } from "./inputs-section";
import type { FeedbackFile } from "@/lib/types/database";

vi.mock("next/navigation", () => ({
  Link: ({ href, children, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

vi.mock("@/app/actions/feedback-files", () => ({
  deleteFeedbackBatch: vi.fn().mockResolvedValue(undefined),
}));

const makeFile = (id: string, label: string): FeedbackFile => ({
  id, project_id: "p1", file_name: "a.pdf", source_type: label,
  content: "x", storage_url: null, mime_type: "application/pdf",
  input_method: "upload", word_count: 100, created_at: new Date().toISOString(),
});

describe("InputsSection", () => {
  it("renders each batch group label", () => {
    const files = [makeFile("f1", "Interview"), makeFile("f2", "Survey")];
    render(<InputsSection files={files} projectId="p1" />);
    expect(screen.getByText("Interview")).toBeInTheDocument();
    expect(screen.getByText("Survey")).toBeInTheDocument();
  });

  it("renders Add more inputs link pointing to /projects/p1/add", () => {
    render(<InputsSection files={[makeFile("f1", "Interview")]} projectId="p1" />);
    expect(screen.getByRole("link", { name: /add more inputs/i })).toHaveAttribute(
      "href",
      "/projects/p1/add"
    );
  });

  it("renders empty message when no files", () => {
    render(<InputsSection files={[]} projectId="p1" />);
    expect(screen.getByText(/no inputs yet/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test components/projects/workspace/inputs-section.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// components/projects/workspace/inputs-section.tsx
"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { FeedbackFile } from "@/lib/types/database";
import { deleteFeedbackBatch } from "@/app/actions/feedback-files";
import { BatchCard, type BatchGroup } from "./batch-card";

function groupFilesByLabel(files: FeedbackFile[]): BatchGroup[] {
  const map = new Map<string, FeedbackFile[]>();
  for (const f of files) {
    map.set(f.source_type, [...(map.get(f.source_type) ?? []), f]);
  }
  return Array.from(map.entries())
    .map(([sourceLabel, groupFiles]) => {
      const wordCount = groupFiles.reduce((s, f) => s + (f.word_count ?? 0), 0);
      const allPaste = groupFiles.every((f) => f.input_method === "paste");
      const allPdf = groupFiles.every((f) => f.mime_type === "application/pdf");
      const allTxt = groupFiles.every((f) => f.mime_type === "text/plain");
      const allDocx = groupFiles.every(
        (f) =>
          f.mime_type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      const badge: BatchGroup["badge"] = allPaste
        ? "Paste"
        : allPdf ? "PDF"
        : allTxt ? "TXT"
        : allDocx ? "DOCX"
        : "Mixed";
      return { sourceLabel, files: groupFiles, wordCount, badge };
    })
    .sort((a, b) => {
      const latest = (g: BatchGroup) =>
        g.files.reduce((max, f) => (f.created_at > max ? f.created_at : max), g.files[0].created_at);
      return latest(b).localeCompare(latest(a));
    });
}

interface InputsSectionProps {
  files: FeedbackFile[];
  projectId: string;
}

export function InputsSection({ files, projectId }: InputsSectionProps) {
  const [localFiles, setLocalFiles] = useState(files);
  const [isPending, startTransition] = useTransition();
  const batches = groupFilesByLabel(localFiles);

  const handleDelete = (sourceLabel: string) => {
    startTransition(async () => {
      await deleteFeedbackBatch(projectId, sourceLabel);
      setLocalFiles((prev) => prev.filter((f) => f.source_type !== sourceLabel));
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {batches.length === 0 ? (
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
          {batches.map((batch) => (
            <BatchCard
              key={batch.sourceLabel}
              batch={batch}
              onDelete={() => handleDelete(batch.sourceLabel)}
              isDeleting={isPending}
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
          <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            Upload files or paste text
          </div>
        </div>
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
pnpm test components/projects/workspace/inputs-section.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/inputs-section.tsx components/projects/workspace/inputs-section.test.tsx
git commit -m "feat: add InputsSection with batch grouping and delete"
```

---

## Task 7: StepTypeSelect

**Files:**
- Create: `components/projects/inputs/step-type-select.tsx`
- Create: `components/projects/inputs/step-type-select.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/projects/inputs/step-type-select.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepTypeSelect } from "./step-type-select";

describe("StepTypeSelect", () => {
  it("renders both method tiles", () => {
    render(<StepTypeSelect value={null} onChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByText("Upload files")).toBeInTheDocument();
    expect(screen.getByText("Paste text")).toBeInTheDocument();
  });

  it("Next button is disabled when no method selected", () => {
    render(<StepTypeSelect value={null} onChange={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByRole("button", { name: /next/i })).toBeDisabled();
  });

  it("calls onChange with 'upload' when Upload tile is clicked", () => {
    const onChange = vi.fn();
    render(<StepTypeSelect value={null} onChange={onChange} onNext={vi.fn()} />);
    fireEvent.click(screen.getByText("Upload files").closest("button")!);
    expect(onChange).toHaveBeenCalledWith("upload");
  });

  it("calls onChange with 'paste' when Paste tile is clicked", () => {
    const onChange = vi.fn();
    render(<StepTypeSelect value={null} onChange={onChange} onNext={vi.fn()} />);
    fireEvent.click(screen.getByText("Paste text").closest("button")!);
    expect(onChange).toHaveBeenCalledWith("paste");
  });

  it("calls onNext when Next is clicked with a selection", () => {
    const onNext = vi.fn();
    render(<StepTypeSelect value="upload" onChange={vi.fn()} onNext={onNext} />);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    expect(onNext).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test components/projects/inputs/step-type-select.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// components/projects/inputs/step-type-select.tsx
import { UploadCloud, Clipboard } from "lucide-react";
import { Button } from "@/components/ui/button";

// To add a new file format: update ACCEPTED_EXTENSIONS in step-upload.tsx and
// add a parser in lib/parse/parse-file.ts. Do NOT add tiles here.
export const INPUT_TYPES = [
  {
    id: "upload" as const,
    label: "Upload files",
    description: "PDF, DOCX, TXT, MD, JSON",
    icon: UploadCloud,
  },
  {
    id: "paste" as const,
    label: "Paste text",
    description: "copy / paste",
    icon: Clipboard,
  },
] as const;

export type InputTypeId = (typeof INPUT_TYPES)[number]["id"];

interface StepTypeSelectProps {
  value: InputTypeId | null;
  onChange: (type: InputTypeId) => void;
  onNext: () => void;
}

export function StepTypeSelect({ value, onChange, onNext }: StepTypeSelectProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Choose input method
        </p>
        <div className="grid grid-cols-2 gap-2">
          {INPUT_TYPES.map(({ id, label, description, icon: Icon }) => {
            const selected = value === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => onChange(id)}
                className={[
                  "flex flex-col items-center gap-2 rounded-[var(--radius-md)] border px-3 py-5 transition-all",
                  selected
                    ? "border-[var(--color-accent-primary)] bg-[var(--color-accent-primary)]/10"
                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-surface-2)]",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex h-10 w-10 items-center justify-center rounded-[10px]",
                    selected
                      ? "bg-[var(--color-accent-primary)]/15 text-[var(--color-accent-primary)]"
                      : "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)]",
                  ].join(" ")}
                >
                  <Icon size={19} strokeWidth={1.6} />
                </div>
                <span className="text-[13px] font-medium text-[var(--color-text-primary)]">
                  {label}
                </span>
                <span className="text-[11px] text-[var(--color-text-tertiary)]">{description}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex justify-end">
        <Button size="sm" disabled={!value} onClick={onNext}>
          Next
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
pnpm test components/projects/inputs/step-type-select.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/projects/inputs/step-type-select.tsx components/projects/inputs/step-type-select.test.tsx
git commit -m "feat: add StepTypeSelect component"
```

---

## Task 8: StepUpload + StepPaste

**Files:**
- Create: `components/projects/inputs/step-upload.tsx`
- Create: `components/projects/inputs/step-upload.test.tsx`
- Create: `components/projects/inputs/step-paste.tsx`
- Create: `components/projects/inputs/step-paste.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// components/projects/inputs/step-upload.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepUpload } from "./step-upload";

vi.mock("motion/react", () => ({
  motion: {
    button: ({ children, className, whileHover: _wh, whileTap: _wt, transition: _tr, ...rest }: any) => (
      <button className={className} {...rest}>{children}</button>
    ),
  },
}));

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
    expect(screen.getByPlaceholderText(/interview|ticket|survey/i)).toBeInTheDocument();
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
});
```

```tsx
// components/projects/inputs/step-paste.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StepPaste } from "./step-paste";

vi.mock("motion/react", () => ({
  motion: {
    button: ({ children, className, whileHover: _wh, whileTap: _wt, transition: _tr, ...rest }: any) => (
      <button className={className} {...rest}>{children}</button>
    ),
  },
}));

const baseProps = {
  content: "",
  onContentChange: vi.fn(),
  sourceLabel: "",
  onSourceLabelChange: vi.fn(),
  sourceLabelError: null,
  onBack: vi.fn(),
  onSubmit: vi.fn(),
  isSubmitting: false,
};

describe("StepPaste", () => {
  it("renders textarea", () => {
    render(<StepPaste {...baseProps} />);
    expect(screen.getByRole("textbox", { name: /paste/i })).toBeInTheDocument();
  });

  it("Submit is disabled when content is empty", () => {
    render(<StepPaste {...baseProps} content="" />);
    expect(screen.getByRole("button", { name: /submit/i })).toBeDisabled();
  });

  it("calls onBack when Back is clicked", () => {
    render(<StepPaste {...baseProps} />);
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test components/projects/inputs/step-upload.test.tsx components/projects/inputs/step-paste.test.tsx
```

- [ ] **Step 3: Implement StepUpload**

```tsx
// components/projects/inputs/step-upload.tsx
import { useRef } from "react";
import { UploadCloud, ArrowLeft } from "lucide-react";
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
  if (!/^[a-zA-Z0-9 \-]+$/.test(t)) return "Only letters, numbers, spaces, and hyphens";
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
  const accept = ACCEPTED_EXTENSIONS;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...dropped]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    onFilesChange([...files, ...selected]);
  };

  const canSubmit = files.length > 0 && !isSubmitting;

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
          className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/5 px-5 py-7 text-center transition-colors hover:border-[var(--color-accent-primary)]/50 hover:bg-[var(--color-accent-primary)]/8"
        >
          <UploadCloud size={28} strokeWidth={1.5} className="text-[var(--color-accent-primary)]" />
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            Multiple files · Max 10 MB each
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={accept}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
        {files.length > 0 && (
          <p className="mt-1.5 text-[11px] text-[var(--color-text-secondary)]">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
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
          <p className="mt-1 text-[11px] text-[var(--color-error)]">{sourceLabelError}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} type="button">
          <ArrowLeft size={14} />
          Back
        </Button>
        <Button size="sm" disabled={!canSubmit} onClick={onSubmit} type="button">
          Submit batch
        </Button>
      </div>
    </div>
  );
}

export { validateSourceLabel };
```

- [ ] **Step 4: Implement StepPaste**

```tsx
// components/projects/inputs/step-paste.tsx
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateSourceLabel } from "./step-upload";

interface StepPasteProps {
  content: string;
  onContentChange: (v: string) => void;
  sourceLabel: string;
  onSourceLabelChange: (v: string) => void;
  sourceLabelError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepPaste({
  content,
  onContentChange,
  sourceLabel,
  onSourceLabelChange,
  sourceLabelError,
  onBack,
  onSubmit,
  isSubmitting,
}: StepPasteProps) {
  const canSubmit = content.trim().length > 0 && !isSubmitting;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Paste text
        </p>
        <textarea
          aria-label="Paste your feedback text"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Paste your feedback, interview transcript, support ticket, or any raw text here…"
          rows={6}
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-primary)]/50 focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
        />
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
          <p className="mt-1 text-[11px] text-[var(--color-error)]">{sourceLabelError}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} type="button">
          <ArrowLeft size={14} />
          Back
        </Button>
        <Button size="sm" disabled={!canSubmit} onClick={onSubmit} type="button">
          Submit batch
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Run — verify PASS**

```bash
pnpm test components/projects/inputs/step-upload.test.tsx components/projects/inputs/step-paste.test.tsx
```

- [ ] **Step 6: Commit**

```bash
git add components/projects/inputs/step-upload.tsx components/projects/inputs/step-upload.test.tsx components/projects/inputs/step-paste.tsx components/projects/inputs/step-paste.test.tsx
git commit -m "feat: add StepUpload and StepPaste form step components"
```

---

## Task 9: AddInputForm (Multi-Step Shell)

**Files:**
- Create: `components/projects/inputs/add-input-form.tsx`
- Create: `components/projects/inputs/add-input-form.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
// components/projects/inputs/add-input-form.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddInputForm } from "./add-input-form";

vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, className, initial: _i, animate: _a, exit: _e,
            transition: _t, custom: _c, variants: _v, ...rest }: any) => (
      <div className={className} {...rest}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@/app/actions/feedback-files", () => ({
  uploadFeedbackFiles: vi.fn().mockResolvedValue({ succeeded: [{ id: "f1" }], failed: [] }),
  pasteFeedbackText: vi.fn().mockResolvedValue({ id: "f2" }),
}));

describe("AddInputForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders step 1 on load with both type tiles", () => {
    render(<AddInputForm projectId="p1" />);
    expect(screen.getByText("Upload files")).toBeInTheDocument();
    expect(screen.getByText("Paste text")).toBeInTheDocument();
  });

  it("advances to step 2 after selecting upload and clicking Next", async () => {
    render(<AddInputForm projectId="p1" />);
    fireEvent.click(screen.getByText("Upload files").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() =>
      expect(screen.getByText(/drag & drop/i)).toBeInTheDocument()
    );
  });

  it("shows paste textarea when Paste text type selected", async () => {
    render(<AddInputForm projectId="p1" />);
    fireEvent.click(screen.getByText("Paste text").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /paste/i })).toBeInTheDocument()
    );
  });

  it("goes back to step 1 when Back is clicked", async () => {
    render(<AddInputForm projectId="p1" />);
    fireEvent.click(screen.getByText("Upload files").closest("button")!);
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    await waitFor(() => screen.getByText(/drag & drop/i));
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    await waitFor(() => expect(screen.getByText("Upload files")).toBeInTheDocument());
  });
});
```

- [ ] **Step 2: Run — verify FAIL**

```bash
pnpm test components/projects/inputs/add-input-form.test.tsx
```

- [ ] **Step 3: Implement**

```tsx
// components/projects/inputs/add-input-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2, Zap, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StepTypeSelect, type InputTypeId } from "./step-type-select";
import { StepUpload, validateSourceLabel } from "./step-upload";
import { StepPaste } from "./step-paste";
import {
  uploadFeedbackFiles,
  pasteFeedbackText,
  type UploadResult,
} from "@/app/actions/feedback-files";

const EASE = [0.22, 1, 0.36, 1] as const;

const stepVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 40 : -40, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -40 : 40, opacity: 0 }),
};

interface AddInputFormProps {
  projectId: string;
}

export function AddInputForm({ projectId }: AddInputFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [direction, setDirection] = useState(1);
  const [selectedType, setSelectedType] = useState<InputTypeId | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [pasteContent, setPasteContent] = useState("");
  const [sourceLabel, setSourceLabel] = useState("");
  const [sourceLabelError, setSourceLabelError] = useState<string | null>(null);
  const [submitResult, setSubmitResult] = useState<UploadResult | null>(null);
  const [isPending, startTransition] = useTransition();

  const goToStep2 = () => {
    setDirection(1);
    setStep(2);
  };

  const goToStep1 = () => {
    setDirection(-1);
    setStep(1);
  };

  const resetForm = () => {
    setStep(1);
    setDirection(1);
    setSelectedType(null);
    setFiles([]);
    setPasteContent("");
    setSourceLabel("");
    setSourceLabelError(null);
    setSubmitResult(null);
  };

  const handleSubmit = () => {
    const err = validateSourceLabel(sourceLabel);
    if (err) { setSourceLabelError(err); return; }
    setSourceLabelError(null);

    startTransition(async () => {
      if (selectedType === "paste") {
        const record = await pasteFeedbackText({
          projectId,
          sourceType: sourceLabel,
          content: pasteContent,
        });
        setSubmitResult({ succeeded: [record], failed: [] });
      } else {
        const formData = new FormData();
        formData.append("project_id", projectId);
        formData.append("source_type", sourceLabel);
        files.forEach((f) => formData.append("files", f));
        const result = await uploadFeedbackFiles(formData);
        setSubmitResult(result);
      }
    });
  };

  // Success state
  if (submitResult) {
    const count = submitResult.succeeded.length;
    return (
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[hsl(150_55%_42%/0.25)] bg-[hsl(150_55%_42%/0.08)] px-4 py-3.5">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-[hsl(150,55%,42%)]" strokeWidth={2} />
            <div>
              <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
                {count} {count === 1 ? "item" : "items"} added under &ldquo;{sourceLabel}&rdquo;
              </p>
              <p className="mt-0.5 text-[11px] text-[var(--color-text-tertiary)]">
                Parsed and ready for analysis
              </p>
              {submitResult.failed.length > 0 && (
                <p className="mt-1 text-[11px] text-[var(--color-error)]">
                  {submitResult.failed.length} file(s) failed:{" "}
                  {submitResult.failed.map((f) => f.name).join(", ")}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={resetForm} type="button">
              <Plus size={13} />
              Add more
            </Button>
            <Button
              size="sm"
              onClick={() => router.push(`/projects/${projectId}`)}
              type="button"
            >
              <Zap size={13} />
              Analyze
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]">
      {/* Card header */}
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="text-[13px] font-semibold tracking-[0.01em] text-[var(--color-text-primary)]">
          Add Feedback{selectedType && step === 2 ? ` · ${selectedType.toUpperCase()}` : ""}
        </p>
        <div className="flex gap-1.5">
          {[1, 2].map((s) => (
            <span
              key={s}
              className={[
                "h-1.5 w-1.5 rounded-full transition-all",
                step === s
                  ? "bg-[var(--color-accent-primary)]"
                  : step > s
                  ? "bg-[var(--color-accent-primary)]/35"
                  : "bg-[var(--color-surface-2)]",
              ].join(" ")}
            />
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="overflow-hidden px-5 pb-5 pt-4">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "tween", duration: 0.32, ease: EASE }}
          >
            {step === 1 ? (
              <StepTypeSelect
                value={selectedType}
                onChange={setSelectedType}
                onNext={goToStep2}
              />
            ) : selectedType === "paste" ? (
              <StepPaste
                content={pasteContent}
                onContentChange={setPasteContent}
                sourceLabel={sourceLabel}
                onSourceLabelChange={setSourceLabel}
                sourceLabelError={sourceLabelError}
                onBack={goToStep1}
                onSubmit={handleSubmit}
                isSubmitting={isPending}
              />
            ) : (
              <StepUpload
                files={files}
                onFilesChange={setFiles}
                sourceLabel={sourceLabel}
                onSourceLabelChange={setSourceLabel}
                sourceLabelError={sourceLabelError}
                onBack={goToStep1}
                onSubmit={handleSubmit}
                isSubmitting={isPending}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — verify PASS**

```bash
pnpm test components/projects/inputs/add-input-form.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add components/projects/inputs/add-input-form.tsx components/projects/inputs/add-input-form.test.tsx
git commit -m "feat: add multi-step AddInputForm with AnimatePresence transitions"
```

---

## Task 10: Add Inputs Page Route

**Files:**
- Create: `app/(app)/projects/[id]/add/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(app)/projects/[id]/add/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AddInputForm } from "@/components/projects/inputs/add-input-form";
import type { Project } from "@/lib/types/database";

export default async function AddInputsPage({
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
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-[13px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          {p.name}
        </Link>
      </div>

      <h1 className="mb-6 text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
        Add Feedback
      </h1>

      <AddInputForm projectId={id} />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/projects/\[id\]/add/page.tsx
git commit -m "feat: add /projects/[id]/add route"
```

---

## Task 11: Workspace Page Refactor

**Files:**
- Modify: `app/(app)/projects/[id]/page.tsx`

- [ ] **Step 1: Implement**

```tsx
// app/(app)/projects/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Search, Star, Plus, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { InputsSection } from "@/components/projects/workspace/inputs-section";
import { LockedSection } from "@/components/projects/workspace/locked-section";
import { getFeedbackFiles } from "@/app/actions/feedback-files";
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
  const feedbackFiles = await getFeedbackFiles(id);
  const hasInputs = feedbackFiles.length > 0;

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
              { label: "Themes", value: "—" },
              { label: "Proposals", value: "—" },
            ].map(({ label, value }, i, arr) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span className="text-[17px] font-semibold text-[var(--color-text-primary)]">
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
          <Button variant="secondary" size="sm" asChild>
            <Link href={`/projects/${id}/add`}>
              <Plus size={13} />
              Add inputs
            </Link>
          </Button>
          <Button
            size="sm"
            disabled={!hasInputs}
            title={!hasInputs ? "Add at least one labeled input" : undefined}
          >
            <Zap size={13} />
            Analyze
          </Button>
        </div>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Inputs section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={15} strokeWidth={1.8} className="text-[var(--color-text-secondary)]" />
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
          <InputsSection files={feedbackFiles} projectId={id} />
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Themes section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center gap-2">
            <Search size={15} strokeWidth={1.8} className="text-[var(--color-text-tertiary)]" />
            <span className="text-[14px] font-semibold text-[var(--color-text-tertiary)]">
              Themes
            </span>
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
              Unlocks after Analyze
            </span>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <LockedSection
            title="Themes unlock after analysis"
            description="Run Analyze to surface recurring themes and supporting quotes from your inputs."
          />
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Proposals section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center gap-2">
            <Star size={15} strokeWidth={1.8} className="text-[var(--color-text-tertiary)]" />
            <span className="text-[14px] font-semibold text-[var(--color-text-tertiary)]">
              Proposals
            </span>
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
              Unlocks after Analyze
            </span>
          </div>
        </ScrollReveal>
        <ScrollReveal delay={100}>
          <LockedSection
            title="Proposals unlock after analysis"
            description="Feature proposals are generated automatically from surfaced themes and evidence."
          />
        </ScrollReveal>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/\(app\)/projects/\[id\]/page.tsx
git commit -m "feat: refactor project workspace as hub page with scroll-animated sections"
```

---

## Task 12: Final Validation

- [ ] **Step 1: Run all tests**

```bash
pnpm test
```
Expected: all tests pass (29 existing + new tests).

- [ ] **Step 2: Typecheck**

```bash
pnpm typecheck
```
Expected: no errors.

- [ ] **Step 3: Lint**

```bash
pnpm lint
```
Expected: no errors.

- [ ] **Step 4: Smoke-test locally**

```bash
pnpm dev
```

1. Navigate to a project — should see the workspace hub with Inputs / Themes / Proposals sections
2. Scroll down — sections should animate in smoothly
3. Click "Add inputs" — navigates to `/projects/[id]/add`
4. Select PDF → Next → upload a file → enter source label → Submit
5. Success banner appears with file count and source label
6. Click "Analyze" → redirects back to workspace
7. Workspace shows the submitted batch in the Inputs section
8. Analyze button is now enabled (has inputs)

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete Plan 4 — input ingestion, parsing, and workspace hub"
```
