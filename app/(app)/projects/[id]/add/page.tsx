import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { AddInputForm } from "@/components/projects/inputs/add-input-form";
import { canAddFile } from "@/lib/billing/limits";
import type { Project } from "@/lib/types/database";

export default async function AddInputsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: project }, { data: { user } }] = await Promise.all([
    supabase.from("projects").select("*").eq("id", id).single(),
    supabase.auth.getUser(),
  ]);

  if (!project) notFound();

  const p = project as Project;

  const canAddFileResult = user
    ? await canAddFile(user.id, id)
    : { allowed: false, reason: "Not authenticated" };

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-[13px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          {p.name}
        </Link>
      </div>

      <h1 className="mb-6 text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
        Add Feedback
      </h1>

      <AddInputForm projectId={id} canAddFile={canAddFileResult} />
    </div>
  );
}
