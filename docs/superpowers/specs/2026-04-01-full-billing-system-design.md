# Full Billing System Design

**Date:** 2026-04-01
**Branch:** feat/payments
**Status:** Approved

---

## Overview

Replace the `STRIPE_ENABLED`-gated billing stub with a fully live payment system. Free and Pro tiers are active from day one. Plan limits are enforced in real time. Users can upgrade via Stripe Checkout and manage their subscription via the Stripe Customer Portal.

---

## Strategy Change

The original pricing doc planned to delay billing until 500+ users. This design intentionally moves away from that — pricing is live immediately. The `STRIPE_ENABLED` env var gate is removed entirely.

---

## Plan Definitions

| Limit | Free | Pro |
|-------|------|-----|
| Projects per calendar month | 2 | Unlimited |
| Files per project | 5 | 20 |
| Exports per project | 3 | Unlimited |
| Re-run analysis | No | Yes |
| Session persistence | 7 days | Indefinite |
| AI processing | Standard | Priority |

---

## Architecture

### Data Layer

**Existing tables used for limit checks:**
- `projects (user_id, created_at)` — count projects this calendar month
- `feedback_files (project_id)` — count files per project
- `profiles (subscription_status)` — determine user's current plan

**New table: `exports`**
```sql
create table public.exports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  created_at  timestamptz not null default now()
);
```
Tracks each export action per proposal per project. Enables the 3-export-per-project Free cap.

**Migration:** `supabase/migrations/005_add_exports.sql`

---

### `lib/billing/` Changes

**Remove `BILLING_ENABLED` from `config.ts`** — `PLANS` definition stays. No feature flag.

**Update `stripe.ts`** — remove `BILLING_ENABLED` guard. `getStripe()` always initialises.

**New: `lib/billing/limits.ts`**

Core helper. Reads `subscription_status` from `profiles` to determine plan, then runs count queries.

```ts
export type LimitResult = { allowed: boolean; reason: string };

export async function canCreateProject(userId: string): Promise<LimitResult>
export async function canAddFile(userId: string, projectId: string): Promise<LimitResult>
export async function canExport(userId: string, projectId: string): Promise<LimitResult>
export async function canRerunAnalysis(userId: string): Promise<LimitResult>
export async function getUserPlan(userId: string): Promise<'free' | 'pro'>
```

Each function:
1. Calls `getUserPlan()` — single query to `profiles`
2. If Pro → returns `{ allowed: true, reason: '' }`
3. If Free → runs the relevant count query and compares to `FREE_LIMITS`

---

### API Routes

**Remove `BILLING_ENABLED` gates from:**
- `app/api/billing/checkout/route.ts`
- `app/api/billing/webhook/route.ts`

**Add limit checks to existing server actions and routes:**
- `app/actions/projects.ts` (`createProject`) — call `canCreateProject()` before insert; throw a readable error if denied (server actions use thrown errors, not HTTP status codes)
- `app/actions/feedback-files.ts` (`uploadFeedbackFiles`) — call `canAddFile()` before inserting files
- `app/actions/exports.ts` (`exportProposal`) — new server action; call `canExport()`, insert into `exports` table, return markdown string to client. Replaces the current pure client-side `Blob` download in `proposals-section.tsx`
- `app/api/projects/[id]/analyze/route.ts` — call `canRerunAnalysis()` before triggering re-run (first run always allowed; re-run = running again when analysis already exists)

**New: `POST /api/billing/portal`**
- Auth check → get `stripeCustomerId` from `profiles` → call `stripe.billingPortal.sessions.create()` → return `{ url }` → client redirects

---

### Settings Page

**Route:** `app/(app)/settings/page.tsx`

Server component. Reads `profiles` for current plan and usage this month.

**Free user view:**
- Plan name + limits summary
- Usage this month (projects used / 2)
- "Upgrade to Pro — $29/mo" CTA button → calls `POST /api/billing/checkout` → redirects to Stripe Checkout

**Pro user view:**
- Plan name + "Active" badge
- Usage this month
- "Manage Subscription" button → calls `POST /api/billing/portal` → redirects to Stripe Customer Portal

**Navigation:** Settings link added to the authenticated app nav/sidebar.

---

### In-App Limit Enforcement (UI)

When a user has hit a plan limit, the relevant action button is:
- Visually disabled (`cursor-not-allowed`, muted color)
- Wrapped in a tooltip on hover: `"[Limit] — Upgrade to Pro →"` where the arrow is a link to `/pricing` or triggers the checkout flow directly

**Surfaces:**
| Action | Component to gate |
|--------|-------------------|
| New project | `NewProjectModal` trigger button on dashboard |
| Add file | File upload button on project page |
| Export proposal | Export button on proposal card |
| Re-run analysis | Re-run button on project page |

The tooltip component is a shared `<PlanLimitTooltip>` wrapper that accepts `allowed`, `reason`, and `children`. When `allowed` is false it renders the child as disabled and overlays the tooltip. When `allowed` is true it renders the child normally.

**Limit data is fetched server-side** and passed as props to the relevant page components, so no client-side loading state is needed.

---

### Pricing Page Changes

- "Get Early Access" → "Try for Free" (Free card CTA)
- All beta / early access language removed
- Pro card: "Coming Soon" badge removed, disabled button replaced with live "Upgrade to Pro" button that calls `POST /api/billing/checkout`
- Pro card: `opacity-80` and `cursor-not-allowed` styling removed — card is fully live

---

### Language Changes (global)

Search and replace across all components and pages:
- "Get Early Access" → "Try for Free"
- "Early Access" → "SpecForge"
- "beta" / "Beta" → remove or replace with product name where appropriate

---

## Design System Requirement

All new UI must use exclusively:
- CSS variables from `docs/product/design-system.md` (`--color-*`, `--radius-*`, `--shadow-*`)
- `motion/react` for animations with `duration: 1.5, ease: [0.22, 1, 0.36, 1]` (matching existing site animations)
- No arbitrary Tailwind values outside the design system

---

## External Setup Required (outside codebase)

Before the payment system goes live, the following must be done manually:

### 1. Stripe webhook endpoint
- Go to Stripe Dashboard → Developers → Webhooks → Add endpoint
- URL: `https://yourdomain.com/api/billing/webhook`
- Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
- Copy the signing secret (`whsec_...`) → set as `STRIPE_WEBHOOK_SECRET` in `.env.local` and production env

### 2. Stripe Customer Portal configuration
- Go to Stripe Dashboard → Settings → Billing → Customer Portal
- Enable "Allow customers to cancel subscriptions"
- Set the return URL to `https://yourdomain.com/settings`
- Save settings (required before `stripe.billingPortal.sessions.create()` works)

### 3. Supabase migration
- Apply `supabase/migrations/005_add_exports.sql` via `npx supabase migration up`

### 4. Environment variables
- `STRIPE_WEBHOOK_SECRET` — replace `"placeholder"` with real `whsec_...` value
- `STRIPE_ENABLED` — can be removed from `.env.local` entirely (no longer read)
- Ensure all env vars are set in production (Vercel / hosting provider)

### 5. Deploy
- Webhooks require a live HTTPS URL — local dev only works with the Stripe CLI forwarder:
  ```bash
  stripe listen --forward-to localhost:3000/api/billing/webhook
  ```
- For production, deploy to Vercel (or equivalent) and register the live webhook URL in Stripe

---

## File Map

| File | Action |
|------|--------|
| `supabase/migrations/005_add_exports.sql` | Create |
| `lib/billing/config.ts` | Modify — remove `BILLING_ENABLED` |
| `lib/billing/stripe.ts` | Modify — remove `BILLING_ENABLED` guard |
| `lib/billing/limits.ts` | Create |
| `lib/billing/limits.test.ts` | Create |
| `app/api/billing/checkout/route.ts` | Modify — remove gate |
| `app/api/billing/checkout/route.test.ts` | Modify — update tests |
| `app/api/billing/webhook/route.ts` | Modify — remove gate |
| `app/api/billing/webhook/route.test.ts` | Modify — update tests |
| `app/api/billing/portal/route.ts` | Create |
| `app/api/billing/portal/route.test.ts` | Create |
| `app/actions/projects.ts` | Modify — add `canCreateProject()` check |
| `app/actions/feedback-files.ts` | Modify — add `canAddFile()` check |
| `app/actions/exports.ts` | Create — `exportProposal()` server action with limit check |
| `app/actions/exports.test.ts` | Create |
| `app/api/projects/[id]/analyze/route.ts` | Modify — add `canRerunAnalysis()` check |
| `components/projects/workspace/proposals-section.tsx` | Modify — replace client-side Blob download with `exportProposal()` server action call |
| `app/(app)/settings/page.tsx` | Create |
| `app/(app)/settings/page.test.tsx` | Create |
| `components/billing/plan-limit-tooltip.tsx` | Create |
| `components/billing/plan-limit-tooltip.test.tsx` | Create |
| `app/(marketing)/pricing/page.tsx` | Modify |
| `app/(marketing)/pricing/page.test.tsx` | Modify |
| `app/(app)/layout.tsx` | Modify — add Settings nav link |

---

## Testing Strategy

All new code follows TDD (write failing test → implement → pass).

- `limits.ts` — unit tests with mocked Supabase client, one test per limit case
- `portal/route.ts` — unit tests: 401 unauthenticated, 400 no customer ID, 200 with URL
- `plan-limit-tooltip.tsx` — jsdom tests: renders children normally when allowed, renders disabled + tooltip when not allowed
- `settings/page.tsx` — jsdom tests: renders Free view, renders Pro view
- Existing route tests updated to remove `BILLING_ENABLED` mock

---

## Success Criteria

- Free user who creates 2 projects sees "New Project" disabled with upgrade tooltip on third attempt
- Pro user has no disabled buttons
- Clicking "Upgrade to Pro" on pricing page or settings redirects to Stripe Checkout
- Successful checkout updates `profiles` via webhook and user sees Pro plan on settings page
- "Manage Subscription" redirects to Stripe Customer Portal
- All new tests pass, zero type errors
