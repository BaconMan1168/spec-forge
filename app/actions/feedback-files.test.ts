import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockSelect,
  mockSingle,
  mockInsert,
  mockDelete,
  mockEq,
  mockOrder,
  mockFrom,
  mockStorageRemove,
  mockStorageFrom,
} = vi.hoisted(() => {
  const mockSelect = vi.fn();
  const mockSingle = vi.fn();
  const mockInsert = vi.fn();
  const mockDelete = vi.fn();
  const mockEq = vi.fn();
  const mockOrder = vi.fn();
  const mockFrom = vi.fn(() => ({
    select: mockSelect,
    insert: mockInsert,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  }));
  const mockStorageRemove = vi.fn().mockResolvedValue({ error: null });
  const mockStorageFrom = vi.fn(() => ({ remove: mockStorageRemove }));
  return {
    mockSelect,
    mockSingle,
    mockInsert,
    mockDelete,
    mockEq,
    mockOrder,
    mockFrom,
    mockStorageRemove,
    mockStorageFrom,
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    },
    from: mockFrom,
    storage: { from: mockStorageFrom },
  }),
}));

vi.mock("@/lib/parse/parse-file", () => ({
  countWords: vi.fn().mockReturnValue(1),
  parseFileToText: vi.fn().mockResolvedValue("parsed"),
  isSupportedMimeType: vi.fn().mockReturnValue(true),
}));

import {
  pasteFeedbackText,
  getFeedbackFiles,
  deleteFeedbackBatch,
} from "./feedback-files";

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnValue({
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  });
  mockInsert.mockReturnValue({ select: mockSelect });
  mockDelete.mockReturnValue({ eq: mockEq });
  mockEq.mockReturnValue({
    eq: mockEq,
    single: mockSingle,
    order: mockOrder,
  });
  mockOrder.mockResolvedValue({ data: [], error: null });
  mockSingle.mockResolvedValue({
    data: {
      id: "f1",
      project_id: "p1",
      file_name: "Pasted text",
      source_type: "Interview",
      content: "hello",
      storage_url: null,
      mime_type: null,
      input_method: "paste",
      word_count: 1,
      created_at: "2026-01-01",
    },
    error: null,
  });
});

describe("pasteFeedbackText", () => {
  it("inserts a feedback_files record and returns it", async () => {
    const result = await pasteFeedbackText({
      projectId: "p1",
      sourceType: "Interview",
      content: "some text",
    });
    expect(mockFrom).toHaveBeenCalledWith("feedback_files");
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        project_id: "p1",
        source_type: "Interview",
        input_method: "paste",
      })
    );
    expect(result.id).toBe("f1");
  });

  it("throws when content is empty", async () => {
    await expect(
      pasteFeedbackText({ projectId: "p1", sourceType: "X", content: "   " })
    ).rejects.toThrow("Content is required");
  });

  it("throws when sourceType is empty", async () => {
    await expect(
      pasteFeedbackText({ projectId: "p1", sourceType: "  ", content: "hi" })
    ).rejects.toThrow("Source label is required");
  });
});

describe("getFeedbackFiles", () => {
  it("queries feedback_files ordered by created_at desc", async () => {
    mockOrder.mockResolvedValue({ data: [], error: null });
    const result = await getFeedbackFiles("p1");
    expect(mockFrom).toHaveBeenCalledWith("feedback_files");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(result).toEqual([]);
  });
});

describe("deleteFeedbackBatch", () => {
  it("deletes DB records and removes storage files", async () => {
    mockEq.mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        data: [{ storage_url: "projects/p1/file.pdf" }],
        error: null,
      }),
    });
    mockDelete.mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ error: null }),
      }),
    });
    await deleteFeedbackBatch("p1", "Interview");
    expect(mockFrom).toHaveBeenCalledWith("feedback_files");
  });
});
