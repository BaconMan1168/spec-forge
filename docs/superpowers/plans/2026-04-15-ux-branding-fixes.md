# UX, Branding & Bug Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Four independent branches of UI/UX fixes — branding rename, upload loading state, settings skeleton, form validation + navbar glow bug.

**Architecture:** Each branch is self-contained and can be executed in a fresh session after a `/clear`. Read the spec at `docs/superpowers/specs/2026-04-15-ux-branding-fixes-design.md` for full rationale.

**Tech Stack:** Next.js App Router, React, Tailwind CSS, Framer Motion (`motion/react`), lucide-react, Supabase

---

## Branch A — `feat/branding`

```bash
git checkout -b feat/branding
```

### Task 1: Hero text — plain white

**File:** `components/marketing/hero-section.tsx`

- [ ] Remove the `style` prop (gradient background-clip) from the **second** `<motion.span>` ("to Actionable Specs", lines ~38–52)
- [ ] Add `className="... text-[var(--color-text-primary)]"` in its place (keep all other classes)
- [ ] Verify first span ("From Raw Feedback") is untouched
- [ ] `pnpm lint && pnpm typecheck`

### Task 2: Rename SpecForge → Xern / Xern AI

**Rule:** navbar/logo text = `Xern`; homepage body copy and any text users read = `Xern AI`

**Files to update:**

- [ ] `components/nav/spec-forge-logo.tsx` — rendered text (if any) → `Xern`
- [ ] `components/nav/public-navbar.tsx` — brand Link text → `Xern`
- [ ] `components/nav/navbar.tsx` — brand `<span>` → `Xern`
- [ ] `components/marketing/hero-section.tsx` — subtitle paragraph "SpecForge" → `Xern AI`
- [ ] `components/marketing/cta-section.tsx` — any "SpecForge" in body copy → `Xern AI`
- [ ] `components/marketing/how-it-works-section.tsx` — any "SpecForge" → `Xern AI`
- [ ] `components/marketing/capabilities-section.tsx` — any "SpecForge" → `Xern AI`
- [ ] `app/login/page.tsx` — heading/title → `Xern AI`
- [ ] `app/layout.tsx` — `<title>` / metadata → `Xern AI`

Do **not** rename: docs, test descriptions, internal variable names, comments, or imports.

- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] Commit: `git commit -m "feat: rebrand SpecForge to Xern / Xern AI"`

---

## Branch B — `fix/upload-loading`

```bash
git checkout main && git checkout -b fix/upload-loading
```

### Task 3: Upload button loading state

**Files:** `components/projects/inputs/step-upload.tsx`, `components/projects/inputs/step-paste.tsx`

- [ ] In `step-upload.tsx`, update the submit `<Button>` to show a spinner + "Uploading…" when `isSubmitting`:

```tsx
import { Loader2 } from "lucide-react";

<Button
  size="sm"
  disabled={!canSubmit}
  onClick={onSubmit}
  type="button"
>
  {isSubmitting ? (
    <>
      <Loader2 size={13} className="animate-spin" />
      Uploading…
    </>
  ) : (
    "Submit batch"
  )}
</Button>
```

- [ ] In `step-paste.tsx`, apply the same treatment to its submit button (find the equivalent submit button and add the same `isSubmitting` branch with `Loader2` + "Uploading…")
- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] Commit: `git commit -m "fix: show spinner and loading label on upload submit button"`

---

## Branch C — `fix/settings-nav`

```bash
git checkout main && git checkout -b fix/settings-nav
```

### Task 4: Settings loading skeleton

**File:** `app/(app)/settings/loading.tsx` (create new)

- [ ] Reference `app/(app)/dashboard/loading.tsx` for the existing skeleton pattern in this app
- [ ] Create `app/(app)/settings/loading.tsx` with a skeleton that mirrors the settings page layout: a heading bar + a card-shaped block

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[480px]">
      <Skeleton className="mb-8 h-9 w-36 rounded-[var(--radius-md)]" />
      <Skeleton className="h-[280px] w-full rounded-[var(--radius-xl)]" />
    </div>
  );
}
```

- [ ] `pnpm lint && pnpm typecheck`
- [ ] Commit: `git commit -m "fix: add settings loading skeleton for instant nav feedback"`

---

## Branch D — `fix/form-validation`

```bash
git checkout main && git checkout -b fix/form-validation
```

### Task 5: Login form — noValidate + inline errors

**File:** `components/auth/login-form.tsx`

- [ ] Add `noValidate` to the `<form>` element
- [ ] Remove `required` from all `<Input>` components in the form
- [ ] Add field error state at the top of the component:

```tsx
const [emailError, setEmailError] = useState<string | null>(null);
const [passwordError, setPasswordError] = useState<string | null>(null);
const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
```

- [ ] Clear field errors on input change:

```tsx
onChange={(e) => { setEmail(e.target.value); setEmailError(null); }}
// same pattern for password and confirmPassword
```

- [ ] In `handleSubmit`, add client-side checks before the existing logic:

```tsx
let valid = true;
if (!email.trim()) { setEmailError("Email is required"); valid = false; }
else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError("Enter a valid email address"); valid = false; }
if (!password) { setPasswordError("Password is required"); valid = false; }
if (mode === "signup" && !confirmPassword) { setConfirmPasswordError("Please confirm your password"); valid = false; }
if (!valid) return;
```

- [ ] Render each field error directly below its `<Input>`:

```tsx
<Input label="Email" type="email" value={email} onChange={...} placeholder="you@example.com" />
{emailError && <p role="alert" className="mt-1 text-sm text-[var(--color-error)]">{emailError}</p>}
```

Apply the same pattern to password and confirmPassword fields.

### Task 6: New project modal — noValidate + inline error

**File:** `components/projects/new-project-modal.tsx`

- [ ] Read the file first to understand its current form structure
- [ ] Add `noValidate` to the `<form>` element
- [ ] Remove `required` from the project name input
- [ ] Add `nameError` state, clear on change, validate in submit handler (empty → "Project name is required")
- [ ] Render `nameError` below the name input using the same `role="alert"` + `text-[var(--color-error)]` pattern

### Task 7: Navbar tube-light glow jump fix

**File:** `components/nav/public-navbar.tsx`

- [ ] Add a `refs` map to track each nav link's DOM node:

```tsx
const linkRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
```

- [ ] Track the tube-light position as state:

```tsx
const [tubeStyle, setTubeStyle] = useState<{ left: number; width: number } | null>(null);
```

- [ ] Use a `useEffect` to measure the active link and update `tubeStyle` whenever `pathname` changes:

```tsx
useEffect(() => {
  const el = linkRefs.current[pathname];
  if (el) {
    setTubeStyle({ left: el.offsetLeft + el.offsetWidth / 2, width: el.offsetWidth * 0.6 });
  }
}, [pathname]);
```

- [ ] Remove the conditional `layoutId="tube-light"` span from inside the link map loop
- [ ] Add a single always-mounted tube-light span **inside the `<nav>`** at absolute position (before the links map), driven by `tubeStyle`:

```tsx
{tubeStyle && (
  <motion.span
    aria-hidden="true"
    className="pointer-events-none absolute top-[-3px] h-1 rounded-b-sm bg-[var(--color-accent-primary)]"
    animate={{ left: tubeStyle.left - tubeStyle.width / 2, width: tubeStyle.width }}
    transition={TUBE_TRANSITION}
    style={{
      boxShadow: "0 0 12px 4px hsla(40,85%,58%,0.5), 0 12px 28px 2px hsla(40,85%,58%,0.15)",
    }}
  />
)}
```

- [ ] Assign refs on each nav link: `ref={(el) => { linkRefs.current[link.href] = el; }}`
- [ ] `pnpm lint && pnpm typecheck && pnpm test`
- [ ] Commit: `git commit -m "fix: form noValidate with inline errors; fix navbar tube-light glow jump"`
