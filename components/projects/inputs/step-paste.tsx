import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const WORD_LIMIT = 5000;

function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

interface StepPasteProps {
  content: string;
  onContentChange: (v: string) => void;
  sourceLabel: string;
  onSourceLabelChange: (v: string) => void;
  sourceLabelError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepPaste({
  content,
  onContentChange,
  sourceLabel,
  onSourceLabelChange,
  sourceLabelError,
  onBack,
  onSubmit,
  isSubmitting,
}: StepPasteProps) {
  const wordCount = countWords(content);
  const isOverLimit = wordCount > WORD_LIMIT;
  const canSubmit = content.trim().length > 0 && !isSubmitting && !isOverLimit;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Paste text
        </p>
        <textarea
          aria-label="Paste your feedback text"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Paste your feedback, interview transcript, support ticket, or any raw text here…"
          rows={6}
          className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-2.5 text-[13px] leading-relaxed text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-primary)]/50 focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
        />
        <p
          className={`mt-1.5 text-right text-[11px] tabular-nums ${
            isOverLimit
              ? "text-[var(--color-error)]"
              : wordCount > WORD_LIMIT * 0.9
                ? "text-[hsl(40_70%_55%)]"
                : "text-[var(--color-text-tertiary)]"
          }`}
        >
          {wordCount.toLocaleString()} / {WORD_LIMIT.toLocaleString()} words
          {isOverLimit && " — limit exceeded"}
        </p>
      </div>

      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Source label
        </p>
        <input
          type="text"
          value={sourceLabel}
          onChange={(e) => onSourceLabelChange(e.target.value)}
          placeholder="e.g. User Interview, Support Ticket, Survey…"
          maxLength={60}
          className="w-full rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-2.5 text-[13px] text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent-primary)]/50 focus:ring-2 focus:ring-[var(--color-accent-primary)]/20"
        />
        {sourceLabelError && (
          <p className="mt-1 text-[11px] text-[var(--color-error)]">
            {sourceLabelError}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack} type="button">
          <ArrowLeft size={14} />
          Back
        </Button>
        <Button
          size="sm"
          disabled={!canSubmit}
          onClick={onSubmit}
          type="button"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={13} className="animate-spin" />
              Uploading…
            </>
          ) : (
            "Submit batch"
          )}
        </Button>
      </div>
    </div>
  );
}
