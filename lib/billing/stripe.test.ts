import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("getStripe", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when STRIPE_ENABLED is not true", async () => {
    vi.stubEnv("STRIPE_ENABLED", "false");
    const { getStripe } = await import("./stripe");
    expect(() => getStripe()).toThrow("Billing is not enabled");
  });

  it("returns a Stripe instance when STRIPE_ENABLED is true", async () => {
    vi.stubEnv("STRIPE_ENABLED", "true");
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_fake");
    const { getStripe } = await import("./stripe");
    const stripe = getStripe();
    expect(stripe).toBeDefined();
    expect(typeof stripe.checkout.sessions.create).toBe("function");
  });
});
