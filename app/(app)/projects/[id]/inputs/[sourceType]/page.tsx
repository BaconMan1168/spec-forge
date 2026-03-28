import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { FeedbackFile } from "@/lib/types/database";

export default async function PasteInputDetailPage({
  params,
}: {
  params: Promise<{ id: string; sourceType: string }>;
}) {
  const { id, sourceType } = await params;
  const decodedSourceType = decodeURIComponent(sourceType);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("feedback_files")
    .select("*")
    .eq("project_id", id)
    .eq("source_type", decodedSourceType)
    .eq("input_method", "paste")
    .order("created_at", { ascending: true });

  if (error || !data || data.length === 0) notFound();

  const files = data as FeedbackFile[];
  const totalWords = files.reduce((s, f) => s + (f.word_count ?? 0), 0);
  const latestDate = files.reduce(
    (max, f) => (f.created_at > max ? f.created_at : max),
    files[0].created_at
  );
  const fullContent = files.map((f) => f.content).join("\n\n---\n\n");

  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6 flex items-center gap-3">
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-[13px] text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
        >
          <ChevronLeft size={14} strokeWidth={2} />
          Back to project
        </Link>
      </div>

      <h1 className="mb-1 text-[22px] font-semibold tracking-[-0.02em] text-[var(--color-text-primary)]">
        {decodedSourceType}
      </h1>
      <p className="mb-6 text-[13px] text-[var(--color-text-tertiary)]">
        {totalWords.toLocaleString()} words ·{" "}
        {new Date(latestDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </p>

      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6">
        <div
          className="h-[60vh] overflow-y-auto pr-2 text-[14px] leading-relaxed text-[var(--color-text-primary)] whitespace-pre-wrap [scrollbar-width:thin]"
          style={{
            maskImage:
              "linear-gradient(to bottom, black 85%, transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black 85%, transparent 100%)",
          }}
        >
          {fullContent}
        </div>
      </div>
    </div>
  );
}
