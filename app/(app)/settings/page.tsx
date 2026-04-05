import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PlanCardProps {
  plan: "free" | "pro" | "max";
  projectsThisMonth: number;
  stripeCustomerId: string | null;
}

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

export function PlanCard({ plan, projectsThisMonth }: PlanCardProps) {
  const isPaid = plan === "pro" || plan === "max";
  const limit = PROJECT_LIMITS[plan];

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-8">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        Current Plan
      </p>

      <div className="mb-1 flex items-center gap-3">
        <span className="text-[22px] font-bold text-[var(--color-text-primary)]">
          {PLAN_LABELS[plan]}
        </span>
        {isPaid && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-primary)]">
            Active
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

      {isPaid ? (
        <ManageSubscriptionButton />
      ) : (
        <UpgradeButton />
      )}
    </div>
  );
}

function UpgradeButton() {
  return (
    <a
      href="/pricing"
      className="block w-full rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-center text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
    >
      View Plans — from $9/mo
    </a>
  );
}

function ManageSubscriptionButton() {
  return (
    <form action="/api/billing/portal" method="POST">
      <button
        type="submit"
        className="w-full rounded-[var(--radius-pill)] border border-[var(--color-border-subtle)] bg-transparent px-8 py-[14px] text-[15px] font-semibold text-[var(--color-text-secondary)] transition-colors duration-[180ms] hover:border-[var(--color-border-strong)] hover:text-[var(--color-text-primary)]"
      >
        Manage Subscription
      </button>
    </form>
  );
}

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [{ data: profile }, { count: projectCount }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_status, subscription_plan, stripe_customer_id")
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

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="mb-8 text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
        Settings
      </h1>
      <PlanCard
        plan={plan}
        projectsThisMonth={projectsThisMonth}
        stripeCustomerId={profile?.stripe_customer_id ?? null}
      />
    </div>
  );
}
