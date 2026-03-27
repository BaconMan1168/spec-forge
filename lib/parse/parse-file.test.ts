import { describe, it, expect, vi, beforeEach } from "vitest";
import { parseFileToText, SUPPORTED_MIME_TYPES } from "./parse-file";

vi.mock("pdf-parse", () => ({
  default: vi.fn().mockResolvedValue({ text: "parsed pdf content" }),
}));

vi.mock("mammoth", () => ({
  extractRawText: vi.fn().mockResolvedValue({ value: "parsed docx content" }),
}));

describe("SUPPORTED_MIME_TYPES", () => {
  it("includes all required types", () => {
    expect(SUPPORTED_MIME_TYPES).toContain("application/pdf");
    expect(SUPPORTED_MIME_TYPES).toContain("text/plain");
    expect(SUPPORTED_MIME_TYPES).toContain("text/markdown");
    expect(SUPPORTED_MIME_TYPES).toContain(
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(SUPPORTED_MIME_TYPES).toContain("application/json");
  });
});

describe("parseFileToText", () => {
  beforeEach(() => vi.clearAllMocks());

  it("parses PDF via pdf-parse", async () => {
    const buf = Buffer.from("fake pdf");
    const result = await parseFileToText(buf, "application/pdf");
    expect(result).toBe("parsed pdf content");
  });

  it("parses DOCX via mammoth", async () => {
    const buf = Buffer.from("fake docx");
    const result = await parseFileToText(
      buf,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    expect(result).toBe("parsed docx content");
  });

  it("parses TXT via utf-8 read", async () => {
    const buf = Buffer.from("hello world");
    const result = await parseFileToText(buf, "text/plain");
    expect(result).toBe("hello world");
  });

  it("parses MD via utf-8 read", async () => {
    const buf = Buffer.from("# heading");
    const result = await parseFileToText(buf, "text/markdown");
    expect(result).toBe("# heading");
  });

  it("resolves .md reported as text/plain using fileName", async () => {
    const buf = Buffer.from("# heading");
    const result = await parseFileToText(buf, "text/plain", "notes.md");
    expect(result).toBe("# heading");
  });

  it("parses JSON via JSON.parse + stringify", async () => {
    const data = { key: "value" };
    const buf = Buffer.from(JSON.stringify(data));
    const result = await parseFileToText(buf, "application/json");
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it("resolves .json via fileName when MIME is octet-stream", async () => {
    const data = { a: 1 };
    const buf = Buffer.from(JSON.stringify(data));
    const result = await parseFileToText(
      buf,
      "application/octet-stream",
      "data.json"
    );
    expect(result).toBe(JSON.stringify(data, null, 2));
  });

  it("throws on unsupported type", async () => {
    const buf = Buffer.from("data");
    await expect(
      parseFileToText(buf, "image/png")
    ).rejects.toThrow("Unsupported file type: image/png");
  });

  it("resolves .docx via fileName", async () => {
    const buf = Buffer.from("fake docx");
    const result = await parseFileToText(
      buf,
      "application/octet-stream",
      "report.docx"
    );
    expect(result).toBe("parsed docx content");
  });
});
