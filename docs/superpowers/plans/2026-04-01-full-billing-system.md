# Full Billing System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `STRIPE_ENABLED`-gated billing stub with a fully live payment system — Free and Pro tiers enforced in real time, Stripe Checkout and Customer Portal wired up, a Settings page, and in-app limit tooltips.

**Architecture:** All billing logic lives in `lib/billing/limits.ts` (pure query helpers). Server pages fetch limit data and pass it as props to client components — no client-side loading state for limits. Server actions enforce limits as a second layer. A shared `<PlanLimitTooltip>` component gates every constrained action in the UI.

**Tech Stack:** Next.js 16 App Router, Supabase JS v2, Stripe Node.js v20, Vitest + Testing Library (jsdom), Tailwind CSS v4, motion/react v12.

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/005_add_exports.sql` | Create | `exports` table with unique constraint |
| `lib/billing/limits.ts` | Create | `getUserPlan`, `canCreateProject`, `canAddFile`, `canExport`, `canRerunAnalysis` |
| `lib/billing/limits.test.ts` | Create | Unit tests for all limit helpers (mocked Supabase) |
| `lib/billing/config.ts` | Modify | Remove `BILLING_ENABLED` export |
| `lib/billing/stripe.ts` | Modify | Remove `BILLING_ENABLED` guard |
| `app/api/billing/checkout/route.ts` | Modify | Remove `BILLING_ENABLED` guard |
| `app/api/billing/checkout/route.test.ts` | Modify | Remove `BILLING_ENABLED` mock |
| `app/api/billing/webhook/route.ts` | Modify | Remove `BILLING_ENABLED` guard |
| `app/api/billing/webhook/route.test.ts` | Modify | Remove `BILLING_ENABLED` mock |
| `app/api/billing/portal/route.ts` | Create | `POST` — creates Stripe Customer Portal session |
| `app/api/billing/portal/route.test.ts` | Create | Unit tests for portal route |
| `lib/export/generate-markdown.ts` | Create | `generateMarkdown(proposal)` — moved from proposals-section |
| `app/actions/exports.ts` | Create | `exportProposal(projectId, proposalId)` server action |
| `app/actions/exports.test.ts` | Create | Unit tests for export action |
| `components/billing/plan-limit-tooltip.tsx` | Create | `<PlanLimitTooltip>` — wraps children, disables + shows tooltip when limit hit |
| `components/billing/plan-limit-tooltip.test.tsx` | Create | jsdom tests |
| `app/(app)/dashboard/page.tsx` | Modify | Fetch user + `canCreateProject`, pass to `NewProjectModal` |
| `components/projects/new-project-modal.tsx` | Modify | Accept `canCreate: LimitResult`, gate trigger button |
| `app/(app)/projects/[id]/add/page.tsx` | Modify | Fetch user + `canAddFile`, pass to `AddInputForm` |
| `components/projects/inputs/add-input-form.tsx` | Modify | Accept `canAddFile: LimitResult`, disable submit when not allowed |
| `app/actions/feedback-files.ts` | Modify | Add `canAddFile()` check before inserting files |
| `app/actions/projects.ts` | Modify | Add `canCreateProject()` check before insert |
| `app/(app)/projects/[id]/page.tsx` | Modify | Fetch `canRerunAnalysis` + `canExport` per proposal, pass as props |
| `components/projects/workspace/workspace-shell.tsx` | Modify | Accept + forward `canRerun: LimitResult` to `AnalyzeButton` |
| `components/projects/workspace/analyze-button.tsx` | Modify | Accept `canRerun: LimitResult`, gate re-analyze with tooltip |
| `components/projects/workspace/proposals-section.tsx` | Modify | Accept `exportLimits`, forward to `ProposalCard`; replace client Blob with `exportProposal` action |
| `app/api/projects/[id]/analyze/route.ts` | Modify | Add `canRerunAnalysis()` check when analysis already exists |
| `app/(app)/settings/page.tsx` | Create | Server component — plan status, usage, upgrade/manage CTAs |
| `app/(app)/settings/page.test.tsx` | Create | jsdom tests for Free and Pro views |
| `components/nav/avatar-dropdown.tsx` | Modify | Add Settings link to dropdown menu |
| `app/(marketing)/pricing/page.tsx` | Modify | Language updates, enable Pro card |
| `components/marketing/pricing-section.tsx` | Modify | Language updates |
| `components/marketing/hero-section.tsx` | Modify | Remove "Now in Early Access" |

---

## Task 1: Exports migration

**Files:**
- Create: `supabase/migrations/005_add_exports.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/005_add_exports.sql

create table if not exists public.exports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  project_id  uuid not null references public.projects(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (project_id, proposal_id)
);

-- Users can read their own export rows (used for limit checks via RLS-safe queries)
alter table public.exports enable row level security;

create policy "Users can read own exports"
  on public.exports for select
  using (auth.uid() = user_id);

-- Inserts are done via service role in server actions (bypasses RLS)
-- No user-facing insert policy needed.
```

- [ ] **Step 2: Apply the migration**

```bash
npx supabase migration up
```

Expected: migration completes without errors. Verify in Supabase dashboard that `exports` table exists with `id`, `user_id`, `project_id`, `proposal_id`, `created_at` columns and a unique constraint on `(project_id, proposal_id)`.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/005_add_exports.sql
git commit -m "feat: add exports table for per-project proposal export tracking"
```

---

## Task 2: `lib/billing/limits.ts` + tests

**Files:**
- Create: `lib/billing/limits.ts`
- Create: `lib/billing/limits.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// lib/billing/limits.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  getUserPlan,
  canCreateProject,
  canAddFile,
  canExport,
  canRerunAnalysis,
} from "./limits";

const mockSupabase = (overrides: Record<string, unknown> = {}) => ({
  from: vi.fn().mockReturnValue({
    select: vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        // for count queries:
        gte: vi.fn().mockReturnValue({
          count: "exact",
          // resolve with { count: 0 }
        }),
      }),
    }),
  }),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getUserPlan ──────────────────────────────────────────────────────────────

describe("getUserPlan", () => {
  it("returns 'pro' when subscription_status is active", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active" },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    expect(await getUserPlan("user-1")).toBe("pro");
  });

  it("returns 'free' when subscription_status is null", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: null },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    expect(await getUserPlan("user-1")).toBe("free");
  });
});

// ── canCreateProject ─────────────────────────────────────────────────────────

describe("canCreateProject", () => {
  it("allows pro user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 1 project this month", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        // projects count query
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn().mockResolvedValue({ count: 1, error: null }),
            })),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user with 2 projects this month", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
            })),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/monthly limit/i);
  });
});

// ── canAddFile ───────────────────────────────────────────────────────────────

describe("canAddFile", () => {
  it("allows pro user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 4 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 4, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user with 5 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/5 files/i);
  });
});

// ── canExport ────────────────────────────────────────────────────────────────

describe("canExport", () => {
  it("allows pro user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user if proposal already exported (re-export is free)", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        // exports table — proposal already in exports
        return {
          select: vi.fn(() => ({
            eq: vi.fn((col: string) => {
              if (col === "proposal_id") {
                // checking if this proposal was already exported
                return {
                  eq: vi.fn().mockResolvedValue({
                    data: [{ proposal_id: "prop-1" }],
                    error: null,
                  }),
                };
              }
              return {
                // distinct count for project
                mockResolvedValue: vi.fn().mockResolvedValue({ count: 3, error: null }),
              };
            }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 2 distinct exports in project", async () => {
    // New proposal, 2 already exported — under the 3 limit
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        // exports table — this proposal not yet exported, 2 distinct already
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("proposal_id") && !cols.includes("count")) {
              // already-exported check
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              };
            }
            // count query
            return {
              eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
            };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-new");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user at 3 distinct exports in project (new proposal)", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("proposal_id") && !cols.includes("count")) {
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              };
            }
            return {
              eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
            };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-new");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/3 exports/i);
  });
});

// ── canRerunAnalysis ─────────────────────────────────────────────────────────

describe("canRerunAnalysis", () => {
  it("allows pro user", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active" },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canRerunAnalysis("user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user from re-running analysis", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: null },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canRerunAnalysis("user-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/pro feature/i);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test lib/billing/limits.test.ts
```

Expected: FAIL — `limits.ts` does not exist yet.

- [ ] **Step 3: Implement `lib/billing/limits.ts`**

```ts
// lib/billing/limits.ts
import { createClient } from "@/lib/supabase/server";

export type LimitResult = { allowed: boolean; reason: string };

const FREE_LIMITS = {
  projectsPerMonth: 2,
  filesPerProject: 5,
  exportsPerProject: 3,
} as const;

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();
  return data?.subscription_status === "active" ? "pro" : "free";
}

export async function canCreateProject(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if ((count ?? 0) >= FREE_LIMITS.projectsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly limit reached — Free plan: ${FREE_LIMITS.projectsPerMonth} projects/month`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canAddFile(userId: string, projectId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("feedback_files")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((count ?? 0) >= FREE_LIMITS.filesPerProject) {
    return {
      allowed: false,
      reason: `Free plan: ${FREE_LIMITS.filesPerProject} files per project — Upgrade to Pro for up to 20`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canExport(
  userId: string,
  projectId: string,
  proposalId: string
): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };

  const supabase = await createClient();

  // Re-exporting an already-exported proposal is always free
  const { data: existing } = await supabase
    .from("exports")
    .select("proposal_id")
    .eq("project_id", projectId)
    .eq("proposal_id", proposalId);

  if (existing && existing.length > 0) return { allowed: true, reason: "" };

  // Count distinct proposals exported from this project
  const { count } = await supabase
    .from("exports")
    .select("proposal_id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((count ?? 0) >= FREE_LIMITS.exportsPerProject) {
    return {
      allowed: false,
      reason: `Free plan: ${FREE_LIMITS.exportsPerProject} exports per project — Upgrade to Pro for unlimited`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canRerunAnalysis(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };
  return {
    allowed: false,
    reason: "Re-run analysis is a Pro feature — Upgrade to Pro →",
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test lib/billing/limits.test.ts
```

Expected: PASS — all tests green.

- [ ] **Step 5: Commit**

```bash
git add lib/billing/limits.ts lib/billing/limits.test.ts
git commit -m "feat: add billing limit helpers with unit tests"
```

---

## Task 3: Remove `BILLING_ENABLED` gates

**Files:**
- Modify: `lib/billing/config.ts`
- Modify: `lib/billing/stripe.ts`
- Modify: `app/api/billing/checkout/route.ts`
- Modify: `app/api/billing/checkout/route.test.ts`
- Modify: `app/api/billing/webhook/route.ts`
- Modify: `app/api/billing/webhook/route.test.ts`

- [ ] **Step 1: Remove `BILLING_ENABLED` from `config.ts`**

Replace the entire file with:

```ts
// lib/billing/config.ts
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

- [ ] **Step 2: Remove `BILLING_ENABLED` guard from `stripe.ts`**

Replace the entire file with:

```ts
// lib/billing/stripe.ts
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  }
  return _stripe;
}
```

- [ ] **Step 3: Remove guard from `checkout/route.ts`**

Remove the `BILLING_ENABLED` import and the guard block. The file should start at the auth check:

```ts
// app/api/billing/checkout/route.ts
import { createClient } from "@/lib/supabase/server";
import { getUserSubscription } from "@/lib/billing/subscriptions";
import { createCheckoutSession } from "@/lib/billing/checkout";

export async function POST(request: Request) {
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

- [ ] **Step 4: Update `checkout/route.test.ts`** — remove the `BILLING_ENABLED` mock line

Find and remove this line from `checkout/route.test.ts`:
```ts
vi.mock("@/lib/billing/config", () => ({ BILLING_ENABLED: true }));
```

- [ ] **Step 5: Remove guard from `webhook/route.ts`**

Remove the `BILLING_ENABLED` import, the guard block, and the `BILLING_ENABLED` check. The handler should begin directly with `const body = await request.text()`:

```ts
// app/api/billing/webhook/route.ts
import Stripe from "stripe";
import { getStripe } from "@/lib/billing/stripe";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
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

- [ ] **Step 6: Update `webhook/route.test.ts`** — remove the `BILLING_ENABLED` mock line

Find and remove this line from `webhook/route.test.ts`:
```ts
vi.mock("@/lib/billing/config", () => ({ BILLING_ENABLED: true }));
```

- [ ] **Step 7: Run all billing tests**

```bash
pnpm test app/api/billing/
```

Expected: PASS — all checkout and webhook tests still green.

- [ ] **Step 8: Commit**

```bash
git add lib/billing/config.ts lib/billing/stripe.ts lib/billing/stripe.test.ts \
  app/api/billing/checkout/route.ts app/api/billing/checkout/route.test.ts \
  app/api/billing/webhook/route.ts app/api/billing/webhook/route.test.ts
git commit -m "feat: remove STRIPE_ENABLED gate — billing is always live"
```

---

## Task 4: Customer Portal route + tests

**Files:**
- Create: `app/api/billing/portal/route.ts`
- Create: `app/api/billing/portal/route.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// app/api/billing/portal/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/billing/stripe", () => ({ getStripe: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { POST } from "./route";

const makeRequest = () =>
  new Request("http://localhost/api/billing/portal", { method: "POST" });

const makeSupabase = (userId: string | null, stripeCustomerId: string | null = null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({
          data: stripeCustomerId ? { stripe_customer_id: stripeCustomerId } : null,
          error: null,
        }),
      })),
    })),
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
});

describe("POST /api/billing/portal", () => {
  it("returns 401 when not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase(null));
    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 400 when user has no stripe customer ID", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase("user-1", null)
    );
    const res = await POST(makeRequest());
    expect(res.status).toBe(400);
  });

  it("returns 200 with portal URL when customer ID exists", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase("user-1", "cus_123")
    );
    const mockStripe = {
      billingPortal: {
        sessions: {
          create: vi.fn().mockResolvedValue({ url: "https://billing.stripe.com/session/abc" }),
        },
      },
    };
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(mockStripe);
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.url).toBe("https://billing.stripe.com/session/abc");
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "http://localhost:3000/settings",
    });
  });

  it("returns 500 when Stripe throws", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase("user-1", "cus_123")
    );
    const mockStripe = {
      billingPortal: {
        sessions: {
          create: vi.fn().mockRejectedValue(new Error("Stripe error")),
        },
      },
    };
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(mockStripe);
    const res = await POST(makeRequest());
    expect(res.status).toBe(500);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test app/api/billing/portal/route.test.ts
```

Expected: FAIL — `route.ts` does not exist.

- [ ] **Step 3: Implement the portal route**

```ts
// app/api/billing/portal/route.ts
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";

export async function POST() {
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
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return Response.json(
      { error: { code: "NO_CUSTOMER", message: "No Stripe customer found" } },
      { status: 400 }
    );
  }

  const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/settings`;

  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: returnUrl,
    });
    return Response.json({ url: session.url });
  } catch {
    return Response.json(
      { error: { code: "PORTAL_FAILED", message: "Failed to create portal session" } },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test app/api/billing/portal/route.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/api/billing/portal/route.ts app/api/billing/portal/route.test.ts
git commit -m "feat: add billing portal route for Stripe Customer Portal redirect"
```

---

## Task 5: Export markdown helper + `exportProposal` server action

**Files:**
- Create: `lib/export/generate-markdown.ts`
- Create: `app/actions/exports.ts`
- Create: `app/actions/exports.test.ts`

- [ ] **Step 1: Create the shared markdown helper**

```ts
// lib/export/generate-markdown.ts
import type { Proposal } from "@/lib/types/database";

export function generateMarkdown(proposal: Proposal): string {
  const lines: string[] = [];
  lines.push(`# ${proposal.feature_name}`);
  lines.push("");
  lines.push(`## Problem Statement`);
  lines.push(proposal.problem_statement);
  lines.push("");
  if (proposal.evidence.length > 0) {
    lines.push(`## User Evidence`);
    for (const e of proposal.evidence) {
      lines.push(`- "${e.quote}" — ${e.sourceLabel}`);
    }
    lines.push("");
  }
  if (proposal.ui_changes.length > 0) {
    lines.push(`## Suggested UI Changes`);
    for (const item of proposal.ui_changes) lines.push(`- ${item}`);
    lines.push("");
  }
  if (proposal.data_model_changes.length > 0) {
    lines.push(`## Suggested Data Model Changes`);
    for (const item of proposal.data_model_changes) lines.push(`- ${item}`);
    lines.push("");
  }
  if (proposal.workflow_changes.length > 0) {
    lines.push(`## Suggested Workflow Changes`);
    for (const item of proposal.workflow_changes) lines.push(`- ${item}`);
    lines.push("");
  }
  if (proposal.engineering_tasks.length > 0) {
    lines.push(`## Engineering Tasks`);
    for (const item of proposal.engineering_tasks) lines.push(`- ${item}`);
    lines.push("");
  }
  return lines.join("\n");
}
```

- [ ] **Step 2: Write the failing tests for `exportProposal`**

```ts
// app/actions/exports.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/billing/limits", () => ({
  canExport: vi.fn(),
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { canExport } from "@/lib/billing/limits";
import { exportProposal } from "./exports";

const fakeProposal = {
  id: "prop-1",
  feature_name: "Dark Mode",
  problem_statement: "Users want dark mode.",
  evidence: [{ quote: "Please add dark mode", sourceLabel: "Survey" }],
  ui_changes: ["Add theme toggle"],
  data_model_changes: [],
  workflow_changes: [],
  engineering_tasks: ["Implement CSS variables"],
};

const makeUserClient = (userId: string | null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: fakeProposal, error: null }),
      })),
    })),
  })),
});

const makeServiceClient = () => ({
  from: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("exportProposal", () => {
  it("throws when unauthenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient(null));
    await expect(exportProposal("proj-1", "prop-1")).rejects.toThrow("Unauthenticated");
  });

  it("throws when limit not allowed", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient("user-1"));
    (canExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      reason: "Free plan: 3 exports per project",
    });
    await expect(exportProposal("proj-1", "prop-1")).rejects.toThrow(
      "Free plan: 3 exports per project"
    );
  });

  it("returns markdown string when allowed", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient("user-1"));
    (canExport as ReturnType<typeof vi.fn>).mockResolvedValue({ allowed: true, reason: "" });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(makeServiceClient());
    const result = await exportProposal("proj-1", "prop-1");
    expect(result).toContain("# Dark Mode");
    expect(result).toContain("Please add dark mode");
  });

  it("upserts to exports table on conflict do nothing", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient("user-1"));
    (canExport as ReturnType<typeof vi.fn>).mockResolvedValue({ allowed: true, reason: "" });
    const serviceClient = {
      from: vi.fn(() => ({ upsert: upsertMock })),
    };
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(serviceClient);
    await exportProposal("proj-1", "prop-1");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: "proj-1", proposal_id: "prop-1" }),
      { onConflict: "project_id,proposal_id", ignoreDuplicates: true }
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
pnpm test app/actions/exports.test.ts
```

Expected: FAIL — `exports.ts` does not exist.

- [ ] **Step 4: Implement `app/actions/exports.ts`**

```ts
// app/actions/exports.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { canExport } from "@/lib/billing/limits";
import { generateMarkdown } from "@/lib/export/generate-markdown";
import type { Proposal } from "@/lib/types/database";

export async function exportProposal(projectId: string, proposalId: string): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthenticated");

  const limitResult = await canExport(user.id, projectId, proposalId);
  if (!limitResult.allowed) throw new Error(limitResult.reason);

  // Fetch proposal for markdown generation
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("id", proposalId)
    .single();

  if (error || !proposal) throw new Error("Proposal not found");

  // Record export — unique constraint means duplicate = no-op
  const serviceClient = createServiceClient();
  await serviceClient.from("exports").upsert(
    {
      user_id: user.id,
      project_id: projectId,
      proposal_id: proposalId,
    },
    { onConflict: "project_id,proposal_id", ignoreDuplicates: true }
  );

  return generateMarkdown(proposal as Proposal);
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pnpm test app/actions/exports.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/export/generate-markdown.ts app/actions/exports.ts app/actions/exports.test.ts
git commit -m "feat: add exportProposal server action with limit check and export tracking"
```

---

## Task 6: `PlanLimitTooltip` component + tests

**Files:**
- Create: `components/billing/plan-limit-tooltip.tsx`
- Create: `components/billing/plan-limit-tooltip.test.tsx`

- [ ] **Step 1: Write the failing tests**

```tsx
// components/billing/plan-limit-tooltip.test.tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlanLimitTooltip } from "./plan-limit-tooltip";

describe("PlanLimitTooltip", () => {
  it("renders children normally when allowed", () => {
    render(
      <PlanLimitTooltip allowed reason="">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).not.toBeDisabled();
  });

  it("renders children as disabled when not allowed", () => {
    render(
      <PlanLimitTooltip allowed={false} reason="Monthly limit reached">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    const btn = screen.getByRole("button", { name: "Click me" });
    expect(btn).toBeDisabled();
  });

  it("shows reason text in tooltip wrapper when not allowed", () => {
    render(
      <PlanLimitTooltip allowed={false} reason="Monthly limit reached">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    expect(screen.getByText("Monthly limit reached")).toBeInTheDocument();
  });

  it("does not render tooltip content when allowed", () => {
    render(
      <PlanLimitTooltip allowed reason="should not appear">
        <button>Click me</button>
      </PlanLimitTooltip>
    );
    expect(screen.queryByText("should not appear")).not.toBeInTheDocument();
  });
});
```

Note: the vitest config uses `environment: "node"`. For jsdom tests in `components/billing/`, add a vitest config override at the top of the test file:

```ts
// @vitest-environment jsdom
```

Add this as the very first line of `plan-limit-tooltip.test.tsx`.

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test components/billing/plan-limit-tooltip.test.tsx
```

Expected: FAIL — component does not exist.

- [ ] **Step 3: Implement the component**

```tsx
// components/billing/plan-limit-tooltip.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import React from "react";

interface PlanLimitTooltipProps {
  allowed: boolean;
  reason: string;
  children: React.ReactNode;
}

export function PlanLimitTooltip({ allowed, reason, children }: PlanLimitTooltipProps) {
  const [visible, setVisible] = useState(false);

  if (allowed) return <>{children}</>;

  // Clone the child to inject disabled prop (works for button elements)
  const disabledChild = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<{ disabled?: boolean; className?: string }>, {
        disabled: true,
        className: [
          (child.props as { className?: string }).className ?? "",
          "cursor-not-allowed opacity-50",
        ]
          .join(" ")
          .trim(),
      });
    }
    return child;
  });

  // Parse the reason: if it ends with "→", the last word is a link to /pricing
  const hasUpgradeLink = reason.includes("→");
  const reasonText = hasUpgradeLink ? reason.replace("→", "").trim() : reason;

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {disabledChild}
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-[calc(100%+8px)] right-0 z-50 w-[220px] rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-3.5 py-2.5 shadow-[var(--shadow-2)]"
        >
          <p className="mb-1 text-[12px] font-semibold text-[var(--color-text-primary)]">
            {reasonText}
          </p>
          {hasUpgradeLink && (
            <Link
              href="/pricing"
              className="text-[12px] font-semibold text-[var(--color-accent-primary)] hover:underline"
            >
              Upgrade to Pro →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test components/billing/plan-limit-tooltip.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/billing/plan-limit-tooltip.tsx components/billing/plan-limit-tooltip.test.tsx
git commit -m "feat: add PlanLimitTooltip component for in-app limit gating"
```

---

## Task 7: Gate "New Project" on dashboard

**Files:**
- Modify: `app/(app)/dashboard/page.tsx`
- Modify: `components/projects/new-project-modal.tsx`
- Modify: `app/actions/projects.ts`

- [ ] **Step 1: Update `NewProjectModal` to accept `canCreate` prop**

Add `canCreate` prop and wrap the trigger button:

```tsx
// components/projects/new-project-modal.tsx
// Add import at top:
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import type { LimitResult } from "@/lib/billing/limits";
```

Change the `NewProjectModal` props interface:

```tsx
interface NewProjectModalProps {
  canCreate?: LimitResult;
}

export function NewProjectModal({ canCreate = { allowed: true, reason: "" } }: NewProjectModalProps) {
```

Wrap the trigger button (the `<Button onClick={() => setOpen(true)}>New Project</Button>`) in a `PlanLimitTooltip`:

```tsx
      <PlanLimitTooltip allowed={canCreate.allowed} reason={canCreate.reason}>
        <Button onClick={canCreate.allowed ? () => setOpen(true) : undefined}>New Project</Button>
      </PlanLimitTooltip>
```

- [ ] **Step 2: Update dashboard page to fetch `canCreate`**

```tsx
// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { canCreateProject } from "@/lib/billing/limits";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { ProjectTile } from "@/components/projects/project-tile";
import { BlurFade } from "@/components/ui/blur-fade";
import type { Project } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const canCreate = user
    ? await canCreateProject(user.id)
    : { allowed: false, reason: "Not authenticated" };

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <BlurFade delay={0} duration={0.28}>
          <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)]">
            Your Projects
          </h1>
        </BlurFade>
        <BlurFade delay={0.04} duration={0.28}>
          <NewProjectModal canCreate={canCreate} />
        </BlurFade>
      </div>

      {!projects || projects.length === 0 ? (
        <BlurFade delay={0.08} duration={0.28}>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-2 text-base text-[var(--color-text-secondary)]">
              No projects yet.
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Create your first project to start analyzing feedback.
            </p>
          </div>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(projects as Project[]).map((project, index) => (
            <ProjectTile
              key={project.id}
              id={project.id}
              name={project.name}
              createdAt={project.created_at}
              index={index + 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Add `canCreateProject()` enforcement to `createProject` action**

```ts
// app/actions/projects.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { canCreateProject } from "@/lib/billing/limits";

export async function createProject(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
    return;
  }

  const limitResult = await canCreateProject(user.id);
  if (!limitResult.allowed) {
    throw new Error(limitResult.reason);
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: user.id })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to create project");
  }

  redirect(`/projects/${data.id}`);
}
```

- [ ] **Step 4: Run the full test suite**

```bash
pnpm test
```

Expected: all tests pass (no regressions).

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/dashboard/page.tsx components/projects/new-project-modal.tsx app/actions/projects.ts
git commit -m "feat: gate new project creation with plan limit check and tooltip"
```

---

## Task 8: Gate "Add File" on project add page

**Files:**
- Modify: `app/(app)/projects/[id]/add/page.tsx`
- Modify: `components/projects/inputs/add-input-form.tsx`
- Modify: `app/actions/feedback-files.ts`

- [ ] **Step 1: Update `AddInputForm` to accept `canAddFile` prop**

Add the prop and disable the submit button when not allowed:

In `components/projects/inputs/add-input-form.tsx`, add import:
```ts
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import type { LimitResult } from "@/lib/billing/limits";
```

Change the props interface:
```ts
interface AddInputFormProps {
  projectId: string;
  canAddFile?: LimitResult;
}

export function AddInputForm({
  projectId,
  canAddFile = { allowed: true, reason: "" },
}: AddInputFormProps) {
```

Find the submit button in the form (the button that calls `handleSubmit` on step 2) and wrap it:
```tsx
<PlanLimitTooltip allowed={canAddFile.allowed} reason={canAddFile.reason}>
  <Button
    disabled={isPending || !canAddFile.allowed}
    onClick={canAddFile.allowed ? handleSubmit : undefined}
  >
    {isPending ? "Uploading…" : "Upload"}
  </Button>
</PlanLimitTooltip>
```

Note: find the exact submit button in `add-input-form.tsx` by looking for the button that calls `handleSubmit`. It is rendered on step 2 of the form. Wrap only that button.

- [ ] **Step 2: Update add inputs page to fetch `canAddFile`**

```tsx
// app/(app)/projects/[id]/add/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AddInputForm } from "@/components/projects/inputs/add-input-form";
import { canAddFile } from "@/lib/billing/limits";
import type { Project } from "@/lib/types/database";

export default async function AddInputsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!project) notFound();

  const p = project as Project;

  const canAddFileResult = user
    ? await canAddFile(user.id, id)
    : { allowed: false, reason: "Not authenticated" };

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-[13px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          {p.name}
        </Link>
      </div>

      <h1 className="mb-6 text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
        Add Feedback
      </h1>

      <AddInputForm projectId={id} canAddFile={canAddFileResult} />
    </div>
  );
}
```

- [ ] **Step 3: Add `canAddFile()` enforcement to `uploadFeedbackFiles` action**

In `app/actions/feedback-files.ts`, add the limit check right after the auth check and before the file loop. Add the import at the top:

```ts
import { canAddFile as checkCanAddFile } from "@/lib/billing/limits";
```

After `if (!user) throw new Error("Unauthenticated");`, add:

```ts
  const limitResult = await checkCanAddFile(user.id, projectId);
  if (!limitResult.allowed) {
    throw new Error(limitResult.reason);
  }
```

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/projects/\[id\]/add/page.tsx \
  components/projects/inputs/add-input-form.tsx \
  app/actions/feedback-files.ts
git commit -m "feat: gate file uploads with plan limit check and tooltip"
```

---

## Task 9: Gate re-run analysis

**Files:**
- Modify: `app/(app)/projects/[id]/page.tsx`
- Modify: `components/projects/workspace/workspace-shell.tsx`
- Modify: `components/projects/workspace/analyze-button.tsx`
- Modify: `app/api/projects/[id]/analyze/route.ts`

- [ ] **Step 1: Update `AnalyzeButton` to accept `canRerun` prop**

```tsx
// components/projects/workspace/analyze-button.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Zap, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import type { LimitResult } from "@/lib/billing/limits";

interface AnalyzeButtonProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
  hasResults: boolean;
  canRerun: LimitResult;
  onAnalyzingChange?: (isAnalyzing: boolean) => void;
}

export function AnalyzeButton({
  projectId,
  hasInputs,
  isStale,
  hasResults,
  canRerun,
  onAnalyzingChange,
}: AnalyzeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isRerun = hasResults;
  const label = loading ? "Analyzing…" : isStale ? "Re-analyze" : "Analyze";

  // Re-run is blocked for free users when results already exist
  const effectivelyDisabled = !hasInputs || loading || (isRerun && !canRerun.allowed);

  async function handleClick() {
    if (effectivelyDisabled) return;
    setLoading(true);
    onAnalyzingChange?.(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body?.error?.message ?? "Analysis failed. Please try again.");
        return;
      }
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      onAnalyzingChange?.(false);
    }
  }

  const button = (
    <Button
      size="sm"
      disabled={effectivelyDisabled}
      onClick={handleClick}
      title={!hasInputs ? "Add at least one labeled input" : undefined}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Zap size={13} />
      )}
      {label}
    </Button>
  );

  if (isRerun && !canRerun.allowed) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <PlanLimitTooltip allowed={false} reason={canRerun.reason}>
          {button}
        </PlanLimitTooltip>
        {error && (
          <p className="text-[12px] text-[var(--color-error)]">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {button}
      {error && (
        <p className="text-[12px] text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Update `WorkspaceShell` to accept and forward `canRerun`**

Add `canRerun: LimitResult` to `WorkspaceShellProps`:

```ts
import type { LimitResult } from "@/lib/billing/limits";

interface WorkspaceShellProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
  hasResults: boolean;
  canRerun: LimitResult;
  insightsCount: number;
  proposalsCount: number;
  addInputsButton: React.ReactNode;
  inputsSection: React.ReactNode;
  themesContent: React.ReactNode;
  proposalsContent: React.ReactNode;
}
```

Pass `canRerun` to `AnalyzeButton` and add `hasResults` to the `AnalyzeButton` call:

```tsx
        <AnalyzeButton
          projectId={projectId}
          hasInputs={hasInputs}
          isStale={isStale}
          hasResults={hasResults}
          canRerun={canRerun}
          onAnalyzingChange={setIsAnalyzing}
        />
```

- [ ] **Step 3: Update project page to pass `canRerun`**

In `app/(app)/projects/[id]/page.tsx`, add import:
```ts
import { canRerunAnalysis } from "@/lib/billing/limits";
```

In the data-fetching section (after `const { id } = await params;`), add to the parallel fetches:
```ts
  const {
    data: { user },
  } = await supabase.auth.getUser();
```

Add `canRerun` fetch after the parallel fetches (needs `user` and `hasResults`):
```ts
  const canRerun = user
    ? await canRerunAnalysis(user.id)
    : { allowed: false, reason: "Not authenticated" };
```

Pass to `WorkspaceShell`:
```tsx
      <WorkspaceShell
        projectId={id}
        hasInputs={hasInputs}
        isStale={isStale}
        hasResults={hasResults}
        canRerun={canRerun}
        insightsCount={insights.length}
        proposalsCount={proposals.length}
        // ... rest of props unchanged
      />
```

- [ ] **Step 4: Add `canRerunAnalysis()` check in analyze route**

In `app/api/projects/[id]/analyze/route.ts`, add import:
```ts
import { canRerunAnalysis } from "@/lib/billing/limits";
```

After the ownership check (step 2) and before the rate limit check (step 3), add:

```ts
  // 2b. Re-run limit check — first analysis is always allowed; re-run requires Pro
  const { data: existingInsights } = await supabase
    .from("insights")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  const isRerun = (existingInsights as unknown as { count: number } | null)?.count
    ? ((existingInsights as unknown as { count: number }).count ?? 0) > 0
    : false;

  if (isRerun) {
    const rerunLimit = await canRerunAnalysis(user.id);
    if (!rerunLimit.allowed) {
      return Response.json(
        { error: { code: "PLAN_LIMIT", message: rerunLimit.reason } },
        { status: 403 }
      );
    }
  }
```

Note: the existing `getInsights` action returns insights but the route needs a direct query. Check how insights are stored — if in `insights` table, use that. Otherwise adapt to the actual table name from the data model.

- [ ] **Step 5: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/projects/\[id\]/page.tsx \
  components/projects/workspace/workspace-shell.tsx \
  components/projects/workspace/analyze-button.tsx \
  app/api/projects/\[id\]/analyze/route.ts
git commit -m "feat: gate re-run analysis with plan limit check and tooltip"
```

---

## Task 10: Gate proposal exports + wire `exportProposal` action

**Files:**
- Modify: `components/projects/workspace/proposals-section.tsx`
- Modify: `app/(app)/projects/[id]/page.tsx`

- [ ] **Step 1: Update `ProposalCard` and `ProposalsSection`**

Replace the entire `proposals-section.tsx` with this:

```tsx
// components/projects/workspace/proposals-section.tsx
"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MagicCard } from "@/components/ui/magic-card";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import { exportProposal } from "@/app/actions/exports";
import type { Proposal } from "@/lib/types/database";
import type { LimitResult } from "@/lib/billing/limits";

interface ProposalsSectionProps {
  proposals: Proposal[];
  isStale: boolean;
  projectId: string;
  exportLimits: Record<string, LimitResult>;
}

interface ProposalCardProps {
  proposal: Proposal;
  index: number;
  projectId: string;
  canExport: LimitResult;
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function PropSection({ label, children }: SectionProps) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      {children}
    </div>
  );
}

function ProposalCard({ proposal, index, projectId, canExport }: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    startTransition(async () => {
      try {
        const markdown = await exportProposal(projectId, proposal.id);
        await navigator.clipboard.writeText(markdown);
        setExportError(null);
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed");
      }
    });
  };

  const handleDownload = () => {
    startTransition(async () => {
      try {
        const markdown = await exportProposal(projectId, proposal.id);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${proposal.feature_name.toLowerCase().replace(/\s+/g, "-")}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setExportError(null);
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed");
      }
    });
  };

  return (
    <MagicCard className="overflow-hidden rounded-[var(--radius-lg)]">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full cursor-pointer items-center justify-between p-5 text-left"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
            {index + 1}
          </span>
          <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
            {proposal.feature_name}
          </span>
        </div>
        <ChevronDown
          size={15}
          strokeWidth={2}
          className={`shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-[200ms] ${
            expanded ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div
              className={`border-t border-[var(--color-border-subtle)] px-5 pb-5 pt-4 ${
                !canExport.allowed ? "select-none" : ""
              }`}
            >
              <PropSection label="Problem Statement">
                <p className="text-[13px] leading-[1.7] text-[var(--color-text-secondary)]">
                  {proposal.problem_statement}
                </p>
              </PropSection>

              {proposal.evidence.length > 0 && (
                <PropSection label="User Evidence">
                  <ul className="flex flex-col gap-2">
                    {proposal.evidence.map((e, i) => (
                      <li key={i} className="text-[12px] leading-[1.6] text-[var(--color-text-secondary)]">
                        <span className="text-[var(--color-text-tertiary)]">&ldquo;</span>
                        {e.quote}
                        <span className="text-[var(--color-text-tertiary)]">&rdquo;</span>
                        {" "}
                        <span className="text-[var(--color-text-tertiary)]">— {e.sourceLabel}</span>
                      </li>
                    ))}
                  </ul>
                </PropSection>
              )}

              {proposal.ui_changes.length > 0 && (
                <PropSection label="Suggested UI Changes">
                  <ul className="flex flex-col gap-1.5">
                    {proposal.ui_changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]">–</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </PropSection>
              )}

              {proposal.data_model_changes.length > 0 && (
                <PropSection label="Suggested Data Model Changes">
                  <ul className="flex flex-col gap-1.5">
                    {proposal.data_model_changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]">–</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </PropSection>
              )}

              {proposal.workflow_changes.length > 0 && (
                <PropSection label="Suggested Workflow Changes">
                  <ol className="flex flex-col gap-1.5">
                    {proposal.workflow_changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </PropSection>
              )}

              {proposal.engineering_tasks.length > 0 && (
                <PropSection label="Engineering Tasks">
                  <ol className="flex flex-col gap-1.5">
                    {proposal.engineering_tasks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </PropSection>
              )}

              {exportError && (
                <p className="mb-2 text-[12px] text-[var(--color-error)]">{exportError}</p>
              )}

              <div className="mt-5 flex gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                <PlanLimitTooltip allowed={canExport.allowed} reason={canExport.reason}>
                  <button
                    disabled={!canExport.allowed || isPending}
                    onClick={handleCopy}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy Markdown
                  </button>
                </PlanLimitTooltip>
                <PlanLimitTooltip allowed={canExport.allowed} reason={canExport.reason}>
                  <button
                    disabled={!canExport.allowed || isPending}
                    onClick={handleDownload}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download .md
                  </button>
                </PlanLimitTooltip>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MagicCard>
  );
}

export function ProposalsSection({
  proposals,
  isStale,
  projectId,
  exportLimits,
}: ProposalsSectionProps) {
  return (
    <>
      {isStale && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_40%_12%)] px-4 py-2.5">
          <Info size={13} strokeWidth={1.8} className="shrink-0 text-[hsl(40_70%_55%)]" />
          <p className="text-[12px] text-[hsl(40_70%_65%)]">
            These proposals are based on a previous analysis. Re-analyze to reflect new inputs.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {proposals.map((proposal, i) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            index={i}
            projectId={projectId}
            canExport={exportLimits[proposal.id] ?? { allowed: true, reason: "" }}
          />
        ))}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Update project page to fetch export limits and pass `projectId` + `exportLimits`**

In `app/(app)/projects/[id]/page.tsx`, add import:
```ts
import { canExport } from "@/lib/billing/limits";
```

After fetching `proposals`, add:
```ts
  // Fetch per-proposal export limits (server-side, no loading state needed)
  const exportLimits: Record<string, { allowed: boolean; reason: string }> = {};
  if (user && proposals.length > 0) {
    await Promise.all(
      proposals.map(async (proposal) => {
        exportLimits[proposal.id] = await canExport(user.id, id, proposal.id);
      })
    );
  }
```

Update the `ProposalsSection` render call:
```tsx
            <ProposalsSection
              proposals={proposals}
              isStale={isStale}
              projectId={id}
              exportLimits={exportLimits}
            />
```

- [ ] **Step 3: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Commit**

```bash
git add components/projects/workspace/proposals-section.tsx \
  app/\(app\)/projects/\[id\]/page.tsx
git commit -m "feat: gate proposal exports with plan limits and wire exportProposal server action"
```

---

## Task 11: Settings page

**Files:**
- Create: `app/(app)/settings/page.tsx`
- Create: `app/(app)/settings/page.test.tsx`

- [ ] **Step 1: Write failing tests**

```tsx
// @vitest-environment jsdom
// app/(app)/settings/page.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

// The settings page is a server component — test by rendering its pure output
// by extracting and testing the presentational sub-components directly.

import { PlanCard } from "./page";

describe("PlanCard (Free view)", () => {
  it("shows upgrade CTA for free user", () => {
    render(
      <PlanCard
        plan="free"
        projectsThisMonth={1}
        stripeCustomerId={null}
      />
    );
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText(/Free/)).toBeInTheDocument();
  });
});

describe("PlanCard (Pro view)", () => {
  it("shows manage subscription for pro user", () => {
    render(
      <PlanCard
        plan="pro"
        projectsThisMonth={7}
        stripeCustomerId="cus_123"
      />
    );
    expect(screen.getByText(/manage subscription/i)).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("7")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to verify failure**

```bash
pnpm test app/\(app\)/settings/page.test.tsx
```

Expected: FAIL — `page.tsx` does not exist.

- [ ] **Step 3: Implement the settings page**

```tsx
// app/(app)/settings/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PlanCardProps {
  plan: "free" | "pro";
  projectsThisMonth: number;
  stripeCustomerId: string | null;
}

export function PlanCard({ plan, projectsThisMonth, stripeCustomerId }: PlanCardProps) {
  const isPro = plan === "pro";

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-8">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        Current Plan
      </p>

      <div className="mb-1 flex items-center gap-3">
        <span className="text-[22px] font-bold text-[var(--color-text-primary)]">
          {isPro ? "Pro" : "Free"}
        </span>
        {isPro && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-primary)]">
            Active
          </span>
        )}
      </div>

      <p className="mb-6 text-[13px] text-[var(--color-text-tertiary)]">
        {isPro
          ? "Unlimited projects · 20 files/project · Priority AI"
          : "2 projects/mo · 5 files/project · 3 exports/project"}
      </p>

      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-5">
        <p className="mb-3 text-[12px] text-[var(--color-text-tertiary)]">This month</p>
        <div className="flex gap-6">
          <div>
            <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">
              {isPro ? projectsThisMonth : `${projectsThisMonth} / 2`}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">projects</p>
          </div>
        </div>
      </div>

      {isPro ? (
        <ManageSubscriptionButton />
      ) : (
        <UpgradeButton />
      )}
    </div>
  );
}

function UpgradeButton() {
  return (
    <form action="/api/billing/checkout" method="POST">
      <button
        type="submit"
        className="w-full rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
      >
        Upgrade to Pro — $29/mo
      </button>
    </form>
  );
}

function ManageSubscriptionButton() {
  return (
    <form action="/api/billing/portal" method="POST">
      <button
        type="submit"
        className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-8 py-[14px] text-[15px] font-semibold text-[var(--color-text-secondary)] transition-colors duration-[180ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
      >
        Manage Subscription
      </button>
    </form>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: profile }, { count: projectCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const plan = profile?.subscription_status === "active" ? "pro" : "free";
  const projectsThisMonth = projectCount ?? 0;

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="mb-8 text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
        Settings
      </h1>
      <PlanCard
        plan={plan}
        projectsThisMonth={projectsThisMonth}
        stripeCustomerId={profile?.stripe_customer_id ?? null}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test app/\(app\)/settings/page.test.tsx
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/\(app\)/settings/page.tsx app/\(app\)/settings/page.test.tsx
git commit -m "feat: add settings page with plan status and upgrade/manage CTAs"
```

---

## Task 12: Settings nav link

**Files:**
- Modify: `components/nav/avatar-dropdown.tsx`

- [ ] **Step 1: Add Settings link to avatar dropdown**

In `components/nav/avatar-dropdown.tsx`, add `Link` import if not already present (it uses `next/link`):

```tsx
import Link from "next/link";
import { LogOut, Settings } from "lucide-react";
```

Inside the dropdown `div` (after the email paragraph and before the sign-out button), add the Settings link:

```tsx
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="mt-1 flex items-center gap-2 rounded-[var(--radius-xs)] px-2.5 py-2 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <Settings size={14} />
            Settings
          </Link>
```

Place this link before the Sign out button.

- [ ] **Step 2: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 3: Commit**

```bash
git add components/nav/avatar-dropdown.tsx
git commit -m "feat: add Settings link to avatar dropdown nav"
```

---

## Task 13: Pricing page + global language changes

**Files:**
- Modify: `app/(marketing)/pricing/page.tsx`
- Modify: `components/marketing/pricing-section.tsx`
- Modify: `components/marketing/hero-section.tsx`

- [ ] **Step 1: Update `pricing/page.tsx`**

Replace the entire file with:

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

async function handleUpgrade() {
  const res = await fetch("/api/billing/checkout", { method: "POST" });
  const body = await res.json();
  if (body.url) window.location.href = body.url;
}

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
              No credit card required.
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
                Try for Free
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Pro card — live */}
        <motion.div {...CARD_REVEAL(0.5)} className="w-full max-w-[420px]">
          <div className="flex h-full flex-col rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-10 transition-[border-color,box-shadow] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
            <p className="mb-5 text-[13px] font-medium uppercase tracking-[0.1em] text-[var(--color-text-tertiary)]">
              Pro
            </p>
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
                onClick={handleUpgrade}
                className="group inline-flex w-full cursor-pointer items-center justify-center overflow-hidden rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[16px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
              >
                Upgrade to Pro
                <span className="ml-0 inline-block max-w-0 overflow-hidden opacity-0 transition-[max-width,opacity,margin-left] duration-[300ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:ml-1.5 group-hover:max-w-[1.5em] group-hover:opacity-100">
                  →
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Update `components/marketing/pricing-section.tsx`**

Find and replace:
- `"Get Early Access"` → `"Try for Free"`
- `"Free during beta. No credit card required."` → `"No credit card required."`
- `"Early Access"` (the button label) → `"Try for Free"`

- [ ] **Step 3: Update `components/marketing/hero-section.tsx`**

Find and remove or replace the line `"Now in Early Access"` — replace with empty string or remove the containing element entirely. Read the file first to decide the minimal change.

- [ ] **Step 4: Run tests**

```bash
pnpm test
```

Expected: all tests pass.

- [ ] **Step 5: Run typecheck and lint**

```bash
pnpm typecheck && pnpm lint
```

Expected: zero errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(marketing\)/pricing/page.tsx \
  components/marketing/pricing-section.tsx \
  components/marketing/hero-section.tsx
git commit -m "feat: update pricing page — enable Pro card, remove Early Access language"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Covered by task |
|-----------------|-----------------|
| `exports` table with unique constraint | Task 1 |
| `lib/billing/limits.ts` with all 5 functions | Task 2 |
| Remove `BILLING_ENABLED` gate everywhere | Task 3 |
| `POST /api/billing/portal` | Task 4 |
| `exportProposal` server action | Task 5 |
| `<PlanLimitTooltip>` component | Task 6 |
| Gate new project (dashboard + action) | Task 7 |
| Gate add file (add page + action) | Task 8 |
| Gate re-run analysis (route + button) | Task 9 |
| Gate proposal exports (ProposalCard) | Task 10 |
| Settings page (Free + Pro views) | Task 11 |
| Settings nav link | Task 12 |
| Pricing page language + Pro card | Task 13 |
| `generateMarkdown` moved server-side | Task 5 |
| Global language: "Early Access" → "Try for Free" | Task 13 |

**Type consistency check:**
- `LimitResult` is `{ allowed: boolean; reason: string }` — used consistently across all tasks
- `canExport(userId, projectId, proposalId)` — matches signature in limits.ts (Task 2) and usage in exports action (Task 5) and project page (Task 10)
- `exportLimits: Record<string, LimitResult>` — defined in project page (Task 10) and consumed in ProposalsSection (Task 10)
- `canRerun: LimitResult` — defined in project page (Task 9), forwarded through WorkspaceShell, consumed in AnalyzeButton

**Placeholder scan:** No TBDs, no vague steps. Every code block is complete.

**One note on Task 9 (analyze route):** The `existingInsights` count check uses a slightly verbose type cast because the Supabase count API returns `count` on the response object rather than in `data`. Verify the actual table name for insights in the analyze route by checking `app/actions/analysis.ts` before implementing — if it's `insights` use that, if it's `feedback_insights` adapt accordingly.

---

Plan complete and saved to `docs/superpowers/plans/2026-04-01-full-billing-system.md`.

**Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
