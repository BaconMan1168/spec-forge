"use client";

import { useState, useTransition } from "react";
import { ChevronDown, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { MagicCard } from "@/components/ui/magic-card";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
import { exportProposal } from "@/app/actions/exports";
import type { Proposal } from "@/lib/types/database";
import type { LimitResult } from "@/lib/billing/limits";

interface ProposalsSectionProps {
  proposals: Proposal[];
  isStale: boolean;
  projectId: string;
  exportLimits: Record<string, LimitResult>;
}

interface SectionProps {
  label: string;
  children: React.ReactNode;
}

function PropSection({ label, children }: SectionProps) {
  return (
    <div className="mb-4">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
        {label}
      </p>
      {children}
    </div>
  );
}

interface ProposalCardProps {
  proposal: Proposal;
  index: number;
  projectId: string;
  canExport: LimitResult;
}

function ProposalCard({ proposal, index, projectId, canExport }: ProposalCardProps) {
  const [open, setOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    startTransition(async () => {
      try {
        const markdown = await exportProposal(projectId, proposal.id);
        await navigator.clipboard.writeText(markdown);
        setExportError(null);
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed");
      }
    });
  };

  const handleDownload = () => {
    startTransition(async () => {
      try {
        const markdown = await exportProposal(projectId, proposal.id);
        const blob = new Blob([markdown], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${proposal.feature_name.toLowerCase().replace(/\s+/g, "-")}.md`;
        a.click();
        URL.revokeObjectURL(url);
        setExportError(null);
      } catch (err) {
        setExportError(err instanceof Error ? err.message : "Export failed");
      }
    });
  };

  return (
    <MagicCard
      className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-[var(--shadow-2)] transition-[box-shadow,border-color] duration-[500ms] [transition-timing-function:cubic-bezier(0.16,1,0.3,1)] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]"
      gradientColor="hsla(220,55%,55%,0.10)"
    >
      <button
        className="flex w-full cursor-pointer items-center gap-3 px-6 py-5 text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[12px] font-semibold text-[var(--color-text-tertiary)]">
          {index + 1}
        </div>
        <span className="flex-1 text-[14px] font-semibold text-[var(--color-text-primary)]">
          {proposal.feature_name}
        </span>
        <ChevronDown
          size={15}
          strokeWidth={1.8}
          className={`shrink-0 text-[var(--color-text-tertiary)] transition-transform duration-[180ms] ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-6 pb-6">
              <div className="mb-5 h-px bg-[var(--color-border-subtle)]" />

              <PropSection label="Problem Statement">
                <p className="text-[13px] leading-relaxed text-[var(--color-text-secondary)]">
                  {proposal.problem_statement}
                </p>
              </PropSection>

              {proposal.evidence.length > 0 && (
                <PropSection label="User Evidence">
                  <div className="flex flex-col gap-2">
                    {proposal.evidence.map((e, i) => (
                      <div
                        key={i}
                        className="rounded-r-[var(--radius-sm)] border-l-2 border-[var(--color-border-strong)] bg-[var(--color-bg-1)] px-3 py-2"
                      >
                        <p className="text-[12px] italic leading-relaxed text-[var(--color-text-tertiary)]">
                          &ldquo;{e.quote}&rdquo;
                        </p>
                        <p className="mt-1 text-[11px] text-[var(--color-text-disabled)]">— {e.sourceLabel}</p>
                      </div>
                    ))}
                  </div>
                </PropSection>
              )}

              {proposal.ui_changes.length > 0 && (
                <PropSection label="Suggested UI Changes">
                  <ul className="flex flex-col gap-1.5">
                    {proposal.ui_changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]">–</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </PropSection>
              )}

              {proposal.data_model_changes.length > 0 && (
                <PropSection label="Suggested Data Model Changes">
                  <ul className="flex flex-col gap-1.5">
                    {proposal.data_model_changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]">–</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </PropSection>
              )}

              {proposal.workflow_changes.length > 0 && (
                <PropSection label="Suggested Workflow Changes">
                  <ol className="flex flex-col gap-1.5">
                    {proposal.workflow_changes.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </PropSection>
              )}

              {proposal.engineering_tasks.length > 0 && (
                <PropSection label="Engineering Tasks">
                  <ol className="flex flex-col gap-1.5">
                    {proposal.engineering_tasks.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--color-text-secondary)]">
                        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] text-[10px] font-semibold text-[var(--color-text-tertiary)]">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ol>
                </PropSection>
              )}

              {exportError && (
                <p className="mb-2 text-[12px] text-[var(--color-error)]">{exportError}</p>
              )}

              <div className="mt-5 flex gap-2 border-t border-[var(--color-border-subtle)] pt-4">
                <PlanLimitTooltip allowed={canExport.allowed} reason={canExport.reason}>
                  <button
                    disabled={!canExport.allowed || isPending}
                    onClick={handleCopy}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Copy Markdown
                  </button>
                </PlanLimitTooltip>
                <PlanLimitTooltip allowed={canExport.allowed} reason={canExport.reason}>
                  <button
                    disabled={!canExport.allowed || isPending}
                    onClick={handleDownload}
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Download .md
                  </button>
                </PlanLimitTooltip>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </MagicCard>
  );
}

export function ProposalsSection({
  proposals,
  isStale,
  projectId,
  exportLimits,
}: ProposalsSectionProps) {
  return (
    <>
      {isStale && (
        <div className="mb-4 flex items-center gap-2 rounded-[var(--radius-md)] border border-[hsl(40_40%_28%)] bg-[hsl(40_40%_12%)] px-4 py-2.5">
          <Info size={13} strokeWidth={1.8} className="shrink-0 text-[hsl(40_70%_55%)]" />
          <p className="text-[12px] text-[hsl(40_70%_65%)]">
            These proposals are based on a previous analysis. Re-analyze to reflect new inputs.
          </p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {proposals.map((proposal, i) => (
          <ProposalCard
            key={proposal.id}
            proposal={proposal}
            index={i}
            projectId={projectId}
            canExport={exportLimits[proposal.id] ?? { allowed: true, reason: "" }}
          />
        ))}
      </div>
    </>
  );
}
