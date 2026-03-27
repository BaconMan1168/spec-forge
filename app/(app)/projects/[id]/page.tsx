// app/(app)/projects/[id]/page.tsx
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Project } from "@/lib/types/database";

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const p = project as Project;

  return (
    <div>
      <h1 className="text-[31px] font-semibold text-[var(--color-text-primary)] mb-8">
        {p.name}
      </h1>

      {/* Empty state — Plan 4 will replace this with the input ingestion UI */}
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-base text-[var(--color-text-secondary)] mb-2">
          No feedback yet.
        </p>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Upload files or paste text to start analyzing feedback.
        </p>
      </div>
    </div>
  );
}
