import { describe, it, expect, vi, beforeEach } from "vitest";

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
