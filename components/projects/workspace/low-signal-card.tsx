import { Database } from "lucide-react";

interface LowSignalCardProps {
  message: string;
}

export function LowSignalCard({ message }: LowSignalCardProps) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-5 py-4">
      <Database
        size={14}
        strokeWidth={1.8}
        className="mt-0.5 shrink-0 text-[var(--color-text-disabled)]"
      />
      <p className="text-[13px] text-[var(--color-text-tertiary)]">{message}</p>
    </div>
  );
}
