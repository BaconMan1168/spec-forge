# Plan 4 — Input Ingestion & Parsing: Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Scope:** Project workspace shell + input form route + file parsing + Supabase storage

---

## Overview

Plan 4 introduces two things:

1. **Project Workspace page** (`/projects/[id]`) — a full project hub showing inputs, themes, and proposals in scrollable sections with IntersectionObserver reveal animations. Themes and proposals are locked/empty until Plan 5 runs analysis.
2. **Add Inputs page** (`/projects/[id]/add`) — a multi-step animated form for uploading files or pasting text, with a source label per batch.

---

## Routing

| Route | Purpose |
|---|---|
| `/projects/[id]` | Workspace overview (hub page) |
| `/projects/[id]/add` | Multi-step input ingestion form |

Navigation: "Add inputs" button and the dashed "Add more" row on the workspace page both navigate to `/projects/[id]/add`. After successful submission, the user is redirected back to `/projects/[id]`.

---

## Workspace Page (`/projects/[id]`)

### Layout

- **Sticky nav** — glassmorphic blur, project breadcrumb
- **Page header** — project name, live stat pills (inputs / themes / proposals count), "Add inputs" + "Analyze" action buttons
- **Inputs section** — scrollable container (max-height ~3 cards visible), batch cards with source label, file count, word count, timestamp, and delete button. Dashed "Add more" row at bottom.
- **Themes section** — locked card with diagonal stripe pattern (unlocks after Analyze, Plan 5)
- **Proposals section** — locked card with diagonal stripe pattern (unlocks after Analyze, Plan 6)

### Scroll Animations

- IntersectionObserver on each section
- Section **header** reveals first (`opacity 0→1`, `translateY 24px→0`, `0.65s cubic-bezier(0.22,1,0.36,1)`)
- Section **content** follows with `80–160ms` delay
- Easing: design system standard `cubic-bezier(0.22, 1, 0.36, 1)`
- Threshold: `0.08`, rootMargin: `0px 0px -40px 0px`

### Inputs Container

- Fixed max-height showing ~3 batch cards
- Internal scroll, `scrollbar-width: thin`
- Fade mask via `mask-image` gradient at top and bottom edges to indicate scrollability
- Shows the 3 most recent batches at the top; older ones accessible by scrolling

### Analyze Button

- Enabled when `feedbackFiles.length >= 1` for the project
- Disabled state: muted color, `cursor: not-allowed`, tooltip: "Add at least one labeled input"
- Enabled state: accent border + accent text, hover lifts with design system shadow

### Button Animations

- All buttons use existing site hover patterns: sourced via **shadcn UI MCP**, **magicui MCP**, and **21st.dev MCP**
- No custom one-off hover styles — reuse site-wide button components

---

## Add Inputs Page (`/projects/[id]/add`)

### Multi-Step Form

Built using the **21st.dev multi-step form pattern** with `framer-motion` `AnimatePresence` for step transitions.

#### Step 1 — Choose Input Method

- 2-tile selector: **"Upload files"** / **"Paste text"**
- Tiles: icon + label + supported formats hint
- Selected tile: accent border + accent-dim background
- "Next →" button advances to Step 2

**Extensibility:** Adding a new file format requires zero UI changes. Only `lib/parse/parse-file.ts` (new parser case) and the dropzone `accept` string need updating. The Step 1 tiles remain unchanged.

#### Step 2 — Upload or Paste + Source Label

**If "Upload files" selected:**
- Dropzone: dashed accent border, upload cloud icon, "Drag & drop here or click to browse", "Multiple files · Max 10MB each"
- Accepts: `.pdf`, `.docx`, `.txt`, `.md`, `.json` (all in one dropzone, no per-format selection)
- Helper text lists all accepted formats so users know what to drop
- Accepts multiple files in one batch

**If "Paste text" selected:**
- Textarea: dark surface, placeholder text
- Single text entry per batch submission

**Both variants include:**
- Source label free-text input (below the upload/paste area)
- Validation: required, max 60 chars, alphanumeric + spaces + hyphens only, sanitized on server
- "← Back" ghost button returns to Step 1 with reverse animation
- "Submit batch" primary button triggers server action

#### Step Transitions

- Forward: content slides left-out, new content slides in from right (`x: 40 → 0`)
- Backward: content slides right-out, new content slides in from left (`x: -40 → 0`)
- Duration: `320ms`, easing: `cubic-bezier(0.22, 1, 0.36, 1)`
- Step indicator dots animate state changes

#### Post-Submit State (Option B)

After successful submission, the form shows a success banner:
- Green-tinted card: checkmark icon + "N files added under '[label]'"
- Sub-text: "Parsed and ready for analysis"
- "Add more" ghost button resets form to Step 1
- "Analyze →" accent button navigates to `/projects/[id]` (workspace) where the Analyze action can be triggered

---

## Data Model (No Schema Changes)

Uses existing `feedback_files` table as-is (Option B from approach selection):

```typescript
FeedbackFile {
  id: string
  project_id: string
  file_name: string
  source_type: string        // source label — same value for all files in a batch
  content: string            // parsed UTF-8 plain text
  storage_url: string | null // Supabase Storage URL for original file
  mime_type: string | null
  input_method: "upload" | "paste"
  word_count: number | null
  created_at: string
}
```

Files submitted in the same batch share the same `source_type` value. Grouping is UI-side only.

---

## Server Actions

### `uploadFeedbackFiles(formData: FormData)`

1. Extract files array + `source_type` + `project_id` from formData
2. Validate: file type whitelist (`.pdf`, `.docx`, `.txt`, `.md`, `.json`), max 10MB per file
3. Validate `source_type`: required, max 60 chars, strip non-alphanumeric except spaces/hyphens
4. For each file:
   a. Upload original to Supabase Storage: `feedback-uploads/projects/{projectId}/{uuid}-{filename}`
   b. Parse to UTF-8 text: `pdf-parse` for PDF, `mammoth` for DOCX, native UTF-8 read for TXT/MD, `JSON.stringify(parsed, null, 2)` for JSON
   c. Insert `FeedbackFile` record with parsed content + word count + storage URL
   d. On parse failure: record error, continue processing remaining files
5. Return `{ succeeded: FeedbackFile[], failed: { name: string, error: string }[] }`

### `pasteFeedbackText(data: { projectId, sourceType, content })`

1. Validate `sourceType` and `content` (required, non-empty)
2. Insert `FeedbackFile` with `input_method: "paste"`, `storage_url: null`, `mime_type: null`
3. Calculate word count from content string
4. Return inserted record

### `getFeedbackFiles(projectId: string)`

- Fetch all `FeedbackFile` records for project, ordered by `created_at DESC`
- Used by workspace page to populate inputs section + stats

### `deleteFeedbackFile(fileId: string)`

- Delete record from DB
- Delete original file from Supabase Storage if `storage_url` is set

---

## File Parsing

| Extension | MIME type(s) | Library | Notes |
|---|---|---|---|
| `.pdf` | `application/pdf` | `pdf-parse` (installed) | Extract `.text` field |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` | `mammoth` (installed) | `extractRawText()` |
| `.txt` | `text/plain` | Native `Buffer.toString('utf-8')` | Direct UTF-8 read |
| `.md` | `text/markdown`, `text/plain` | Native `Buffer.toString('utf-8')` | Markdown is plain text; parser is identical to .txt |
| `.json` | `application/json` | Native `JSON.parse` + `JSON.stringify` | Parsed then pretty-printed for readability |

**Adding a new format:** add an entry to `SUPPORTED_MIME_TYPES` in `lib/parse/parse-file.ts`, add a parser case in `parseFileToText`, and add the extension to the dropzone `accept` string in `step-upload.tsx`. No other files change.

Parse errors per file are caught individually — one failure does not abort the batch.

---

## Validation & Error Handling

- **Client-side:** File extension check before upload (whitelist: `.pdf`, `.docx`, `.txt`, `.md`, `.json`), file size check (<10MB), source label required before submit
- **Server-side:** Re-validate type + size, sanitize source label, catch per-file parse errors
- **UI:** Per-file error list shown in post-submit state for any failed files; succeeded files still displayed

---

## Component Structure

```
app/
  (app)/
    projects/
      [id]/
        page.tsx              ← Workspace overview (refactored)
        add/
          page.tsx            ← Multi-step input form
components/
  projects/
    workspace/
      workspace-page.tsx      ← Page shell + stats header
      inputs-section.tsx      ← Scrollable batch list
      batch-card.tsx          ← Individual batch row
      locked-section.tsx      ← Reusable locked placeholder
    inputs/
      add-input-form.tsx      ← Multi-step form (framer-motion)
      step-type-select.tsx    ← Step 1: Upload / Paste tiles (2 options)
      step-upload.tsx         ← Step 2a: dropzone (all supported formats)
      step-paste.tsx          ← Step 2b: textarea
app/
  actions/
    feedback-files.ts         ← Server actions (upload, paste, list, delete)
lib/
  parse/
    parse-file.ts             ← File parsing registry (pdf, docx, txt, md, json)
```

---

## UI Implementation Requirements

- **Components:** sourced from **shadcn UI MCP** first, then **magicui MCP** for animated variants, then **21st.dev MCP** for additional patterns
- **Animations:** `framer-motion` for step transitions; `AnimatePresence` for mount/unmount; IntersectionObserver for scroll reveals
- **Hover states:** use existing site button components — no new one-off hover styles
- **Design tokens:** strictly from `docs/product/design-system.md` — no invented values
- **Frontend implementation:** follow **frontend-design skill** for all UI work

---

## Out of Scope (Plan 4)

- AI analysis (Plan 5)
- Theme/proposal rendering (Plan 6)
- Export (Plan 7)
- Batch-level DB concept (may be introduced in a later plan if needed)
