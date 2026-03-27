// app/(app)/projects/[id]/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectLoading() {
  return (
    <div>
      {/* Page heading */}
      <Skeleton className="mb-8 h-9 w-56 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />

      {/* Empty-state placeholder */}
      <div className="flex flex-col items-center justify-center gap-3 py-24">
        <Skeleton className="h-4 w-48 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
        <Skeleton className="h-3 w-64 rounded-[var(--radius-xs)] bg-[var(--color-surface-1)]" />
      </div>
    </div>
  );
}
