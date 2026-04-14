import { Skeleton } from "@/components/ui/skeleton";

export default function PricingLoading() {
  return (
    <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-24">
      {/* Section header */}
      <div className="mb-14 flex flex-col items-center gap-4 text-center">
        <Skeleton className="h-10 w-64 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
        <Skeleton className="h-5 w-80 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]" />
      </div>

      {/* 3 pricing card skeletons */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-8"
          >
            <Skeleton className="h-5 w-16 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]" />
            <Skeleton className="h-10 w-24 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
            <div className="flex flex-col gap-2.5 pt-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton
                  key={j}
                  className="h-4 rounded-[var(--radius-xs)] bg-[var(--color-surface-2)]"
                  style={{ width: `${70 + j * 5}%` }}
                />
              ))}
            </div>
            <Skeleton className="mt-4 h-12 w-full rounded-[var(--radius-pill)] bg-[var(--color-surface-1)]" />
          </div>
        ))}
      </div>
    </div>
  );
}
