# Dashboard Visual Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an animated particle + aurora background, Outfit font, glassmorphism project tiles in a 2-column grid with Magic Card hover spotlight and BlurFade stagger entrance to the SpecForge dashboard.

**Architecture:** A fixed background layer (MagicUI Particles + custom AuroraBackground) sits behind all app pages. The dashboard page renders project tiles via a new `ProjectTile` client component that wraps content in MagicCard for interactivity and BlurFade for staggered entrance. The root layout handles the font; the app layout handles the background.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Vitest + @testing-library/react, MagicUI (Particles, MagicCard, BlurFade), Framer Motion (`motion`), next-themes

---

## File Map

| File | Role |
|------|------|
| `app/layout.tsx` | Root layout — swap Inter for Outfit font |
| `app/(app)/layout.tsx` | App shell — add fixed background layer + ThemeProvider |
| `app/(app)/dashboard/page.tsx` | Dashboard page — 2-col grid, BlurFade heading/button, ProjectTile per card |
| `components/ui/aurora-background.tsx` | New — 5 animated CSS aurora bands, `prefers-reduced-motion` aware |
| `components/ui/aurora-background.test.tsx` | New — render test for AuroraBackground |
| `components/projects/project-tile.tsx` | New — client component: MagicCard + BlurFade + tile content |
| `components/projects/project-tile.test.tsx` | New — render test for ProjectTile |
| `components/ui/card.tsx` | Update — glass surface rule styles |
| `components/ui/card.test.tsx` | New — render test for Card |
| `docs/product/design-system.md` | Update — §2.1 font Inter → Outfit |

---

## Task 1: Install dependencies and MagicUI components

**Files:**
- Modify: `package.json` (via pnpm)

- [ ] **Step 1.1: Install motion and next-themes**

```bash
cd /path/to/spec-forge
pnpm add motion next-themes
```

Expected: both packages appear in `dependencies` in `package.json`.

- [ ] **Step 1.2: Install MagicUI Particles**

```bash
pnpm dlx shadcn@latest add "https://magicui.design/r/particles.json"
```

Expected: `components/magicui/particles.tsx` created.

- [ ] **Step 1.3: Install MagicUI MagicCard**

```bash
pnpm dlx shadcn@latest add "https://magicui.design/r/magic-card.json"
```

Expected: `components/magicui/magic-card.tsx` created.

- [ ] **Step 1.4: Install MagicUI BlurFade**

```bash
pnpm dlx shadcn@latest add "https://magicui.design/r/blur-fade.json"
```

Expected: `components/magicui/blur-fade.tsx` created.

- [ ] **Step 1.5: Verify typecheck passes**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 1.6: Commit**

```bash
git add package.json pnpm-lock.yaml components/magicui/
git commit -m "chore: install motion, next-themes, and MagicUI components"
```

---

## Task 2: Create AuroraBackground component (TDD)

**Files:**
- Create: `components/ui/aurora-background.tsx`
- Create: `components/ui/aurora-background.test.tsx`

- [ ] **Step 2.1: Write the failing test**

Create `components/ui/aurora-background.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AuroraBackground } from "./aurora-background";

describe("AuroraBackground", () => {
  it("renders without crashing", () => {
    const { container } = render(<AuroraBackground />);
    expect(container.firstChild).not.toBeNull();
  });

  it("renders exactly 5 aurora bands", () => {
    const { container } = render(<AuroraBackground />);
    const bands = container.querySelectorAll("[data-aurora-band]");
    expect(bands).toHaveLength(5);
  });

  it("has pointer-events-none so it does not block interaction", () => {
    const { container } = render(<AuroraBackground />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.className).toContain("pointer-events-none");
  });
});
```

- [ ] **Step 2.2: Run test to verify it fails**

```bash
pnpm test components/ui/aurora-background.test.tsx
```

Expected: FAIL — `AuroraBackground` not found.

- [ ] **Step 2.3: Implement AuroraBackground**

Create `components/ui/aurora-background.tsx`:

```tsx
// components/ui/aurora-background.tsx
// Five horizontally-blurred aurora bands that drift continuously.
// Uses exact --analog-1/2/3 token values per design-system.md §1.4.
// Respects prefers-reduced-motion by pausing animation.

const BANDS = [
  {
    height: "70px",
    top: "18%",
    gradient:
      "linear-gradient(90deg, transparent 0%, hsla(200,55%,55%,0.18) 25%, hsla(220,55%,55%,0.14) 55%, transparent 100%)",
    blur: "22px",
    duration: "10s",
    direction: "normal" as const,
    delay: "0s",
  },
  {
    height: "50px",
    top: "32%",
    gradient:
      "linear-gradient(90deg, transparent 10%, hsla(240,55%,60%,0.14) 40%, hsla(200,55%,55%,0.12) 65%, transparent 100%)",
    blur: "18px",
    duration: "14s",
    direction: "reverse" as const,
    delay: "-4s",
  },
  {
    height: "60px",
    top: "58%",
    gradient:
      "linear-gradient(90deg, transparent 5%, hsla(220,55%,55%,0.12) 35%, hsla(240,55%,60%,0.16) 70%, transparent 100%)",
    blur: "20px",
    duration: "11s",
    direction: "normal" as const,
    delay: "-7s",
  },
  {
    height: "40px",
    top: "72%",
    gradient:
      "linear-gradient(90deg, transparent 20%, hsla(200,55%,55%,0.10) 50%, hsla(220,55%,55%,0.12) 75%, transparent 100%)",
    blur: "16px",
    duration: "16s",
    direction: "reverse" as const,
    delay: "-2s",
  },
  {
    height: "35px",
    top: "8%",
    gradient:
      "linear-gradient(90deg, transparent 30%, hsla(240,55%,60%,0.09) 60%, transparent 100%)",
    blur: "14px",
    duration: "12s",
    direction: "normal" as const,
    delay: "-9s",
  },
] as const;

export function AuroraBackground() {
  return (
    <>
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translateX(0) skewX(-6deg) scaleY(1); }
          30%       { transform: translateX(6%) skewX(3deg) scaleY(1.12); }
          60%       { transform: translateX(-4%) skewX(-3deg) scaleY(0.88); }
          80%       { transform: translateX(9%) skewX(4deg) scaleY(1.08); }
        }
        @media (prefers-reduced-motion: reduce) {
          .aurora-band { animation-play-state: paused !important; }
        }
      `}</style>
      <div
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
        aria-hidden="true"
      >
        {BANDS.map((band, i) => (
          <div
            key={i}
            data-aurora-band
            className="aurora-band absolute left-[-10%] w-[120%] rounded-[50%]"
            style={{
              height: band.height,
              top: band.top,
              background: band.gradient,
              filter: `blur(${band.blur})`,
              animation: `aurora-drift ${band.duration} ease-in-out ${band.delay} infinite ${band.direction}`,
            }}
          />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2.4: Run test to verify it passes**

```bash
pnpm test components/ui/aurora-background.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 2.5: Commit**

```bash
git add components/ui/aurora-background.tsx components/ui/aurora-background.test.tsx
git commit -m "feat: add AuroraBackground component with animated CSS bands"
```

---

## Task 3: Update Card component to glass surface (TDD)

**Files:**
- Modify: `components/ui/card.tsx`
- Create: `components/ui/card.test.tsx`

- [ ] **Step 3.1: Write the failing test**

Create `components/ui/card.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Card } from "./card";

describe("Card", () => {
  it("renders children", () => {
    const { getByText } = render(<Card>hello</Card>);
    expect(getByText("hello")).toBeInTheDocument();
  });

  it("applies backdrop-filter for glass surface effect", () => {
    const { container } = render(<Card>content</Card>);
    const el = container.firstChild as HTMLElement;
    // Glass surface rule: backdrop-blur via Tailwind class
    expect(el.className).toContain("backdrop-blur");
  });

  it("accepts and merges additional className", () => {
    const { container } = render(<Card className="extra-class">x</Card>);
    const el = container.firstChild as HTMLElement;
    expect(el.className).toContain("extra-class");
  });
});
```

- [ ] **Step 3.2: Run test to verify backdrop-blur test fails**

```bash
pnpm test components/ui/card.test.tsx
```

Expected: "renders children" PASS, "applies backdrop-filter" FAIL (no backdrop-blur class yet).

- [ ] **Step 3.3: Update Card to glass surface styles**

Replace `components/ui/card.tsx`:

```tsx
// components/ui/card.tsx
import { type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)]",
        "bg-[var(--color-surface-0)]",
        "backdrop-blur-[20px]",
        "border border-[var(--color-border-subtle)]",
        "shadow-[var(--shadow-2)]",
        "p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 3.4: Run tests to verify all pass**

```bash
pnpm test components/ui/card.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 3.5: Commit**

```bash
git add components/ui/card.tsx components/ui/card.test.tsx
git commit -m "feat: update Card to glass surface rule styles"
```

---

## Task 4: Switch font to Outfit

**Files:**
- Modify: `app/layout.tsx`
- Modify: `docs/product/design-system.md`

- [ ] **Step 4.1: Update root layout font**

Replace `app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SpecForge",
  description: "Turn customer feedback into structured feature proposals.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>{children}</body>
    </html>
  );
}
```

- [ ] **Step 4.2: Update design system doc**

In `docs/product/design-system.md`, find section 2.1 and change:

```
Inter
```

to:

```
Outfit
```

(The fallback line `system-ui, sans-serif` stays unchanged.)

- [ ] **Step 4.3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4.4: Commit**

```bash
git add app/layout.tsx docs/product/design-system.md
git commit -m "feat: switch font from Inter to Outfit"
```

---

## Task 5: Add background layer to app layout

**Files:**
- Modify: `app/(app)/layout.tsx`

The app layout needs:
1. A `ThemeProvider` from `next-themes` (required by MagicCard) wrapping everything, set to `dark` theme
2. A `fixed inset-0 z-0` background wrapper containing `AuroraBackground` + `Particles`
3. The existing content wrapped in `relative z-10`

- [ ] **Step 5.1: Update app layout**

Replace `app/(app)/layout.tsx`:

```tsx
// app/(app)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ThemeProvider } from "next-themes";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { Particles } from "@/components/magicui/particles";

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
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      <div className="relative min-h-screen bg-[var(--color-bg-0)]">
        {/* AuroraBackground renders its own fixed inset-0 wrapper internally */}
        <AuroraBackground />

        {/* Particles layer — separate fixed wrapper */}
        <div
          className="pointer-events-none fixed inset-0 z-0"
          aria-hidden="true"
        >
          <Particles
            className="absolute inset-0"
            quantity={20}
            staticity={30}
            color="#7b9fd4"
            size={0.4}
          />
        </div>

        {/* App shell */}
        <div className="relative z-10">
          <header className="border-b border-[var(--color-border-subtle)] bg-[var(--color-bg-1)]/80 backdrop-blur-[20px]">
            <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
              <span className="font-semibold text-[var(--color-text-primary)]">
                SpecForge
              </span>
              <SignOutButton />
            </div>
          </header>
          <main className="mx-auto max-w-[1200px] px-6 py-8">{children}</main>
        </div>
      </div>
    </ThemeProvider>
  );
}
```

**Note on Particles props:** The MagicUI Particles component accepts `quantity`, `staticity`, `color`, and `size` props. The `color` value `#7b9fd4` is a hex approximation of `--analog-2 hsl(220,55%,55%)`. Staticity of 30 means particles respond lightly to mouse movement (lower = more reactive, higher = less reactive). Check the installed `components/magicui/particles.tsx` for the exact prop interface and adjust if needed.

- [ ] **Step 5.2: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors. If Particles props cause type errors, check the installed `components/magicui/particles.tsx` for the exact prop interface and adjust accordingly.

- [ ] **Step 5.3: Commit**

```bash
git add app/(app)/layout.tsx
git commit -m "feat: add animated particle and aurora background to app layout"
```

---

## Task 6: Create ProjectTile client component (TDD)

**Files:**
- Create: `components/projects/project-tile.tsx`
- Create: `components/projects/project-tile.test.tsx`

This is the interactive tile rendered per project in the dashboard grid. It's a `"use client"` component so it can use MagicCard.

- [ ] **Step 6.1: Write the failing test**

> **Before writing:** Open the installed `components/magicui/blur-fade.tsx` and check its motion import — it may be `from "motion/react"` or `from "framer-motion"`. Use the same path in the mock below.

Create `components/projects/project-tile.test.tsx`:

```tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProjectTile } from "./project-tile";

// MagicCard uses next-themes — mock it
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "dark", resolvedTheme: "dark" }),
}));

// motion may use browser APIs not in jsdom
vi.mock("motion/react", () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const baseProps = {
  id: "abc-123",
  name: "Q2 Discovery Sprint",
  createdAt: "2026-03-24T00:00:00.000Z",
  index: 0,
};

describe("ProjectTile", () => {
  it("renders the project name", () => {
    render(<ProjectTile {...baseProps} />);
    expect(screen.getByText("Q2 Discovery Sprint")).toBeInTheDocument();
  });

  it("renders the formatted created date", () => {
    render(<ProjectTile {...baseProps} />);
    // Date formatting may vary by locale — just check something date-like is present
    expect(screen.getByText(/2026|Mar/i)).toBeInTheDocument();
  });

  it("renders as a link to the project page", () => {
    render(<ProjectTile {...baseProps} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/projects/abc-123");
  });

  it("renders a color-coded icon block", () => {
    const { container } = render(<ProjectTile {...baseProps} />);
    const icon = container.querySelector("[data-tile-icon]");
    expect(icon).not.toBeNull();
  });
});
```

- [ ] **Step 6.2: Run test to verify it fails**

```bash
pnpm test components/projects/project-tile.test.tsx
```

Expected: FAIL — `ProjectTile` not found.

- [ ] **Step 6.3: Implement ProjectTile**

Create `components/projects/project-tile.tsx`:

```tsx
// components/projects/project-tile.tsx
"use client";

import Link from "next/link";
import { MagicCard } from "@/components/magicui/magic-card";
import BlurFade from "@/components/magicui/blur-fade";

// Cycles through analog-1/2/3 token values at 20% opacity by index
const ICON_COLORS = [
  { bg: "hsla(200,55%,55%,0.20)", border: "hsla(200,55%,55%,0.30)" },
  { bg: "hsla(220,55%,55%,0.20)", border: "hsla(220,55%,55%,0.30)" },
  { bg: "hsla(240,55%,60%,0.20)", border: "hsla(240,55%,60%,0.30)" },
] as const;

type ProjectTileProps = {
  id: string;
  name: string;
  createdAt: string;
  index: number;
};

export function ProjectTile({ id, name, createdAt, index }: ProjectTileProps) {
  const iconColor = ICON_COLORS[index % ICON_COLORS.length];

  return (
    <BlurFade delay={index * 0.04} duration={0.28}>
      <Link href={`/projects/${id}`} className="block h-full">
        <MagicCard
          className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] backdrop-blur-[20px] transition-transform duration-[180ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.015]"
          gradientColor="hsla(220,55%,55%,0.10)"
        >
          {/* Color-coded icon block */}
          <div
            data-tile-icon
            className="h-[26px] w-[26px] rounded-[var(--radius-xs)] border"
            style={{
              background: iconColor.bg,
              borderColor: iconColor.border,
            }}
          />

          {/* Project name */}
          <p className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
            {name}
          </p>

          {/* Created date */}
          <p className="text-[14px] text-[var(--color-text-tertiary)]">
            {new Date(createdAt).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        </MagicCard>
      </Link>
    </BlurFade>
  );
}
```

- [ ] **Step 6.4: Run tests to verify all pass**

```bash
pnpm test components/projects/project-tile.test.tsx
```

Expected: 4 tests PASS. If `motion` mock needs adjusting based on the installed blur-fade component's actual imports, update the mock path to match (e.g., `motion` vs `framer-motion`).

- [ ] **Step 6.5: Commit**

```bash
git add components/projects/project-tile.tsx components/projects/project-tile.test.tsx
git commit -m "feat: add ProjectTile client component with MagicCard and BlurFade"
```

---

## Task 7: Update dashboard page

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`

- [ ] **Step 7.1: Update dashboard page**

Replace `app/(app)/dashboard/page.tsx`:

```tsx
// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { ProjectTile } from "@/components/projects/project-tile";
import BlurFade from "@/components/magicui/blur-fade";
import type { Project } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      {/* Header row */}
      <div className="mb-8 flex items-center justify-between">
        <BlurFade delay={0} duration={0.28}>
          <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)]">
            Your Projects
          </h1>
        </BlurFade>
        <BlurFade delay={0.04} duration={0.28}>
          <NewProjectModal />
        </BlurFade>
      </div>

      {!projects || projects.length === 0 ? (
        <BlurFade delay={0.08} duration={0.28}>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-2 text-base text-[var(--color-text-secondary)]">
              No projects yet.
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Create your first project to start analyzing feedback.
            </p>
          </div>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(projects as Project[]).map((project, index) => (
            <ProjectTile
              key={project.id}
              id={project.id}
              name={project.name}
              createdAt={project.created_at}
              index={index + 2} // +2 so first tile = delay 0.08s (heading=0, button=0.04, tile[0]=0.08, ...)
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 7.2: Run full test suite**

```bash
pnpm test
```

Expected: all tests pass. Fix any import or type errors before continuing.

- [ ] **Step 7.3: Typecheck**

```bash
pnpm typecheck
```

Expected: no errors.

- [ ] **Step 7.4: Lint**

```bash
pnpm lint
```

Expected: no errors.

- [ ] **Step 7.5: Commit**

```bash
git add app/(app)/dashboard/page.tsx
git commit -m "feat: update dashboard with 2-col grid, BlurFade stagger, and ProjectTile"
```

---

## Task 8: Smoke test in browser

- [ ] **Step 8.1: Start dev server**

```bash
pnpm dev
```

- [ ] **Step 8.2: Verify visually**

Open `http://localhost:3000` (redirects to `/dashboard`).

Check:
- [ ] Aurora bands are visible and slowly drifting in the background
- [ ] Particles (small dots) are visible and drifting
- [ ] Page heading and "New Project" button fade in with blur on load
- [ ] Project tiles stagger in with blur-fade (each card slightly delayed after the previous)
- [ ] Hovering a project tile shows the mouse-following spotlight glow
- [ ] Hovering a project tile lifts it slightly (`-translate-y-0.5`, `scale(1.015)`)
- [ ] Font is visibly Outfit (rounder letterforms vs Inter)
- [ ] Header has frosted glass effect (slight blur over background)
- [ ] Responsive: on narrow viewport, cards collapse to 1 column

- [ ] **Step 8.3: Check reduced-motion**

In browser DevTools → Rendering → "Emulate CSS media feature prefers-reduced-motion: reduce".

Check:
- [ ] Aurora bands are frozen (no movement)
- [ ] Particles are hidden or static
- [ ] BlurFade shows content immediately without animation

- [ ] **Step 8.4: Final commit if any fixes needed**

```bash
git add -p  # stage only intentional changes
git commit -m "fix: address smoke test issues"
```
