import { useRef } from "react";
import { UploadCloud, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

// To add a new file format: append its extension and MIME type here.
// No other UI files need to change.
export const ACCEPTED_EXTENSIONS =
  ".pdf,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.txt,text/plain,.md,text/markdown,.json,application/json";

export const ACCEPTED_FORMATS_LABEL = "PDF, DOCX, TXT, MD, JSON";

export function validateSourceLabel(v: string): string | null {
  const t = v.trim();
  if (!t) return "Source label is required";
  if (t.length > 60) return "Must be 60 characters or less";
  if (!/^[a-zA-Z0-9 \-]+$/.test(t))
    return "Only letters, numbers, spaces, and hyphens";
  return null;
}

interface StepUploadProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  sourceLabel: string;
  onSourceLabelChange: (v: string) => void;
  sourceLabelError: string | null;
  onBack: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function StepUpload({
  files,
  onFilesChange,
  sourceLabel,
  onSourceLabelChange,
  sourceLabelError,
  onBack,
  onSubmit,
  isSubmitting,
}: StepUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    onFilesChange([...files, ...dropped]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    onFilesChange([...files, ...selected]);
  };

  const canSubmit = files.length > 0 && !isSubmitting;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
          Drop files here
        </p>
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className="flex cursor-pointer flex-col items-center gap-2 rounded-[var(--radius-md)] border border-dashed border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-primary)]/5 px-5 py-7 text-center transition-colors hover:border-[var(--color-accent-primary)]/50"
        >
          <UploadCloud
            size={28}
            strokeWidth={1.5}
            className="text-[var(--color-accent-primary)]"
          />
          <p className="text-[13px] font-medium text-[var(--color-text-primary)]">
            Drag & drop files here, or click to browse
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            Multiple files · Max 10 MB each
          </p>
          <p className="text-[11px] text-[var(--color-text-tertiary)]">
            {ACCEPTED_FORMATS_LABEL}
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept={ACCEPTED_EXTENSIONS}
            className="hidden"
            onChange={handleInputChange}
          />
        </div>
        {files.length > 0 && (
          <p className="mt-1.5 text-[11px] text-[var(--color-text-secondary)]">
            {files.length} file{files.length > 1 ? "s" : ""} selected
          </p>
        )}
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
          Submit batch
        </Button>
      </div>
    </div>
  );
}
