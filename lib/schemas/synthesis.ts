import { z } from "zod";

export const QuoteSchema = z.object({
  quote: z.string().min(1),
  sourceLabel: z.string().min(1),
});

export const ThemeSchema = z.object({
  themeName: z.string().min(1),
  // Human-readable signal per data-model.md ("simple user-readable signal in MVP")
  frequency: z.string().min(1),
  quotes: z.array(QuoteSchema).min(1),
  // AI self-assessment of evidence quality for this theme
  signalStrength: z.enum(["high", "medium", "low"]),
});

export const SynthesisOutputSchema = z.object({
  themes: z.array(ThemeSchema).min(1),
});

export type Quote = z.infer<typeof QuoteSchema>;
export type Theme = z.infer<typeof ThemeSchema>;
export type SynthesisOutput = z.infer<typeof SynthesisOutputSchema>;
