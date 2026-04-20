import { generateObject } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { z } from "zod";
import { env } from "@/lib/env";
import { ThemeSchema } from "@/lib/schemas/synthesis";
import type { FeedbackFile } from "@/lib/types/database";

// Relaxed schema — allows empty themes for insufficient-signal case.
// Does NOT modify the existing SynthesisOutputSchema (which enforces .min(1)).
const SynthesisResultSchema = z.object({
  themes: z.array(ThemeSchema),
});

export type SynthesisResult = z.infer<typeof SynthesisResultSchema>;

const SYSTEM_PROMPT = `You are an expert product analyst synthesizing customer feedback for a product team.

Your job is to identify recurring themes, pain points, and opportunities across all provided feedback.

Rules:
- Only use the provided source text. Do not fabricate or embellish quotes.
- Quotes must be verbatim or near-verbatim and clearly attributable to a provided source label.
- Group semantically similar feedback into recurring themes.
- Prefer meaningful recurring pain points over one-off comments.
- Return AT MOST 5 themes, ranked by frequency and signal strength (strongest first).

STRICT low-signal rule — return an empty themes array (no themes at all) if ANY of the following apply:
- The input contains fewer than 2 distinct sources.
- No theme appears in 2 or more distinct sources (single-source mentions are noise, not themes).
- The feedback is too vague, too short, or too generic to identify actionable product patterns (e.g. single words, filler text, lorem ipsum, test data, non-product content).
- The content does not constitute real product feedback (e.g. it is a random document, marketing copy, or unrelated text).
When in doubt, return empty. Do not invent or stretch themes to fill the output.

Signal strength assessment (set signalStrength per theme):
- "high": theme appears across multiple sources with specific, actionable feedback
- "medium": theme has some support but limited sources or vague comments
- "low": theme is based on a single source, very brief/ambiguous comments, or weak evidence

Conflict detection (set hasConflict per theme):
- Set hasConflict to true when sources express genuinely opposing views on the same dimension (e.g. one source says the UX is too slow, another says it is too fast; one source says the app is too simple, another says it is too complex).
- Do not flag as conflict when sources merely vary in intensity or emphasis on the same problem.
- Set hasConflict to false for all other themes.

Return a structured result with themes containing themeName, frequency (human-readable string like "6 of 8 sources"), representative quotes with source labels, signalStrength, and hasConflict.`;

function buildUserPrompt(files: FeedbackFile[]): string {
  const sections = files
    .map(
      (f, i) =>
        `--- Source ${i + 1}: ${f.source_type} ---\n${f.content.trim()}`
    )
    .join("\n\n");

  return `Analyze the following ${files.length} feedback input(s) and identify recurring themes:\n\n${sections}`;
}

/**
 * Corrects an AI-generated frequency string so the numerator never exceeds the
 * actual source count. The expected format is "X of Y sources". If the
 * numerator is larger than `totalSources`, it is clamped.
 *
 * Example: fixFrequency("5 of 4 sources", 4) → "4 of 4 sources"
 */
function fixFrequency(frequency: string, totalSources: number): string {
  const match = frequency.match(/^(\d+)\s+of\s+(\d+)\s+sources?$/i);
  if (!match) return frequency;
  const numerator = Math.min(parseInt(match[1], 10), totalSources);
  return `${numerator} of ${totalSources} sources`;
}

export async function synthesize(files: FeedbackFile[]): Promise<SynthesisResult> {
  const { object } = await generateObject({
    model: anthropic(env.AI_MODEL),
    schema: SynthesisResultSchema,
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
        content: buildUserPrompt(files),
      },
    ],
  });

  // Correct any frequency strings where the AI overcounted supporting sources.
  return {
    themes: object.themes.map((theme) => ({
      ...theme,
      frequency: fixFrequency(theme.frequency, files.length),
    })),
  };
}
