"use client";

import { useState } from "react";
import { Search, Star } from "lucide-react";
import { AnalyzeButton } from "./analyze-button";

interface WorkspaceShellProps {
  projectId: string;
  hasInputs: boolean;
  isStale: boolean;
  hasResults: boolean;
  insightsCount: number;
  proposalsCount: number;
  addInputsButton: React.ReactNode;
  inputsSection: React.ReactNode;
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
  addInputsButton,
  inputsSection,
  themesContent,
  proposalsContent,
}: WorkspaceShellProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  return (
    <>
      {/* Action buttons row */}
      <div className="mb-7 flex items-center justify-end gap-2">
        {addInputsButton}
        <AnalyzeButton
          projectId={projectId}
          hasInputs={hasInputs}
          isStale={isStale}
          onAnalyzingChange={setIsAnalyzing}
        />
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Inputs section — always static */}
      {inputsSection}

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
