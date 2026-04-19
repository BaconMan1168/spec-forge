import { describe, it, expect } from "vitest";
import { ProposalOutputSchema } from "./proposal";

const validProposal = {
  featureName: "Faster Load Times",
  problemStatement:
    "Users report that the application loads too slowly on mobile devices, causing frustration and drop-off.",
  userEvidence: [
    { quote: "The app takes forever to load.", sourceLabel: "User interview A" },
    { quote: "Loading is really slow on mobile.", sourceLabel: "Survey response B" },
    { quote: "I gave up waiting and closed it.", sourceLabel: "App review C" },
  ],
  suggestedUiChanges: [
    "Add a skeleton loading state to the main feed",
    "Show a progress indicator during data fetching",
  ],
  suggestedDataModelChanges: [
    "Add pagination or cursor-based loading to reduce initial payload size",
  ],
  suggestedWorkflowChanges: [
    "Prefetch critical data on route transition",
    "Defer non-critical requests until after first paint",
  ],
  engineeringTasks: [
    "Implement skeleton UI components for the main feed",
    "Add React Suspense boundaries around data-dependent sections",
    "Migrate list endpoint to cursor-based pagination",
  ],
  isConflictProposal: false,
};

describe("ProposalOutputSchema", () => {
  it("accepts valid proposal output", () => {
    const result = ProposalOutputSchema.safeParse(validProposal);
    expect(result.success).toBe(true);
  });

  it("rejects missing featureName", () => {
    const result = ProposalOutputSchema.safeParse({
      ...validProposal,
      featureName: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing problemStatement", () => {
    const result = ProposalOutputSchema.safeParse({
      ...validProposal,
      problemStatement: undefined,
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty userEvidence array", () => {
    const result = ProposalOutputSchema.safeParse({
      ...validProposal,
      userEvidence: [],
    });
    expect(result.success).toBe(false);
  });

  it("rejects userEvidence item missing sourceLabel", () => {
    const result = ProposalOutputSchema.safeParse({
      ...validProposal,
      userEvidence: [{ quote: "Some quote" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty engineeringTasks array", () => {
    const result = ProposalOutputSchema.safeParse({
      ...validProposal,
      engineeringTasks: [],
    });
    expect(result.success).toBe(false);
  });

  it("strips extra fields", () => {
    const input = { ...validProposal, unexpectedField: "should be stripped" };
    const result = ProposalOutputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("unexpectedField" in result.data).toBe(false);
    }
  });

  it("allows empty suggestedDataModelChanges", () => {
    const result = ProposalOutputSchema.safeParse({
      ...validProposal,
      suggestedDataModelChanges: [],
    });
    expect(result.success).toBe(true);
  });
});
