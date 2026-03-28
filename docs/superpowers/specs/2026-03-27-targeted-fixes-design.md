# Targeted Fixes Design — 2026-03-27

## Scope

Eight targeted fixes across UI/UX, PDF upload, and design system consistency.
No refactors of unrelated code.

---

## 1. Design System — cursor-pointer rule

**File:** `docs/product/design-system.md`

Add a general interactive-element rule to §7 (Component Rules):

> All interactive non-button elements (cards acting as buttons, icon buttons, clickable list rows, etc.) must use `cursor: pointer`. This extends the existing button cursor rule to all clickable surfaces.

---

## 2. PDF Upload — Next.js body size limit

**File:** `next.config.ts`

Add `experimental.serverActions.bodySizeLimit: '20mb'` to lift the default 1MB cap.

```ts
const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
};
```

The server action (`feedback-files.ts`) already validates per-file size at 10MB — no action logic changes needed.

---

## 3. cursor-pointer on trash icon

**File:** `components/projects/workspace/batch-card.tsx`

Add `cursor-pointer` to the trash `<button>` className.

---

## 4. cursor-pointer on input method cards

**File:** `components/projects/inputs/step-type-select.tsx`

Add `cursor-pointer` to each `<button>` in the card grid.

---

## 5. Success card text fix

**File:** `components/projects/inputs/add-input-form.tsx`

Replace JSX expression that renders `{count} {count === 1 ? "item" : "items"} added` with an explicit string to guarantee space is not dropped:

```tsx
{`${count} ${count === 1 ? "item" : "items"} added under`}
```

---

## 6. Input card hover animation

**File:** `components/projects/workspace/batch-card.tsx`

Add §8.7-compliant hover animation to the card wrapper div with **500ms duration** (user-specified, overriding the 320ms default):

```
transition-[transform,box-shadow,border-color]
duration-[500ms]
[transition-timing-function:cubic-bezier(0.22,1,0.36,1)]
hover:-translate-y-0.5
hover:scale-[1.02]
hover:shadow-[var(--shadow-3)]
hover:border-[var(--color-border-strong)]
```

Three-property simultaneous animation: transform + shadow + border.

---

## 7. Clipboard inputs — copy + detail page

### BatchCard changes
**File:** `components/projects/workspace/batch-card.tsx`

- Accept new prop `projectId: string`
- For paste batches (`batch.badge === "Paste"`): wrap card in `<Link>` to `/projects/[id]/inputs/[sourceType]` (URL-encoded source type)
- Clipboard icon: `onClick` with `e.stopPropagation()` + `navigator.clipboard.writeText(concatenated content)`
- Card has `cursor-pointer` when it's a paste batch link

### InputsSection changes
**File:** `components/projects/workspace/inputs-section.tsx`

- Thread `projectId` prop down to `<BatchCard>`

### New detail page
**File:** `app/(app)/projects/[id]/inputs/[sourceType]/page.tsx`

- Server component
- Fetches `feedback_files` WHERE `project_id = id AND source_type = decoded(sourceType) AND input_method = 'paste'`
- Back link to `/projects/[id]`
- Source label as heading
- Scrollable full-text content area (all files concatenated with separator)
- Shows word count and created date

### Skeleton loading
**File:** `app/(app)/projects/[id]/inputs/[sourceType]/loading.tsx`

- Skeleton for heading, metadata, and content area
- Uses existing `<Skeleton>` component pattern

---

## 8. File input UX — collapsible file list

**File:** `components/projects/inputs/step-upload.tsx`

Replace the "N files selected" text with a collapsible disclosure below the drop zone.

### Contracted state (default when ≥1 file)
- Shows most recently added filename (truncated to ~40 chars)
- Badge: "and N more" if >1 file
- Chevron toggle icon on right
- `cursor-pointer`

### Expanded state
- Smooth reveal: `AnimatePresence` + `motion.div` with `height: auto`, opacity 0→1, translateY 4→0, ~280ms, ease-out
- List of all files: filename + `×` remove button per row
- Compact rows, consistent with design system spacing

### Behavior
- Auto-expands when user adds a second file (so they see it was added)
- Auto-collapses when files drop back to 1
- Expanded/contracted state tracked with `isExpanded` boolean in component state
- Removing a file via `×` calls `onFilesChange` with that file filtered out

---

## Files Summary

### Modified
| File | Change |
|------|--------|
| `docs/product/design-system.md` | Add cursor-pointer rule for all interactive elements |
| `next.config.ts` | Add serverActions bodySizeLimit: 20mb |
| `components/projects/workspace/batch-card.tsx` | cursor-pointer on trash, 500ms hover animation, paste link + clipboard copy |
| `components/projects/workspace/inputs-section.tsx` | Thread projectId to BatchCard |
| `components/projects/inputs/step-type-select.tsx` | cursor-pointer on method cards |
| `components/projects/inputs/step-upload.tsx` | Collapsible file list with remove-per-file |
| `components/projects/inputs/add-input-form.tsx` | Fix "itemsadded" text spacing |

### Created
| File | Purpose |
|------|---------|
| `app/(app)/projects/[id]/inputs/[sourceType]/page.tsx` | Paste input detail page |
| `app/(app)/projects/[id]/inputs/[sourceType]/loading.tsx` | Skeleton loading state |
