// components/nav/nav-breadcrumb.tsx
"use client";

import { useEffect, useState } from "react";
import { usePathname, useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function NavBreadcrumb() {
  const pathname = usePathname();
  const params = useParams();
  const [projectName, setProjectName] = useState<string | null>(null);

  const projectId =
    typeof params?.id === "string" ? params.id : null;
  const isProjectPage = !!projectId && pathname.includes("/projects/");

  useEffect(() => {
    if (!projectId) return;
    setProjectName(null);
    const supabase = createClient();
    supabase
      .from("projects")
      .select("name")
      .eq("id", projectId)
      .single()
      .then(({ data }) => {
        if (data) setProjectName(data.name);
      });
  }, [projectId]);

  if (!isProjectPage) return null;

  return (
    <>
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

        {/* Project name — truncates with ellipsis */}
        {projectName !== null ? (
          <span className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] font-medium text-[var(--color-text-primary)]">
            {projectName}
          </span>
        ) : (
          <div
            data-testid="project-name-skeleton"
            className="h-4 w-24 animate-pulse rounded bg-[var(--color-surface-2)]"
          />
        )}
      </div>
    </>
  );
}
