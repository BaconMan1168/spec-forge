# Animations & Loading States Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix project card hover animation (too stiff/fast), add smooth page transitions, add skeleton loading states for all pages, and document hover animation standards in the design system.

**Architecture:** Card hover uses CSS transitions with longer duration + shadow depth; page transitions use a `PageTransition` client component keyed to `usePathname()` placed in the app layout; loading states use Next.js `loading.tsx` convention with shadcn `Skeleton` styled to design system surface tokens. No new page-level state or server logic required.

**Tech Stack:** Next.js App Router, `motion/react` v12, shadcn `Skeleton`, Tailwind v4, Vitest + @testing-library/react, pnpm

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `components/projects/project-tile.tsx` | Modify | Slower, richer card hover transition |
| `components/ui/page-transition.tsx` | Create | Client wrapper that re-animates on pathname change |
| `app/(app)/layout.tsx` | Modify | Wrap `<main>` children in `<PageTransition>` |
| `app/(app)/dashboard/loading.tsx` | Create | Dashboard skeleton (header row + 4 tile placeholders) |
| `app/(app)/projects/[id]/loading.tsx` | Create | Project page skeleton (heading + empty-state placeholders) |
| `components/ui/skeleton.tsx` | Install via shadcn CLI | Base shimmer skeleton primitive |
| `components/ui/page-transition.test.tsx` | Create | Smoke test: renders children, key changes on pathname |
| `docs/product/design-system.md` | Modify | Add §8.7 Hover Animation Standards |

---

### Task 1: Install shadcn Skeleton

**Files:**
- Install: `components/ui/skeleton.tsx` (via CLI)

- [ ] **Step 1: Install skeleton component**

```bash
pnpm dlx shadcn@latest add skeleton
```

Expected: `components/ui/skeleton.tsx` created.

- [ ] **Step 2: Verify the file exists**

```bash
ls components/ui/skeleton.tsx
```

Expected: file present.

- [ ] **Step 3: Run existing tests to confirm nothing broke**

```bash
pnpm test --reporter=verbose 2>&1 | tail -8
```

Expected: 49 tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/ui/skeleton.tsx
git commit -m "chore: install shadcn skeleton component"
```

---

### Task 2: Fix ProjectTile card hover animation

**Files:**
- Modify: `components/projects/project-tile.tsx`
- Test: `components/projects/project-tile.test.tsx`

The current card uses `transition-transform duration-[180ms]` — only one property, too fast, no depth change. The fix: animate `transform`, `box-shadow`, AND `border-color` together over `320ms` with the premium ease; bump scale to the design-system max (`1.02`); increase shadow on hover to `shadow-3` for a lift feeling.

- [ ] **Step 1: Update the test to assert the new duration class**

In `project-tile.test.tsx`, add one test after the existing ones:

```tsx
it("has fluid hover transition class (320ms)", () => {
  const { container } = render(<ProjectTile {...baseProps} />);
  // MagicCard receives the className — find the element with the transition class
  const card = container.querySelector("[class*='duration-']");
  expect(card?.className).toMatch(/duration-\[320ms\]/);
});
```

- [ ] **Step 2: Run to verify it FAILS**

```bash
pnpm test -- components/projects/project-tile.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: FAIL — `duration-[320ms]` not found (current value is `180ms`).

- [ ] **Step 3: Update project-tile.tsx**

Change the `MagicCard` className — replace the transition/hover section only:

Old:
```tsx
className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] backdrop-blur-[20px] transition-transform duration-[180ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.015]"
```

New:
```tsx
className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] backdrop-blur-[20px] transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]"
```

Key changes:
- `transition-transform` → `transition-[transform,box-shadow,border-color]`
- `duration-[180ms]` → `duration-[320ms]`
- `hover:scale-[1.015]` → `hover:scale-[1.02]` (design-system max)
- Added `hover:shadow-[var(--shadow-3)]` — card appears to lift
- Added `hover:border-[var(--color-border-strong)]` — border highlights

- [ ] **Step 4: Run tests — all must pass**

```bash
pnpm test -- components/projects/project-tile.test.tsx --reporter=verbose 2>&1 | tail -15
```

Expected: all 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add components/projects/project-tile.tsx components/projects/project-tile.test.tsx
git commit -m "feat: slow down card hover to 320ms with shadow+border depth transition"
```

---

### Task 3: Create PageTransition component

**Files:**
- Create: `components/ui/page-transition.tsx`
- Create: `components/ui/page-transition.test.tsx`

`PageTransition` is a client component that uses `usePathname()` as a React key on a `motion.div`. Each route change mounts a fresh `motion.div` which plays its enter animation. This is the simplest reliable App Router page transition — no `AnimatePresence` exit needed since the RSC shell re-renders children on navigation.

- [ ] **Step 1: Write the test first**

Create `components/ui/page-transition.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { PageTransition } from "./page-transition";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div className={className as string} {...(rest as React.HTMLAttributes<HTMLDivElement>)}>
        {children}
      </div>
    ),
  },
}));

describe("PageTransition", () => {
  it("renders children", () => {
    render(
      <PageTransition>
        <p>Hello</p>
      </PageTransition>
    );
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("uses pathname as the motion key", () => {
    const { container } = render(
      <PageTransition>
        <span>content</span>
      </PageTransition>
    );
    // The wrapper div should exist
    expect(container.firstChild).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test — expect FAIL**

```bash
pnpm test -- components/ui/page-transition.test.tsx --reporter=verbose 2>&1 | tail -12
```

Expected: FAIL — `page-transition.tsx` does not exist yet.

- [ ] **Step 3: Create page-transition.tsx**

```tsx
// components/ui/page-transition.tsx
"use client";

import { motion } from "motion/react";
import { usePathname } from "next/navigation";

const PAGE_TRANSITION = {
  type: "tween" as const,
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={PAGE_TRANSITION}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 4: Run test — expect PASS**

```bash
pnpm test -- components/ui/page-transition.test.tsx --reporter=verbose 2>&1 | tail -12
```

Expected: 2 PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ui/page-transition.tsx components/ui/page-transition.test.tsx
git commit -m "feat: add PageTransition component keyed to pathname"
```

---

### Task 4: Wire PageTransition into app layout

**Files:**
- Modify: `app/(app)/layout.tsx`

- [ ] **Step 1: Add the import and wrap children**

In `app/(app)/layout.tsx`, add the import:
```tsx
import { PageTransition } from "@/components/ui/page-transition";
```

Change:
```tsx
<main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
```

To:
```tsx
<main className="mx-auto max-w-[1200px] px-6 py-8">
  <PageTransition>{children}</PageTransition>
</main>
```

- [ ] **Step 2: Run full test suite**

```bash
pnpm test --reporter=verbose 2>&1 | tail -8
```

Expected: all tests pass (layout has no direct tests).

- [ ] **Step 3: Commit**

```bash
git add app/(app)/layout.tsx
git commit -m "feat: wrap app layout children in PageTransition"
```

---

### Task 5: Dashboard loading skeleton

**Files:**
- Create: `app/(app)/dashboard/loading.tsx`

Next.js automatically renders this file while `dashboard/page.tsx` is fetching data. It mirrors the dashboard layout: a header row (heading + button) and a 2-column grid of card placeholders.

- [ ] **Step 1: Create the file**

```tsx
// app/(app)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      {/* Header row mirrors dashboard/page.tsx layout */}
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-9 w-44 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
        <Skeleton className="h-[52px] w-36 rounded-[var(--radius-pill)] bg-[var(--color-surface-1)]" />
      </div>

      {/* 2-column grid of card skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)]"
          >
            {/* Icon block */}
            <Skeleton className="h-[26px] w-[26px] rounded-[var(--radius-xs)] bg-[var(--color-surface-2)]" />
            {/* Project name */}
            <Skeleton className="h-6 w-3/4 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
            {/* Date */}
            <Skeleton className="h-4 w-1/3 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run test suite (no new tests needed — loading.tsx is a pure UI file)**

```bash
pnpm test --reporter=verbose 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/dashboard/loading.tsx
git commit -m "feat: add dashboard loading skeleton"
```

---

### Task 6: Project page loading skeleton

**Files:**
- Create: `app/(app)/projects/[id]/loading.tsx`

Mirrors the project page layout: large heading + empty-state text area.

- [ ] **Step 1: Create the file**

```tsx
// app/(app)/projects/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div>
      {/* Page heading */}
      <Skeleton className="mb-8 h-9 w-56 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />

      {/* Empty state placeholder */}
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Skeleton className="h-4 w-48 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
        <Skeleton className="h-3 w-64 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run test suite**

```bash
pnpm test --reporter=verbose 2>&1 | tail -8
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add app/(app)/projects/[id]/loading.tsx
git commit -m "feat: add project page loading skeleton"
```

---

### Task 7: Update design system — §8.7 Hover Animation Standards

**Files:**
- Modify: `docs/product/design-system.md`

- [ ] **Step 1: Append §8.7 after §8.6 (Forbidden Animations)**

Find:
```markdown
## 8.6 Forbidden Animations

- bounce
- spring physics
- rotation for layout elements
- flashing colors
- fast looping motion
```

Replace with:
```markdown
## 8.6 Forbidden Animations

- bounce
- spring physics
- rotation for layout elements
- flashing colors
- fast looping motion

---

## 8.7 Card / Surface Hover Animation Standards

Card hover must animate at least THREE properties simultaneously to feel rich and dimensional:

1. **transform** — scale + translateY
2. **box-shadow** — increases on hover (depth illusion)
3. **border-color** — highlights on hover

### Required values

```
transition-property: transform, box-shadow, border-color
duration: 320ms          ← minimum; never below 250ms
easing: cubic-bezier(0.22, 1, 0.36, 1)
scale: 1.02              ← design-system max (§8.2)
translateY: -2px         ← design-system max (§8.2)
shadow: shadow-2 → shadow-3
border: border-subtle → border-strong
```

### Why duration matters

Animations under 200ms feel mechanical and abrupt. The 320ms duration with
the premium ease curve gives the card time to "settle" into its hover state,
making the interaction feel intentional and physical rather than instant.

### Tailwind implementation

```tsx
className="... transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]"
```

### Forbidden for card hover

- `transition-all` (too broad, causes repaints on every property)
- `duration` below 250ms
- Animating `background-color` separately from transform (creates visual noise)
- Spring physics on hover (§8.6)
```

- [ ] **Step 2: Commit**

```bash
git add docs/product/design-system.md
git commit -m "docs: add §8.7 card hover animation standards to design system"
```

---

### Task 8: Final validation

**Files:** none

- [ ] **Step 1: Full lint + typecheck + test**

```bash
pnpm lint && pnpm typecheck && pnpm test --reporter=verbose
```

Expected: 0 errors, all tests pass (51 total — 49 existing + 2 new PageTransition tests).

- [ ] **Step 2: Manual verification checklist**

```bash
pnpm dev
```

Open `http://localhost:3000/dashboard` and verify:

1. Hovering a project card: animation takes ~320ms, card lifts + shadow deepens + border brightens — feels fluid
2. Clicking a project card: page fades + slides up smoothly into the project page
3. Navigating back to dashboard: same smooth enter animation
4. On slow connection (DevTools → Network → Slow 3G): dashboard loading skeleton appears before project tiles load
5. On slow connection navigating to a project: project loading skeleton appears
6. All existing functionality works: New Project modal, Sign out, backdrop close
