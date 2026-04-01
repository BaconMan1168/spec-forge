# Homepage & Public Navbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a public marketing homepage at `/` with a floating pill navbar (tube light effect), animated shape background, and five content sections — replacing the current `/` redirect.

**Architecture:** A new `(marketing)` route group provides a public layout (no auth required). `proxy.ts` is updated to allow `/` and `/pricing` as public paths. The marketing layer is fully decoupled from the authenticated app shell. All animated components are client components; page files are server components.

**Tech Stack:** Next.js 15 App Router, React 19, `motion/react` (framer-motion), Tailwind v4 CSS vars, Vitest + Testing Library, pnpm

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Modify | `proxy.ts` | Add `/` and `/pricing` to public paths |
| Create | `components/marketing/elegant-shape.tsx` | Single animated pill shape (21st.dev pattern) |
| Create | `components/marketing/elegant-shape.test.tsx` | Tests |
| Create | `components/marketing/shapes-background.tsx` | Fixed layer composing 5 ElegantShapes |
| Create | `components/marketing/shapes-background.test.tsx` | Tests |
| Create | `components/nav/public-navbar.tsx` | Floating pill navbar, tube light, sliding arrow CTA |
| Create | `components/nav/public-navbar.test.tsx` | Tests |
| Create | `app/(marketing)/layout.tsx` | Public layout — auth redirect + PublicNavbar |
| Create | `app/(marketing)/page.tsx` | Homepage — assembles section components |
| Create | `components/marketing/hero-section.tsx` | Hero with entry animations |
| Create | `components/marketing/hero-section.test.tsx` | Tests |
| Create | `components/marketing/capabilities-section.tsx` | 3 capability rows with scroll reveal |
| Create | `components/marketing/capabilities-section.test.tsx` | Tests |
| Create | `components/marketing/how-it-works-section.tsx` | Vertical timeline, 3 steps |
| Create | `components/marketing/how-it-works-section.test.tsx` | Tests |
| Create | `components/marketing/pricing-section.tsx` | Pricing card with scroll reveal |
| Create | `components/marketing/pricing-section.test.tsx` | Tests |
| Create | `components/marketing/cta-section.tsx` | Final CTA + footer |
| Create | `components/marketing/cta-section.test.tsx` | Tests |
| Create | `app/(marketing)/pricing/page.tsx` | Pricing stub page |
| Delete | `app/page.tsx` | Replaced by `(marketing)/page.tsx` |

---

## Task 1: Fix proxy.ts — allow marketing routes

**Files:**
- Modify: `proxy.ts`

- [ ] **Step 1: Update `isPublicPath` to include marketing routes**

```ts
// proxy.ts — update only this line
const isPublicPath =
  pathname === "/" ||
  pathname.startsWith("/pricing") ||
  pathname.startsWith("/login") ||
  pathname.startsWith("/auth");
```

- [ ] **Step 2: Run existing tests to confirm nothing breaks**

```bash
pnpm test --run
```

Expected: all existing tests pass.

- [ ] **Step 3: Commit**

```bash
git add proxy.ts
git commit -m "fix: allow / and /pricing as public paths in proxy"
```

---

## Task 2: ElegantShape component

Replicates the 21st.dev Shape Landing Hero `ElegantShape` component exactly. Colors are swapped to SpecForge design tokens; all other parameters (border-radius, animation timing, float) match the original.

**Files:**
- Create: `components/marketing/elegant-shape.tsx`
- Create: `components/marketing/elegant-shape.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/marketing/elegant-shape.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

// Mock framer-motion so animations don't run in jsdom
vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div"), span: make("span") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { ElegantShape } from "./elegant-shape";

describe("ElegantShape", () => {
  it("renders a container div", () => {
    const { container } = render(
      <ElegantShape width={600} height={140} rotate={12} gradient="from-analog-2/15" />
    );
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with default props without crashing", () => {
    const { container } = render(<ElegantShape />);
    expect(container.firstChild).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --run components/marketing/elegant-shape.test.tsx
```

Expected: FAIL — `Cannot find module './elegant-shape'`

- [ ] **Step 3: Implement ElegantShape**

```tsx
// components/marketing/elegant-shape.tsx
"use client";

import { cn } from "@/lib/utils";
import { motion } from "motion/react";

interface ElegantShapeProps {
  className?: string;
  delay?: number;
  width?: number;
  height?: number;
  rotate?: number;
  gradient?: string;
}

export function ElegantShape({
  className,
  delay = 0,
  width = 400,
  height = 100,
  rotate = 0,
  gradient = "from-[var(--color-analog-2)]/15",
}: ElegantShapeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -150, rotate: rotate - 15 }}
      animate={{ opacity: 1, y: 0, rotate }}
      transition={{
        duration: 2.4,
        delay,
        ease: [0.23, 0.86, 0.39, 0.96],
        opacity: { duration: 1.2, delay },
      }}
      className={cn("absolute", className)}
    >
      <motion.div
        animate={{ y: [0, 15, 0] }}
        transition={{
          duration: 12,
          delay: delay + 2.4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        style={{ width, height }}
        className="relative"
      >
        <div
          className={cn(
            "absolute inset-0 rounded-full",
            "bg-gradient-to-r to-transparent",
            gradient,
            "border-2 border-white/[0.13]",
            "backdrop-blur-[2px]",
            "shadow-[0_8px_32px_0_hsla(220,50%,60%,0.07)]",
            "after:absolute after:inset-0 after:rounded-full",
            "after:bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.08),transparent_70%)]"
          )}
        />
      </motion.div>
    </motion.div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --run components/marketing/elegant-shape.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/marketing/elegant-shape.tsx components/marketing/elegant-shape.test.tsx
git commit -m "feat: add ElegantShape component (21st.dev shape landing hero pattern)"
```

---

## Task 3: ShapesBackground component

Fixed-position layer with 5 `ElegantShape` instances matching the spec positions, colors, and sizes.

**Files:**
- Create: `components/marketing/shapes-background.tsx`
- Create: `components/marketing/shapes-background.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/marketing/shapes-background.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { ShapesBackground } from "./shapes-background";

describe("ShapesBackground", () => {
  it("renders the fixed background wrapper", () => {
    const { container } = render(<ShapesBackground />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper).toBeTruthy();
    expect(wrapper.tagName).toBe("DIV");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --run components/marketing/shapes-background.test.tsx
```

Expected: FAIL — `Cannot find module './shapes-background'`

- [ ] **Step 3: Implement ShapesBackground**

```tsx
// components/marketing/shapes-background.tsx
"use client";

import { ElegantShape } from "./elegant-shape";

export function ShapesBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {/* Shape 1 — analog-2, 600×140, rotate 12° */}
      <ElegantShape
        delay={0.3}
        width={600}
        height={140}
        rotate={12}
        gradient="from-[var(--color-analog-2)]/15"
        className="left-[-5%] top-[20%]"
      />
      {/* Shape 2 — analog-3, 500×120, rotate -15° */}
      <ElegantShape
        delay={0.5}
        width={500}
        height={120}
        rotate={-15}
        gradient="from-[var(--color-analog-3)]/15"
        className="right-[0%] top-[75%]"
      />
      {/* Shape 3 — analog-1, 300×80, rotate -8° */}
      <ElegantShape
        delay={0.4}
        width={300}
        height={80}
        rotate={-8}
        gradient="from-[var(--color-analog-1)]/15"
        className="bottom-[10%] left-[10%]"
      />
      {/* Shape 4 — accent-primary, 200×60, rotate 20° */}
      <ElegantShape
        delay={0.6}
        width={200}
        height={60}
        rotate={20}
        gradient="from-[var(--color-accent-primary)]/[0.12]"
        className="right-[20%] top-[15%]"
      />
      {/* Shape 5 — analog-1, 150×40, rotate -25° */}
      <ElegantShape
        delay={0.7}
        width={150}
        height={40}
        rotate={-25}
        gradient="from-[var(--color-analog-1)]/[0.11]"
        className="left-[25%] top-[10%]"
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --run components/marketing/shapes-background.test.tsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/marketing/shapes-background.tsx components/marketing/shapes-background.test.tsx
git commit -m "feat: add ShapesBackground component with 5 fixed ElegantShapes"
```

---

## Task 4: PublicNavbar component

Floating pill, centered, `position: fixed`. Tube light amber glow above active link. "Get Started" CTA with sliding arrow that expands horizontally on hover (no reserved empty space).

**Files:**
- Create: `components/nav/public-navbar.tsx`
- Create: `components/nav/public-navbar.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/nav/public-navbar.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn().mockReturnValue("/"),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div"), nav: make("nav") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

// Mock SpecForgeLogo since it has no deps
vi.mock("@/components/nav/spec-forge-logo", () => ({
  SpecForgeLogo: () => <div data-testid="spec-forge-logo" />,
}));

import { PublicNavbar } from "./public-navbar";

describe("PublicNavbar", () => {
  it("renders the SpecForge logo", () => {
    render(<PublicNavbar />);
    expect(screen.getByTestId("spec-forge-logo")).toBeInTheDocument();
  });

  it("renders Home and Pricing nav links", () => {
    render(<PublicNavbar />);
    expect(screen.getByRole("link", { name: /home/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /pricing/i })).toBeInTheDocument();
  });

  it("links Pricing to /pricing", () => {
    render(<PublicNavbar />);
    const pricingLink = screen.getByRole("link", { name: /pricing/i });
    expect(pricingLink).toHaveAttribute("href", "/pricing");
  });

  it("links Sign In to /login", () => {
    render(<PublicNavbar />);
    const signInLink = screen.getByRole("link", { name: /sign in/i });
    expect(signInLink).toHaveAttribute("href", "/login");
  });

  it("links Get Started to /login", () => {
    render(<PublicNavbar />);
    const getStarted = screen.getByRole("link", { name: /get started/i });
    expect(getStarted).toHaveAttribute("href", "/login");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --run components/nav/public-navbar.test.tsx
```

Expected: FAIL — `Cannot find module './public-navbar'`

- [ ] **Step 3: Implement PublicNavbar**

```tsx
// components/nav/public-navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { SpecForgeLogo } from "@/components/nav/spec-forge-logo";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Pricing", href: "/pricing" },
];

export function PublicNavbar() {
  const pathname = usePathname();

  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[200] flex justify-center pt-6">
      <motion.nav
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-auto inline-flex items-center gap-0.5 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-1)]/88 px-1.5 py-1.5 shadow-[var(--shadow-2)] backdrop-blur-[20px]"
      >
        {/* Brand */}
        <Link
          href="/"
          className="mr-1 flex items-center gap-2 rounded-[var(--radius-pill)] px-3 py-1.5 text-[15px] font-semibold text-[var(--color-text-primary)]"
        >
          <SpecForgeLogo />
          SpecForge
        </Link>

        <div
          aria-hidden="true"
          className="mx-1 h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
        />

        {/* Nav links */}
        {NAV_LINKS.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "relative rounded-[var(--radius-pill)] px-5 py-2 text-sm font-medium transition-colors duration-[180ms]",
                isActive
                  ? "bg-[var(--color-surface-0)] text-[var(--color-accent-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-0)] hover:text-[var(--color-text-primary)]"
              )}
            >
              {/* Tube light */}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute left-1/2 top-[-3px] h-1 w-8 -translate-x-1/2 rounded-b-sm bg-[var(--color-accent-primary)]"
                  style={{
                    boxShadow:
                      "0 0 12px 4px hsla(40,85%,58%,0.5), 0 12px 28px 2px hsla(40,85%,58%,0.15)",
                  }}
                />
              )}
              {link.name}
            </Link>
          );
        })}

        <div
          aria-hidden="true"
          className="mx-1 h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
        />

        {/* Sign In */}
        <Link
          href="/login"
          className="rounded-[var(--radius-pill)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-[180ms] hover:bg-[var(--color-surface-0)] hover:text-[var(--color-text-primary)]"
        >
          Sign In
        </Link>

        {/* Get Started — arrow expands on hover, no empty space at rest */}
        <Link
          href="/login"
          className="group ml-1 inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-5 py-2 text-sm font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_4px_16px_hsla(40,85%,58%,0.35)]"
        >
          Get Started
          <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
            →
          </span>
        </Link>
      </motion.nav>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --run components/nav/public-navbar.test.tsx
```

Expected: all 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/nav/public-navbar.tsx components/nav/public-navbar.test.tsx
git commit -m "feat: add PublicNavbar with floating pill, tube light, and sliding arrow CTA"
```

---

## Task 5: Marketing layout + route group

**Files:**
- Create: `app/(marketing)/layout.tsx`

No test file — this is a Next.js server component layout. Auth behavior is covered by the proxy.ts change in Task 1. Manual verification is the right approach here.

- [ ] **Step 1: Create the marketing layout**

```tsx
// app/(marketing)/layout.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PublicNavbar } from "@/components/nav/public-navbar";
import { ShapesBackground } from "@/components/marketing/shapes-background";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect("/dashboard");

  return (
    <div className="relative min-h-screen bg-[var(--color-bg-0)]">
      <ShapesBackground />
      <PublicNavbar />
      <div className="relative z-10">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint and typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/layout.tsx"
git commit -m "feat: add marketing route group layout with auth redirect"
```

---

## Task 6: Hero section

Entry animations: badge fades up (1s, 400ms delay), line 1 slides from left (1s, 600ms delay), line 2 slides from right (1s, 850ms delay), bottom row fades up (1s, 1200ms delay). Headline is 112px, left/right staggered alignment.

**Files:**
- Create: `components/marketing/hero-section.tsx`
- Create: `components/marketing/hero-section.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/marketing/hero-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div"), span: make("span") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

import { HeroSection } from "./hero-section";

describe("HeroSection", () => {
  it("renders the main headline text", () => {
    render(<HeroSection />);
    expect(screen.getByText("From Raw Feedback")).toBeInTheDocument();
    expect(screen.getByText("to Actionable Specs")).toBeInTheDocument();
  });

  it("renders the early access badge", () => {
    render(<HeroSection />);
    expect(screen.getByText(/early access/i)).toBeInTheDocument();
  });

  it("renders Start for Free button linking to /login", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /start for free/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders See How It Works anchor", () => {
    render(<HeroSection />);
    const link = screen.getByRole("link", { name: /see how it works/i });
    expect(link).toHaveAttribute("href", "#how-it-works");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --run components/marketing/hero-section.test.tsx
```

Expected: FAIL — `Cannot find module './hero-section'`

- [ ] **Step 3: Implement HeroSection**

```tsx
// components/marketing/hero-section.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;

export function HeroSection() {
  return (
    <section className="relative z-10 mx-auto min-h-screen max-w-[1200px] px-16 pb-[120px] pt-[160px] flex items-center">
      {/* Subtle radial tint behind text */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 20% 50%, hsla(220,55%,45%,0.07) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 50%, hsla(40,85%,58%,0.04) 0%, transparent 70%)",
        }}
      />

      <div className="w-full">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: EASE }}
          className="mb-12 inline-flex items-center gap-2 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)]/70 px-4 py-1.5 text-[13px] text-[var(--color-text-secondary)]"
        >
          <span
            aria-hidden="true"
            className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-accent-primary)]"
            style={{ boxShadow: "0 0 8px hsla(40,85%,58%,0.7)" }}
          />
          Now in Early Access
        </motion.div>

        {/* Staggered headline — line 1 left, line 2 right */}
        <div className="mb-14">
          <motion.span
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: EASE }}
            className="block text-left text-[112px] font-bold leading-[0.98] tracking-[-0.035em]"
            style={{
              background: "linear-gradient(to bottom, var(--color-text-primary) 30%, hsl(220 10% 70%))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            From Raw Feedback
          </motion.span>
          <motion.span
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1, delay: 0.85, ease: EASE }}
            className="block text-right text-[112px] font-bold leading-[0.98] tracking-[-0.035em]"
            style={{
              background:
                "linear-gradient(90deg, var(--color-analog-1) 0%, var(--color-text-primary) 40%, var(--color-accent-primary) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            to Actionable Specs
          </motion.span>
        </div>

        {/* Bottom row: subtext left, CTAs right */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.2, ease: EASE }}
          className="flex items-end justify-between gap-16"
        >
          <p className="max-w-[440px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]">
            Upload customer interviews and feedback. SpecForge synthesizes
            insights and generates structured feature proposals — ready to paste
            into Cursor or Claude Code.
          </p>

          <div className="flex flex-shrink-0 items-center gap-3.5">
            {/* Start for Free — expanding arrow */}
            <Link
              href="/login"
              className="group inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-9 py-[18px] text-[17px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
            >
              Start for Free
              <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                →
              </span>
            </Link>

            {/* See How It Works — scroll anchor */}
            <Link
              href="#how-it-works"
              className="inline-flex cursor-pointer items-center rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-8 py-[18px] text-[17px] font-medium text-[var(--color-text-secondary)] transition-[background-color,border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]"
            >
              See How It Works
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --run components/marketing/hero-section.test.tsx
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/marketing/hero-section.tsx components/marketing/hero-section.test.tsx
git commit -m "feat: add HeroSection with staggered entry animations"
```

---

## Task 7: Capabilities section

Three full-width two-column rows. Left column: icon + large title (slides in from left on scroll). Right column: description + tags (slides in from right on scroll, 300ms delay).

**Files:**
- Create: `components/marketing/capabilities-section.tsx`
- Create: `components/marketing/capabilities-section.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/marketing/capabilities-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { CapabilitiesSection } from "./capabilities-section";

describe("CapabilitiesSection", () => {
  it("renders the section heading", () => {
    render(<CapabilitiesSection />);
    expect(screen.getByText(/everything you need/i)).toBeInTheDocument();
  });

  it("renders all three capability titles", () => {
    render(<CapabilitiesSection />);
    expect(screen.getByText(/multi-source ingestion/i)).toBeInTheDocument();
    expect(screen.getByText(/ai-powered synthesis/i)).toBeInTheDocument();
    expect(screen.getByText(/exportable proposals/i)).toBeInTheDocument();
  });

  it("renders file type tags", () => {
    render(<CapabilitiesSection />);
    expect(screen.getByText(".pdf")).toBeInTheDocument();
    expect(screen.getByText(".docx")).toBeInTheDocument();
    expect(screen.getByText(".json")).toBeInTheDocument();
    expect(screen.getByText(".md")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --run components/marketing/capabilities-section.test.tsx
```

Expected: FAIL — `Cannot find module './capabilities-section'`

- [ ] **Step 3: Implement CapabilitiesSection**

```tsx
// components/marketing/capabilities-section.tsx
"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_LEFT = {
  initial: { opacity: 0, x: -36 },
  whileInView: { opacity: 1, x: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, ease: EASE },
} as const;

const REVEAL_RIGHT = {
  initial: { opacity: 0, x: 36 },
  whileInView: { opacity: 1, x: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay: 0.3, ease: EASE },
} as const;

const REVEAL_UP = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
} as const;

// Upload icon
function UploadIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

// Sparkle / star icon
function SparkleIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}

// Share / export icon
function ExportIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8"/>
      <polyline points="16 6 12 2 8 6"/>
      <line x1="12" y1="2" x2="12" y2="15"/>
    </svg>
  );
}

const FILE_TAGS = [".txt", ".pdf", ".docx", ".json", ".md", "Paste text"];

export function CapabilitiesSection() {
  return (
    <section id="capabilities" className="relative z-10 mx-auto max-w-[1200px] px-16 py-[120px]">
      {/* Section intro */}
      <motion.p
        {...REVEAL_UP}
        transition={{ duration: 1.2, ease: EASE }}
        className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]"
      >
        Capabilities
      </motion.p>
      <motion.h2
        {...REVEAL_UP}
        transition={{ duration: 1.2, delay: 0.3, ease: EASE }}
        className="mb-6 max-w-[820px] text-[76px] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        Everything you need to go
        <br />
        from discovery to delivery
      </motion.h2>
      <motion.p
        {...REVEAL_UP}
        transition={{ duration: 1.2, delay: 0.6, ease: EASE }}
        className="mb-24 max-w-[500px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
      >
        No more manual synthesis. SpecForge turns messy qualitative feedback
        into structured, evidence-backed specs in minutes.
      </motion.p>

      {/* Capability 1 — Multi-Source Ingestion */}
      <div className="grid grid-cols-2 gap-20 border-t border-[var(--color-border-subtle)] py-20">
        <motion.div {...REVEAL_LEFT}>
          <div className="mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-analog-2)]">
            <UploadIcon />
          </div>
          <h3 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em]">
            Multi-Source
            <br />
            Ingestion
          </h3>
        </motion.div>
        <motion.div {...REVEAL_RIGHT} className="pt-2">
          <p className="mb-7 text-[18px] leading-[1.8] text-[var(--color-text-secondary)]">
            Upload files or paste raw text from any source. Every file type your
            workflow already uses is supported — no reformatting required.
          </p>
          <div className="flex flex-wrap gap-2">
            {FILE_TAGS.map((tag) => (
              <span
                key={tag}
                className="rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3.5 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)]"
              >
                {tag}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Capability 2 — AI-Powered Synthesis */}
      <div className="grid grid-cols-2 gap-20 border-t border-[var(--color-border-subtle)] py-20">
        <motion.div {...REVEAL_LEFT}>
          <div className="mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-analog-2)]">
            <SparkleIcon />
          </div>
          <h3 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em]">
            AI-Powered
            <br />
            Synthesis
          </h3>
        </motion.div>
        <motion.div {...REVEAL_RIGHT} className="pt-2">
          <p className="text-[18px] leading-[1.8] text-[var(--color-text-secondary)]">
            Identify recurring themes and pain points across all your inputs.
            Every surfaced insight is backed by direct customer quotes —
            grounded in your actual source material, never hallucinated.
          </p>
        </motion.div>
      </div>

      {/* Capability 3 — Exportable Proposals */}
      <div className="grid grid-cols-2 gap-20 border-t border-[var(--color-border-subtle)] py-20">
        <motion.div {...REVEAL_LEFT}>
          <div className="mb-7 flex h-[52px] w-[52px] items-center justify-center rounded-[16px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[var(--color-analog-2)]">
            <ExportIcon />
          </div>
          <h3 className="text-[48px] font-bold leading-[1.1] tracking-[-0.025em]">
            Exportable
            <br />
            Proposals
          </h3>
        </motion.div>
        <motion.div {...REVEAL_RIGHT} className="pt-2">
          <p className="text-[18px] leading-[1.8] text-[var(--color-text-secondary)]">
            Generate structured feature proposals with problem statements,
            evidence, and engineering task breakdowns. Export as Markdown and
            send directly to Cursor, Claude Code, ChatGPT, Gemini, or any
            coding agent — or share with your team instantly.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --run components/marketing/capabilities-section.test.tsx
```

Expected: all 3 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/marketing/capabilities-section.tsx components/marketing/capabilities-section.test.tsx
git commit -m "feat: add CapabilitiesSection with 3 scroll-revealed rows"
```

---

## Task 8: How It Works section

Vertical timeline. Large numbered circles (108px) on the left with a connector line. Each step's number, title, and description reveal independently on scroll.

**Files:**
- Create: `components/marketing/how-it-works-section.tsx`
- Create: `components/marketing/how-it-works-section.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// components/marketing/how-it-works-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

import { HowItWorksSection } from "./how-it-works-section";

describe("HowItWorksSection", () => {
  it("renders the section heading", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText(/three steps/i)).toBeInTheDocument();
  });

  it("renders step numbers 1, 2, 3", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("renders all step titles", () => {
    render(<HowItWorksSection />);
    expect(screen.getByText("Upload Feedback")).toBeInTheDocument();
    expect(screen.getByText("Run Analysis")).toBeInTheDocument();
    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });

  it("has an id for the scroll anchor", () => {
    const { container } = render(<HowItWorksSection />);
    expect(container.querySelector("#how-it-works")).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test --run components/marketing/how-it-works-section.test.tsx
```

Expected: FAIL — `Cannot find module './how-it-works-section'`

- [ ] **Step 3: Implement HowItWorksSection**

```tsx
// components/marketing/how-it-works-section.tsx
"use client";

import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay, ease: EASE },
});

const STEPS = [
  {
    num: "1",
    title: "Upload Feedback",
    desc: "Add files or paste text from interviews, surveys, support tickets, or Slack exports. Label each input by source type — interview, survey, support ticket — so the AI can weight insights appropriately across your entire corpus.",
  },
  {
    num: "2",
    title: "Run Analysis",
    desc: "SpecForge reads all your inputs simultaneously, surfaces recurring patterns, and attaches direct customer quotes to each theme as evidence. No hallucination — every insight traces back to something a real user said.",
  },
  {
    num: "3",
    title: "Export & Build",
    desc: "Copy or download your proposals as Markdown and paste directly into Cursor, Claude Code, or any AI coding agent. Full problem statement, supporting evidence, and atomic engineering tasks — ready to hand to a builder.",
  },
] as const;

export function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative z-10 mx-auto max-w-[1200px] px-16 py-[120px]"
    >
      {/* Intro */}
      <motion.p
        {...REVEAL_UP(0)}
        className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]"
      >
        How it works
      </motion.p>
      <motion.h2
        {...REVEAL_UP(0.3)}
        className="mb-6 max-w-[700px] text-[76px] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        Three steps from
        <br />
        feedback to spec
      </motion.h2>
      <motion.p
        {...REVEAL_UP(0.6)}
        className="mb-24 max-w-[480px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
      >
        The fastest path from raw discovery input to an AI-ready engineering
        spec.
      </motion.p>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line */}
        <div
          aria-hidden="true"
          className="absolute left-[53px] top-[100px] bottom-[100px] w-px"
          style={{
            background:
              "linear-gradient(to bottom, transparent, var(--color-border-subtle) 10%, var(--color-border-subtle) 90%, transparent)",
          }}
        />

        {STEPS.map((step, i) => (
          <div
            key={step.num}
            className="grid grid-cols-[108px_1fr] gap-14 py-[72px]"
          >
            {/* Number circle */}
            <motion.div
              {...REVEAL_UP(i * 0.15)}
              className="relative z-10 flex h-[108px] w-[108px] flex-shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] text-[44px] font-bold text-[var(--color-accent-primary)] transition-[border-color,box-shadow,background-color] duration-[400ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[hsla(40,85%,58%,0.5)] hover:bg-[var(--color-surface-1)] hover:shadow-[0_0_32px_hsla(40,85%,58%,0.18)]"
            >
              {step.num}
            </motion.div>

            {/* Text */}
            <div className="pt-5">
              <motion.h3
                {...REVEAL_UP(i * 0.15 + 0.15)}
                className="mb-5 text-[40px] font-bold leading-[1.1] tracking-[-0.02em] text-[var(--color-text-primary)]"
              >
                {step.title}
              </motion.h3>
              <motion.p
                {...REVEAL_UP(i * 0.15 + 0.3)}
                className="max-w-[640px] text-[18px] leading-[1.8] text-[var(--color-text-secondary)]"
              >
                {step.desc}
              </motion.p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test --run components/marketing/how-it-works-section.test.tsx
```

Expected: all 4 tests PASS

- [ ] **Step 5: Commit**

```bash
git add components/marketing/how-it-works-section.tsx components/marketing/how-it-works-section.test.tsx
git commit -m "feat: add HowItWorksSection with vertical timeline and scroll reveal"
```

---

## Task 9: Pricing section + CTA + footer

Pricing card: no top accent border, wrapped in a reveal div so the card's own hover transition doesn't override scroll animation. CTA: large heading + two buttons. Footer: minimal brand + links.

**Files:**
- Create: `components/marketing/pricing-section.tsx`
- Create: `components/marketing/pricing-section.test.tsx`
- Create: `components/marketing/cta-section.tsx`
- Create: `components/marketing/cta-section.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// components/marketing/pricing-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

import { PricingSection } from "./pricing-section";

describe("PricingSection", () => {
  it("renders the pricing heading", () => {
    render(<PricingSection />);
    expect(screen.getByText(/simple, transparent pricing/i)).toBeInTheDocument();
  });

  it("renders the $0 price", () => {
    render(<PricingSection />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders Get Early Access button linking to /login", () => {
    render(<PricingSection />);
    const link = screen.getByRole("link", { name: /get early access/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders the pricing details link to /pricing", () => {
    render(<PricingSection />);
    const link = screen.getByRole("link", { name: /full pricing details/i });
    expect(link).toHaveAttribute("href", "/pricing");
  });
});
```

```tsx
// components/marketing/cta-section.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial","animate","exit","transition","whileInView",
      "viewport","whileHover","whileTap","layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as keyof JSX.IntrinsicElements, stripMotionProps(rest), children as React.ReactNode);
  return {
    motion: { div: make("div") },
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => <a href={href} className={className}>{children}</a>,
}));

import { CtaSection } from "./cta-section";

describe("CtaSection", () => {
  it("renders the CTA heading", () => {
    render(<CtaSection />);
    expect(screen.getByText(/ready to ship faster/i)).toBeInTheDocument();
  });

  it("renders Start for Free linking to /login", () => {
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: /start for free/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders Sign In linking to /login", () => {
    render(<CtaSection />);
    const link = screen.getByRole("link", { name: /sign in/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders footer with SpecForge brand", () => {
    render(<CtaSection />);
    // Footer is rendered inside CtaSection
    expect(screen.getByText("SpecForge")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test --run components/marketing/pricing-section.test.tsx components/marketing/cta-section.test.tsx
```

Expected: FAIL — modules not found

- [ ] **Step 3: Implement PricingSection**

```tsx
// components/marketing/pricing-section.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay, ease: EASE },
});

function CheckIcon() {
  return (
    <svg
      className="flex-shrink-0 text-[var(--color-accent-primary)]"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const FEATURES = [
  "Unlimited projects",
  "All file types (.txt, .pdf, .docx, .json, .md)",
  "AI synthesis + proposal generation",
  "Markdown export to any coding agent",
  "Priority feedback channel",
];

export function PricingSection() {
  return (
    <section className="relative z-10 mx-auto max-w-[1200px] px-16 py-[120px] text-center">
      <motion.p
        {...REVEAL_UP(0)}
        className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]"
      >
        Pricing
      </motion.p>
      <motion.h2
        {...REVEAL_UP(0.3)}
        className="mb-6 text-[76px] font-bold leading-[1.05] tracking-[-0.03em]"
      >
        Simple, transparent pricing
      </motion.h2>
      <motion.p
        {...REVEAL_UP(0.6)}
        className="mx-auto mb-[72px] max-w-[480px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
      >
        One plan, no surprises. Full access while we build with early users.
      </motion.p>

      {/* Reveal wrapper separate from card so hover transition doesn't override scroll animation */}
      <motion.div {...REVEAL_UP(0.9)} className="mx-auto max-w-[580px]">
        <div className="rounded-[28px] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-14 text-center transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
          <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
            Early Access
          </p>
          <div className="mb-2.5 text-[64px] font-bold leading-none text-[var(--color-text-primary)]">
            $0{" "}
            <span className="text-[22px] font-normal text-[var(--color-text-tertiary)]">
              / month
            </span>
          </div>
          <p className="mb-10 text-[15px] text-[var(--color-text-tertiary)]">
            Free during beta. No credit card required.
          </p>
          <ul className="mb-11 flex flex-col gap-4 text-left">
            {FEATURES.map((f) => (
              <li key={f} className="flex items-center gap-3 text-[15px] text-[var(--color-text-secondary)]">
                <CheckIcon />
                {f}
              </li>
            ))}
          </ul>
          <Link
            href="/login"
            className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[18px] text-[16px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
          >
            Get Early Access
            <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
              →
            </span>
          </Link>
          <Link
            href="/pricing"
            className="mt-4 block text-[13px] text-[var(--color-text-tertiary)] underline transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]"
          >
            View full pricing details →
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
```

- [ ] **Step 4: Implement CtaSection**

```tsx
// components/marketing/cta-section.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const REVEAL_UP = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.2, delay, ease: EASE },
});

export function CtaSection() {
  return (
    <>
      {/* Final CTA */}
      <section className="relative z-10 overflow-hidden border-t border-[hsl(220_10%_14%)] px-16 py-[140px] text-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2"
          style={{
            background:
              "radial-gradient(ellipse at center, hsla(220,55%,50%,0.07) 0%, transparent 70%)",
          }}
        />
        <motion.h2
          {...REVEAL_UP(0)}
          className="relative mb-6 text-[80px] font-bold leading-[1.05] tracking-[-0.03em]"
        >
          Ready to ship faster?
        </motion.h2>
        <motion.p
          {...REVEAL_UP(0.3)}
          className="relative mx-auto mb-14 max-w-[420px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]"
        >
          Join early users turning raw customer feedback into AI-ready specs in
          minutes.
        </motion.p>
        <motion.div
          {...REVEAL_UP(0.6)}
          className="relative flex items-center justify-center gap-4"
        >
          <Link
            href="/login"
            className="group inline-flex cursor-pointer items-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-9 py-[18px] text-[17px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
          >
            Start for Free
            <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
              →
            </span>
          </Link>
          <Link
            href="/login"
            className="inline-flex cursor-pointer items-center rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-8 py-[18px] text-[17px] font-medium text-[var(--color-text-secondary)] transition-[background-color,border-color,color] duration-[180ms] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]"
          >
            Sign In
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 mx-auto flex max-w-[1200px] items-center justify-between px-16 py-12 border-t border-[hsl(220_10%_13%)]">
        <div className="flex items-center gap-2 text-[14px] font-semibold text-[var(--color-text-secondary)]">
          <div
            aria-hidden="true"
            className="h-[18px] w-[18px] flex-shrink-0"
            style={{
              background:
                "linear-gradient(135deg, hsl(220 55% 40%), hsl(240 55% 50%))",
              clipPath:
                "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",
            }}
          />
          SpecForge
        </div>
        <nav className="flex gap-7 text-[13px] text-[var(--color-text-tertiary)]">
          <Link href="/" className="transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]">Home</Link>
          <Link href="/pricing" className="transition-colors duration-[180ms] hover:text-[var(--color-text-secondary)]">Pricing</Link>
          <span className="cursor-default">Privacy</span>
          <span className="cursor-default">Terms</span>
        </nav>
        <p className="text-[12px] text-[hsl(220_6%_32%)]">
          © 2026 SpecForge. All rights reserved.
        </p>
      </footer>
    </>
  );
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test --run components/marketing/pricing-section.test.tsx components/marketing/cta-section.test.tsx
```

Expected: all 7 tests PASS

- [ ] **Step 6: Commit**

```bash
git add components/marketing/pricing-section.tsx components/marketing/pricing-section.test.tsx components/marketing/cta-section.tsx components/marketing/cta-section.test.tsx
git commit -m "feat: add PricingSection and CtaSection components"
```

---

## Task 10: Homepage page + delete app/page.tsx

The page is a server component — it just renders the section components in order separated by dividers.

**Files:**
- Create: `app/(marketing)/page.tsx`
- Delete: `app/page.tsx`

- [ ] **Step 1: Create the homepage**

```tsx
// app/(marketing)/page.tsx
import { HeroSection } from "@/components/marketing/hero-section";
import { CapabilitiesSection } from "@/components/marketing/capabilities-section";
import { HowItWorksSection } from "@/components/marketing/how-it-works-section";
import { PricingSection } from "@/components/marketing/pricing-section";
import { CtaSection } from "@/components/marketing/cta-section";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <div className="relative z-10 mx-auto max-w-[1100px] h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      <CapabilitiesSection />
      <div className="relative z-10 mx-auto max-w-[1100px] h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      <HowItWorksSection />
      <div className="relative z-10 mx-auto max-w-[1100px] h-px bg-gradient-to-r from-transparent via-[var(--color-border-subtle)] to-transparent" />
      <PricingSection />
      <CtaSection />
    </>
  );
}
```

- [ ] **Step 2: Delete the old redirect page**

```bash
git rm app/page.tsx
```

- [ ] **Step 3: Run lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add "app/(marketing)/page.tsx"
git commit -m "feat: add homepage and remove old / redirect"
```

---

## Task 11: Pricing page stub

**Files:**
- Create: `app/(marketing)/pricing/page.tsx`

- [ ] **Step 1: Create the pricing page stub**

```tsx
// app/(marketing)/pricing/page.tsx
export default function PricingPage() {
  return (
    <main className="relative z-10 mx-auto max-w-[1200px] px-16 pb-[120px] pt-[160px]">
      <h1 className="mb-6 text-[76px] font-bold leading-[1.05] tracking-[-0.03em]">
        Pricing
      </h1>
      <p className="text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]">
        Full pricing details coming soon.
      </p>
    </main>
  );
}
```

- [ ] **Step 2: Run lint + typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(marketing)/pricing/page.tsx"
git commit -m "feat: add pricing page stub"
```

---

## Task 12: Full validation

- [ ] **Step 1: Run the full test suite**

```bash
pnpm test --run
```

Expected: all tests pass, including all pre-existing tests from plans 1–7.

- [ ] **Step 2: Run lint and typecheck**

```bash
pnpm lint && pnpm typecheck
```

Expected: no errors.

- [ ] **Step 3: Smoke test in browser**

Start dev server:
```bash
pnpm dev
```

Verify:
- `http://localhost:3000/` — homepage loads, shapes animate in, navbar drops in
- Navbar: Home tube light active, Pricing links to `/pricing`, Sign In + Get Started link to `/login`, arrow expands on hover
- Hero: staggered headline entry, expanding-arrow CTA buttons
- Scrolling: each section reveals on scroll with 1200ms fade
- `http://localhost:3000/pricing` — pricing stub renders with public navbar
- Visiting `/` while authenticated redirects to `/dashboard`

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: final validation pass — homepage and public navbar complete"
```
