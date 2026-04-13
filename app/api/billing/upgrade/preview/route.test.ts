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

const makeStripe = (previewInvoice: Record<string, unknown>) => ({
  subscriptions: {
    retrieve: vi.fn().mockResolvedValue({
      items: { data: [{ id: "si_abc" }] },
    }),
  },
  invoices: {
    createPreview: vi.fn().mockResolvedValue(previewInvoice),
  },
});

// Helper to build a realistic invoice preview with proration and next-period lines.
// amount_due = proration_net + next_full_period — the route must return only proration_net.
// In Stripe v20 the proration flag moved to line.parent.subscription_item_details.proration
const makeProratedInvoice = (proratedNet: number, currency = "usd") => ({
  amount_due: proratedNet + 1900, // includes next full billing period ($19)
  currency,
  lines: {
    data: [
      // charge for Max (remaining period) — proration
      { amount: 1900, parent: { subscription_item_details: { proration: true }, invoice_item_details: null } },
      // credit for Pro (remaining period) — proration
      { amount: proratedNet - 1900, parent: { subscription_item_details: { proration: true }, invoice_item_details: null } },
      // next full billing period for Max — NOT a proration, must be excluded
      { amount: 1900, parent: { subscription_item_details: { proration: false }, invoice_item_details: null } },
    ],
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

  it("returns only the prorated net amount (excludes next billing period charge)", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    // Proration net = 830 cents ($8.30): Max charge $15.83 + Pro credit -$7.33 (≈25 days remaining)
    // But amount_due = 830 + 1900 = 2730 cents ($27.30) — old buggy behaviour
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue(
      makeStripe(makeProratedInvoice(830))
    );
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ amountDue: 830, currency: "usd" });
  });

  it("returns 500 when Stripe throws", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeSupabase({ id: "user-1" }, { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1", subscription_plan: "pro" })
    );
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      subscriptions: { retrieve: vi.fn().mockRejectedValue(new Error("Stripe error")) },
      invoices: { createPreview: vi.fn().mockResolvedValue({}) },
    });
    const res = await GET();
    expect(res.status).toBe(500);
  });
});
