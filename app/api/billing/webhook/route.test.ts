import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/billing/stripe", () => ({ getStripe: vi.fn() }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));
vi.mock("@/lib/billing/config", () => ({
  PLANS: {
    pro: { stripePriceId: "price_pro_test" },
    max: { stripePriceId: "price_max_test" },
  },
}));

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

const makeServiceClient = () => ({
  from: vi.fn(() => ({
    upsert: makeUpsert,
    update: makeUpdate,
  })),
});

// Minimal subscription object with all fields our handler reads
const makeSubscription = (overrides: Record<string, unknown> = {}) => ({
  id: "sub_456",
  status: "active",
  metadata: { userId: "user-1" },
  items: {
    data: [
      {
        price: { id: "price_pro_test" },
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        ...(overrides.item as Record<string, unknown> ?? {}),
      },
    ],
  },
  cancel_at_period_end: false,
  cancel_at: null,
  ...overrides,
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
              metadata: { userId: "user-1", plan: "pro" },
              customer: "cus_123",
              subscription: "sub_456",
            },
          },
        }),
      },
      subscriptions: {
        retrieve: vi.fn().mockResolvedValue(makeSubscription()),
      },
    });
    const res = await POST(makeRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    expect(mockClient.from).toHaveBeenCalledWith("profiles");
    expect(makeUpsert).toHaveBeenCalled();
  });

  it("updates profile on customer.subscription.updated", async () => {
    const mockClient = makeServiceClient();
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "customer.subscription.updated",
          data: { object: makeSubscription() },
        }),
      },
    });
    const res = await POST(makeRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    expect(makeUpdate).toHaveBeenCalled();
  });

  it("sets subscription_cancel_at when cancel_at_period_end is true", async () => {
    const mockClient = makeServiceClient();
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      webhooks: {
        constructEvent: vi.fn().mockReturnValue({
          type: "customer.subscription.updated",
          data: {
            object: makeSubscription({
              cancel_at_period_end: true,
            }),
          },
        }),
      },
    });
    const res = await POST(makeRequest("{}", "valid-sig"));
    expect(res.status).toBe(200);
    const updateCall = makeUpdate.mock.calls[0]?.[0];
    expect(updateCall?.subscription_cancel_at).toBeTruthy();
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
