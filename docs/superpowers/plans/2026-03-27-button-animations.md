# Button Animations & Design System Compliance Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the unstyled, unanimated `Button` component with a fully design-system-compliant button that has `cursor-pointer`, amber primary CTA styling, shimmer hover sweep, and fluid press animations; also animate the `NewProjectModal` open/close.

**Architecture:** Rewrite `components/ui/button.tsx` to remove the `@base-ui/react` primitive and use `motion.button` from `motion/react` (already installed). CVA continues to drive variant/size classes. A shimmer `<span>` inside primary buttons provides the unique hover sweep. `AnimatePresence` + `motion.div` gives the modal a premium scale/fade entrance. Add a Button section to the design system doc.

**Tech Stack:** Next.js App Router, `motion/react` (v12), CVA, Tailwind v4, Vitest + @testing-library/react

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `components/ui/button.tsx` | **Rewrite** | Design-system button with motion animations |
| `components/ui/button.test.tsx` | **Create** | TDD tests for button behavior |
| `components/projects/new-project-modal.tsx` | **Modify** | Add AnimatePresence modal animation, `motion.div` card |
| `components/projects/new-project-modal.test.tsx` | **Modify** | Add motion/react mock |
| `components/auth/sign-out-button.tsx` | **Modify** | Remove redundant className overrides |
| `docs/product/design-system.md` | **Modify** | Add Button interaction rules (cursor, animations) |

---

### Task 1: Write failing tests for the new Button

**Files:**
- Create: `components/ui/button.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "./button";

// motion/react mock — replace motion.button with a plain <button>
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
    }) => (
      <button className={className} {...rest}>
        {children}
      </button>
    ),
  },
}));

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(
      screen.getByRole("button", { name: /click me/i })
    ).toBeInTheDocument();
  });

  it("has cursor-pointer class", () => {
    const { container } = render(<Button>Click</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "cursor-pointer"
    );
  });

  it("primary variant references the accent-primary token", () => {
    const { container } = render(<Button>Primary</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "accent-primary"
    );
  });

  it("secondary variant references surface-1 token", () => {
    const { container } = render(<Button variant="secondary">Secondary</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "surface-1"
    );
  });

  it("renders with pill radius token", () => {
    const { container } = render(<Button>Pill</Button>);
    expect((container.firstChild as HTMLElement).className).toContain(
      "radius-pill"
    );
  });

  it("is disabled when disabled prop is passed", () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    screen.getByRole("button").click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not call onClick when disabled", () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Go
      </Button>
    );
    screen.getByRole("button").click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it("forwards type attribute", () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });
});
```

- [ ] **Step 2: Run tests — expect all to FAIL**

```bash
cd /Users/danielguirao/repos/spec-forge
pnpm test -- components/ui/button.test.tsx --reporter=verbose
```

Expected: **FAIL** — `components/ui/button.tsx` does not have `cursor-pointer`, `accent-primary`, `surface-1`, or `radius-pill` classes.

---

### Task 2: Rewrite `components/ui/button.tsx`

**Files:**
- Modify: `components/ui/button.tsx`

- [ ] **Step 1: Replace the entire file contents**

```tsx
// components/ui/button.tsx
"use client";

import { motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";
import { type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

// Shared motion config — no spring physics (design-system §8.3 / §8.6)
const HOVER = { scale: 1.02, y: -2 } as const;
const TAP = { scale: 0.97 } as const;
const MOTION_TRANSITION = {
  type: "tween" as const,
  duration: 0.12,
  ease: [0.22, 1, 0.36, 1] as const,
};

const buttonVariants = cva(
  // Base — always applied
  [
    "group relative inline-flex shrink-0 cursor-pointer items-center justify-center",
    "gap-2 overflow-hidden whitespace-nowrap",
    "rounded-[var(--radius-pill)] font-medium",
    "select-none outline-none",
    "transition-[background-color,box-shadow,opacity] duration-[120ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)]",
    "focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)]/50",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        // Primary CTA — amber accent (design-system §7 Buttons / §1.3)
        default:
          "bg-[var(--color-accent-primary)] text-[var(--color-bg-0)] shadow-[var(--shadow-1)] hover:bg-[var(--color-accent-hover)] hover:shadow-[var(--shadow-2)]",
        // Secondary — glass surface (design-system §7)
        secondary:
          "bg-[var(--color-surface-1)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-border-strong)]",
        // Ghost — transparent, low-prominence action
        ghost:
          "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]",
        // Destructive
        destructive:
          "bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 hover:bg-[var(--color-error)]/20",
      },
      size: {
        // padding: 16px vertical / 24px horizontal per design-system §7
        default: "px-6 py-4 text-sm",
        sm: "px-4 py-2.5 text-xs",
        lg: "px-8 py-5 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

type ButtonProps = ComponentPropsWithoutRef<"button"> &
  VariantProps<typeof buttonVariants>;

function Button({
  className,
  variant = "default",
  size = "default",
  children,
  ...props
}: ButtonProps) {
  const isPrimary = variant === "default" || variant == null;

  return (
    <motion.button
      data-slot="button"
      whileHover={HOVER}
      whileTap={TAP}
      transition={MOTION_TRANSITION}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
    >
      {/* Shimmer sweep — primary buttons only (unique hover effect) */}
      {isPrimary && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 translate-x-[-120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 ease-out group-hover:translate-x-[120%]"
        />
      )}
      {children}
    </motion.button>
  );
}

export { Button, buttonVariants };
```

- [ ] **Step 2: Run the button tests — expect all to PASS**

```bash
pnpm test -- components/ui/button.test.tsx --reporter=verbose
```

Expected: **9 tests PASS**

- [ ] **Step 3: Run the full test suite to confirm no regressions**

```bash
pnpm test --reporter=verbose
```

Expected: all tests pass. If `new-project-modal.test.tsx` fails due to motion/react imports in the modal, that's addressed in Task 4.

- [ ] **Step 4: Commit**

```bash
git add components/ui/button.tsx components/ui/button.test.tsx
git commit -m "feat: rewrite Button with design-system tokens, cursor-pointer, and shimmer + press animations"
```

---

### Task 3: Update `SignOutButton` to remove redundant overrides

**Files:**
- Modify: `components/auth/sign-out-button.tsx`

The old secondary button was too small, so `className="text-sm px-4 py-2"` was added to compensate. The new button has correct sizing built in — remove the override.

- [ ] **Step 1: Remove the className override**

Old:
```tsx
<Button
  variant="secondary"
  onClick={handleSignOut}
  className="text-sm px-4 py-2"
>
  Sign out
</Button>
```

New:
```tsx
<Button variant="secondary" onClick={handleSignOut}>
  Sign out
</Button>
```

- [ ] **Step 2: Run tests**

```bash
pnpm test --reporter=verbose
```

Expected: all tests pass (no test covers SignOutButton sizing directly).

- [ ] **Step 3: Commit**

```bash
git add components/auth/sign-out-button.tsx
git commit -m "chore: remove redundant className override from SignOutButton"
```

---

### Task 4: Animate `NewProjectModal` open/close + update its tests

**Files:**
- Modify: `components/projects/new-project-modal.tsx`
- Modify: `components/projects/new-project-modal.test.tsx`

- [ ] **Step 1: Update the test file first (tests must pass before and after)**

Replace the entire `new-project-modal.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NewProjectModal } from "./new-project-modal";

vi.mock("@/app/actions/projects", () => ({
  createProject: vi.fn(),
}));

// AnimatePresence must immediately render/remove children in tests
vi.mock("motion/react", () => ({
  motion: {
    div: ({
      children,
      className,
      initial: _i,
      animate: _a,
      exit: _e,
      transition: _t,
      ...rest
    }: React.HTMLAttributes<HTMLDivElement> & Record<string, unknown>) => (
      <div className={className as string} {...(rest as object)}>
        {children}
      </div>
    ),
    button: ({
      children,
      className,
      whileHover: _wh,
      whileTap: _wt,
      transition: _tr,
      ...rest
    }: React.HTMLAttributes<HTMLButtonElement> & Record<string, unknown>) => (
      <button className={className as string} {...(rest as object)}>
        {children}
      </button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
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

  it("closes modal when backdrop is clicked", () => {
    render(<NewProjectModal />);
    fireEvent.click(screen.getByRole("button", { name: /new project/i }));
    const backdrop = screen
      .getByRole("dialog")
      .querySelector("[data-backdrop]");
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop!);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests — expect `closes modal when backdrop is clicked` to FAIL** (backdrop lacks `data-backdrop` in old code)

```bash
pnpm test -- components/projects/new-project-modal.test.tsx --reporter=verbose
```

Expected: 5 PASS, 1 FAIL (`backdrop` test).

- [ ] **Step 3: Rewrite `new-project-modal.tsx` with motion animations**

```tsx
// components/projects/new-project-modal.tsx
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createProject } from "@/app/actions/projects";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const MODAL_TRANSITION = {
  type: "tween" as const,
  duration: 0.28,
  ease: [0.22, 1, 0.36, 1] as const,
};

const BACKDROP_TRANSITION = {
  type: "tween" as const,
  duration: 0.18,
  ease: "easeOut" as const,
};

export function NewProjectModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>New Project</Button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={BACKDROP_TRANSITION}
          >
            {/* Backdrop */}
            <div
              data-backdrop
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Dialog card */}
            <motion.div
              className="relative w-full max-w-sm rounded-[var(--radius-xl)] bg-[var(--color-surface-0)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-3)] p-8"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={MODAL_TRANSITION}
            >
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

- [ ] **Step 4: Run modal tests — expect all 6 to PASS**

```bash
pnpm test -- components/projects/new-project-modal.test.tsx --reporter=verbose
```

Expected: **6 PASS**

- [ ] **Step 5: Run full test suite**

```bash
pnpm test --reporter=verbose
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add components/projects/new-project-modal.tsx components/projects/new-project-modal.test.tsx
git commit -m "feat: add AnimatePresence scale/fade animation to NewProjectModal"
```

---

### Task 5: Add Button Interaction Rules to Design System

**Files:**
- Modify: `docs/product/design-system.md`

- [ ] **Step 1: Replace the existing `## Buttons` section in §7 with the expanded version**

Find the current buttons section:
```markdown
## Buttons

Primary:
bg: accent-primary
text: bg-0
radius: pill
padding: 16px 24px
shadow: shadow-1

Secondary:
bg: surface-1
border: border-subtle
text: text-primary
```

Replace with:
```markdown
## Buttons

### Variants

Primary:
bg: accent-primary
text: bg-0
radius: pill
padding: 16px 24px (py-4 px-6)
shadow: shadow-1
hover-bg: accent-hover
hover-shadow: shadow-2

Secondary:
bg: surface-1
border: border-subtle
text: text-primary
hover-bg: surface-2
hover-border: border-strong

Ghost:
bg: transparent
text: text-secondary
hover-bg: surface-1
hover-text: text-primary

Destructive:
bg: error / 10
border: error / 20
text: error
hover-bg: error / 20

### Cursor

ALL buttons must use `cursor: pointer` on hover.
Never use `cursor: default` on interactive elements.

### Hover Animation

All buttons:
- scale: 1.02
- translateY: -2px
- duration: fast (120ms)
- easing: cubic-bezier(0.22, 1, 0.36, 1)

Primary buttons additionally:
- shimmer sweep: semi-transparent white gradient (via-white/20) translates from left to right on hover
- sweep duration: 500ms ease-out

### Press / Click Animation

All buttons:
- scale: 0.97
- duration: fast (120ms)
- easing: cubic-bezier(0.22, 1, 0.36, 1)
- Must feel responsive, never elastic
- NO spring physics (forbidden per §8.6)

### Implementation Notes

- Use `motion.button` from `motion/react` as the base primitive
- `whileHover={{ scale: 1.02, y: -2 }}`
- `whileTap={{ scale: 0.97 }}`
- `transition={{ type: "tween", duration: 0.12, ease: [0.22, 1, 0.36, 1] }}`
- Shimmer span: `aria-hidden="true"`, absolute inset, group-hover translate
```

- [ ] **Step 2: Commit**

```bash
git add docs/product/design-system.md
git commit -m "docs: add button interaction rules (cursor, hover shimmer, press animation) to design system"
```

---

### Task 6: Final validation

- [ ] **Step 1: Run full lint + typecheck + test**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: all pass with no errors.

- [ ] **Step 2: Verify locally**

Start dev server and confirm:
1. "New Project" button shows amber background with white text
2. Hovering any button shows scale-up + cursor pointer
3. Clicking any button shows scale-down press feedback
4. Primary buttons show shimmer sweep on hover
5. "New Project" modal opens with scale/fade entrance
6. Modal closes with scale/fade exit when Cancel or backdrop is clicked
7. "Sign out" button renders correctly in the header

Run:
```bash
pnpm dev
```

Open `http://localhost:3000/dashboard` to verify.
