"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Search, Star } from "lucide-react";
import { AnalyzeButton } from "./analyze-button";
import { InputsSection } from "./inputs-section";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import type { LimitResult } from "@/lib/billing/limits";
import type { FeedbackFile } from "@/lib/types/database";

interface WorkspaceShellProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
  hasResults: boolean;
  insightsCount: number;
  proposalsCount: number;
  canAddFileResult: LimitResult;
  canRerun: LimitResult;
  files: FeedbackFile[];
  lastAnalyzedAt: string | null;
  themesContent: React.ReactNode;
  proposalsContent: React.ReactNode;
}

function PulseSkeleton() {
  return (
    <div className="flex flex-col gap-2.5 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-5"
          style={{ opacity: 1 - i * 0.2 }}
        >
          <div className="mb-3 flex items-center gap-3">
            <div className="h-4 flex-1 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]" />
            <div className="h-4 w-20 rounded-[var(--radius-pill)] bg-[var(--color-surface-2)]" />
          </div>
          <div className="h-3 w-4/5 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
          <div className="mt-1.5 h-3 w-3/5 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
        </div>
      ))}
    </div>
  );
}

export function WorkspaceShell({
  projectId,
  hasInputs,
  isStale,
  hasResults,
  insightsCount,
  proposalsCount,
  canAddFileResult,
  canRerun,
  files,
  lastAnalyzedAt,
  themesContent,
  proposalsContent,
}: WorkspaceShellProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  // Optimistic file count — updated immediately when InputsSection deletes a file.
  // Syncs back to server truth when files prop updates after router.refresh().
  const [localFileCount, setLocalFileCount] = useState(files.length);
  useEffect(() => {
    setLocalFileCount(files.length);
  }, [files.length]);

  // Max files = server count + remaining slots. After an optimistic delete the
  // localFileCount drops below maxFiles immediately, re-enabling the button.
  const maxFiles = files.length + (canAddFileResult.remaining ?? 0);
  const effectiveCanAdd = localFileCount < maxFiles;

  const addInputsButton = effectiveCanAdd ? (
    <Link
      href={`/projects/${projectId}/add`}
      className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
    >
      <Plus size={13} />
      Add inputs
    </Link>
  ) : (
    <PlanLimitTooltip
      allowed={false}
      reason={canAddFileResult.reason}
      title="Upload limit reached"
    >
      <button className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)]">
        <Plus size={13} />
        Add inputs
      </button>
    </PlanLimitTooltip>
  );

  return (
    <>
      {/* Action buttons row */}
      <div className="mb-7 flex items-center justify-end gap-2">
        {addInputsButton}
        <AnalyzeButton
          projectId={projectId}
          hasInputs={hasInputs}
          isStale={isStale}
          hasResults={hasResults}
          canRerun={canRerun}
          onAnalyzingChange={setIsAnalyzing}
        />
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Inputs section — always static */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <InputsSection
            files={files}
            projectId={projectId}
            lastAnalyzedAt={lastAnalyzedAt}
            canAddFile={canAddFileResult}
            onFileCountChange={setLocalFileCount}
          />
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Themes section */}
      <div className="py-7">
        <div className="mb-4 flex items-center gap-2">
          <Search
            size={15}
            strokeWidth={1.8}
            className={
              hasResults
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-tertiary)]"
            }
          />
          <span
            className={`text-[14px] font-semibold ${
              hasResults
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)]"
            }`}
          >
            Themes
          </span>
          {hasResults ? (
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
              {insightsCount} found
            </span>
          ) : (
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
              Unlocks after Analyze
            </span>
          )}
        </div>

        {isAnalyzing ? <PulseSkeleton /> : themesContent}
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Proposals section */}
      <div className="py-7">
        <div className="mb-4 flex items-center gap-2">
          <Star
            size={15}
            strokeWidth={1.8}
            className={
              hasResults
                ? "text-[var(--color-text-secondary)]"
                : "text-[var(--color-text-tertiary)]"
            }
          />
          <span
            className={`text-[14px] font-semibold ${
              hasResults
                ? "text-[var(--color-text-primary)]"
                : "text-[var(--color-text-tertiary)]"
            }`}
          >
            Proposals
          </span>
          {hasResults ? (
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
              {proposalsCount} generated
            </span>
          ) : (
            <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
              Unlocks after Analyze
            </span>
          )}
        </div>

        {isAnalyzing ? <PulseSkeleton /> : proposalsContent}
      </div>
    </>
  );
}
