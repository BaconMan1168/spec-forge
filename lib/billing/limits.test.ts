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
  it("returns 'pro' when subscription_status is active and plan is pro", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active", subscription_plan: "pro" },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    expect(await getUserPlan("user-1")).toBe("pro");
  });

  it("returns 'max' when subscription_status is active and plan is max", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active", subscription_plan: "max" },
              error: null,
            }),
          })),
        })),
      })),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    expect(await getUserPlan("user-1")).toBe("max");
  });

  it("returns 'free' when subscription_status is null", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: null, subscription_plan: null },
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
  it("allows max user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "max" },
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

  it("allows pro user with 19 analyzed projects this month", async () => {
    // 19 distinct analyzed project IDs, 0 live unanalyzed → total 19 < 20
    const analyzedIds = Array.from({ length: 19 }, (_, i) => ({ project_id: `p${i}` }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "pro", subscription_period_start: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === "analysis_runs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn().mockResolvedValue({ data: analyzedIds, error: null }),
              })),
            })),
          };
        }
        // projects table: all 19 are analyzed, so unanalyzed live = 0
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({
              data: analyzedIds.map((r) => ({ id: r.project_id })),
              error: null,
            }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks pro user at 20 analyzed projects this month", async () => {
    // 20 distinct analyzed project IDs → at limit, block creation
    const analyzedIds = Array.from({ length: 20 }, (_, i) => ({ project_id: `p${i}` }));
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "pro", subscription_period_start: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === "analysis_runs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn().mockResolvedValue({ data: analyzedIds, error: null }),
              })),
            })),
          };
        }
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })) };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/monthly limit/i);
  });

  it("allows free user with 1 analyzed project this month", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null, subscription_plan: null, subscription_period_start: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === "analysis_runs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn().mockResolvedValue({ data: [{ project_id: "p1" }], error: null }),
              })),
            })),
          };
        }
        // live projects: only p1, which is analyzed → unanalyzed live = 0, total = 1
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ data: [{ id: "p1" }], error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canCreateProject("user-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks free user with 2 analyzed projects this month", async () => {
    const analyzedIds = [{ project_id: "p1" }, { project_id: "p2" }];
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null, subscription_plan: null, subscription_period_start: null },
                  error: null,
                }),
              })),
            })),
          };
        }
        if (table === "analysis_runs") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn().mockResolvedValue({ data: analyzedIds, error: null }),
              })),
            })),
          };
        }
        return { select: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: [], error: null }) })) };
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
  it("allows max user with 19 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "max" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 19, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks max user at 20 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "max" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 20, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/20 files/i);
  });

  it("allows pro user with 9 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "pro" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 9, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(true);
  });

  it("blocks pro user at 10 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "pro" },
                  error: null,
                }),
              })),
            })),
          };
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn().mockResolvedValue({ count: 10, error: null }),
          })),
        };
      }),
    };
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(supabase);
    const result = await canAddFile("user-1", "proj-1");
    expect(result.allowed).toBe(false);
    expect(result.reason).toMatch(/10 files/i);
  });

  it("allows free user with 4 files in project", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: null, subscription_plan: null },
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
                  data: { subscription_status: null, subscription_plan: null },
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
                  data: { subscription_status: "active", subscription_plan: "pro" },
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

  it("allows max user unconditionally", async () => {
    const supabase = {
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                single: vi.fn().mockResolvedValue({
                  data: { subscription_status: "active", subscription_plan: "max" },
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
                  data: { subscription_status: null, subscription_plan: null },
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
                  data: { subscription_status: null, subscription_plan: null },
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
                  data: { subscription_status: null, subscription_plan: null },
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
              data: { subscription_status: "active", subscription_plan: "pro" },
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

  it("allows max user", async () => {
    const supabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: { subscription_status: "active", subscription_plan: "max" },
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
              data: { subscription_status: null, subscription_plan: null },
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
