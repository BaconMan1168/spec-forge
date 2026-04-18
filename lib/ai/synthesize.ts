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
- If signal is weak or no recurring themes exist, return an empty themes array instead of forcing themes.

Return a structured result with themes containing themeName, frequency (human-readable string like "6 of 8 sources"), and representative quotes with source labels.`;

function buildUserPrompt(files: FeedbackFile[]): string {
  const sections = files
    .map(
      (f, i) =>
        `--- Source ${i + 1}: ${f.source_type} ---\n${f.content.trim()}`
    )
    .join("\n\n");

  return `Analyze the following ${files.length} feedback input(s) and identify recurring themes:\n\n${sections}`;
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

  return object;
}
