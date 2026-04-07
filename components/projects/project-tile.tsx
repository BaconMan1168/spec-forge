"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Trash2, AlertTriangle } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import { BlurFade } from "@/components/ui/blur-fade";
import { deleteProject } from "@/app/actions/projects";

// Cycles through analog-1/2/3 token values at 20% opacity by index
const ICON_COLORS = [
  { bg: "hsla(200,55%,55%,0.20)", border: "hsla(200,55%,55%,0.30)" },
  { bg: "hsla(220,55%,55%,0.20)", border: "hsla(220,55%,55%,0.30)" },
  { bg: "hsla(240,55%,60%,0.20)", border: "hsla(240,55%,60%,0.30)" },
] as const;

type ProjectTileProps = {
  id: string;
  name: string;
  createdAt: string;
  index: number;
};

export function ProjectTile({ id, name, createdAt, index }: ProjectTileProps) {
  const iconColor = ICON_COLORS[index % ICON_COLORS.length];
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setConfirmOpen(true);
  }

  function confirmDelete() {
    startTransition(async () => {
      await deleteProject(id);
    });
  }

  return (
    <BlurFade delay={index * 0.04} duration={0.28}>
      <div className="relative group/tile">
        <Link href={`/projects/${id}`} className="block h-full">
          <MagicCard
            className="flex h-full flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] backdrop-blur-[20px] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:shadow-[var(--shadow-3)] hover:border-[var(--color-border-strong)]"
            gradientColor="hsla(220,55%,55%,0.10)"
          >
            {/* Color-coded icon block */}
            <div
              data-tile-icon
              className="h-[26px] w-[26px] rounded-[var(--radius-xs)] border"
              style={{
                background: iconColor.bg,
                borderColor: iconColor.border,
              }}
            />

            {/* Project name */}
            <p className="text-[20px] font-semibold leading-snug text-[var(--color-text-primary)]">
              {name}
            </p>

            {/* Created date */}
            <p className="text-[14px] text-[var(--color-text-tertiary)]">
              {new Date(createdAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </p>
          </MagicCard>
        </Link>

        {/* Delete button — floats over the card, outside the Link */}
        <button
          onClick={handleDelete}
          aria-label={`Delete project "${name}"`}
          className="absolute right-3 top-3 flex h-7 w-7 cursor-pointer items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-tertiary)] opacity-0 transition-[opacity,background-color,color] duration-[150ms] group-hover/tile:opacity-100 hover:bg-[var(--color-error)]/10 hover:text-[var(--color-error)]"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Confirmation modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-[500] flex items-center justify-center px-4"
          onClick={() => setConfirmOpen(false)}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Dialog */}
          <div
            className="relative w-full max-w-[400px] rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-7 shadow-[var(--shadow-3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-error)]/10">
                <AlertTriangle size={16} className="text-[var(--color-error)]" />
              </div>
              <h2 className="text-[17px] font-semibold text-[var(--color-text-primary)]">
                Delete project?
              </h2>
            </div>

            <p className="mb-2 text-[14px] leading-relaxed text-[var(--color-text-secondary)]">
              <span className="font-semibold text-[var(--color-text-primary)]">
                &ldquo;{name}&rdquo;
              </span>{" "}
              will be permanently deleted, including all uploaded files, analysis results, and exports.
            </p>
            <p className="mb-7 text-[13px] text-[var(--color-text-tertiary)]">
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-4 py-2.5 text-[14px] font-medium text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isPending}
                className="flex-1 rounded-[var(--radius-pill)] bg-[var(--color-error)] px-4 py-2.5 text-[14px] font-semibold text-white transition-opacity duration-[120ms] hover:opacity-90 disabled:opacity-50"
              >
                {isPending ? "Deleting…" : "Delete project"}
              </button>
            </div>
          </div>
        </div>
      )}
    </BlurFade>
  );
}
