import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("ai", () => ({
  generateObject: vi.fn(),
}));

vi.mock("@ai-sdk/anthropic", () => ({
  anthropic: vi.fn(() => "mock-model"),
}));

vi.mock("@/lib/env", () => ({
  env: { AI_MODEL: "claude-sonnet-4-5" },
}));

import { generateObject } from "ai";
import { generateProposals } from "./generate-proposals";
import type { Theme } from "@/lib/schemas/synthesis";

const mockTheme: Theme = {
  themeName: "Onboarding confusion",
  frequency: "6 of 8 sources",
  quotes: [{ quote: "I was lost", sourceLabel: "Interview" }],
};

const mockProposalObject = {
  featureName: "Guided Onboarding Flow",
  problemStatement: "Users struggle to get started.",
  userEvidence: [{ quote: "I was lost", sourceLabel: "Interview" }],
  suggestedUiChanges: ["Add a welcome checklist"],
  suggestedDataModelChanges: [],
  suggestedWorkflowChanges: ["Show checklist on first login"],
  engineeringTasks: ["Build OnboardingChecklist component"],
};

beforeEach(() => vi.clearAllMocks());

describe("generateProposals", () => {
  it("returns one proposal per theme", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: mockProposalObject,
    });

    const result = await generateProposals([mockTheme]);

    expect(result).toHaveLength(1);
    expect(result[0].featureName).toBe("Guided Onboarding Flow");
    expect(generateObject).toHaveBeenCalledOnce();
  });

  it("calls model for each theme (parallel)", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: mockProposalObject,
    });

    const themes = [mockTheme, { ...mockTheme, themeName: "CSV export missing" }];
    const result = await generateProposals(themes);

    expect(result).toHaveLength(2);
    expect(generateObject).toHaveBeenCalledTimes(2);
  });

  it("skips a theme when model response fails and continues", async () => {
    (generateObject as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce({ object: mockProposalObject })
      .mockRejectedValueOnce(new Error("model timeout"));

    const themes = [mockTheme, { ...mockTheme, themeName: "Broken" }];
    const result = await generateProposals(themes);

    expect(result).toHaveLength(1);
    expect(result[0].featureName).toBe("Guided Onboarding Flow");
  });

  it("returns empty array when given empty themes", async () => {
    const result = await generateProposals([]);
    expect(result).toHaveLength(0);
    expect(generateObject).not.toHaveBeenCalled();
  });
});
