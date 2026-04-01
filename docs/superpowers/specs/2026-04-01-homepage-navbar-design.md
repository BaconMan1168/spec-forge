# Homepage & Public Navbar — Design Spec

**Date:** 2026-04-01
**Status:** Approved

---

## Overview

Two new surfaces for the public-facing marketing layer of SpecForge:

1. **Public Navbar** — a floating pill navbar shown on all marketing pages (`/`, `/pricing`). Separate from the authenticated app navbar (`components/nav/navbar.tsx`).
2. **Homepage** — a marketing landing page at `/` replacing the current redirect to `/dashboard`. Five sections: Hero, Capabilities, How It Works, Pricing teaser, Final CTA.

Authenticated users visiting `/` should still be redirected to `/dashboard`. Unauthenticated users see the landing page.

---

## Routing Architecture

A new `(marketing)` route group isolates the public pages from the authenticated app shell.

```
app/
  (marketing)/
    layout.tsx          ← public layout: renders PublicNavbar, no auth check
    page.tsx            ← homepage (replaces current app/page.tsx redirect)
    pricing/
      page.tsx          ← full pricing page (linked from navbar + homepage teaser)
  (app)/
    layout.tsx          ← existing authenticated shell (unchanged)
    ...
```

The current `app/page.tsx` (which just redirects) is removed. Auth redirect logic moves into `(marketing)/layout.tsx` — if the user is authenticated, redirect to `/dashboard`; otherwise render the marketing page.

---

## Public Navbar — `PublicNavbar`

**Component path:** `components/nav/public-navbar.tsx`

### Layout

Floating pill, centered, `position: fixed`, `top: 24px`, `z-index: 200`. Drops in on page load (fade + translateY from -14px, 700ms, 200ms delay).

### Items

| Slot | Content | Href |
|------|---------|------|
| Left | Logo hex + "SpecForge" wordmark | `/` |
| Divider | 1px vertical separator | — |
| Link | Home | `/` |
| Link | Pricing | `/pricing` |
| Divider | 1px vertical separator | — |
| Ghost link | Sign In | `/login` |
| CTA button | Get Started + sliding arrow | `/login` |

Both Sign In and Get Started route to `/login`. Registration will be added to the login page in a future plan.

### Tube Light Effect

Active nav item gets:
- Amber `4px` bar above (`position: absolute; top: -3px`)
- Glow: `box-shadow: 0 0 12px 4px hsla(40,85%,58%,0.5), 0 12px 28px 2px hsla(40,85%,58%,0.15)`
- Active state tracked via `usePathname()`

### CTA Arrow Animation

Default state: "Get Started" — no arrow, button sized to text.
Hover: button expands horizontally, arrow slides in via `max-width: 0 → 1.4em` + opacity transition (300ms, `--ease-premium`). No reserved empty space.

### Styling tokens
- Pill bg: `bg-1 / 88%` + `backdrop-blur-[20px]`
- Border: `border-subtle`
- Active text: `accent-primary`
- CTA bg: `accent-primary` → `accent-hover` on hover

---

## Homepage — `app/(marketing)/page.tsx`

**Five sections, scroll-reveal throughout.**

### Global Background — Shape Landing Hero

Replicates the 21st.dev `ElegantShape` component. Five shapes, `position: fixed`, visible across the entire page while scrolling.

| Shape | Size | Rotate | Color | Position |
|-------|------|--------|-------|----------|
| 1 | 600×140px | +12° | `analog-2 / 0.15` | top 20%, left -5% |
| 2 | 500×120px | -15° | `analog-3 / 0.15` | top 75%, right 0% |
| 3 | 300×80px | -8° | `analog-1 / 0.15` | bottom 10%, left 10% |
| 4 | 200×60px | +20° | `accent / 0.12` | top 15%, right 20% |
| 5 | 150×40px | -25° | `analog-1 / 0.11` | top 10%, left 25% |

Shape properties (matching 21st.dev exactly):
- `border-radius: 9999px` (rounded-full)
- `border: 2px solid hsla(220,40%,70%,0.13)`
- `backdrop-filter: blur(2px)`
- `box-shadow: 0 8px 32px 0 hsla(220,50%,60%,0.07)`
- Inner radial highlight via `::after`
- Entry: opacity 0→1 over 1.2s, translateY(-150px)→0 + rotate(rot-15°)→rotate(rot) over 2.4s, easing `cubic-bezier(0.23,0.86,0.39,0.96)`, staggered delays 0.3–0.7s
- Idle float: `translateY(0→15px→0)` over 12s, infinite `ease-in-out`, starts after entry

### Scroll Reveal System

All section content uses an `IntersectionObserver` (threshold 0.05, rootMargin `-10px`). On intersection: `opacity 0→1`, `translateY(24px)→0`, duration `1200ms`, `--ease-premium`. Stagger delays: 300ms / 600ms / 900ms between elements in the same section. Left-side elements slide from `-36px X`, right-side from `+36px X`.

### Section 1 — Hero

- Full viewport height (`min-height: 100vh`), `padding: 160px 64px 120px`
- **Badge:** "Now in Early Access" pill, fades up on load (1s, 400ms delay)
- **Headline:** 112px, weight 700, letter-spacing -0.035em
  - Line 1 "From Raw Feedback" — left-aligned, slides in from left (1s, 600ms delay)
  - Line 2 "to Actionable Specs" — right-aligned, slides in from right (1s, 850ms delay)
  - Line 1 gradient: `text-pri → hsl(220,10%,70%)`
  - Line 2 gradient: `analog-1 → text-pri → accent`
- **Bottom row** (fades up, 1s, 1200ms delay): subtext left (`max-width: 440px`, 19px, `text-ter`), action buttons right
  - Primary: "Start for Free" + sliding arrow → `/login`
  - Secondary: "See How It Works" → `href="#how-it-works"` (smooth scroll anchor)

### Section 2 — Capabilities

- Heading: 76px — "Everything you need to go from discovery to delivery"
- Three full-width two-column rows, each separated by a `border-top: 1px solid border-subtle`, `padding: 80px 0`
- Left column: SVG icon (52px box, 16px radius) + large title (48px, weight 700)
- Right column: description (18px, `text-sec`, line-height 1.8) + file-type tags where applicable
- Scroll animation: left column slides from left, right column slides from right, independent per row

| Row | Title | Icon | Description highlight |
|-----|-------|------|-----------------------|
| 1 | Multi-Source Ingestion | Upload arrow SVG | Tags: .txt .pdf .docx .json .md + Paste text |
| 2 | AI-Powered Synthesis | Star/sparkle SVG | Quote grounding, no hallucination |
| 3 | Exportable Proposals | Share/export SVG | Cursor, Claude Code, ChatGPT, Gemini, any agent |

### Section 3 — How It Works

- Heading: 76px — "Three steps from feedback to spec"
- Vertical timeline: `::before` pseudo-element draws a 1px vertical connector line
- Three items, each `padding: 72px 0`, two-column grid (108px | 1fr)
- Left: 108px circle, 44px number, amber color. Hover: amber border glow
- Right: step title 40px + description 18px filling full column width
- Each step's number, title, and description reveal independently on scroll

### Section 4 — Pricing Teaser

- Heading: "Simple, transparent pricing"
- Single card, `max-width: 580px`, centered. No accent top border.
- Plan: "Early Access", $0/mo, free during beta
- Five checklist items (SVG check icons, accent color)
- CTA: full-width "Get Early Access" button with sliding arrow
- "View full pricing details →" text link to `/pricing`
- Card wrapped in reveal div (separate from card's hover transition to avoid CSS override)

### Section 5 — Final CTA

- Heading: 80px — "Ready to ship faster?"
- "Start for Free" + sliding arrow → `/login`
- "Sign In" → `/login`
- Radial glow background behind heading

---

## Components to Create

| File | Type | Purpose |
|------|------|---------|
| `components/nav/public-navbar.tsx` | Client component | Floating pill navbar with tube light |
| `components/marketing/elegant-shape.tsx` | Client component | Animated background shape (21st.dev pattern) |
| `components/marketing/shapes-background.tsx` | Client component | Composes 5 ElegantShapes, `position: fixed` |
| `app/(marketing)/layout.tsx` | Server component | Public layout — auth redirect + PublicNavbar |
| `app/(marketing)/page.tsx` | Server component | Homepage sections |
| `app/(marketing)/pricing/page.tsx` | Server component | Full pricing page (stub for now) |

Delete `app/page.tsx` (the current redirect stub).

---

## Dependencies

- `framer-motion` (already installed via `motion/react`) — used for `ElegantShape` entry + idle animations
- `lucide-react` (already installed) — icons in PublicNavbar
- No new dependencies required

---

## Design System Compliance

- All colors from token set (no arbitrary values)
- Typography: Outfit, modular scale (112px hero, 76px headings, 48px cap titles, 40px step titles, 18-19px body)
- Spacing: 8px grid (padding multiples: 64, 80, 96, 120, 160)
- Border radii: `radius-pill` for buttons/navbar, `9999px` for shapes, `radius-xl` for pricing card
- Motion: `cubic-bezier(0.22,1,0.36,1)` for UI, `cubic-bezier(0.23,0.86,0.39,0.96)` for shape entry
- No spring physics, no bounce, no rotation on layout elements
