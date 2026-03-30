# Navbar Design Spec

**Date:** 2026-03-29
**Feature:** Authenticated App Navbar
**Status:** Approved

---

## Scope

Replaces the minimal header in `app/(app)/layout.tsx` with a full navbar. This navbar is **auth-only** — it only renders inside the `(app)` route group. The public homepage will get its own separate nav when built.

---

## Structure

Three elements, always in this order:

```
[ Logo SVG + "SpecForge" wordmark ]   [ ← Dashboard / Project Name ]   [ Avatar ]
```

The breadcrumb section (middle) is **conditional** — only shown on project pages, not on `/dashboard`.

---

## Left: Brand

- SVG logo slot (placeholder: gradient square with "S" until real SVG is ready)
- "SpecForge" wordmark, `font-size: 15px`, `font-weight: 600`
- Logo + wordmark never shrink or truncate
- Clicking the wordmark or logo navigates to `/dashboard`

---

## Middle: Conditional Breadcrumb

Shown only when inside a project (`/projects/[id]` and all sub-routes).

```
← (icon button)   Dashboard   /   Project Name
```

- **Back icon button**: chevron-left SVG, 32×32px, `border-radius: 8px`, hover: `surface-1` background
- **"Dashboard" label**: links to `/dashboard`, `text-secondary`, never truncates, `flex-shrink: 0`
- **"/" separator**: `text-tertiary`, `flex-shrink: 0`
- **Project name**: `text-primary`, `font-weight: 500`, truncates with ellipsis — `overflow: hidden; white-space: nowrap; text-overflow: ellipsis; min-width: 0; flex: 1 1 0`
- Entire breadcrumb container: `flex: 1 1 0; min-width: 0; overflow: hidden`
- Not shown on `/dashboard` — no back link needed there

---

## Right: Avatar

- Circle, 32×32px, `border-radius: 999px`
- Shows user initials (derived from email or display name)
- Background: `linear-gradient(135deg, hsl(220, 55%, 40%), hsl(240, 55%, 50%))`
- Border: `1px solid border-subtle`, hover: `border-strong`
- Hover: `scale(1.05)`, `border-color: border-strong`
- Clicking opens a dropdown menu
- Never shrinks: `flex-shrink: 0`

### Avatar Dropdown

- Background: `surface-0`
- Border: `1px solid border-subtle`
- Border radius: `12px` (`radius-md`)
- Shadow: `shadow-2`
- Positioned: `right: 0; top: calc(100% + 8px)`
- Closes on outside click

**Contents:**
1. User email — `text-tertiary`, `font-size: 12px`, non-interactive, separated by a border-bottom
2. **Sign out** — `color: error`, chevron-right icon, hover: `hsla(error, 0.1)` background

Extensible: future items (Settings, Profile) can be added above Sign out.

---

## Navbar Shell

- Height: `56px`
- Background: `bg-1` at 85% opacity with `backdrop-filter: blur(20px)`
- Border bottom: `1px solid border-subtle`
- `position: sticky; top: 0; z-index: 40` — sticks to top on scroll
- Max content width: `1200px`, centered, `padding: 0 24px`
- Layout: `display: flex; align-items: center; justify-content: space-between; gap: 16px`
- `overflow: hidden` to prevent any child from breaking out

---

## Divider

A `1px` vertical rule (`border-subtle`) between the brand and the breadcrumb. `height: 18px`, `flex-shrink: 0`. Only rendered when the breadcrumb is present.

---

## Implementation Notes

- The navbar is a **server component** (`Navbar`) that accepts an optional `projectName?: string` prop
- `app/(app)/layout.tsx` renders `<Navbar />` (no project name) — dashboard state
- `app/(app)/projects/[id]/layout.tsx` (new nested layout) fetches the project by ID and renders `<Navbar projectName={project.name} />` — this overrides/extends the shell for project pages
- The existing `SignOutButton` component is wired into the dropdown's sign out item
- Avatar initials derived from `user.email` (first two chars, uppercased) — no avatar image in MVP
- Logo SVG slot: render `<SpecForgeLogo />` component; initially renders the gradient placeholder, swapped for real SVG when ready

---

## Design Tokens Used

| Property | Token |
|---|---|
| Background | `bg-1` @ 85% opacity |
| Backdrop blur | `20px` |
| Border | `border-subtle` |
| Brand text | `text-primary` |
| Nav links | `text-secondary` |
| Separator / meta | `text-tertiary` |
| Hover surface | `surface-1` |
| Dropdown bg | `surface-0` |
| Dropdown shadow | `shadow-2` |
| Sign out color | `error` |
| Avatar gradient | `analog-2 → analog-3` |

---

## Out of Scope

- Mobile/responsive nav (hamburger menu) — not needed for MVP
- Settings or profile pages — dropdown is extensible but only Sign out ships now
- Homepage navbar — separate feature, separate spec
