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
import { synthesize } from "./synthesize";
import type { FeedbackFile } from "@/lib/types/database";

const mockFile = (id: string, content: string, sourceType: string): FeedbackFile => ({
  id,
  project_id: "p1",
  file_name: "file.txt",
  source_type: sourceType,
  content,
  storage_url: null,
  mime_type: "text/plain",
  input_method: "upload",
  word_count: 10,
  created_at: "2026-01-01T00:00:00Z",
});

beforeEach(() => vi.clearAllMocks());

describe("synthesize", () => {
  it("returns themes when model responds with valid data", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: {
        themes: [
          {
            themeName: "Onboarding confusion",
            frequency: "6 of 8 sources",
            quotes: [{ quote: "I was lost", sourceLabel: "Interview" }],
            signalStrength: "high",
            hasConflict: false,
          },
        ],
      },
    });

    const files = [mockFile("f1", "I was lost after signup", "Interview")];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(1);
    expect(result.themes[0].themeName).toBe("Onboarding confusion");
    expect(result.themes[0].signalStrength).toBe("high");
    expect(result.themes[0].hasConflict).toBe(false);
    expect(generateObject).toHaveBeenCalledOnce();
  });

  it("returns empty themes array when model returns no themes (insufficient signal)", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: { themes: [] },
    });

    const files = [mockFile("f1", "ok", "Survey")];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(0);
  });

  it("preserves low signalStrength from model output", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: {
        themes: [
          {
            themeName: "App reminders need improvement",
            frequency: "1 of 1 sources",
            quotes: [{ quote: "Maybe make reminders better.", sourceLabel: "Pasted input" }],
            signalStrength: "low",
            hasConflict: false,
          },
        ],
      },
    });

    const files = [mockFile("f1", "Maybe make reminders better.", "Pasted input")];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(1);
    expect(result.themes[0].signalStrength).toBe("low");
  });

  it("preserves hasConflict true from model output", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: {
        themes: [
          {
            themeName: "UX speed",
            frequency: "2 of 2 sources",
            quotes: [
              { quote: "Too slow", sourceLabel: "Source A" },
              { quote: "Too fast", sourceLabel: "Source B" },
            ],
            signalStrength: "medium",
            hasConflict: true,
          },
        ],
      },
    });

    const files = [
      mockFile("f1", "The app is too slow", "Source A"),
      mockFile("f2", "The app is too fast", "Source B"),
    ];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(1);
    expect(result.themes[0].hasConflict).toBe(true);
  });

  it("includes source labels in the assembled prompt", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: { themes: [] },
    });

    const files = [mockFile("f1", "feedback text", "Support Ticket")];
    await synthesize(files);

    const call = (generateObject as ReturnType<typeof vi.fn>).mock.calls[0][0];
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.content).toContain("Support Ticket");
    expect(userMessage.content).toContain("feedback text");
  });
});
