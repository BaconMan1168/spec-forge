# Stripe Payments + Pricing Page — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement full Stripe billing infrastructure gated behind `STRIPE_ENABLED=true`, and build out the `/pricing` page with animated Free and Pro tier cards.

**Architecture:** All billing code lives under `lib/billing/` and `app/api/billing/`. A single env var (`STRIPE_ENABLED=true`) gates all Stripe behavior — when absent, every billing route returns gracefully without touching Stripe. The `profiles` table extends Supabase Auth users with billing fields. The pricing page is purely presentational and works regardless of flag state.

**Tech Stack:** Next.js 16 App Router, Stripe Node.js v20 (already installed as `stripe@^20.4.1`), Supabase JS v2 (service role for webhook DB writes), motion/react v12, Vitest + Testing Library (jsdom), Tailwind CSS v4.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/004_create_profiles.sql` | Create | Profiles table, trigger, RLS |
| `lib/supabase/service.ts` | Create | Service-role Supabase client (bypasses RLS) |
| `lib/billing/config.ts` | Create | `BILLING_ENABLED` flag + plan definitions |
| `lib/billing/stripe.ts` | Create | Singleton Stripe client, throws when flag off |
| `lib/billing/subscriptions.ts` | Create | `getUserSubscription()` — reads profiles |
| `lib/billing/checkout.ts` | Create | `createCheckoutSession()` — creates Stripe session |
| `app/api/billing/checkout/route.ts` | Create | POST: auth check, duplicate guard, redirect to Stripe |
| `app/api/billing/webhook/route.ts` | Create | POST: sig verification, 3 event handlers, idempotency |
| `app/(marketing)/pricing/page.tsx` | Modify | Free + Pro cards with sequential reveal animations |

---

## Task 1: Profiles table migration

**Files:**
- Create: `supabase/migrations/004_create_profiles.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/004_create_profiles.sql

create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  subscription_status     text,
  updated_at              timestamptz default now()
);

-- Auto-create a profile row whenever a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Row-level security: users can read their own profile row only
alter table public.profiles enable row level security;

create policy "Users can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

-- No user-facing update policy — billing fields are only written by the
-- service role via the webhook handler, which bypasses RLS.
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase migration up
```

Expected: migration completes without errors. Verify in the Supabase dashboard that the `profiles` table exists with the correct columns.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/004_create_profiles.sql
git commit -m "feat: add profiles table with stripe billing fields and RLS"
```

---

## Task 2: Supabase service client

The webhook handler writes billing data to `profiles` from a server context with no user session. It must use the service role key to bypass RLS.

**Files:**
- Create: `lib/supabase/service.ts`

- [ ] **Step 1: Create the file**

```ts
// lib/supabase/service.ts
import { createClient } from "@supabase/supabase-js";

export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
```

- [ ] **Step 2: Add the env var to `.env.local`**

Find the service role key in: Supabase dashboard → Project Settings → API → `service_role` secret key.

Add to `.env.local` (never commit this file):

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/service.ts
git commit -m "feat: add supabase service client for server-side RLS bypass"
```

---

## Task 3: Billing config and Stripe client

**Files:**
- Create: `lib/billing/config.ts`
- Create: `lib/billing/stripe.ts`
- Create: `lib/billing/stripe.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// lib/billing/stripe.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when STRIPE_ENABLED is not true", async () => {
    vi.stubEnv("STRIPE_ENABLED", "false");
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow("Billing is not enabled");
  });

  it("returns a Stripe instance when STRIPE_ENABLED is true", async () => {
    vi.stubEnv("STRIPE_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
    const { getStripe } = await import("./stripe");
    const stripe = getStripe();
    expect(stripe).toBeDefined();
    expect(typeof stripe.checkout.sessions.create).toBe("function");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/billing/stripe.test.ts
```

Expected: FAIL — `getStripe` is not exported from `./stripe`.

- [ ] **Step 3: Create billing config**

```ts
// lib/billing/config.ts
export const BILLING_ENABLED = process.env.STRIPE_ENABLED === "true";

export const PLANS = {
  free: {
    name: "Free",
    priceUsd: 0,
  },
  pro: {
    name: "Pro",
    priceUsd: 29,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
} as const;
```

- [ ] **Step 4: Create Stripe client**

```ts
// lib/billing/stripe.ts
import Stripe from "stripe";
import { BILLING_ENABLED } from "./config";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!BILLING_ENABLED) {
    throw new Error("Billing is not enabled");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pnpm test lib/billing/stripe.test.ts
```

Expected: PASS — both tests green.

- [ ] **Step 6: Add remaining env vars to `.env.local`**

```
STRIPE_ENABLED=false
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret
STRIPE_PRO_PRICE_ID=price_your_pro_price_id
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
```

To activate billing locally, set `STRIPE_ENABLED=true` and supply real keys.

- [ ] **Step 7: Commit**

```bash
git add lib/billing/config.ts lib/billing/stripe.ts lib/billing/stripe.test.ts
git commit -m "feat: add billing config and stripe client with STRIPE_ENABLED gate"
```

---

## Task 4: Subscriptions helper

Reads the `profiles` table to return a user's current billing state. Used by the checkout route to detect existing subscriptions.

**Files:**
- Create: `lib/billing/subscriptions.ts`
- Create: `lib/billing/subscriptions.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/billing/subscriptions.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "./subscriptions";

const makeSupabase = (profileData: Record<string, unknown> | null) => ({
  from: vi.fn(() => ({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: profileData, error: null }),
      }),
    }),
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getUserSubscription", () => {
  it("returns null fields when profile has no billing data", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        stripe_customer_id: null,
        stripe_subscription_id: null,
        subscription_status: null,
      })
    );
    const result = await getUserSubscription("user-1");
    expect(result).toEqual({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
    });
  });

  it("returns billing data when profile has active subscription", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({
        stripe_customer_id: "cus_123",
        stripe_subscription_id: "sub_456",
        subscription_status: "active",
      })
    );
    const result = await getUserSubscription("user-1");
    expect(result).toEqual({
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
      subscriptionStatus: "active",
    });
  });

  it("returns null fields when profile row does not exist", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase(null)
    );
    const result = await getUserSubscription("user-1");
    expect(result).toEqual({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/billing/subscriptions.test.ts
```

Expected: FAIL — `getUserSubscription` not found.

- [ ] **Step 3: Implement the helper**

```ts
// lib/billing/subscriptions.ts
import { createClient } from "@/lib/supabase/server";

export type SubscriptionStatus = "active" | "canceled" | "past_due" | string | null;

export interface UserSubscription {
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscriptionStatus: SubscriptionStatus;
}

export async function getUserSubscription(userId: string): Promise<UserSubscription> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("stripe_customer_id, stripe_subscription_id, subscription_status")
    .eq("id", userId)
    .single();

  return {
    stripeCustomerId: data?.stripe_customer_id ?? null,
    stripeSubscriptionId: data?.stripe_subscription_id ?? null,
    subscriptionStatus: data?.subscription_status ?? null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/billing/subscriptions.test.ts
```

Expected: PASS — all three tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/billing/subscriptions.ts lib/billing/subscriptions.test.ts
git commit -m "feat: add getUserSubscription helper"
```

---

## Task 5: Checkout helper

Creates a Stripe Checkout session for the Pro plan. Accepts an existing `stripeCustomerId` so returning users aren't double-billed.

**Files:**
- Create: `lib/billing/checkout.ts`
- Create: `lib/billing/checkout.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/billing/checkout.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./stripe", () => ({
  getStripe: vi.fn(),
}));

vi.mock("./config", () => ({
  BILLING_ENABLED: true,
  PLANS: {
    free: { name: "Free", priceUsd: 0 },
    pro: { name: "Pro", priceUsd: 29, stripePriceId: "price_test_pro" },
  },
}));

import { getStripe } from "./stripe";
import { createCheckoutSession } from "./checkout";

const makeStripe = (sessionUrl: string | null) => ({
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({ url: sessionUrl }),
    },
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createCheckoutSession", () => {
  it("returns the checkout session URL", async () => {
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(
      makeStripe("https://checkout.stripe.com/pay/cs_test_abc")
    );
    const url = await createCheckoutSession({
      userId: "user-1",
      userEmail: "user@example.com",
      stripeCustomerId: null,
      returnUrl: "https://app.example.com",
    });
    expect(url).toBe("https://checkout.stripe.com/pay/cs_test_abc");
  });

  it("passes existing stripe customer ID when provided", async () => {
    const mockCreate = vi
      .fn()
      .mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_xyz" });
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      checkout: { sessions: { create: mockCreate } },
    });
    await createCheckoutSession({
      userId: "user-1",
      userEmail: "user@example.com",
      stripeCustomerId: "cus_existing",
      returnUrl: "https://app.example.com",
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_existing" })
    );
  });

  it("throws when Stripe returns no session URL", async () => {
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(makeStripe(null));
    await expect(
      createCheckoutSession({
        userId: "user-1",
        userEmail: "user@example.com",
        stripeCustomerId: null,
        returnUrl: "https://app.example.com",
      })
    ).rejects.toThrow("No session URL");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test lib/billing/checkout.test.ts
```

Expected: FAIL — `createCheckoutSession` not found.

- [ ] **Step 3: Implement the helper**

```ts
// lib/billing/checkout.ts
import { getStripe } from "./stripe";
import { PLANS } from "./config";

export async function createCheckoutSession({
  userId,
  userEmail,
  stripeCustomerId,
  returnUrl,
}: {
  userId: string;
  userEmail: string;
  stripeCustomerId: string | null;
  returnUrl: string;
}): Promise<string> {
  const stripe = getStripe();

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: stripeCustomerId ?? undefined,
    customer_email: stripeCustomerId ? undefined : userEmail,
    line_items: [{ price: PLANS.pro.stripePriceId, quantity: 1 }],
    success_url: `${returnUrl}/dashboard?checkout=success`,
    cancel_url: `${returnUrl}/pricing`,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) throw new Error("No session URL returned from Stripe");
  return session.url;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test lib/billing/checkout.test.ts
```

Expected: PASS — all three tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/billing/checkout.ts lib/billing/checkout.test.ts
git commit -m "feat: add createCheckoutSession helper"
```

---

## Task 6: Checkout API route

Handles POST requests to start a Stripe Checkout flow. Checks auth, detects existing active subscriptions (duplicate guard), then redirects to Stripe.

**Files:**
- Create: `app/api/billing/checkout/route.ts`
- Create: `app/api/billing/checkout/route.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// app/api/billing/checkout/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/billing/config", () => ({ BILLING_ENABLED: true }));
vi.mock("@/lib/billing/subscriptions", () => ({ getUserSubscription: vi.fn() }));
vi.mock("@/lib/billing/checkout", () => ({ createCheckoutSession: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/billing/subscriptions";
import { createCheckoutSession } from "@/lib/billing/checkout";
import { POST } from "./route";

const makeRequest = () =>
  new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: { origin: "http://localhost:3000" },
  });

const makeSupabase = (userId: string | null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: {
        user: userId ? { id: userId, email: "user@test.com" } : null,
      },
    }),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/billing/checkout", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase(null));
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 409 when user already has an active subscription", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase("user-1"));
    (getUserSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_456",
      subscriptionStatus: "active",
    });
    const res = await POST(makeRequest());
    expect(res.status).toBe(409);
  });

  it("returns 200 with checkout URL when user has no active subscription", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase("user-1"));
    (getUserSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
    });
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockResolvedValue(
      "https://checkout.stripe.com/pay/cs_test_abc"
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://checkout.stripe.com/pay/cs_test_abc");
  });

  it("returns 500 when Stripe session creation throws", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase("user-1"));
    (getUserSubscription as ReturnType<typeof vi.fn>).mockResolvedValue({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: null,
    });
    (createCheckoutSession as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("Stripe error")
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test app/api/billing/checkout/route.test.ts
```

Expected: FAIL — route module not found.

- [ ] **Step 3: Implement the route**

```ts
// app/api/billing/checkout/route.ts
import { createClient } from "@/lib/supabase/server";
import { BILLING_ENABLED } from "@/lib/billing/config";
import { getUserSubscription } from "@/lib/billing/subscriptions";
import { createCheckoutSession } from "@/lib/billing/checkout";

export async function POST(request: Request) {
  if (!BILLING_ENABLED) {
    return Response.json(
      { error: { code: "BILLING_DISABLED", message: "Billing is not enabled" } },
      { status: 503 }
    );
  }

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

  // Duplicate subscription guard
  const subscription = await getUserSubscription(user.id);
  if (subscription.subscriptionStatus === "active") {
    return Response.json(
      {
        error: {
          code: "ALREADY_SUBSCRIBED",
          message: "You already have an active subscription",
        },
      },
      { status: 409 }
    );
  }

  const origin =
    request.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  try {
    const url = await createCheckoutSession({
      userId: user.id,
      userEmail: user.email!,
      stripeCustomerId: subscription.stripeCustomerId,
      returnUrl: origin,
    });
    return Response.json({ url });
  } catch {
    return Response.json(
      { error: { code: "CHECKOUT_FAILED", message: "Failed to create checkout session" } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test app/api/billing/checkout/route.test.ts
```

Expected: PASS — all four tests green.

- [ ] **Step 5: Commit**

```bash
git add app/api/billing/checkout/route.ts app/api/billing/checkout/route.test.ts
git commit -m "feat: add billing checkout API route with duplicate subscription guard"
```

---

## Task 7: Webhook handler

Handles three Stripe events. Verifies every request using the Stripe signature header (prevents spoofed webhooks). Idempotent on `subscription.updated` (skips DB write if status is unchanged). Uses the service role client to bypass RLS.

**Important:** Stripe signature verification requires the **raw request body** as a string — do not parse it as JSON first. This is handled by `request.text()`.

**Files:**
- Create: `app/api/billing/webhook/route.ts`
- Create: `app/api/billing/webhook/route.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// app/api/billing/webhook/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/billing/config", () => ({ BILLING_ENABLED: true }));
vi.mock("@/lib/billing/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));

import { getStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";
import { POST } from "./route";

const makeRequest = (body: string, sig?: string) =>
  new Request("http://localhost/api/billing/webhook", {
    method: "POST",
    body,
    headers: sig ? { "stripe-signature": sig } : {},
  });

const makeUpsert = vi.fn().mockResolvedValue({ error: null });
const makeUpdate = vi.fn().mockReturnValue({
  eq: vi.fn().mockResolvedValue({ error: null }),
});

const makeServiceClient = (existingStatus: string | null = null) => ({
  from: vi.fn(() => ({
    upsert: makeUpsert,
    update: makeUpdate,
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi
          .fn()
          .mockResolvedValue({ data: { subscription_status: existingStatus }, error: null }),
      }),
    }),
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/billing/webhook", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: { constructEvent: vi.fn() },
    });
    const res = await POST(makeRequest("{}"));
    expect(res.status).toBe(400);
  });

  it("returns 400 when signature verification fails", async () => {
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockImplementation(() => {
          throw new Error("Invalid signature");
        }),
      },
    });
    const res = await POST(makeRequest("{}", "bad-sig"));
    expect(res.status).toBe(400);
  });

  it("upserts profile on checkout.session.completed", async () => {
    const mockClient = makeServiceClient();
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "checkout.session.completed",
          data: {
            object: {
              metadata: { userId: "user-1" },
              customer: "cus_123",
              subscription: "sub_456",
            },
          },
        }),
      },
    });
    const res = await POST(makeRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    expect(mockClient.from).toHaveBeenCalledWith("profiles");
  });

  it("skips DB write on customer.subscription.updated when status is unchanged", async () => {
    const localUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ error: null }) });
    const mockClient = {
      from: vi.fn(() => ({
        upsert: makeUpsert,
        update: localUpdate,
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active" },
              error: null,
            }),
          }),
        }),
      })),
    };
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "customer.subscription.updated",
          data: {
            object: {
              id: "sub_456",
              status: "active",
              metadata: { userId: "user-1" },
            },
          },
        }),
      },
    });
    const res = await POST(makeRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    expect(localUpdate).not.toHaveBeenCalled();
  });

  it("returns 200 with received:true for unhandled event types", async () => {
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(makeServiceClient());
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "invoice.paid",
          data: { object: {} },
        }),
      },
    });
    const res = await POST(makeRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.received).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test app/api/billing/webhook/route.test.ts
```

Expected: FAIL — webhook route module not found.

- [ ] **Step 3: Implement the webhook handler**

```ts
// app/api/billing/webhook/route.ts
import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { BILLING_ENABLED } from "@/lib/billing/config";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  if (!BILLING_ENABLED) {
    return Response.json(
      { error: { code: "BILLING_DISABLED" } },
      { status: 503 }
    );
  }

  // Raw body required for Stripe signature verification — do NOT parse as JSON first
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return Response.json(
      { error: { code: "MISSING_SIGNATURE" } },
      { status: 400 }
    );
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Signature verification failed";
    return Response.json(
      { error: { code: "INVALID_SIGNATURE", message } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      if (!userId || !session.customer || !session.subscription) break;
      await supabase.from("profiles").upsert({
        id: userId,
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: session.subscription as string,
        subscription_status: "active",
        updated_at: new Date().toISOString(),
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;
      // Idempotency: skip the write if the status hasn't changed
      const { data: existing } = await supabase
        .from("profiles")
        .select("subscription_status")
        .eq("id", userId)
        .single();
      if (existing?.subscription_status === subscription.status) break;
      await supabase
        .from("profiles")
        .update({
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const userId = subscription.metadata?.userId;
      if (!userId) break;
      await supabase
        .from("profiles")
        .update({
          stripe_subscription_id: null,
          subscription_status: "canceled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
      break;
    }

    default:
      break;
  }

  return Response.json({ received: true });
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test app/api/billing/webhook/route.test.ts
```

Expected: PASS — all five tests green.

- [ ] **Step 5: Commit**

```bash
git add app/api/billing/webhook/route.ts app/api/billing/webhook/route.test.ts
git commit -m "feat: add stripe webhook handler with signature verification and idempotency"
```

---

## Task 8: Pricing page

Replace the stub with a full two-card layout. Free card appears immediately; Pro card fades in 500ms later. Both use 1500ms animation duration. Cards are narrower than the homepage `PricingSection` (max-w `420px` vs `580px`).

**Files:**
- Modify: `app/(marketing)/pricing/page.tsx`
- Create: `app/(marketing)/pricing/page.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// app/(marketing)/pricing/page.test.tsx
// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

vi.mock("motion/react", async () => {
  const { createElement } = await import("react");
  const stripMotionProps = (props: Record<string, unknown>) => {
    const motionKeys = new Set([
      "initial", "animate", "exit", "transition",
      "whileInView", "viewport", "whileHover", "whileTap", "layoutId",
    ]);
    return Object.fromEntries(
      Object.entries(props).filter(([k]) => !motionKeys.has(k))
    );
  };
  const make = (el: string) =>
    ({ children, ...rest }: Record<string, unknown>) =>
      createElement(el as string, stripMotionProps(rest) as Record<string, unknown>, children as React.ReactNode);
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

import PricingPage from "./page";

describe("PricingPage", () => {
  it("renders the Free tier label", () => {
    render(<PricingPage />);
    expect(screen.getByText("Free")).toBeInTheDocument();
  });

  it("renders the $0 price", () => {
    render(<PricingPage />);
    expect(screen.getByText("$0")).toBeInTheDocument();
  });

  it("renders the Get Early Access link pointing to /login", () => {
    render(<PricingPage />);
    const link = screen.getByRole("link", { name: /get early access/i });
    expect(link).toHaveAttribute("href", "/login");
  });

  it("renders the Pro tier label", () => {
    render(<PricingPage />);
    expect(screen.getByText("Pro")).toBeInTheDocument();
  });

  it("renders the $29 price", () => {
    render(<PricingPage />);
    expect(screen.getByText("$29")).toBeInTheDocument();
  });

  it("renders a disabled Coming Soon button for the Pro tier", () => {
    render(<PricingPage />);
    const button = screen.getByRole("button", { name: /coming soon/i });
    expect(button).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test app/api/billing/checkout/route.test.ts
```

Wait — run the pricing page test:

```bash
pnpm test "app/(marketing)/pricing/page.test.tsx"
```

Expected: FAIL — current page renders "Full pricing details coming soon." not the tier cards.

- [ ] **Step 3: Implement the pricing page**

```tsx
// app/(marketing)/pricing/page.tsx
"use client";

import Link from "next/link";
import { motion } from "motion/react";

const EASE = [0.22, 1, 0.36, 1] as const;
const VIEWPORT = { once: true, margin: "0px 0px -10px 0px" } as const;

const CARD_REVEAL = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: VIEWPORT,
  transition: { duration: 1.5, delay, ease: EASE },
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
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

const FREE_FEATURES = [
  "2 projects per month",
  "Up to 5 files per project",
  "AI analysis and proposal generation",
  "Markdown export (up to 3 proposals per project)",
  "Projects expire after 7 days",
];

const PRO_FEATURES = [
  "Unlimited projects",
  "Up to 20 files per project",
  "Full proposal export",
  "Indefinite session persistence",
  "Priority AI processing",
  "Re-run analysis after adding feedback",
];

export default function PricingPage() {
  return (
    <main className="relative z-10 mx-auto max-w-[1200px] px-16 pb-[120px] pt-[160px]">
      <div className="mb-[80px] text-center">
        <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-accent-primary)]">
          Pricing
        </p>
        <h1 className="mb-6 text-[76px] font-bold leading-[1.05] tracking-[-0.03em]">
          Simple, transparent pricing
        </h1>
        <p className="mx-auto max-w-[480px] text-[19px] leading-[1.75] text-[var(--color-text-tertiary)]">
          Start free. Upgrade when you&apos;re ready.
        </p>
      </div>

      <div className="flex flex-col items-center justify-center gap-8 md:flex-row md:items-stretch">
        {/* Free card */}
        <motion.div {...CARD_REVEAL(0)} className="w-full max-w-[420px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              Free
            </p>
            <div className="mb-2 text-[56px] font-bold leading-none text-[var(--color-text-primary)]">
              $0{" "}
              <span className="text-[20px] font-normal text-[var(--color-text-tertiary)]">
                / month
              </span>
            </div>
            <p className="mb-8 text-[14px] text-[var(--color-text-tertiary)]">
              Free during beta. No credit card required.
            </p>
            <ul className="mb-10 flex flex-col gap-3">
              {FREE_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <Link
                href="/login"
                className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Get Early Access
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Pro card — 500ms sequential delay */}
        <motion.div {...CARD_REVEAL(0.5)} className="w-full max-w-[420px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 opacity-80 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
                Pro
              </p>
              <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-muted)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-accent-primary)]">
                Coming Soon
              </span>
            </div>
            <div className="mb-2 text-[56px] font-bold leading-none text-[var(--color-text-primary)]">
              $29{" "}
              <span className="text-[20px] font-normal text-[var(--color-text-tertiary)]">
                / month
              </span>
            </div>
            <p className="mb-8 text-[14px] text-[var(--color-text-tertiary)]">
              For active PMs and founders using SpecForge regularly.
            </p>
            <ul className="mb-10 flex flex-col gap-3">
              {PRO_FEATURES.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-3 text-[14px] text-[var(--color-text-secondary)]"
                >
                  <CheckIcon />
                  {f}
                </li>
              ))}
            </ul>
            <div className="mt-auto">
              <button
                disabled
                className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-[var(--radius-pill)] bg-[var(--color-surface-1)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-text-disabled)]"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run the pricing page tests**

```bash
pnpm test "app/(marketing)/pricing/page.test.tsx"
```

Expected: PASS — all six tests green.

- [ ] **Step 5: Run full suite and typecheck**

```bash
pnpm typecheck && pnpm test
```

Expected: zero type errors, all tests pass.

- [ ] **Step 6: Commit**

```bash
git add "app/(marketing)/pricing/page.tsx" "app/(marketing)/pricing/page.test.tsx"
git commit -m "feat: build pricing page with animated free and pro tier cards"
```

---

## Spec Coverage Check

| Spec requirement | Task |
|-----------------|------|
| `profiles` table + trigger + RLS | Task 1 |
| `STRIPE_ENABLED` env var gates all billing | Tasks 3, 6, 7 |
| `lib/billing/` structure | Tasks 3–5 |
| Checkout route with auth check | Task 6 |
| Duplicate subscription guard (409) | Task 6 |
| Webhook signature verification | Task 7 |
| Idempotent webhook handling | Task 7 |
| Raw body for webhook | Task 7 (`request.text()`) |
| 3 webhook events handled | Task 7 |
| Service role client for DB writes | Tasks 2, 7 |
| Pricing page Free + Pro cards | Task 8 |
| Sequential animations (1500ms, 500ms delay) | Task 8 |
| Skinnier cards than homepage (~420px) | Task 8 |
| Pro CTA disabled | Task 8 |
| Pro "Coming Soon" badge | Task 8 |
| Design system tokens only | Task 8 |
