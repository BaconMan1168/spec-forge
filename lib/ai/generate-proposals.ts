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

Conflict handling:
- When the theme is marked as conflicting, do NOT pick a side.
- Name the disagreement explicitly in the problem statement.
- Recommend user research as the primary path to resolve the conflict before building.
- Set isConflictProposal to true for conflicting themes, false otherwise.

Return the proposal with all required fields: featureName, problemStatement, userEvidence, suggestedUiChanges, suggestedDataModelChanges, suggestedWorkflowChanges, engineeringTasks, isConflictProposal.`;

function buildProposalPrompt(theme: Theme): string {
  const quotesText = theme.quotes
    .map((q) => `- "${q.quote}" — ${q.sourceLabel}`)
    .join("\n");

  const conflictNote = theme.hasConflict
    ? "\nNote: This theme has CONFLICTING signals — sources express opposing views. Do not pick a side. Acknowledge the disagreement and recommend research to resolve it.\n"
    : "";

  return `Generate a structured feature proposal for the following theme:

Theme: ${theme.themeName}
Frequency: ${theme.frequency}${conflictNote}
Supporting evidence:
${quotesText}`;
}

export async function generateProposals(themes: Theme[]): Promise<ProposalOutput[]> {
  // Run all proposals in parallel — reduces wall-clock time from O(n) sequential
  // to O(1) (bounded by the single slowest call). The cached system prompt is
  // written on the first streaming response and read by subsequent analysis runs.
  const settled = await Promise.allSettled(
    themes.map((theme, index) => {
      const start = Date.now();
      return generateObject({
        model: anthropic(env.AI_MODEL),
        schema: ProposalOutputSchema,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
            providerOptions: {
              anthropic: { cacheControl: { type: "ephemeral" } },
            },
          },
          {
            role: "user",
            content: buildProposalPrompt(theme),
          },
        ],
        experimental_telemetry: {
          isEnabled: true,
          functionId: "generate-proposal",
        },
      })
        .then((r) => {
          console.log(`[proposals] proposal[${index}] "${theme.themeName}" done in ${Date.now() - start}ms`);
          return r.object;
        })
        .catch((err) => {
          console.error(
            `[proposals] proposal[${index}] "${theme.themeName}" FAILED after ${Date.now() - start}ms:`,
            err
          );
          throw err;
        });
    })
  );

  // Log any failures with full details
  settled.forEach((r, index) => {
    if (r.status === "rejected") {
      console.error(
        `[proposals] settled[${index}] rejected — theme: "${themes[index]?.themeName}":`,
        r.reason
      );
    }
  });

  const failedCount = settled.filter((r) => r.status === "rejected").length;
  if (failedCount > 0) {
    console.error(`[proposals] ${failedCount} of ${themes.length} proposal(s) failed`);
  }

  // Per spec: skip failed proposals, keep the rest
  return settled
    .filter(
      (r): r is PromiseFulfilledResult<ProposalOutput> => r.status === "fulfilled"
    )
    .map((r) => r.value);
}
