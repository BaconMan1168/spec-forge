import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import {
  getUserPlan,
  canCreateProject,
  canAddFile,
  canExport,
  canRerunAnalysis,
} from "./limits";

beforeEach(() => {
  vi.clearAllMocks();
});

// ── getUserPlan ──────────────────────────────────────────────────────────────

describe("getUserPlan", () => {
  it("returns 'pro' when subscription_status is active", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active" },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    expect(await getUserPlan("user-1")).toBe("pro");
  });

  it("returns 'free' when subscription_status is null", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: null },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    expect(await getUserPlan("user-1")).toBe("free");
  });
});

// ── canCreateProject ─────────────────────────────────────────────────────────

describe("canCreateProject", () => {
  it("allows pro user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 1 project this month", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn().mockResolvedValue({ count: 1, error: null }),
            })),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user with 2 projects this month", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn().mockResolvedValue({ count: 2, error: null }),
            })),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/monthly limit/i);
  });
});

// ── canAddFile ───────────────────────────────────────────────────────────────

describe("canAddFile", () => {
  it("allows pro user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 4 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 4, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user with 5 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/5 files/i);
  });
});

// ── canExport ────────────────────────────────────────────────────────────────

describe("canExport", () => {
  it("allows pro user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return { select: vi.fn() };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user to re-export an already-exported proposal", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        // exports table — proposal already in exports
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("proposal_id") && !cols.includes("count")) {
              // already-exported check returns a row
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue({
                    data: [{ proposal_id: "prop-1" }],
                    error: null,
                  }),
                })),
              };
            }
            return { eq: vi.fn() };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-1");
    expect(result.allowed).toBe(true);
  });

  it("allows free user with 2 distinct exports in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("proposal_id") && !cols.includes("count")) {
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              };
            }
            return {
              eq: vi.fn().mockResolvedValue({ count: 2, error: null }),
            };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-new");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user at 3 distinct exports in project (new proposal)", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn((cols: string) => {
            if (cols.includes("proposal_id") && !cols.includes("count")) {
              return {
                eq: vi.fn(() => ({
                  eq: vi.fn().mockResolvedValue({ data: [], error: null }),
                })),
              };
            }
            return {
              eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
            };
          }),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canExport("user-1", "proj-1", "prop-new");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/3 exports/i);
  });
});

// ── canRerunAnalysis ─────────────────────────────────────────────────────────

describe("canRerunAnalysis", () => {
  it("allows pro user", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active" },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canRerunAnalysis("user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user from re-running analysis", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: null },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canRerunAnalysis("user-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/pro feature/i);
  });
});
