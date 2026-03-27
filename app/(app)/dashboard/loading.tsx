// app/(app)/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div>
      {/* Header row — mirrors dashboard/page.tsx */}
      <div className="mb-8 flex items-center justify-between">
        <Skeleton className="h-9 w-44 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
        <Skeleton className="h-[52px] w-36 rounded-[var(--radius-pill)] bg-[var(--color-surface-1)]" />
      </div>

      {/* 2-column grid of card skeletons */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)]"
          >
            {/* Icon block */}
            <Skeleton className="h-[26px] w-[26px] rounded-[var(--radius-xs)] bg-[var(--color-surface-2)]" />
            {/* Project name line */}
            <Skeleton className="h-6 w-3/4 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
            {/* Date line */}
            <Skeleton className="h-4 w-1/3 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
