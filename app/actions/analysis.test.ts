import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockFrom,
  mockSelect,
  mockInsert,
  mockDelete,
  mockEq,
  mockOrder,
  mockSingle,
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  }));
  return { mockFrom, mockSelect, mockInsert, mockDelete, mockEq, mockOrder, mockSingle };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
  }),
}));

import {
  persistAnalysisResults,
  getInsights,
  getProposals,
  getLastAnalysisRun,
} from "./analysis";
import type { ProposalOutput } from "@/lib/schemas/proposal";
import type { Theme } from "@/lib/schemas/synthesis";

const mockTheme: Theme = {
  themeName: "Onboarding confusion",
  frequency: "6 of 8 sources",
  quotes: [{ quote: "I was lost", sourceLabel: "Interview" }],
  signalStrength: "high",
  hasConflict: false,
};

const mockProposal: ProposalOutput = {
  featureName: "Guided Onboarding Flow",
  problemStatement: "Users struggle to get started.",
  userEvidence: [{ quote: "I was lost", sourceLabel: "Interview" }],
  suggestedUiChanges: ["Add a welcome checklist"],
  suggestedDataModelChanges: [],
  suggestedWorkflowChanges: ["Show checklist on first login"],
  engineeringTasks: ["Build component"],
  isConflictProposal: false,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockSelect.mockReturnValue({ eq: mockEq, order: mockOrder, single: mockSingle });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockSingle.mockResolvedValue({ data: null, error: null });
});

describe("persistAnalysisResults", () => {
  it("deletes existing insights and proposals before inserting new ones", async () => {
    mockInsert.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    await persistAnalysisResults({
      projectId: "p1",
      userId: "u1",
      themes: [mockTheme],
      proposals: [mockProposal],
      inputCount: 3,
    });

    expect(mockFrom).toHaveBeenCalledWith("insights");
    expect(mockFrom).toHaveBeenCalledWith("proposals");
    expect(mockDelete).toHaveBeenCalled();
  });
});

describe("getInsights", () => {
  it("queries insights ordered by created_at ascending", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await getInsights("p1");
    expect(mockFrom).toHaveBeenCalledWith("insights");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("getProposals", () => {
  it("queries proposals ordered by created_at ascending", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    await getProposals("p1");
    expect(mockFrom).toHaveBeenCalledWith("proposals");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
  });
});

describe("getLastAnalysisRun", () => {
  it("queries analysis_runs for the project and returns first result", async () => {
    const mockLimit = vi.fn().mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({
      data: { id: "r1", created_at: "2026-03-28T00:00:00Z", input_count: 5 },
      error: null,
    });
    mockSelect.mockReturnValue({ eq: mockEq });
    mockEq.mockReturnValue({ order: mockOrder });
    mockOrder.mockReturnValue({ limit: mockLimit });

    const result = await getLastAnalysisRun("p1");
    expect(mockFrom).toHaveBeenCalledWith("analysis_runs");
    expect(result?.id).toBe("r1");
  });
});
