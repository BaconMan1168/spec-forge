import { z } from "zod";

export const UserEvidenceSchema = z.object({
  quote: z.string().min(1),
  sourceLabel: z.string().min(1),
});

// Canonical proposal shape per docs/ai/output-spec.md
export const ProposalOutputSchema = z.object({
  featureName: z.string().min(1),
  problemStatement: z.string().min(1),
  userEvidence: z.array(UserEvidenceSchema).min(1),
  suggestedUiChanges: z.array(z.string().min(1)),
  suggestedDataModelChanges: z.array(z.string().min(1)),
  suggestedWorkflowChanges: z.array(z.string().min(1)),
  engineeringTasks: z.array(z.string().min(1)).min(1),
  // True when the source theme had conflicting signals
  isConflictProposal: z.boolean(),
});

export type UserEvidence = z.infer<typeof UserEvidenceSchema>;
export type ProposalOutput = z.infer<typeof ProposalOutputSchema>;
