import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("./stripe", () => ({
  getStripe: vi.fn(),
}));

vi.mock("./config", () => ({
  BILLING_ENABLED: true,
  PLANS: {
    free: { name: "Free", priceUsd: 0 },
    pro: { name: "Pro", priceUsd: 9, stripePriceId: "price_test_pro" },
    max: { name: "Max", priceUsd: 19, stripePriceId: "price_test_max" },
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

  it("uses max price ID when plan is max", async () => {
    const mockCreate = vi
      .fn()
      .mockResolvedValue({ url: "https://checkout.stripe.com/pay/cs_test_max" });
    (getStripe as ReturnType<typeof vi.fn>).mockReturnValue({
      checkout: { sessions: { create: mockCreate } },
    });
    await createCheckoutSession({
      userId: "user-1",
      userEmail: "user@example.com",
      stripeCustomerId: null,
      returnUrl: "https://app.example.com",
      plan: "max",
    });
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: [{ price: "price_test_max", quantity: 1 }],
        metadata: expect.objectContaining({ plan: "max" }),
      })
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
