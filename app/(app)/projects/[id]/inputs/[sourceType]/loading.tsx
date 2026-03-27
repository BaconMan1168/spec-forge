import { Skeleton } from "@/components/ui/skeleton";

export default function PasteInputDetailLoading() {
  return (
    <div className="mx-auto max-w-[680px]">
      <div className="mb-6">
        <Skeleton className="h-4 w-32 bg-[var(--color-surface-1)]" />
      </div>
      <Skeleton className="mb-1 h-7 w-64 bg-[var(--color-surface-1)]" />
      <Skeleton className="mb-6 h-4 w-40 bg-[var(--color-surface-1)]" />
      <div className="rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] p-6">
        <div className="flex h-[60vh] flex-col gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <Skeleton
              key={i}
              className="h-4 bg-[var(--color-surface-1)]"
              style={{ width: `${70 + ((i * 13) % 30)}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
