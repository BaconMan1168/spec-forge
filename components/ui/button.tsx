// components/ui/button.tsx
import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
};

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent-primary)] disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<Variant, string> = {
    primary:
      "bg-[var(--color-accent-primary)] hover:bg-[var(--color-accent-hover)] text-[var(--color-bg-0)] rounded-[var(--radius-pill)] px-6 py-4 shadow-[var(--shadow-1)] hover:shadow-[var(--shadow-2)] active:scale-[0.98]",
    secondary:
      "bg-[var(--color-surface-1)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] rounded-[var(--radius-pill)] px-6 py-4 active:scale-[0.98]",
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
