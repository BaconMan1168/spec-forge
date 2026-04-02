import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

interface PlanCardProps {
  plan: "free" | "pro";
  projectsThisMonth: number;
  stripeCustomerId: string | null;
}

export function PlanCard({ plan, projectsThisMonth }: PlanCardProps) {
  const isPro = plan === "pro";

  return (
    <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-8">
      <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
        Current Plan
      </p>

      <div className="mb-1 flex items-center gap-3">
        <span className="text-[22px] font-bold text-[var(--color-text-primary)]">
          {isPro ? "Pro" : "Free"}
        </span>
        {isPro && (
          <span className="rounded-[var(--radius-pill)] bg-[var(--color-accent-muted)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-accent-primary)]">
            Active
          </span>
        )}
      </div>

      <p className="mb-6 text-[13px] text-[var(--color-text-tertiary)]">
        {isPro
          ? "Unlimited projects · 20 files/project · Priority AI"
          : "2 projects/mo · 5 files/project · 3 exports/project"}
      </p>

      <div className="mb-6 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-1)] p-5">
        <p className="mb-3 text-[12px] text-[var(--color-text-tertiary)]">This month</p>
        <div className="flex gap-6">
          <div>
            <p className="text-[18px] font-semibold text-[var(--color-text-primary)]">
              {isPro ? projectsThisMonth : `${projectsThisMonth} / 2`}
            </p>
            <p className="text-[11px] text-[var(--color-text-tertiary)]">projects</p>
          </div>
        </div>
      </div>

      {isPro ? (
        <ManageSubscriptionButton />
      ) : (
        <UpgradeButton />
      )}
    </div>
  );
}

function UpgradeButton() {
  return (
    <form action="/api/billing/checkout" method="POST">
      <button
        type="submit"
        className="w-full rounded-[var(--radius-pill)] bg-[var(--color-accent-primary)] px-8 py-[14px] text-[15px] font-semibold text-[var(--color-bg-0)] transition-[background-color,box-shadow] duration-[180ms] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_6px_20px_hsla(40,85%,58%,0.35)]"
      >
        Upgrade to Pro — $29/mo
      </button>
    </form>
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
      .select("subscription_status, stripe_customer_id")
      .eq("id", user.id)
      .single(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gte("created_at", startOfMonth.toISOString()),
  ]);

  const plan = profile?.subscription_status === "active" ? "pro" : "free";
  const projectsThisMonth = projectCount ?? 0;

  return (
    <div className="mx-auto max-w-[480px]">
      <h1 className="mb-8 text-[28px] font-semibold tracking-[-0.03em] text-[var(--color-text-primary)]">
        Settings
      </h1>
      <PlanCard
        plan={plan}
        projectsThisMonth={projectsThisMonth}
      />
    </div>
  );
}
