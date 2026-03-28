"use client";

import Link from "next/link";
import type { FeedbackFile } from "@/lib/types/database";
import { Trash2, FileText, Clipboard, Copy, Download } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

function ActionBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="group/tip relative">
      <button
        aria-label={label}
        disabled={disabled}
        onClick={onClick}
        className={[
          "cursor-pointer flex items-center justify-center rounded-md p-1",
          "text-[var(--color-text-tertiary)] transition-colors",
          danger
            ? "hover:text-[var(--color-error)]"
            : "hover:text-[var(--color-text-primary)]",
          "disabled:pointer-events-none disabled:opacity-50",
        ].join(" ")}
      >
        {children}
      </button>
      <span
        className={[
          "pointer-events-none absolute bottom-full left-1/2 mb-1.5 -translate-x-1/2",
          "whitespace-nowrap rounded px-1.5 py-0.5",
          "text-[10px] font-medium leading-none",
          "bg-[var(--color-surface-2)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]",
          "opacity-0 scale-95",
          "transition-[opacity,transform] duration-150 ease-out",
          "group-hover/tip:opacity-100 group-hover/tip:scale-100",
        ].join(" ")}
      >
        {label}
      </span>
    </div>
  );
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

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const supabase = createClient();
    for (const file of batch.files) {
      if (!file.storage_url) continue;
      const { data, error } = await supabase.storage
        .from("feedback-uploads")
        .createSignedUrl(file.storage_url, 60);
      if (error || !data?.signedUrl) continue;
      const response = await fetch(data.signedUrl);
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    }
  };

  const cardClass =
    "cursor-pointer flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-4 py-3.5 flex-shrink-0 shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]";

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
        <ActionBtn label="Copy text" onClick={handleCopy}>
          <Copy size={14} strokeWidth={1.7} />
        </ActionBtn>
      )}
      {!isPaste && (
        <ActionBtn label="Download" onClick={handleDownload}>
          <Download size={14} strokeWidth={1.7} />
        </ActionBtn>
      )}
      <ActionBtn
        label="Delete"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
        disabled={isDeleting}
        danger
      >
        <Trash2 size={14} strokeWidth={1.7} />
      </ActionBtn>
    </>
  );

  if (isPaste) {
    const href = `/projects/${projectId}/inputs/${encodeURIComponent(batch.sourceLabel)}`;
    return (
      <Link href={href} className={cardClass}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClass}>{inner}</div>;
}
