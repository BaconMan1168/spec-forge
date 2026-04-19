const KB = 1024;
const MB = 1024 * 1024;

/** Maximum words allowed in a single pasted text input (all plans). */
export const PASTE_WORD_LIMIT = 5000;

/** Per-MIME-type, per-plan file size limits (bytes). */
export const FILE_SIZE_LIMITS: Record<string, Record<"free" | "pro" | "max", number>> = {
  "text/plain":     { free: 200 * KB, pro: 500 * KB, max: 1 * MB },
  "text/markdown":  { free: 200 * KB, pro: 500 * KB, max: 1 * MB },
  "application/json": { free: 500 * KB, pro: 1 * MB,   max: 2 * MB },
  "application/pdf": { free: 2 * MB,   pro: 5 * MB,   max: 10 * MB },
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": {
    free: 2 * MB, pro: 5 * MB, max: 10 * MB,
  },
};

/** Human-readable label for each MIME type group. */
export const FILE_TYPE_LABEL: Record<string, string> = {
  "text/plain": "TXT",
  "text/markdown": "Markdown",
  "application/json": "JSON",
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
};

/** Format bytes as "X KB" or "X MB". */
export function formatBytes(bytes: number): string {
  if (bytes >= MB) return `${bytes / MB} MB`;
  return `${Math.round(bytes / KB)} KB`;
}

export const PLANS = {
  free: {
    name: "Free",
    priceUsd: 0,
  },
  pro: {
    name: "Pro",
    priceUsd: 9,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID ?? "",
  },
  max: {
    name: "Max",
    priceUsd: 19,
    stripePriceId: process.env.STRIPE_MAX_PRICE_ID ?? "",
  },
} as const;
