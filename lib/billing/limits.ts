import { createClient } from "@/lib/supabase/server";

export type LimitResult = { allowed: boolean; reason: string };

const FREE_LIMITS = {
  projectsPerMonth: 2,
  filesPerProject: 5,
  exportsPerProject: 3,
} as const;

export async function getUserPlan(userId: string): Promise<"free" | "pro"> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status")
    .eq("id", userId)
    .single();
  return data?.subscription_status === "active" ? "pro" : "free";
}

export async function canCreateProject(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if ((count ?? 0) >= FREE_LIMITS.projectsPerMonth) {
    return {
      allowed: false,
      reason: `Monthly limit reached — Free plan: ${FREE_LIMITS.projectsPerMonth} projects/month`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canAddFile(userId: string, projectId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };

  const supabase = await createClient();
  const { count } = await supabase
    .from("feedback_files")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((count ?? 0) >= FREE_LIMITS.filesPerProject) {
    return {
      allowed: false,
      reason: `Free plan: ${FREE_LIMITS.filesPerProject} files per project — Upgrade to Pro for up to 20`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canExport(
  userId: string,
  projectId: string,
  proposalId: string
): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };

  const supabase = await createClient();

  // Re-exporting an already-exported proposal is always free
  const { data: existing } = await supabase
    .from("exports")
    .select("proposal_id")
    .eq("project_id", projectId)
    .eq("proposal_id", proposalId);

  if (existing && existing.length > 0) return { allowed: true, reason: "" };

  // Count distinct proposals exported from this project
  const { count } = await supabase
    .from("exports")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if ((count ?? 0) >= FREE_LIMITS.exportsPerProject) {
    return {
      allowed: false,
      reason: `Free plan: ${FREE_LIMITS.exportsPerProject} exports per project — Upgrade to Pro for unlimited`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canRerunAnalysis(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro") return { allowed: true, reason: "" };
  return {
    allowed: false,
    reason: "Re-run analysis is a Pro feature — Upgrade to Pro →",
  };
}
