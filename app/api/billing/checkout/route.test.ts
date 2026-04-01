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
