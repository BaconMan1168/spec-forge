import { Lock } from "lucide-react";

interface LockedSectionProps {
  title: string;
  description: string;
}

export function LockedSection({ title, description }: LockedSectionProps) {
  return (
    <div
      className="relative overflow-hidden rounded-[var(--radius-xl)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] px-6 py-8 text-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(-45deg, transparent, transparent 9px, hsl(220 12% 20% / 0.25) 9px, hsl(220 12% 20% / 0.25) 10px)",
      }}
    >
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[var(--color-surface-1)] text-[var(--color-text-tertiary)]">
          <Lock size={17} strokeWidth={1.7} />
        </div>
        <p className="text-sm font-medium text-[var(--color-text-secondary)]">
          {title}
        </p>
        <p className="max-w-sm text-xs leading-relaxed text-[var(--color-text-tertiary)]">
          {description}
        </p>
      </div>
    </div>
  );
}
