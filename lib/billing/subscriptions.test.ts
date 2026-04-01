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
