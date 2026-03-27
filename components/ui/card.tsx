// components/ui/card.tsx
import { type HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className = "", children, ...props }: CardProps) {
  return (
    <div
      className={[
        "rounded-[var(--radius-lg)]",
        "bg-[var(--color-surface-0)]",
        "backdrop-blur-[20px]",
        "border border-[var(--color-border-subtle)]",
        "shadow-[var(--shadow-2)]",
        "p-6",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </div>
  );
}
