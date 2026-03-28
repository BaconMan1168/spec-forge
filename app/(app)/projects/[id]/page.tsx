import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { FileText, Search, Star, Plus } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { InputsSection } from "@/components/projects/workspace/inputs-section";
import { LockedSection } from "@/components/projects/workspace/locked-section";
import { AnalyzeButton } from "@/components/projects/workspace/analyze-button";
import { ThemesSection } from "@/components/projects/workspace/themes-section";
import { ProposalsSection } from "@/components/projects/workspace/proposals-section";
import { getFeedbackFiles } from "@/app/actions/feedback-files";
import { getInsights, getProposals, getLastAnalysisRun } from "@/app/actions/analysis";
import type { Project } from "@/lib/types/database";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const p = project as Project;

  const [feedbackFiles, insights, proposals, lastRun] = await Promise.all([
    getFeedbackFiles(id),
    getInsights(id),
    getProposals(id),
    getLastAnalysisRun(id),
  ]);

  const hasInputs = feedbackFiles.length > 0;
  const lastAnalyzedAt = lastRun?.created_at ?? null;
  const isStale = lastAnalyzedAt
    ? feedbackFiles.some((f) => f.created_at > lastAnalyzedAt)
    : false;
  const hasResults = insights.length > 0 || proposals.length > 0;

  return (
    <div className="mx-auto max-w-[820px]">
      {/* Page header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-3">
          <h1 className="text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
            {p.name}
          </h1>
          <div className="flex items-center gap-4">
            {[
              { label: "Inputs", value: feedbackFiles.length },
              {
                label: "Themes",
                value: insights.length > 0 ? insights.length : "—",
                accent: insights.length > 0,
              },
              {
                label: "Proposals",
                value: proposals.length > 0 ? proposals.length : "—",
                accent: proposals.length > 0,
              },
            ].map(({ label, value, accent }, i, arr) => (
              <div key={label} className="flex items-center gap-4">
                <div className="flex flex-col gap-0.5">
                  <span
                    className={`text-[17px] font-semibold ${
                      accent
                        ? "text-[var(--color-accent-primary)]"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {value}
                  </span>
                  <span className="text-[11px] uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                    {label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className="h-8 w-px bg-[var(--color-border-subtle)]" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pt-1">
          <Link
            href={`/projects/${id}/add`}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] px-3 py-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text-primary)]"
          >
            <Plus size={13} />
            Add inputs
          </Link>
          <AnalyzeButton
            projectId={id}
            hasInputs={hasInputs}
            isStale={isStale}
          />
        </div>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Inputs section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText
                size={15}
                strokeWidth={1.8}
                className="text-[var(--color-text-secondary)]"
              />
              <span className="text-[14px] font-semibold text-[var(--color-text-primary)]">
                Inputs
              </span>
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[11px] font-medium text-[var(--color-text-secondary)]">
                {feedbackFiles.length} files
              </span>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={80}>
          <InputsSection
            files={feedbackFiles}
            projectId={id}
            lastAnalyzedAt={lastAnalyzedAt}
          />
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Themes section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
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
                {insights.length} found
              </span>
            ) : (
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                Unlocks after Analyze
              </span>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          {insights.length > 0 ? (
            <ThemesSection insights={insights} isStale={isStale} />
          ) : (
            <LockedSection
              title="Themes unlock after analysis"
              description="Run Analyze to surface recurring themes and supporting quotes from your inputs."
            />
          )}
        </ScrollReveal>
      </div>

      <div className="h-px bg-[var(--color-border-subtle)]" />

      {/* Proposals section */}
      <div className="py-7">
        <ScrollReveal delay={0}>
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
                {proposals.length} generated
              </span>
            ) : (
              <span className="rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-tertiary)]">
                Unlocks after Analyze
              </span>
            )}
          </div>
        </ScrollReveal>

        <ScrollReveal delay={100}>
          {proposals.length > 0 ? (
            <ProposalsSection proposals={proposals} isStale={isStale} />
          ) : (
            <LockedSection
              title="Proposals unlock after analysis"
              description="Feature proposals are generated automatically from surfaced themes and evidence."
            />
          )}
        </ScrollReveal>
      </div>
    </div>
  );
}
