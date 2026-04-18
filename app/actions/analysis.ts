"use server";

import { createClient } from "@/lib/supabase/server";
import type { Theme } from "@/lib/schemas/synthesis";
import type { ProposalOutput } from "@/lib/schemas/proposal";
import type { Insight, Proposal } from "@/lib/types/database";

interface AnalysisRun {
  id: string;
  user_id: string;
  project_id: string;
  input_count: number;
  created_at: string;
}

export async function persistAnalysisResults({
  projectId,
  userId,
  themes,
  proposals,
  inputCount,
}: {
  projectId: string;
  userId: string;
  themes: Theme[];
  proposals: ProposalOutput[];
  inputCount: number;
}): Promise<void> {
  const supabase = await createClient();

  // Overwrite: delete existing insights and proposals (parallel)
  await Promise.all([
    supabase.from("insights").delete().eq("project_id", projectId),
    supabase.from("proposals").delete().eq("project_id", projectId),
  ]);

  // Insert new insights
  if (themes.length > 0) {
    await supabase.from("insights").insert(
      themes.map((t) => ({
        project_id: projectId,
        theme_name: t.themeName,
        frequency: t.frequency,
        quotes: t.quotes,
      }))
    );
  }

  // Insert new proposals
  if (proposals.length > 0) {
    await supabase.from("proposals").insert(
      proposals.map((p) => ({
        project_id: projectId,
        feature_name: p.featureName,
        problem_statement: p.problemStatement,
        evidence: p.userEvidence,
        ui_changes: p.suggestedUiChanges,
        data_model_changes: p.suggestedDataModelChanges,
        workflow_changes: p.suggestedWorkflowChanges,
        engineering_tasks: p.engineeringTasks,
      }))
    );
  }

  // Record analysis run for rate limiting and staleness
  await supabase.from("analysis_runs").insert({
    user_id: userId,
    project_id: projectId,
    input_count: inputCount,
  });
}

export async function getInsights(projectId: string): Promise<Insight[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("insights")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Insight[];
}

export async function getProposals(projectId: string): Promise<Proposal[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("proposals")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Proposal[];
}

export async function getLastAnalysisRun(
  projectId: string
): Promise<AnalysisRun | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analysis_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return (data as AnalysisRun) ?? null;
}

export async function countRecentRunsByUser(
  userId: string,
  windowMs: number = 60 * 60 * 1000
): Promise<number> {
  const supabase = await createClient();
  const since = new Date(Date.now() - windowMs).toISOString();
  const { count, error } = await supabase
    .from("analysis_runs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", since);
  if (error) return 0;
  return count ?? 0;
}
