# Stripe Payments + Pricing Page — Design Spec

**Date:** 2026-04-01  
**Branch:** feat/payments  
**Status:** Approved

---

## Overview

Implement Stripe billing infrastructure fully but gate it behind a `STRIPE_ENABLED` env var so it can be activated without any code changes. Simultaneously build out the `/pricing` page with Free and Pro tier cards.

---

## 1. Database

A `profiles` table extends Supabase Auth users (one row per user, created via trigger on `auth.users` insert).

### Schema

```sql
profiles
  id                      uuid         PK, FK → auth.users.id
  stripe_customer_id      text         nullable
  stripe_subscription_id  text         nullable
  subscription_status     text         nullable  -- 'active' | 'canceled' | 'past_due' | null
  updated_at              timestamptz
```

### Migration includes

- Table creation
- Trigger: auto-insert a `profiles` row on new `auth.users` insert
- RLS policies:
  - Users can only read their own row
  - Only the service role can write billing fields

---

## 2. Stripe Infrastructure

### Feature Flag

`STRIPE_ENABLED=true` in the Vercel environment controls all billing behavior. When not set (or set to anything other than `'true'`):
- All billing API routes return `{ error: 'billing_disabled' }` immediately
- The Stripe client is never instantiated
- No Stripe SDK calls fire

### File Structure

```
lib/billing/
  stripe.ts          — Stripe client (only instantiated if STRIPE_ENABLED=true)
  config.ts          — reads STRIPE_ENABLED, price IDs, plan definitions (Free/Pro)
  subscriptions.ts   — getUserSubscription(): reads profiles table
  checkout.ts        — createCheckoutSession(): server-side helper

app/api/billing/
  checkout/route.ts  — POST: creates Stripe Checkout session
  webhook/route.ts   — POST: handles Stripe webhook events
```

### Webhook Events Handled

- `checkout.session.completed` — sets `stripe_customer_id`, `stripe_subscription_id`, `subscription_status`
- `customer.subscription.updated` — syncs `subscription_status`
- `customer.subscription.deleted` — clears subscription fields / sets status to `canceled`

---

## 3. Payment Security

### Webhook Signature Verification
Every incoming webhook verified with `stripe.webhooks.constructEvent()` using `STRIPE_WEBHOOK_SECRET`. Unverified requests get `400` immediately. Prevents spoofed webhook calls.

Raw body requirement: webhook route uses `request.text()` (not parsed JSON) before calling `constructEvent()` — required by Next.js App Router for Stripe signature verification.

### Idempotent Webhook Handling
Before writing to `profiles`, the handler checks whether subscription state has actually changed. If already in sync, skips the write. Prevents double-updates from replayed Stripe events.

### Duplicate Subscription Guard
Checkout route checks `profiles` for existing `subscription_status = 'active'` before creating a new Checkout session. If one exists, returns an error. Prevents double-billing.

### Implementation Note
Use context7 for all Stripe and Supabase SDK calls to ensure up-to-date API usage.

---

## 4. Pricing Page UI

**Route:** `app/(marketing)/pricing/page.tsx`

### Layout

Two side-by-side cards, centered, max ~420px each (narrower than homepage's 580px single card). Same card format as `PricingSection` on the homepage.

### Animation

Sequential reveal — fade + translate-up, 1500ms duration each:
- Free card: no delay (fires on viewport enter)
- Pro card: 500ms delay after Free card

### Free Card

| Field | Value |
|-------|-------|
| Label | Free |
| Price | $0 / month |
| Subtitle | Free during beta. No credit card required. |
| Features | Unlimited projects, All file types, AI synthesis + proposal generation, Markdown export, Priority feedback channel |
| CTA | "Get Early Access" → `/login` |

### Pro Card

| Field | Value |
|-------|-------|
| Label | Pro |
| Badge | "Coming Soon" |
| Price | $29 / month |
| Features | Unlimited projects, Up to 20 files per project, Full proposal export, Indefinite session persistence, Priority AI processing, Re-run analysis after adding feedback |
| CTA | "Coming Soon" — disabled button, no link |

### Design Tokens Used

- Cards: `surface-0`, `border-subtle`, `radius-xl`, `shadow-2`
- Checkmarks: `accent-primary`
- CTA (Free): `accent-primary` button → `accent-hover`
- CTA (Pro): disabled — `surface-1` background, `text-disabled` text
- Badge: `accent-muted` background, `accent-primary` text

---

## 5. Environment Variables Required

```
STRIPE_ENABLED=true               # master switch — omit to disable all billing
STRIPE_SECRET_KEY=sk_...          # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...   # Stripe webhook signing secret
STRIPE_PRO_PRICE_ID=price_...     # Stripe price ID for Pro ($29/month)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...  # for future client-side use
```

---

## 6. Files Created / Modified

| File | Action |
|------|--------|
| `supabase/migrations/YYYYMMDD_create_profiles.sql` | Create |
| `lib/billing/stripe.ts` | Create |
| `lib/billing/config.ts` | Create |
| `lib/billing/subscriptions.ts` | Create |
| `lib/billing/checkout.ts` | Create |
| `app/api/billing/checkout/route.ts` | Create |
| `app/api/billing/webhook/route.ts` | Create |
| `app/(marketing)/pricing/page.tsx` | Modify (replace stub) |

---

## 7. What Activates When Flag is On

1. Checkout route creates real Stripe sessions
2. Webhook route syncs subscription status to `profiles`
3. `getUserSubscription()` returns real tier data
4. Duplicate subscription guard enforced

Feature gating (limiting projects/files by tier) is **not** part of this spec — that is a separate post-MVP task.
