import { Skeleton } from "@/components/ui/skeleton";

export default function MarketingLoading() {
  return (
    <div className="relative z-10 mx-auto max-w-[1100px] px-6 py-24">
      {/* Hero skeleton */}
      <div className="flex flex-col items-center gap-5 py-16 text-center">
        <Skeleton className="h-5 w-32 rounded-[var(--radius-pill)] bg-[var(--color-surface-2)]" />
        <Skeleton className="h-14 w-3/4 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
        <Skeleton className="h-14 w-1/2 rounded-[var(--radius-sm)] bg-[var(--color-surface-1)]" />
        <Skeleton className="mt-2 h-5 w-2/3 rounded-[var(--radius-sm)] bg-[var(--color-surface-2)]" />
        <Skeleton className="mt-4 h-12 w-44 rounded-[var(--radius-pill)] bg-[var(--color-surface-1)]" />
      </div>
    </div>
  );
}
