import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
vi.mock("@/lib/billing/limits", () => ({
  canExport: vi.fn(),
}));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: vi.fn() }));

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { canExport } from "@/lib/billing/limits";
import { exportProposal } from "./exports";

const fakeProposal = {
  id: "prop-1",
  feature_name: "Dark Mode",
  problem_statement: "Users want dark mode.",
  evidence: [{ quote: "Please add dark mode", sourceLabel: "Survey" }],
  ui_changes: ["Add theme toggle"],
  data_model_changes: [],
  workflow_changes: [],
  engineering_tasks: ["Implement CSS variables"],
};

const makeUserClient = (userId: string | null) => ({
  auth: {
    getUser: vi.fn().mockResolvedValue({
      data: { user: userId ? { id: userId } : null },
    }),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: fakeProposal, error: null }),
      })),
    })),
  })),
});

const makeServiceClient = () => ({
  from: vi.fn(() => ({
    upsert: vi.fn().mockResolvedValue({ error: null }),
  })),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("exportProposal", () => {
  it("throws when unauthenticated", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient(null));
    await expect(exportProposal("proj-1", "prop-1")).rejects.toThrow("Unauthenticated");
  });

  it("throws when limit not allowed", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient("user-1"));
    (canExport as ReturnType<typeof vi.fn>).mockResolvedValue({
      allowed: false,
      reason: "Free plan: 3 exports per project",
    });
    await expect(exportProposal("proj-1", "prop-1")).rejects.toThrow(
      "Free plan: 3 exports per project"
    );
  });

  it("returns markdown string when allowed", async () => {
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient("user-1"));
    (canExport as ReturnType<typeof vi.fn>).mockResolvedValue({ allowed: true, reason: "" });
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(makeServiceClient());
    const result = await exportProposal("proj-1", "prop-1");
    expect(result).toContain("# Dark Mode");
    expect(result).toContain("Please add dark mode");
  });

  it("upserts to exports table on conflict do nothing", async () => {
    const upsertMock = vi.fn().mockResolvedValue({ error: null });
    (createClient as ReturnType<typeof vi.fn>).mockResolvedValue(makeUserClient("user-1"));
    (canExport as ReturnType<typeof vi.fn>).mockResolvedValue({ allowed: true, reason: "" });
    const serviceClient = {
      from: vi.fn(() => ({ upsert: upsertMock })),
    };
    (createServiceClient as ReturnType<typeof vi.fn>).mockReturnValue(serviceClient);
    await exportProposal("proj-1", "prop-1");
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ project_id: "proj-1", proposal_id: "prop-1" }),
      { onConflict: "project_id,proposal_id", ignoreDuplicates: true }
    );
  });
});
