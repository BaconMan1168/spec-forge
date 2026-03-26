// components/ui/card.tsx
import { type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] bg-[var(--color-surface-0)] p-6 shadow-[var(--shadow-2)] border border-[var(--color-border-subtle)] ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
