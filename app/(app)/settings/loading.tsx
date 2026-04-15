import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-[480px]">
      <Skeleton className="mb-8 h-9 w-36 rounded-[var(--radius-md)]" />
      <Skeleton className="h-[280px] w-full rounded-[var(--radius-xl)]" />
    </div>
  );
}
