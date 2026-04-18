"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { FeedbackFile } from "@/lib/types/database";
import type { LimitResult } from "@/lib/billing/limits";
import { deleteFeedbackBatch } from "@/app/actions/feedback-files";
import { BatchCard, type BatchGroup } from "./batch-card";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";

function groupFilesByLabel(files: FeedbackFile[]): BatchGroup[] {
  const map = new Map<string, FeedbackFile[]>();
  for (const f of files) {
    map.set(f.source_type, [...(map.get(f.source_type) ?? []), f]);
  }
  return Array.from(map.entries())
    .map(([sourceLabel, groupFiles]) => {
      const wordCount = groupFiles.reduce((s, f) => s + (f.word_count ?? 0), 0);
      const allPaste = groupFiles.every((f) => f.input_method === "paste");
      const allPdf = groupFiles.every((f) => f.mime_type === "application/pdf");
      const allTxt = groupFiles.every((f) => f.mime_type === "text/plain");
      const allDocx = groupFiles.every(
        (f) =>
          f.mime_type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      );
      const allMd = groupFiles.every((f) => f.mime_type === "text/markdown");
      const allJson = groupFiles.every((f) => f.mime_type === "application/json");
      const badge: BatchGroup["badge"] = allPaste
        ? "Paste"
        : allPdf
        ? "PDF"
        : allTxt
        ? "TXT"
        : allDocx
        ? "DOCX"
        : allMd
        ? "MD"
        : allJson
        ? "JSON"
        : "Mixed";
      return { sourceLabel, files: groupFiles, wordCount, badge };
    })
    .sort((a, b) => {
      const latest = (g: BatchGroup) =>
        g.files.reduce(
          (max, f) => (f.created_at > max ? f.created_at : max),
          g.files[0].created_at
        );
      return latest(b).localeCompare(latest(a));
    });
}

interface InputsSectionProps {
  files: FeedbackFile[];
  projectId: string;
  lastAnalyzedAt?: string | null;
  canAddFile?: LimitResult;
}

export function InputsSection({ files, projectId, lastAnalyzedAt, canAddFile }: InputsSectionProps) {
  const router = useRouter();
  const [localFiles, setLocalFiles] = useState(files);
  const [isPending, startTransition] = useTransition();

  const included = lastAnalyzedAt
    ? localFiles.filter((f) => f.created_at <= lastAnalyzedAt)
    : localFiles;
  const newFiles = lastAnalyzedAt
    ? localFiles.filter((f) => f.created_at > lastAnalyzedAt)
    : [];

  const includedBatches = groupFilesByLabel(included);
  const newBatches = groupFilesByLabel(newFiles);
  const allBatches = groupFilesByLabel(localFiles);

  const handleDelete = (sourceLabel: string) => {
    startTransition(async () => {
      await deleteFeedbackBatch(projectId, sourceLabel);
      const remaining = localFiles.filter((f) => f.source_type !== sourceLabel);
      setLocalFiles(remaining);
      // If the deleted batch was in the "new" (post-analysis) group, check whether
      // any new files remain. If not, refresh so the server recomputes isStale and
      // the Re-analyze badge/button clears correctly.
      if (lastAnalyzedAt) {
        const stillHasNewFiles = remaining.some((f) => f.created_at > lastAnalyzedAt);
        if (!stillHasNewFiles) {
          router.refresh();
        }
      }
    });
  };

  const limitHit = canAddFile !== undefined && !canAddFile.allowed;

  const addMoreCardContent = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-tertiary)]">
        <Plus size={15} strokeWidth={2} />
      </div>
      <div>
        <div className="text-sm text-[var(--color-text-secondary)]">Add more inputs</div>
        <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">Upload files or paste text</div>
      </div>
    </>
  );

  const addMoreLink = limitHit ? (
    <PlanLimitTooltip
      allowed={false}
      reason={canAddFile!.reason}
      title="Upload limit reached"
    >
      <div
        aria-label="Add more inputs"
        className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5"
      >
        {addMoreCardContent}
      </div>
    </PlanLimitTooltip>
  ) : (
    <Link
      href={`/projects/${projectId}/add`}
      aria-label="Add more inputs"
      className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 transition-colors hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-accent-primary)]/5"
    >
      {addMoreCardContent}
    </Link>
  );

  if (!lastAnalyzedAt) {
    return (
      <div className="flex flex-col gap-2">
        {allBatches.length === 0 ? (
          <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
            No inputs yet.
          </p>
        ) : (
          <div
            className="flex flex-col gap-2 overflow-y-auto py-1 px-2"
            style={{
              maxHeight: "212px",
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
              scrollbarWidth: "thin",
            }}
          >
            {allBatches.map((batch) => (
              <BatchCard
                key={batch.sourceLabel}
                batch={batch}
                onDelete={() => handleDelete(batch.sourceLabel)}
                isDeleting={isPending}
                projectId={projectId}
              />
            ))}
          </div>
        )}
        {addMoreLink}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {localFiles.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
          No inputs yet.
        </p>
      ) : (
        <div
          className="flex flex-col gap-2 overflow-y-auto py-1 px-2"
          style={{
            maxHeight: "260px",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
            scrollbarWidth: "thin",
          }}
        >
          {includedBatches.map((batch) => (
            <BatchCard
              key={batch.sourceLabel}
              batch={batch}
              onDelete={() => handleDelete(batch.sourceLabel)}
              isDeleting={isPending}
              projectId={projectId}
            />
          ))}

          {newBatches.length > 0 && (
            <>
              <div className="flex items-center gap-2 border-t border-dashed border-[var(--color-border-subtle)] pt-3">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="shrink-0 text-[hsl(40_70%_55%)]">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="16" />
                  <line x1="8" y1="12" x2="16" y2="12" />
                </svg>
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[hsl(40_70%_55%)]">
                  Not included in current analysis
                </span>
              </div>
              {newBatches.map((batch) => (
                <div key={batch.sourceLabel} className="rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_20%_12%)]">
                  <BatchCard
                    batch={batch}
                    onDelete={() => handleDelete(batch.sourceLabel)}
                    isDeleting={isPending}
                    projectId={projectId}
                  />
                </div>
              ))}
            </>
          )}
        </div>
      )}
      {addMoreLink}
    </div>
  );
}
