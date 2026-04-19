import { describe, it, expect } from "vitest";
import { SynthesisOutputSchema } from "./synthesis";

const validSynthesis = {
  themes: [
    {
      themeName: "Slow load times",
      frequency: "Mentioned by 8 of 10 users",
      quotes: [
        { quote: "The app takes forever to load.", sourceLabel: "User interview A" },
        { quote: "Loading is really slow on mobile.", sourceLabel: "Survey response B" },
      ],
      signalStrength: "high",
    },
  ],
};

describe("SynthesisOutputSchema", () => {
  it("accepts valid synthesis output", () => {
    const result = SynthesisOutputSchema.safeParse(validSynthesis);
    expect(result.success).toBe(true);
  });

  it("rejects empty themes array", () => {
    const result = SynthesisOutputSchema.safeParse({ themes: [] });
    expect(result.success).toBe(false);
  });

  it("rejects theme missing themeName", () => {
    const input = {
      themes: [
        {
          frequency: "High",
          quotes: [{ quote: "Quote", sourceLabel: "Source" }],
          signalStrength: "high",
        },
      ],
    };
    const result = SynthesisOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects theme with empty quotes array", () => {
    const input = {
      themes: [{ themeName: "Theme", frequency: "High", quotes: [], signalStrength: "high" }],
    };
    const result = SynthesisOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("rejects quote missing sourceLabel", () => {
    const input = {
      themes: [
        {
          themeName: "Theme",
          frequency: "High",
          quotes: [{ quote: "Some quote" }],
          signalStrength: "medium",
        },
      ],
    };
    const result = SynthesisOutputSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it("strips extra fields", () => {
    const input = {
      ...validSynthesis,
      unexpectedField: "should be stripped",
    };
    const result = SynthesisOutputSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect("unexpectedField" in result.data).toBe(false);
    }
  });
});
