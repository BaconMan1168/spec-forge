import { createClient } from "@/lib/supabase/server";

export type LimitResult = { allowed: boolean; reason: string; remaining?: number };

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

/**
 * Returns the start of the current billing period for the user.
 * - Paid users: use subscription_period_start from their profile.
 * - Free users: use the start of the current calendar month.
 */
async function getBillingPeriodStart(userId: string): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("subscription_status, subscription_period_start")
    .eq("id", userId)
    .single();

  if (data?.subscription_status === "active" && data?.subscription_period_start) {
    return data.subscription_period_start as string;
  }

  // Free users: start of current calendar month
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

/**
 * Counts the number of distinct projects the user has run analysis on in the
 * current billing period.
 *
 * Deleted projects are still counted: when a project is deleted, its
 * analysis_runs rows have project_id set to NULL (SET NULL constraint) but the
 * rows themselves remain. Each NULL row represents one previously-analyzed
 * project slot that must continue to count toward the monthly limit, preventing
 * users from bypassing the limit by deleting and recreating projects.
 *
 * Counting:
 * - Non-null project_ids: deduplicated (re-runs on the same live project use 1 slot)
 * - Null project_ids (deleted projects): each distinct row = 1 slot
 *   (free users can only run once per project so there is at most 1 null row
 *   per deleted project; the slight over-count for paid re-runs is acceptable)
 */
async function countAnalyzedProjectsThisPeriod(
  userId: string,
  periodStart: string
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("analysis_runs")
    .select("id, project_id")
    .eq("user_id", userId)
    .gte("created_at", periodStart);

  if (!data) return 0;

  const liveProjectIds = new Set<string>();
  let deletedCount = 0;

  for (const row of data) {
    if (row.project_id === null) {
      deletedCount++;
    } else {
      liveProjectIds.add(row.project_id as string);
    }
  }

  return liveProjectIds.size + deletedCount;
}

/**
 * Checks whether a user can run analysis on a specific project.
 *
 * Rules:
 * - Max plan: always allowed.
 * - If the user has already analyzed this project in the current billing
 *   period, re-running is allowed without consuming an additional slot.
 * - Otherwise, checks if the user has remaining analysis slots for the period.
 */
export async function canAnalyzeProject(
  userId: string,
  projectId: string
): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "max") return { allowed: true, reason: "" };

  const periodStart = await getBillingPeriodStart(userId);

  const supabase = await createClient();

  // Check if this specific project has already been analyzed in this period
  const { count: existingRunCount } = await supabase
    .from("analysis_runs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("project_id", projectId)
    .gte("created_at", periodStart);

  if ((existingRunCount ?? 0) > 0) {
    // Re-run on same project: only allowed on paid plans
    if (plan === "free") {
      return {
        allowed: false,
        reason: "Re-run analysis is a Pro feature — Upgrade to Pro",
      };
    }
    return { allowed: true, reason: "" };
  }

  // First analysis on this project: check the slot limit
  const analyzedCount = await countAnalyzedProjectsThisPeriod(userId, periodStart);
  const limit = plan === "pro" ? PRO_LIMITS.projectsPerMonth : FREE_LIMITS.projectsPerMonth;

  if (analyzedCount >= limit) {
    return {
      allowed: false,
      reason:
        plan === "pro"
          ? `Monthly limit reached — Pro plan: ${limit} projects/month`
          : `Monthly limit reached — Free plan: ${limit} projects/month. Upgrade to Pro →`,
    };
  }

  return { allowed: true, reason: "" };
}

/**
 * Checks whether a user can create a new project.
 *
 * The limit is based on:
 *   (distinct analyzed projects this billing period)
 *   + (live projects with no analysis run this period)
 *
 * This prevents bypassing the limit by deleting and recreating analyzed projects,
 * while still allowing unlimited creation of projects that haven't been analyzed.
 */
export async function canCreateProject(userId: string): Promise<LimitResult> {
  const plan = await getUserPlan(userId);
  if (plan === "max") return { allowed: true, reason: "" };

  const periodStart = await getBillingPeriodStart(userId);
  const limit = plan === "pro" ? PRO_LIMITS.projectsPerMonth : FREE_LIMITS.projectsPerMonth;

  const analyzedCount = await countAnalyzedProjectsThisPeriod(userId, periodStart);

  // Already at or over limit from analyzed projects alone
  if (analyzedCount >= limit) {
    return {
      allowed: false,
      reason:
        plan === "pro"
          ? `Monthly limit reached — Pro plan: ${limit} projects/month`
          : `Monthly limit reached — Free plan: ${limit} projects/month`,
    };
  }

  // Count currently live projects that have NOT been analyzed this period.
  // These also count toward the slot total to prevent unlimited creation spam.
  const supabase = await createClient();

  // Get project IDs that have been analyzed this period
  const { data: analyzedRows } = await supabase
    .from("analysis_runs")
    .select("project_id")
    .eq("user_id", userId)
    .gte("created_at", periodStart);

  const analyzedProjectIds = new Set((analyzedRows ?? []).map((r) => r.project_id));

  // Get all live project IDs for this user
  const { data: liveProjects } = await supabase
    .from("projects")
    .select("id")
    .eq("user_id", userId);

  const unanalyzedLiveCount = (liveProjects ?? []).filter(
    (p) => !analyzedProjectIds.has(p.id)
  ).length;

  const total = analyzedCount + unanalyzedLiveCount;

  if (total >= limit) {
    return {
      allowed: false,
      reason:
        plan === "pro"
          ? `Monthly limit reached — Pro plan: ${limit} projects/month`
          : `Monthly limit reached — Free plan: ${limit} projects/month`,
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

  const current = count ?? 0;

  if (plan === "max") {
    if (current >= MAX_LIMITS.filesPerProject) {
      return {
        allowed: false,
        reason: `Max plan: ${MAX_LIMITS.filesPerProject} files per project`,
        remaining: 0,
      };
    }
    return { allowed: true, reason: "", remaining: MAX_LIMITS.filesPerProject - current };
  }

  if (plan === "pro") {
    if (current >= PRO_LIMITS.filesPerProject) {
      return {
        allowed: false,
        reason: `Pro plan: ${PRO_LIMITS.filesPerProject} files per project — Upgrade to Max for up to 20`,
        remaining: 0,
      };
    }
    return { allowed: true, reason: "", remaining: PRO_LIMITS.filesPerProject - current };
  }

  // free
  if (current >= FREE_LIMITS.filesPerProject) {
    return {
      allowed: false,
      reason: `Free plan: ${FREE_LIMITS.filesPerProject} files per project — Upgrade to Pro for up to 10`,
      remaining: 0,
    };
  }
  return { allowed: true, reason: "", remaining: FREE_LIMITS.filesPerProject - current };
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
