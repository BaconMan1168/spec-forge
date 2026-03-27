export const SUPPORTED_MIME_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/json",
] as const;

export type SupportedMimeType = (typeof SUPPORTED_MIME_TYPES)[number];

/**
 * Parse a file buffer to plain UTF-8 text.
 *
 * @param buffer   - Raw file bytes
 * @param mimeType - MIME type reported by the browser/OS
 * @param fileName - Original filename — used to resolve ambiguous types
 *                   (e.g. .md files reported as text/plain by some browsers)
 */
export async function parseFileToText(
  buffer: Buffer,
  mimeType: string,
  fileName?: string
): Promise<string> {
  const ext = fileName?.split(".").pop()?.toLowerCase();

  // PDF
  if (mimeType === "application/pdf" || ext === "pdf") {
    const pdfParse = (await import("pdf-parse")).default;
    const result = await pdfParse(buffer);
    return result.text.trim();
  }

  // DOCX
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === "docx"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  }

  // JSON — parse + pretty-print for readability
  if (mimeType === "application/json" || ext === "json") {
    const parsed = JSON.parse(buffer.toString("utf-8"));
    return JSON.stringify(parsed, null, 2);
  }

  // Markdown (.md) — some browsers report as text/plain; ext takes precedence
  // TXT — direct UTF-8 read
  if (
    mimeType === "text/plain" ||
    mimeType === "text/markdown" ||
    ext === "md" ||
    ext === "txt"
  ) {
    return buffer.toString("utf-8").trim();
  }

  throw new Error(`Unsupported file type: ${mimeType}`);
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}
