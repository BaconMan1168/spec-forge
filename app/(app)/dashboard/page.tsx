// app/(app)/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Project } from "@/lib/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("projects")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)]">
          Your Projects
        </h1>
        {/* TODO: Plan 3 — wire up project creation */}
        <Button>New Project</Button>
      </div>

      {!projects || projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="text-base text-[var(--color-text-secondary)] mb-2">
            No projects yet.
          </p>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Create your first project to start analyzing feedback.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {(projects as Project[]).map((project) => (
            <Card key={project.id}>
              <p className="font-medium text-[var(--color-text-primary)]">
                {project.name}
              </p>
              <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                {new Date(project.created_at).toLocaleDateString()}
              </p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
