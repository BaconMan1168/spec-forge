# Upgrade Confirmation Modal + Stale Canceling State Fix

**Date:** 2026-04-13  
**Status:** Approved

---

## Problem

Two UX bugs exist in the billing/settings flow:

1. **No confirmation before upgrading** — clicking "Upgrade to Max" on the settings page fires the Stripe API immediately with no confirmation, even though the user is about to be charged money.
2. **Stale "Canceling" state after upgrade** — when a Pro user with a pending cancellation upgrades to Max, the upgrade API clears `subscription_plan` but never clears `subscription_cancel_at` (DB) or `cancel_at_period_end` (Stripe). The settings page then shows "Canceling" badge with no cancel button even though the user is now on Max.

---

## Solution

### 1. New API endpoint: `GET /api/billing/upgrade/preview`

Fetches the exact prorated charge the user will pay immediately if they upgrade now.

**Request:** `GET /api/billing/upgrade/preview`  
**Auth:** Required (user session)

**Response (success):**
```json
{ "amountDue": 484, "currency": "usd" }
```
`amountDue` is in cents. The client formats it (e.g. `$4.84`).

**Implementation:**
- Authenticate user, load `stripe_subscription_id` and `subscription_plan` from profiles
- Return `400` if no active subscription
- Return `409` if already on Max
- Call `stripe.invoices.retrieveUpcoming` with the Max price ID as the new item
- Return the `amount_due` from the upcoming invoice

**Error handling:** If the preview call fails, the client falls back to descriptive text and still allows the user to upgrade.

---

### 2. Fix `POST /api/billing/upgrade`

After updating the Stripe subscription, also:
- Set `cancel_at_period_end: false` on the Stripe subscription (removes any pending cancellation)
- Clear `subscription_cancel_at` in the profiles table (alongside the existing `subscription_plan: "max"` update)

---

### 3. Upgrade confirmation modal

A new `upgradeConfirmOpen` state gates the upgrade flow. Clicking "Upgrade to Max" opens the modal instead of firing the API directly.

**Modal behavior:**
- Opens → immediately fetches `/api/billing/upgrade/preview` to load the prorated amount
- While loading: show a skeleton pulse in place of the dollar amount
- On success: show the exact amount
- On fetch error: fall back to "a prorated amount for the remainder of your billing period"

**Modal content — normal state (Pro, no pending cancellation):**
- Title: "Upgrade to Max"
- Body: "Upgrade to Max — $19/mo. You'll be charged **[prorated amount]** now for the remainder of this billing period."
- Buttons: "Cancel" (secondary) + "Upgrade — $19/mo" (primary, accent)

**Modal content — canceling state (Pro, pending cancellation):**
- Same as above, plus: "Your scheduled cancellation will also be removed and your subscription reactivated."

**Animations:**
- Backdrop + card entrance/exit via Framer Motion — same timing and easing as the existing cancel confirmation modal (`BACKDROP_TRANSITION`, `CARD_TRANSITION`)
- Skeleton uses a pulsing opacity animation on a rounded placeholder element
- Upgrade button uses the same shimmer/slide overlay animation as existing accent buttons (translate-y shimmer on hover)
- Button loading state: "Upgrading…" text while the API call is in flight

**Error handling:** API errors display inline above the buttons (same pattern as existing `error` state in `SubscriptionActions`).

---

## Files to Create / Modify

| File | Change |
|------|--------|
| `app/api/billing/upgrade/preview/route.ts` | New — proration preview endpoint |
| `app/api/billing/upgrade/route.ts` | Fix — clear `cancel_at_period_end` + `subscription_cancel_at` on upgrade |
| `components/billing/subscription-actions.tsx` | Add upgrade confirmation modal with proration fetch, skeleton, animations |

---

## Out of Scope

- No changes to the cancel flow
- No changes to the free → Pro checkout flow
- No changes to design tokens or global styles
