import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/get-user";
import { SubscriptionActions } from "@/components/billing/subscription-actions";

const PLAN_LABELS: Record<"free" | "pro" | "max", string> = {
  free: "Free",
  pro: "Pro",
  max: "Max",
};

const PLAN_DESCRIPTIONS: Record<"free" | "pro" | "max", string> = {
  free: "2 projects/mo · 5 files/project · 3 exports/project",
  pro: "20 projects/mo · 10 files/project · Unlimited exports",
  max: "Unlimited projects · 20 files/project · Priority AI",
};

const PROJECT_LIMITS: Record<"free" | "pro" | "max", number | null> = {
  free: 2,
  pro: 20,
  max: null,
};

export default async function SettingsPage() {
  const supabase = await createClient();
  const user = await getCurrentUser();

  if (!user) redirect("/login");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: profile }, { count: projectCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "subscription_status, subscription_plan, stripe_customer_id, subscription_cancel_at, subscription_pending_plan, subscription_period_end"
      )
      .eq("id", user.id)
      .single(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const plan: "free" | "pro" | "max" =
    profile?.subscription_status !== "active"
      ? "free"
      : profile?.subscription_plan === "max"
        ? "max"
        : "pro";

  const projectsThisMonth = projectCount ?? 0;
  const limit = PROJECT_LIMITS[plan];
  const cancelAt: string | null = profile?.subscription_cancel_at ?? null;
  const pendingDowngradePlan: "pro" | null =
    profile?.subscription_pending_plan === "pro" ? "pro" : null;
  const periodEnd: string | null = profile?.subscription_period_end ?? null;
  const isPaid = plan === "pro" || plan === "max";
  const isDowngrading = pendingDowngradePlan !== null && !cancelAt;

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="mb-8 text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
        Settings
      </h1>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-8">
        <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
          Current Plan
        </p>

        <div className="mb-1 flex items-center gap-3">
          <span className="text-[22px] font-bold text-[var(--color-text-primary)]">
            {PLAN_LABELS[plan]}
          </span>
          {isPaid && !cancelAt && !isDowngrading && (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-primary)]">
              Active
            </span>
          )}
          {isPaid && cancelAt && (
            <span className="rounded-[var(--radius-pill)] bg-[var(--color-error,#f87171)]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-error,#f87171)]">
              Canceling
            </span>
          )}
          {isDowngrading && (
            <span className="rounded-[var(--radius-pill)] bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-400">
              Downgrading
            </span>
          )}
        </div>

        <p className="mb-6 text-[13px] text-[var(--color-text-tertiary)]">
          {PLAN_DESCRIPTIONS[plan]}
        </p>

        <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-5">
          <p className="mb-3 text-[12px] text-[var(--color-text-tertiary)]">This month</p>
          <div className="flex gap-6">
            <div>
              <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">
                {limit === null ? projectsThisMonth : `${projectsThisMonth} / ${limit}`}
              </p>
              <p className="text-[11px] text-[var(--color-text-tertiary)]">projects</p>
            </div>
          </div>
        </div>

        <SubscriptionActions
          plan={plan}
          cancelAt={cancelAt}
          pendingDowngradePlan={pendingDowngradePlan}
          periodEnd={periodEnd}
        />
      </div>
    </div>
  );
}
