import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/ai/synthesize", () => ({
  synthesize: vi.fn(),
}));

vi.mock("@/lib/ai/generate-proposals", () => ({
  generateProposals: vi.fn(),
}));

vi.mock("@/app/actions/analysis", () => ({
  persistAnalysisResults: vi.fn().mockResolvedValue(undefined),
  countRecentRunsByUser: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/billing/limits", () => ({
  canAnalyzeProject: vi.fn().mockResolvedValue({ allowed: true, reason: "" }),
}));

import { createClient } from "@/lib/supabase/server";
import { synthesize } from "@/lib/ai/synthesize";
import { generateProposals } from "@/lib/ai/generate-proposals";
import { countRecentRunsByUser } from "@/app/actions/analysis";
import { POST } from "./route";

const makeRequest = () =>
  new Request("http://localhost/api/projects/proj-1/analyze", { method: "POST" });

const makeSupabase = () => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
  },
  from: vi.fn((table: string) => {
    if (table === "projects") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "proj-1", user_id: "user-1" },
              error: null,
            }),
          }),
        }),
      };
    }
    if (table === "feedback_files") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: [{ id: "f1", content: "feedback", source_type: "Interview" }],
            error: null,
          }),
        }),
      };
    }
    if (table === "insights") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
        }),
      };
    }
    return {};
  }),
});

beforeEach(() => {
  vi.clearAllMocks();
  (synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({ themes: [] });
  (generateProposals as ReturnType<typeof vi.fn>).mockResolvedValue([]);
  (countRecentRunsByUser as ReturnType<typeof vi.fn>).mockResolvedValue(0);
});

describe("POST /api/projects/[id]/analyze", () => {
  it("returns 401 when user is not authenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 403 when project does not belong to user", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "other-user" } } }),
      },
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: "proj-1", user_id: "user-1" },
              error: null,
            }),
          }),
        }),
      })),
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(403);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    (countRecentRunsByUser as ReturnType<typeof vi.fn>).mockResolvedValue(5);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(429);
  });

  it("returns 400 when no feedback files exist", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } } }),
      },
      from: vi.fn((table: string) => {
        if (table === "projects") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "proj-1", user_id: "user-1" },
                  error: null,
                }),
              }),
            }),
          };
        }
        if (table === "insights") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          };
        }
        if (table === "feedback_files") {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          };
        }
        return {};
      }),
    });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 200 with ok signal on success", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    (synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({
      themes: [
        {
          themeName: "Onboarding confusion",
          frequency: "1 of 1 sources",
          quotes: [{ quote: "lost", sourceLabel: "Interview" }],
        },
      ],
    });
    (generateProposals as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        featureName: "Guided Onboarding",
        problemStatement: "Users get lost.",
        userEvidence: [{ quote: "lost", sourceLabel: "Interview" }],
        suggestedUiChanges: ["Add checklist"],
        suggestedDataModelChanges: [],
        suggestedWorkflowChanges: ["Show checklist"],
        engineeringTasks: ["Build it"],
      },
    ]);

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signal).toBe("ok");
    expect(body.insightCount).toBe(1);
    expect(body.proposalCount).toBe(1);
  });

  it("returns 200 with insufficient signal when no themes found", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeSupabase());
    (synthesize as ReturnType<typeof vi.fn>).mockResolvedValue({ themes: [] });

    const res = await POST(makeRequest(), { params: Promise.resolve({ id: "proj-1" }) });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.signal).toBe("insufficient");
  });
});
