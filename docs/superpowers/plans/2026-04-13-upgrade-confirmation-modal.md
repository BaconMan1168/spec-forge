# Upgrade Confirmation Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a confirmation modal before upgrading to Max (with live proration preview), and fix the stale "Canceling" state that persists after upgrading from a canceling subscription.

**Architecture:** Three-task sequence — (1) add a proration preview API endpoint, (2) fix the upgrade API to clear cancellation state, (3) wire up the confirmation modal in the `SubscriptionActions` component. Tasks 1 and 2 are independent and can be done in either order; Task 3 depends on both.

**Tech Stack:** Next.js App Router (Route Handlers), Stripe Node SDK, Supabase (server client + service client), React with Framer Motion, Vitest

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/api/billing/upgrade/preview/route.ts` | Create | `GET` handler — returns prorated charge amount via Stripe upcoming invoice preview |
| `app/api/billing/upgrade/preview/route.test.ts` | Create | Unit tests for the preview endpoint |
| `app/api/billing/upgrade/route.ts` | Modify | Fix — also clear `cancel_at_period_end` in Stripe and `subscription_cancel_at` in DB on upgrade |
| `app/api/billing/upgrade/route.test.ts` | Create | Unit tests for the upgrade endpoint (including cancellation clearing) |
| `components/billing/subscription-actions.tsx` | Modify | Add upgrade confirmation modal with proration fetch, skeleton, and animations |

---

## Task 1: Add `GET /api/billing/upgrade/preview` endpoint

**Files:**
- Create: `app/api/billing/upgrade/preview/route.ts`
- Create: `app/api/billing/upgrade/preview/route.test.ts`

### Step 1.1: Write the failing tests

Create `app/api/billing/upgrade/preview/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/billing/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/billing/config", () => ({
  PLANS: {
    max: { stripePriceId: "price_max_test" },
  },
}));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { GET } from "./route";

const makeSupabase = (user: { id: string } | null, profile: Record<string, unknown> | null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user } }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: profile }),
      }),
    }),
  })),
});

const makeStripe = (upcomingInvoice: Record<string, unknown>) => ({
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue({
      items: { data: [{ id: "si_abc" }] },
    }),
  },
  invoices: {
    retrieveUpcoming: vi.fn().mockResolvedValue(upcomingInvoice),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/billing/upgrade/preview", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase(null, null));
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 400 when no active subscription", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: null, stripe_subscription_id: null, subscription_plan: "pro" })
    );
    const res = await GET();
    expect(res.status).toBe(400);
  });

  it("returns 409 when already on Max", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "max" })
    );
    const res = await GET();
    expect(res.status).toBe(409);
  });

  it("returns amountDue and currency from Stripe upcoming invoice", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(
      makeStripe({ amount_due: 484, currency: "usd" })
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ amountDue: 484, currency: "usd" });
  });

  it("returns 500 when Stripe throws", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      subscriptions: { retrieve: vi.fn().mockRejectedValue(new Error("Stripe error")) },
      invoices: { retrieveUpcoming: vi.fn() },
    });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
```

### Step 1.2: Run tests to verify they fail

```bash
pnpm test app/api/billing/upgrade/preview/route.test.ts
```

Expected: FAIL — `Cannot find module './route'`

### Step 1.3: Implement the preview route

Create `app/api/billing/upgrade/preview/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/config";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, subscription_plan")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) {
    return Response.json(
      { error: { code: "NO_SUBSCRIPTION", message: "No active subscription found" } },
      { status: 400 }
    );
  }

  if (profile.subscription_plan === "max") {
    return Response.json(
      { error: { code: "ALREADY_MAX", message: "You are already on the Max plan" } },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();

    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const subscriptionItemId = subscription.items.data[0]?.id;

    const upcoming = await stripe.invoices.retrieveUpcoming({
      customer: profile.stripe_customer_id,
      subscription: profile.stripe_subscription_id,
      subscription_items: [
        {
          id: subscriptionItemId,
          price: PLANS.max.stripePriceId,
        },
      ],
    });

    return Response.json({
      amountDue: upcoming.amount_due,
      currency: upcoming.currency,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch preview";
    return Response.json(
      { error: { code: "PREVIEW_FAILED", message } },
      { status: 500 }
    );
  }
}
```

### Step 1.4: Run tests to verify they pass

```bash
pnpm test app/api/billing/upgrade/preview/route.test.ts
```

Expected: All 5 tests PASS

### Step 1.5: Commit

```bash
git checkout -b fix/upgrade-confirmation-ux
git add app/api/billing/upgrade/preview/route.ts app/api/billing/upgrade/preview/route.test.ts
git commit -m "feat: add GET /api/billing/upgrade/preview endpoint"
```

---

## Task 2: Fix `POST /api/billing/upgrade` to clear cancellation state

**Files:**
- Modify: `app/api/billing/upgrade/route.ts`
- Create: `app/api/billing/upgrade/route.test.ts`

### Step 2.1: Write the failing tests

Create `app/api/billing/upgrade/route.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/billing/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/billing/config", () => ({
  PLANS: {
    max: { stripePriceId: "price_max_test" },
  },
}));

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/billing/stripe";
import { POST } from "./route";

const makeSupabase = (user: { id: string } | null, profile: Record<string, unknown> | null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user } }),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: profile }),
      }),
    }),
  })),
});

const makeServiceSupabase = () => {
  const updateMock = vi.fn().mockReturnValue({
    eq: vi.fn().mockResolvedValue({ error: null }),
  });
  return {
    from: vi.fn(() => ({ update: updateMock })),
    _updateMock: updateMock,
  };
};

const makeStripe = (overrides: Record<string, unknown> = {}) => ({
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue({
      items: { data: [{ id: "si_abc" }] },
    }),
    update: vi.fn().mockResolvedValue({ id: "sub_1" }),
    ...overrides,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/billing/upgrade", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase(null, null));
    const res = await POST(new Request("http://localhost/api/billing/upgrade", { method: "POST" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when no subscription exists", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: null, stripe_subscription_id: null, subscription_plan: "pro" })
    );
    const res = await POST(new Request("http://localhost/api/billing/upgrade", { method: "POST" }));
    expect(res.status).toBe(400);
  });

  it("returns 409 when already on Max", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "max" })
    );
    const res = await POST(new Request("http://localhost/api/billing/upgrade", { method: "POST" }));
    expect(res.status).toBe(409);
  });

  it("calls stripe.subscriptions.update with cancel_at_period_end: false", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    const stripe = makeStripe();
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(stripe);
    const serviceSupabase = makeServiceSupabase();
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(serviceSupabase);

    const res = await POST(new Request("http://localhost/api/billing/upgrade", { method: "POST" }));
    expect(res.status).toBe(200);
    expect(stripe.subscriptions.update).toHaveBeenCalledWith(
      "sub_1",
      expect.objectContaining({ cancel_at_period_end: false })
    );
  });

  it("clears subscription_cancel_at in the profile update", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(makeStripe());
    const serviceSupabase = makeServiceSupabase();
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(serviceSupabase);

    await POST(new Request("http://localhost/api/billing/upgrade", { method: "POST" }));
    expect(serviceSupabase._updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_plan: "max",
        subscription_cancel_at: null,
      })
    );
  });

  it("returns 500 when Stripe throws", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      subscriptions: {
        retrieve: vi.fn().mockRejectedValue(new Error("Stripe error")),
        update: vi.fn(),
      },
    });
    const res = await POST(new Request("http://localhost/api/billing/upgrade", { method: "POST" }));
    expect(res.status).toBe(500);
  });
});
```

### Step 2.2: Run tests to verify they fail

```bash
pnpm test app/api/billing/upgrade/route.test.ts
```

Expected: FAIL — the two new assertions (`cancel_at_period_end` and `subscription_cancel_at: null`) will fail against the current implementation.

### Step 2.3: Update the upgrade route

Replace the contents of `app/api/billing/upgrade/route.ts`:

```typescript
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getStripe } from "@/lib/billing/stripe";
import { PLANS } from "@/lib/billing/config";

export async function POST(request: Request) {
  void request;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, subscription_plan")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id || !profile?.stripe_subscription_id) {
    return Response.json(
      { error: { code: "NO_SUBSCRIPTION", message: "No active subscription found" } },
      { status: 400 }
    );
  }

  if (profile.subscription_plan === "max") {
    return Response.json(
      { error: { code: "ALREADY_MAX", message: "You are already on the Max plan" } },
      { status: 409 }
    );
  }

  try {
    const stripe = getStripe();

    const subscription = await stripe.subscriptions.retrieve(
      profile.stripe_subscription_id
    );
    const subscriptionItemId = subscription.items.data[0]?.id;

    if (!subscriptionItemId) {
      return Response.json(
        { error: { code: "NO_SUBSCRIPTION_ITEM", message: "Could not find subscription item" } },
        { status: 500 }
      );
    }

    await stripe.subscriptions.update(profile.stripe_subscription_id, {
      items: [
        {
          id: subscriptionItemId,
          price: PLANS.max.stripePriceId,
          quantity: 1,
        },
      ],
      cancel_at_period_end: false,
    });

    const serviceSupabase = createServiceClient();
    await serviceSupabase
      .from("profiles")
      .update({
        subscription_plan: "max",
        subscription_cancel_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    return Response.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to upgrade subscription";
    return Response.json(
      { error: { code: "UPGRADE_FAILED", message } },
      { status: 500 }
    );
  }
}
```

### Step 2.4: Run tests to verify they pass

```bash
pnpm test app/api/billing/upgrade/route.test.ts
```

Expected: All 6 tests PASS

### Step 2.5: Commit

```bash
git add app/api/billing/upgrade/route.ts app/api/billing/upgrade/route.test.ts
git commit -m "fix: clear cancel_at_period_end and subscription_cancel_at on upgrade"
```

---

## Task 3: Add upgrade confirmation modal to `SubscriptionActions`

**Files:**
- Modify: `components/billing/subscription-actions.tsx`

### Step 3.1: Add state and proration fetch logic

In `components/billing/subscription-actions.tsx`, add three new state variables after the existing ones and add the `fetchPreview` function. Replace the `useState` block and `handleUpgrade` function:

```typescript
const [upgradeLoading, setUpgradeLoading] = useState(false);
const [cancelLoading, setCancelLoading] = useState(false);
const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
const [upgradeConfirmOpen, setUpgradeConfirmOpen] = useState(false);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewAmount, setPreviewAmount] = useState<{ amountDue: number; currency: string } | null>(null);
const [previewFailed, setPreviewFailed] = useState(false);
const [error, setError] = useState<string | null>(null);
const isClient = useIsClient();

async function openUpgradeConfirm() {
  setUpgradeConfirmOpen(true);
  setPreviewLoading(true);
  setPreviewAmount(null);
  setPreviewFailed(false);
  try {
    const res = await fetch("/api/billing/upgrade/preview");
    const body = await res.json();
    if (!res.ok) {
      setPreviewFailed(true);
      return;
    }
    setPreviewAmount({ amountDue: body.amountDue, currency: body.currency });
  } catch {
    setPreviewFailed(true);
  } finally {
    setPreviewLoading(false);
  }
}

async function handleUpgrade() {
  setError(null);
  setUpgradeLoading(true);
  try {
    const res = await fetch("/api/billing/upgrade", { method: "POST" });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error?.message ?? "Failed to upgrade. Please try again.");
      setUpgradeConfirmOpen(false);
      return;
    }
    window.location.href = "/dashboard?upgrade=success";
  } catch {
    setError("Network error. Please try again.");
    setUpgradeConfirmOpen(false);
  } finally {
    setUpgradeLoading(false);
  }
}
```

### Step 3.2: Change the "Upgrade to Max" button to open the modal

Replace the `onClick={handleUpgrade}` on the Pro upgrade button:

```typescript
{plan === "pro" && (
  <button
    onClick={openUpgradeConfirm}
    disabled={upgradeLoading}
    className="group relative w-full cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)] disabled:cursor-not-allowed disabled:opacity-60"
  >
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 translate-y-full bg-black/25 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
    />
    <span className="relative">
      {upgradeLoading ? "Upgrading…" : "Upgrade to Max — $19/mo"}
    </span>
  </button>
)}
```

### Step 3.3: Add the upgrade confirmation modal

Add the upgrade modal portal immediately after the existing cancel confirmation modal portal (inside the `<>` fragment, after the cancel `isClient && createPortal(...)` block):

```typescript
{/* Upgrade confirmation modal */}
{isClient && createPortal(
  <AnimatePresence>
    {upgradeConfirmOpen && (
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="upgrade-modal-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={BACKDROP_TRANSITION}
        onClick={() => !upgradeLoading && setUpgradeConfirmOpen(false)}
      >
        <motion.div
          className="w-full max-w-[400px] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-7 shadow-[var(--shadow-3)]"
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={CARD_TRANSITION}
          onClick={(e) => e.stopPropagation()}
        >
          <h2
            id="upgrade-modal-title"
            className="mb-5 text-[17px] font-semibold text-[var(--color-text-primary)]"
          >
            Upgrade to Max
          </h2>

          <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
            Upgrade to Max — $19/mo. You&apos;ll be charged{" "}
            {previewLoading ? (
              <span className="inline-block h-[1em] w-12 animate-pulse rounded bg-[var(--color-border-subtle)] align-middle" />
            ) : previewFailed || !previewAmount ? (
              <span>a prorated amount</span>
            ) : (
              <strong>
                {new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: previewAmount.currency.toUpperCase(),
                }).format(previewAmount.amountDue / 100)}
              </strong>
            )}{" "}
            now for the remainder of this billing period, then $19/mo going
            forward.
          </p>

          {cancelAt && (
            <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              Your scheduled cancellation will also be removed and your
              subscription reactivated.
            </p>
          )}

          <p className="mb-7 text-[13px] text-[var(--color-text-tertiary)]">
            Your existing payment method will be charged automatically.
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setUpgradeConfirmOpen(false)}
              disabled={upgradeLoading}
              className="flex-1 cursor-pointer rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpgrade}
              disabled={upgradeLoading}
              className="group relative flex-1 cursor-pointer overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-4 py-2.5 text-[14px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[120ms] hover:bg-[var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 translate-y-full bg-black/25 transition-transform duration-500 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
              />
              <span className="relative">
                {upgradeLoading ? "Upgrading…" : "Upgrade — $19/mo"}
              </span>
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>,
  document.body
)}
```

### Step 3.4: Run lint, typecheck, and tests

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: All pass with no errors or warnings.

### Step 3.5: Commit

```bash
git add components/billing/subscription-actions.tsx
git commit -m "feat: add upgrade confirmation modal with proration preview"
```

---

## Task 4: Final validation

### Step 4.1: Run the full check suite

```bash
pnpm lint && pnpm typecheck && pnpm test
```

Expected: All pass.

### Step 4.2: Manual smoke test checklist

1. Log in as a Pro user with no pending cancellation
   - Go to `/settings`
   - Click "Upgrade to Max — $19/mo"
   - Modal opens, skeleton shows briefly, then real proration amount appears
   - Click "Cancel" — modal closes, nothing charged
   - Click "Upgrade to Max — $19/mo" again → confirm → button shows "Upgrading…" → redirects to `/dashboard?upgrade=success`
   - Return to `/settings` — plan shows "Max", no "Canceling" badge, no cancel button visible (shows "All features unlocked")

2. Log in as a Pro user with a pending cancellation
   - Go to `/settings` — confirm "Canceling" badge is visible
   - Click "Upgrade to Max — $19/mo"
   - Modal shows the reactivation note: "Your scheduled cancellation will also be removed…"
   - Confirm upgrade
   - Return to `/settings` — plan shows "Max", "Canceling" badge is gone, "All features unlocked" row is shown

### Step 4.3: Create PR

```bash
gh pr create --title "fix: upgrade confirmation modal and stale canceling state" --body "$(cat <<'EOF'
## Summary
- Adds confirmation modal before upgrading to Max, showing the exact prorated charge via Stripe upcoming invoice preview
- Fixes stale "Canceling" badge after upgrading from a canceling Pro subscription by clearing \`cancel_at_period_end\` in Stripe and \`subscription_cancel_at\` in the DB
- Modal reuses existing animation patterns and design tokens

## Test plan
- [ ] Pro user with no cancellation: modal opens, skeleton appears, real amount shown, cancel closes modal, confirm upgrades
- [ ] Pro user with cancellation pending: modal shows reactivation note, upgrade clears "Canceling" badge
- [ ] All unit tests pass: \`pnpm test\`
- [ ] No lint/typecheck errors: \`pnpm lint && pnpm typecheck\`
EOF
)"
```
