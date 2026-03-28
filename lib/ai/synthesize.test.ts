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
          },
        ],
      },
    });

    const files = [mockFile("f1", "I was lost after signup", "Interview")];
    const result = await synthesize(files);

    expect(result.themes).toHaveLength(1);
    expect(result.themes[0].themeName).toBe("Onboarding confusion");
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

  it("includes source labels in the assembled prompt", async () => {
    (generateObject as ReturnType<typeof vi.fn>).mockResolvedValue({
      object: { themes: [] },
    });

    const files = [mockFile("f1", "feedback text", "Support Ticket")];
    await synthesize(files);

    const call = (generateObject as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(call.prompt).toContain("Support Ticket");
    expect(call.prompt).toContain("feedback text");
  });
});
