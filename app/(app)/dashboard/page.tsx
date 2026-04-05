// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { canCreateProject } from "@/lib/billing/limits";
import { NewProjectModal } from "@/components/projects/new-project-modal";
import { ProjectTile } from "@/components/projects/project-tile";
import { BlurFade } from "@/components/ui/blur-fade";
import type { Project } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [{ data: projects }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.auth.getUser(),
  ]);

  const canCreate = user
    ? await canCreateProject(user.id)
    : { allowed: false, reason: "Not authenticated" };

  return (
    <div>
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
              index={index + 2} // +2 so first tile = delay 0.08s (heading=0, button=0.04, tile[0]=0.08, ...)
            />
          ))}
        </div>
      )}
    </div>
  );
}
