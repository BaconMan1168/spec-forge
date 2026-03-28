"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import type { Proposal } from "@/lib/types/database";

interface ProposalsSectionProps {
  proposals: Proposal[];
  isStale: boolean;
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
}

function ProposalCard({ proposal, index }: ProposalCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-[var(--shadow-2)] transition-[transform,box-shadow,border-color] duration-[320ms] [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-0.5 hover:scale-[1.005] hover:border-[var(--color-border-strong)] hover:shadow-[var(--shadow-3)]">
      <button
        className="flex w-full cursor-pointer items-center gap-3 px-6 py-5 text-left"
        onClick={() => setOpen((o) => !o)}
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

      {open && (
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

          <div className="mt-5 flex gap-2 border-t border-[var(--color-border-subtle)] pt-4">
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] opacity-50"
            >
              Copy Markdown
            </button>
            <button
              disabled
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3.5 py-1.5 text-[12px] font-medium text-[var(--color-text-secondary)] opacity-50"
            >
              Download .md
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProposalsSection({ proposals, isStale }: ProposalsSectionProps) {
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
          <ProposalCard key={proposal.id} proposal={proposal} index={i} />
        ))}
      </div>
    </>
  );
}
