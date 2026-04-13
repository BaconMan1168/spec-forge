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
