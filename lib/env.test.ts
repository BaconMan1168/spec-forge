import { describe, it, expect, vi, beforeEach } from "vitest";

describe("env validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("exports valid env when all required vars are set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");
    vi.stubEnv("AI_MODEL", "claude-sonnet-4-5");

    const { env } = await import("./env");
    expect(env.NEXT_PUBLIC_SUPABASE_URL).toBe("https://test.supabase.co");
    expect(env.AI_MODEL).toBe("claude-sonnet-4-5");
  });

  it("uses claude-sonnet-4-5 as default AI_MODEL when not set", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "test-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "service-key");
    vi.stubEnv("ANTHROPIC_API_KEY", "anthropic-key");
    // Do NOT stub AI_MODEL — leave undefined so .default() fires

    const { env } = await import("./env");
    expect(env.AI_MODEL).toBe("claude-sonnet-4-5");
  });

  it("throws when a required env var is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.stubEnv("ANTHROPIC_API_KEY", "");

    await expect(import("./env")).rejects.toThrow();
  });
});
