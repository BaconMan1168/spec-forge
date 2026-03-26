// app/(app)/dashboard/page.tsx
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { NewProjectModal } from "@/components/projects/new-project-modal";
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
        <NewProjectModal />
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
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="hover:border-[var(--color-accent-primary)] transition-colors cursor-pointer">
                <p className="font-medium text-[var(--color-text-primary)]">
                  {project.name}
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
