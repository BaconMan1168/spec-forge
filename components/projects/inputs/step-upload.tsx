"use client";

import { useRef, useState } from "react";
import { UploadCloud, ArrowLeft, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files);
    const next = [...files, ...dropped];
    onFilesChange(next);
    if (next.length > 1) setIsExpanded(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const next = [...files, ...selected];
    onFilesChange(next);
    if (next.length > 1) setIsExpanded(true);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    const next = files.filter((_, i) => i !== index);
    onFilesChange(next);
    if (next.length <= 1) setIsExpanded(false);
  };

  const canSubmit = files.length > 0 && !isSubmitting;
  const latestFile = files[files.length - 1];
  const extraCount = files.length - 1;

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
            Multiple files · Size limits vary by plan and file type
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

        {/* Collapsible file list */}
        {files.length > 0 && (
          <div className="mt-2 overflow-hidden rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)]">
            {/* Contracted header — always visible */}
            <button
              type="button"
              aria-label={isExpanded ? "Collapse files" : "Show files / expand"}
              onClick={() => setIsExpanded((v) => !v)}
              className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <span className="flex-1 truncate text-[12px] font-medium text-[var(--color-text-primary)]">
                {latestFile.name}
              </span>
              {extraCount > 0 && (
                <span className="shrink-0 rounded-full bg-[var(--color-surface-2)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
                  and {extraCount} more
                </span>
              )}
              {isExpanded ? (
                <ChevronUp size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
              ) : (
                <ChevronDown size={13} className="shrink-0 text-[var(--color-text-tertiary)]" />
              )}
            </button>

            {/* Expanded list */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="file-list"
                  initial={{ height: 0, opacity: 0, y: 4 }}
                  animate={{ height: "auto", opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: 4 }}
                  transition={{ type: "tween", duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="border-t border-[var(--color-border-subtle)] px-1 py-1">
                    {files.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-[var(--color-surface-2)]"
                      >
                        <span className="flex-1 truncate text-[12px] text-[var(--color-text-primary)]">
                          {file.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-[var(--color-text-tertiary)]">
                          {(file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          type="button"
                          aria-label={`Remove ${file.name}`}
                          onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                          className="flex shrink-0 cursor-pointer items-center justify-center rounded p-0.5 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-error)]"
                        >
                          <X size={12} strokeWidth={2} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
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
