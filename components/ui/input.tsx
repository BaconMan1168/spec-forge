// components/ui/input.tsx
import { type InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ label, error, id, className = "", ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className="text-sm font-medium text-[var(--color-text-secondary)]"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={`rounded-[var(--radius-sm)] border bg-[var(--color-surface-0)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-disabled)] focus:outline-none focus:border-[var(--color-accent-primary)] transition-colors ${
          error
            ? "border-[var(--color-error)]"
            : "border-[var(--color-border-subtle)]"
        } ${className}`}
        {...props}
      />
      {error && (
        <p className="text-xs text-[var(--color-error)]">{error}</p>
      )}
    </div>
  );
}
