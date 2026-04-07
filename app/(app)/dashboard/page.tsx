// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { canCreateProject } from "@/lib/billing/limits";
import { syncCheckoutSession } from "@/lib/billing/sync-checkout";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { ProjectTile } from "@/components/projects/project-tile";
import { BlurFade } from "@/components/ui/blur-fade";
import type { Project } from "@/lib/types/database";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string; session_id?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: projects }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  // Post-checkout sync: if Stripe redirected here with a session_id, sync
  // subscription directly from Stripe in case the webhook failed.
  let checkoutSuccess = false;
  if (params.checkout === "success" && params.session_id && user) {
    checkoutSuccess = await syncCheckoutSession(params.session_id, user.id);
  }

  const canCreate = user
    ? await canCreateProject(user.id)
    : { allowed: false, reason: "Not authenticated" };

  return (
    <div>
      {/* Post-checkout success banner */}
      {checkoutSuccess && (
        <BlurFade delay={0} duration={0.28}>
          <div className="mb-6 flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-accent-primary)]/30 bg-[var(--color-accent-muted)] px-5 py-3.5">
            <span className="text-[var(--color-accent-primary)]">✓</span>
            <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
              Your subscription is now active — welcome to Pro!
            </p>
          </div>
        </BlurFade>
      )}

      {/* Header row */}
      <div className="mb-8 flex items-center justify-between">
        <BlurFade delay={0} duration={0.28}>
          <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)]">
            Your Projects
          </h1>
        </BlurFade>
        <BlurFade delay={0.04} duration={0.28}>
          <NewProjectModal canCreate={canCreate} />
        </BlurFade>
      </div>

      {!projects || projects.length === 0 ? (
        <BlurFade delay={0.08} duration={0.28}>
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-2 text-base text-[var(--color-text-secondary)]">
              No projects yet.
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Create your first project to start analyzing feedback.
            </p>
          </div>
        </BlurFade>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {(projects as Project[]).map((project, index) => (
            <ProjectTile
              key={project.id}
              id={project.id}
              name={project.name}
              createdAt={project.created_at}
              index={index + 2}
            />
          ))}
        </div>
      )}
    </div>
  );
}
