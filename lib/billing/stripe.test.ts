import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns a Stripe instance when STRIPE_SECRET_KEY is set", async () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
    const { getStripe } = await import("./stripe");
    const stripe = getStripe();
    expect(stripe).toBeDefined();
    expect(typeof stripe.checkout.sessions.create).toBe("function");
  });
});
