import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { env } from "@/lib/env";
import { ProposalOutputSchema, type ProposalOutput } from "@/lib/schemas/proposal";
import type { Theme } from "@/lib/schemas/synthesis";

const SYSTEM_PROMPT = `You are generating a structured product feature proposal from validated customer feedback.

Rules:
- Only use evidence provided from the source material. Do not fabricate quotes or unsupported claims.
- Scope the proposal to a single feature or opportunity matching the provided theme.
- Write a concise problem statement in plain language (2-3 sentences).
- Suggest UI, workflow, and data model changes only if justified by the evidence.
- If data model changes or workflow changes are not needed, return empty arrays for those fields.
- Break engineering work into atomic, implementation-ready steps suitable for AI coding agents.
- If the evidence is too weak, still produce the best proposal you can from the available quotes.

Return the proposal with all required fields: featureName, problemStatement, userEvidence, suggestedUiChanges, suggestedDataModelChanges, suggestedWorkflowChanges, engineeringTasks.`;

function buildProposalPrompt(theme: Theme): string {
  const quotesText = theme.quotes
    .map((q) => `- "${q.quote}" — ${q.sourceLabel}`)
    .join("\n");

  return `Generate a structured feature proposal for the following theme:

Theme: ${theme.themeName}
Frequency: ${theme.frequency}

Supporting evidence:
${quotesText}`;
}

export async function generateProposals(themes: Theme[]): Promise<ProposalOutput[]> {
  const results: ProposalOutput[] = [];

  for (const theme of themes) {
    try {
      const { object } = await generateObject({
        model: anthropic(env.AI_MODEL),
        schema: ProposalOutputSchema,
        system: SYSTEM_PROMPT,
        prompt: buildProposalPrompt(theme),
      });
      results.push(object);
    } catch {
      // Skip failed proposals — continue with remaining themes
      // Per spec: "Stage 2 schema validation fails for one proposal → Skip that proposal, continue"
    }
  }

  return results;
}
