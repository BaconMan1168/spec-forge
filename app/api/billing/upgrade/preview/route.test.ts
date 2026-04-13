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
