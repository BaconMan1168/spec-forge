# Dashboard Visual Refresh — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Scope:** `app/layout.tsx`, `app/(app)/layout.tsx`, `app/(app)/dashboard/page.tsx`, `components/ui/card.tsx`, `components/ui/aurora-background.tsx` (new), `docs/product/design-system.md`

---

## 1. Overview

The current dashboard is static, visually flat, and makes no use of the motion or depth systems defined in the design spec. This refresh adds an animated background, smooth entrance animations, an interactive card hover effect, and switches the font to Outfit — all within the existing design system token boundaries.

---

## 2. Design Decisions

### 2.1 Font — Outfit

- Replace **Inter** with **Outfit** (Google Fonts) across the entire product.
- Load via `next/font/google` in the root `app/layout.tsx`.
- Update `design-system.md` section 2.1 to reflect this change.
- No other typography tokens change.

### 2.2 Background — Particles + Aurora

The app layout (`app/(app)/layout.tsx`) gains a `position: fixed; inset: 0; z-index: 0; pointer-events: none` background layer beneath all page content. The main content wrapper gets `position: relative; z-index: 1`. Two effects are layered:

**Layer 1 — MagicUI `Particles`**
- ~20 particles, 2–4px diameter
- Colors use the defined analogous tokens at reduced opacity:
  - `hsla(200,55%,55%,0.6)` (`--analog-1`)
  - `hsla(220,55%,55%,0.55)` (`--analog-2`)
  - `hsla(240,55%,60%,0.55)` (`--analog-3`)
- Constant gentle drift — density present but never distracting
- `prefers-reduced-motion`: particles are hidden (`display: none`)

**Layer 2 — Aurora CSS bands (`components/ui/aurora-background.tsx`)**
- 5 horizontal blurred bands using exact analogous token values:
  - `--analog-1: hsl(200,55%,55%)`
  - `--analog-2: hsl(220,55%,55%)`
  - `--analog-3: hsl(240,55%,60%)`
- Opacity range: 0.09–0.18 per band (very subtle)
- `filter: blur(14px–22px)` per band
- Each band animates independently: duration 10–16s, alternating direction
- `prefers-reduced-motion`: animation is paused (`animation-play-state: paused`)

### 2.3 Project Cards — Grid Tiles with Magic Card

**Layout change:** The current single-column list becomes a **2-column CSS grid** on desktop, collapsing to 1 column on mobile (`< 640px`). Gap: `16px` (design system spacing token).

**Card surface — Glass Surface Rule (design system §6):**
- `background: var(--color-surface-0)` — `hsl(220,12%,16%)`
- `backdrop-filter: blur(20px)` — per glass surface rule
- `border: 1px solid var(--color-border-subtle)` — `hsl(220,10%,28%)`
- `box-shadow: var(--shadow-2)`
- `border-radius: var(--radius-lg)` — 20px
- `padding: 24px`

**MagicUI `MagicCard` wrapper:**
- Wraps each project tile
- Mouse-following radial spotlight on hover: uses `--analog-2` at low opacity (`hsla(220,55%,55%,0.10)`)
- Hover state: `translateY(-2px) scale(1.015)` — within design system `scale max 1.02` rule
- Transition: `180ms cubic-bezier(0.22,1,0.36,1)` (design system `normal` + premium easing)

**Card content:**
- Color-coded icon block: 26×26px, `border-radius: 8px` (`--radius-xs`), cycling through `--analog-1 / --analog-2 / --analog-3` at `20% opacity` by `index % 3`
- Project name: `font-size: 20px` (`md` on the scale), `font-weight: 600` — intentionally compact for the tile format (smaller than the `lg/25px` card title convention to suit the 2-col grid density)
- Created date: `font-size: 14px` (`sm`), `color: var(--color-text-tertiary)`

### 2.4 Entrance Animation — BlurFade Stagger

- MagicUI `BlurFade` wraps the page heading, the "New Project" button, and each card individually
- Stagger delay: `delay={index * 0.04}` — 40ms per item, matching design system §8.5 exactly
- Duration: `280ms` (`slow` timing token)
- Effect: opacity 0→1, blur clears, `translateY(16px → 0)` — matches design system §8.5
- Empty state also wrapped in `BlurFade` with `delay={0}`
- `prefers-reduced-motion`: `BlurFade` passes through children with no animation

### 2.5 Empty State

- Centered, `py-24`
- Wrapped in `BlurFade` with `delay={0.08}`
- No structural copy changes

---

## 3. MagicUI Components Required

| Component | Install command | Peer deps |
|-----------|----------------|-----------|
| `particles` | `pnpm dlx shadcn@latest add "https://magicui.design/r/particles.json"` | none |
| `magic-card` | `pnpm dlx shadcn@latest add "https://magicui.design/r/magic-card.json"` | `motion`, `next-themes` |
| `blur-fade` | `pnpm dlx shadcn@latest add "https://magicui.design/r/blur-fade.json"` | `motion` |

`motion` (Framer Motion) is a shared dep for `magic-card` and `blur-fade` — installed once via `pnpm add motion`.

---

## 4. Files to Create / Modify

| File | Change |
|------|--------|
| `app/layout.tsx` | Switch font from Inter to Outfit via `next/font/google` |
| `app/(app)/layout.tsx` | Add fixed background layer (Particles + aurora); wrap content in `relative z-1` |
| `app/(app)/dashboard/page.tsx` | 2-col grid, MagicCard per tile, BlurFade stagger, updated card content |
| `components/ui/card.tsx` | Update to glass surface rule styles |
| `components/ui/aurora-background.tsx` | New: CSS aurora bands component (used in layout) |
| `docs/product/design-system.md` | Update §2.1 font from Inter → Outfit |

---

## 5. Design System Compliance

| Rule | Status | Notes |
|------|--------|-------|
| Colors: only defined tokens | ✅ | Particles and aurora use exact `--analog-1/2/3` HSL values at reduced opacity |
| Card surface: Glass Surface Rule | ✅ | `surface-0` bg, `blur(20px)`, `border-subtle`, `shadow-2` |
| Spacing: 8px increments | ✅ | Grid gap 16px, padding 24px |
| Radius: defined tokens only | ✅ | `radius-lg` (cards), `radius-xs` (icon blocks) |
| Motion: no bounce/spring | ✅ | ease-out and `cubic-bezier(0.22,1,0.36,1)` only |
| Scale max 1.02 on hover | ✅ | Using 1.015 |
| Stagger: 40ms | ✅ | `delay={index * 0.04}` |
| Backdrop-blur: 20px | ✅ | Per Glass Surface Rule §6 |
| Accent ≤10% viewport | ✅ | Accent only on "New Project" CTA |
| Gradients: analogous only | ✅ | Aurora uses `--analog-1/2/3` only |
| Font: one family | ✅ | Outfit replaces Inter — still one family |
| `prefers-reduced-motion` | ✅ | Particles hidden, aurora paused, BlurFade no-ops |

---

## 6. Out of Scope

- Project workspace page (`/projects/[id]`) — unchanged
- New Project modal — unchanged
- Login page — unchanged
- Any data model or server action changes
