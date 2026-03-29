# MagicCard Hover Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace CSS transform-based hover on BatchCard, ProposalCard, and ThemesSection insight cards with MagicCard — matching the ProjectTile canonical hover system (Framer Motion lift + scale + gradient glow + cursor-follow highlight).

**Architecture:** Each card's root container `<div>` is swapped for `<MagicCard>`. Transform hover utilities (`hover:-translate-y-0.5`, `hover:scale-[1.02]`, `transition-[transform,...]`) are removed; visual hover utilities (`hover:shadow-[var(--shadow-3)]`, `hover:border-[var(--color-border-strong)]`) are kept. The CSS transition shrinks from `[transform,box-shadow,border-color]` to `[box-shadow,border-color]` with unified timing (`duration-[500ms]`, `cubic-bezier(0.16,1,0.3,1)`) matching ProjectTile.

**Tech Stack:** React, Next.js, Tailwind CSS, Framer Motion (`motion/react`), `MagicCard` (`@/components/ui/magic-card`), Vitest

---

## File Map

| File | Change |
|---|---|
| `components/projects/workspace/batch-card.tsx` | Swap card container with MagicCard; move layout to inner div |
| `components/projects/workspace/batch-card.test.tsx` | Extend `motion/react` mock + add `next-themes` mock |
| `components/projects/workspace/proposals-section.tsx` | Swap ProposalCard outer div with MagicCard |
| `components/projects/workspace/proposals-section.test.tsx` | Add `next-themes` mock |
| `components/projects/workspace/themes-section.tsx` | Swap insight div with MagicCard |
| `components/projects/workspace/themes-section.test.tsx` | Add `next-themes` mock |

---

## Task 1: Refactor BatchCard

**Files:**
- Modify: `components/projects/workspace/batch-card.tsx`
- Modify: `components/projects/workspace/batch-card.test.tsx`

### Why layout needs an inner wrapper

MagicCard renders children inside `<div className="relative z-40">{children}</div>`. CSS `flex` on the MagicCard `className` applies to the outer `motion.div`, whose only in-flow child is that wrapper div — so `flex items-center gap-3` would not cascade to icon/text/buttons. The fix: move layout to an explicit inner `<div>`.

- [ ] **Step 1: Update the `motion/react` mock and add `next-themes` mock in `batch-card.test.tsx`**

The current mock only handles `motion.div` and `AnimatePresence`. MagicCard uses `useMotionValue`, `useSpring`, `useMotionTemplate`, and `useTheme`. Update the mock:

```tsx
// components/projects/workspace/batch-card.test.tsx
// Replace the existing vi.mock("motion/react") block with:
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      custom: _c,
      variants: _v,
      whileHover: _wh,
      style: _s,
      onPointerMove: _opm,
      onPointerLeave: _opl,
      onPointerEnter: _ope,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & {
      initial?: unknown; animate?: unknown; exit?: unknown;
      transition?: unknown; custom?: unknown; variants?: unknown;
      whileHover?: unknown; style?: unknown;
      onPointerMove?: unknown; onPointerLeave?: unknown; onPointerEnter?: unknown;
    }) => <div className={className} {...rest}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useMotionValue: (_initial: unknown) => ({ set: vi.fn(), get: vi.fn() }),
  useMotionTemplate: (..._args: unknown[]) => "",
  useSpring: (_v: unknown, _opts?: unknown) => ({ set: vi.fn(), get: vi.fn() }),
}));

// Add after the motion/react mock:
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));
```

- [ ] **Step 2: Run tests to confirm they still pass before touching implementation**

```bash
cd /Users/danielguirao/repos/spec-forge
pnpm test components/projects/workspace/batch-card.test.tsx
```

Expected: all 9 tests pass.

- [ ] **Step 3: Update `batch-card.tsx` — import MagicCard, replace `cardClass`, restructure render**

Replace the entire `cardClass` constant and the two return statements at the bottom of `BatchCard`:

```tsx
// Add import at top of file (after existing imports):
import { MagicCard } from "@/components/ui/magic-card";

// Replace:
//   const cardClass = "cursor-pointer flex items-center gap-3 ..."
// With:
  const magicCardClass =
    "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] flex-shrink-0 shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]";

// Replace both return statements:
  if (isPaste) {
    const href = `/projects/${projectId}/inputs/${encodeURIComponent(batch.sourceLabel)}`;
    return (
      <Link href={href} className="cursor-pointer block">
        <MagicCard className={magicCardClass} gradientColor="hsla(220,55%,55%,0.10)">
          <div className="flex items-center gap-3 px-4 py-3.5">
            {inner}
          </div>
        </MagicCard>
      </Link>
    );
  }

  return (
    <MagicCard className={`${magicCardClass} cursor-pointer`} gradientColor="hsla(220,55%,55%,0.10)">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {inner}
      </div>
    </MagicCard>
  );
```

Remove the now-unused `href` variable that was declared before the old `if (isPaste)` block:

```tsx
// BEFORE the return block, the file currently has:
//   if (isPaste) {
//     const href = ...
//     return <Link href={href} className={cardClass}>{inner}</Link>;
//   }
//   return <div className={cardClass}>{inner}</div>;
//
// The href is declared inline in the new code above.
// Also remove any standalone `href` declaration that previously existed outside.
```

The full updated bottom of `BatchCard` (from the `const magicCardClass` line through the final return):

```tsx
  const magicCardClass =
    "rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] flex-shrink-0 shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]";

  const cardContent = (
    <MagicCard className={magicCardClass} gradientColor="hsla(220,55%,55%,0.10)">
      <div className="flex items-center gap-3 px-4 py-3.5">
        {inner}
      </div>
    </MagicCard>
  );

  if (isPaste) {
    const href = `/projects/${projectId}/inputs/${encodeURIComponent(batch.sourceLabel)}`;
    return (
      <Link href={href} className="cursor-pointer block">
        {cardContent}
      </Link>
    );
  }

  return <div className="cursor-pointer">{cardContent}</div>;
```

- [ ] **Step 4: Run tests**

```bash
pnpm test components/projects/workspace/batch-card.test.tsx
```

Expected: all 9 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/batch-card.tsx components/projects/workspace/batch-card.test.tsx
git commit -m "feat: wrap BatchCard with MagicCard hover system"
```

---

## Task 2: Refactor ProposalCard

**Files:**
- Modify: `components/projects/workspace/proposals-section.tsx`
- Modify: `components/projects/workspace/proposals-section.test.tsx`

### Notes

- ProposalCard has no layout styles on its outer `<div>` (layout is on the inner `<button>` and body sections) — direct swap.
- `overflow-hidden` is already provided by MagicCard's base className — remove it from the prop.
- The `AnimatePresence` height animation works inside `div.relative.z-40` without issue since MagicCard's `overflow-hidden` clips overflowing content, not expanding content (the card auto-expands in height).

- [ ] **Step 1: Add `next-themes` mock to `proposals-section.test.tsx`**

```tsx
// Add near the top of proposals-section.test.tsx, after imports:
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));
```

Also add `vi` to the import:
```tsx
import { describe, it, expect, vi } from "vitest";
```

- [ ] **Step 2: Run tests before touching implementation**

```bash
pnpm test components/projects/workspace/proposals-section.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 3: Update `proposals-section.tsx` — import MagicCard, replace ProposalCard outer div**

```tsx
// Add import at top of file (after existing imports):
import { MagicCard } from "@/components/ui/magic-card";

// Replace the outer div on line 75:
// FROM:
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-[var(--shadow-2)] transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">

// TO:
    <MagicCard
      className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]"
      gradientColor="hsla(220,55%,55%,0.10)"
    >

// Replace the closing </div> at the end of ProposalCard (after </AnimatePresence>):
// FROM: </div>
// TO:   </MagicCard>
```

- [ ] **Step 4: Run tests**

```bash
pnpm test components/projects/workspace/proposals-section.test.tsx
```

Expected: all 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/proposals-section.tsx components/projects/workspace/proposals-section.test.tsx
git commit -m "feat: wrap ProposalCard with MagicCard hover system"
```

---

## Task 3: Refactor ThemesSection insight cards

**Files:**
- Modify: `components/projects/workspace/themes-section.tsx`
- Modify: `components/projects/workspace/themes-section.test.tsx`

### Notes

- The insight `<div>` has `p-5` padding — keep it on MagicCard className (works identically since padding applies to `motion.div`'s content area, and children are inside `div.relative.z-40` within that padding).
- Direct swap: no layout restructuring needed.

- [ ] **Step 1: Add `next-themes` mock to `themes-section.test.tsx`**

```tsx
// Add near the top of themes-section.test.tsx, after imports:
import { vi } from "vitest";

vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", systemTheme: "dark" }),
}));
```

- [ ] **Step 2: Run tests before touching implementation**

```bash
pnpm test components/projects/workspace/themes-section.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 3: Update `themes-section.tsx` — import MagicCard, replace insight div**

```tsx
// Add import at top of file (after existing imports):
import { MagicCard } from "@/components/ui/magic-card";

// In the insights.map(), replace:
// FROM:
          <div
            key={insight.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-5 shadow-[var(--shadow-2)] transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]"
          >

// TO:
          <MagicCard
            key={insight.id}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-5 shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]"
            gradientColor="hsla(220,55%,55%,0.10)"
          >

// Replace closing </div> at end of insight card block:
// FROM: </div>
// TO:   </MagicCard>
```

- [ ] **Step 4: Run tests**

```bash
pnpm test components/projects/workspace/themes-section.test.tsx
```

Expected: all 5 tests pass.

- [ ] **Step 5: Commit**

```bash
git add components/projects/workspace/themes-section.tsx components/projects/workspace/themes-section.test.tsx
git commit -m "feat: wrap ThemesSection insight cards with MagicCard hover system"
```

---

## Task 4: Full validation

- [ ] **Step 1: Run full lint + typecheck + test suite**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: zero errors, all tests pass.

- [ ] **Step 2: Visual check**

Open the project workspace in the browser. Hover over:
- A BatchCard (upload and paste variants)
- A ProposalCard
- A ThemesSection insight card

Each should exhibit:
- Framer Motion lift (`y: -2`) + scale (`1.015`) on hover
- Gradient glow following the cursor
- `border-[var(--color-border-strong)]` on hover
- `shadow-[var(--shadow-3)]` on hover
- No jank or transform conflict with CSS utilities

Timing should match ProjectTile: `duration: 0.5`, `ease: [0.16, 1, 0.3, 1]`.
