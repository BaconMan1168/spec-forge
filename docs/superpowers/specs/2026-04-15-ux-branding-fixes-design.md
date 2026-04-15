# UX, Branding & Bug Fixes — Design Spec
_2026-04-15_

## Overview

Six improvements grouped into four independent branches, each executable in a fresh session after a `/clear`.

---

## Branch A — `feat/branding`

### Scope
Two pure text/style changes with no logic impact.

### A1 — Hero headline: gradient → plain white
- File: `components/marketing/hero-section.tsx`
- The "to Actionable Specs" `<motion.span>` (line 38–52) uses an inline `style` with a `linear-gradient` background-clip text effect.
- Remove the `style` prop entirely and replace with a plain `text-[var(--color-text-primary)]` Tailwind class.
- "From Raw Feedback" (line 24–37) uses a `--color-text-primary` → grey gradient; leave it untouched per the request (only "to Actionable Specs" changes).

### A2 — Rename SpecForge → Xern / Xern AI
**Rule:** navbar/logo = "Xern"; homepage copy and any body text a user reads = "Xern AI".

Files to update:
- `components/nav/spec-forge-logo.tsx` — logo text (if any rendered text exists)
- `components/nav/public-navbar.tsx` — brand Link text "SpecForge" → "Xern"
- `components/nav/navbar.tsx` — brand span "SpecForge" → "Xern"
- `components/marketing/hero-section.tsx` — "SpecForge" in the subtitle paragraph → "Xern AI"
- `components/marketing/cta-section.tsx` — any "SpecForge" in body copy → "Xern AI"
- `components/marketing/how-it-works-section.tsx` — any "SpecForge" in body copy → "Xern AI"
- `components/marketing/capabilities-section.tsx` — any "SpecForge" in body copy → "Xern AI"
- `app/login/page.tsx` — any "SpecForge" title/heading → "Xern AI"
- `app/layout.tsx` — `<title>` / metadata → "Xern AI"

Do NOT rename: docs, test files, internal variable/type names, comments, or git history.

---

## Branch B — `fix/upload-loading`

### Scope
The submit button in the add-input flow gives no visual feedback during upload — it disables silently. Add proper loading state.

### Changes
- File: `components/projects/inputs/step-upload.tsx`
  - The "Submit batch" `<Button>` receives `isSubmitting` but ignores it for display.
  - When `isSubmitting` is true: show a small inline spinner (CSS `animate-spin` on a circle SVG or Loader2 from lucide-react) + change label to "Uploading…"
  - The button should remain disabled during `isSubmitting`.

- File: `components/projects/inputs/step-paste.tsx`
  - Apply the same spinner + label treatment to its submit button.

No backend changes. No new dependencies — use `Loader2` from `lucide-react` (already installed).

---

## Branch C — `fix/settings-nav`

### Scope
Navigating to `/settings` from the dashboard has no visual feedback because there is no `loading.tsx` for the settings route. Add one.

### Changes
- Create: `app/(app)/settings/loading.tsx`
  - Export a default skeleton component that mirrors the settings page layout:
    - A heading-sized skeleton bar
    - A card-shaped skeleton block (matching the plan card dimensions)
  - Use the existing `Skeleton` component from `components/ui/skeleton.tsx` (already used in dashboard/loading.tsx — follow the same pattern).
  - No new styles beyond what the skeleton component already provides.

This is the standard Next.js App Router pattern. The moment the user clicks Settings, Next.js renders this skeleton instantly while the server component fetches data.

---

## Branch D — `fix/form-validation`

### Scope
Two separate problems fixed together: browser-native validation popups and the navbar tube-light glow jump.

### D1 — Custom form validation (no browser popups)

**Login form** (`components/auth/login-form.tsx`):
- Add `noValidate` to the `<form>` element.
- Remove `required` from all `<Input>` components in this form.
- In `handleSubmit`, before the existing early returns, add client-side checks:
  - Email empty → set a field-level error state: `emailError`
  - Email not matching basic email pattern → set `emailError`
  - Password empty → set `passwordError`
  - In signup mode: confirm password empty → set `confirmPasswordError`
- Render each field error as a small `<p role="alert">` with `text-[var(--color-error)]` directly below the relevant `<Input>`, matching the existing server error style.
- Clear field errors on input change (or on re-submit).

**New project modal** (`components/projects/new-project-modal.tsx`):
- Add `noValidate` to its `<form>` element.
- Remove `required` from its inputs.
- Add client-side validation for the project name field (required, max length).
- Render error inline below the field using the same error style.

### D2 — Navbar tube-light glow jump bug

**Root cause:** `layoutId="tube-light"` in `public-navbar.tsx` only renders when `isActive`. When the active page changes, Framer Motion tries to animate from the tube-light's last measured DOM position to its new position. If the user has been interacting with pricing cards (which trigger CSS layout changes / scroll), the stored measurement can be at an incorrect absolute position (e.g., bottom of the viewport), causing the "jump from bottom" visual.

**Fix:** Add `layout="position"` and wrap the `<nav>` in a `<MotionConfig>` with `layoutRoot` so that all `layoutId` measurements within the navbar are scoped to the navbar's own coordinate space, not the document root.

Alternatively (simpler): replace the `layoutId` approach for the tube-light with a direct position-driven animation. Keep a ref map of each nav link's `offsetLeft`/`offsetWidth`, and animate a single always-mounted `<motion.span>` to the active item's position using `animate={{ x, width }}`. This is immune to external layout changes entirely.

**Chosen approach:** The always-mounted span approach — simpler, more robust, no dependency on Framer Motion's layout projection system for this particular element.

- File: `components/nav/public-navbar.tsx`
- Keep the existing sliding background pill (`layoutId="nav-bg"`) — that one works correctly.
- Replace the conditional `layoutId="tube-light"` with a single always-mounted `<motion.span>` positioned at the active link using `useRef` + `useEffect` to read the active link's `offsetLeft` and `offsetWidth`, then `animate` the span to those values.
- The span lives inside the `<nav>` at absolute position, outside the link map loop.

---

## Testing Checklist (per branch)

**A:** Visual inspection — navbar shows "Xern", homepage shows "Xern AI", "to Actionable Specs" is plain white.

**B:** Upload a file → button immediately shows spinner + "Uploading…" → success state shows on completion.

**C:** Click Settings from dashboard → skeleton appears instantly → content loads in.

**D1:** Submit login form with empty email → inline error appears below email field, no browser popup. Same for password. Submit project modal with no name → inline error appears.

**D2:** Navigate to pricing, hover/click pricing cards, click Home in navbar → tube-light slides horizontally without jumping.
