import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/billing/stripe", () => ({ getStripe: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/billing/stripe";
import { POST } from "./route";

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
    const res = await POST();
    expect(res.status).toBe(401);
  });

  it("returns 400 when user has no stripe customer ID", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase("user-1", null)
    );
    const res = await POST();
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
    const res = await POST();
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
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
