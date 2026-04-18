import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { InputsSection } from "@/components/projects/workspace/inputs-section";
import { LockedSection } from "@/components/projects/workspace/locked-section";
import { WorkspaceShell } from "@/components/projects/workspace/workspace-shell";
import { ThemesSection } from "@/components/projects/workspace/themes-section";
import { ProposalsSection } from "@/components/projects/workspace/proposals-section";
import { getFeedbackFiles } from "@/app/actions/feedback-files";
import { getInsights, getProposals, getLastAnalysisRun } from "@/app/actions/analysis";
import { canAddFile, canRerunAnalysis, canExport } from "@/lib/billing/limits";
import { PlanLimitTooltip } from "@/components/billing/plan-limit-tooltip";
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

  const user = await getCurrentUser();

  const canRerun = user
    ? await canRerunAnalysis(user.id)
    : { allowed: false, reason: "Not authenticated" };

  const canAddFileResult = user
    ? await canAddFile(user.id, id)
    : { allowed: false, reason: "Not authenticated" };

  const exportLimits: Record<string, { allowed: boolean; reason: string }> = {};
  if (user && proposals && proposals.length > 0) {
    await Promise.all(
      proposals.map(async (proposal) => {
        exportLimits[proposal.id] = await canExport(user.id, id, proposal.id);
      })
    );
  }

  const hasInputs = feedbackFiles.length > 0;
  const lastAnalyzedAt = lastRun?.created_at ?? null;
  const isStale = lastAnalyzedAt
    ? feedbackFiles.some((f) => f.created_at > lastAnalyzedAt)
    : false;
  const hasResults = insights.length > 0 || proposals.length > 0;

  return (
    <div className="mx-auto max-w-[820px]">
      {/* Page title + stats — static server JSX */}
      <div className="mb-7">
        <h1 className="mb-3 text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
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

      {/*
        WorkspaceShell is a client component that:
        1. Renders the action buttons row (Add inputs + Analyze)
        2. Renders the inputs section (static, always visible)
        3. Renders Themes and Proposals sections, swapping their content
           with pulse skeletons while analysis is in progress
      */}
      <WorkspaceShell
        projectId={id}
        hasInputs={hasInputs}
        isStale={isStale}
        hasResults={hasResults}
        insightsCount={insights.length}
        proposalsCount={proposals.length}
        canRerun={canRerun}
        addInputsButton={
          canAddFileResult.allowed ? (
            <Link
              href={`/projects/${id}/add`}
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
          )
        }
        inputsSection={
          <div className="py-7">
            <ScrollReveal delay={0}>
              <InputsSection
                files={feedbackFiles}
                projectId={id}
                lastAnalyzedAt={lastAnalyzedAt}
                canAddFile={canAddFileResult}
              />
            </ScrollReveal>
          </div>
        }
        themesContent={
          insights.length > 0 ? (
            <ThemesSection insights={insights} isStale={isStale} />
          ) : (
            <LockedSection
              title="Themes unlock after analysis"
              description="Run Analyze to surface recurring themes and supporting quotes from your inputs."
            />
          )
        }
        proposalsContent={
          proposals.length > 0 ? (
            <ProposalsSection proposals={proposals} isStale={isStale} projectId={id} exportLimits={exportLimits} />
          ) : (
            <LockedSection
              title="Proposals unlock after analysis"
              description="Feature proposals are generated automatically from surfaced themes and evidence."
            />
          )
        }
      />
    </div>
  );
}
