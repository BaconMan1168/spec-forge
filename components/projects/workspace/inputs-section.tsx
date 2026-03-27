"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { FeedbackFile } from "@/lib/types/database";
import { deleteFeedbackBatch } from "@/app/actions/feedback-files";
import { BatchCard, type BatchGroup } from "./batch-card";

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
}

export function InputsSection({ files, projectId }: InputsSectionProps) {
  const [localFiles, setLocalFiles] = useState(files);
  const [isPending, startTransition] = useTransition();
  const batches = groupFilesByLabel(localFiles);

  const handleDelete = (sourceLabel: string) => {
    startTransition(async () => {
      await deleteFeedbackBatch(projectId, sourceLabel);
      setLocalFiles((prev) =>
        prev.filter((f) => f.source_type !== sourceLabel)
      );
    });
  };

  return (
    <div className="flex flex-col gap-2">
      {batches.length === 0 ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
          No inputs yet.
        </p>
      ) : (
        <div
          className="flex flex-col gap-2 overflow-y-auto py-1"
          style={{
            maxHeight: "212px",
            maskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)",
            scrollbarWidth: "thin",
          }}
        >
          {batches.map((batch) => (
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
      <Link
        href={`/projects/${projectId}/add`}
        aria-label="Add more inputs"
        className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 transition-colors hover:border-[var(--color-accent-primary)]/30 hover:bg-[var(--color-accent-primary)]/5"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-tertiary)]">
          <Plus size={15} strokeWidth={2} />
        </div>
        <div>
          <div className="text-sm text-[var(--color-text-secondary)]">
            Add more inputs
          </div>
          <div className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">
            Upload files or paste text
          </div>
        </div>
      </Link>
    </div>
  );
}
