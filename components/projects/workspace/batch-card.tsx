"use client";

import Link from "next/link";
import type { FeedbackFile } from "@/lib/types/database";
import { Trash2, FileText, Clipboard, Copy } from "lucide-react";

export type BatchGroup = {
  sourceLabel: string;
  files: FeedbackFile[];
  wordCount: number;
  badge: "PDF" | "TXT" | "DOCX" | "MD" | "JSON" | "Paste" | "Mixed";
};

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

interface BatchCardProps {
  batch: BatchGroup;
  onDelete: () => void;
  isDeleting: boolean;
  projectId: string;
}

export function BatchCard({ batch, onDelete, isDeleting, projectId }: BatchCardProps) {
  const latestDate = batch.files.reduce(
    (max, f) => (f.created_at > max ? f.created_at : max),
    batch.files[0].created_at
  );
  const isPaste = batch.badge === "Paste";
  const Icon = isPaste ? Clipboard : FileText;
  const fileLabel =
    batch.files.length === 1 ? "1 file" : `${batch.files.length} files`;

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = batch.files.map((f) => f.content).join("\n\n---\n\n");
    navigator.clipboard.writeText(text);
  };

  const cardClass =
    "flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 flex-shrink-0 transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]";

  const inner = (
    <>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-[var(--color-surface-1)] text-[var(--color-text-secondary)]">
        <Icon size={15} strokeWidth={1.7} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-[var(--color-text-primary)]">
          {batch.sourceLabel}
        </div>
        <div className="mt-0.5 flex gap-2 text-xs text-[var(--color-text-tertiary)]">
          <span>{fileLabel}</span>
          <span>·</span>
          <span>{batch.wordCount.toLocaleString()} words</span>
          <span>·</span>
          <span>{formatRelativeTime(latestDate)}</span>
        </div>
      </div>
      <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
        {batch.badge}
      </span>
      {isPaste && (
        <button
          aria-label="Copy text"
          onClick={handleCopy}
          className="cursor-pointer flex items-center justify-center rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <Copy size={14} strokeWidth={1.7} />
        </button>
      )}
      <button
        aria-label="Delete batch"
        disabled={isDeleting}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        className="cursor-pointer flex items-center justify-center rounded-md p-1 text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-error)] disabled:pointer-events-none disabled:opacity-50"
      >
        <Trash2 size={14} strokeWidth={1.7} />
      </button>
    </>
  );

  if (isPaste) {
    const href = `/projects/${projectId}/inputs/${encodeURIComponent(batch.sourceLabel)}`;
    return (
      <Link href={href} className={`${cardClass} cursor-pointer`}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
