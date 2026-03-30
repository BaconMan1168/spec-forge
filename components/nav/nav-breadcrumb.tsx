"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NavBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  // Store { id, name } together so the name is only shown when it matches the
  // current projectId — avoids a synchronous setState(null) in the effect body.
  const [resolved, setResolved] = useState<{ id: string; name: string } | null>(null);

  const projectId =
    typeof params?.id === "string" ? params.id : null;
  const isProjectPage = !!projectId && pathname.includes("/projects/");

  useEffect(() => {
    if (!projectId) return;
    const supabase = createClient();
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single()
      .then(({ data }) => {
        if (data) setResolved({ id: projectId, name: data.name });
      });
  }, [projectId]);

  // Only use the resolved name when it corresponds to the current project
  const projectName = resolved?.id === projectId ? resolved.name : null;

  if (!isProjectPage) return null;

  return (
    // FIX: single shrinkable breadcrumb root so nested flex children get a real
    // width constraint; without this, the project name can expand instead of
    // overflowing, which prevents text ellipsis from appearing.
    <div className="flex min-w-0 flex-1 items-center overflow-hidden">
      <div
        data-testid="nav-divider"
        className="h-[18px] w-px flex-shrink-0 bg-[var(--color-border-subtle)]"
      />
      <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden">
        {/* Back icon — navigates to dashboard */}
        <Link
          href="/dashboard"
          className="flex h-8 w-8 flex-shrink-0 cursor-pointer items-center justify-center rounded-[var(--radius-xs)] text-[var(--color-text-secondary)] transition-colors duration-[120ms] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text-primary)]"
          aria-label="Back to dashboard"
        >
          <ChevronLeft size={16} />
        </Link>

        {/* "Dashboard" text link */}
        <Link
          href="/dashboard"
          className="flex-shrink-0 text-[14px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Dashboard
        </Link>

        {/* Separator */}
        <span className="flex-shrink-0 text-[14px] text-[var(--color-text-tertiary)]">
          /
        </span>

        {/* Project name — explicitly bounded so ellipsis can apply */}
        {projectName !== null ? (
          <span className="flex-1 min-w-0 max-w-[30%] overflow-hidden whitespace-nowrap text-ellipsis text-[14px] font-medium text-[var(--color-text-primary)]">
            {projectName}
          </span>
        ) : (
          <div
            data-testid="project-name-skeleton"
            className="h-4 w-24 animate-pulse rounded bg-[var(--color-surface-2)]"
          />
        )}
      </div>
    </div>
  );
}