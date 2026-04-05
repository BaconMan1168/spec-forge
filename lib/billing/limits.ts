import { createClient } from "@/lib/supabase/server";

export type LimitResult = { allowed: boolean; reason: string };

const FREE_LIMITS = {
  projectsPerMonth: 2,
  filesPerProject: 5,
  exportsPerProject: 3,
} as const;

const PRO_LIMITS = {
  projectsPerMonth: 20,
  filesPerProject: 10,
} as const;

const MAX_LIMITS = {
  filesPerProject: 20,
} as const;

export async function getUserPlan(userId: string): Promise<"free" | "pro" | "max"> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_plan")
    .eq("id", userId)
    .single();
  if (data?.subscription_status !== "active") return "free";
  return data?.subscription_plan === "max" ? "max" : "pro";
}

export async function canCreateProject(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "max") return { allowed: true, reason: "" };

  const supabase = await createClient();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", startOfMonth.toISOString());

  if (plan === "pro") {
    if ((count ?? 0) >= PRO_LIMITS.projectsPerMonth) {
      return {
        allowed: false,
        reason: `Monthly limit reached — Pro plan: ${PRO_LIMITS.projectsPerMonth} projects/month`,
      };
    }
    return { allowed: true, reason: "" };
  }

  // free
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

  const supabase = await createClient();
  const { count } = await supabase
    .from("feedback_files")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId);

  if (plan === "max") {
    if ((count ?? 0) >= MAX_LIMITS.filesPerProject) {
      return {
        allowed: false,
        reason: `Max plan: ${MAX_LIMITS.filesPerProject} files per project`,
      };
    }
    return { allowed: true, reason: "" };
  }

  if (plan === "pro") {
    if ((count ?? 0) >= PRO_LIMITS.filesPerProject) {
      return {
        allowed: false,
        reason: `Pro plan: ${PRO_LIMITS.filesPerProject} files per project — Upgrade to Max for up to 20`,
      };
    }
    return { allowed: true, reason: "" };
  }

  // free
  if ((count ?? 0) >= FREE_LIMITS.filesPerProject) {
    return {
      allowed: false,
      reason: `Free plan: ${FREE_LIMITS.filesPerProject} files per project — Upgrade to Pro for up to 10`,
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
  if (plan === "pro" || plan === "max") return { allowed: true, reason: "" };

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
      reason: `Free plan: ${FREE_LIMITS.exportsPerProject} exports per project — Upgrade to Pro →`,
    };
  }
  return { allowed: true, reason: "" };
}

export async function canRerunAnalysis(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "pro" || plan === "max") return { allowed: true, reason: "" };
  return {
    allowed: false,
    reason: "Re-run analysis is a Pro feature — Upgrade to Pro →",
  };
}
